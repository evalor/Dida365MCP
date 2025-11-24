/**
 * Project API Module
 *
 * Implements all project management APIs for TickTick
 */

import httpClient from '../utils/http.js';
import { ApiResponseEmptyError } from '../utils/http.js';
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
    try {
        const response = await httpClient.get<Project>(`${BASE_URL}/${projectId}`);
        if (Object.keys(response).length === 0) {
            throw new Error(`Project with ID ${projectId} not found`);
        }
        return response.data;
    } catch (error) {
        if (error instanceof ApiResponseEmptyError) {
            throw new Error(`Project with ID ${projectId} not found`);
        }
        throw error;
    }
}

/**
 * Get project with all data (tasks and columns)
 */
export async function getProjectData(projectId: string): Promise<ProjectData> {
    try {
        const response = await httpClient.get<ProjectData>(`${BASE_URL}/${projectId}/data`);
        if (Object.keys(response.data).length === 0) {
            throw new Error(`Project data with ID ${projectId} not found`);
        }
        return response.data;
    } catch (error) {
        if (error instanceof ApiResponseEmptyError) {
            throw new Error(`Project with ID ${projectId} not found`);
        }
        throw error;
    }
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
    try {
        const response = await httpClient.post<Project>(`${BASE_URL}/${projectId}`, data);
        return response.data;
    } catch (error) {
        if (error instanceof ApiResponseEmptyError) {
            throw new Error(`Project with ID ${projectId} not found`);
        }
        throw error;
    }
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<void> {
    try {
        await httpClient.delete(`${BASE_URL}/${projectId}`);
    } catch (error) {
        if (error instanceof ApiResponseEmptyError) {
            // For delete operations, empty response indicates success
            return;
        }
        throw error;
    }
}