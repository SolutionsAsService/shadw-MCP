// HTTP client for the Shadw control-plane API (dywongcloud/shadow, crates/hive-cloud).
// Auth mirrors `shadw-cli`: a bearer API key (`shadw_…`, dashboard → Settings → API Keys)
// and an optional `x-hive-team` header to scope a multi-team key.

export const DEFAULT_API = "https://api.shadw.cloud";

export class ShadwError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ShadwError";
    this.status = status;
    this.body = body;
  }
}

/** Resolve settings the way shadw-cli does: explicit → env → default. */
export function resolveConfig(env = process.env, overrides = {}) {
  const pick = (...vals) => vals.find((v) => typeof v === "string" && v.trim() !== "");
  const api = pick(overrides.api, env.SHADW_API_URL, env.SHADW_API) ?? DEFAULT_API;
  return {
    api: api.replace(/\/+$/, ""),
    token: pick(overrides.token, env.SHADW_API_KEY, env.SHADW_TOKEN) ?? null,
    team: pick(overrides.team, env.SHADW_TEAM) ?? null,
    timeoutMs: Number(pick(overrides.timeoutMs, env.SHADW_TIMEOUT_MS) ?? 30000),
  };
}

export class ShadwClient {
  constructor(config = resolveConfig(), fetchImpl = globalThis.fetch) {
    this.config = config;
    this.fetch = fetchImpl;
  }

  url(path) {
    return this.config.api + (path.startsWith("/") ? path : `/${path}`);
  }

  async request(method, path, body) {
    const headers = { accept: "application/json" };
    if (this.config.token) headers.authorization = `Bearer ${this.config.token}`;
    if (this.config.team) headers["x-hive-team"] = this.config.team;
    if (body !== undefined) headers["content-type"] = "application/json";
    let resp;
    try {
      resp = await this.fetch(this.url(path), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (e) {
      throw new ShadwError(`${method} ${path} failed: ${e.message}`, 0, null);
    }
    const text = await resp.text();
    let parsed = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }
    if (!resp.ok) {
      const detail = typeof parsed === "string" ? parsed : text;
      throw new ShadwError(
        `${method} ${path} → HTTP ${resp.status}${detail ? `: ${detail.trim().slice(0, 500)}` : ""}`,
        resp.status,
        parsed,
      );
    }
    return parsed;
  }

  get(path) {
    return this.request("GET", path);
  }
  post(path, body = {}) {
    return this.request("POST", path, body);
  }
  delete(path) {
    return this.request("DELETE", path);
  }
}

/** Build the POST /v1/git/deploy body; only fields that were set (as shadw-cli does). */
export function buildDeployBody({ repo_url, branch, project, root_dir, target, no_cache, env }) {
  const body = { repo_url, creator: "mcp" };
  if (branch) body.branch = branch;
  if (project) body.project = project;
  if (root_dir) body.root_dir = root_dir;
  if (target) body.target = target;
  if (no_cache) body.use_cache = false;
  if (env && Object.keys(env).length) body.env = env;
  return body;
}

export const TERMINAL_BUILD_STATES = new Set(["ready", "error", "cancelled"]);
