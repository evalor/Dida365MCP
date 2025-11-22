/**
 * Central registry for all MCP tools
 * Import and export all tool registration functions
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "./types.js";

// Import auth tools
import { registerGetAuthUrl } from "./auth/get-auth-url.js";
import { registerCheckAuthStatus } from "./auth/check-auth-status.js";
import { registerRevokeAuth } from "./auth/revoke-auth.js";

// Import project management tools
import { registerListProjects } from "./project/list-projects.js";
import { registerGetProject } from "./project/get-project.js";
import { registerGetProjectData } from "./project/get-project-data.js";
import { registerCreateProject } from "./project/create-project.js";
import { registerUpdateProject } from "./project/update-project.js";
import { registerDeleteProject } from "./project/delete-project.js";

// Import task management tools
import { registerCreateTask } from "./task/create-task.js";
import { registerGetTask } from "./task/get-task.js";
import { registerUpdateTask } from "./task/update-task.js";
import { registerDeleteTask } from "./task/delete-task.js";
import { registerCompleteTask } from "./task/complete-task.js";

/**
 * Register all tools with the MCP server
 * @param server - MCP server instance
 * @param context - Tool context with shared dependencies
 * @param readOnly - If true, only register read-only tools (hide write/delete operations)
 */
export function registerAllTools(server: McpServer, context: ToolContext, readOnly: boolean = false): void {
    // Register OAuth/Authentication tools (always available)
    // Note: revoke_auth only clears local tokens, doesn't modify remote data
    registerGetAuthUrl(server, context);
    registerCheckAuthStatus(server, context);
    registerRevokeAuth(server, context);

    // Register Project management tools
    registerListProjects(server, context);  // Read-only
    registerGetProject(server, context);    // Read-only
    registerGetProjectData(server, context); // Read-only

    // Write/Delete operations - only register in writable mode
    if (!readOnly) {
        registerCreateProject(server, context);
        registerUpdateProject(server, context);
        registerDeleteProject(server, context);
    }

    // Register Task management tools
    registerGetTask(server, context);  // Read-only

    // Write/Delete operations - only register in writable mode
    if (!readOnly) {
        registerCreateTask(server, context);
        registerUpdateTask(server, context);
        registerDeleteTask(server, context);
        registerCompleteTask(server, context);
    }
}
