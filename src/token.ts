/**
 * Token Management Module
 * 
 * Responsible for OAuth2 Token storage, loading, refreshing and validation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { OAUTH_CONSTANTS } from './config.js';

/**
 * Token data structure
 */
export interface TokenData {
    access_token: string;
    refresh_token: string;
    expires_at: number;  // Unix timestamp (ms)
    created_at: number;  // Unix timestamp (ms)
    scope: string;
    token_type?: string;
}

/**
 * Token storage path
 */
const TOKEN_DIR = path.join(os.homedir(), '.dida365-mcp');
const TOKEN_FILE = path.join(TOKEN_DIR, 'tokens.json');

/**
 * Ensure token storage directory exists
 */
function ensureTokenDir(): void {
    if (!fs.existsSync(TOKEN_DIR)) {
        fs.mkdirSync(TOKEN_DIR, { recursive: true, mode: 0o700 });
    }
}

/**
 * Save Token to local file
 * 
 * @param {TokenData} tokenData - Token data
 */
export function saveToken(tokenData: TokenData): void {
    ensureTokenDir();

    const data = JSON.stringify(tokenData, null, 2);
    fs.writeFileSync(TOKEN_FILE, data, { mode: 0o600 });

    console.error(`Token saved to ${TOKEN_FILE}`);
}

/**
 * Load Token from local file
 * 
 * @returns {TokenData | null} Token data, returns null if not exists
 */
export function loadToken(): TokenData | null {
    if (!fs.existsSync(TOKEN_FILE)) {
        return null;
    }

    try {
        const data = fs.readFileSync(TOKEN_FILE, 'utf-8');
        const tokenData = JSON.parse(data) as TokenData;

        // Validate required fields (refresh_token is optional, some OAuth implementations don't return it)
        if (!tokenData.access_token || !tokenData.expires_at) {
            console.error('Invalid token file: missing required fields (access_token or expires_at)');
            return null;
        }

        return tokenData;
    } catch (error) {
        console.error('Failed to load token:', error);
        return null;
    }
}

/**
 * Delete local Token file
 */
export function deleteToken(): void {
    if (fs.existsSync(TOKEN_FILE)) {
        fs.unlinkSync(TOKEN_FILE);
        console.error('Token file deleted');
    }
}

/**
 * Check if Token is expired
 * 
 * @param {TokenData} tokenData - Token data
 * @param {number} bufferSeconds - Buffer time in seconds before considering expired (default 5 minutes)
 * @returns {boolean} Whether token is expired
 */
export function isTokenExpired(tokenData: TokenData, bufferSeconds: number = 300): boolean {
    const buffer = bufferSeconds * 1000;
    return Date.now() >= (tokenData.expires_at - buffer);
}

/**
 * Refresh Access Token
 * 
 * @param {string} refreshToken - Refresh Token
 * @param {string} clientId - OAuth Client ID
 * @param {string} clientSecret - OAuth Client Secret
 * @returns {Promise<TokenData>} New Token data
 */
export async function refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
): Promise<TokenData> {
    const tokenEndpoint = OAUTH_CONSTANTS.TOKEN_ENDPOINT;

    const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
    });

    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
    }

    const data = await response.json() as any;

    // Construct new Token data
    const newTokenData: TokenData = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || refreshToken, // Some implementations don't return new refresh_token
        expires_at: Date.now() + (data.expires_in * 1000),
        created_at: Date.now(),
        scope: data.scope || OAUTH_CONSTANTS.SCOPE,
        token_type: data.token_type,
    };

    // Auto-save new Token
    saveToken(newTokenData);

    return newTokenData;
}

/**
 * Token Manager class
 */
export class TokenManager {
    private tokenData: TokenData | null = null;
    private clientId: string;
    private clientSecret: string;

    constructor(clientId: string, clientSecret: string) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;

        // Try to load saved Token on startup
        this.tokenData = loadToken();
    }

    /**
     * Get valid Access Token (auto-refresh)
     * 
     * @returns {Promise<string>} Valid Access Token
     * @throws {Error} If no token available or refresh fails
     */
    async getValidToken(): Promise<string> {
        if (!this.tokenData) {
            throw new Error('No token available. Please authorize first.');
        }

        // Check if expired
        if (isTokenExpired(this.tokenData)) {
            console.error('Token expired, attempting to refresh...');

            // If refresh_token exists, try to refresh
            if (this.tokenData.refresh_token) {
                this.tokenData = await refreshAccessToken(
                    this.tokenData.refresh_token,
                    this.clientId,
                    this.clientSecret
                );
            } else {
                // No refresh_token, cannot refresh
                throw new Error('Token expired and no refresh_token available. Please re-authorize.');
            }
        }

        return this.tokenData.access_token;
    }

    /**
     * Set new Token data
     * 
     * @param {TokenData} tokenData - Token data
     */
    setToken(tokenData: TokenData): void {
        this.tokenData = tokenData;
        saveToken(tokenData);
    }

    /**
     * Check if Token exists
     * 
     * @returns {boolean} Whether token exists
     */
    hasToken(): boolean {
        return this.tokenData !== null;
    }

    /**
     * Check if Token is valid (exists and not expired)
     * 
     * @returns {boolean} Whether token is valid
     */
    isTokenValid(): boolean {
        if (!this.tokenData) {
            return false;
        }

        return !isTokenExpired(this.tokenData);
    }

    /**
     * Clear Token
     */
    clearToken(): void {
        this.tokenData = null;
        deleteToken();
    }

    /**
     * Get current Token data (for debugging)
     * 
     * @returns {TokenData | null} Token data
     */
    getTokenData(): TokenData | null {
        return this.tokenData;
    }
}
