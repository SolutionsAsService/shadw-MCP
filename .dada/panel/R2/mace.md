# R2 Critic: Inclusion (Mace)

- **Anchor used:** Ronald Mace's Universal Design principles: perceptible information, size and space for approach and use, low physical effort, and tolerance for error.

- **Observed:**
  - **Focus visibility passes everywhere.** Every element uses the same `a:focus-visible` / `.btn:focus-visible` ring: 3px amber, offset 3px.
    - Nav links and the legend link: the ring sits on #000.
    - `.chip a` and the Set it up button: the ring sits on the #0b0b0e surface, at about 12:1 contrast. The button keeps a dark gap between the ring and its white fill.
    - `.tile` on desktop: the ring's sides and top fall in the 12px black gap.
    - `.tile` on the phone: the ring's right edge overlaps the button by about 6px. The rest of the ring stays on the surface.
    - Two small breaks in the tile ring: the wire (z-index 2) and the `.stage::before` dot (z-index 3) cut a 6–10px piece out of each side. Neither hides the ring.
  - **Phone targets:** the chips are `display:none`. What remains is the tile, the button (about 43px tall), nav links (about 34px tall, 14px gaps) and the legend link (about 30px). No small target is left. R1 item 2 is answered.
  - **Desktop chip targets:** rows are 26px tall and as wide as the column, with 2px gaps. That passes 2.5.8.
  - **Forced colors:** `forced-color-adjust: none` is set, and the kinds are drawn as Canvas outline (read), CanvasText fill (write) and CanvasText/Canvas slash (destructive). The kinds stay distinct. R1 item 1 is answered.
  - **Reduced motion:** the travelling highlight is still removed.

- **Verdict:** PASS

- **Requested change (non-blocking):**
  1. Drop `border-radius: 2px` from the `.btn:focus-visible` rule so the button keeps its 6px shape when focused.
  2. Optionally use `outline-offset: 1px` on `.chip a` so a focused row's ring does not reach into the rows next to it.
