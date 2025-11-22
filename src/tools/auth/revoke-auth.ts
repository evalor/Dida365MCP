/**
 * Tool: Revoke Authorization
 * Revokes OAuth2 authorization and clears all tokens
 */

import { z } from "zod";
import type { ToolRegistrationFunction } from "../types.js";

export const registerRevokeAuth: ToolRegistrationFunction = (server, context) => {
    server.registerTool(
        "revoke_auth",
        {
            title: "Revoke Authorization",
            description: "Use ONLY when the user explicitly requests to log out, revoke, reset, clear, or remove Dida365 authorization/tokens. Do NOT call for token refresh, generic OAuth logout of other services, or routine task operations. Clears stored tokens; user must re-authorize afterward.",
            inputSchema: {},
            outputSchema: {
                success: z.boolean(),
                message: z.string(),
            },
        },
        async () => {
            try {
                context.oauthManager.revokeAuthorization();

                const output = {
                    success: true,
                    message: "Authorization revoked successfully. All tokens have been cleared.",
                };

                return {
                    content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
                    structuredContent: output,
                };
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                return {
                    content: [{ type: "text", text: `Failed to revoke authorization: ${errorMsg}`, isError: true }],
                    isError: true,
                };
            }
        }
    );
};
