# Critic: Evidence (Cairo), run 2 R1

- Anchor used: Alberto Cairo, How Charts Lie. A figure is honest only if a reader can trace it to its source and get the same number.
- Observed: At b1620b0 I ran `npm test` in server/ (7 tests, 7 pass, 0 fail), `node _src/build.mjs` (8 pages, 15 tools, 9/5/1, site/ unchanged) and `node _src/measure.mjs` (hero 782/800 at 1280 and 710/812 at 375; overflow, targets, contrast and hidden all 0). All match the evidence. Source checks: 15 `registerTool` calls, tail 40 (tools.js:26), 600/3600 (tools.js:185), `<500` (tools.js:49), 30000 (client.js:24), x-hive-team (client.js:41). All hold. The root has no package.json. measure.mjs is committed in HEAD.
- Findings:
  - F1 [defect] R0 F1 answered: the server is in server/ and the root is static.
  - F2 [premise] R0 F2: the detector run (static vs node) is in the evidence, not the repo. I accept it as cited at 2522715. I did not rerun it.
  - F3 [claim] R0 F3 and F4 answered (index.html:74 links client.rs).
  - F4 [claim] Every cite link points at `blob/main#Lnn` (SolutionsAsService and dywongcloud). The overrule of R0 F5 holds for transfers, but line anchors on `main` drift as soon as anything is edited. Also, the evidence pins shadow at 2522715 while the site links an unpinned dywongcloud/main.
- Verdict: PASS
- Requested change: F4: have build.mjs pin cite links to the commit sha (and client.rs to a sha). Log it as an open item; it does not block delivery. F1 to F3: none.
