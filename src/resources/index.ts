/**
 * Central registry for all MCP resources
 * Import and export all resource registration functions
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerTerminologyResource } from "./terminology.js";

/**
 * Register all resources with the MCP server
 * @param server - MCP server instance
 */
export function registerAllResources(server: McpServer): void {
    // Register terminology glossary resource for Chinese-English mappings
    registerTerminologyResource(server);
}
