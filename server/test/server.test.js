import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer, ShadwClient, resolveConfig } from "../src/index.js";

// A mock Shadw API with the routes and shapes of dywongcloud/shadow's hive-cloud admin router.
const KEY = "shadw_test_key";
const seen = [];
let buildPolls = 0;
let mock;
let base;

function handler(req, res) {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const url = new URL(req.url, "http://x");
    seen.push({ method: req.method, path: url.pathname, query: url.search, auth: req.headers.authorization, team: req.headers["x-hive-team"], body: body ? JSON.parse(body) : null });
    const send = (code, v) => {
      res.writeHead(code, { "content-type": "application/json" });
      res.end(JSON.stringify(v));
    };
    if (url.pathname === "/site/ok") return send(200, {});
    if (url.pathname === "/site/broken") return send(502, {});
    if (url.pathname === "/v1/status") return send(200, { ok: true });
    if (url.pathname === "/v1/status/incidents") return send(200, []);
    if (req.headers.authorization !== `Bearer ${KEY}`) return send(401, "unauthorized");
    const r = `${req.method} ${url.pathname}`;
    switch (r) {
      case "GET /v1/whoami":
        return send(200, { authenticated: true, sub: "agent", tenant: "acme", role: "member" });
      case "POST /v1/apikeys":
        return send(200, { id: "k1", name: JSON.parse(body).name, role: JSON.parse(body).role, token: "shadw_new" });
      case "POST /v1/git/deploy":
        return send(200, { build_id: "b1", project: "site" });
      case "GET /v1/builds/b1":
        buildPolls++;
        return send(200, {
          id: "b1",
          project: "site",
          state: buildPolls < 2 ? "building" : "ready",
          lines: Array.from({ length: 100 }, (_, i) => ({ line: `line ${i}` })),
        });
      case "GET /v1/gitops/projects":
        return send(200, [
          { project: "site", git: { branch: "main" }, production: { alias: `${base}/site/ok` }, settings: { last_build: { id: "b1", state: "ready" } } },
          { project: "flaky", production: { alias: `${base}/site/ok` }, settings: { last_build: { id: "b2", state: "error" } } },
          { project: "dead", production: { alias: `${base}/site/broken` }, settings: { last_build: { state: "ready" } } },
        ]);
      case "GET /v1/logs":
        return send(200, url.searchParams.get("project") === "flaky" ? [{ status: 500 }, { status: 503 }] : []);
      case "GET /deployments":
        return send(200, [{ id: "d1", project: "site", target: "production", state: "ready", alias: "site.shadw.app", git: { branch: "main" } }, { id: "d2", project: "other" }]);
      case "POST /v1/deployments/d1/promote":
        return send(200, { promoted: "d1" });
      default:
        return send(404, `no route ${r}`);
    }
  });
}

let client;
async function connect(token = KEY) {
  const shadw = new ShadwClient(resolveConfig({}, { api: base, token, team: "acme" }));
  const server = createServer(shadw);
  const [a, b] = InMemoryTransport.createLinkedPair();
  const c = new Client({ name: "test", version: "0" });
  await Promise.all([server.connect(a), c.connect(b)]);
  return c;
}
const call = async (name, args = {}, c = client) => {
  const r = await c.callTool({ name, arguments: args });
  const text = r.content[0].text;
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    value = text;
  }
  return { isError: !!r.isError, value };
};

before(async () => {
  mock = http.createServer(handler);
  await new Promise((r) => mock.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${mock.address().port}`;
  client = await connect();
});
after(() => mock.close());

test("lists every tool with annotations", async () => {
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  for (const n of ["shadw_whoami", "shadw_create_api_key", "shadw_deploy", "shadw_build_status", "shadw_project_health", "shadw_list_projects", "shadw_logs", "shadw_promote_deployment", "shadw_platform_status"]) {
    assert.ok(names.includes(n), `missing ${n}`);
  }
  assert.equal(tools.find((t) => t.name === "shadw_project_health").annotations.readOnlyHint, true);
  assert.equal(tools.find((t) => t.name === "shadw_revoke_api_key").annotations.destructiveHint, true);
});

test("whoami sends the bearer key and team header", async () => {
  const { value } = await call("shadw_whoami");
  assert.equal(value.role, "member");
  const req = seen.findLast((s) => s.path === "/v1/whoami");
  assert.equal(req.auth, `Bearer ${KEY}`);
  assert.equal(req.team, "acme");
});

test("create_api_key returns the one-time token", async () => {
  const { value } = await call("shadw_create_api_key", { name: "agent-ci", role: "viewer" });
  assert.equal(value.token, "shadw_new");
  assert.deepEqual(seen.findLast((s) => s.path === "/v1/apikeys").body, { name: "agent-ci", role: "viewer" });
});

test("deploy posts the cli body and waits for the build", async () => {
  buildPolls = 0;
  const { isError, value } = await call("shadw_deploy", { repo_url: "https://github.com/acme/site", branch: "main", env: { A: "1" }, no_cache: true, timeout_seconds: 30 });
  assert.equal(isError, false);
  assert.deepEqual(seen.findLast((s) => s.path === "/v1/git/deploy").body, { repo_url: "https://github.com/acme/site", creator: "mcp", branch: "main", use_cache: false, env: { A: "1" } });
  assert.equal(value.build.state, "ready");
  assert.equal(value.timed_out, false);
  assert.equal(value.build.log_tail.length, 40);
  assert.equal(value.build.log_tail.at(-1), "line 99");
});

test("project health: healthy, degraded, down, unknown", async () => {
  const healthy = (await call("shadw_project_health", { project: "site" })).value;
  assert.equal(healthy.status, "healthy", JSON.stringify(healthy));
  assert.equal(healthy.live.status, 200);
  assert.ok(seen.some((s) => s.path === "/v1/logs" && s.query.includes("status=5xx") && s.query.includes("range=1h")));

  const degraded = (await call("shadw_project_health", { project: "flaky" })).value;
  assert.equal(degraded.status, "degraded");
  assert.equal(degraded.errors_5xx, 2);
  assert.ok(degraded.reasons.some((r) => r.includes("ended error")));

  const down = (await call("shadw_project_health", { project: "dead" })).value;
  assert.equal(down.status, "down");
  assert.equal(down.live.status, 502);

  const missing = await call("shadw_project_health", { project: "nope" });
  assert.equal(missing.isError, true);
});

test("deployments filter and rollback", async () => {
  const { value } = await call("shadw_list_deployments", { project: "site" });
  assert.deepEqual(value.map((d) => d.id), ["d1"]);
  assert.equal((await call("shadw_promote_deployment", { id: "d1" })).value.promoted, "d1");
});

test("a bad key is an error result that names the fix", async () => {
  const bad = await connect("shadw_wrong");
  const { isError, value } = await call("shadw_whoami", {}, bad);
  assert.equal(isError, true);
  assert.match(value, /HTTP 401/);
  assert.match(value, /SHADW_API_KEY/);
  assert.equal((await call("shadw_platform_status", {}, bad)).value.status.ok, true);
});
