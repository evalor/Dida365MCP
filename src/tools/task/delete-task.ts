/**
 * Tool: Delete Task
 * Delete a task from a project
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { OAUTH_CONSTANTS } from "../../config.js";

export const registerDeleteTask: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "delete_task",
        {
            title: "Delete Task",
            description: "Delete a specific task from a project. This operation cannot be undone.",
            inputSchema: {
                projectId: z.string().describe("Project ID (required)"),
                taskId: z.string().describe("Task ID (required)"),
            },
            outputSchema: {
                success: z.boolean(),
                message: z.string(),
                taskId: z.string(),
                projectId: z.string(),
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
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(
                        `Failed to delete task: ${response.status} ${response.statusText} - ${errorText}`
                    );
                }

                // DELETE returns 200 with no body
                const output = {
                    success: true,
                    message: `Task ${taskId} has been deleted successfully.`,
                    taskId: taskId,
                    projectId: projectId,
                };

                return {
                    content: [{
                        type: "text",
                        text: `Task deleted successfully!\n\nTask ID: ${taskId}\nProject ID: ${projectId}`
                    }],
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
                    content: [{ type: "text", text: `Failed to delete task: ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
