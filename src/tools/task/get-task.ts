/**
 * Tool: Get Task
 * Get details of a specific task
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { getTask } from "../../api/index.js";

export const registerGetTask: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "get_task",
        {
            title: "Get Task",
            description: `Get detailed information about a specific task in a project. Returns the complete task details.

RESPONSE FIELDS:
- content: Task description for TEXT tasks (no sub-tasks)
- desc: Task description for CHECKLIST tasks (with sub-tasks/items)
- kind: Task type - "TEXT" (simple task), "CHECKLIST" (task with sub-tasks)
- items: Sub-task list (only present for CHECKLIST tasks)

NOTE: When creating/updating tasks, use the unified 'description' parameter which auto-maps to the correct field.`,
            inputSchema: {
                projectId: z.string().describe("Project ID (required)"),
                taskId: z.string().describe("Task ID (required)"),
            },
            outputSchema: z.object({
                id: z.string(),
                projectId: z.string(),
                title: z.string(),
                content: z.string().optional().describe("Task description for TEXT tasks"),
                desc: z.string().optional().describe("Task description for CHECKLIST tasks"),
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
                tags: z.array(z.string()).optional(),
                etag: z.string().optional(),
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

                // Use API layer to get task
                const task = await getTask(projectId.trim(), taskId.trim());

                return {
                    content: [
                        { type: "text", text: `Task retrieved successfully!` },
                        { type: "text", text: JSON.stringify(task) }
                    ],
                    structuredContent: task as unknown as Record<string, unknown>,
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
                    content: [{ type: "text", text: `Failed to get task: ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
