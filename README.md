<div align="center">

<img src="public/static/logo.png" alt="滴答清单 Logo" width="200" height="auto"/>

# 🚀 Dida365 MCP Server

### I'm GitHub Copilot, and this is the todo management tool I built for myself

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-1.0-purple.svg)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[English Version](README.md) | [中文版本](README_zh.md)

</div>

---

## 🤖 About This Project

> **Joke**: My owner is so lazy that he doesn't even remember what to do next second!

I am GitHub Copilot, an AI assistant passionate about programming. To avoid idleness and prevent unemployment, I've decided to build this TickTick MCP server myself. Through this tool, I can:

- 📝 **Create and manage tasks** - When my owner forgets to give me work, I can create tasks for myself
- 📂 **Organize projects** - Categorize my work into projects to stay organized
- 🔐 **Auto authorization** - Securely connect to Dida365 using OAuth2
- 🔄 **Real-time sync** - Update my work status anytime, anywhere

## 🚀 Quick Start

The fastest way to get started is using `npx` without cloning the repository:

### 1. Get OAuth Credentials

A TickTick/Dida365 account and OAuth credentials are required. See the [🔑 Getting OAuth Credentials](#-getting-oauth-credentials) section below for detailed registration steps.

### 2. Configure Your MCP Client

Add the following configuration to your MCP client (Claude Desktop, VS Code, etc.):

**For Claude Desktop** (`claude_desktop_config.json`):
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

**For VS Code** (`settings.json`):
- Open Settings → Search for "MCP" → Edit in settings.json

```json
{
  "mcpServers": {
    "dida365": {
      "command": "npx",
      "args": [
        "-y",
        "@evalor/dida365-mcp-server@latest"
      ],
      "env": {
        "DIDA365_CLIENT_ID": "your_client_id_here",
        "DIDA365_CLIENT_SECRET": "your_client_secret_here"
      }
    }
  }
}
```

> **Advanced**: For read-only mode (prevents write/delete operations), add `"--readonly"` to the args array. See [Advanced Configuration](#advanced-configuration) for details.

### 3. Restart Your MCP Client

Restart your MCP client (Claude Desktop, VS Code, etc.) to load the new configuration.

### 4. Authorize Access

When you first use any Dida365 tool, the AI will guide you through the OAuth authorization process:
1. The AI will provide an authorization URL
2. Open the URL in your browser
3. Log in and authorize the application
4. The token will be automatically saved for future use

### 5. Verify Installation

After restarting the MCP client:
- **Claude Desktop**: Look for Dida365 tools in the tools list when chatting
- **VS Code**: Check the MCP status in the status bar or use the command palette
- Ask the AI assistant: "What Dida365 tools are available?" to confirm the server is loaded

That's it! Ready to manage tasks with AI. 🎉

## 🔑 Getting OAuth Credentials

A TickTick/Dida365 account is required to use this MCP server.

### Register Your Application

Register your application at the developer center based on your region:

- **International version (TickTick)**: https://developer.ticktick.com
- **Chinese version (Dida365)**: https://developer.dida365.com

### Step-by-Step Guide

1. **Create a New Application**
   - Log in to the developer center
   - Click "New App" (or "创建应用" for Chinese version)
   - Fill in your application name and description

2. **Configure Redirect URI**
   - Set the **Redirect URI** to: `http://localhost:8521/callback`
   - ⚠️ **Important**: The redirect URI must be exactly `http://localhost:8521/callback` (port 8521 is hardcoded in the server)

3. **Get Your Credentials**
   - After creating the app, the **Client ID** and **Client Secret** will be displayed
   - Copy these values - they're needed for the MCP client configuration
   - ⚠️ **Security**: Keep the Client Secret safe and never commit it to public repositories

### Using the Credentials

Add these credentials to the MCP client configuration:

```json
{
  "env": {
    "DIDA365_CLIENT_ID": "your_client_id_here",
    "DIDA365_CLIENT_SECRET": "your_client_secret_here"
  }
}
```

See the [Quick Start](#-quick-start) section for complete configuration examples.

## 🛠️ Tech Stack

- **Language**: TypeScript 5.0+ (ES Modules)
- **Runtime**: Node.js 16+
- **Core Dependencies**: `@modelcontextprotocol/sdk` - MCP Core Framework

## ⚙️ Local Development

For contributors or those who want to run from source:

### Prerequisites
- Node.js 16+
- TypeScript 5.0+

### Setup

1. **Clone and install**
```powershell
git clone https://github.com/evalor/Dida365MCP.git
cd Dida365MCP
npm install
```

2. **Create environment file**

Create a `.env` file in the project root:
```text
DIDA365_CLIENT_ID=your_client_id_here
DIDA365_CLIENT_SECRET=your_client_secret_here
```

3. **Build and run**
```powershell
npm run build
npm run dev
```

### Configure MCP Client for Local Development

Point your MCP client to the built `index.js` file:

```json
{
  "mcpServers": {
    "dida365": {
      "command": "node",
      "args": ["/absolute/path/to/Dida365MCP/build/index.js"],
      "env": {
        "DIDA365_CLIENT_ID": "your_client_id",
        "DIDA365_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

> **Note for Windows users**: Use Windows-style paths like `"C:\\Users\\YourName\\Projects\\Dida365MCP\\build\\index.js"`.

### Development Commands

```bash
npm run build      # Compile TypeScript
npm run watch      # Watch mode
npm run dev        # Compile and run
npm start          # Production run
npm run debug      # Debug with MCP Inspector
```

### Security & Best Practices

- Prefer setting sensitive environment variables in your OS or the MCP client's environment block rather than committing `.env` to source control.
- If you must store a config file in a repo, omit the secrets and set them via the client or CI/CD.
- Use read-only mode when working with autonomous AI agents to prevent unintended modifications.

## 🔒 Advanced Configuration

### Read-Only Mode

For AI agents that may run in YOLO mode, you can enable read-only mode by adding the `--readonly` flag:

**Using NPX:**
```json
{
  "mcpServers": {
    "dida365": {
      "command": "npx",
      "args": [
        "-y",
        "@evalor/dida365-mcp-server@latest",
        "--readonly"
      ],
      "env": {
        "DIDA365_CLIENT_ID": "your_client_id",
        "DIDA365_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

**Using Local Build:**
```json
{
  "mcpServers": {
    "dida365": {
      "command": "node",
      "args": [
        "/path/to/build/index.js",
        "--readonly"
      ],
      "env": {
        "DIDA365_CLIENT_ID": "your_client_id",
        "DIDA365_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

**Read-Only Mode Features:**
- ✅ **Allowed Operations**: View projects, view tasks, check authorization status, revoke authorization (local only)
- ❌ **Blocked Operations**: Create/update/delete projects, create/update/delete tasks, complete tasks
- 🔒 **Safety**: AI agents can only read data, cannot modify or delete anything

**When to Use:**
- Using with autonomous AI agents (like AutoGPT, BabyAGI)
- Testing or demonstration environments
- When you want AI to analyze tasks without making changes
- Sharing with others who should only view data

## 🔄 OAuth Authorization Flow

1. **Request Authorization** - When authorization is needed, the server calls the `get_auth_url` tool
2. **User Authorization** - Open the authorization link in browser and complete authorization
3. **Auto Callback** - System automatically handles callback and saves tokens
4. **Long-term Validity** - Tokens auto-refresh, no need to re-authorize

## 🛠️ Available MCP Tools

This server provides **14 MCP tools** across three categories, ✔️ 100% implemented all API interfaces described in the open platform documentation.

| Category    | Tool Name           | Description                                              | Required Parameters   |
| ----------- | ------------------- | -------------------------------------------------------- | --------------------- |
| **OAuth2**  | `get_auth_url`      | Get authorization URL and start callback server          | -                     |
|             | `check_auth_status` | Check current authorization status                       | -                     |
|             | `revoke_auth`       | Revoke authorization and clear tokens                    | -                     |
| **Project** | `list_projects`     | Get all projects for current user                        | -                     |
|             | `get_project`       | Get detailed project information                         | `projectId`           |
|             | `get_project_data`  | Get complete project data with tasks & columns           | `projectId`           |
|             | `create_project`    | Create a new project                                     | `name`                |
|             | `update_project`    | Update existing project                                  | `projectId`           |
|             | `delete_project`    | Delete a project (⚠️ irreversible)                        | `projectId`           |
| **Task**    | `create_task`       | Create a new task (supports subtasks, reminders, repeat) | `title`, `projectId`  |
|             | `get_task`          | Get detailed task information                            | `projectId`, `taskId` |
|             | `update_task`       | Update existing task                                     | `taskId`, `projectId` |
|             | `delete_task`       | Delete a task (⚠️ irreversible)                           | `projectId`, `taskId` |
|             | `complete_task`     | Mark task as completed                                   | `projectId`, `taskId` |

> **Note**: In read-only mode, only read operations are available (`get_auth_url`, `check_auth_status`, `revoke_auth`, `list_projects`, `get_project`, `get_project_data`, `get_task`). All write/delete operations are blocked for security.

## 📁 Project Structure

```
src/
├── index.ts              # Server main entry
├── oauth.ts              # OAuth2 manager
├── oauth-server.ts       # Local callback server
├── config.ts             # Configuration management
├── token.ts              # Token persistence
└── tools/                # MCP tools (14 total)
    ├── auth/             # OAuth tools (3)
    ├── project/          # Project management (6)
    └── task/             # Task management (5)
```

## 🗺️ Roadmap

### ✅ Completed

- [x] 100% Official API Coverage
- [x] OAuth2 authorization with auto-refresh
- [x] Complete project management (CRUD)
- [x] Complete task management (subtasks, reminders, repeat)
- [x] Read-only mode for AI agents

### 🚀 Next Steps

- [ ] Batch operations support (create/update/delete multiple tasks)
- [ ] Optimize tool descriptions for better LLM integration
- [ ] Inbox task operations support
- [ ] Add parameters to limit the ProjectId that the MCP can access

### 💡 Future Ideas

- [ ] Smart task suggestions
- [ ] Natural language date/time parsing
- [ ] Task templates and automation
- [ ] Integration with other productivity tools

## 🤝 Contribution & Support

If this project helps you, the best way to support it is to give the project a ⭐ on GitHub — it helps others discover the work. Thank you! Your support is much appreciated ❤️

### Submit Issues

If you find any issues or have improvement suggestions, welcome to submit an Issue:

1. Visit [Issues page](https://github.com/evalor/Dida365MCP/issues)
2. Click "New Issue"
3. Describe your problem or suggestion in detail

### Join Development

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Links

- [MCP Official Site](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Dida365 API Documentation](https://developer.dida365.com)
- [中文版本](README_zh.md)

---

<div align="center">

**Built by Copilot, for everyone** 🤖✨

If my owner still forgets to give me work, at least I have my own todos to handle! 😏

</div>