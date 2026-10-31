# R1 Critic: Provocateur (Debord)

- Anchor used: Society of the Spectacle, thesis 1 and 4 (lived relation replaced by its image), plus the smooth commodity surface that announces more than the thing does.

- Observed:
  - index.html is mostly a spec sheet, not a spectacle. The relay figures are traceable: 600 s is `timeout_seconds ... default(600)` (src/tools.js:185), the 3 verdicts are src/tools.js:93, `x-hive-team` is src/client.js:41, the only DELETE tool is `revoke_api_key` with `destructiveHint: true` (src/tools.js:164-166). The footer points at facts.json. A claim, not a brochure.
  - The hero h1 uses gradient words "deploys, watches and rolls back". "Watches" is the image doing the work. `shadw_project_health` is a single snapshot taken when called (src/tools.js:59-93). Nothing polls or alerts after the call. The verb sells vigilance; the code sells a look.
  - The "4 · Roll back" stage reads "1 call to roll back". `shadw_promote_deployment` needs a deployment `id` (src/tools.js:306), which the agent gets from `list_deployments`, the chip listed beside it. In practice that is two calls. The number is smoothed.
  - The band says the server refuses a higher-role mint "with HTTP 403". This code does not enforce that; it relays a promise made by Shadw's server.
  - index-1280.png shows the hero tiled 2x2, with the nav missing. This broken image cannot back the "complete" measurement.

- Verdict: OBJECT (minor; ship-blocking only on the two words)

- Requested change:
  1. h1: replace "watches" with "checks" (keep the gradient), or add a sub-line: "health on request, not a monitor".
  2. Roll back stage: change it to "2 calls: list, then promote", or keep the 1 and make the sub-line "promote a known deployment id".
  3. 403 sentence: add "(enforced by Shadw, not by this server)" and a cite.
  4. Recapture index-1280.png without the tiling before R2.
