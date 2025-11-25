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
            description: `Retrieve detailed information about a specific task (任务).

WHEN TO USE:
- View complete task details (title/标题, description/描述, dates/日期, priority/优先级)
- Check task status before updating or completing
- Verify a task exists

WHEN NOT TO USE:
- List multiple tasks → use 'list_tasks'
- Get all tasks in a project (清单) → use 'get_project_data' or 'list_tasks'

REQUIRED: projectId (清单ID), taskId (任务ID)

RESPONSE FIELDS:
- content: Description for TEXT tasks (no sub-tasks)
- desc: Description for CHECKLIST tasks (with sub-tasks/子任务)
- kind: "TEXT" or "CHECKLIST"
- items: Sub-task list (子任务列表, CHECKLIST only)

NOTE: When creating/updating, use unified 'description' parameter which auto-maps to the correct field.`,
            inputSchema: {
                projectId: z.string().describe("Project ID (清单ID, required)"),
                taskId: z.string().describe("Task ID (任务ID, required)"),
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
