# Evidence for panel round R2 (shadw-MCP site) — WHOLE round after move M5 and the S4 push

Artifact: `D:\New folder\PrometheusIntelligence\shadw-MCP\site\`, rebuilt by `node _src/build.mjs` (run it yourself if you
want). Stylesheet `_src/style.css`. What changed since R1 is in `DESIGN-LOG.md` ("Resolutions (R1)" and "Move M5").
Your own R1 verdict is in `.dada/panel/R1/<your seat>.md`: judge whether it was answered, and judge the whole site
again. Do not read other seats' files.

Screenshots (headless Chrome, device-metric emulation, the 1280 capture fixed and verified untiled) in
`.dada/panel/R2/`: `index-1280.png`, `index-375.png`, `<page>-1280.png` for every other page.

Measured by `_src/measure.mjs` after the last edit (raw: `.dada/measure/measure.json`):
- Landing hero (h1, MCP line, relay with in-register tool cells, legend): 1280x800 top 101, bottom 753, complete;
  375x812 top 109, bottom 686, complete (phone shows figure, step and unit per stage plus the Set it up button; each
  stage's tools are on its own page).
- Horizontal overflow 0 px on all 8 pages at 1280 and 375. Text below AA: 0 (probe skips screen-reader-only text).
- Targets under 24 px that have another target within 24 px (WCAG 2.5.8, probe corrected since R1): 0 on all pages.
- Figures: 15 tools (9 read-only / 5 write / 1 destructive), 4 roles, 600 s default wait (max 3600), 40 log lines,
  3 verdicts, 2 calls to roll back, 7 tests — each in `site/facts.json` with its procedure.
