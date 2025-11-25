/**
 * Tool: Get Project Data
 * Get complete project data including all tasks and columns
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { getProjectData } from "../../api/index.js";

export const registerGetProjectData: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "get_project_data",
        {
            title: "Get Project Data",
            description: `Get complete project data including project details, tasks, and columns (for kanban view).

⚠️ IMPORTANT: Only returns UNCOMPLETED tasks (status=0). Completed tasks are NOT available via this API.

💡 TIP: For filtering tasks by date/priority, use 'list_tasks' instead.`,
            inputSchema: {
                projectId: z.string().describe("The unique ID of the project to retrieve data for"),
            },
            outputSchema: {
                project: z.object({
                    id: z.string(),
                    name: z.string(),
                    color: z.string().optional(),
                    closed: z.boolean().optional(),
                    groupId: z.string().optional(),
                    viewMode: z.enum(["list", "kanban", "timeline"]).optional(),
                    permission: z.enum(["read", "write", "comment"]).optional(),
                    kind: z.enum(["TASK", "NOTE"]).optional(),
                    sortOrder: z.number().optional(),
                }),
                tasks: z.array(z.object({
                    id: z.string(),
                    projectId: z.string(),
                    title: z.string(),
                    content: z.string().optional(),
                    desc: z.string().optional(),
                    isAllDay: z.boolean().optional(),
                    startDate: z.string().optional(),
                    dueDate: z.string().optional(),
                    timeZone: z.string().optional(),
                    repeatFlag: z.string().optional(),
                    priority: z.number().optional(),
                    status: z.number().optional(),
                    sortOrder: z.number().optional(),
                    items: z.array(z.any()).optional(),
                })).optional(),
                columns: z.array(z.object({
                    id: z.string(),
                    projectId: z.string(),
                    name: z.string(),
                    sortOrder: z.number().optional(),
                })).optional(),
            },
        },
        async (args) => {
            try {
                const { projectId } = args as { projectId: string };

                // Validate input
                if (!projectId || typeof projectId !== "string") {
                    throw new Error("projectId is required and must be a string");
                }

                // Use API layer to get project data
                const projectData = await getProjectData(projectId);

                return {
                    content: [
                        { type: "text", text: `Project Data:` },
                        { type: "text", text: JSON.stringify(projectData) },
                    ],
                    structuredContent: projectData as unknown as Record<string, unknown>,
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
                    content: [{ type: "text", text: `Failed to get project data: ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
