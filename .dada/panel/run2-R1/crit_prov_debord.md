# Critic: Provocateur (Debord), run 2 R1

- Anchor used: Debord, The Society of the Spectacle, thesis 1 (the lived moved into representation) and thesis 4 (a relation mediated by images).
- Observed: root now `index.html`, `vercel.json`, `site/`, `_src/`, `server/` (evidence: detector -> `static`); `setup.html` "One key, three commands"; `tools.html` "7 tests call 7 of the 15 tools" (matches the 7 distinct `call("shadw_...")` in `server/test/server.test.js`); `keys.html` cites `hive-cloud/src/admin.rs:11995`; rollback.html no "instant"; `facts.json` adds 30000, 500; `server/src/tools.js:162`; footer on all 8 pages; `health.html` "default 1h; also 30m, 24h, 7d".
- Findings:
  - F1 [defect] R0 F1-F6 answered: static root measured, three commands, 7 of 15, server-attributed role rule, "at once" gone from rollback.
  - F2 [claim] `tools.js:162`, shown on keys.html and tools.html: revoking means "stops authenticating at once". Server timing again, the same species as R0 F6; the repo cannot show it.
  - F3 [claim] Footer "Every number ... computed ... facts.json": 0.1.0, 1h, 30m, 24h, 7d, 5xx are not in `facts.json` (the enum is at `tools.js:269`). The evidence's "every number" line overstates too.
- Verdict: OBJECT
- Requested change: F1 none. F2 drop "at once" ("Anything using it stops authenticating") or cite hive-cloud. F3 add the range enum and version to `facts.json`, or narrow the footer to "every count and limit".
