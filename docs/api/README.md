# TickTick API Documentation

This directory contains comprehensive API documentation for TickTick (滴答清单/Dida365) Open API.

## Documentation Files

- **[ticktick-openapi-reference.md](./ticktick-openapi-reference.md)** - Complete API reference with all endpoints, parameters, examples, and data models

## Quick Reference

### Base Information

- **API Base URL**: `https://api.ticktick.com`
- **OAuth Base URL**: `https://ticktick.com/oauth`
- **API Version**: v1
- **Authentication**: OAuth2 Bearer Token
- **Data Format**: JSON

### Available Scopes

- `tasks:read` - Read access to tasks and projects
- `tasks:write` - Write access to tasks and projects

### API Endpoints Summary

#### Authentication
- `GET /oauth/authorize` - Get authorization code
- `POST /oauth/token` - Exchange code for access token

#### Task Operations (5 endpoints)
- `GET /open/v1/project/{projectId}/task/{taskId}` - Get task details
- `POST /open/v1/task` - Create task
- `POST /open/v1/task/{taskId}` - Update task
- `POST /open/v1/project/{projectId}/task/{taskId}/complete` - Complete task
- `DELETE /open/v1/project/{projectId}/task/{taskId}` - Delete task

#### Project Operations (6 endpoints)
- `GET /open/v1/project` - List all projects
- `GET /open/v1/project/{projectId}` - Get project details
- `GET /open/v1/project/{projectId}/data` - Get project with tasks and columns
- `POST /open/v1/project` - Create project
- `POST /open/v1/project/{projectId}` - Update project
- `DELETE /open/v1/project/{projectId}` - Delete project

## Quick Start

### 1. Register Your Application

Visit [TickTick Developer Center](https://developer.ticktick.com/manage) to register and get:
- Client ID
- Client Secret

### 2. OAuth2 Flow

```
1. Redirect user to authorization URL
   → https://ticktick.com/oauth/authorize?client_id={id}&scope=tasks:read%20tasks:write&redirect_uri={uri}&response_type=code&state={state}

2. Receive authorization code in callback
   → http://your-redirect-uri?code={code}&state={state}

3. Exchange code for access token
   → POST https://ticktick.com/oauth/token
   → Returns: { "access_token": "...", "expires_in": 3600, ... }
```

### 3. Make API Calls

```http
GET /open/v1/project HTTP/1.1
Host: api.ticktick.com
Authorization: Bearer {your_access_token}
```

## Common Use Cases

### Create a Task

```json
POST /open/v1/task
{
  "title": "Task Title",
  "projectId": "project_id_here",
  "dueDate": "2025-12-31T17:00:00+0000",
  "priority": 3,
  "reminders": ["TRIGGER:PT0S"]
}
```

### Create a Project

```json
POST /open/v1/project
{
  "name": "My Project",
  "color": "#F18181",
  "viewMode": "list",
  "kind": "TASK"
}
```

### Get All Tasks in a Project

```http
GET /open/v1/project/{projectId}/data
```

## Data Models

### Task Priority Values
- `0` - None
- `1` - Low
- `3` - Medium
- `5` - High

### Task Status Values
- `0` - Normal (not completed)
- `2` - Completed

### Project View Modes
- `list` - Standard list view
- `kanban` - Kanban board view
- `timeline` - Timeline/calendar view

### Project Kinds
- `TASK` - Task project
- `NOTE` - Note project

## Date Format

All dates use ISO 8601 format: `yyyy-MM-dd'T'HH:mm:ssZ`

Example: `"2025-11-24T15:30:00+0000"`

## Special Features

### Inbox Support

Use `"inbox"` as the project ID to work with tasks in the inbox:

```json
{
  "title": "Quick Task",
  "projectId": "inbox"
}
```

### Subtasks (Checklist Items)

Include subtasks in the `items` array:

```json
{
  "title": "Parent Task",
  "projectId": "project_id",
  "items": [
    { "title": "Subtask 1", "status": 0 },
    { "title": "Subtask 2", "status": 0 }
  ]
}
```

### Recurring Tasks

Use iCalendar RRULE format:

```json
{
  "title": "Daily Task",
  "repeatFlag": "RRULE:FREQ=DAILY;INTERVAL=1"
}
```

### Reminders

Use iCalendar TRIGGER format:

```json
{
  "title": "Task with Reminder",
  "reminders": [
    "TRIGGER:PT0S",        // At the time of task
    "TRIGGER:-PT15M"       // 15 minutes before
  ]
}
```

## Error Handling

### HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Best Practices

1. **Cache tokens** and implement refresh logic
2. **Handle 401** by re-authenticating
3. **Implement exponential backoff** for 429 errors
4. **Validate data** before sending requests
5. **Use UTC timezone** for consistency

## Resources

- **Official API Docs**: https://developer.ticktick.com/docs#/openapi
- **Developer Portal**: https://developer.ticktick.com/
- **Manage Apps**: https://developer.ticktick.com/manage
- **Support Email**: support@ticktick.com

## Implementation in This Project

Our MCP server implements all available API endpoints. See project files:

- `src/api/` - API client implementations
- `src/tools/` - MCP tool wrappers
- `src/oauth.ts` - OAuth2 implementation

## Notes

- The API only returns **undone tasks** when fetching project data
- **No batch operations** are currently available
- **No search/filter** endpoints are available
- Rate limiting is in place but specific limits are not documented

---

*Last updated: 2025-11-24*
