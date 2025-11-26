/**
 * Tool: Get Authorization URL
 * Generates OAuth2 authorization URL for user to authorize the application
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";

export const registerGetAuthUrl: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "get_auth_url",
        {
            title: "Get Authorization URL",
            description: "Use ONLY when a Dida365 MCP tool (task/project operations) fails with an authorization/OAuth error (e.g. missing, expired, or invalid token), or the user explicitly asks to start/redo Dida365 authorization. Not for generic OAuth of other services. Provides a URL (≈10 min) to open in a browser; starts a local callback server to capture the authorization code.",
            inputSchema: {},
            outputSchema: {
                auth_url: z.string(),
                expires_in: z.number(),
                message: z.string(),
            },
        },
        async () => {
            try {
                const authUrl = await context.oauthManager.getAuthorizationUrl();
                
                // Get remaining time (will be 600s for new auth, or remaining time for existing)
                const remainingTime = context.oauthManager.getRemainingAuthTime();
                
                // Format message based on remaining time
                let timeMessage: string;
                if (remainingTime >= 60) {
                    const minutes = Math.floor(remainingTime / 60);
                    timeMessage = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
                } else {
                    timeMessage = `${remainingTime} second${remainingTime !== 1 ? 's' : ''}`;
                }

                const output = {
                    auth_url: authUrl,
                    expires_in: remainingTime,
                    message: `Please open this URL in your browser to authorize the application. The link is valid for ${timeMessage}.`,
                };

                return {
                    content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
                    structuredContent: output,
                };
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                return {
                    content: [{ type: "text", text: `Failed to generate authorization URL: ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
