# R2 Critic: Provocateur (Debord)

- Anchor used: Society of the Spectacle, theses 1 and 4 (image replacing lived relation), and the smooth commodity surface that announces more than the thing does.

- Observed:
  - All four R1 objections are answered in the artifact. (1) The h1 now reads "deploys, checks and rolls back" (index-1280.png), and health.html says "a check you run, not a monitor: nothing runs between calls", which matches src/tools.js:59-93. (2) Roll back is now "2 calls: list deployments, then promote one" (index and rollback.html), which matches promote's required `id` (src/tools.js:306). (3) The 403 promise is gone: "decided by the Shadw server, not by this one". (4) index-1280.png is untiled, the nav is visible, and the hero ends at the legend.
  - Two small remaining smoothings. "600 seconds it waits for the build" reads as a fixed duration, but 600 is a cap (`timeout_seconds` default 600, max 3600, with a `timed_out` flag: src/tools.js:185, 192-195). The index band promises "/v1 routes", but `shadw_list_deployments` calls `GET /deployments` with no /v1 (src/tools.js:285). rollback.html prints that route honestly, so the band is the only place that says otherwise. "Promotes ... at once" on rollback.html relays Shadw's promise; it is not this code's.

- Verdict: PASS

- Requested change (non-blocking):
  1. Stage 2 sub-line: "seconds it waits at most (up to 3600), then returns state, URL, log tail".
  2. Index band: change "/v1 routes" to "mostly /v1 routes", or fix src/tools.js:285 to `/v1/deployments` if that is the real route. The site follows the source either way.
