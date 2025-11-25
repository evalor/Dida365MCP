/**
 * Token Management Module
 * 
 * Responsible for OAuth2 Token storage, loading and validation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { APP_CONFIG } from './config.js';
import { sha256 } from './utils/hash.js';

/**
 * Token data structure
 */
export interface TokenData {
    access_token: string;
    expires_at: number;  // Unix timestamp (ms)
    created_at: number;  // Unix timestamp (ms)
    scope: string;
    token_type?: string;
    // Client credential metadata (for validation)
    clientId?: string;
    clientSecretHash?: string;
    // Region information (for cross-region validation)
    region?: string;
}

/**
 * Token validation context
 * Encapsulates all parameters needed for token validation to avoid redundant parameter passing
 */
export interface TokenValidationContext {
    clientId: string;
    clientSecretHash: string;  // Pre-computed hash to avoid repeated SHA256 calculations
    region: string;
}

/**
 * Create a token validation context from raw credentials
 * Pre-computes the clientSecretHash to optimize repeated validations
 * 
 * @param {string} clientId - OAuth Client ID
 * @param {string} clientSecret - OAuth Client Secret (will be hashed)
 * @param {string} region - Region identifier
 * @returns {TokenValidationContext} Validation context with pre-computed hash
 */
export function createValidationContext(
    clientId: string,
    clientSecret: string,
    region: string
): TokenValidationContext {
    return {
        clientId,
        clientSecretHash: sha256(clientSecret),
        region,
    };
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
 * @param {TokenData} tokenData - Token data (must include clientId and clientSecretHash)
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

        // Validate required fields
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
 * Validate if token belongs to the current client credentials
 * 
 * @param {TokenData} tokenData - Token data to validate
 * @param {string} clientId - Current OAuth Client ID
 * @param {string} clientSecretHash - Pre-computed hash of OAuth Client Secret
 * @returns {boolean} Whether token belongs to the current client
 */
export function validateTokenCredentials(
    tokenData: TokenData,
    clientId: string,
    clientSecretHash: string
): boolean {
    // If token doesn't have client metadata, treat as invalid (legacy token)
    if (!tokenData.clientId || !tokenData.clientSecretHash) {
        return false;
    }

    // Validate client ID matches
    if (tokenData.clientId !== clientId) {
        return false;
    }

    // Validate client secret hash matches (no need to compute, use pre-computed hash)
    if (tokenData.clientSecretHash !== clientSecretHash) {
        return false;
    }

    return true;
}

/**
 * Validate if token belongs to the current region
 * 
 * @param {TokenData} tokenData - Token data to validate
 * @param {string} region - Current region
 * @returns {boolean} Whether token belongs to the current region
 */
export function validateTokenRegion(tokenData: TokenData, region: string): boolean {
    // If token doesn't have region metadata, treat as invalid (legacy token)
    if (!tokenData.region) {
        return false;
    }

    // Validate region matches
    return tokenData.region === region;
}

/**
 * Validate token against a validation context
 * Combines credentials and region validation in a single call
 * 
 * @param {TokenData} tokenData - Token data to validate
 * @param {TokenValidationContext} context - Validation context with pre-computed values
 * @returns {boolean} Whether token is valid for the current context
 */
export function validateToken(tokenData: TokenData, context: TokenValidationContext): boolean {
    return validateTokenCredentials(tokenData, context.clientId, context.clientSecretHash) &&
        validateTokenRegion(tokenData, context.region);
}

/**
 * Token Manager class
 * 
 * This implementation does not cache tokens in memory.
 * All reads are directly from the file system to avoid synchronization issues
 * between multiple TokenManager instances.
 * 
 * Uses TokenValidationContext to pre-compute clientSecretHash, avoiding
 * repeated SHA256 calculations during token validation.
 */
export class TokenManager {
    private validationContext: TokenValidationContext;

    /**
     * Create a TokenManager instance
     * 
     * @param {TokenValidationContext} context - Pre-computed validation context
     */
    constructor(context: TokenValidationContext) {
        this.validationContext = context;

        // Validate and clean up invalid token on startup
        this.validateStoredToken();
    }

    /**
     * Validate stored token on startup
     * Deletes the token file if it's invalid (wrong credentials or region)
     */
    private validateStoredToken(): void {
        const loadedToken = loadToken();

        if (loadedToken) {
            // Validate that token belongs to current client credentials and region
            if (!validateToken(loadedToken, this.validationContext)) {
                // Delete the invalid token to avoid confusion
                deleteToken();
                console.error('Stored token is invalid (credentials or region mismatch), deleted');
            }
        }
    }

    /**
     * Load and validate token from file
     * 
     * @returns {TokenData | null} Valid token data, or null if not available
     */
    private loadValidToken(): TokenData | null {
        const tokenData = loadToken();

        if (!tokenData) {
            return null;
        }

        // Validate using pre-computed context (no repeated hash calculation)
        if (!validateToken(tokenData, this.validationContext)) {
            return null;
        }

        return tokenData;
    }

    /**
     * Get valid Access Token
     * 
     * @returns {Promise<string>} Valid Access Token
     * @throws {Error} If no token available or token is expired
     */
    async getValidToken(): Promise<string> {
        const tokenData = this.loadValidToken();

        if (!tokenData) {
            throw new Error('No token available. Please authorize first.');
        }

        // Check if expired
        if (isTokenExpired(tokenData)) {
            throw new Error('Token expired. Please re-authorize.');
        }

        return tokenData.access_token;
    }

    /**
     * Set new Token data
     * 
     * @param {TokenData} tokenData - Token data
     */
    setToken(tokenData: TokenData): void {
        saveToken(tokenData);
    }

    /**
     * Check if Token exists
     * 
     * @returns {boolean} Whether token exists
     */
    hasToken(): boolean {
        return this.loadValidToken() !== null;
    }

    /**
     * Check if Token is valid (exists and not expired)
     * 
     * @returns {boolean} Whether token is valid
     */
    isTokenValid(): boolean {
        const tokenData = this.loadValidToken();

        if (!tokenData) {
            return false;
        }

        return !isTokenExpired(tokenData);
    }

    /**
     * Clear Token
     */
    clearToken(): void {
        deleteToken();
    }
}
