/**
 * Tool: Get Project
 * Get detailed information about a specific project
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { getProject } from "../../api/index.js";

export const registerGetProject: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "get_project",
        {
            title: "Get Project",
            description: `Retrieve metadata for a single project by ID.

WHEN TO USE:
- Check project settings (name, color, viewMode, permissions)
- Verify a project exists before operations
- Get project metadata without loading tasks

WHEN NOT TO USE:
- Need tasks within the project → use 'get_project_data' or 'list_tasks'
- Need to filter tasks by date/priority → use 'list_tasks'

RETURNS: Project metadata only (id, name, color, viewMode, kind, permissions). Does NOT include tasks.`,
            inputSchema: {
                projectId: z.string().describe("The unique ID of the project to retrieve"),
            },
            outputSchema: {
                id: z.string(),
                name: z.string(),
                color: z.string().optional(),
                closed: z.boolean().optional(),
                groupId: z.string().optional(),
                viewMode: z.enum(["list", "kanban", "timeline"]).optional(),
                permission: z.enum(["read", "write", "comment"]).optional(),
                kind: z.enum(["TASK", "NOTE"]).optional(),
                sortOrder: z.number().optional(),
            },
        },
        async (args) => {
            try {
                const { projectId } = args as { projectId: string };

                // Validate input
                if (!projectId || typeof projectId !== "string") {
                    throw new Error("projectId is required and must be a string");
                }

                // Use API layer to get project
                const project = await getProject(projectId);

                return {
                    content: [
                        { type: "text", text: `Project Details:` },
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
                    content: [{ type: "text", text: `Failed to get project: ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
