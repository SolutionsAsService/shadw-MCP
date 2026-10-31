# Evidence, run 2 (Polish), round R0: premortem on the site as it stands

Artifact: `D:\New folder\PrometheusIntelligence\shadw-MCP\` at commit fef13d3 (the site in `site/`, built by
`_src/build.mjs` from `src/*.js`; repository root files: `package.json`, `package-lock.json`, `src/`, `test/`,
`index.html`, `vercel.json`, `site/`, `_src/`, `README.md`). Run 1 (the design) is in `DESIGN-LOG.md`.

The owner's report: the site **did not deploy to Shadw**. Facts from the Shadw build code (PrometheusIntelligence/shadow,
`crates/fluid-build/src/framework.rs`, read by the conductor):
- Framework detection order: Next.js adapters, config-file markers, then `package.json`: a dependency on a server
  framework, **or a `start` script** (framework.rs:749-755), or a `server.*` entry, selects the `node` preset
  (`Serverless`, dev command `npm start`, framework.rs:154-160). Only after all of that does it fall back to `static`.
- `vercel.json` `"framework": null` is read as "no override" (vercel_config.rs:19), so detection still runs.
- This repository's root `package.json` has `"start": "node src/cli.js"`, which runs the MCP server on stdio; it
  never listens on a port.
- The owner's deploy rules (from their instructions): the repository root holds only the static format
  (`index.html`, `vercel.json`, the committed site folder, optionally `api/`); a generator lives in a subfolder; a
  site's live address is `https://<repo-name>.shadw.app/` (here `https://shadw-mcp.shadw.app/`).

Measured by `_src/measure.mjs` after its probes passed `--selftest` (a page built to fail every probe; the first-screen
probe was corrected to measure against the emulated device size), at 1280x800 and 375x812, 8 pages:
- Landing hero complete: 1280 bottom 782/800; 375 bottom 710/812. Overflow 0, low-contrast text 0, undersized
  adjacent targets 0, shown `[hidden]` 0 on every page. Smallest text 11.7 px (stage labels, 1280).
- Screenshots (opened by the conductor before this round, none tiled): `.dada/panel/run2-R0/*.png`.
- Not present: `sitemap.xml`, `robots.txt`, structured data (JSON-LD). Present: canonical and Open Graph tags,
  `og.png`, `favicon.svg`, `site/facts.json`.

Run type Polish: the concept, the relay, the palette, type and page structure are frozen. Allowed: structure and
deploy fixes, claims, metadata, accessibility, performance.
