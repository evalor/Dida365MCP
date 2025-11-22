/**
 * Tool: Update Task
 * Update an existing task
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { OAUTH_CONSTANTS } from "../../config.js";

// ChecklistItem schema for sub-tasks
const ChecklistItemSchema = z.object({
    title: z.string().describe("Sub-task title"),
    startDate: z.string().optional().describe("Start time, format yyyy-MM-dd'T'HH:mm:ssZ"),
    isAllDay: z.boolean().optional().describe("Is all-day, default false"),
    sortOrder: z.number().optional().describe("Sort order number"),
    timeZone: z.string().optional().describe("Time zone"),
    status: z.number().optional().describe("Status: 0=normal, 1=completed"),
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
                        status?: number;
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

                // Get valid access token
                const accessToken = await context.oauthManager.getValidAccessToken();

                // Build request body - must include id and projectId
                const requestBody: Record<string, unknown> = {
                    id: taskId.trim(),
                    projectId: projectId.trim(),
                };

                // Add optional fields
                if (title !== undefined) requestBody.title = title;
                if (content !== undefined) requestBody.content = content;
                if (desc !== undefined) requestBody.desc = desc;
                if (isAllDay !== undefined) requestBody.isAllDay = isAllDay;
                if (startDate !== undefined) requestBody.startDate = startDate;
                if (dueDate !== undefined) requestBody.dueDate = dueDate;
                if (timeZone !== undefined) requestBody.timeZone = timeZone;
                if (reminders !== undefined) requestBody.reminders = reminders;
                if (repeatFlag !== undefined) requestBody.repeatFlag = repeatFlag;
                if (priority !== undefined) requestBody.priority = priority;
                if (sortOrder !== undefined) requestBody.sortOrder = sortOrder;
                if (items !== undefined) requestBody.items = items;

                // Make API request
                const response = await fetch(`${OAUTH_CONSTANTS.API_BASE_URL}/open/v1/task/${taskId}`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(requestBody),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(
                        `Failed to update task: ${response.status} ${response.statusText} - ${errorText}`
                    );
                }

                const task = await response.json();

                return {
                    content: [{
                        type: "text",
                        text: `Task updated successfully!\n\n${JSON.stringify(task, null, 2)}`
                    }],
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
                    content: [{ type: "text", text: `Failed to update task: ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
