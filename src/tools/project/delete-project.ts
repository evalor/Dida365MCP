/**
 * Tool: Delete Project
 * Delete an existing project
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { deleteProject } from "../../api/index.js";

export const registerDeleteProject: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "delete_project",
        {
            title: "Delete Project",
            description: `Permanently delete a project and all its contents.

⚠️ DESTRUCTIVE: This action cannot be undone. All tasks within the project will also be deleted.

WHEN TO USE:
- User explicitly requests to delete a project
- Cleaning up unused/empty projects

WHEN NOT TO USE:
- Just archiving or hiding a project (not supported)
- Moving tasks to another project first → use 'update_task'

REQUIRED: projectId`,
            inputSchema: {
                projectId: z.string().describe("The unique ID of the project to delete"),
            },
            outputSchema: {
                projectId: z.string(),
            },
        },
        async (args) => {
            try {
                const { projectId } = args as { projectId: string };

                // Validate input
                if (!projectId || typeof projectId !== "string") {
                    throw new Error("projectId is required and must be a string");
                }

                // Use API layer to delete project
                await deleteProject(projectId);

                const output = {
                    projectId: projectId,
                };

                return {
                    content: [
                        { type: "text", text: `Project deleted successfully!` },
                        { type: "text", text: JSON.stringify(output) },
                    ],
                    structuredContent: output as Record<string, unknown>,
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
                    content: [{ type: "text", text: `Failed to delete project: ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
