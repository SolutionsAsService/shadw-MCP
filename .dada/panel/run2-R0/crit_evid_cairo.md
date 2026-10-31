# Critic: Evidence (Cairo), run 2 R0

- Anchor used: Alberto Cairo, How Charts Lie. A figure is only honest if a reader can trace it to its source and get the same number, and leaving cases out misleads as much as a bad scale does.
- Observed: I ran `npm test` (7 pass, 0 fail), `node _src/build.mjs` (8 pages, 15 tools, 9/5/1, no diff in site/) and `node _src/measure.mjs` (hero 782/800 at 1280 and 710/812 at 375; overflow, contrast, targets and hidden all 0; min text 11.7 px). These match the evidence file. I checked facts.json against the source: 15 `registerTool` calls, a role enum of 4, a timeout of 600/3600 (src/tools.js:185), tail 40 (tools.js:26) and 60 for build_status (tools.js:207), 6 `SHADW_*` env vars (client.js:19-24), 3 verdicts (tools.js:64) and the cli.js warning. All of them hold.
- Findings:
  - F1 [defect] Root `package.json` has `"start": "node src/cli.js"`. The owner's rule (evidence lines 15-16) says the root holds only the static format. The site does not deploy.
  - F2 [premise] The framework.rs lines 749-755 and 154-160 and vercel_config.rs:19 come from the conductor and are not in this artifact. I can't check them, but F1 stands on the owner's rule alone.
  - F3 [defect] `_src/measure.mjs` has uncommitted changes (`git status`: M). The evidence names commit fef13d3, so a reader who checks out that commit can't reproduce the measured figures.
  - F4 [claim] index.html:74 says it "sends the same requests as Dylan Wong's shadw CLI". Nothing in the repo cites that CLI's source, so a reader can't check it.
  - F5 [claim] facts.json `built_from` and the cite links point to SolutionsAsService/main. The repo is moving to PrometheusIntelligence, so these links will break.
- Verdict: OBJECT
- Requested change:
  - F1: move `package.json`, `package-lock.json`, `src/` and `test/` (the server) into a subfolder, or drop `start` from the root.
  - F2: none; log it as an open item.
  - F3: commit measure.mjs and cite the new commit in the evidence.
  - F4: link the CLI's client source, or soften the wording.
  - F5: switch to repo-relative or org-neutral links.
