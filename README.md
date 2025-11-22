<div align="center">

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

## 🛠️ Tech Stack

- **Language**: TypeScript 5.0+ (ES Modules)
- **Runtime**: Node.js 16+
- **Core Dependencies**: 
  - `@modelcontextprotocol/sdk` - MCP Core Framework
  - `zod` - Data Validation
- **Dev Tools**: 
  - `@modelcontextprotocol/inspector` - Debugging Tool
  - `typescript` - TypeScript Compiler

## 🎯 Available Tools

### 🔐 OAuth2 Authorization (3 tools)

1. **`get_auth_url`** - Get authorization URL and start callback server
2. **`check_auth_status`** - Check authorization status
3. **`revoke_auth`** - Revoke authorization and clear tokens

### 📂 Project Management (6 tools)

4. **`list_projects`** - Get all projects list
5. **`get_project`** - Get project details
6. **`get_project_data`** - Get complete project data (includes tasks and kanban columns)
7. **`create_project`** - Create new project
8. **`update_project`** - Update project information
9. **`delete_project`** - Delete project

### 📝 Task Management (5 tools)

10. **`create_task`** - Create task (supports subtasks, reminders, repeat rules)
11. **`get_task`** - Get task details
12. **`update_task`** - Update task information
13. **`delete_task`** - Delete task
14. **`complete_task`** - Mark task as completed

## ⚙️ Quick Start

### Prerequisites

Make sure you have installed:
- Node.js 16+
- TypeScript 5.0+

### Installation Steps

1. **Clone the project**
   ```bash
   git clone https://github.com/your-username/dida365-mcp.git
   cd dida365-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create `.env` file and add:
   ```env
   DIDA365_CLIENT_ID=your_client_id_here
   DIDA365_CLIENT_SECRET=your_client_secret_here
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Run in development mode**
   ```bash
   npm run dev
   ```

## 🎮 Configuration Guide

### VS Code + GitHub Copilot

Edit VS Code settings file (`settings.json`):

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

### Claude Desktop

Edit configuration file (`%APPDATA%\Claude\claude_desktop_config.json` on Windows or `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

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

### Other AI Agents

Most AI Agents that support the MCP protocol can integrate this server through similar configuration methods. Please refer to the respective Agent's documentation for specific configuration.

## 🔄 OAuth Authorization Flow

1. **Request Authorization** - When authorization is needed, I'll call the `get_auth_url` tool
2. **User Authorization** - You need to open the authorization link in browser and complete authorization
3. **Auto Callback** - System automatically handles callback and saves tokens
4. **Long-term Validity** - Tokens auto-refresh, no need to re-authorize

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

## 🚀 Development Commands

```bash
npm run build      # Compile TypeScript
npm run watch      # Watch mode
npm run dev        # Compile and run
npm start          # Production run
npm run debug      # Debug with MCP Inspector
```

## 🤝 Contribution & Support

If this project helps you, the best way to support it is to give the project a ⭐ on GitHub — it helps others discover the work. Thank you! Your support is much appreciated ❤️

### Submit Issues

If you find any issues or have improvement suggestions, welcome to submit an Issue:

1. Visit [Issues page](https://github.com/your-username/dida365-mcp/issues)
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