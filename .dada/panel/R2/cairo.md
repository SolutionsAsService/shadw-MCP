# Critic: Evidence (Cairo), R2

- Anchor used: Cairo, How Charts Lie / The Truthful Art. Every figure traces to source; no sentence claims more than it.
- Observed (build: 15 tools, 9/5/1; `npm test`: 7/7 pass):
  - R1 param renderer: TRUE. list_deployments now renders "project optional, limit default 50" (tools.js:281).
  - R1 rollback: TRUE. "2 calls: list, then promote" (tools.js:277, :302). "Last good" is gone.
  - R1 "HTTP 403": FIXED. Removed from the index page.
  - R1 SHADW_TEAM default: TRUE. The page says "none" (client.js:23, :41).
  - R1 health's two other outcomes: TRUE. Unknown project is an error (tools.js:66). Unreadable logs make the verdict at least degraded (tools.js:89, :93).
  - R1 corrected cite: TRUE. "degraded" now points to :87.
  - Index figures: TRUE. 15 tools, 1 key, 4 roles (:140), 600 s (:185, :33), 3 verdicts (:93), 2 calls, 9/5/1 (:115-116, :164).
  - Deploy page: TRUE. 600 s default, 3600 max (:185); 40 log lines (:26, but not cited on the page); creator "mcp" (client.js:87).
  - Setup page: 6 env vars TRUE (client.js:19-24), and cli.js:6 TRUE. But "only the key has no default" CONTRADICTS the table, because SHADW_TEAM also has no default (client.js:23).
  - Keys page: TRUE. The fix-naming error appears on 401/403 (tools.js:15-16); role default is member (:140).
  - Health page: down at :92, probe below 500 at :49, ranges at :269. TRUE.
  - Index: "/v1 routes" is FALSE for one tool. list_deployments calls GET /deployments (tools.js:285), and the rollback page itself shows that route.
- Verdict: OBJECT (minor: every R1 item is answered, but two sentences are still literally false)
- Requested change:
  1. On setup, change "only the key has no default" to "only the key is required".
  2. On index, change "and /v1 routes" to "and its routes (mostly /v1)".
  3. Optional: on deploy, add a cite for the 40 log lines (tools.js:26).
