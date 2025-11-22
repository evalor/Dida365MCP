/**
 * Common types for MCP tool registration
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OAuthManager } from "../oauth.js";

/**
 * Context passed to tool registration functions
 */
export interface ToolContext {
    /** OAuth Manager instance for authentication operations */
    oauthManager: OAuthManager;
}

/**
 * Tool registration function signature
 * Each tool module exports a function that accepts the MCP server and context
 */
export type ToolRegistrationFunction = (
    server: McpServer,
    context: ToolContext
) => void;
