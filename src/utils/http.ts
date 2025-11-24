/**
 * HTTP Client Module
 *
 * Axios wrapper for TickTick API requests with automatic token management
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { TokenManager } from '../token.js';
import { loadOAuthConfig } from '../config.js';

/**
 * HTTP Client configuration
 */
export interface HttpClientConfig {
    baseURL?: string;
    timeout?: number;
    tokenManager: TokenManager;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: any;
}

/**
 * API Error class
 */
export class ApiError extends Error {
    public status: number;
    public statusText: string;
    public data?: any;

    constructor(status: number, statusText: string, message: string, data?: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.statusText = statusText;
        this.data = data;
    }
}

/**
 * API Response Empty Error class
 */
export class ApiResponseEmptyError extends Error {
    public status: number;
    public statusText: string;
    public data?: any;

    constructor(status: number, statusText: string, message: string, data?: any) {
        super(message);
        this.name = 'ApiResponseEmptyError';
        this.status = status;
        this.statusText = statusText;
        this.data = data;
    }
}

/**
 * HTTP Client class for TickTick API
 */
export class HttpClient {
    private axiosInstance: AxiosInstance;
    private tokenManager: TokenManager;

    constructor(config: HttpClientConfig) {
        this.tokenManager = config.tokenManager;

        // Create axios instance with default config
        this.axiosInstance = axios.create({
            baseURL: config.baseURL || 'https://api.ticktick.com',
            timeout: config.timeout || 30000, // 30 seconds
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        // Add request interceptor for authentication
        this.axiosInstance.interceptors.request.use(
            async (config) => {
                try {
                    const token = await this.tokenManager.getValidToken();
                    config.headers.Authorization = `Bearer ${token}`;
                } catch (error) {
                    console.error('Failed to get valid token:', error);
                    throw new ApiError(401, 'Unauthorized', 'Authentication failed', error);
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Add response interceptor for error handling
        this.axiosInstance.interceptors.response.use(
            (response: AxiosResponse) => {
                // Check for empty response data
                if (response.data == null || response.data === '') {
                    throw new ApiResponseEmptyError(response.status, response.statusText, 'Response data is empty', response.data);
                }
                try {
                    if (typeof response.data === 'string') {
                        response.data = JSON.parse(response.data);
                    }
                } catch (e) {
                    throw new ApiError(0, 'Parse Error', 'Failed to parse JSON response', e);
                }
                return response;
            },
            async (error: AxiosError) => {
                if (error.response) {
                    const { status, statusText, data } = error.response;

                    // Handle 401 Unauthorized (token expired)
                    if (status === 401) {
                        console.error('Token expired or invalid, clearing token');
                        this.tokenManager.clearToken();
                        throw new ApiError(status, statusText, 'Authentication failed. Please re-authorize.', data);
                    }

                    // Handle other HTTP errors
                    throw new ApiError(status, statusText, `API request failed: ${statusText}`, data);
                } else if (error.request) {
                    // Network error
                    throw new ApiError(0, 'Network Error', 'Network request failed', error.message);
                } else {
                    // Other error
                    throw new ApiError(0, 'Request Error', error.message || 'Unknown error');
                }
            }
        );
    }

    /**
     * GET request
     */
    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.axiosInstance.get<T>(url, config);
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        };
    }

    /**
     * POST request
     */
    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.axiosInstance.post<T>(url, data, config);
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        };
    }

    /**
     * PUT request
     */
    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.axiosInstance.put<T>(url, data, config);
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        };
    }

    /**
     * PATCH request
     */
    async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.axiosInstance.patch<T>(url, data, config);
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        };
    }

    /**
     * DELETE request
     */
    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.axiosInstance.delete<T>(url, config);
        return {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        };
    }

    /**
     * Get the underlying axios instance (for advanced usage)
     */
    getAxiosInstance(): AxiosInstance {
        return this.axiosInstance;
    }

    /**
     * Update base URL
     */
    setBaseURL(baseURL: string): void {
        this.axiosInstance.defaults.baseURL = baseURL;
    }

    /**
     * Update timeout
     */
    setTimeout(timeout: number): void {
        this.axiosInstance.defaults.timeout = timeout;
    }
}


const oauthConfig = loadOAuthConfig();
const defaultTokenManager = new TokenManager(oauthConfig.clientId, oauthConfig.clientSecret);
const defaultHttpClient = new HttpClient({ tokenManager: defaultTokenManager });

export default defaultHttpClient;