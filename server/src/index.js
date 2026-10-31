// shadw-mcp: an MCP server that lets agents deploy to Shadw and watch project health with a
// Shadw API key. Config: SHADW_API_KEY, SHADW_API_URL, SHADW_TEAM. Entry point: ./cli.js.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ShadwClient, resolveConfig } from "./client.js";
import { registerTools } from "./tools.js";

export const VERSION = "0.1.0";

export function createServer(client = new ShadwClient(resolveConfig()), opts = {}) {
  const server = new McpServer({ name: "shadw", version: VERSION });
  registerTools(server, client, opts);
  return server;
}

export { ShadwClient, resolveConfig };
