# Critic: Usability (Krug), run 2 R0

- Anchor used: Krug, *Don't Make Me Think*: five-second test, trunk test, "make it obvious what's clickable", "get rid of half the words".
- Observed: index-1280.png, index-375.png, keys-1280.png; site/index.html, site/keys.html; evidence file.
- Findings:
  - F1 [claim] Five-second test passes: the headline and MCP line say what it is; "Set it up →" sits in the first screen at 1280 and 375.
  - F2 [defect] Stage-card tool links (whoami, logs, list_deployments...) carry hollow squares that read as unticked checkboxes, not links.
  - F3 [defect] The biggest thing on screen is "600", a default timeout; the numerals make the visitor decode before reading what each stage does.
  - F4 [claim] Trunk test on keys.html passes: site ID, page name, sections, aria-current underline on Keys; no search, fine for 8 pages.
  - F5 [defect] keys.html lead paragraph repeats the create_api_key card (returned once, lowest role) on the same screen.
  - F6 [premise] Evidence: the site did not deploy to Shadw (root package.json "start" script). No visitor can test a page that is not live.
- Verdict: OBJECT
- Requested change: F2 give the links a link affordance (underlined name; kind as a dot or word, not a checkbox square). F3 none (structure frozen). F5 cut the repeat from the lead or the card. F6 move package.json and src/ out of the root per the owner's static-root rule. F1, F4 none.
