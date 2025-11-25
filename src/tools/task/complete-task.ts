/**
 * Tool: Complete Task
 * Mark one or more tasks as completed (supports batch operations)
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { completeTask } from "../../api/index.js";
import { batchExecute, formatBatchResultsSimple } from "../../utils/batch.js";

// Single task reference schema
const TaskRefSchema = z.object({
    projectId: z.string().describe("Project ID (required)"),
    taskId: z.string().describe("Task ID (required)"),
});

// Task reference type
type TaskRef = z.infer<typeof TaskRefSchema>;

export const registerCompleteTask: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "complete_task",
        {
            title: "Complete Task(s)",
            description: `Mark one or more tasks as completed. Supports batch completion.

WHEN TO USE:
- User finished a task and wants to mark it done
- Batch complete multiple related tasks

WHEN NOT TO USE:
- Delete a task permanently → use 'delete_task'
- Update other task properties → use 'update_task'

REQUIRED (per task):
- projectId: Project containing the task
- taskId: Task to mark complete

INPUT FORMAT: { "tasks": [{ "projectId": "...", "taskId": "..." }, ...] }

⚠️ IDEMPOTENT: Completing an already-completed or non-existent task returns success. Use 'get_task' first to verify if needed.

⚠️ NOTE: Completed tasks are no longer returned by 'list_tasks' or 'get_project_data'.

BATCH BEHAVIOR: Non-atomic - some may succeed while others fail. Check summary.failed > 0.`,
            inputSchema: {
                tasks: z.array(TaskRefSchema).min(1).describe("Array of tasks to complete"),
            },
        },
        async (args) => {
            try {
                const { tasks } = args as { tasks: TaskRef[] };

                // Validate tasks array
                if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
                    throw new Error("tasks array is required and must contain at least one task reference");
                }

                // Validate each task reference
                for (let i = 0; i < tasks.length; i++) {
                    const task = tasks[i];
                    if (!task.projectId || typeof task.projectId !== "string" || task.projectId.trim() === "") {
                        throw new Error(`tasks[${i}].projectId is required and must be a non-empty string`);
                    }
                    if (!task.taskId || typeof task.taskId !== "string" || task.taskId.trim() === "") {
                        throw new Error(`tasks[${i}].taskId is required and must be a non-empty string`);
                    }
                }

                // Execute batch completion
                const results = await batchExecute<TaskRef, void>(
                    tasks,
                    async (taskRef) => {
                        await completeTask(taskRef.projectId.trim(), taskRef.taskId.trim());
                    }
                );

                const output = formatBatchResultsSimple(results);

                // Generate summary message
                const { summary } = output;
                let message: string;
                if (summary.failed === 0) {
                    message = summary.total === 1
                        ? "Task completed successfully!"
                        : `All ${summary.total} tasks completed successfully!`;
                } else if (summary.succeeded === 0) {
                    message = summary.total === 1
                        ? "Failed to complete task"
                        : `Failed to complete all ${summary.total} tasks`;
                } else {
                    message = `Completed ${summary.succeeded}/${summary.total} tasks. ${summary.failed} failed.`;
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
                    content: [{ type: "text", text: `Failed to complete task(s): ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
