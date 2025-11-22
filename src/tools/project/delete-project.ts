/**
 * Tool: Delete Project
 * Delete an existing project
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";
import { OAUTH_CONSTANTS } from "../../config.js";

export const registerDeleteProject: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "delete_project",
        {
            title: "Delete Project",
            description: "Delete a project by its ID. Warning: This action cannot be undone. All tasks within the project will also be deleted.",
            inputSchema: {
                projectId: z.string().describe("The unique ID of the project to delete"),
            },
            outputSchema: {
                success: z.boolean(),
                message: z.string(),
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

                // Get valid access token (automatically refreshes if needed)
                const accessToken = await context.oauthManager.getValidAccessToken();

                // Make API request
                const response = await fetch(`${OAUTH_CONSTANTS.API_BASE_URL}/open/v1/project/${projectId}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    const errorText = await response.text();

                    if (response.status === 404) {
                        throw new Error(`Project not found: ${projectId}`);
                    }

                    throw new Error(`API request failed: ${response.status} ${errorText}`);
                }

                const output = {
                    success: true,
                    message: `Project ${projectId} has been deleted successfully.`,
                    projectId: projectId,
                };

                return {
                    content: [{
                        type: "text",
                        text: `Project deleted successfully!\n\nProject ID: ${projectId}`
                    }],
                    structuredContent: output as Record<string, unknown>,
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
                    content: [{ type: "text", text: `Failed to delete project: ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
