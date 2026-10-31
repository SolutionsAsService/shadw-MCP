# Critic: Evidence (Cairo), R1

- Anchor used: Cairo, How Charts Lie / The Truthful Art: every figure is traceable, and nothing misleads by omission.
- Observed (build gives 15 tools 9/5/1; `npm test` 7/7 pass):
  - 15 tools, 9/5/1: TRUE (tools.js:115-116; :164 is the only destructiveHint).
  - 4 roles, default member: TRUE (tools.js:140). 7 tests: TRUE.
  - 1 key to set, 6 env vars: TRUE (client.js:19-24). No key means only platform_status works: TRUE (cli.js:6).
  - 600 s default, 3600 max, 40 log lines: TRUE (tools.js:185, :26).
  - 3 verdicts: TRUE (tools.js:93), but the page omits two cases. An unknown project returns an error (tools.js:66). Unreadable logs give "degraded" (tools.js:89).
  - "1 call to roll back": OVERSTATED. rollback.html says "List … then promote", which is 2 calls. The code has no notion of "last good".
  - FALSE: list_deployments params render as "project default 50". The source has project optional and limit default 50 (tools.js:282), so limit is dropped.
  - "HTTP 403" (index): UNTRACEABLE. Only tools.js:137 is relevant, and it names no status code.
  - SHADW_TEAM default "inferred from the key": UNTRACEABLE. The code default is null and no header is sent (client.js:23, :41).
  - health "degraded" cites :85, but the 5xx push is at :87.
  - Matrix: TRUTHFUL. It uses colour plus shape (outline, filled, slashed). The legend uses the same classes (style.css:68-70). Its 15 cells match 9/5/1.
- Verdict: OBJECT
- Requested change:
  1. Fix the param renderer in _src/build.mjs.
  2. Change the rollback figure to "2 calls" (list, promote), or state that it assumes a known id. Drop "last good".
  3. Cite or delete "HTTP 403". Make the SHADW_TEAM default "none (key's own team)".
  4. On health.html, add the unknown-project error and the unreadable-logs case, and re-point :85 to :87.
