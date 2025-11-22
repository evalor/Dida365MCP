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
 */
export function registerAllTools(server: McpServer, context: ToolContext): void {
    // Register OAuth/Authentication tools
    registerGetAuthUrl(server, context);
    registerCheckAuthStatus(server, context);
    registerRevokeAuth(server, context);

    // Register Project management tools
    registerListProjects(server, context);
    registerGetProject(server, context);
    registerGetProjectData(server, context);
    registerCreateProject(server, context);
    registerUpdateProject(server, context);
    registerDeleteProject(server, context);

    // Register Task management tools
    registerCreateTask(server, context);
    registerGetTask(server, context);
    registerUpdateTask(server, context);
    registerDeleteTask(server, context);
    registerCompleteTask(server, context);
}
