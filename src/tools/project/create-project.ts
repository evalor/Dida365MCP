/**
 * Tool: Create Project
 * Create a new project
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { OAUTH_CONSTANTS } from "../../config.js";

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

                // Get valid access token (automatically refreshes if needed)
                const accessToken = await context.oauthManager.getValidAccessToken();

                // Build request body
                const requestBody: Record<string, unknown> = {
                    name: name.trim(),
                };

                if (color !== undefined) requestBody.color = color;
                if (sortOrder !== undefined) requestBody.sortOrder = sortOrder;
                if (viewMode !== undefined) requestBody.viewMode = viewMode;
                if (kind !== undefined) requestBody.kind = kind;

                // Make API request
                const response = await fetch(`${OAUTH_CONSTANTS.API_BASE_URL}/open/v1/project`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(requestBody),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`API request failed: ${response.status} ${errorText}`);
                }

                const project = await response.json();

                return {
                    content: [{
                        type: "text",
                        text: `Project created successfully!\n\n${JSON.stringify(project, null, 2)}`
                    }],
                    structuredContent: project as Record<string, unknown>,
                };
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);

                // Check if it's an authorization error
                if (errorMsg.includes("401") || errorMsg.includes("Unauthorized") || errorMsg.includes("token")) {
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
