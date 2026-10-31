# Critic: Provocateur (Debord), run 2 R0

- Anchor used: Debord, The Society of the Spectacle, thesis 1 (what was lived has moved away into a representation) and thesis 4 (a social relation mediated by images).
- Observed: root `package.json` `"start": "node src/cli.js"` (evidence: this picks Shadw's node preset); `site/*.html` canonical/OG point at `https://shadw-mcp.shadw.app/`; footer on all 8 pages; `setup.html` lede; `tools.html` test line; `test/server.test.js`; `src/tools.js:132`; `site/facts.json`.
- Findings:
  - F1 [defect] The canonical/OG address names a live site that does not exist: the root `start` script makes Shadw build a stdio server, so the site is only an image of a deploy.
  - F2 [claim] Footer, all pages: "Every number on this site is computed from the source". `facts.json` has no 30000, `1h`, HTTP 500 or 10 s probe. Those are typed in by hand.
  - F3 [claim] `setup.html` says "One key, one command", then shows three: clone, `npm install`, `claude mcp add`.
  - F4 [claim] `tools.html` says "7 tests drive these tools". The tests call about 10 of the 15. `shadw_list_api_keys`, `shadw_cancel_build`, `shadw_project` and `shadw_redeploy_project` are never called.
  - F5 [claim] The tool text "A key cannot exceed its creator's role" (src/tools.js:132, shown on keys and tools pages) states Shadw server policy as fact. The repo cannot back it, and `index.html` itself says the server decides.
  - F6 [claim] Rollback "at once" / "instant": only a POST is shown. The server's speed is not something this repo can show.
- Verdict: OBJECT
- Requested change: F1 move `package.json`, `src/`, `test/` and lockfile into a subfolder so the root is static only. F2 either add the hand-typed numbers to `facts.json` or narrow the footer to "counts". F3 say "three commands". F4 say "7 tests cover 10 of 15 tools", or add tests for the rest. F5 mark it "Shadw enforces (server-side)" or drop it. F6 drop "at once"/"instant", or cite the server.
