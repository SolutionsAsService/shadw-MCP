# R1 Critic: Inclusion (Mace)

- **Anchor used:** Mace's Universal Design: perceptible information, tolerance for error, low physical effort, size and space for approach and use, equitable use.

- **Observed:**
  - FOCUS VISIBILITY passes. Stage tiles, nav, buttons, legend and cite links get the `a:focus-visible` ring: 3px amber (#fbbf24), offset 3px, on #000. That is high contrast. On desktop the ring crosses the 4px wire in the 12px gap, but black still surrounds most of it. The `.cell:focus-visible` rule (0,2,0) beats `a:focus-visible` (0,1,1), so cells get a 3px #f4f4f5 ring at offset 2px. It shows on black, and white keeps it apart from the amber destructive cell. Minor: `.btn:focus-visible` sets border-radius 2px, so the 6px button changes shape when focused.
  - Size and space: the 24px desktop cells with 6px gaps pass. At ≤900px the cells are 18px with 4px gaps, so their centres are 22px apart. WCAG 2.5.8 needs a 24px circle around each target that does not overlap the next one, so these fail. This contradicts the evidence file's "0 targets under 24 px". The cells are also hard to tap on a phone, and the 15 cells add 15 tab stops before the Set up button.
  - Shape channel: outline means read, filled means write, slashed means destructive. This works without colour, and each cell carries screen-reader text naming its kind. Good.
  - Forced colors: `background-color` is forced to Canvas while borders become CanvasText. A write cell (pink fill) then looks the same as a read cell (outline only), so the matrix loses its meaning in High Contrast mode.
  - Reduced motion: the travelling highlight is removed (`display:none`). Good.

- **Verdict:** OBJECT

- **Requested change:**
  1. Fix forced colors. In `@media (forced-colors: active)`, give `.k-write.cell, .lg.k-write, .k-write.chip::before` and the destructive set `forced-color-adjust: none`. Fill write with `CanvasText`. Draw destructive as a `CanvasText`/`Canvas` slash.
  2. Fix the phone cells. At ≤900px either:
     - make each cell's hit area 24px with ≥24px between centres (wrapping to a second row is acceptable), or
     - turn the cells into non-link spans and make the whole matrix one link to tools.html.
  3. Fix the target probe so it measures 2.5.8 spacing between centres.
