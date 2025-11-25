/**
 * Tool: Update Task
 * Update one or more existing tasks (supports batch operations)
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { updateTask } from "../../api/index.js";
import { batchExecute, formatBatchResults } from "../../utils/batch.js";
import type { Task, UpdateTaskRequest } from "../../api/types.js";

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

// Single task update schema
const TaskUpdateSchema = z.object({
    taskId: z.string().describe("Task ID (required)"),
    projectId: z.string().describe("Project ID (required)"),
    title: z.string().optional().describe("Task title (optional)"),
    description: z.string().optional().describe("Task description/notes. Auto-mapped: to 'content' for TEXT tasks, to 'desc' for CHECKLIST tasks (with items)"),
    isAllDay: z.boolean().optional().describe("Is all-day task (optional)"),
    startDate: z.string().optional().describe("Start time, format yyyy-MM-dd'T'HH:mm:ssZ (optional)"),
    dueDate: z.string().optional().describe("Due time, format yyyy-MM-dd'T'HH:mm:ssZ (optional)"),
    timeZone: z.string().optional().describe("Time zone (optional)"),
    reminders: z.array(z.string()).optional().describe("Reminder list (optional)"),
    repeatFlag: z.string().optional().describe("Repeat rule (optional)"),
    priority: z.number().optional().describe("Priority: 0=none, 1=low, 3=medium, 5=high (optional)"),
    sortOrder: z.number().optional().describe("Sort order number (optional)"),
    items: z.array(ChecklistItemSchema).optional().describe("Sub-task list. When provided, task becomes CHECKLIST type"),
});

// Task update type
type TaskUpdate = z.infer<typeof TaskUpdateSchema>;

export const registerUpdateTask: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "update_task",
        {
            title: "Update Task(s)",
            description: `Update one or more existing tasks. Supports batch updates.

WHEN TO USE:
- Modify task title, description, dates, or priority
- Change due date or add reminders
- Add/update sub-tasks (items)
- Reschedule or reprioritize tasks

REQUIRED (per task):
- taskId: Task to update
- projectId: Project containing the task

OPTIONAL (only provided fields are updated):
- title: New task title
- description: New notes (auto-maps to correct field)
- dueDate: ISO 8601 format (e.g., "2025-11-25T17:00:00+0800")
- startDate: ISO 8601 format
- priority: 0=none, 1=low, 3=medium, 5=high
- isAllDay: true for all-day tasks
- reminders: ["TRIGGER:PT0S"]
- repeatFlag: Recurrence rule
- items: Sub-task array [{title, status: 0|1}]

INPUT FORMAT: { "tasks": [{ "taskId": "...", "projectId": "...", ...updates }, ...] }

BATCH BEHAVIOR: Non-atomic - some may succeed while others fail. Check summary.failed > 0.`,
            inputSchema: {
                tasks: z.array(TaskUpdateSchema).min(1).describe("Array of tasks to update"),
            },
        },
        async (args) => {
            try {
                const { tasks } = args as { tasks: TaskUpdate[] };

                // Validate tasks array
                if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
                    throw new Error("tasks array is required and must contain at least one task");
                }

                // Validate each task
                for (let i = 0; i < tasks.length; i++) {
                    const task = tasks[i];
                    if (!task.taskId || typeof task.taskId !== "string" || task.taskId.trim() === "") {
                        throw new Error(`tasks[${i}].taskId is required and must be a non-empty string`);
                    }
                    if (!task.projectId || typeof task.projectId !== "string" || task.projectId.trim() === "") {
                        throw new Error(`tasks[${i}].projectId is required and must be a non-empty string`);
                    }
                }

                // Execute batch update
                const results = await batchExecute<TaskUpdate, Task>(
                    tasks,
                    async (taskUpdate) => {
                        // Auto-map description field based on task type:
                        // - If items exist (CHECKLIST task): use 'desc' field
                        // - If no items (TEXT task): use 'content' field
                        const hasItems = taskUpdate.items && taskUpdate.items.length > 0;
                        const descriptionMapping = taskUpdate.description !== undefined
                            ? (hasItems
                                ? { desc: taskUpdate.description }
                                : { content: taskUpdate.description })
                            : {};

                        const requestData: UpdateTaskRequest = {
                            id: taskUpdate.taskId.trim(),
                            projectId: taskUpdate.projectId.trim(),
                            ...(taskUpdate.title !== undefined && { title: taskUpdate.title }),
                            ...descriptionMapping,
                            ...(taskUpdate.isAllDay !== undefined && { isAllDay: taskUpdate.isAllDay }),
                            ...(taskUpdate.startDate !== undefined && { startDate: taskUpdate.startDate }),
                            ...(taskUpdate.dueDate !== undefined && { dueDate: taskUpdate.dueDate }),
                            ...(taskUpdate.timeZone !== undefined && { timeZone: taskUpdate.timeZone }),
                            ...(taskUpdate.reminders !== undefined && { reminders: taskUpdate.reminders }),
                            ...(taskUpdate.repeatFlag !== undefined && { repeatFlag: taskUpdate.repeatFlag }),
                            ...(taskUpdate.priority !== undefined && { priority: taskUpdate.priority }),
                            ...(taskUpdate.sortOrder !== undefined && { sortOrder: taskUpdate.sortOrder }),
                            ...(taskUpdate.items !== undefined && { items: taskUpdate.items }),
                        };
                        return await updateTask(taskUpdate.taskId.trim(), requestData);
                    }
                );

                const output = formatBatchResults(results);

                // Generate summary message
                const { summary } = output;
                let message: string;
                if (summary.failed === 0) {
                    message = summary.total === 1
                        ? "Task updated successfully!"
                        : `All ${summary.total} tasks updated successfully!`;
                } else if (summary.succeeded === 0) {
                    message = summary.total === 1
                        ? "Failed to update task"
                        : `Failed to update all ${summary.total} tasks`;
                } else {
                    message = `Updated ${summary.succeeded}/${summary.total} tasks. ${summary.failed} failed.`;
                }

                return {
                    content: [
                        { type: "text", text: message },
                        { type: "text", text: JSON.stringify(output) },
                    ],
                    structuredContent: output as unknown as Record<string, unknown>,
                    isError: summary.failed > 0 && summary.succeeded === 0,
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
                    content: [{ type: "text", text: `Failed to update task(s): ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
