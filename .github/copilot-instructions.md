# Dida365 MCP Server - AI Assistant Guide

## Project Overview

A TypeScript-based MCP server for Dida365 (TickTick) integration, implementing complete OAuth2 authorization and task management functionality using the MCP SDK.

**Current Status**: ✅ Fully Ready (OAuth2 Authorization + Project Management + Task Management)

## Tech Stack

- **Language**: TypeScript 5.0+ (ES Modules)
- **Project Language**: English for code and documentation. Assistant can communicate with users in their primary language.
- **Runtime**: Node.js 16+
- **Dependencies**:
  - `@modelcontextprotocol/sdk`: ^1.0.0 (MCP Core)
  - `zod`: ^3.23.0 (Data Validation)
- **Dev Dependencies**:
  - `@modelcontextprotocol/inspector`: ^0.17.2 (Debug Tool)
  - `typescript`: ^5.0.0
  - `@types/node`: ^20.0.0

## Project Structure

```
src/
├── index.ts              # Main server entry
├── oauth.ts              # OAuth2 manager
├── oauth-server.ts       # Local callback server (port 8521)
├── config.ts             # Configuration management (env vars)
├── token.ts              # Token persistence (~/.dida365-mcp/)
├── auth-state.ts         # Authorization state definition
└── tools/                # MCP tools (14 total)
    ├── auth/             # OAuth tools (3)
    ├── project/          # Project management (6)
    └── task/             # Task management (5)

public/                   # OAuth callback pages
├── success.html
├── error.html
└── 404.html

build/                    # Compiled output (tsc)
```

## Environment Configuration

**Required Environment Variables**:
```bash
DIDA365_CLIENT_ID       # OAuth2 Client ID
DIDA365_CLIENT_SECRET   # OAuth2 Client Secret
```

**OAuth Configuration**:
- Redirect URI: `http://localhost:8521/callback`
- Authorization Endpoint: `https://dida365.com/oauth/authorize`
- Token Endpoint: `https://dida365.com/oauth/token`
- API Base URL: `https://api.dida365.com/api/v2`

## MCP Tools List

### OAuth2 Authorization (3 tools)

1. **get_auth_url** - Get authorization URL and start callback server
2. **check_auth_status** - Check authorization status (AUTHORIZED/NOT_AUTHORIZED/TOKEN_EXPIRED)
3. **revoke_auth** - Revoke authorization and clear token

### Project Management (6 tools)

4. **list_projects** - Get all projects list
5. **get_project** - Get project details (requires `projectId`)
6. **get_project_data** - Get complete project data (includes tasks and kanban columns)
7. **create_project** - Create project (params: `name`, `color`, `viewMode`, `kind`, `sortOrder`)
8. **update_project** - Update project (only updates provided fields)
9. **delete_project** - Delete project (irreversible)

### Task Management (5 tools)

10. **create_task** - Create task (supports subtasks, reminders, repeat rules)
    - Required: `title`, `projectId`
    - Optional: `content`, `desc`, `startDate`, `dueDate`, `priority`, `items`, etc.
11. **get_task** - Get task details (requires `projectId`, `taskId`)
12. **update_task** - Update task (only updates provided fields)
13. **delete_task** - Delete task (irreversible)
14. **complete_task** - Mark task as completed

## Development Commands

```bash
npm run build      # Compile TypeScript
npm run watch      # Watch mode
npm run dev        # Compile and run
npm start          # Production run
npm run debug      # Debug with MCP Inspector
```

## Integration Configuration

### Claude Desktop Integration

Edit configuration file: `%APPDATA%\Claude\claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

**Normal Mode (Read & Write):**
```json
{
  "mcpServers": {
    "dida365": {
      "command": "node",
      "args": ["C:\\path\\to\\build\\index.js"],
      "env": {
        "DIDA365_CLIENT_ID": "your_client_id",
        "DIDA365_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

**Read-Only Mode (Security Feature):**
```json
{
  "mcpServers": {
    "dida365": {
      "command": "node",
      "args": ["C:\\path\\to\\build\\index.js", "--readonly"],
      "env": {
        "DIDA365_CLIENT_ID": "your_client_id",
        "DIDA365_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### VS Code + GitHub Copilot Integration

Edit VS Code settings file (`settings.json`):

**Normal Mode:**
```json
{
  "mcpServers": {
    "dida365": {
      "command": "node",
      "args": ["/path/to/build/index.js"],
      "env": {
        "DIDA365_CLIENT_ID": "your_client_id",
        "DIDA365_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

**Read-Only Mode:**
```json
{
  "mcpServers": {
    "dida365": {
      "command": "node",
      "args": ["/path/to/build/index.js", "--readonly"],
      "env": {
        "DIDA365_CLIENT_ID": "your_client_id",
        "DIDA365_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### Other AI Agents

Most AI Agents that support the MCP protocol can integrate this server through similar configuration methods. Please refer to the respective Agent's documentation for specific configuration.

## OAuth Authorization Flow

1. User requests an operation requiring authorization → AI calls `get_auth_url`
2. Returns authorization URL + starts local callback server (localhost:8521)
3. User opens the link in browser and authorizes
4. Redirects to callback URL, automatically exchanges token and saves
5. Token auto-refreshes, long-term valid

## Key Features

- **Non-blocking Startup**: Server starts without waiting for authorization, AI guides user through auth
- **Auto Refresh**: Token auto-refreshes when expired, no need to re-authorize
- **Secure Storage**: Token stored in `~/.dida365-mcp/tokens.json` (user directory)
- **CSRF Protection**: Uses state parameter to prevent cross-site request forgery
- **Tool Naming**: All tools use `mcp_dida365-mcp-s_` prefix to avoid conflicts with built-in tools
- **Read-Only Mode**: Optional security mode that prevents all write/delete operations (--readonly flag)

## Read-Only Mode (Security Feature)

### What is Read-Only Mode?

A security feature designed for AI agents that may run in YOLO mode (executing operations without user approval). When enabled, the server only registers read-only tools and hides all write/delete operations.

### How to Enable

Add the `--readonly` or `-r` flag to the command line arguments:

```json
{
  "command": "node",
  "args": ["C:\\path\\to\\build\\index.js", "--readonly"]
}
```

### Behavior

**Allowed Operations (6 tools):**
- ✅ `get_auth_url` - Get authorization URL (read-only, local operation)
- ✅ `check_auth_status` - Check authorization status (read-only)
- ✅ `revoke_auth` - Revoke authorization (local token cleanup only, safe)
- ✅ `list_projects` - Get all projects list (read-only)
- ✅ `get_project` - Get project details (read-only)
- ✅ `get_project_data` - Get complete project data (read-only)
- ✅ `get_task` - Get task details (read-only)

**Blocked Operations (8 tools - not registered):**
- ❌ `create_project` - Create project (write operation)
- ❌ `update_project` - Update project (write operation)
- ❌ `delete_project` - Delete project (delete operation)
- ❌ `create_task` - Create task (write operation)
- ❌ `update_task` - Update task (write operation)
- ❌ `delete_task` - Delete task (delete operation)
- ❌ `complete_task` - Mark task as completed (write operation)

### Use Cases

- **Autonomous AI Agents**: Safe to use with agents like AutoGPT, BabyAGI that may execute operations automatically
- **Testing Environments**: Test integrations without risk of data modification
- **Analysis & Reporting**: Let AI analyze tasks and projects without making changes
- **Shared Access**: Share access with others who should only view data
- **Development & Debugging**: Debug tool behavior without affecting production data

### Implementation Details

Read-only mode is implemented at the **tool registration level**:
1. Command-line argument parsing in `config.ts` (`isReadOnly()` function)
2. Filtered tool registration in `tools/index.ts` (`registerAllTools()` function)
3. Write/delete tools are simply not registered when `readOnly = true`
4. AI agents cannot see or call tools that aren't registered

**Note**: `revoke_auth` is allowed in read-only mode because it only clears local tokens and doesn't modify remote data.

## Reference Resources

- MCP Official Site: https://modelcontextprotocol.io/
- MCP TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- Dida365 API Docs: https://developer.dida365.com

## License

MIT
