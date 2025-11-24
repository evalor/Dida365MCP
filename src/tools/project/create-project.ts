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
            description: "Create a new project with the specified name and optional configuration. Returns the created project details including the generated project ID.",
            inputSchema: {
                name: z.string().describe("The name of the project (required)"),
                color: z.string().optional().describe("Project color in hex format (e.g., '#F18181'). Optional."),
                sortOrder: z.number().optional().describe("Sort order for the project. Optional."),
                viewMode: z.enum(["list", "kanban", "timeline"]).optional().describe("View mode for the project. Defaults to 'list'. Optional."),
                kind: z.enum(["TASK", "NOTE"]).optional().describe("Project type: 'TASK' for tasks or 'NOTE' for notes. Defaults to 'TASK'. Optional."),
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
