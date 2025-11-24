/**
 * Task API Module
 *
 * Implements all task management APIs for TickTick
 */

import httpClient from '../utils/http.js';
import { ApiError, ApiResponseEmptyError } from '../utils/http.js';
import { Task, CreateTaskRequest, UpdateTaskRequest } from './types.js';

const BASE_URL = '/open/v1';

/**
 * Get task by project ID and task ID
 */
export async function getTask(projectId: string, taskId: string): Promise<Task> {
    try {
        const response = await httpClient.get<Task>(`${BASE_URL}/project/${projectId}/task/${taskId}`);
        return response.data;
    } catch (error) {
        // Handle not found errors specifically
        if (error instanceof ApiResponseEmptyError) {
            throw new Error(`Task with ID ${taskId} not found in project ${projectId}. This may indicate incorrect projectId or taskId.`);
        }
        if (error instanceof ApiError && (error.status === 500 || error.status === 404)) {
            throw new Error(`Task with ID ${taskId} not found in project ${projectId}.`);
        }
        throw error;
    }
}

/**
 * Create a new task
 */
export async function createTask(data: CreateTaskRequest): Promise<Task> {
    const response = await httpClient.post<Task>(`${BASE_URL}/task`, data);
    return response.data;
}

/**
 * Update an existing task
 */
export async function updateTask(taskId: string, data: UpdateTaskRequest): Promise<Task> {
    try {
        const response = await httpClient.post<Task>(`${BASE_URL}/task/${taskId}`, data);
        return response.data;
    } catch (error) {
        // Empty response indicates that the ProjectId exists, but the task does not exist, update failed.
        if (error instanceof ApiResponseEmptyError) {
            throw new Error(`Task with ID ${taskId} not found. Update failed.`);
        }
        // An interface error indicates incorrect parameters; if it returns 500, it means the project does not exist.
        if (error instanceof ApiError && (error.status === 500 || error.status === 404)) {
            throw new Error(`Task with ID ${taskId} not found. Update failed.`);
        }
        throw error;
    }
}

/**
 * Complete a task
 */
export async function completeTask(projectId: string, taskId: string): Promise<void> {
    try {
        const response = await httpClient.post(`${BASE_URL}/project/${projectId}/task/${taskId}/complete`);
        return response.data;
    } catch (error) {
        if (error instanceof ApiResponseEmptyError) {
            // For complete operations, empty response indicates success
            return;
        }
        if (error instanceof ApiError && (error.status === 500 || error.status === 404)) {
            throw new Error(`Task with ID ${taskId} not found. Complete failed.`);
        }
        throw error;
    }
}

/**
 * Delete a task
 */
export async function deleteTask(projectId: string, taskId: string): Promise<void> {
    try {
        const response = await httpClient.delete(`${BASE_URL}/project/${projectId}/task/${taskId}`);
        return response.data;
    } catch (error) {
        if (error instanceof ApiResponseEmptyError) {
            // For delete operations, empty response indicates success
            return;
        }
        if (error instanceof ApiError && (error.status === 500 || error.status === 404)) {
            throw new Error(`Task with ID ${taskId} not found. Delete failed.`);
        }
        throw error;
    }
}