#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer, ShadwClient, resolveConfig } from "./index.js";

const config = resolveConfig();
if (!config.token) console.error("shadw-mcp: SHADW_API_KEY is not set; only shadw_platform_status will work.");
await createServer(new ShadwClient(config)).connect(new StdioServerTransport());
