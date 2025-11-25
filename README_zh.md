<div align="center">

<img src="public/static/logo.png" alt="滴答清单 Logo" width="200" height="auto"/>

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

## 🚀 快速开始

无需克隆仓库，使用 `npx` 即可快速开始：

### 1. 获取 OAuth 凭证

需要一个滴答清单/TickTick账户和OAuth凭证。详细的注册步骤请参见下方的 [🔑 获取 OAuth 凭证](#-获取-oauth-凭证) 章节。

### 2. 配置 MCP 客户端

将以下配置添加到您的 MCP 客户端（Claude Desktop、VS Code 等）：

**Claude Desktop** (`claude_desktop_config.json`)：
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

**VS Code** (`settings.json`)：
- 打开设置 → 搜索 "MCP" → 在 settings.json 中编辑

**配置内容：**
```json
{
  "mcpServers": {
    "dida365": {
      "command": "npx",
      "args": [
        "-y",
        "dida365-mcp-server@latest"
      ],
      "env": {
        "DIDA365_CLIENT_ID": "your_client_id_here",
        "DIDA365_CLIENT_SECRET": "your_client_secret_here",
        "DIDA365_REGION": "china"
      }
    }
  }
}
```

> **高级功能**：若要启用只读模式（防止写入/删除操作），在 args 数组中添加 `"--readonly"`。详见 [高级配置](#-高级配置)。

### 3. 重启 MCP 客户端

重启 MCP 客户端（Claude Desktop、VS Code 等）以加载新配置。

### 4. 授权访问

首次使用滴答清单工具时，AI 将引导您完成 OAuth 授权流程：
1. AI 将提供授权 URL
2. 在浏览器中打开该 URL
3. 登录并授权应用
4. 令牌将自动保存以供后续使用

### 5. 验证安装

重启 MCP 客户端后：
- **Claude Desktop**：在聊天时查找工具列表中的滴答清单工具
- **VS Code**：检查状态栏中的 MCP 状态或使用命令面板
- 询问 AI 助手："有哪些滴答清单工具可用？"以确认服务器已加载

大功告成！准备好用 AI 管理任务了。🎉

## 🔑 获取 OAuth 凭证

使用此 MCP 服务器需要一个滴答清单/TickTick账户。

### 注册应用

根据您所在的地区，在开发者中心注册应用：

- **国际版 (TickTick)**：https://developer.ticktick.com
- **中国版 (滴答清单)**：https://developer.dida365.com

### 分步指南

1. **创建新应用**
   - 登录开发者中心
   - 点击 "New App"（或中文版的"创建应用"）
   - 填写应用名称和描述

2. **配置重定向 URI**
   - 将 **Redirect URI** 设置为：`http://localhost:8521/callback`
   - ⚠️ **重要**：重定向 URI 必须完全为 `http://localhost:8521/callback`（端口 8521 在服务器中硬编码）

3. **获取凭证**
   - 创建应用后，将显示 **Client ID** 和 **Client Secret**
   - 复制这些值 - MCP 客户端配置需要它们
   - ⚠️ **安全提示**：妥善保管 Client Secret，切勿提交到公开仓库

### 使用凭证

将这些凭证添加到 MCP 客户端配置中：

```json
{
  "env": {
    "DIDA365_CLIENT_ID": "your_client_id_here",
    "DIDA365_CLIENT_SECRET": "your_client_secret_here",
    "DIDA365_REGION": "china"
  }
}
```

### 区域配置

此服务器支持 TickTick 国际版和 Dida365 国内版：

- **中国区域** (`DIDA365_REGION=china`)：默认，使用 `dida365.com` 端点
- **国际区域** (`DIDA365_REGION=international`)：使用 `ticktick.com` 端点

⚠️ **重要**：Token 是区域特定的。更改区域将使现有 Token 失效，需要重新授权。

完整的配置示例请参见 [快速开始](#-快速开始) 章节。

## 🛠️ 技术栈

- **语言**: TypeScript 5.0+ (ES Modules)
- **运行时**: Node.js 16+
- **核心依赖**: `@modelcontextprotocol/sdk` - MCP 核心框架

## ⚙️ 本地开发

适用于贡献者或希望从源码运行的用户：

### 环境要求
- Node.js 16+
- TypeScript 5.0+

### 安装步骤

1. **克隆并安装**
```powershell
git clone https://github.com/evalor/Dida365MCP.git
cd Dida365MCP
npm install
```

2. **创建环境文件**

在项目根目录创建 `.env` 文件：
```text
DIDA365_CLIENT_ID=your_client_id_here
DIDA365_CLIENT_SECRET=your_client_secret_here
DIDA365_REGION=china  # 或 'international' 用于 TickTick
```

3. **构建并运行**
```powershell
npm run build
npm run dev
```

### 为本地开发配置 MCP 客户端

将 MCP 客户端指向构建后的 `index.js` 文件：

```json
{
  "mcpServers": {
    "dida365": {
      "command": "node",
      "args": ["/absolute/path/to/Dida365MCP/build/index.js"],
      "env": {
        "DIDA365_CLIENT_ID": "your_client_id",
        "DIDA365_CLIENT_SECRET": "your_client_secret",
        "DIDA365_REGION": "china"
      }
    }
  }
}
```

> **Windows 用户注意**：使用 Windows 风格的路径，如 `"C:\\Users\\YourName\\Projects\\Dida365MCP\\build\\index.js"`。

### 开发命令

```bash
npm run build      # 编译 TypeScript
npm run watch      # 监听模式（自动编译变更）
npm run dev        # 编译并运行
npm start          # 生产环境运行
npm run debug      # 使用 MCP Inspector 调试（一次性）
npm run debug:watch # 带热重载的调试（变更时自动重启）
npm run debug:hot  # 使用 tsx watch 运行（实验性）
```

### 安全与最佳实践

- 优先在操作系统或 MCP 客户端的环境块中设置敏感环境变量，而不是将 `.env` 提交到源代码控制。
- 如果必须在仓库中存储配置文件，请省略密钥并通过客户端或 CI/CD 设置。
- 与自主 AI 代理配合使用时，启用只读模式以防止意外修改。

## 🔒 高级配置

### 只读模式

对于可能以 YOLO 模式运行的 AI 代理，可以通过添加 `--readonly` 标志启用只读模式：

**使用 NPX：**
```json
{
  "mcpServers": {
    "dida365": {
      "command": "npx",
      "args": [
        "-y",
        "dida365-mcp-server@latest",
        "--readonly"
      ],
      "env": {
        "DIDA365_CLIENT_ID": "your_client_id",
        "DIDA365_CLIENT_SECRET": "your_client_secret",
        "DIDA365_REGION": "china"
      }
    }
  }
}
```

**使用本地构建：**
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
        "DIDA365_CLIENT_SECRET": "your_client_secret",
        "DIDA365_REGION": "china"
      }
    }
  }
}
```

**只读模式特性：**
- ✅ **允许的操作**：查看项目、查看任务、检查授权状态、撤销授权（仅本地）
- ❌ **禁止的操作**：创建/更新/删除项目、创建/更新/删除任务、完成任务
- 🔒 **安全性**：AI 代理只能读取数据，无法修改或删除任何内容

**使用场景：**
- 与自主 AI 代理配合使用（如 AutoGPT、BabyAGI）
- 测试或演示环境
- 希望 AI 分析任务但不进行更改
- 与只应查看数据的他人共享

## 🔄 OAuth 授权流程

1. **请求授权** - 需要授权时，服务器调用 `get_auth_url` 工具
2. **用户授权** - 在浏览器中打开授权链接并完成授权
3. **自动回调** - 系统自动处理回调并保存令牌
4. **长期有效** - 令牌自动刷新，无需重新授权

## 🛠️ 可用的 MCP 工具

此服务器提供 **15 个 MCP 工具**，分为三类，✔️ 100% 实现了开放平台文档中描述的所有 API 接口。

| 类别       | 工具名称            | 描述                                 | 必需参数              |
| ---------- | ------------------- | ------------------------------------ | --------------------- |
| **OAuth2** | `get_auth_url`      | 获取授权 URL 并启动回调服务器        | -                     |
|            | `check_auth_status` | 检查当前授权状态                     | -                     |
|            | `revoke_auth`       | 撤销授权并清除令牌                   | -                     |
| **项目**   | `list_projects`     | 获取当前用户的所有项目               | -                     |
|            | `get_project`       | 获取项目详细信息                     | `projectId`           |
|            | `get_project_data`  | 获取完整项目数据（包含任务和列）     | `projectId`           |
|            | `create_project`    | 创建新项目                           | `name`                |
|            | `update_project`    | 更新现有项目                         | `projectId`           |
|            | `delete_project`    | 删除项目（⚠️ 不可逆）                 | `projectId`           |
| **任务**   | `list_tasks`        | 列出任务（支持跨项目批量查询和过滤） | -                     |
|            | `create_task`       | 创建任务（支持批量创建和子任务）     | `tasks[]`             |
|            | `get_task`          | 获取任务详细信息                     | `projectId`, `taskId` |
|            | `update_task`       | 更新任务（支持批量更新）             | `tasks[]`             |
|            | `delete_task`       | 删除任务（⚠️ 不可逆，支持批量）       | `tasks[]`             |
|            | `complete_task`     | 标记任务为已完成（支持批量）         | `tasks[]`             |

> **注意**：在只读模式下，仅可用读取操作（`get_auth_url`、`check_auth_status`、`revoke_auth`、`list_projects`、`get_project`、`get_project_data`、`list_tasks`、`get_task`）。所有写入/删除操作均被禁用以确保安全。

## 📚 MCP 资源

此服务器提供 MCP 资源以帮助 LLM 理解中文术语：

| 资源名称 | URI | 描述 |
|---------|-----|------|
| `terminology` | `dida365://terminology/glossary` | 中英术语对照表，将中文术语映射到英文参数 |

### 术语资源

术语资源提供全面的对照表，帮助 LLM：
- 将中文术语如"清单"（project）、"收集箱"（inbox）、"任务"（task）映射到正确的工具参数
- 理解优先级等级：高=5、中=3、低=1、无=0
- 将常见的中文用户请求转换为适当的工具调用

**示例映射：**
| 中文请求 | 英文含义 | 使用的工具 |
|---------|---------|-----------|
| 把任务添加到收集箱 | Add task to inbox | `create_task`，参数 `projectId: "inbox"` |
| 创建新清单 | Create new project | `create_project` |
| 查看今天的任务 | View today's tasks | `list_tasks`，参数 `preset: "today"` |

## 📁 项目结构

```
src/
├── index.ts              # 服务器主入口
├── oauth.ts              # OAuth2 管理器
├── oauth-server.ts       # 本地回调服务器
├── config.ts             # 配置管理
├── token.ts              # 令牌持久化
├── utils/                # 工具模块
│   └── batch.ts          # 批量执行工具
├── resources/            # MCP 资源
│   ├── index.ts          # 资源注册
│   └── terminology.ts    # 中英双语术语对照表
└── tools/                # MCP 工具（15 个）
    ├── auth/             # OAuth 工具（3 个）
    ├── project/          # 项目管理（6 个）
    └── task/             # 任务管理（6 个）
```

## 🗺️ 路线图

### ✅ 已完成

- [x] 100% 官方 API 覆盖
- [x] OAuth2 授权及自动刷新
- [x] 完整的项目管理（CRUD）
- [x] 完整的任务管理（子任务、提醒、重复）
- [x] 针对 AI 代理的只读模式
- [x] 批量操作支持（批量创建/更新/删除/完成任务）
- [x] 任务列表查询（跨项目查询、日期/优先级过滤）
- [x] 收集箱任务操作支持
- [x] 中英双语工具描述
- [x] MCP 术语对照表资源

### 🚀 下一步计划

- [ ] 添加参数以限制MCP可访问的ProjectId

### 💡 未来展望

- [ ] 智能任务建议
- [ ] 自然语言日期/时间解析
- [ ] 任务模板和自动化
- [ ] 与其他效率工具的集成

## 🤝 贡献与支持

如果这个项目对您有帮助，最好的支持方式是在 GitHub 上给项目点个 ⭐ — 这能帮助更多人发现这个项目。非常感谢！您的支持意义重大 ❤️

### 提交问题

如果发现任何问题或有改进建议，欢迎提交 Issue：

1. 访问 [Issues 页面](https://github.com/evalor/Dida365MCP/issues)
2. 点击 "New Issue"
3. 详细描述您的问题或建议

### 参与开发

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/new-feature`)
3. 提交更改 (`git commit -m 'feat: implement new feature'`)
4. 推送到分支 (`git push origin feature/new-feature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 🔗 相关链接

- [MCP 官方网站](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [滴答清单 API 文档](https://developer.dida365.com)
- [English Version](README.md)

---

<div align="center">

**由 Copilot 编写，为所有人服务** 🤖✨

要是主人还忘记给我派活，至少我还能处理自己的待办事项！😏

</div>