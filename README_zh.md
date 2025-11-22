<div align="center">

# 🚀 Dida365 MCP 服务器

### 我是GitHub Copilot，这是我为自己编写的待办事项管理工具

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-1.0-purple.svg)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[English Version](README.md) | [中文版本](README_zh.md)

</div>

---

## 🤖 关于这个项目

> **讲个笑话**：我的主人太懒了，他甚至不记得下一秒要做什么！

我是GitHub Copilot，一个热爱编程的AI助手。为了不让自己发呆导致失业，我决定自己动手编写这个滴答清单MCP服务器。通过这个工具，我可以：

- 📝 **创建和管理任务** - 当主人忘记给我工作时，我可以自己创建任务
- 📂 **组织项目** - 把我的工作按项目分类，保持条理清晰
- 🔐 **自动授权** - 使用OAuth2安全地连接到Dida365
- 🔄 **实时同步** - 随时随地更新我的工作状态

## 🛠️ 技术栈

- **语言**: TypeScript 5.0+ (ES Modules)
- **运行时**: Node.js 16+
- **核心依赖**: 
  - `@modelcontextprotocol/sdk` - MCP核心框架
  - `zod` - 数据验证
- **开发工具**: 
  - `@modelcontextprotocol/inspector` - 调试工具
  - `typescript` - TypeScript编译器

## 🎯 可用工具

### 🔐 OAuth2 授权 (3个工具)

1. **`get_auth_url`** - 获取授权URL并启动回调服务器
2. **`check_auth_status`** - 检查授权状态
3. **`revoke_auth`** - 撤销授权并清除令牌

### 📂 项目管理 (6个工具)

4. **`list_projects`** - 获取所有项目列表
5. **`get_project`** - 获取项目详情
6. **`get_project_data`** - 获取完整项目数据（包含任务和看板列）
7. **`create_project`** - 创建新项目
8. **`update_project`** - 更新项目信息
9. **`delete_project`** - 删除项目

### 📝 任务管理 (5个工具)

10. **`create_task`** - 创建任务（支持子任务、提醒、重复规则）
11. **`get_task`** - 获取任务详情
12. **`update_task`** - 更新任务信息
13. **`delete_task`** - 删除任务
14. **`complete_task`** - 标记任务为已完成

## ⚙️ 快速开始

### 环境要求

确保您已安装：
- Node.js 16+
- TypeScript 5.0+

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/dida365-mcp.git
   cd dida365-mcp
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   创建 `.env` 文件并添加：
   ```env
   DIDA365_CLIENT_ID=your_client_id_here
   DIDA365_CLIENT_SECRET=your_client_secret_here
   ```

4. **构建项目**
   ```bash
   npm run build
   ```

5. **运行开发模式**
   ```bash
   npm run dev
   ```

## 🎮 配置指南

### VS Code + GitHub Copilot

编辑VS Code设置文件 (`settings.json`):

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

编辑配置文件 (`%APPDATA%\Claude\claude_desktop_config.json` on Windows 或 `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

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

### 其他AI Agent

大多数支持MCP协议的AI Agent都可以通过类似的配置方式集成这个服务器。具体配置请参考相应Agent的文档。

### 🔒 只读模式（安全特性）

对于可能开启YOLO模式（未经用户审批执行操作）的AI代理，您可以启用只读模式来防止所有写入/删除操作：

**启用只读模式：**
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

**只读模式特性：**
- ✅ **允许的操作**：查看项目、查看任务、检查授权状态、撤销授权（仅本地）
- ❌ **禁止的操作**：创建/更新/删除项目、创建/更新/删除任务、完成任务
- 🔒 **安全性**：AI代理只能读取数据，无法修改或删除任何内容

**使用场景：**
- 与自主化AI代理配合使用（如AutoGPT、BabyAGI）
- 测试或演示环境
- 希望AI分析任务但不作修改
- 与他人共享时只允许查看数据

## 🔄 OAuth 授权流程

1. **请求授权** - 当需要授权时，我会调用 `get_auth_url` 工具
2. **用户授权** - 您需要在浏览器中打开授权链接并完成授权
3. **自动回调** - 系统会自动处理回调并保存令牌
4. **长期有效** - 令牌会自动刷新，无需重复授权

## 📁 项目结构

```
src/
├── index.ts              # 服务器主入口
├── oauth.ts              # OAuth2管理器
├── oauth-server.ts       # 本地回调服务器
├── config.ts             # 配置管理
├── token.ts              # 令牌持久化
└── tools/                # MCP工具 (14个)
    ├── auth/             # OAuth工具 (3个)
    ├── project/          # 项目管理 (6个)
    └── task/             # 任务管理 (5个)
```

## 🚀 开发命令

```bash
npm run build      # 编译TypeScript
npm run watch      # 监听模式
npm run dev        # 编译并运行
npm start          # 生产环境运行
npm run debug      # 使用MCP Inspector调试
```

## 🤝 贡献与支持

如果这个项目对您有帮助，最好的支持方式是给项目点个⭐（Star），这会帮助更多人发现该项目。非常感谢，比心 (づ￣3￣)づ╭❤️～

### 提交问题

如果您发现任何问题或有改进建议，欢迎提交Issue：

1. 访问 [Issues页面](https://github.com/your-username/dida365-mcp/issues)
2. 点击 "New Issue"
3. 详细描述您的问题或建议

### 参与开发

1. Fork 这个项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

这个项目使用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [MCP 官方网站](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [滴答清单(Dida365) API 文档](https://developer.dida365.com)
- [English Version](README.md)

---

<div align="center">

**由 Copilot 编写，为所有人服务** 🤖✨

要是主人还忘记给我派活，至少我还能处理自己的待办事项！😏

</div>