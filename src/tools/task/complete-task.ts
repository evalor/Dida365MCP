/**
 * Tool: Complete Task
 * Mark a task as completed
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { completeTask } from "../../api/index.js";

export const registerCompleteTask: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "complete_task",
        {
            title: "Complete Task",
            description: "Mark a specific task as completed. The task status will be updated to completed.",
            inputSchema: {
                projectId: z.string().describe("Project ID (required)"),
                taskId: z.string().describe("Task ID (required)"),
            },
            outputSchema: z.object({
                taskId: z.string(),
                projectId: z.string(),
            }).passthrough(),
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

                // Use API layer to complete task
                await completeTask(projectId.trim(), taskId.trim());

                const output = {
                    taskId: taskId,
                    projectId: projectId,
                };

                return {
                    content: [
                        { type: "text", text: `Task completed successfully!` },
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
                    content: [{ type: "text", text: `Failed to complete task: ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
