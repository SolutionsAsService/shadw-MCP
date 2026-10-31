import { z } from "zod";
import { buildDeployBody, ShadwError, TERMINAL_BUILD_STATES } from "./client.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ok = (value) => ({
  content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }],
});
const fail = (e) => ({
  isError: true,
  content: [
    {
      type: "text",
      text:
        e instanceof ShadwError && (e.status === 401 || e.status === 403)
          ? `${e.message}\nCheck SHADW_API_KEY (dashboard → Settings → API Keys) and its role; SHADW_TEAM scopes a multi-team key.`
          : e.message,
    },
  ],
});

const enc = encodeURIComponent;
const asList = (v) => (Array.isArray(v) ? v : (v?.events ?? v?.items ?? v?.data ?? v?.deployments ?? []));

/** Keep the tail of a build's log so a tool result stays small. */
export function summarizeBuild(b, tail = 40) {
  const lines = Array.isArray(b?.lines) ? b.lines.map((l) => (typeof l === "string" ? l : (l?.line ?? ""))) : [];
  const { lines: _drop, ...rest } = b ?? {};
  return { ...rest, log_lines: lines.length, log_tail: lines.slice(-tail) };
}

/** Poll GET /v1/builds/:id until ready | error | cancelled, or until timeoutMs. */
export async function waitForBuild(client, id, { timeoutMs = 600000, intervalMs = 2000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const b = await client.get(`/v1/builds/${enc(id)}`);
    if (TERMINAL_BUILD_STATES.has(b?.state) || Date.now() >= deadline) {
      return { build: b, timed_out: !TERMINAL_BUILD_STATES.has(b?.state) };
    }
    await sleep(intervalMs);
  }
}

/** Probe a URL: status code and latency, never throws. */
export async function probe(url, fetchImpl = globalThis.fetch, timeoutMs = 10000) {
  const started = Date.now();
  try {
    const r = await fetchImpl(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(timeoutMs) });
    return { url, status: r.status, ok: r.status < 500, latency_ms: Date.now() - started };
  } catch (e) {
    return { url, status: 0, ok: false, latency_ms: Date.now() - started, error: e.message };
  }
}

const get = (o, path) => path.split(".").reduce((v, k) => (v == null ? undefined : v[k]), o);

/**
 * One verdict for a project: its last build, its production URL answering, and its 5xx rate
 * over the last hour. `down` if the live URL fails or nothing is deployed; `degraded` if the
 * last build failed or 5xx responses were logged; else `healthy`.
 */
export async function projectHealth(client, project, { fetchImpl = globalThis.fetch, range = "1h" } = {}) {
  const reasons = [];
  const projects = asList(await client.get("/v1/gitops/projects"));
  const row = projects.find((p) => p?.project === project);
  if (!row) throw new ShadwError(`project "${project}" not found for this key's team`, 404, null);

  const lastBuild = get(row, "settings.last_build") ?? null;
  const alias = get(row, "production.alias") ?? null;
  if (lastBuild?.state && lastBuild.state !== "ready" && TERMINAL_BUILD_STATES.has(lastBuild.state)) {
    reasons.push(`last build ${lastBuild.id ?? ""} ended ${lastBuild.state}`.replace("  ", " "));
  }

  let live = null;
  if (alias) {
    const url = /^https?:\/\//.test(alias) ? alias : `https://${alias}`;
    live = await probe(url, fetchImpl);
    if (!live.ok) reasons.push(`production URL ${url} answered ${live.status || live.error}`);
  } else {
    reasons.push("no production deployment");
  }

  let errors5xx = null;
  try {
    const q = `/v1/logs?project=${enc(project)}&range=${enc(range)}&status=5xx&limit=200`;
    errors5xx = asList(await client.get(q)).length;
    if (errors5xx > 0) reasons.push(`${errors5xx} 5xx responses logged in the last ${range}`);
  } catch (e) {
    reasons.push(`logs unavailable: ${e.message}`);
  }

  const down = !alias || (live && !live.ok);
  const status = down ? "down" : reasons.length ? "degraded" : "healthy";
  return {
    project,
    status,
    reasons,
    production: row.production ?? null,
    last_build: lastBuild,
    git: row.git ?? null,
    live,
    errors_5xx: errors5xx,
    window: range,
  };
}

const wrap = (fn) => async (args) => {
  try {
    return ok(await fn(args ?? {}));
  } catch (e) {
    return fail(e);
  }
};

const RO = { readOnlyHint: true, openWorldHint: true };
const WRITE = { readOnlyHint: false, destructiveHint: false, openWorldHint: true };

/** Register every Shadw tool on an McpServer. */
export function registerTools(server, client, { fetchImpl = globalThis.fetch } = {}) {
  server.registerTool(
    "shadw_whoami",
    {
      title: "Check the Shadw API key",
      description: "Verify the configured API key: who it authenticates as, its team (tenant) and role.",
      inputSchema: {},
      annotations: RO,
    },
    wrap(async () => ({ api: client.config.api, team_header: client.config.team, ...(await client.get("/v1/whoami")) })),
  );

  server.registerTool(
    "shadw_create_api_key",
    {
      title: "Create a Shadw API key",
      description:
        "Mint a new API key for an agent. The plaintext token is returned ONCE; store it as SHADW_API_KEY. " +
        "Prefer the lowest role that works: viewer (read), member (deploy), admin, owner. The Shadw server refuses a role above the creating key's.",
      inputSchema: {
        name: z.string().min(1).describe("Label shown in the dashboard, e.g. 'agent-ci'"),
        role: z.enum(["viewer", "member", "admin", "owner"]).default("member"),
      },
      annotations: WRITE,
    },
    wrap(({ name, role }) => client.post("/v1/apikeys", { name, role })),
  );

  server.registerTool(
    "shadw_list_api_keys",
    {
      title: "List Shadw API keys",
      description: "List the team's API keys (ids, names, roles; never the secret).",
      inputSchema: {},
      annotations: RO,
    },
    wrap(() => client.get("/v1/apikeys")),
  );

  server.registerTool(
    "shadw_revoke_api_key",
    {
      title: "Revoke a Shadw API key",
      description: "Revoke an API key by id. Anything using it stops authenticating.",
      inputSchema: { id: z.string().min(1) },
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
    },
    wrap(({ id }) => client.delete(`/v1/apikeys/${enc(id)}`)),
  );

  server.registerTool(
    "shadw_deploy",
    {
      title: "Deploy a Git repository to Shadw",
      description:
        "Clone, build and deploy a Git repository (POST /v1/git/deploy). With wait=true, polls the build " +
        "until ready/error/cancelled and returns its state, URL and the tail of its log.",
      inputSchema: {
        repo_url: z.string().min(1).describe("https Git URL, e.g. https://github.com/org/site"),
        branch: z.string().optional(),
        project: z.string().optional().describe("Project name; defaults from the repo"),
        root_dir: z.string().optional().describe("Monorepo subdirectory to build"),
        target: z.enum(["production", "preview"]).optional().describe("Default: classified by branch"),
        no_cache: z.boolean().optional(),
        env: z.record(z.string(), z.string()).optional().describe("Env vars to inject"),
        wait: z.boolean().default(true),
        timeout_seconds: z.number().int().min(10).max(3600).default(600),
      },
      annotations: WRITE,
    },
    wrap(async (a) => {
      const started = await client.post("/v1/git/deploy", buildDeployBody(a));
      if (!a.wait || !started?.build_id) return started;
      const { build, timed_out } = await waitForBuild(client, started.build_id, {
        timeoutMs: a.timeout_seconds * 1000,
      });
      return { ...started, timed_out, build: summarizeBuild(build) };
    }),
  );

  server.registerTool(
    "shadw_build_status",
    {
      title: "Get a Shadw build",
      description: "A build's state and the tail of its log. wait=true polls until it finishes.",
      inputSchema: {
        id: z.string().min(1),
        wait: z.boolean().default(false),
        tail: z.number().int().min(1).max(1000).default(60),
      },
      annotations: RO,
    },
    wrap(async ({ id, wait, tail }) => {
      if (!wait) return summarizeBuild(await client.get(`/v1/builds/${enc(id)}`), tail);
      const { build, timed_out } = await waitForBuild(client, id);
      return { timed_out, ...summarizeBuild(build, tail) };
    }),
  );

  server.registerTool(
    "shadw_cancel_build",
    {
      title: "Cancel a Shadw build",
      description: "Cancel a running build.",
      inputSchema: { id: z.string().min(1) },
      annotations: WRITE,
    },
    wrap(({ id }) => client.post(`/v1/builds/${enc(id)}/cancel`)),
  );

  server.registerTool(
    "shadw_list_projects",
    {
      title: "List Shadw projects",
      description: "Projects for the key's team, with Git source, production deployment and last build.",
      inputSchema: {},
      annotations: RO,
    },
    wrap(async () =>
      asList(await client.get("/v1/gitops/projects")).map((p) => ({
        project: p.project,
        root_dir: p.root_dir,
        branch: get(p, "git.branch"),
        repo: get(p, "git.repo_url") ?? get(p, "git.repo"),
        production_url: get(p, "production.alias"),
        last_build: get(p, "settings.last_build.state"),
      })),
    ),
  );

  server.registerTool(
    "shadw_project",
    {
      title: "Get a Shadw project's settings",
      description: "A project's settings: build config, Git link, last build.",
      inputSchema: { project: z.string().min(1) },
      annotations: RO,
    },
    wrap(({ project }) => client.get(`/v1/projects/${enc(project)}/settings`)),
  );

  server.registerTool(
    "shadw_project_health",
    {
      title: "Check a Shadw project's health",
      description:
        "One verdict (healthy | degraded | down) with reasons: last build state, whether the production URL " +
        "answers (status, latency), and 5xx responses logged in the window.",
      inputSchema: {
        project: z.string().min(1),
        range: z.enum(["30m", "1h", "24h", "7d"]).default("1h"),
      },
      annotations: RO,
    },
    wrap(({ project, range }) => projectHealth(client, project, { fetchImpl, range })),
  );

  server.registerTool(
    "shadw_list_deployments",
    {
      title: "List Shadw deployments",
      description: "Deployments for the key's team (id, project, environment, state, URL), optionally for one project.",
      inputSchema: { project: z.string().optional(), limit: z.number().int().min(1).max(500).default(50) },
      annotations: RO,
    },
    wrap(async ({ project, limit }) =>
      asList(await client.get("/deployments"))
        .filter((d) => !project || d?.project === project)
        .slice(0, limit)
        .map((d) => ({
          id: d.id,
          project: d.project,
          target: d.target,
          production: d.production,
          state: d.state,
          url: d.alias,
          branch: get(d, "git.branch"),
          created_at: d.created_at ?? d.created,
        })),
    ),
  );

  server.registerTool(
    "shadw_promote_deployment",
    {
      title: "Promote a Shadw deployment (rollback)",
      description: "Make a deployment the project's production deployment. Used to roll back.",
      inputSchema: { id: z.string().min(1) },
      annotations: WRITE,
    },
    wrap(({ id }) => client.post(`/v1/deployments/${enc(id)}/promote`)),
  );

  server.registerTool(
    "shadw_redeploy_project",
    {
      title: "Redeploy a Shadw project",
      description: "Rebuild and redeploy a project from its linked Git branch.",
      inputSchema: { project: z.string().min(1) },
      annotations: WRITE,
    },
    wrap(({ project }) => client.post(`/v1/projects/${enc(project)}/redeploy`)),
  );

  server.registerTool(
    "shadw_logs",
    {
      title: "Read Shadw request logs",
      description: "Request/event logs, filtered by project, deployment, status (e.g. '5xx' or '404,5xx'), text and window.",
      inputSchema: {
        project: z.string().optional(),
        deployment: z.string().optional(),
        status: z.string().optional(),
        q: z.string().optional(),
        range: z.enum(["30m", "1h", "24h", "7d", "30d"]).optional(),
        limit: z.number().int().min(1).max(1000).default(100),
      },
      annotations: RO,
    },
    wrap((a) => {
      const qs = new URLSearchParams();
      for (const k of ["project", "deployment", "status", "q", "range"]) if (a[k]) qs.set(k, a[k]);
      qs.set("limit", String(a.limit));
      return client.get(`/v1/logs?${qs}`);
    }),
  );

  server.registerTool(
    "shadw_platform_status",
    {
      title: "Shadw platform status",
      description: "Platform-wide status and current incidents (no key needed).",
      inputSchema: {},
      annotations: RO,
    },
    wrap(async () => {
      const [status, incidents] = await Promise.allSettled([
        client.get("/v1/status"),
        client.get("/v1/status/incidents"),
      ]);
      return {
        status: status.status === "fulfilled" ? status.value : { error: status.reason.message },
        incidents: incidents.status === "fulfilled" ? incidents.value : { error: incidents.reason.message },
      };
    }),
  );
}
