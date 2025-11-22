/**
 * Tool: Get Project Data
 * Get complete project data including all tasks and columns
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { OAUTH_CONSTANTS } from "../../config.js";

export const registerGetProjectData: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "get_project_data",
        {
            title: "Get Project Data",
            description: "Get complete project data including the project details, all tasks, and columns (for kanban view). This provides a comprehensive view of the entire project content.",
            inputSchema: {
                projectId: z.string().describe("The unique ID of the project to retrieve data for"),
            },
            outputSchema: {
                project: z.object({
                    id: z.string(),
                    name: z.string(),
                    color: z.string().optional(),
                    closed: z.boolean().optional(),
                    groupId: z.string().optional(),
                    viewMode: z.enum(["list", "kanban", "timeline"]).optional(),
                    permission: z.enum(["read", "write", "comment"]).optional(),
                    kind: z.enum(["TASK", "NOTE"]).optional(),
                    sortOrder: z.number().optional(),
                }),
                tasks: z.array(z.object({
                    id: z.string(),
                    projectId: z.string(),
                    title: z.string(),
                    content: z.string().optional(),
                    desc: z.string().optional(),
                    isAllDay: z.boolean().optional(),
                    startDate: z.string().optional(),
                    dueDate: z.string().optional(),
                    timeZone: z.string().optional(),
                    repeatFlag: z.string().optional(),
                    priority: z.number().optional(),
                    status: z.number().optional(),
                    sortOrder: z.number().optional(),
                    items: z.array(z.any()).optional(),
                })).optional(),
                columns: z.array(z.object({
                    id: z.string(),
                    projectId: z.string(),
                    name: z.string(),
                    sortOrder: z.number().optional(),
                })).optional(),
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
                const response = await fetch(`${OAUTH_CONSTANTS.API_BASE_URL}/open/v1/project/${projectId}/data`, {
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

                const projectData = await response.json();

                return {
                    content: [{ type: "text", text: JSON.stringify(projectData, null, 2) }],
                    structuredContent: projectData as Record<string, unknown>,
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
                    content: [{ type: "text", text: `Failed to get project data: ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
