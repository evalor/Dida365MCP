#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadOAuthConfig, printConfigInfo, validateOAuthConfig, isReadOnly, type OAuth2Config } from "./config.js";
import { OAuthManager } from "./oauth.js";
import { registerAllTools } from "./tools/index.js";

// ============================================================================
// Configuration & Initialization
// ============================================================================

// Load OAuth2 configuration from environment variables
let oauthConfig: OAuth2Config;
let oauthManager: OAuthManager;

try {
    oauthConfig = loadOAuthConfig();

    // Validate configuration
    if (!validateOAuthConfig(oauthConfig)) {
        throw new Error('Invalid OAuth2 configuration');
    }

    // Print configuration info (for debugging)
    printConfigInfo(oauthConfig);

    // Initialize OAuth Manager
    oauthManager = new OAuthManager(oauthConfig);

} catch (error) {
    console.error('Failed to load OAuth2 configuration:', error);
    console.error('');
    console.error('Please set the following environment variables:');
    console.error('  DIDA365_CLIENT_ID     - Your Dida365 OAuth Client ID');
    console.error('  DIDA365_CLIENT_SECRET - Your Dida365 OAuth Client Secret');
    console.error('');
    console.error('Get these credentials from: https://developer.dida365.com');
    console.error('Configure callback URL as: http://localhost:8521/callback');
    process.exit(1);
}

// Create MCP server instance
const server = new McpServer({
    name: "dida365-mcp-server",
    version: "1.0.0",
});

// ============================================================================
// Tool Registration
// ============================================================================

// Register all tools with the server (filter based on read-only mode)
const readOnlyMode = isReadOnly();
registerAllTools(server, { oauthManager }, readOnlyMode);

if (readOnlyMode) {
    console.error('⚠️  Read-Only Mode: Write/Delete tools are hidden');
}

// ============================================================================
// Server Startup
// ============================================================================

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error("=================================================");
    console.error("Dida365 MCP Server started successfully");
    console.error(`OAuth2 Ready - Client ID: ${oauthConfig.clientId.substring(0, 8)}...`);

    // Display authorization status
    const authStatus = oauthManager.getAuthStatus();
    console.error(`Authorization Status: ${authStatus.state}`);

    if (authStatus.authorized) {
        console.error("✓ Already authorized - ready to use");
    } else {
        console.error("⚠ Not authorized - use 'get_auth_url' tool to start authorization");
    }

    console.error("=================================================");
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
