# R1 Critic: Inclusion (Holmes)

- Anchor used: Kat Holmes, Mismatch. Exclusion is a mismatch between a person and the design. Solve for one person (a screen-reader user, a newcomer) and the fix extends to many (people on a phone in a hurry, non-native readers).

- Observed:
  - Newcomers: index.html never says what MCP is. The term appears only in the meta description. "verdicts" (stage 3) and "promote an earlier deployment" (stage 4) have no gloss, and "mint" appears on Keys. These are idioms where plain verbs would do.
  - Screen readers: each relay card is one `<a>` that wraps step, number, unit, sub and a nested chip `<ul>`. Its link name becomes one long run-on string ("2 · Deploy 600 seconds it waits... deploy build_status cancel_build"). `div.matrix` and `span.grp` have aria-label but no role, so most readers drop the labels and announce 15 links with no grouping. The tools.html kicker "· · Tools" is read aloud as "dot dot Tools".
  - Done well: the tool kinds use shape as well as colour (style.css:67-70). Reduced motion stops the wire animation (style.css:152). There is a skip link and focus outlines, and nothing overflows at 375 px. The 375 screenshot shows a usable stacked relay.
  - index-1280.png shows the page tiled four times, so the desktop layout cannot be checked from it.

- Verdict: OBJECT

- Requested change:
  1. Under the h1, add: "MCP lets an AI assistant use tools; this server gives it 15 for Shadw."
  2. Gloss jargon at first use: promote = make an earlier deployment live again; verdict = healthy, degraded or down.
  3. Label each relay link with aria-labelledby (step and unit only) and move the chip list outside the `<a>`.
  4. Add role="group" to `.matrix` and to each `.grp`.
  5. Replace "· · Tools" with plain text.
  6. Recapture index-1280.png.
