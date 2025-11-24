/**
 * Task API Module
 *
 * Implements all task management APIs for TickTick
 */

import httpClient from '../utils/http.js';
import { Task, CreateTaskRequest, UpdateTaskRequest } from './types.js';

const BASE_URL = '/open/v1';

/**
 * Get task by project ID and task ID
 */
export async function getTask(projectId: string, taskId: string): Promise<Task> {
    const response = await httpClient.get<Task>(`${BASE_URL}/project/${projectId}/task/${taskId}`);
    return response.data;
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
    const response = await httpClient.post<Task>(`${BASE_URL}/task/${taskId}`, data);
    return response.data;
}

/**
 * Complete a task
 */
export async function completeTask(projectId: string, taskId: string): Promise<void> {
    await httpClient.post(`${BASE_URL}/project/${projectId}/task/${taskId}/complete`);
}

/**
 * Delete a task
 */
export async function deleteTask(projectId: string, taskId: string): Promise<void> {
    await httpClient.delete(`${BASE_URL}/project/${projectId}/task/${taskId}`);
}