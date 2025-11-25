/**
 * Tool: Update Project
 * Update an existing project
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { updateProject } from "../../api/index.js";

export const registerUpdateProject: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "update_project",
        {
            title: "Update Project",
            description: `Update an existing project's (清单) settings.

WHEN TO USE:
- Rename a project (重命名清单)
- Change project color (颜色), view mode (视图模式), or type (类型)
- Reorder projects in the list (调整清单顺序)

PARTIAL UPDATE: Only provide fields you want to change. Unspecified fields remain unchanged.

REQUIRED: projectId (清单ID)

OPTIONAL (at least one required):
- name: New project name (新名称)
- color: New hex color (新颜色, e.g., '#F18181')
- viewMode: 'list' (列表), 'kanban' (看板), or 'timeline' (时间线)
- kind: 'TASK' (任务清单) or 'NOTE' (笔记清单)
- sortOrder: New position in project list (新排序位置)`,
            inputSchema: {
                projectId: z.string().describe("The unique ID of the project to update (清单ID, required)"),
                name: z.string().optional().describe("New project name (新清单名称). Optional."),
                color: z.string().optional().describe("New project color in hex format (新颜色, e.g., '#F18181'). Optional."),
                sortOrder: z.number().optional().describe("New sort order (新排序位置). Optional."),
                viewMode: z.enum(["list", "kanban", "timeline"]).optional().describe("New view mode (新视图模式): 'list' (列表), 'kanban' (看板), 'timeline' (时间线). Optional."),
                kind: z.enum(["TASK", "NOTE"]).optional().describe("New project type (新类型): 'TASK' (任务清单), 'NOTE' (笔记清单). Optional."),
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
                const { projectId, name, color, sortOrder, viewMode, kind } = args as {
                    projectId: string;
                    name?: string;
                    color?: string;
                    sortOrder?: number;
                    viewMode?: "list" | "kanban" | "timeline";
                    kind?: "TASK" | "NOTE";
                };

                // Validate input
                if (!projectId || typeof projectId !== "string") {
                    throw new Error("projectId is required and must be a string");
                }

                // At least one field to update must be provided
                if (!name && !color && sortOrder === undefined && !viewMode && !kind) {
                    throw new Error("At least one field to update must be provided (name, color, sortOrder, viewMode, or kind)");
                }

                // Build request data (only include fields that are provided)
                const requestData = {
                    ...(name !== undefined && { name: name.trim() }),
                    ...(color !== undefined && { color }),
                    ...(sortOrder !== undefined && { sortOrder }),
                    ...(viewMode !== undefined && { viewMode }),
                    ...(kind !== undefined && { kind }),
                };

                // Use API layer to update project
                const project = await updateProject(projectId, requestData);

                return {
                    content: [
                        { type: "text", text: `Project updated successfully!` },
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
                    content: [{ type: "text", text: `Failed to update project: ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
