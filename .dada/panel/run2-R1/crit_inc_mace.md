# Critic: Inclusion (Mace), run 2 R1

- Anchor used: Mace et al., The Principles of Universal Design: P4 Perceptible Information (redundant presentation, so a cue survives a change of mode) and P7 Size and Space for Approach and Use.
- Observed: `git diff fef13d3 b1620b0 -- site/style.css`, which shows the forced-colours block at lines 165-167 and the chip underline at line 68. `index-1280-forced.png` shows "Set it up" with a border. `setup-1280-forced.png` shows "Set up" underlined as the current page. The evidence reports 0 undersized adjacent targets on 8 pages at both widths. The focus rule at line 25 (3px amber outline, 3px offset) has not changed since R0.
- Findings:
  - F1 [claim] My R0 F1 is answered. `aria-current` has a 2px underline in forced colours, and the capture shows it.
  - F2 [claim] My R0 F2 is answered. `.btn` and `.btn.ghost` have a `ButtonText` border, and the capture shows the button shape.
  - F3 [claim] The kind squares keep shape as the second channel in forced colours: outline for read-only, filled for write, slashed for destructive (capture and legend).
  - F4 [claim] WCAG 2.5.8 passes: chips have `min-height: 26px` and the probe found 0 undersized targets.
  - F5 [premise] I made no new real Tab press in R1. The focus pass rests on R0's Tab test, and the focus CSS has not changed since.
  - F6 [defect] Minor: the new chip underline is coloured `var(--line)`, a faint link cue in normal mode. The kind square and the code face still carry it.
- Verdict: PASS
- Requested change: F6: optionally give the underline `var(--mute)` or `currentColor`. F1-F5: none.
