/**
 * Tool: Update Task
 * Update an existing task
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { updateTask } from "../../api/index.js";

// ChecklistItem schema for sub-tasks
const ChecklistItemSchema = z.object({
    title: z.string().describe("Sub-task title"),
    startDate: z.string().optional().describe("Start time, format yyyy-MM-dd'T'HH:mm:ssZ"),
    isAllDay: z.boolean().optional().describe("Is all-day, default false"),
    sortOrder: z.number().optional().describe("Sort order number"),
    timeZone: z.string().optional().describe("Time zone"),
    status: z.number().describe("Status: 0=normal, 1=completed"),
    completedTime: z.string().optional().describe("Completed time, format yyyy-MM-dd'T'HH:mm:ssZ"),
});

export const registerUpdateTask: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "update_task",
        {
            title: "Update Task",
            description: "Update an existing task with new information. Returns the updated task details.",
            inputSchema: {
                taskId: z.string().describe("Task ID (required)"),
                projectId: z.string().describe("Project ID (required)"),
                title: z.string().optional().describe("Task title (optional)"),
                content: z.string().optional().describe("Task content (optional)"),
                desc: z.string().optional().describe("Task description (optional)"),
                isAllDay: z.boolean().optional().describe("Is all-day task (optional)"),
                startDate: z.string().optional().describe("Start time, format yyyy-MM-dd'T'HH:mm:ssZ (optional)"),
                dueDate: z.string().optional().describe("Due time, format yyyy-MM-dd'T'HH:mm:ssZ (optional)"),
                timeZone: z.string().optional().describe("Time zone (optional)"),
                reminders: z.array(z.string()).optional().describe("Reminder list (optional)"),
                repeatFlag: z.string().optional().describe("Repeat rule (optional)"),
                priority: z.number().optional().describe("Priority: 0=none, 1=low, 3=medium, 5=high (optional)"),
                sortOrder: z.number().optional().describe("Sort order number (optional)"),
                items: z.array(ChecklistItemSchema).optional().describe("Sub-task list (optional)"),
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
                items: z.array(ChecklistItemSchema).optional(),
                kind: z.string().optional(),
            },
        },
        async (args) => {
            try {
                const {
                    taskId,
                    projectId,
                    title,
                    content,
                    desc,
                    isAllDay,
                    startDate,
                    dueDate,
                    timeZone,
                    reminders,
                    repeatFlag,
                    priority,
                    sortOrder,
                    items,
                } = args as {
                    taskId: string;
                    projectId: string;
                    title?: string;
                    content?: string;
                    desc?: string;
                    isAllDay?: boolean;
                    startDate?: string;
                    dueDate?: string;
                    timeZone?: string;
                    reminders?: string[];
                    repeatFlag?: string;
                    priority?: number;
                    sortOrder?: number;
                    items?: Array<{
                        title: string;
                        startDate?: string;
                        isAllDay?: boolean;
                        sortOrder?: number;
                        timeZone?: string;
                        status: number;
                        completedTime?: string;
                    }>;
                };

                // Validate required fields
                if (!taskId || typeof taskId !== "string" || taskId.trim() === "") {
                    throw new Error("taskId is required and must be a non-empty string");
                }
                if (!projectId || typeof projectId !== "string" || projectId.trim() === "") {
                    throw new Error("projectId is required and must be a non-empty string");
                }

                // Build request data
                const requestData = {
                    id: taskId.trim(),
                    projectId: projectId.trim(),
                    ...(title !== undefined && { title }),
                    ...(content !== undefined && { content }),
                    ...(desc !== undefined && { desc }),
                    ...(isAllDay !== undefined && { isAllDay }),
                    ...(startDate !== undefined && { startDate }),
                    ...(dueDate !== undefined && { dueDate }),
                    ...(timeZone !== undefined && { timeZone }),
                    ...(reminders !== undefined && { reminders }),
                    ...(repeatFlag !== undefined && { repeatFlag }),
                    ...(priority !== undefined && { priority }),
                    ...(sortOrder !== undefined && { sortOrder }),
                    ...(items !== undefined && { items }),
                };

                // Use API layer to update task
                const task = await updateTask(taskId.trim(), requestData);

                return {
                    content: [
                        { type: "text", text: `Task updated successfully!` },
                        { type: "text", text: JSON.stringify(task) },
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
                    content: [{ type: "text", text: `Failed to update task: ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
