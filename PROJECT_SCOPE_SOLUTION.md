# Project Scope Restriction Feature - Solution Design

## Executive Summary

This document outlines the implementation approach for adding project scope restriction to the Dida365 MCP Server. This feature allows users to limit AI access to specific projects for enhanced security and privacy.

## Goals

1. **Security**: Prevent AI from accessing or modifying sensitive projects
2. **Safety**: Reduce risk of accidental modifications in YOLO mode
3. **Usability**: Simple configuration without complex patterns or exclusion rules
4. **Flexibility**: Can be combined with existing read-only mode for maximum control
5. **Transparency**: Clear error messages when access is denied

## Design Principles

1. **Minimal Changes**: Leverage existing architecture patterns (similar to read-only mode)
2. **Fail-Safe**: When project scope is enabled, default to deny unless explicitly allowed
3. **Consistency**: Apply same validation pattern across all tools
4. **Performance**: Minimal overhead - simple string comparison/set lookup
5. **User-Friendly**: Clear documentation and error messages

## Configuration Options

### Environment Variable
```bash
DIDA365_ALLOWED_PROJECTS=projectId1,projectId2,projectId3
```

### Command Line Argument
```bash
--allowed-projects=projectId1,projectId2,projectId3
```

### Configuration Priority
- Command line argument takes precedence over environment variable
- If both are provided, command line argument is used
- If neither is provided, all projects are accessible (default behavior)

### Example Configurations

**Claude Desktop (npx with environment variable):**
```json
{
  "mcpServers": {
    "dida365": {
      "command": "npx",
      "args": ["-y", "dida365-mcp-server@latest"],
      "env": {
        "DIDA365_CLIENT_ID": "your_client_id",
        "DIDA365_CLIENT_SECRET": "your_client_secret",
        "DIDA365_ALLOWED_PROJECTS": "project1,project2"
      }
    }
  }
}
```

**Claude Desktop (npx with command line):**
```json
{
  "mcpServers": {
    "dida365": {
      "command": "npx",
      "args": [
        "-y",
        "dida365-mcp-server@latest",
        "--allowed-projects=project1,project2"
      ],
      "env": {
        "DIDA365_CLIENT_ID": "your_client_id",
        "DIDA365_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

**Combined with Read-Only Mode:**
```json
{
  "mcpServers": {
    "dida365": {
      "command": "npx",
      "args": [
        "-y",
        "dida365-mcp-server@latest",
        "--readonly",
        "--allowed-projects=project1,project2"
      ],
      "env": {
        "DIDA365_CLIENT_ID": "your_client_id",
        "DIDA365_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

## Implementation Architecture

### 1. Configuration Module (src/config.ts)

**Changes Required:**
- Add `allowedProjectIds` variable (Set<string> for O(1) lookup)
- Add `parseAllowedProjects()` function to parse env var and CLI args
- Add `isProjectAllowed(projectId: string)` function for validation
- Add `getAllowedProjects()` function to get the set (for filtering)
- Update `printConfigInfo()` to display project scope status

**Key Functions:**
```typescript
// Internal state
let allowedProjectIds: Set<string> | null = null;

// Parse allowed projects from env var and CLI args
function parseAllowedProjects(): void {
  // Priority: CLI arg > env var
  // Parse comma-separated list into Set<string>
}

// Check if project scope restriction is enabled
export function hasProjectScope(): boolean {
  return allowedProjectIds !== null && allowedProjectIds.size > 0;
}

// Check if a specific project is allowed
export function isProjectAllowed(projectId: string): boolean {
  if (!hasProjectScope()) return true; // No restriction
  return allowedProjectIds!.has(projectId);
}

// Get allowed project IDs (for filtering)
export function getAllowedProjects(): Set<string> | null {
  return allowedProjectIds;
}
```

### 2. Tool Updates

**Pattern for Project-Scoped Tools:**

All tools that accept `projectId` as input need to validate access:

```typescript
// Early validation in tool handler
if (!isProjectAllowed(projectId)) {
  return {
    content: [{
      type: "text",
      text: `Access denied: Project '${projectId}' is not in the allowed projects list. ` +
            `This server is configured to only access specific projects for security.`,
      isError: true
    }],
    isError: true,
  };
}
```

**Tools Requiring Updates:**

1. **Project Tools:**
   - `list_projects` - Filter results to only allowed projects
   - `get_project` - Validate projectId before API call
   - `get_project_data` - Validate projectId before API call
   - `update_project` - Validate projectId before API call
   - `delete_project` - Validate projectId before API call

2. **Task Tools:**
   - `create_task` - Validate projectId before API call
   - `get_task` - Validate projectId before API call
   - `update_task` - Validate projectId before API call
   - `delete_task` - Validate projectId before API call
   - `complete_task` - Validate projectId before API call
   - `list_tasks` - Filter projects when fetching all tasks

3. **Special Case - create_project:**
   - **Decision: ALLOW** - Creating new projects should be allowed
   - Newly created projects are NOT automatically added to allowed list
   - User must update configuration to include new project if needed
   - This prevents scope expansion without user consent

### 3. Inbox Handling

**Special Consideration for "inbox":**
- The `inbox` is a special pseudo-project ID used by users
- Actual inbox projectId is like `inbox123456789` (with user ID suffix)
- When user passes `"inbox"` to create_task, API returns actual inbox ID

**Implementation:**
1. When validating `projectId`, if it starts with `"inbox"`, consider it as inbox
2. If `"inbox"` is in allowed list, allow ALL inbox-prefixed projectIds
3. This ensures inbox works correctly without requiring users to know their actual inbox ID

```typescript
export function isProjectAllowed(projectId: string): boolean {
  if (!hasProjectScope()) return true;
  
  // Special handling for inbox
  if (projectId.startsWith('inbox')) {
    return allowedProjectIds!.has('inbox');
  }
  
  return allowedProjectIds!.has(projectId);
}
```

### 4. Error Messages

**Clear and Actionable Error Messages:**

```typescript
// Standard error message for denied access
const SCOPE_DENIED_MESSAGE = (projectId: string) => 
  `Access denied: Project '${projectId}' is not in the allowed projects list. ` +
  `This server is configured to only access specific projects for security. ` +
  `Please update DIDA365_ALLOWED_PROJECTS or --allowed-projects configuration.`;
```

### 5. Startup Information

**Console Output on Server Start:**
```
OAuth2 Configuration:
  Region: china
  Client ID: abc1...xyz9
  Client Secret: def2...uvw8
  Redirect URI: http://localhost:8521/callback
  Scope: tasks:read tasks:write
  Auth Endpoint: https://dida365.com/oauth/authorize
  Token Endpoint: https://dida365.com/oauth/token
  API Base URL: https://api.dida365.com
  Read-Only Mode: DISABLED
  Project Scope: ENABLED (3 projects allowed) ⚠️
```

or

```
  Project Scope: DISABLED (all projects accessible)
```

## Testing Strategy

### Manual Testing Checklist

1. **Configuration Parsing:**
   - ✓ Env var only
   - ✓ CLI arg only
   - ✓ Both (CLI takes precedence)
   - ✓ Neither (default: all allowed)
   - ✓ Invalid format (empty values, whitespace)

2. **list_projects:**
   - ✓ Returns only allowed projects
   - ✓ Returns all projects when scope disabled
   - ✓ Returns empty list if no projects match

3. **get_project / get_project_data:**
   - ✓ Succeeds for allowed project
   - ✓ Returns error for denied project
   - ✓ Works normally when scope disabled

4. **create_project:**
   - ✓ Always succeeds (not restricted)

5. **update_project / delete_project:**
   - ✓ Succeeds for allowed project
   - ✓ Returns error for denied project

6. **Task Operations (create/get/update/delete/complete):**
   - ✓ Succeeds for tasks in allowed projects
   - ✓ Returns error for tasks in denied projects
   - ✓ Batch operations - mixed allowed/denied projects

7. **Inbox Handling:**
   - ✓ "inbox" in allowed list allows all inbox operations
   - ✓ "inbox" not in allowed list denies inbox operations
   - ✓ Actual inbox IDs like "inbox123" handled correctly

8. **Combined with Read-Only:**
   - ✓ Both features work independently
   - ✓ Read-only prevents writes even for allowed projects
   - ✓ Scope prevents access even in read-only mode

## Open Questions - Decisions

### 1. Should `create_project` be allowed when project scope is enabled?

**Decision: YES, ALLOW**

**Reasoning:**
- Creating projects is a write operation, but not a security risk
- Newly created projects won't be accessible until user updates config
- This maintains principle of least privilege
- Users can still organize their workflow
- If restricted, would be inconsistent with auth tools (which are allowed)

**Behavior:**
- `create_project` succeeds regardless of scope
- New project gets a new ID from API
- To access the new project, user must:
  1. Get the new project ID (from creation response)
  2. Update `DIDA365_ALLOWED_PROJECTS` to include it
  3. Restart the MCP server

### 2. Should we support wildcard patterns (e.g., `project-*`)?

**Decision: NO, not in initial version**

**Reasoning:**
- Adds complexity to parsing and validation
- Project IDs are opaque strings (not predictable patterns)
- Users don't control project ID format (assigned by API)
- Security feature should be explicit, not pattern-based
- Can be added in future if users request it

### 3. Should we provide a way to exclude projects instead of include?

**Decision: NO, not in initial version**

**Reasoning:**
- Include list is more secure (fail-safe: default deny)
- Exclude list is fail-open (default allow)
- For security features, explicit allow is better than explicit deny
- Include list is simpler to reason about
- Can be added in future if users request it

### 4. How should the Inbox project be handled?

**Decision: Use "inbox" as special keyword**

**Reasoning:**
- Users know inbox as "inbox" (shown in UI)
- Actual inbox ID includes user ID (e.g., `inbox123456789`)
- Users shouldn't need to know their numeric user ID
- When `"inbox"` is in allowed list:
  - Allow `projectId="inbox"` in create_task
  - Allow any `projectId.startsWith("inbox")` in other operations
- This provides intuitive UX while handling technical details

## Files to Modify

1. **src/config.ts** - Add project scope parsing and validation functions
2. **src/tools/project/list-projects.ts** - Filter results
3. **src/tools/project/get-project.ts** - Add validation
4. **src/tools/project/get-project-data.ts** - Add validation
5. **src/tools/project/update-project.ts** - Add validation
6. **src/tools/project/delete-project.ts** - Add validation
7. **src/tools/task/create-task.ts** - Add validation (batch-aware)
8. **src/tools/task/get-task.ts** - Add validation
9. **src/tools/task/update-task.ts** - Add validation (batch-aware)
10. **src/tools/task/delete-task.ts** - Add validation (batch-aware)
11. **src/tools/task/complete-task.ts** - Add validation (batch-aware)
12. **src/tools/task/list-tasks.ts** - Filter projects
13. **README.md** - Add documentation
14. **README_zh.md** - Add documentation (Chinese)
15. **docs/copilot-instructions.md** - Update if exists

## Documentation Updates

### README.md

Add new section: "Project Scope Restriction"

**Content:**
- Feature overview
- Configuration examples (env var and CLI)
- Behavior description
- Combination with read-only mode
- How to find project IDs
- Inbox handling
- Error message examples

### copilot-instructions.md (if exists)

Add section about project scope feature in the configuration documentation.

## Implementation Order

1. **Phase 1: Core Configuration**
   - Update `src/config.ts` with parsing and validation functions
   - Test configuration parsing

2. **Phase 2: Project Tools**
   - Update all project tools (list/get/update/delete)
   - Test project access control

3. **Phase 3: Task Tools**
   - Update all task tools (create/get/update/delete/complete/list)
   - Handle batch operations correctly
   - Test task access control

4. **Phase 4: Documentation**
   - Update README.md (English)
   - Update README_zh.md (Chinese)
   - Update copilot-instructions.md

5. **Phase 5: Testing**
   - Manual testing with real Dida365 account
   - Test all combinations (with/without scope, with/without readonly)
   - Test inbox handling
   - Test error messages

## Security Considerations

1. **Default Behavior**: When not configured, all projects accessible (backward compatible)
2. **No Bypass**: Once configured, cannot be bypassed by tools
3. **Transparent**: Clear error messages inform user why access denied
4. **Audit Trail**: Console output shows configuration at startup
5. **Immutable**: Configuration cannot be changed at runtime (requires restart)

## Backward Compatibility

- Feature is opt-in (no breaking changes)
- Existing configurations work unchanged
- New configurations add optional parameters
- Error messages are clear when restriction applies

## Future Enhancements (Out of Scope)

1. **Wildcard Patterns**: Support `project-*` patterns
2. **Exclude List**: Support `--excluded-projects`
3. **Dynamic Updates**: Update allowed list without restart
4. **Project Groups**: Define named groups of projects
5. **Per-Tool Permissions**: Different tools can access different projects

---

## Summary

This solution provides a secure, user-friendly way to restrict AI access to specific projects. The implementation follows existing patterns (similar to read-only mode), requires minimal code changes, and provides clear feedback to users. The design prioritizes security while maintaining usability and backward compatibility.
