# Evidence, run 2 (Polish), round R1: judging the R0 fixes

Artifact: `D:\New folder\PrometheusIntelligence\shadw-MCP\` at commit b1620b0 (local; it will be pushed after this
round). What changed since R0 is in `DESIGN-LOG.md`, "Resolutions (R0)" and moves M7, M8, M9. Your R0 verdict is in
`.dada/panel/run2-R0/<your seat>.md`: judge whether it was answered, then judge the site again.

Deploy, measured (not assumed): a throwaway crate ran Shadw's own detector, `fluid_build::framework::detect` from
PrometheusIntelligence/shadow at 2522715 (`crates/fluid-build/src/framework.rs:648`), on both layouts:
- commit fef13d3 (server package at the root, `"start": "node src/cli.js"`) -> `node`
- commit b1620b0 (server in `server/`; root: `index.html`, `vercel.json`, `site/`, `_src/`, docs) -> `static`
The root `vercel.json` sets `outputDirectory: "site"`; `site/vercel.json` sets `"."`. The detector source is public at
https://github.com/PrometheusIntelligence/shadow/blob/2522715/crates/fluid-build/src/framework.rs (lines 668-761).

Measured by `_src/measure.mjs` after the last edit, its probes having passed `--selftest` (six of six caught):
- Landing hero complete: 1280 bottom 782/800; 375 bottom 710/812. Overflow 0, low-contrast text 0, undersized adjacent
  targets 0, shown `[hidden]` 0 on all 8 pages at both widths.
- Forced colours (new capture): `index-1280-forced.png`, `setup-1280-forced.png`.
- `server/` tests: `cd server && npm test`, 7 of 7 pass. The build prints 15 tools (9 / 5 / 1).
- Every number in the site's text outside code is a computed figure in `site/facts.json` or a step label (0 to 4).
Screenshots (all opened by the conductor, none tiled): `.dada/panel/run2-R1/*.png`.
