/**
 * Tool: Update Project
 * Update an existing project
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { OAUTH_CONSTANTS } from "../../config.js";

export const registerUpdateProject: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "update_project",
        {
            title: "Update Project",
            description: "Update an existing project's information such as name, color, view mode, etc. Only provide the fields you want to update; other fields will remain unchanged.",
            inputSchema: {
                projectId: z.string().describe("The unique ID of the project to update (required)"),
                name: z.string().optional().describe("New project name. Optional."),
                color: z.string().optional().describe("New project color in hex format (e.g., '#F18181'). Optional."),
                sortOrder: z.number().optional().describe("New sort order. Optional."),
                viewMode: z.enum(["list", "kanban", "timeline"]).optional().describe("New view mode. Optional."),
                kind: z.enum(["TASK", "NOTE"]).optional().describe("New project type. Optional."),
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

                // Get valid access token (automatically refreshes if needed)
                const accessToken = await context.oauthManager.getValidAccessToken();

                // Build request body (only include fields that are provided)
                const requestBody: Record<string, unknown> = {};

                if (name !== undefined) requestBody.name = name.trim();
                if (color !== undefined) requestBody.color = color;
                if (sortOrder !== undefined) requestBody.sortOrder = sortOrder;
                if (viewMode !== undefined) requestBody.viewMode = viewMode;
                if (kind !== undefined) requestBody.kind = kind;

                // Make API request
                const response = await fetch(`${OAUTH_CONSTANTS.API_BASE_URL}/open/v1/project/${projectId}`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(requestBody),
                });

                if (!response.ok) {
                    const errorText = await response.text();

                    if (response.status === 404) {
                        throw new Error(`Project not found: ${projectId}`);
                    }

                    throw new Error(`API request failed: ${response.status} ${errorText}`);
                }

                const project = await response.json();

                return {
                    content: [{
                        type: "text",
                        text: `Project updated successfully!\n\n${JSON.stringify(project, null, 2)}`
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
                    content: [{ type: "text", text: `Failed to update project: ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
