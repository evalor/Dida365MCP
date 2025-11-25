/**
 * Tool: Check Authorization Status
 * Checks current OAuth2 authorization status
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";

export const registerCheckAuthStatus: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "check_auth_status",
        {
            title: "Check Authorization Status",
            description: "Use when the user asks about being authorized (e.g. 'am I authorized', 'auth status', 'check auth'), or when deciding whether protected Dida365 operations can proceed and current state is unclear. Avoid repeated calls if status already known in the current conversation turn. Restricted to Dida365 MCP authorization context only.",
            inputSchema: {},
            outputSchema: {
                authorized: z.boolean(),
                state: z.string(),
                message: z.string(),
                auth_url: z.string().optional(),
            },
        },
        async () => {
            try {
                const statusInfo = context.oauthManager.getAuthStatus();

                const output = {
                    authorized: statusInfo.authorized,
                    state: statusInfo.state,
                    message: statusInfo.message,
                    ...(statusInfo.auth_url && { auth_url: statusInfo.auth_url }),
                };

                return {
                    content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
                    structuredContent: output,
                };
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                return {
                    content: [{ type: "text", text: `Failed to check authorization status: ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
