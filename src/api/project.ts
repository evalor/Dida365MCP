/**
 * Project API Module
 *
 * Implements all project management APIs for TickTick
 */

import httpClient from '../utils/http.js';
import { Project, ProjectData, CreateProjectRequest, UpdateProjectRequest } from './types.js';

const BASE_URL = '/open/v1/project';

/**
 * Get all projects for the user
 */
export async function listProjects(): Promise<Project[]> {
    const response = await httpClient.get<Project[]>(BASE_URL);
    return response.data;
}

/**
 * Get project by ID
 */
export async function getProject(projectId: string): Promise<Project> {
    const response = await httpClient.get<Project>(`${BASE_URL}/${projectId}`);
    return response.data;
}

/**
 * Get project with all data (tasks and columns)
 */
export async function getProjectData(projectId: string): Promise<ProjectData> {
    const response = await httpClient.get<ProjectData>(`${BASE_URL}/${projectId}/data`);
    return response.data;
}

/**
 * Create a new project
 */
export async function createProject(data: CreateProjectRequest): Promise<Project> {
    const response = await httpClient.post<Project>(BASE_URL, data);
    return response.data;
}

/**
 * Update an existing project
 */
export async function updateProject(projectId: string, data: UpdateProjectRequest): Promise<Project> {
    const response = await httpClient.post<Project>(`${BASE_URL}/${projectId}`, data);
    return response.data;
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<void> {
    await httpClient.delete(`${BASE_URL}/${projectId}`);
}