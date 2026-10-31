# Critic: Inclusion (Mace), run 2 R0

- Anchor used: Mace et al., The Principles of Universal Design: P4 Perceptible Information ("redundancy of presentation" across sensory modes), P5 Tolerance for Error, P7 Size and Space for Approach and Use.
- Observed: site/style.css; index.html served on localhost:8765 at the browser pane's default viewport, focus moved by 9 real Tab presses. The focused element was the "0 · Set up" tile: it matched :focus-visible and showed a 3px solid amber (#fbbf24) outline with a 3px offset, which was visible in the screenshot. The `.wire` (z-index 2) crosses the left and right edges of the ring for 6px. Chip targets: min-height 26px, gap 2px. Phone nav (375): 14px text with 6px padding, about 34px tall, 14px apart. The `prefers-reduced-motion` rule removes the `.wire::after` animation. The `forced-colors` block covers the wire, the brand mark and the kind marks only. The current nav page is marked by `color` plus an inset `box-shadow`.
- Findings:
  - F1 [defect] In forced colours, `box-shadow` is set to none and link colour is forced, so the current-page cue (`aria-current`) disappears on all 6 inner pages. P4 lost its second channel.
  - F2 [defect] In forced colours, `.btn` loses its fill and `.btn.ghost` loses its inset box-shadow outline, so the primary actions lose the shape that marks them as buttons (P4, P7).
  - F3 [claim] Focus visibility passes after a real Tab press. The ring is only partly crossed by the wire, not hidden.
  - F4 [claim] WCAG 2.5.8 passes: chips are 26px tall and nav links about 34px. The evidence file reports 0 undersized adjacent targets.
  - F5 [premise] The conductor did not supply a forced-colours screenshot. F1 and F2 come from reading the CSS, not from rendering.
- Verdict: OBJECT
- Requested change: F1: in `@media (forced-colors: active)`, give `.bar nav a[aria-current]` a `text-decoration: underline 2px` or `border-bottom: 2px solid CanvasText`. F2: give `.btn` and `.btn.ghost` `border: 1px solid ButtonText` there. F3–F5: none. Then capture one forced-colours screenshot as evidence.
