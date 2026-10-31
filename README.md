# shadw-MCP

An [MCP](https://modelcontextprotocol.io) server for [Shadw](https://shadw.cloud). An agent with a Shadw API key can deploy
a Git repository, follow the build, check a project's health, read its logs and roll it back.

It talks to the Shadw control-plane API served by `hive-cloud` in [dywongcloud/shadow](https://github.com/dywongcloud/shadow)
(mirrored at [PrometheusIntelligence/shadow](https://github.com/PrometheusIntelligence/shadow)), using the same routes,
auth and request bodies as that repo's `shadw` CLI (`crates/shadw-cli`).

## Setup

1. In the Shadw dashboard, open **Settings → API Keys** and create a key for the agent. Use `member` to deploy, or
   `viewer` for read-only health checks. An existing key can also mint keys with the `shadw_create_api_key` tool.
2. Install and register the server:

```bash
git clone https://github.com/SolutionsAsService/shadw-MCP && cd shadw-MCP && npm install
```

```bash
claude mcp add shadw -e SHADW_API_KEY=shadw_your_key -- node /path/to/shadw-MCP/src/cli.js
```

Other MCP clients can use the same idea as JSON:

```json
{
  "mcpServers": {
    "shadw": {
      "command": "node",
      "args": ["/path/to/shadw-MCP/src/cli.js"],
      "env": { "SHADW_API_KEY": "shadw_your_key" }
    }
  }
}
```

| Variable | Meaning | Default |
|---|---|---|
| `SHADW_API_KEY` (or `SHADW_TOKEN`) | Bearer API key | none |
| `SHADW_API_URL` (or `SHADW_API`) | Control-plane base URL | `https://api.shadw.cloud` |
| `SHADW_TEAM` | Team slug, sent as `x-hive-team`, for a key that spans teams | inferred from the key |
| `SHADW_TIMEOUT_MS` | Per-request timeout | `30000` |

## Tools

| Tool | What it does | API |
|---|---|---|
| `shadw_whoami` | Check the key: subject, team, role | `GET /v1/whoami` |
| `shadw_create_api_key` | Mint a key for another agent; the token is shown once | `POST /v1/apikeys` |
| `shadw_list_api_keys`, `shadw_revoke_api_key` | Manage keys | `GET /v1/apikeys`, `DELETE /v1/apikeys/:id` |
| `shadw_deploy` | Clone, build and deploy a repo; by default waits and returns the state, URL and log tail | `POST /v1/git/deploy`, `GET /v1/builds/:id` |
| `shadw_build_status`, `shadw_cancel_build` | Follow or stop a build | `GET /v1/builds/:id`, `POST /v1/builds/:id/cancel` |
| `shadw_list_projects`, `shadw_project` | Projects with Git source, production URL and last build | `GET /v1/gitops/projects`, `GET /v1/projects/:p/settings` |
| `shadw_project_health` | `healthy`, `degraded` or `down`, with reasons | see below |
| `shadw_list_deployments` | Deployments, optionally for one project | `GET /deployments` |
| `shadw_promote_deployment` | Make a deployment production (instant rollback) | `POST /v1/deployments/:id/promote` |
| `shadw_redeploy_project` | Rebuild from the linked branch | `POST /v1/projects/:p/redeploy` |
| `shadw_logs` | Request logs by project, deployment, status (`5xx`, `404,5xx`), text and window | `GET /v1/logs` |
| `shadw_platform_status` | Platform status and incidents (no key needed) | `GET /v1/status`, `GET /v1/status/incidents` |

`shadw_project_health` combines three readings:

- the project's last build state;
- a live `GET` of its production URL, with its status code and latency;
- the count of 5xx responses logged in the window (default `1h`).

It reports `down` when nothing is deployed or the URL fails to answer, and `degraded` when the last build failed or 5xx
responses were logged. Otherwise it reports `healthy`.

The server never deletes projects or deployments. Revoking a key is the only destructive tool, and it is marked
`destructiveHint`. What a key can do is decided by the server from the key's role. A key cannot be minted with a higher
role than the key that creates it.

## Development

```bash
npm test
```

The tests run the real MCP client against the server over an in-memory transport, and a local mock of the Shadw API
stands in for the real one. They never call the live API.

## Site

The project site lives in [`site/`](site/) (live address once deployed: `https://shadw-mcp.shadw.app/`). It has eight
pages: the landing, setup, keys, deploy, health, rollback, tools and 404.

[`_src/build.mjs`](_src/build.mjs) generates every page from `src/tools.js`, `src/client.js` and `src/cli.js`, so the
site cannot list a tool, figure or default the server does not have. Each number it prints is recorded with its
procedure in `site/facts.json`. Each sentence about behaviour links to the line it describes, and the build fails if
that line is gone.

```bash
node _src/build.mjs
```

```bash
node _src/measure.mjs
```

The second command renders every page in headless Chrome. It checks the first screen, overflow, contrast and target
sizes, and writes the social card.

The site is deploy-ready for Vercel and Shadw: a root `vercel.json` (`"framework": null`, output `site`), a
`site/vercel.json`, and a root `index.html` that redirects. The design process is recorded in
[`DESIGN-LOG.md`](DESIGN-LOG.md).
