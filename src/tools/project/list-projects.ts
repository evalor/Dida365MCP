/**
 * Tool: List Projects
 * Get all projects for the current user
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { listProjects } from "../../api/index.js";

export const registerListProjects: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "list_projects",
        {
            title: "List Projects",
            description: "Get all projects for the current user. Returns a list of all projects with their details including name, color, view mode, permissions, and status.",
            inputSchema: {},
            outputSchema: {
                projects: z.array(z.object({
                    id: z.string(),
                    name: z.string(),
                    color: z.string().optional(),
                    closed: z.boolean().optional(),
                    groupId: z.string().optional(),
                    viewMode: z.enum(["list", "kanban", "timeline"]).optional(),
                    permission: z.enum(["read", "write", "comment"]).optional(),
                    kind: z.enum(["TASK", "NOTE"]).optional(),
                    sortOrder: z.number().optional(),
                })),
                total: z.number(),
            },
        },
        async () => {
            try {
                // Use API layer to get projects
                const projects = await listProjects();

                const output = {
                    projects,
                    total: projects.length,
                };

                return {
                    content: [
                        { type: "text", text: `Projects List:` },
                        { type: "text", text: JSON.stringify(output) },
                    ],
                    structuredContent: output as Record<string, unknown>,
                };
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);

                // Check if it's an authorization error
                if (errorMsg.includes("401") || errorMsg.includes("Unauthorized") || errorMsg.includes("Authentication failed")) {
                    return {
                        content: [{
                            type: "text",
                            text: `Authorization failed: ${errorMsg}. Please use the 'get_auth_url' tool to re-authorize.`,
                            isError: true
                        }],
                        isError: true,
                    };
                }

                return {
                    content: [{ type: "text", text: `Failed to list projects: ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
