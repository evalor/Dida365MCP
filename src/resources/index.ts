/**
 * Central registry for all MCP resources
 * Import and export all resource registration functions
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerTerminologyResource } from "./terminology.js";
import { registerICalendarFormatResource } from "./icalendar-format.js";

/**
 * Register all resources with the MCP server
 * @param server - MCP server instance
 */
export function registerAllResources(server: McpServer): void {
    // Register terminology glossary resource for Chinese-English mappings
    registerTerminologyResource(server);

    // Register iCalendar format reference resource for reminders and repeat rules
    registerICalendarFormatResource(server);
}
