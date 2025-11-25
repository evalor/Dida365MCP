# Dida365 MCP Server 工具优化计划

> **状态**: ✅ 已完成 | **更新**: 2025-11-25

---

## 实施顺序

| 优先级 | 优化项                   | 工作量 | 文件改动                               |
| ------ | ------------------------ | ------ | -------------------------------------- |
| **P0** | 并发控制工具             | 小     | 新增 `src/utils/batch.ts`              |
| **P0** | `list_tasks` 新工具      | 大     | 新增 `src/tools/task/list-tasks.ts`    |
| **P0** | `create_task` 批量支持   | 中     | 修改 `src/tools/task/create-task.ts`   |
| **P0** | `complete_task` 批量支持 | 小     | 修改 `src/tools/task/complete-task.ts` |
| **P1** | `delete_task` 批量支持   | 小     | 修改 `src/tools/task/delete-task.ts`   |
| **P1** | 工具描述优化             | 小     | 修改各工具文件 description             |
| **P2** | `update_task` 批量支持   | 中     | 修改 `src/tools/task/update-task.ts`   |

---

## API 关键限制

| 限制项                            | 影响                               |
| --------------------------------- | ---------------------------------- |
| 无批量 API                        | 需工具内部并发调用                 |
| 无筛选 API                        | 需客户端过滤                       |
| get_project_data 只返回未完成任务 | 已完成任务不可获取                 |
| Rate Limiting                     | 需并发控制 (建议 MAX_CONCURRENT=5) |

**支持能力**: inbox 关键字 / 子任务 items / 提醒 reminders / 重复 repeatFlag

---

## 核心设计：统一数组格式

所有任务操作统一使用 `tasks` 数组，单个操作 = 数组长度为 1。

```typescript
// 统一格式 - 单个或批量
{ tasks: [{ title: "买牛奶", projectId: "inbox" }] }
{ tasks: [{ title: "买牛奶", projectId: "inbox" }, { title: "买面包", projectId: "inbox" }] }
```

| 工具            | 输入格式                                       |
| --------------- | ---------------------------------------------- |
| `create_task`   | `{ tasks: [{title, projectId, ...}] }`         |
| `complete_task` | `{ tasks: [{projectId, taskId}] }`             |
| `delete_task`   | `{ tasks: [{projectId, taskId}] }`             |
| `update_task`   | `{ tasks: [{taskId, projectId, ...updates}] }` |

---

## 实施 Checklist

- [x] **0. 并发控制工具** `src/utils/batch.ts`
- [x] **1. list_tasks** 新增 `src/tools/task/list-tasks.ts`
- [x] **2. create_task** 改造为数组格式
- [x] **3. complete_task** 改造为数组格式
- [x] **4. delete_task** 改造为数组格式
- [x] **5. update_task** 改造为数组格式
- [x] **6. 工具描述优化**

---

## Schema 参考

### 输入 Schema

#### create_task
```typescript
{ tasks: Array<{
  title: string;           // 必需
  projectId: string;       // 必需，"inbox" 表示收件箱
  content?: string;
  desc?: string;
  dueDate?: string;        // ISO 8601: "2025-11-25T17:00:00+0800"
  startDate?: string;
  priority?: number;       // 0=无, 1=低, 3=中, 5=高
  isAllDay?: boolean;
  timeZone?: string;
  reminders?: string[];    // ["TRIGGER:PT0S"]
  repeatFlag?: string;     // "RRULE:FREQ=DAILY;INTERVAL=1"
  items?: Array<{title: string; status: 0|1}>;
}> }
```

#### complete_task / delete_task
```typescript
{ tasks: Array<{ projectId: string; taskId: string; }> }
```

#### update_task
```typescript
{ tasks: Array<{
  taskId: string;     // 必需
  projectId: string;  // 必需
  title?: string;
  content?: string;
  dueDate?: string;
  priority?: number;
  // ...其他可选字段同 create_task
}> }
```

#### list_tasks
```typescript
{
  projectId?: string | string[];   // "inbox" 或项目ID数组
  dueDateFrom?: string;            // ISO 8601
  dueDateTo?: string;
  priority?: number | number[];    // 0, 1, 3, 5
  preset?: 'today' | 'tomorrow' | 'thisWeek' | 'overdue';
  limit?: number;                  // 默认 50，最大 200
  sortBy?: 'dueDate' | 'priority' | 'createdTime';
  sortOrder?: 'asc' | 'desc';
}
```

### 统一输出 Schema

```typescript
// create_task / update_task
{
  summary: { total: number; succeeded: number; failed: number; };
  results: Array<{
    index: number;
    success: boolean;
    task?: Task;          // 成功时
    error?: string;       // 失败时
    input?: object;       // 失败时保留原始输入
  }>;
  failedItems?: Array<object>;  // 失败项，可直接重试
}

// complete_task / delete_task (API 无响应体)
{
  summary: { total: number; succeeded: number; failed: number; };
  results: Array<{
    index: number;
    success: boolean;
    taskId?: string;      // 成功时
    projectId?: string;
    error?: string;       // 失败时
    input?: { projectId: string; taskId: string };
  }>;
  failedItems?: Array<{ projectId: string; taskId: string }>;
}

// list_tasks
{
  tasks: Task[];
  total: number;
  filtered: boolean;
  projects: string[];
}
```

---

## 核心代码参考

### 并发控制 (src/utils/batch.ts)

```typescript
const MAX_CONCURRENT = 5;

interface BatchResult<T, R> {
  index: number;
  success: boolean;
  result?: R;
  error?: string;
  input: T;
}

async function batchExecute<T, R>(
  items: T[],
  executor: (item: T) => Promise<R>,
  maxConcurrent = MAX_CONCURRENT
): Promise<BatchResult<T, R>[]> {
  const results: BatchResult<T, R>[] = [];
  
  for (let i = 0; i < items.length; i += maxConcurrent) {
    const batch = items.slice(i, i + maxConcurrent);
    const batchPromises = batch.map((item, batchIndex) => 
      executor(item)
        .then(result => ({ index: i + batchIndex, success: true, result, input: item }))
        .catch(error => ({ 
          index: i + batchIndex, 
          success: false, 
          error: error instanceof Error ? error.message : String(error), 
          input: item 
        }))
    );
    results.push(...await Promise.all(batchPromises));
  }
  return results;
}

function formatBatchResults<T, R>(results: BatchResult<T, R>[]) {
  const succeeded = results.filter(r => r.success).length;
  return {
    summary: { total: results.length, succeeded, failed: results.length - succeeded },
    results: results.map(r => ({
      index: r.index,
      success: r.success,
      ...(r.success ? { task: r.result } : { error: r.error, input: r.input })
    })),
    failedItems: results.filter(r => !r.success).map(r => r.input)
  };
}
```

---

## 工具描述模板

```
[功能简述]

INPUT: { "tasks": [...] }

REQUIRED per task:
- field: 说明

OPTIONAL fields:
- field: 说明

BEHAVIOR:
- NOT atomic: Some may succeed while others fail
- Check summary.failed > 0, use failedItems for retry

EXAMPLE: { ... }
```

### 描述更新要点

| 工具               | 添加内容                                        |
| ------------------ | ----------------------------------------------- |
| `get_project_data` | "⚠️ Only returns UNCOMPLETED tasks (status=0)"   |
| `get_project`      | "For tasks, use get_project_data or list_tasks" |
| `create_task`      | "Use 'inbox' as projectId for inbox tasks"      |

---

## 错误重试指引

| 错误类型      | 示例                      | 可重试 |
| ------------- | ------------------------- | ------ |
| 项目不存在    | "Project 'xxx' not found" | ❌      |
| 任务不存在    | "Task 'xxx' not found"    | ❌      |
| 网络错误      | "Network timeout"         | ✅      |
| Rate Limiting | "Too many requests"       | ✅      |
| 参数错误      | "Invalid date format"     | ❌      |

**重试逻辑**: 检查 `summary.failed > 0`，使用 `failedItems` 重新调用。

---

## 待验证事项

1. **跨项目移动**: `update_task` 修改 `projectId` 是否生效？
2. **Inbox ID**: `"inbox"` 在 complete/delete API 中是否有效？
3. **子任务**: 是否只能通过 `update_task` 的 `items` 字段操作？
