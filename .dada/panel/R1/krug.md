# R1 · Critic: Usability (Krug)

- **Anchor used:** Krug, *Don't Make Me Think*: five-second test, trunk test, "make it obvious what's clickable", omit needless words.

- **Observed:**
  - Five-second test, index-1280.png: site ID "shadw-MCP" top left; headline "Give an agent a Shadw key. It deploys, watches and rolls back." Topics are readable from the nav and stage labels: Set up, Keys, Deploy, Health, Roll back, Tools. The audience (agent builders) comes through. But the words "MCP server" appear nowhere on the first screen; they are only in the meta description in index.html. A developer who doesn't know Shadw has to infer from the brand suffix that this is something you install into a client.
  - First action: the only install cue is a small `npm install` in card 0 at 1280. In index-375.png it is gone completely, and the screen ends at "all 15 tools →". The real CTA, "Set it up", sits below the fold in index.html. The five cards are `<a>` elements, but they render as stat panels and don't look clickable. The big numerals (1 / 4 / 600 / 3 / 1) make the visitor decode them before acting.
  - Trunk test, setup-1280.png: passes. It has the site ID, the page name ("0 · SET UP" plus the h1), an underlined current nav item (`aria-current`), and numbered sections (Make a key, Install, Register it). There is no search, which is acceptable at 8 pages. Weakness: the `claude mcp add …` command is clipped at the right edge, so the key line can't be read at a glance. tools.html is also correct (aria-current on Tools, h2 per stage).

- **Verdict:** OBJECT

- **Requested change:**
  1. Under the h1, add one plain line: "An MCP server for Claude Code and other MCP clients." It can replace nothing; it is the missing noun.
  2. Put a visible primary button "Set it up →" (to setup.html) on the first screen at both 1280 and 375, next to "all 15 tools →".
  3. Wrap the setup command block, or break it across lines, so the whole `claude mcp add` line shows without scrolling.
