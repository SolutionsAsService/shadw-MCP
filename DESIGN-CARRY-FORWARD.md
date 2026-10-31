# Carry-forward: facts this project's site established by measurement

Read before the next design run on this site.

- Headless Chrome started without `--window-size` larger than the emulated viewport can return a capture tiled 2 x 2
  on a later run, though the first run was clean. Measured: the second `index-1280.png` was tiled; adding
  `--window-size=1280,900` and a clipped `Page.captureScreenshot` fixed it. (R1)
- A WCAG 2.5.8 spacing probe must report undersized targets that *do* have a neighbour within 24 px. The first version
  had the filter inverted and reported 0 while 18 px cells sat at a 22 px pitch. (Mace R1; `_src/measure.mjs`)
- A contrast probe that walks text nodes must skip visually-hidden (`.sr`) text, or it measures the label against the
  cell behind it (1.96:1 false positives). (M2 measurement)
- Regex parsing of `src/tools.js` broke three ways: `annotations: { ... }` cut at the first comma (0 destructive
  tools); routes reached through helper functions (`waitForBuild`, `projectHealth`) or through a variable
  (`const q = `/v1/logs...``); and one-line `inputSchema` objects (a dropped `limit` parameter). The generator now
  balances braces and splits top-level commas. (M3, Cairo R1)
- An element with classes `chips start` is hidden by a phone rule for `.chips`; use `.chips:not(.start)`. (M5)
- `pre { white-space: pre-wrap }` placed only inside a media query leaves the desktop command clipped; put it in the
  base rule. (Krug R2)
- The relay's wire stays visible across the tiles only above the tile fill (`z-index: 2`) and only through the empty
  band under the step labels (y 45–51 at 1280). (Arnheim R1, M5)
