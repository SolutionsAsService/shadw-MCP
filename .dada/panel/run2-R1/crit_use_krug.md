# Critic: Usability (Krug), run 2 R1

- Anchor used: Krug, *Don't Make Me Think*: five-second test, trunk test, "make it obvious what's clickable", get rid of half the words.
- Observed: index-1280.png, index-375.png, keys-1280.png, deploy-1280.png; site/keys.html line 33; git ls-tree b1620b0; evidence file; DESIGN-LOG "Resolutions (R0)".
- Findings:
  - F1 [claim] Five-second test passes: headline plus MCP line; "Set it up →" in the first screen at 1280 and 375.
  - F2 [claim] R0 F2 answered: stage-card tool names are underlined, so they read as links; squares read as a legend key.
  - F3 [claim] Trunk test on deploy.html passes: site ID, "2 · DEPLOY", headline, aria-current underline on Deploy.
  - F4 [defect] R0 F5 not answered: keys.html lede repeats its headline ("give the agent the lowest that works") and the create_api_key card ("refuses a role above the creating key's") on one screen.
  - F5 [claim] R0 F6 answered per evidence: root holds index.html, vercel.json, site/, _src/, server/, docs; detector says `static`.
  - F6 [premise] "600" stays loudest; deferred as frozen, accepted for a Polish run.
- Verdict: OBJECT
- Requested change: F4 cut the lede to the four role names and the citations; drop "give the agent the lowest that works" and "A key cannot mint a role above its own" (headline and card say them). Others none.
