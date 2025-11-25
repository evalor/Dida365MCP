/**
 * Tool: List Tasks
 * List tasks with various filtering options
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { listProjects, getProjectData } from "../../api/index.js";
import type { Task, Project } from "../../api/types.js";

// Preset date ranges
type DatePreset = "today" | "tomorrow" | "thisWeek" | "overdue";

/**
 * Normalize a date to start of day in local timezone
 */
function normalizeToLocalDate(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Parse a date string and normalize to local date for comparison
 */
function parseAndNormalizeDate(dateStr: string): Date {
    const date = new Date(dateStr);
    return normalizeToLocalDate(date);
}

/**
 * Get date range for a preset (in local timezone)
 */
function getDateRangeForPreset(preset: DatePreset): { from: Date; to: Date } {
    const now = new Date();
    const today = normalizeToLocalDate(now);

    switch (preset) {
        case "today":
            return {
                from: today,
                to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
            };
        case "tomorrow": {
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            return {
                from: tomorrow,
                to: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000 - 1),
            };
        }
        case "thisWeek": {
            const dayOfWeek = today.getDay();
            const startOfWeek = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
            const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
            return { from: startOfWeek, to: endOfWeek };
        }
        case "overdue":
            return {
                from: new Date(0), // Beginning of time
                to: new Date(today.getTime() - 1), // Yesterday end
            };
        default:
            throw new Error(`Unknown preset: ${preset}`);
    }
}

/**
 * Filter tasks based on criteria
 */
function filterTasks(
    tasks: Task[],
    options: {
        dueDateFrom?: string;
        dueDateTo?: string;
        priority?: number[];
        preset?: DatePreset;
    }
): Task[] {
    let filtered = [...tasks];

    // Apply preset date range
    if (options.preset) {
        const { from, to } = getDateRangeForPreset(options.preset);

        if (options.preset === "overdue") {
            // For overdue, only include tasks with due dates before today
            filtered = filtered.filter((task) => {
                if (!task.dueDate) return false;
                // Normalize task due date to local date for comparison
                const dueDate = parseAndNormalizeDate(task.dueDate);
                return dueDate < from; // Before start of today
            });
        } else {
            filtered = filtered.filter((task) => {
                if (!task.dueDate) return false;
                // Normalize task due date to local date for comparison
                const dueDate = parseAndNormalizeDate(task.dueDate);
                return dueDate >= from && dueDate <= to;
            });
        }
    }

    // Apply custom date range filters
    if (options.dueDateFrom) {
        const fromDate = new Date(options.dueDateFrom);
        filtered = filtered.filter((task) => {
            if (!task.dueDate) return false;
            return new Date(task.dueDate) >= fromDate;
        });
    }

    if (options.dueDateTo) {
        const toDate = new Date(options.dueDateTo);
        filtered = filtered.filter((task) => {
            if (!task.dueDate) return false;
            return new Date(task.dueDate) <= toDate;
        });
    }

    // Apply priority filter
    if (options.priority && options.priority.length > 0) {
        filtered = filtered.filter((task) =>
            options.priority!.includes(task.priority ?? 0)
        );
    }

    return filtered;
}

/**
 * Sort tasks by specified field
 */
function sortTasks(
    tasks: Task[],
    sortBy: "dueDate" | "priority" | "createdTime" = "dueDate",
    sortOrder: "asc" | "desc" = "asc"
): Task[] {
    const sorted = [...tasks];

    sorted.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case "dueDate": {
                const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                comparison = dateA - dateB;
                break;
            }
            case "priority": {
                // Higher priority (5) should come first in desc, last in asc
                const prioA = a.priority ?? 0;
                const prioB = b.priority ?? 0;
                comparison = prioA - prioB;
                break;
            }
            case "createdTime": {
                // Use sortOrder as proxy for creation time
                const orderA = a.sortOrder ?? 0;
                const orderB = b.sortOrder ?? 0;
                comparison = orderA - orderB;
                break;
            }
        }

        return sortOrder === "desc" ? -comparison : comparison;
    });

    return sorted;
}

export const registerListTasks: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "list_tasks",
        {
            title: "List Tasks",
            description: `List and filter tasks across one or more projects.

WHEN TO USE:
- Find tasks due today, this week, or overdue
- Filter tasks by priority or date range
- Search tasks across multiple projects or inbox
- Get a filtered subset of tasks

WHEN NOT TO USE:
- Need all tasks in one project without filtering → use 'get_project_data'
- Need a single specific task → use 'get_task'

QUICK FILTERS (preset):
- "today": Tasks due today
- "tomorrow": Tasks due tomorrow  
- "thisWeek": Tasks due this week
- "overdue": Past-due tasks

OPTIONAL FILTERS:
- projectId: Single ID, array of IDs, or "inbox" (omit for all projects)
- dueDateFrom/dueDateTo: Custom date range (ISO 8601)
- priority: [0=none, 1=low, 3=medium, 5=high]

SORTING:
- sortBy: "dueDate" (default), "priority", "createdTime"
- sortOrder: "asc" (default), "desc"

⚠️ LIMITATION: Only returns UNCOMPLETED tasks (status=0). Completed tasks not available.

EXAMPLES:
- Today's tasks: { "preset": "today" }
- High priority from inbox: { "projectId": "inbox", "priority": [5] }`,
            inputSchema: {
                projectId: z
                    .union([z.string(), z.array(z.string())])
                    .optional()
                    .describe('Project ID(s) to filter. Use "inbox" for inbox tasks. If omitted, searches all projects.'),
                dueDateFrom: z
                    .string()
                    .optional()
                    .describe("Filter tasks with due date >= this value (ISO 8601 format)"),
                dueDateTo: z
                    .string()
                    .optional()
                    .describe("Filter tasks with due date <= this value (ISO 8601 format)"),
                priority: z
                    .union([z.number(), z.array(z.number())])
                    .optional()
                    .describe("Filter by priority: 0=none, 1=low, 3=medium, 5=high"),
                preset: z
                    .enum(["today", "tomorrow", "thisWeek", "overdue"])
                    .optional()
                    .describe("Quick date filter preset"),
                limit: z
                    .number()
                    .optional()
                    .describe("Maximum number of tasks to return (default 50, max 200)"),
                sortBy: z
                    .enum(["dueDate", "priority", "createdTime"])
                    .optional()
                    .describe("Sort field (default: dueDate)"),
                sortOrder: z
                    .enum(["asc", "desc"])
                    .optional()
                    .describe("Sort order (default: asc)"),
            },
            outputSchema: z.object({
                tasks: z.array(z.any()),
                total: z.number(),
                filtered: z.boolean(),
                projects: z.array(z.string()),
            }),
        },
        async (args) => {
            try {
                const {
                    projectId,
                    dueDateFrom,
                    dueDateTo,
                    priority,
                    preset,
                    limit = 50,
                    sortBy = "dueDate",
                    sortOrder = "asc",
                } = args as {
                    projectId?: string | string[];
                    dueDateFrom?: string;
                    dueDateTo?: string;
                    priority?: number | number[];
                    preset?: DatePreset;
                    limit?: number;
                    sortBy?: "dueDate" | "priority" | "createdTime";
                    sortOrder?: "asc" | "desc";
                };

                // Normalize projectId to array
                let projectIds: string[] | undefined;
                if (projectId) {
                    projectIds = Array.isArray(projectId) ? projectId : [projectId];
                }

                // Normalize priority to array
                const priorityArray = priority
                    ? Array.isArray(priority)
                        ? priority
                        : [priority]
                    : undefined;

                // Cap limit at 200
                const effectiveLimit = Math.min(limit, 200);

                // Get all projects if no specific project filter
                let projects: Project[];
                try {
                    projects = await listProjects();
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    if (errorMsg.includes("401") || errorMsg.includes("Unauthorized")) {
                        return {
                            content: [{
                                type: "text",
                                text: `Authorization failed: ${errorMsg}. Please use the 'get_auth_url' tool to re-authorize.`,
                                isError: true,
                            }],
                            isError: true,
                        };
                    }
                    throw error;
                }

                // Filter projects if projectId specified
                let targetProjects = projects;
                let includeInbox = false;

                if (projectIds) {
                    // Handle "inbox" special case
                    includeInbox = projectIds.some((id) => id.toLowerCase() === "inbox");
                    const regularIds = projectIds.filter((id) => id.toLowerCase() !== "inbox");

                    // Filter to only requested projects
                    targetProjects = projects.filter((p) => regularIds.includes(p.id));
                } else {
                    // When no projectId specified, include inbox by default
                    includeInbox = true;
                }

                // Collect tasks from all target projects
                let allTasks: Task[] = [];
                const projectNames: string[] = [];

                // Fetch tasks from regular projects
                for (const project of targetProjects) {
                    try {
                        const projectData = await getProjectData(project.id);
                        allTasks.push(...projectData.tasks);
                        projectNames.push(project.name);
                    } catch (error) {
                        // Skip projects that fail
                        console.error(`Failed to get tasks for project ${project.id}:`, error);
                    }
                }

                // Fetch inbox tasks separately
                if (includeInbox) {
                    try {
                        const inboxData = await getProjectData("inbox");
                        allTasks.push(...inboxData.tasks);
                        projectNames.push("Inbox");
                    } catch (error) {
                        // Inbox fetch failed, continue without it
                        console.error("Failed to get inbox tasks:", error);
                    }
                }

                // Apply filters
                const hasFilters = !!(dueDateFrom || dueDateTo || priorityArray || preset);
                let filteredTasks = filterTasks(allTasks, {
                    dueDateFrom,
                    dueDateTo,
                    priority: priorityArray,
                    preset,
                });

                // Sort tasks
                filteredTasks = sortTasks(filteredTasks, sortBy, sortOrder);

                // Store total before limit
                const totalBeforeLimit = filteredTasks.length;

                // Apply limit
                const limitedTasks = filteredTasks.slice(0, effectiveLimit);

                const output = {
                    tasks: limitedTasks,
                    total: limitedTasks.length,
                    totalBeforeLimit,
                    filtered: hasFilters,
                    truncated: limitedTasks.length < totalBeforeLimit,
                    projects: projectNames,
                };

                return {
                    content: [
                        {
                            type: "text",
                            text: `Found ${totalBeforeLimit} task(s)${hasFilters ? " (filtered)" : ""} from ${projectNames.length} project(s)${output.truncated ? `, showing first ${output.total}` : ""}`,
                        },
                        { type: "text", text: JSON.stringify(output) },
                    ],
                    structuredContent: output as unknown as Record<string, unknown>,
                };
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);

                if (errorMsg.includes("401") || errorMsg.includes("Unauthorized") || errorMsg.includes("Authentication failed")) {
                    return {
                        content: [{
                            type: "text",
                            text: `Authorization failed: ${errorMsg}. Please use the 'get_auth_url' tool to re-authorize.`,
                            isError: true,
                        }],
                        isError: true,
                    };
                }

                return {
                    content: [{ type: "text", text: `Failed to list tasks: ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
