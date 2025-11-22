/**
 * Tool: Get Project
 * Get detailed information about a specific project
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { OAUTH_CONSTANTS } from "../../config.js";

export const registerGetProject: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "get_project",
        {
            title: "Get Project",
            description: "Get detailed information about a specific project by its ID. Returns project details including name, color, view mode, permissions, and status.",
            inputSchema: {
                projectId: z.string().describe("The unique ID of the project to retrieve"),
            },
            outputSchema: {
                id: z.string(),
                name: z.string(),
                color: z.string().optional(),
                closed: z.boolean().optional(),
                groupId: z.string().optional(),
                viewMode: z.enum(["list", "kanban", "timeline"]).optional(),
                permission: z.enum(["read", "write", "comment"]).optional(),
                kind: z.enum(["TASK", "NOTE"]).optional(),
                sortOrder: z.number().optional(),
            },
        },
        async (args) => {
            try {
                const { projectId } = args as { projectId: string };

                // Validate input
                if (!projectId || typeof projectId !== "string") {
                    throw new Error("projectId is required and must be a string");
                }

                // Get valid access token (automatically refreshes if needed)
                const accessToken = await context.oauthManager.getValidAccessToken();

                // Make API request
                const response = await fetch(`${OAUTH_CONSTANTS.API_BASE_URL}/open/v1/project/${projectId}`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    const errorText = await response.text();

                    if (response.status === 404) {
                        throw new Error(`Project not found: ${projectId}`);
                    }

                    throw new Error(`API request failed: ${response.status} ${errorText}`);
                }

                const project = await response.json();

                return {
                    content: [{ type: "text", text: JSON.stringify(project, null, 2) }],
                    structuredContent: project as Record<string, unknown>,
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
                    content: [{ type: "text", text: `Failed to get project: ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
