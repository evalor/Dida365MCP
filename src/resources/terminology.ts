/**
 * Resource: Terminology Glossary
 * Provides bilingual (Chinese-English) terminology mappings for Dida365/TickTick
 * Helps LLMs understand the Chinese interface terminology used by Simplified Chinese users
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Terminology glossary content
 * This resource provides terminology mappings between English (TickTick) and 
 * Simplified Chinese (Dida365/滴答清单) interfaces.
 */
const TERMINOLOGY_GLOSSARY = `# Dida365/TickTick Terminology Glossary (术语对照表)

This glossary provides terminology mappings between English (TickTick) and Simplified Chinese (Dida365/滴答清单) interfaces to help understand Chinese user requests.

## Core Concepts (核心概念)

| English | 中文 | Parameter/Value | Notes |
|---------|------|-----------------|-------|
| Inbox | 收集箱 | projectId: "inbox" | Default location for uncategorized tasks (未分类任务的默认位置) |
| Project | 清单 | projectId | Container for organizing tasks (用于组织任务的容器) |
| Task | 任务 | taskId | To-do item (待办事项) |
| Subtask | 子任务 | items[] | Child item under a task (任务下的子项) |
| Checklist Item | 检查项 | items[] | Same as subtask (与子任务相同) |
| Note | 笔记 | kind: "NOTE" | Used for recording text content (用于记录文本内容) |

## Task Properties (任务属性)

| English | 中文 | Parameter | Values |
|---------|------|-----------|--------|
| Title | 标题 | title | String |
| Description | 描述/备注 | description | Auto-maps to content/desc |
| Due Date | 截止日期 | dueDate | ISO 8601 format |
| Start Date | 开始日期 | startDate | ISO 8601 format |
| Priority | 优先级 | priority | 0=无, 1=低, 3=中, 5=高 |
| Reminder | 提醒 | reminders[] | TRIGGER format |
| Repeat | 重复 | repeatFlag | RRULE format |
| Tag | 标签 | tags[] | String array |
| All Day | 全天 | isAllDay | Boolean |
| Completed | 已完成 | status | 0=未完成, 1=已完成 |

## Priority Levels (优先级)

| English | 中文 | Value |
|---------|------|-------|
| None | 无优先级 | 0 |
| Low | 低优先级 | 1 |
| Medium | 中优先级 | 3 |
| High | 高优先级 | 5 |

## Project Properties (清单属性)

| English | 中文 | Parameter | Values |
|---------|------|-----------|--------|
| Name | 名称 | name | String |
| Color | 颜色 | color | Hex format (e.g., '#F18181') |
| View Mode | 视图模式 | viewMode | 'list'=列表, 'kanban'=看板, 'timeline'=时间线 |
| Type | 类型 | kind | 'TASK'=任务清单, 'NOTE'=笔记清单 |
| Folder | 文件夹/分组 | groupId | String |

## Common User Requests (常见用户请求)

### Chinese Request → Tool Mapping

| Chinese Request | English Meaning | Tool to Use |
|----------------|-----------------|-------------|
| 把任务添加到收集箱 | Add task to inbox | create_task with projectId: "inbox" |
| 创建新清单 | Create new project | create_project |
| 查看我的清单 | View my projects | list_projects |
| 查看清单里的任务 | View tasks in project | get_project_data or list_tasks |
| 设置高优先级 | Set high priority | create_task/update_task with priority: 5 |
| 添加子任务 | Add subtask | create_task/update_task with items[] |
| 设置截止日期 | Set due date | create_task/update_task with dueDate |
| 设置提醒 | Set reminder | create_task/update_task with reminders[] |
| 完成任务 | Complete task | complete_task |
| 删除任务 | Delete task | delete_task |
| 今天的任务 | Today's tasks | list_tasks with preset: "today" |
| 逾期任务 | Overdue tasks | list_tasks with preset: "overdue" |
| 本周任务 | This week's tasks | list_tasks with preset: "thisWeek" |

## Notes

- When Chinese users say "清单" (qingdan), they mean "Project" in the English interface
- "收集箱" (shouji xiang) refers to the Inbox, which is accessed using projectId: "inbox"
- Priority values: 高(high)=5, 中(medium)=3, 低(low)=1, 无(none)=0
- The app is called "滴答清单" in China (Dida365) and "TickTick" internationally
`;

/**
 * Resource registration function type
 */
export type ResourceRegistrationFunction = (server: McpServer) => void;

/**
 * Register the terminology glossary resource
 */
export const registerTerminologyResource: ResourceRegistrationFunction = (server) => {
    server.registerResource(
        "terminology",
        "dida365://terminology/glossary",
        {
            description: `Bilingual terminology glossary (中英术语对照表) for Dida365/TickTick. 
Provides mappings between English terms (TickTick) and Simplified Chinese terms (滴答清单/Dida365). 
Read this resource to understand Chinese user requests and map them to the correct tool calls.
当处理中文用户请求时，阅读此资源以理解中文术语与英文参数的对应关系。`,
            mimeType: "text/markdown",
        },
        async () => {
            return {
                contents: [
                    {
                        uri: "dida365://terminology/glossary",
                        mimeType: "text/markdown",
                        text: TERMINOLOGY_GLOSSARY,
                    },
                ],
            };
        }
    );
};
