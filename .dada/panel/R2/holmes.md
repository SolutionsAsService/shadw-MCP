# R2 Critic: Inclusion (Holmes)

- Anchor used: Kat Holmes, Mismatch. Exclusion is a mismatch between a person and the design. Solve for one person (a screen-reader user, a newcomer to MCP) and the fix extends to many.

- Observed:
  - R1 asks answered. index.html:33 now reads "An MCP server: it gives Claude Code, or any MCP client, 15 tools for Shadw.", and it is visible under the h1 in index-1280.png and index-375.png. Each tile `<a>` uses aria-labelledby step/num/unit (index.html:36-64), so the link name is short ("2 · Deploy 600 seconds it waits for the build"). The chips are a separate `<ul aria-label="Deploy tools">` with sr-only kind text (", write"). tools.html replaces the unlabelled groups with real `<h2>` stage headings (lines 34, 59, 78, 109), and its kicker is now "Reference". Verdict is glossed by its three values on the tile and on health.html:33. Promote is glossed on rollback.html:33 ("makes an earlier deployment the live (production) one again").
  - Small mismatches remain. The landing sub "list deployments, then promote one" (index.html:67) and "may mint another key" (index.html:75) are still idioms on the first page a newcomer sees. "MCP" itself is never expanded.
  - Nothing overflows and no undersized targets were measured. Kind is shown by shape as well as colour.

- Verdict: PASS

- Requested change (not blocking, log as open items):
  1. index.html:67: change "promote one" to "make an earlier one live again".
  2. index.html:75: change "mint" to "create".
  3. Optionally expand MCP once: "Model Context Protocol".
