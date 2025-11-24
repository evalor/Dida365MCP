/**
 * Type definitions for Dida365 MCP Server APIs
 */

/**
 * ChecklistItem (Subtask) interface
 */
export interface ChecklistItem {
    id?: string;
    title: string;
    status: number; // 0=Normal, 1=Completed
    completedTime?: string;
    isAllDay?: boolean;
    sortOrder?: number;
    startDate?: string;
    timeZone?: string;
}

/**
 * Task interface
 */
export interface Task {
    id: string;
    projectId: string;
    title: string;
    isAllDay?: boolean;
    completedTime?: string;
    content?: string;
    desc?: string;
    dueDate?: string;
    items?: ChecklistItem[];
    priority?: number; // 0=None, 1=Low, 3=Medium, 5=High
    reminders?: string[];
    repeatFlag?: string;
    sortOrder?: number;
    startDate?: string;
    status: number; // 0=Normal, 2=Completed
    timeZone?: string;
    kind?: string; // "TEXT", "NOTE", "CHECKLIST"
}

/**
 * Project interface
 */
export interface Project {
    id: string;
    name: string;
    color?: string;
    sortOrder: number;
    closed: boolean;
    groupId?: string;
    viewMode: 'list' | 'kanban' | 'timeline';
    permission: 'read' | 'write' | 'comment';
    kind: 'TASK' | 'NOTE';
}

/**
 * Column interface for kanban view
 */
export interface Column {
    id: string;
    projectId: string;
    name: string;
    sortOrder: number;
}

/**
 * Project data with tasks and columns
 */
export interface ProjectData {
    project: Project;
    tasks: Task[]; // Only undone tasks
    columns: Column[];
}

/**
 * Create project request
 */
export interface CreateProjectRequest {
    name: string;
    color?: string;
    sortOrder?: number;
    viewMode?: 'list' | 'kanban' | 'timeline';
    kind?: 'TASK' | 'NOTE';
}

/**
 * Update project request
 */
export interface UpdateProjectRequest {
    name?: string;
    color?: string;
    sortOrder?: number;
    viewMode?: 'list' | 'kanban' | 'timeline';
    kind?: 'TASK' | 'NOTE';
}

/**
 * Create task request
 */
export interface CreateTaskRequest {
    title: string;
    projectId: string;
    content?: string;
    desc?: string;
    isAllDay?: boolean;
    startDate?: string;
    dueDate?: string;
    timeZone?: string;
    reminders?: string[];
    repeatFlag?: string;
    priority?: number;
    sortOrder?: number;
    items?: ChecklistItem[];
}

/**
 * Update task request
 */
export interface UpdateTaskRequest {
    id: string;
    projectId: string;
    title?: string;
    content?: string;
    desc?: string;
    isAllDay?: boolean;
    startDate?: string;
    dueDate?: string;
    timeZone?: string;
    reminders?: string[];
    repeatFlag?: string;
    priority?: number;
    sortOrder?: number;
    items?: ChecklistItem[];
}