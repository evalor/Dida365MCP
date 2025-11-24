# TickTick Open API Reference

> **Official Documentation**: https://developer.ticktick.com/docs#/openapi  
> **Last Updated**: 2025-11-24  
> **API Version**: v1  
> **Base URL**: `https://api.ticktick.com`

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Authorization](#authorization)
  - [OAuth2 Flow](#oauth2-flow)
  - [Using Access Token](#using-access-token)
- [API Reference](#api-reference)
  - [Task APIs](#task-apis)
  - [Project APIs](#project-apis)
- [Data Models](#data-models)
- [Error Codes](#error-codes)
- [Support](#support)

---

## Introduction

Welcome to the TickTick Open API documentation. TickTick is a powerful task management application that allows users to easily manage and organize their daily tasks, deadlines, and projects. With TickTick Open API, developers can integrate TickTick's powerful task management features into their own applications and create a seamless user experience.

---

## Getting Started

To get started using the TickTick Open API, you will need to:

1. **Register your application**: Visit the [TickTick Developer Center](https://developer.ticktick.com/manage)
2. **Obtain credentials**: You will receive a `client_id` and `client_secret`
3. **Implement OAuth2**: Use these credentials to authenticate your requests

---

## Authorization

### OAuth2 Flow

TickTick uses the OAuth2 protocol to obtain access tokens. The flow consists of three steps:

#### Step 1: Redirect User to Authorization Page

Redirect the user to: `https://ticktick.com/oauth/authorize`

**Required Parameters:**

| Parameter       | Description                       | Example                          |
| --------------- | --------------------------------- | -------------------------------- |
| `client_id`     | Application unique ID             | `your_client_id`                 |
| `scope`         | Space-separated permission scopes | `tasks:write tasks:read`         |
| `state`         | CSRF protection token             | `random_state_string`            |
| `redirect_uri`  | Your configured redirect URL      | `http://localhost:8521/callback` |
| `response_type` | Fixed value                       | `code`                           |

**Example URL:**
```
https://ticktick.com/oauth/authorize?scope=tasks:write%20tasks:read&client_id=your_client_id&state=random_state&redirect_uri=http://localhost:8521/callback&response_type=code
```

**Available Scopes:**
- `tasks:read` - Read access to tasks and projects
- `tasks:write` - Write access to tasks and projects

#### Step 2: Handle Authorization Callback

After the user grants access, TickTick redirects back to your `redirect_uri` with:

| Parameter | Description                                    |
| --------- | ---------------------------------------------- |
| `code`    | Authorization code for exchanging access token |
| `state`   | The state parameter from Step 1 (verify this!) |

**Example Callback:**
```
http://localhost:8521/callback?code=AUTH_CODE&state=random_state
```

#### Step 3: Exchange Code for Access Token

Make a POST request to: `https://ticktick.com/oauth/token`

**Request Headers:**
```
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {base64(client_id:client_secret)}
```

**Request Body (form-urlencoded):**

| Parameter       | Description                                    | Required |
| --------------- | ---------------------------------------------- | -------- |
| `client_id`     | Your client ID (also in Basic Auth header)     | Yes      |
| `client_secret` | Your client secret (also in Basic Auth header) | Yes      |
| `code`          | Authorization code from Step 2                 | Yes      |
| `grant_type`    | Fixed value: `authorization_code`              | Yes      |
| `scope`         | Same scopes as Step 1                          | Yes      |
| `redirect_uri`  | Same redirect_uri as Step 1                    | Yes      |

**Example Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_value",
  "scope": "tasks:read tasks:write"
}
```

### Using Access Token

Set the `Authorization` header in all API requests:

```
Authorization: Bearer {access_token}
```

**Example:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## API Reference

The TickTick Open API provides a RESTful interface for accessing and managing user tasks, projects, and related resources. All endpoints return JSON data.

### Task APIs

#### 1. Get Task by Project ID and Task ID

Retrieve a specific task's details.

**Endpoint:**
```
GET /open/v1/project/{projectId}/task/{taskId}
```

**Path Parameters:**

| Parameter   | Type   | Required | Description        |
| ----------- | ------ | -------- | ------------------ |
| `projectId` | string | Yes      | Project identifier |
| `taskId`    | string | Yes      | Task identifier    |

**Request Example:**
```http
GET /open/v1/project/6226ff9877acee87727f6bca/task/63b7bebb91c0a5474805fcd4 HTTP/1.1
Host: api.ticktick.com
Authorization: Bearer {token}
```

**Response Example (200 OK):**
```json
{
  "id": "63b7bebb91c0a5474805fcd4",
  "isAllDay": true,
  "projectId": "6226ff9877acee87727f6bca",
  "title": "Task Title",
  "content": "Task Content",
  "desc": "Task Description",
  "timeZone": "America/Los_Angeles",
  "repeatFlag": "RRULE:FREQ=DAILY;INTERVAL=1",
  "startDate": "2019-11-13T03:00:00+0000",
  "dueDate": "2019-11-14T03:00:00+0000",
  "reminders": ["TRIGGER:P0DT9H0M0S", "TRIGGER:PT0S"],
  "priority": 1,
  "status": 0,
  "completedTime": "2019-11-13T03:00:00+0000",
  "sortOrder": 12345,
  "items": [{
    "id": "6435074647fd2e6387145f20",
    "status": 0,
    "title": "Subtask Title",
    "sortOrder": 12345,
    "startDate": "2019-11-13T03:00:00+0000",
    "isAllDay": false,
    "timeZone": "America/Los_Angeles",
    "completedTime": "2019-11-13T03:00:00+0000"
  }]
}
```

**Response Codes:**

| Code | Description                               |
| ---- | ----------------------------------------- |
| 200  | OK - Task retrieved successfully          |
| 401  | Unauthorized - Invalid or missing token   |
| 403  | Forbidden - Insufficient permissions      |
| 404  | Not Found - Task or project doesn't exist |

---

#### 2. Create Task

Create a new task in a project.

**Endpoint:**
```
POST /open/v1/task
```

**Request Body Parameters:**

| Parameter    | Type    | Required | Description                                            |
| ------------ | ------- | -------- | ------------------------------------------------------ |
| `title`      | string  | **Yes**  | Task title                                             |
| `projectId`  | string  | **Yes**  | Project ID (use "inbox" for inbox)                     |
| `content`    | string  | No       | Task content/notes                                     |
| `desc`       | string  | No       | Description of checklist                               |
| `isAllDay`   | boolean | No       | Whether task is all-day                                |
| `startDate`  | string  | No       | Start date in ISO format: `yyyy-MM-dd'T'HH:mm:ssZ`     |
| `dueDate`    | string  | No       | Due date in ISO format: `yyyy-MM-dd'T'HH:mm:ssZ`       |
| `timeZone`   | string  | No       | Timezone (e.g., "America/Los_Angeles")                 |
| `reminders`  | array   | No       | List of reminder triggers                              |
| `repeatFlag` | string  | No       | Recurrence rule (e.g., "RRULE:FREQ=DAILY;INTERVAL=1")  |
| `priority`   | integer | No       | Priority: 0=None, 1=Low, 3=Medium, 5=High (default: 0) |
| `sortOrder`  | integer | No       | Sort order value                                       |
| `items`      | array   | No       | List of subtasks (ChecklistItem objects)               |

**Subtask (items) Parameters:**

| Parameter             | Type    | Description                  |
| --------------------- | ------- | ---------------------------- |
| `items.title`         | string  | Subtask title                |
| `items.startDate`     | string  | Start date (ISO format)      |
| `items.isAllDay`      | boolean | All day flag                 |
| `items.sortOrder`     | integer | Sort order                   |
| `items.timeZone`      | string  | Timezone                     |
| `items.status`        | integer | 0=Normal, 1=Completed        |
| `items.completedTime` | string  | Completion time (ISO format) |

**Request Example:**
```http
POST /open/v1/task HTTP/1.1
Host: api.ticktick.com
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Complete Project Documentation",
  "projectId": "6226ff9877acee87727f6bca",
  "content": "Write comprehensive API docs",
  "dueDate": "2025-11-30T17:00:00+0000",
  "priority": 3,
  "reminders": ["TRIGGER:PT0S"],
  "items": [
    {
      "title": "Research existing docs",
      "status": 0
    },
    {
      "title": "Write draft",
      "status": 0
    }
  ]
}
```

**Response Example (200 OK):**
```json
{
  "id": "63b7bebb91c0a5474805fcd4",
  "projectId": "6226ff9877acee87727f6bca",
  "title": "Complete Project Documentation",
  "content": "Write comprehensive API docs",
  "desc": "",
  "isAllDay": false,
  "startDate": null,
  "dueDate": "2025-11-30T17:00:00+0000",
  "timeZone": "America/Los_Angeles",
  "reminders": ["TRIGGER:PT0S"],
  "repeatFlag": "",
  "priority": 3,
  "status": 0,
  "completedTime": null,
  "sortOrder": 12345,
  "items": [
    {
      "id": "6435074647fd2e6387145f20",
      "status": 0,
      "title": "Research existing docs",
      "sortOrder": 0
    },
    {
      "id": "6435074647fd2e6387145f21",
      "status": 0,
      "title": "Write draft",
      "sortOrder": 1
    }
  ]
}
```

**Response Codes:**

| Code | Description                       |
| ---- | --------------------------------- |
| 200  | OK - Task created successfully    |
| 201  | Created                           |
| 401  | Unauthorized                      |
| 403  | Forbidden                         |
| 404  | Not Found - Project doesn't exist |

---

#### 3. Update Task

Update an existing task.

**Endpoint:**
```
POST /open/v1/task/{taskId}
```

**Path Parameters:**

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `taskId`  | string | Yes      | Task identifier |

**Request Body Parameters:**

| Parameter    | Type    | Required | Description                         |
| ------------ | ------- | -------- | ----------------------------------- |
| `id`         | string  | **Yes**  | Task ID (must match path parameter) |
| `projectId`  | string  | **Yes**  | Project ID                          |
| `title`      | string  | No       | Task title                          |
| `content`    | string  | No       | Task content                        |
| `desc`       | string  | No       | Task description                    |
| `isAllDay`   | boolean | No       | All day flag                        |
| `startDate`  | string  | No       | Start date (ISO format)             |
| `dueDate`    | string  | No       | Due date (ISO format)               |
| `timeZone`   | string  | No       | Timezone                            |
| `reminders`  | array   | No       | Reminder triggers                   |
| `repeatFlag` | string  | No       | Recurrence rule                     |
| `priority`   | integer | No       | Priority (0/1/3/5)                  |
| `sortOrder`  | integer | No       | Sort order                          |
| `items`      | array   | No       | Subtasks list                       |

**Request Example:**
```http
POST /open/v1/task/63b7bebb91c0a5474805fcd4 HTTP/1.1
Host: api.ticktick.com
Content-Type: application/json
Authorization: Bearer {token}

{
  "id": "63b7bebb91c0a5474805fcd4",
  "projectId": "6226ff9877acee87727f6bca",
  "title": "Updated Task Title",
  "priority": 5
}
```

**Response Example (200 OK):**
```json
{
  "id": "63b7bebb91c0a5474805fcd4",
  "projectId": "6226ff9877acee87727f6bca",
  "title": "Updated Task Title",
  "content": "Task Content",
  "desc": "Task Description",
  "isAllDay": true,
  "startDate": "2019-11-13T03:00:00+0000",
  "dueDate": "2019-11-14T03:00:00+0000",
  "timeZone": "America/Los_Angeles",
  "reminders": ["TRIGGER:P0DT9H0M0S", "TRIGGER:PT0S"],
  "repeatFlag": "RRULE:FREQ=DAILY;INTERVAL=1",
  "priority": 5,
  "status": 0,
  "completedTime": "2019-11-13T03:00:00+0000",
  "sortOrder": 12345,
  "items": [{
    "id": "6435074647fd2e6387145f20",
    "status": 1,
    "title": "Subtask Title",
    "sortOrder": 12345,
    "startDate": "2019-11-13T03:00:00+0000",
    "isAllDay": false,
    "timeZone": "America/Los_Angeles",
    "completedTime": "2019-11-13T03:00:00+0000"
  }],
  "kind": "CHECKLIST"
}
```

**Response Codes:**

| Code | Description                    |
| ---- | ------------------------------ |
| 200  | OK - Task updated successfully |
| 201  | Created                        |
| 401  | Unauthorized                   |
| 403  | Forbidden                      |
| 404  | Not Found                      |

---

#### 4. Complete Task

Mark a task as completed.

**Endpoint:**
```
POST /open/v1/project/{projectId}/task/{taskId}/complete
```

**Path Parameters:**

| Parameter   | Type   | Required | Description        |
| ----------- | ------ | -------- | ------------------ |
| `projectId` | string | Yes      | Project identifier |
| `taskId`    | string | Yes      | Task identifier    |

**Request Example:**
```http
POST /open/v1/project/6226ff9877acee87727f6bca/task/63b7bebb91c0a5474805fcd4/complete HTTP/1.1
Host: api.ticktick.com
Authorization: Bearer {token}
```

**Response Codes:**

| Code | Description                      |
| ---- | -------------------------------- |
| 200  | OK - Task completed successfully |
| 201  | Created                          |
| 401  | Unauthorized                     |
| 403  | Forbidden                        |
| 404  | Not Found                        |

---

#### 5. Delete Task

Delete a task permanently.

**Endpoint:**
```
DELETE /open/v1/project/{projectId}/task/{taskId}
```

**Path Parameters:**

| Parameter   | Type   | Required | Description        |
| ----------- | ------ | -------- | ------------------ |
| `projectId` | string | Yes      | Project identifier |
| `taskId`    | string | Yes      | Task identifier    |

**Request Example:**
```http
DELETE /open/v1/project/6226ff9877acee87727f6bca/task/63b7bebb91c0a5474805fcd4 HTTP/1.1
Host: api.ticktick.com
Authorization: Bearer {token}
```

**Response Codes:**

| Code | Description                    |
| ---- | ------------------------------ |
| 200  | OK - Task deleted successfully |
| 201  | Created                        |
| 401  | Unauthorized                   |
| 403  | Forbidden                      |
| 404  | Not Found                      |

---

### Project APIs

#### 1. Get User Projects

Retrieve all projects for the authenticated user.

**Endpoint:**
```
GET /open/v1/project
```

**Request Example:**
```http
GET /open/v1/project HTTP/1.1
Host: api.ticktick.com
Authorization: Bearer {token}
```

**Response Example (200 OK):**
```json
[{
  "id": "6226ff9877acee87727f6bca",
  "name": "Personal Projects",
  "color": "#F18181",
  "closed": false,
  "groupId": "6436176a47fd2e05f26ef56e",
  "viewMode": "list",
  "permission": "write",
  "kind": "TASK"
}]
```

**Response Codes:**

| Code | Description                          |
| ---- | ------------------------------------ |
| 200  | OK - Projects retrieved successfully |
| 401  | Unauthorized                         |
| 403  | Forbidden                            |
| 404  | Not Found                            |

---

#### 2. Get Project by ID

Retrieve details of a specific project.

**Endpoint:**
```
GET /open/v1/project/{projectId}
```

**Path Parameters:**

| Parameter   | Type   | Required | Description        |
| ----------- | ------ | -------- | ------------------ |
| `projectId` | string | Yes      | Project identifier |

**Request Example:**
```http
GET /open/v1/project/6226ff9877acee87727f6bca HTTP/1.1
Host: api.ticktick.com
Authorization: Bearer {token}
```

**Response Example (200 OK):**
```json
{
  "id": "6226ff9877acee87727f6bca",
  "name": "Personal Projects",
  "color": "#F18181",
  "closed": false,
  "groupId": "6436176a47fd2e05f26ef56e",
  "viewMode": "list",
  "kind": "TASK"
}
```

**Response Codes:**

| Code | Description                         |
| ---- | ----------------------------------- |
| 200  | OK - Project retrieved successfully |
| 401  | Unauthorized                        |
| 403  | Forbidden                           |
| 404  | Not Found                           |

---

#### 3. Get Project with Data

Retrieve a project along with all its tasks and columns (for kanban view).

**Endpoint:**
```
GET /open/v1/project/{projectId}/data
```

**Path Parameters:**

| Parameter   | Type   | Required | Description        |
| ----------- | ------ | -------- | ------------------ |
| `projectId` | string | Yes      | Project identifier |

**Request Example:**
```http
GET /open/v1/project/6226ff9877acee87727f6bca/data HTTP/1.1
Host: api.ticktick.com
Authorization: Bearer {token}
```

**Response Example (200 OK):**
```json
{
  "project": {
    "id": "6226ff9877acee87727f6bca",
    "name": "Personal Projects",
    "color": "#F18181",
    "closed": false,
    "groupId": "6436176a47fd2e05f26ef56e",
    "viewMode": "list",
    "kind": "TASK"
  },
  "tasks": [{
    "id": "6247ee29630c800f064fd145",
    "isAllDay": true,
    "projectId": "6226ff9877acee87727f6bca",
    "title": "Task Title",
    "content": "Task Content",
    "desc": "Task Description",
    "timeZone": "America/Los_Angeles",
    "repeatFlag": "RRULE:FREQ=DAILY;INTERVAL=1",
    "startDate": "2019-11-13T03:00:00+0000",
    "dueDate": "2019-11-14T03:00:00+0000",
    "reminders": ["TRIGGER:P0DT9H0M0S", "TRIGGER:PT0S"],
    "priority": 1,
    "status": 0,
    "completedTime": "2019-11-13T03:00:00+0000",
    "sortOrder": 12345,
    "items": [{
      "id": "6435074647fd2e6387145f20",
      "status": 0,
      "title": "Subtask Title",
      "sortOrder": 12345,
      "startDate": "2019-11-13T03:00:00+0000",
      "isAllDay": false,
      "timeZone": "America/Los_Angeles",
      "completedTime": "2019-11-13T03:00:00+0000"
    }]
  }],
  "columns": [{
    "id": "6226ff9e76e5fc39f2862d1b",
    "projectId": "6226ff9877acee87727f6bca",
    "name": "To Do",
    "sortOrder": 0
  }]
}
```

**Response Codes:**

| Code | Description                              |
| ---- | ---------------------------------------- |
| 200  | OK - Project data retrieved successfully |
| 401  | Unauthorized                             |
| 403  | Forbidden                                |
| 404  | Not Found                                |

---

#### 4. Create Project

Create a new project.

**Endpoint:**
```
POST /open/v1/project
```

**Request Body Parameters:**

| Parameter   | Type    | Required | Description                                               |
| ----------- | ------- | -------- | --------------------------------------------------------- |
| `name`      | string  | **Yes**  | Project name                                              |
| `color`     | string  | No       | Project color (hex format, e.g., "#F18181")               |
| `sortOrder` | integer | No       | Sort order value (default: 0)                             |
| `viewMode`  | string  | No       | View mode: "list", "kanban", "timeline" (default: "list") |
| `kind`      | string  | No       | Project kind: "TASK", "NOTE" (default: "TASK")            |

**Request Example:**
```http
POST /open/v1/project HTTP/1.1
Host: api.ticktick.com
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Q4 Goals",
  "color": "#F18181",
  "viewMode": "kanban",
  "kind": "TASK"
}
```

**Response Example (200 OK):**
```json
{
  "id": "6226ff9877acee87727f6bca",
  "name": "Q4 Goals",
  "color": "#F18181",
  "sortOrder": 0,
  "viewMode": "kanban",
  "kind": "TASK"
}
```

**Response Codes:**

| Code | Description                       |
| ---- | --------------------------------- |
| 200  | OK - Project created successfully |
| 201  | Created                           |
| 401  | Unauthorized                      |
| 403  | Forbidden                         |
| 404  | Not Found                         |

---

#### 5. Update Project

Update an existing project.

**Endpoint:**
```
POST /open/v1/project/{projectId}
```

**Path Parameters:**

| Parameter   | Type   | Required | Description        |
| ----------- | ------ | -------- | ------------------ |
| `projectId` | string | Yes      | Project identifier |

**Request Body Parameters:**

| Parameter   | Type    | Required | Description                             |
| ----------- | ------- | -------- | --------------------------------------- |
| `name`      | string  | No       | Project name                            |
| `color`     | string  | No       | Project color (hex format)              |
| `sortOrder` | integer | No       | Sort order value                        |
| `viewMode`  | string  | No       | View mode: "list", "kanban", "timeline" |
| `kind`      | string  | No       | Project kind: "TASK", "NOTE"            |

**Request Example:**
```http
POST /open/v1/project/6226ff9877acee87727f6bca HTTP/1.1
Host: api.ticktick.com
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Updated Project Name",
  "color": "#4A90E2",
  "viewMode": "timeline"
}
```

**Response Example (200 OK):**
```json
{
  "id": "6226ff9877acee87727f6bca",
  "name": "Updated Project Name",
  "color": "#4A90E2",
  "sortOrder": 0,
  "viewMode": "timeline",
  "kind": "TASK"
}
```

**Response Codes:**

| Code | Description                       |
| ---- | --------------------------------- |
| 200  | OK - Project updated successfully |
| 201  | Created                           |
| 401  | Unauthorized                      |
| 403  | Forbidden                         |
| 404  | Not Found                         |

---

#### 6. Delete Project

Delete a project permanently.

**Endpoint:**
```
DELETE /open/v1/project/{projectId}
```

**Path Parameters:**

| Parameter   | Type   | Required | Description        |
| ----------- | ------ | -------- | ------------------ |
| `projectId` | string | Yes      | Project identifier |

**Request Example:**
```http
DELETE /open/v1/project/6226ff9877acee87727f6bca HTTP/1.1
Host: api.ticktick.com
Authorization: Bearer {token}
```

**Response Codes:**

| Code | Description                       |
| ---- | --------------------------------- |
| 200  | OK - Project deleted successfully |
| 401  | Unauthorized                      |
| 403  | Forbidden                         |
| 404  | Not Found                         |

---

## Data Models

### ChecklistItem (Subtask)

Represents a subtask within a task.

| Field           | Type    | Description                               | Example                    |
| --------------- | ------- | ----------------------------------------- | -------------------------- |
| `id`            | string  | Subtask identifier                        | "6435074647fd2e6387145f20" |
| `title`         | string  | Subtask title                             | "Review code"              |
| `status`        | integer | Completion status (0=Normal, 1=Completed) | 0                          |
| `completedTime` | string  | Completion timestamp (ISO format)         | "2019-11-13T03:00:00+0000" |
| `isAllDay`      | boolean | All day flag                              | false                      |
| `sortOrder`     | integer | Sort order value                          | 234444                     |
| `startDate`     | string  | Start date (ISO format)                   | "2019-11-13T03:00:00+0000" |
| `timeZone`      | string  | Timezone                                  | "America/Los_Angeles"      |

---

### Task

Represents a task in TickTick.

| Field           | Type    | Description                | Values/Example                           |
| --------------- | ------- | -------------------------- | ---------------------------------------- |
| `id`            | string  | Task identifier            | "63b7bebb91c0a5474805fcd4"               |
| `projectId`     | string  | Parent project ID          | "6226ff9877acee87727f6bca"               |
| `title`         | string  | Task title                 | "Complete documentation"                 |
| `isAllDay`      | boolean | All day flag               | true/false                               |
| `completedTime` | string  | Completion timestamp (ISO) | "2019-11-13T03:00:00+0000"               |
| `content`       | string  | Task content/notes         | "Additional details here"                |
| `desc`          | string  | Task description           | "Description text"                       |
| `dueDate`       | string  | Due date (ISO format)      | "2019-11-13T03:00:00+0000"               |
| `items`         | array   | List of subtasks           | `[ChecklistItem, ...]`                   |
| `priority`      | integer | Priority level             | 0=None, 1=Low, 3=Medium, 5=High          |
| `reminders`     | array   | Reminder triggers          | `["TRIGGER:P0DT9H0M0S", "TRIGGER:PT0S"]` |
| `repeatFlag`    | string  | Recurrence rule            | "RRULE:FREQ=DAILY;INTERVAL=1"            |
| `sortOrder`     | integer | Sort order                 | 12345                                    |
| `startDate`     | string  | Start date (ISO format)    | "2019-11-13T03:00:00+0000"               |
| `status`        | integer | Completion status          | 0=Normal, 2=Completed                    |
| `timeZone`      | string  | Timezone                   | "America/Los_Angeles"                    |
| `kind`          | string  | Task type                  | "TEXT", "NOTE", "CHECKLIST"              |

**Priority Values:**
- `0` - None
- `1` - Low
- `3` - Medium
- `5` - High

**Status Values:**
- `0` - Normal (not completed)
- `2` - Completed

**Date Format:**
All dates use ISO 8601 format: `yyyy-MM-dd'T'HH:mm:ssZ`

Example: `"2019-11-13T03:00:00+0000"`

**Reminder Format:**
Reminders use iCalendar TRIGGER format:
- `TRIGGER:PT0S` - At the time of the task
- `TRIGGER:P0DT9H0M0S` - 9 hours before
- `TRIGGER:-PT15M` - 15 minutes before

**Repeat Rule Format:**
Repeat rules use iCalendar RRULE format:
- `RRULE:FREQ=DAILY;INTERVAL=1` - Every day
- `RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR` - Every Monday, Wednesday, Friday
- `RRULE:FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=1` - First day of every month

---

### Project

Represents a project (list) in TickTick.

| Field        | Type    | Description              | Values/Example               |
| ------------ | ------- | ------------------------ | ---------------------------- |
| `id`         | string  | Project identifier       | "6226ff9877acee87727f6bca"   |
| `name`       | string  | Project name             | "Work Projects"              |
| `color`      | string  | Project color (hex)      | "#F18181"                    |
| `sortOrder`  | integer | Sort order value         | 0                            |
| `closed`     | boolean | Project closed status    | false                        |
| `groupId`    | string  | Project group identifier | "6436176a47fd2e05f26ef56e"   |
| `viewMode`   | string  | View mode                | "list", "kanban", "timeline" |
| `permission` | string  | User permission level    | "read", "write", "comment"   |
| `kind`       | string  | Project type             | "TASK", "NOTE"               |

**View Modes:**
- `list` - Standard list view
- `kanban` - Kanban board view
- `timeline` - Timeline/calendar view

**Permission Levels:**
- `read` - Read-only access
- `write` - Full read/write access
- `comment` - Can add comments

**Project Kinds:**
- `TASK` - Task project
- `NOTE` - Note project

---

### Column

Represents a column in a kanban board.

| Field       | Type    | Description       | Example                    |
| ----------- | ------- | ----------------- | -------------------------- |
| `id`        | string  | Column identifier | "6226ff9e76e5fc39f2862d1b" |
| `projectId` | string  | Parent project ID | "6226ff9877acee87727f6bca" |
| `name`      | string  | Column name       | "In Progress"              |
| `sortOrder` | integer | Sort order value  | 0                          |

---

### ProjectData

Represents complete project data including tasks and columns.

| Field     | Type    | Description                               |
| --------- | ------- | ----------------------------------------- |
| `project` | Project | Project information                       |
| `tasks`   | array   | Array of Task objects (undone tasks only) |
| `columns` | array   | Array of Column objects (kanban columns)  |

**Note:** The `tasks` array only includes **undone tasks** (tasks with `status` = 0). Completed tasks are not included.

---

## Error Codes

### HTTP Status Codes

| Code | Description           | Meaning                         |
| ---- | --------------------- | ------------------------------- |
| 200  | OK                    | Request successful              |
| 201  | Created               | Resource created successfully   |
| 400  | Bad Request           | Invalid request parameters      |
| 401  | Unauthorized          | Missing or invalid access token |
| 403  | Forbidden             | Insufficient permissions        |
| 404  | Not Found             | Resource doesn't exist          |
| 429  | Too Many Requests     | Rate limit exceeded             |
| 500  | Internal Server Error | Server error                    |

### Common Error Scenarios

**401 Unauthorized:**
- Missing `Authorization` header
- Invalid or expired access token
- Token doesn't have required scopes

**403 Forbidden:**
- User doesn't have permission to access the resource
- Attempting write operation with read-only scope

**404 Not Found:**
- Project ID doesn't exist
- Task ID doesn't exist
- User doesn't have access to the resource

---

## Rate Limiting

TickTick API implements rate limiting to ensure fair usage. While specific limits are not documented, implement the following best practices:

1. **Cache responses** when possible
2. **Batch operations** instead of making multiple individual requests
3. **Implement exponential backoff** for retry logic
4. **Monitor 429 responses** and adjust request frequency accordingly

---

## Best Practices

### 1. Token Management

- **Store tokens securely** in encrypted storage
- **Implement token refresh** logic before expiration
- **Handle 401 errors** by prompting re-authentication

### 2. Error Handling

```javascript
try {
  const response = await fetch('https://api.ticktick.com/open/v1/project', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, re-authenticate
      await refreshToken();
    } else if (response.status === 429) {
      // Rate limited, implement backoff
      await delay(60000);
    } else {
      throw new Error(`API error: ${response.status}`);
    }
  }
  
  return await response.json();
} catch (error) {
  console.error('API request failed:', error);
}
```

### 3. Date Handling

- Always use **UTC timezone** for consistency
- Format dates as `yyyy-MM-dd'T'HH:mm:ssZ`
- Include timezone information in `timeZone` field

### 4. Partial Updates

When updating tasks or projects, only include fields you want to change. Omitted fields will retain their current values.

### 5. Subtask Management

When updating a task with subtasks:
- Include **all subtasks** in the `items` array (not just changed ones)
- Omitting the `items` field preserves existing subtasks
- Setting `items` to `[]` removes all subtasks

---

## Inbox Support

TickTick has a special "Inbox" project for tasks without a specific project. To work with inbox tasks:

- **Project ID**: Use the string `"inbox"` as the project ID
- **Create task in inbox**: Set `projectId: "inbox"`
- **Get inbox tasks**: Use `GET /open/v1/project/inbox/data`

---

## Support

### Contact

If you have any questions or feedback regarding the TickTick Open API documentation, please contact:

**Email**: support@ticktick.com

### Resources

- **Developer Portal**: https://developer.ticktick.com/
- **Manage Apps**: https://developer.ticktick.com/manage
- **API Documentation**: https://developer.ticktick.com/docs#/openapi

---

## Changelog

### Version 1.0 (Current)

**Available Endpoints:**
- ✅ Task CRUD operations
- ✅ Project CRUD operations
- ✅ OAuth2 authorization
- ✅ Subtask support
- ✅ Reminder and recurrence support

**Known Limitations:**
- No batch operations for tasks
- No search/filter endpoints
- No tag management
- No collaboration features
- GET project data only returns undone tasks

---

## Example Use Cases

### Example 1: Create a Daily Task with Reminders

```http
POST /open/v1/task HTTP/1.1
Host: api.ticktick.com
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Morning Standup",
  "projectId": "6226ff9877acee87727f6bca",
  "dueDate": "2025-11-25T09:00:00+0000",
  "isAllDay": false,
  "timeZone": "America/Los_Angeles",
  "reminders": ["TRIGGER:-PT15M"],
  "repeatFlag": "RRULE:FREQ=DAILY;INTERVAL=1;BYDAY=MO,TU,WE,TH,FR",
  "priority": 3
}
```

### Example 2: Create a Project with Kanban View

```http
POST /open/v1/project HTTP/1.1
Host: api.ticktick.com
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Website Redesign",
  "color": "#4A90E2",
  "viewMode": "kanban",
  "kind": "TASK"
}
```

### Example 3: Create a Task with Subtasks

```http
POST /open/v1/task HTTP/1.1
Host: api.ticktick.com
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Launch New Feature",
  "projectId": "6226ff9877acee87727f6bca",
  "priority": 5,
  "dueDate": "2025-12-01T17:00:00+0000",
  "items": [
    { "title": "Code review", "status": 0 },
    { "title": "Write tests", "status": 0 },
    { "title": "Update documentation", "status": 0 },
    { "title": "Deploy to production", "status": 0 }
  ]
}
```

---

**End of Documentation**

*Last updated: 2025-11-24*  
*API Version: v1*  
*Documentation generated from: https://developer.ticktick.com/docs#/openapi*
