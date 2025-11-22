/**
 * Tool: Get Task
 * Get details of a specific task
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { OAUTH_CONSTANTS } from "../../config.js";

export const registerGetTask: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "get_task",
        {
            title: "Get Task",
            description: "Get detailed information about a specific task in a project. Returns the complete task details.",
            inputSchema: {
                projectId: z.string().describe("Project ID (required)"),
                taskId: z.string().describe("Task ID (required)"),
            },
            outputSchema: {
                id: z.string(),
                projectId: z.string(),
                title: z.string(),
                content: z.string().optional(),
                desc: z.string().optional(),
                isAllDay: z.boolean().optional(),
                startDate: z.string().optional(),
                dueDate: z.string().optional(),
                completedTime: z.string().optional(),
                timeZone: z.string().optional(),
                priority: z.number().optional(),
                status: z.number().optional(),
                sortOrder: z.number().optional(),
                reminders: z.array(z.string()).optional(),
                repeatFlag: z.string().optional(),
                items: z.array(z.any()).optional(),
                kind: z.string().optional(),
            },
        },
        async (args) => {
            try {
                const { projectId, taskId } = args as {
                    projectId: string;
                    taskId: string;
                };

                // Validate required fields
                if (!projectId || typeof projectId !== "string" || projectId.trim() === "") {
                    throw new Error("projectId is required and must be a non-empty string");
                }
                if (!taskId || typeof taskId !== "string" || taskId.trim() === "") {
                    throw new Error("taskId is required and must be a non-empty string");
                }

                // Get valid access token
                const accessToken = await context.oauthManager.getValidAccessToken();

                // Make API request
                const response = await fetch(
                    `${OAUTH_CONSTANTS.API_BASE_URL}/open/v1/project/${projectId.trim()}/task/${taskId.trim()}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(
                        `Failed to get task: ${response.status} ${response.statusText} - ${errorText}`
                    );
                }

                const task = await response.json();

                return {
                    content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
                    structuredContent: task as Record<string, unknown>,
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
                    content: [{ type: "text", text: `Failed to get task: ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
