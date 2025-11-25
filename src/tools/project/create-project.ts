/**
 * Tool: Create Project
 * Create a new project
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { createProject } from "../../api/index.js";

export const registerCreateProject: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "create_project",
        {
            title: "Create Project",
            description: `Create a new project (清单/folder/list) for organizing tasks (任务).

WHEN TO USE:
- User wants to create a new task list (新建清单), folder, or project
- Organizing tasks into categories or areas (分类整理任务)

REQUIRED: name (project title/清单名称)

OPTIONAL:
- color: Hex color code (颜色, e.g., '#F18181')
- viewMode: 'list' (列表, default), 'kanban' (看板), or 'timeline' (时间线)
- kind: 'TASK' (任务清单, default) for tasks, 'NOTE' (笔记清单) for notes
- sortOrder: Position in project list (排序位置)

RETURNS: Created project with generated ID. Use this ID for subsequent task operations.`,
            inputSchema: {
                name: z.string().describe("The name of the project (清单名称, required)"),
                color: z.string().optional().describe("Project color in hex format (颜色, e.g., '#F18181'). Optional."),
                sortOrder: z.number().optional().describe("Sort order for the project (排序位置). Optional."),
                viewMode: z.enum(["list", "kanban", "timeline"]).optional().describe("View mode (视图模式): 'list' (列表), 'kanban' (看板), 'timeline' (时间线). Defaults to 'list'. Optional."),
                kind: z.enum(["TASK", "NOTE"]).optional().describe("Project type (类型): 'TASK' (任务清单) for tasks or 'NOTE' (笔记清单) for notes. Defaults to 'TASK'. Optional."),
            },
            outputSchema: {
                id: z.string(),
                name: z.string(),
                color: z.string().optional(),
                sortOrder: z.number().optional(),
                viewMode: z.enum(["list", "kanban", "timeline"]).optional(),
                kind: z.enum(["TASK", "NOTE"]).optional(),
                closed: z.boolean().optional(),
                groupId: z.string().optional(),
                permission: z.enum(["read", "write", "comment"]).optional(),
            },
        },
        async (args) => {
            try {
                const { name, color, sortOrder, viewMode, kind } = args as {
                    name: string;
                    color?: string;
                    sortOrder?: number;
                    viewMode?: "list" | "kanban" | "timeline";
                    kind?: "TASK" | "NOTE";
                };

                // Validate input
                if (!name || typeof name !== "string" || name.trim() === "") {
                    throw new Error("name is required and must be a non-empty string");
                }

                // Build request data
                const requestData = {
                    name: name.trim(),
                    ...(color !== undefined && { color }),
                    ...(sortOrder !== undefined && { sortOrder }),
                    ...(viewMode !== undefined && { viewMode }),
                    ...(kind !== undefined && { kind }),
                };

                // Use API layer to create project
                const project = await createProject(requestData);

                return {
                    content: [
                        { type: "text", text: `Project created successfully!` },
                        { type: "text", text: JSON.stringify(project) },
                    ],
                    structuredContent: project as unknown as Record<string, unknown>,
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
                    content: [{ type: "text", text: `Failed to create project: ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
