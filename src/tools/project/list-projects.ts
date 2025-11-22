/**
 * Tool: List Projects
 * Get all projects for the current user
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { OAUTH_CONSTANTS } from "../../config.js";

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
                // Get valid access token (automatically refreshes if needed)
                const accessToken = await context.oauthManager.getValidAccessToken();

                // Make API request
                const response = await fetch(`${OAUTH_CONSTANTS.API_BASE_URL}/open/v1/project`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`API request failed: ${response.status} ${errorText}`);
                }

                const projects = await response.json();

                const output = {
                    projects: Array.isArray(projects) ? projects : [],
                    total: Array.isArray(projects) ? projects.length : 0,
                };

                return {
                    content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
                    structuredContent: output as Record<string, unknown>,
                };
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);

                // Check if it's an authorization error
                if (errorMsg.includes("401") || errorMsg.includes("Unauthorized") || errorMsg.includes("token")) {
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
