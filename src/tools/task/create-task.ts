/**
 * Tool: Create Task
 * Create one or more tasks in projects (supports batch operations)
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { createTask } from "../../api/index.js";
import { batchExecute, formatBatchResults } from "../../utils/batch.js";
import type { Task, CreateTaskRequest } from "../../api/types.js";

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

// Single task input schema
const TaskInputSchema = z.object({
    title: z.string().describe("Task title (required)"),
    projectId: z.string().describe('Project ID (required). Use "inbox" for inbox tasks.'),
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
});

// Task input type
type TaskInput = z.infer<typeof TaskInputSchema>;

export const registerCreateTask: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "create_task",
        {
            title: "Create Task(s)",
            description: `Create one or more tasks in projects. Supports batch creation.

INPUT FORMAT:
{ "tasks": [{ "title": "Task 1", "projectId": "xxx" }, ...] }

REQUIRED per task:
- title: Task title (non-empty string)
- projectId: Project ID or "inbox" for inbox tasks

OPTIONAL per task:
- content: Task content/notes (⚠️ see IMPORTANT note below)
- desc: Task description (recommended for tasks with sub-tasks)
- dueDate: Due date (ISO 8601: "2025-11-25T17:00:00+0800")
- startDate: Start date (ISO 8601)
- priority: 0=none, 1=low, 3=medium, 5=high
- isAllDay: true for all-day tasks
- timeZone: e.g. "America/Los_Angeles"
- reminders: ["TRIGGER:PT0S"] (at due time), ["TRIGGER:-PT30M"] (30min before)
- repeatFlag: "RRULE:FREQ=DAILY;INTERVAL=1" for daily repeat
- items: Sub-tasks array [{title, status: 0|1}]

⚠️ IMPORTANT - content vs desc:
When a task has "items" (sub-tasks), it becomes a CHECKLIST task. The API internally uses the "content" field to store checklist data, which will OVERWRITE any content you provide. Use "desc" instead for task descriptions when using sub-tasks.

BEHAVIOR:
- NOT atomic: Some tasks may succeed while others fail
- Check summary.failed > 0 for failures
- Use failedItems array to retry failed tasks

⚠️ NOTE: When using "inbox" as projectId, the returned task will have a projectId like "inbox{userId}" (e.g., "inbox1023997016"). Use this actual projectId for subsequent operations (update/complete/delete).

EXAMPLE (single):
{ "tasks": [{ "title": "Buy milk", "projectId": "inbox" }] }

EXAMPLE (batch):
{ "tasks": [
  { "title": "Buy milk", "projectId": "inbox", "priority": 3 },
  { "title": "Call mom", "projectId": "xxx", "dueDate": "2025-11-25T18:00:00+0800" }
]}`,
            inputSchema: {
                tasks: z.array(TaskInputSchema).min(1).describe("Array of tasks to create"),
            },
        },
        async (args) => {
            try {
                const { tasks } = args as { tasks: TaskInput[] };

                // Validate tasks array
                if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
                    throw new Error("tasks array is required and must contain at least one task");
                }

                // Validate each task
                for (let i = 0; i < tasks.length; i++) {
                    const task = tasks[i];
                    if (!task.title || typeof task.title !== "string" || task.title.trim() === "") {
                        throw new Error(`tasks[${i}].title is required and must be a non-empty string`);
                    }
                    if (!task.projectId || typeof task.projectId !== "string" || task.projectId.trim() === "") {
                        throw new Error(`tasks[${i}].projectId is required and must be a non-empty string`);
                    }
                }

                // Execute batch creation
                const results = await batchExecute<TaskInput, Task>(
                    tasks,
                    async (taskInput) => {
                        const requestData: CreateTaskRequest = {
                            title: taskInput.title.trim(),
                            projectId: taskInput.projectId.trim(),
                            ...(taskInput.content !== undefined && { content: taskInput.content }),
                            ...(taskInput.desc !== undefined && { desc: taskInput.desc }),
                            ...(taskInput.isAllDay !== undefined && { isAllDay: taskInput.isAllDay }),
                            ...(taskInput.startDate !== undefined && { startDate: taskInput.startDate }),
                            ...(taskInput.dueDate !== undefined && { dueDate: taskInput.dueDate }),
                            ...(taskInput.timeZone !== undefined && { timeZone: taskInput.timeZone }),
                            ...(taskInput.reminders !== undefined && { reminders: taskInput.reminders }),
                            ...(taskInput.repeatFlag !== undefined && { repeatFlag: taskInput.repeatFlag }),
                            ...(taskInput.priority !== undefined && { priority: taskInput.priority }),
                            ...(taskInput.sortOrder !== undefined && { sortOrder: taskInput.sortOrder }),
                            ...(taskInput.items !== undefined && { items: taskInput.items }),
                        };
                        return await createTask(requestData);
                    }
                );

                const output = formatBatchResults(results);

                // Generate summary message
                const { summary } = output;
                let message: string;
                if (summary.failed === 0) {
                    message = summary.total === 1
                        ? "Task created successfully!"
                        : `All ${summary.total} tasks created successfully!`;
                } else if (summary.succeeded === 0) {
                    message = summary.total === 1
                        ? "Failed to create task"
                        : `Failed to create all ${summary.total} tasks`;
                } else {
                    message = `Created ${summary.succeeded}/${summary.total} tasks. ${summary.failed} failed.`;
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
                    content: [{ type: "text", text: `Failed to create task(s): ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
