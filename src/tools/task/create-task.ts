/**
 * Tool: Create Task
 * Create a new task in a project
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { createTask } from "../../api/index.js";

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

export const registerCreateTask: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "create_task",
        {
            title: "Create Task",
            description: "Create a new task in the specified project. Returns the created task details including the generated task ID.",
            inputSchema: {
                title: z.string().describe("Task title (required)"),
                projectId: z.string().describe("Project ID (required)"),
                content: z.string().optional().describe("Task content (optional)"),
                desc: z.string().optional().describe("Task description (optional)"),
                isAllDay: z.boolean().optional().describe("Is all-day task, default false (optional)"),
                startDate: z.string().optional().describe("Start time, format yyyy-MM-dd'T'HH:mm:ssZ (optional)"),
                dueDate: z.string().optional().describe("Due time, format yyyy-MM-dd'T'HH:mm:ssZ (optional)"),
                timeZone: z.string().optional().describe("Time zone, e.g. America/Los_Angeles (optional)"),
                reminders: z.array(z.string()).optional().describe("Reminder list, e.g. ['TRIGGER:PT0S'] (optional)"),
                repeatFlag: z.string().optional().describe("Repeat rule, e.g. RRULE:FREQ=DAILY;INTERVAL=1 (optional)"),
                priority: z.number().optional().describe("Priority: 0=none, 1=low, 3=medium, 5=high (optional)"),
                sortOrder: z.number().optional().describe("Sort order number (optional)"),
                items: z.array(ChecklistItemSchema).optional().describe("Sub-task list (optional)"),
            },
            outputSchema: z.object({
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
                tags: z.array(z.string()).optional(),
                etag: z.string().optional(),
            }).passthrough(),
        },
        async (args) => {
            try {
                const {
                    title,
                    projectId,
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
                    title: string;
                    projectId: string;
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
                if (!title || typeof title !== "string" || title.trim() === "") {
                    throw new Error("title is required and must be a non-empty string");
                }
                if (!projectId || typeof projectId !== "string" || projectId.trim() === "") {
                    throw new Error("projectId is required and must be a non-empty string");
                }

                // TODO When a ProjectId is not passed in the parameters or the ID does not exist, the created task will appear in the inbox.

                // Build request data
                const requestData = {
                    title: title.trim(),
                    projectId: projectId.trim(),
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

                // Use API layer to create task
                const task = await createTask(requestData);

                return {
                    content: [
                        { type: "text", text: `Task created successfully!` },
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
                    content: [{ type: "text", text: `Failed to create task: ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
