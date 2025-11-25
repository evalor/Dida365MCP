/**
 * Tool: Delete Task
 * Delete one or more tasks from projects (supports batch operations)
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { deleteTask } from "../../api/index.js";
import { batchExecute, formatBatchResultsSimple } from "../../utils/batch.js";

// Single task reference schema
const TaskRefSchema = z.object({
    projectId: z.string().describe("Project ID (清单ID, required)"),
    taskId: z.string().describe("Task ID (任务ID, required)"),
});

// Task reference type
type TaskRef = z.infer<typeof TaskRefSchema>;

export const registerDeleteTask: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "delete_task",
        {
            title: "Delete Task(s)",
            description: `Permanently delete one or more tasks (任务). Supports batch deletion.

⚠️ DESTRUCTIVE: This action cannot be undone! (此操作无法撤销!)

WHEN TO USE:
- User explicitly requests to remove/delete a task (删除任务)
- Cleaning up unwanted tasks

WHEN NOT TO USE:
- Complete a task (完成任务) → use 'complete_task'
- Archive a task (not supported by API)

REQUIRED (per task):
- projectId: Project containing the task (清单ID)
- taskId: Task to delete (任务ID)

INPUT FORMAT: { "tasks": [{ "projectId": "...", "taskId": "..." }, ...] }

⚠️ IDEMPOTENT: Deleting a non-existent task returns success. Use 'get_task' first to verify existence if needed.

BATCH BEHAVIOR: Non-atomic - some may succeed while others fail. Check summary.failed > 0.`,
            inputSchema: {
                tasks: z.array(TaskRefSchema).min(1).describe("Array of tasks to delete"),
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

                // Execute batch deletion
                const results = await batchExecute<TaskRef, void>(
                    tasks,
                    async (taskRef) => {
                        await deleteTask(taskRef.projectId.trim(), taskRef.taskId.trim());
                    }
                );

                const output = formatBatchResultsSimple(results);

                // Generate summary message
                const { summary } = output;
                let message: string;
                if (summary.failed === 0) {
                    message = summary.total === 1
                        ? "Task deleted successfully!"
                        : `All ${summary.total} tasks deleted successfully!`;
                } else if (summary.succeeded === 0) {
                    message = summary.total === 1
                        ? "Failed to delete task"
                        : `Failed to delete all ${summary.total} tasks`;
                } else {
                    message = `Deleted ${summary.succeeded}/${summary.total} tasks. ${summary.failed} failed.`;
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
                    content: [{ type: "text", text: `Failed to delete task(s): ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
