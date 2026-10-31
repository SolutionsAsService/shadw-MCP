// Builds the shadw-MCP site into ../site from the server's own source.
// No dependencies: `node _src/build.mjs`, then commit site/.
// Every figure the site prints is computed here and written to site/facts.json with the procedure that
// reproduces it. Every sentence about the server's behaviour cites the line it describes; `cite()` throws when
// that code is gone, so the build fails instead of the site drifting.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const out = join(root, "site");
const REPO = "https://github.com/SolutionsAsService/shadw-MCP";
const SITE = "https://shadw-mcp.shadw.app/";

const src = (f) => readFileSync(join(root, f), "utf8");
const files = Object.fromEntries(["server/src/tools.js", "server/src/client.js", "server/src/cli.js", "server/test/server.test.js"].map((f) => [f, src(f)]));
const pkg = JSON.parse(src("server/package.json"));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Line of the first occurrence of `needle` in `file`; throws if absent. */
function lineOf(file, needle) {
  const i = files[file].split("\n").findIndex((l) => l.includes(needle));
  if (i < 0) throw new Error(`cite: "${needle}" not found in ${file}; the claim it backs is stale`);
  return i + 1;
}
function cite(file, needle) {
  const n = lineOf(file, needle);
  return `<a class="cite" href="${REPO}/blob/main/${file}#L${n}">${file}:${n}</a>`;
}

// ---- parse the tools ---------------------------------------------------------------------------------------
const toolsSrc = files["server/src/tools.js"];
const blocks = toolsSrc.split("server.registerTool(").slice(1);
// Helper functions a tool calls through: their API routes belong to that tool too.
const helpers = Object.fromEntries(
  ["waitForBuild", "projectHealth"].map((fn) => {
    const start = toolsSrc.indexOf(`export async function ${fn}(`);
    if (start < 0) throw new Error(`helper ${fn} not found`);
    return [fn, toolsSrc.slice(start, toolsSrc.indexOf("\n}\n", start))];
  }),
);
const tools = blocks.map((b) => {
  const name = b.match(/"(shadw_[a-z_]+)"/)[1];
  const title = (b.match(/title:\s*"([^"]+)"/) || [])[1] ?? name;
  const description = (b.match(/description:\s*((?:"[^"]*"\s*\+?\s*)+)/) || [, '""'])[1]
    .match(/"([^"]*)"/g)
    .map((s) => s.slice(1, -1))
    .join("");
  const ann = (b.match(/annotations:\s*(RO|WRITE|\{[^}]*\})/) || [])[1] ?? "";
  const kind = /destructiveHint:\s*true/.test(ann) ? "destructive" : ann.trim().startsWith("RO") ? "read" : "write";
  const body = b + Object.entries(helpers).filter(([fn]) => b.includes(fn + "(")).map(([, s]) => s).join("\n");
  // A literal path in the call, or a path assigned to a variable first (`const q = `/v1/logs?...``, read with GET).
  const routes = [...body.matchAll(/(?:client\.(get|post|delete)\(\s*|const \w+ = )[`"](\/[^`"]+)[`"]/g)].map((m) => `${(m[1] ?? "get").toUpperCase()} ${m[2].replace(/\$\{enc\((\w+)\)\}/g, ":$1").replace(/\?.*$/, "")}`);
  // The inputSchema object literal, split on its top-level commas (one-line and multi-line schemas alike).
  const at = b.indexOf("inputSchema:");
  let paramsSrc = "";
  if (at >= 0) {
    const open = b.indexOf("{", at);
    let depth = 0, i = open;
    for (; i < b.length; i++) { if ("{([".includes(b[i])) depth++; else if ("})]".includes(b[i]) && --depth === 0) break; }
    paramsSrc = b.slice(open + 1, i);
  }
  const parts = [];
  { let depth = 0, cur = "", q = null;
    for (const ch of paramsSrc) {
      if (q) { cur += ch; if (ch === q) q = null; continue; }
      if (ch === '"' || ch === "'" || ch === "`") { q = ch; cur += ch; continue; }
      if ("{([".includes(ch)) depth++; else if ("})]".includes(ch)) depth--;
      if (ch === "," && depth === 0) { parts.push(cur); cur = ""; } else cur += ch;
    }
    parts.push(cur); }
  const paramList = parts.map((x) => x.trim()).filter((x) => /^\w+:\s*z\./.test(x)).map((x) => {
    const name = x.match(/^(\w+)/)[1];
    const def = (x.match(/\.default\(([^)]*)\)/) || [])[1];
    const optional = /\.optional\(\)/.test(x) || def !== undefined;
    return { name, default: def, optional };
  });
  return { name, title, description, kind, routes: [...new Set(routes)], params: paramList, line: lineOf("server/src/tools.js", `"${name}",`) };
});

const STAGES = [
  { id: "setup", page: "setup.html", step: "0", name: "Set up", verb: "Install", tools: [] },
  { id: "keys", page: "keys.html", step: "1", name: "Key", verb: "Authenticate", tools: ["shadw_whoami", "shadw_create_api_key", "shadw_list_api_keys", "shadw_revoke_api_key"] },
  { id: "deploy", page: "deploy.html", step: "2", name: "Deploy", verb: "Ship", tools: ["shadw_deploy", "shadw_build_status", "shadw_cancel_build"] },
  { id: "health", page: "health.html", step: "3", name: "Check", verb: "Check", tools: ["shadw_project_health", "shadw_logs", "shadw_platform_status", "shadw_list_projects", "shadw_project"] },
  { id: "rollback", page: "rollback.html", step: "4", name: "Roll back", verb: "Recover", tools: ["shadw_list_deployments", "shadw_promote_deployment", "shadw_redeploy_project"] },
];
const byName = Object.fromEntries(tools.map((t) => [t.name, t]));
const staged = STAGES.flatMap((s) => s.tools);
const unstaged = tools.filter((t) => !staged.includes(t.name)).map((t) => t.name);
if (unstaged.length || staged.some((n) => !byName[n])) throw new Error(`stage map out of date: unstaged ${unstaged}, unknown ${staged.filter((n) => !byName[n])}`);

// ---- computed figures --------------------------------------------------------------------------------------
const roles = toolsSrc.match(/role:\s*z\.enum\(\[([^\]]+)\]\)/)[1].match(/"(\w+)"/g).map((s) => s.slice(1, -1));
const defaultRole = toolsSrc.match(/role:\s*z\.enum\([^)]*\)\.default\("(\w+)"\)/)[1];
const deployBlock = blocks.find((b) => b.includes('"shadw_deploy"'));
const waitDefault = Number(deployBlock.match(/timeout_seconds:[^\n]*\.default\((\d+)\)/)[1]);
const waitMax = Number(deployBlock.match(/timeout_seconds:[^\n]*\.max\((\d+)\)/)[1]);
const logTail = Number(toolsSrc.match(/export function summarizeBuild\(b, tail = (\d+)\)/)[1]);
const verdicts = [...new Set([...toolsSrc.matchAll(/"(healthy|degraded|down)"/g)].map((m) => m[1]))];
const healthBlock = blocks.find((b) => b.includes('"shadw_project_health"'));
const healthRanges = healthBlock.match(/range:\s*z\.enum\(\[([^\]]+)\]\)/)[1].match(/"(\w+)"/g).map((s) => s.slice(1, -1));
const healthDefault = healthBlock.match(/range:[^\n]*\.default\("(\w+)"\)/)[1];
const counts = { read: 0, write: 0, destructive: 0 };
tools.forEach((t) => counts[t.kind]++);
const envVars = [...new Set([...files["server/src/client.js"].matchAll(/env\.(SHADW_[A-Z_]+)/g)].map((m) => m[1]))];
const defaultApi = files["server/src/client.js"].match(/DEFAULT_API = "([^"]+)"/)[1];
const testCount = (files["server/test/server.test.js"].match(/^test\(/gm) || []).length;
const testedTools = new Set([...files["server/test/server.test.js"].matchAll(/call\("(shadw_\w+)"/g)].map((m) => m[1])).size;
const timeoutMs = Number(files["server/src/client.js"].match(/SHADW_TIMEOUT_MS\) \?\? (\d+)/)[1]);
const probeOkBelow = Number(toolsSrc.match(/ok: r\.status < (\d+)/)[1]);
const ROLLBACK_PATH = ["shadw_list_deployments", "shadw_promote_deployment"]; // find the deployment id, then promote it
if (ROLLBACK_PATH.some((n) => !byName[n])) throw new Error("rollback path tools missing");
const rollbackCalls = ROLLBACK_PATH.length;

const FIG = {
  tools: { value: tools.length, procedure: "count of server.registerTool( calls in server/src/tools.js" },
  read: { value: counts.read, procedure: "tools whose annotations are RO (readOnlyHint: true)" },
  write: { value: counts.write, procedure: "tools whose annotations are WRITE (readOnlyHint: false, no destructiveHint)" },
  destructive: { value: counts.destructive, procedure: "tools whose annotations set destructiveHint: true" },
  roles: { value: roles.length, procedure: "values of the role enum in shadw_create_api_key" },
  requiredEnv: { value: 1, procedure: "SHADW_API_KEY (or its alias SHADW_TOKEN) is the only required variable: without it every tool but shadw_platform_status fails (server/src/cli.js warns)" },
  envVars: { value: envVars.length, procedure: "distinct env.SHADW_* reads in server/src/client.js" },
  waitDefault: { value: waitDefault, procedure: "timeout_seconds default in shadw_deploy" },
  waitMax: { value: waitMax, procedure: "timeout_seconds max in shadw_deploy" },
  logTail: { value: logTail, procedure: "summarizeBuild default tail in server/src/tools.js" },
  verdicts: { value: verdicts.length, procedure: "distinct status strings returned by projectHealth" },
  rollbackCalls: { value: rollbackCalls, procedure: "calls on the rollback path: shadw_list_deployments (for the id), then shadw_promote_deployment" },
  testedTools: { value: testedTools, procedure: "distinct tools named in call(\"shadw_...\") in server/test/server.test.js" },
  timeoutMs: { value: timeoutMs, procedure: "the SHADW_TIMEOUT_MS fallback in resolveConfig, server/src/client.js" },
  probeOkBelow: { value: probeOkBelow, procedure: "the status a live probe must stay below to count as answering, probe() in server/src/tools.js" },
  tests: { value: testCount, procedure: "top-level test( calls in server/test/server.test.js; run `npm test`" },
};
const fig = (k) => FIG[k].value;

// ---- shared chrome ------------------------------------------------------------------------------------------
const NAV = [["setup.html", "Set up"], ["keys.html", "Keys"], ["deploy.html", "Deploy"], ["health.html", "Health"], ["rollback.html", "Roll back"], ["tools.html", "Tools"]];

function page({ file, title, description, body, current }) {
  const nav = NAV.map(([href, label]) => `<a href="${href}"${href === current ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  const canonical = SITE + (file === "index.html" ? "" : file.replace(/\.html$/, ""));
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#000000">
<meta name="color-scheme" content="dark">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="style.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="bar"><div class="wrap bar-in">
  <a class="brand" href="index.html" aria-label="shadw-MCP home"><svg viewBox="0 0 32 32" aria-hidden="true"><use href="#mark"/></svg><span>shadw<b>-MCP</b></span></a>
  <nav aria-label="Pages">${nav}</nav>
</div></header>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <linearGradient id="ramp" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#e92a67"/><stop offset=".52" stop-color="#a853ba"/><stop offset="1" stop-color="#2a8af6"/></linearGradient>
  <symbol id="mark" viewBox="0 0 32 32"><rect x="1" y="1" width="30" height="30" rx="7" fill="#000" stroke="#3f3f4a"/><path d="M5 11h7v10h8V11h7" fill="none" stroke="url(#ramp)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="27" cy="11" r="2.6" fill="#2a8af6"/></symbol>
</defs></svg>
<main id="main">
${body}
</main>
<footer class="foot"><div class="wrap foot-in">
  <p>shadw-MCP ${esc(pkg.version)} talks to the Shadw control-plane API in <a href="https://github.com/dywongcloud/shadow">dywongcloud/shadow</a>. Source: <a href="${REPO}">${REPO.replace("https://", "")}</a>. Every number on this site is computed from the source at build time: <a href="facts.json">facts.json</a>.</p>
  <nav aria-label="Footer">${NAV.map(([h, l]) => `<a href="${h}">${l}</a>`).join("")}</nav>
</div></footer>
</body>
</html>
`;
}

const KIND = { read: "read-only", write: "write", destructive: "destructive" };
const chip = (n) => {
  const t = byName[n];
  return `<li class="chip k-${t.kind}"><a href="tools.html#${n}"><code>${n.replace("shadw_", "")}</code><span class="sr">, ${KIND[t.kind]}</span></a></li>`;
};

// ---- the landing ---------------------------------------------------------------------------------------------
const stageFigure = {
  setup: [fig("requiredEnv"), "key to set", "<code>SHADW_API_KEY</code>"],
  keys: [fig("roles"), "roles a key can carry", roles.join(" · ")],
  deploy: [fig("waitDefault"), "seconds it waits for the build", `at most, by default (up to ${fig("waitMax")}); then state, URL, log tail`],
  health: [fig("verdicts"), "verdicts per project", verdicts.join(" · ")],
  rollback: [fig("rollbackCalls"), "calls to roll back", "list deployments, then make an earlier one live again"],
};

// Each stage is a tile: a link (step, figure, unit) and, under it, that stage's tools as kind-marked cells (M5).
const relay = `<ol class="relay" aria-label="What an agent does with shadw-MCP, in order">
${STAGES.map((s) => {
  const [n, unit, sub] = stageFigure[s.id];
  return `  <li class="stage s-${s.id}">
    <a class="tile" href="${s.page}" aria-labelledby="s-${s.id} n-${s.id} u-${s.id}"><span class="step" id="s-${s.id}">${s.step} · ${s.name}</span>
    <span class="num" id="n-${s.id}">${n}</span>
    <span class="unit" id="u-${s.id}">${unit}</span>
    <span class="sub">${sub}</span></a>
    ${s.tools.length ? `<ul class="chips" aria-label="${s.name} tools">${s.tools.map(chip).join("")}</ul>` : `<p class="chips start"><a class="btn" href="setup.html">Set it up →</a><code>npm install</code></p>`}
  </li>`;
}).join("\n")}
</ol>`;

const legend = `<p class="legend"><span class="lg k-read"></span>${fig("read")} read-only <span class="lg k-write"></span>${fig("write")} write <span class="lg k-destructive"></span>${fig("destructive")} destructive <a href="tools.html">all ${fig("tools")} tools →</a></p>`;

const wire = `<div class="wire" aria-hidden="true"></div>`;

const home = page({
  file: "index.html",
  current: "index.html",
  title: "shadw-MCP: give an agent a Shadw key",
  description: `An MCP server with ${fig("tools")} tools. With a Shadw API key, an agent deploys a Git repo, follows the build, checks project health and rolls back.`,
  body: `<section class="hero"><div class="wrap">
  <h1>Give an agent a Shadw key. It deploys, checks and rolls back.</h1>
  <p class="what">An MCP (Model Context Protocol) server: it gives Claude Code, or any MCP client, ${fig("tools")} tools for Shadw.</p>
  <div class="relay-box">${wire}${relay}</div>
  ${legend}
</div></section>
<section class="band"><div class="wrap cols">
  <div class="c6"><h2>One server, the API the CLI already uses</h2><p>shadw-MCP sends the same requests as the <code>shadw</code> CLI in Dylan Wong's Shadw (<a href="https://github.com/dywongcloud/shadow/blob/main/crates/shadw-cli/src/client.rs">its client</a>): a bearer API key, an optional <code>x-hive-team</code> header, and the same routes (mostly <code>/v1</code>) on the Shadw control plane (default <code>${esc(defaultApi)}</code>). ${cite("server/src/client.js", "headers.authorization = `Bearer")}</p></div>
  <div class="c6"><h2>The key decides what the agent may do</h2><p>The server never deletes a project or a deployment. Revoking a key is the only destructive tool, and it is marked <code>destructiveHint</code>. Whether a key may create another key, and with which role, is decided by the Shadw server, not by this one.</p><p><a class="btn" href="setup.html">Set it up</a> <a class="btn ghost" href="tools.html">See all ${fig("tools")} tools</a></p></div>
</div></section>`,
});

// ---- inner pages ----------------------------------------------------------------------------------------------
const toolCard = (n) => {
  const t = byName[n];
  const params = t.params.length
    ? `<dl class="params">${t.params.map((p) => `<dt><code>${p.name}</code></dt><dd>${p.default !== undefined ? `default <code>${esc(p.default)}</code>` : p.optional ? "optional" : "required"}</dd>`).join("")}</dl>`
    : `<p class="muted">No parameters.</p>`;
  return `<article class="tool k-${t.kind}" id="${n}">
  <header><h3><code>${n}</code></h3><span class="kind">${t.kind}</span></header>
  <p>${esc(t.description)}</p>
  ${t.routes.length ? `<p class="routes">${t.routes.map((r) => `<code>${esc(r)}</code>`).join(" ")}</p>` : ""}
  ${params}
  <p class="src"><a class="cite" href="${REPO}/blob/main/src/tools.js#L${t.line}">server/src/tools.js:${t.line}</a></p>
</article>`;
};

const inner = (file, current, title, description, lede, sections) =>
  page({
    file,
    current,
    title: `${title} · shadw-MCP`,
    description,
    body: `<section class="head"><div class="wrap"><p class="kicker">${STAGES.find((s) => s.page === file)?.step ?? "Reference"}${STAGES.find((s) => s.page === file) ? " · " + esc(title) : ""}</p><h1>${lede}</h1></div></section>
<section class="body"><div class="wrap">${sections}</div></section>`,
  });

const stageTools = (id) => `<div class="tools">${STAGES.find((s) => s.id === id).tools.map(toolCard).join("")}</div>`;

const pages = {
  "index.html": home,
  "setup.html": inner("setup.html", "setup.html", "Set up", "Install shadw-MCP and register it with an MCP client.", `One key, three commands, and your agent can reach Shadw.`, `
<ol class="steps">
  <li><h2>Make a key</h2><p>In the Shadw dashboard, open <b>Settings → API Keys</b>. Use role <code>member</code> to deploy, or <code>viewer</code> for read-only checks. An agent that already has a key can create one with <code>shadw_create_api_key</code>; see <a href="keys.html">Keys</a>.</p></li>
  <li><h2>Install</h2><pre><code>git clone ${REPO}
cd shadw-MCP/server &amp;&amp; npm install</code></pre></li>
  <li><h2>Register it</h2><p>Claude Code:</p><pre><code>claude mcp add shadw -e SHADW_API_KEY=shadw_your_key -- node /path/to/shadw-MCP/server/src/cli.js</code></pre><p>Any other MCP client:</p><pre><code>{
  "mcpServers": {
    "shadw": {
      "command": "node",
      "args": ["/path/to/shadw-MCP/server/src/cli.js"],
      "env": { "SHADW_API_KEY": "shadw_your_key" }
    }
  }
}</code></pre></li>
</ol>
<h2>Settings</h2>
<p>The server reads ${fig("envVars")} environment variables; only the key is required. ${cite("server/src/client.js", "export function resolveConfig")}</p>
<table class="t"><thead><tr><th scope="col">Variable</th><th scope="col">Meaning</th><th scope="col">Default</th></tr></thead><tbody>
<tr><td><code>SHADW_API_KEY</code>, <code>SHADW_TOKEN</code></td><td>Bearer API key</td><td>none</td></tr>
<tr><td><code>SHADW_API_URL</code>, <code>SHADW_API</code></td><td>Control-plane base URL</td><td><code>${esc(defaultApi)}</code></td></tr>
<tr><td><code>SHADW_TEAM</code></td><td>Team slug, sent as <code>x-hive-team</code></td><td>none: the key's own team</td></tr>
<tr><td><code>SHADW_TIMEOUT_MS</code></td><td>Per-request timeout</td><td><code>${fig("timeoutMs")}</code></td></tr>
</tbody></table>
<p>Without a key the server still starts, and says so on stderr; only <code>shadw_platform_status</code> works. ${cite("server/src/cli.js", "SHADW_API_KEY is not set")}</p>`),
  "keys.html": inner("keys.html", "keys.html", "Keys", "API keys and roles for agents using shadw-MCP.", `${fig("roles")} roles. Give the agent the lowest one that works.`, `
<p class="lede">A key carries one of ${roles.length} roles (${roles.map((r) => `<code>${r}</code>`).join(", ")}); give the agent the lowest that works. A key cannot mint a role above its own: the Shadw server refuses it, not this one <a class="cite" href="https://github.com/PrometheusIntelligence/shadow/blob/2522715/crates/hive-cloud/src/admin.rs#L11995">shadow: hive-cloud/src/admin.rs:11995</a>. ${cite("server/src/tools.js", "role: z.enum(")}</p>
<p>A bad or missing key comes back as an error result that names the fix (<code>SHADW_API_KEY</code>, and <code>SHADW_TEAM</code> for a key that spans teams), not as a crash. ${cite("server/src/tools.js", "e.status === 401 || e.status === 403")}</p>
${stageTools("keys")}`),
  "deploy.html": inner("deploy.html", "deploy.html", "Deploy", "Deploy a Git repository to Shadw from an agent.", `One call ships a repo, and by default waits for the build.`, `
<p class="lede"><code>shadw_deploy</code> posts the same body as <code>shadw deploy</code> in the CLI, tagged <code>creator: "mcp"</code>. With <code>wait</code> on (the default) it polls the build until <code>ready</code>, <code>error</code> or <code>cancelled</code>, for up to ${fig("waitDefault")} seconds by default (at most ${fig("waitMax")}), and returns the state, the URL and the last ${fig("logTail")} log lines ${cite("server/src/tools.js", "export function summarizeBuild")}. ${cite("server/src/client.js", "export function buildDeployBody")} ${cite("server/src/tools.js", "export async function waitForBuild")}</p>
${stageTools("deploy")}`),
  "health.html": inner("health.html", "health.html", "Health", "Project health, logs and platform status for agents.", `${fig("verdicts")} verdicts, each with its reasons.`, `
<p class="lede"><code>shadw_project_health</code> reads three things and returns one verdict: <code>${verdicts.join("</code>, <code>")}</code>, with the reasons. It is a check you run, not a monitor: nothing runs between calls. ${cite("server/src/tools.js", "export async function projectHealth")}</p>
<ol class="verdict">
  <li class="v-down"><b>down</b> when the project has no production deployment, or its production URL does not answer below HTTP ${fig("probeOkBelow")}. ${cite("server/src/tools.js", "const down =")}</li>
  <li class="v-degraded"><b>degraded</b> when the last build ended in <code>error</code> or <code>cancelled</code>, or 5xx responses were logged in the window (default <code>${healthDefault}</code>; also ${healthRanges.filter((r) => r !== healthDefault).join(", ")}). ${cite("server/src/tools.js", "5xx responses logged in the last")}</li>
  <li class="v-healthy"><b>healthy</b> otherwise.</li>
</ol>
<p>Two other outcomes: a project the key's team does not have is an error, not a verdict ${cite("server/src/tools.js", "not found for this key's team")}; and when the logs cannot be read, the reason says so and the verdict is at least <code>degraded</code> ${cite("server/src/tools.js", "logs unavailable")}.</p>
${stageTools("health")}`),
  "rollback.html": inner("rollback.html", "rollback.html", "Roll back", "List deployments, roll back and redeploy with shadw-MCP.", `Roll back in ${fig("rollbackCalls")} calls: list, then promote.`, `
<p class="lede">List a project's deployments, then promote one: promoting makes an earlier deployment the live (production) one again. Or rebuild from the linked branch. Nothing here deletes anything. ${cite("server/src/tools.js", "/promote`")}</p>
${stageTools("rollback")}`),
  "tools.html": inner("tools.html", "tools.html", "Tools", `All ${fig("tools")} shadw-MCP tools, generated from the source.`, `All ${fig("tools")} tools, generated from <code>server/src/tools.js</code>.`, `
<p class="lede">${fig("read")} read-only, ${fig("write")} write, ${fig("destructive")} destructive. This page is built from the tool definitions, so it cannot list a tool the server does not have. ${fig("tests")} tests call ${fig("testedTools")} of the ${fig("tools")} tools through a real MCP client against a mock Shadw API.</p>
${STAGES.filter((s) => s.tools.length).map((s) => `<h2 id="stage-${s.id}"><a href="${s.page}">${s.step} · ${s.name}</a></h2><div class="tools">${s.tools.map(toolCard).join("")}</div>`).join("\n")}`),
  "404.html": page({ file: "404.html", title: "Not found · shadw-MCP", description: "Page not found.", body: `<section class="head"><div class="wrap"><p class="kicker">404</p><h1>No page here.</h1><p><a class="btn" href="index.html">Back to the start</a></p></div></section>` }),
};

mkdirSync(out, { recursive: true });
for (const [f, html] of Object.entries(pages)) writeFileSync(join(out, f), html);
for (const f of ["style.css", "favicon.svg"]) copyFileSync(join(here, f), join(out, f));
writeFileSync(join(out, "vercel.json"), JSON.stringify({ outputDirectory: "." }, null, 2) + "\n");
writeFileSync(
  join(out, "facts.json"),
  JSON.stringify({ built_from: `${REPO} (server/src/tools.js, server/src/client.js, server/test/server.test.js)`, figures: FIG, tools: tools.map(({ name, kind, routes, line }) => ({ name, kind, routes, source: `server/src/tools.js:${line}` })) }, null, 2) + "\n",
);
console.log(`built ${Object.keys(pages).length} pages · ${tools.length} tools (${counts.read} read, ${counts.write} write, ${counts.destructive} destructive)`);
