# R2 · Critic: Usability (Krug)

- **Anchor used:** Krug, *Don't Make Me Think*: five-second test, trunk test, obvious clickability, omit needless words.

- **Observed:**
  - R1 request 1 is met. index-1280 and index-375 both show "An MCP server: it gives Claude Code, or any MCP client, 15 tools for Shadw." directly under the h1.
  - R1 request 2 is met. A white "Set it up →" button (index.html:40) is above the fold at 1280 (card 0) and at 375 (first tile, right side). It is the only filled button, so it is obvious it can be clicked.
  - Five-second test passes. In five seconds a visitor gets the site name (shadw-MCP), what it is (an MCP server), who it is for (agents and Claude Code users), the next step (Set it up), and the topics (Keys, Deploy, Roll back).
  - Trunk test passes on setup-1280 and tools-1280. Each shows the site ID, a page kicker plus the h1, and an underlined current nav item.
  - R1 request 3 is NOT met at 1280. setup-1280 still clips the Claude Code command at "…/shadw-MCP/src/cli". The cause is in _src/style.css: `pre { white-space: pre-wrap }` (line 146) applies only inside the narrow media query, and the base rule (line 101) uses `overflow-x: auto`. On a desktop the most important line on the page needs a horizontal scroll to read.

- **Verdict:** OBJECT

- **Requested change:** Move `white-space: pre-wrap; overflow-wrap: anywhere;` into the base `pre` rule at _src/style.css:101, or break the `claude mcp add` command with a `\` continuation, so the whole command shows at 1280. Nothing else.
