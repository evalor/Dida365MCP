/**
 * OAuth Core Logic Module
 * 
 * Implements the core logic for OAuth2 authorization flow
 */

import * as crypto from 'crypto';
import { OAuth2Config, APP_CONFIG } from './config.js';
import { TokenManager, TokenData, createValidationContext, type TokenValidationContext } from './token.js';
import { OAuthCallbackServer } from './oauth-server.js';
import { AuthStateManager, AuthState } from './auth-state.js';

/**
 * OAuth Manager
 * 
 * Manages OAuth2 authorization flow and token lifecycle.
 * Uses TokenValidationContext for efficient token validation without redundant hash calculations.
 */
export class OAuthManager {
    private config: OAuth2Config;
    private tokenManager: TokenManager;
    private stateManager: AuthStateManager;
    private callbackServer: OAuthCallbackServer | null = null;
    private currentState: string | null = null;
    private currentAuthUrl: string | null = null;
    private validationContext: TokenValidationContext;

    /**
     * Create an OAuthManager instance
     * 
     * @param {OAuth2Config} config - OAuth2 configuration (clientId, clientSecret, endpoints)
     * 
     * Note: Region is obtained from APP_CONFIG.REGION instead of being passed as a parameter,
     * as it's a global configuration that doesn't change during runtime.
     */
    constructor(config: OAuth2Config) {
        this.config = config;
        // Create validation context once, pre-computing the clientSecretHash
        this.validationContext = createValidationContext(
            config.clientId,
            config.clientSecret,
            APP_CONFIG.REGION
        );
        this.tokenManager = new TokenManager(this.validationContext);
        this.stateManager = new AuthStateManager();

        // Check if there's a valid Token on startup
        if (this.tokenManager.hasToken() && this.tokenManager.isTokenValid()) {
            this.stateManager.setAuthorized();
            console.error('Found valid token on startup');
        } else if (this.tokenManager.hasToken()) {
            console.error('Found expired token on startup, need to re-authorize');
        } else {
            console.error('No token found on startup, authorization required');
        }
    }

    /**
     * Generate authorization URL and start callback server
     * 
     * @returns {Promise<string>} Authorization URL
     */
    async getAuthorizationUrl(): Promise<string> {
        // If authorization is already in progress, return existing URL (idempotent)
        if (this.isValidPendingState()) {
            return this.currentAuthUrl!;
        }

        // If we reach here during PENDING state, it means we have an inconsistent state
        // (e.g., currentAuthUrl or currentState is missing). Clean up before proceeding.
        if (this.stateManager.isPending()) {
            console.error('Inconsistent authorization state detected, cleaning up...');
            if (this.callbackServer) {
                this.callbackServer.close();
                this.callbackServer = null;
            }
            this.currentState = null;
            this.currentAuthUrl = null;
        }

        // Generate random state (prevent CSRF)
        this.currentState = this.generateState();

        // Construct authorization URL
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            response_type: 'code',
            scope: this.config.scope,
            state: this.currentState,
        });

        const authUrl = `${this.config.authEndpoint}?${params.toString()}`;

        // Store the current auth URL
        this.currentAuthUrl = authUrl;

        // Start callback server (asynchronous)
        this.startCallbackServer(this.currentState);

        // Update state to pending
        this.stateManager.startAuthFlow();

        return authUrl;
    }

    /**
     * Start callback server and wait for authorization
     */
    private async startCallbackServer(state: string): Promise<void> {
        this.callbackServer = new OAuthCallbackServer();

        try {
            // Wait for authorization callback
            const result = await this.callbackServer.waitForCallback(state);

            console.error(`Received authorization code: ${result.code.substring(0, 10)}...`);

            // Exchange Token
            const tokenData = await this.exchangeCodeForToken(result.code);

            // Save Token
            this.tokenManager.setToken(tokenData);

            // Update state to authorized
            this.stateManager.setAuthorized();

            console.error('Authorization completed successfully');
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error(`Authorization failed: ${errorMsg}`);
            this.stateManager.setError(errorMsg);
        } finally {
            // Cleanup
            this.callbackServer?.close();
            this.callbackServer = null;
            this.currentState = null;
            this.currentAuthUrl = null;
        }
    }

    /**
     * Exchange authorization code for Access Token
     * 
     * @param {string} code - Authorization code
     * @returns {Promise<TokenData>} Token data
     */
    private async exchangeCodeForToken(code: string): Promise<TokenData> {
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: this.config.redirectUri,
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
        });

        const response = await fetch(this.config.tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
        }

        const data = await response.json() as any;

        // Construct Token data with client credentials metadata
        const tokenData: TokenData = {
            access_token: data.access_token,
            expires_at: Date.now() + (data.expires_in * 1000),
            created_at: Date.now(),
            scope: data.scope || this.config.scope,
            token_type: data.token_type,
            clientId: this.config.clientId,
            clientSecretHash: this.validationContext.clientSecretHash,
            region: this.validationContext.region,
        };

        return tokenData;
    }

    /**
     * Generate random state (32 bytes)
     * 
     * @returns {string} Random state
     */
    private generateState(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Check if there's a valid pending authorization state
     * 
     * @returns {boolean} True if authorization is pending with valid URL and state
     */
    private isValidPendingState(): boolean {
        return this.stateManager.isPending() && 
               this.currentAuthUrl !== null && 
               this.currentState !== null;
    }

    /**
     * Get valid Access Token
     * 
     * @returns {Promise<string>} Valid Access Token
     */
    async getValidAccessToken(): Promise<string> {
        try {
            const token = await this.tokenManager.getValidToken();

            // Ensure state is correct
            if (!this.stateManager.isAuthorized()) {
                this.stateManager.setAuthorized();
            }

            return token;
        } catch (error) {
            // Token fetch failed, update state
            if (this.tokenManager.hasToken()) {
                this.stateManager.setExpired();
            } else {
                this.stateManager.setNotAuthorized();
            }
            throw error;
        }
    }

    /**
     * Check authorization status
     * 
     * Performs real-time validation of token status by checking the file system,
     * not just the in-memory state. This ensures accurate status even if the
     * token file was manually deleted or modified.
     * 
     * @returns {AuthStateInfo} Status information
     */
    getAuthStatus() {
        // Sync state with actual token status
        // This handles cases where token file was deleted externally
        if (this.stateManager.isAuthorized()) {
            if (!this.tokenManager.hasToken()) {
                // Token file was deleted, update state
                this.stateManager.setNotAuthorized();
            } else if (!this.tokenManager.isTokenValid()) {
                // Token exists but is expired
                this.stateManager.setExpired();
            }
        }

        const info = this.stateManager.getStateInfo();

        // Add auth_url if pending
        if (info.state === AuthState.PENDING && this.currentAuthUrl) {
            return {
                ...info,
                auth_url: this.currentAuthUrl
            };
        }

        return info;
    }

    /**
     * Revoke authorization (clear Token)
     */
    revokeAuthorization(): void {
        this.tokenManager.clearToken();
        this.stateManager.setNotAuthorized();

        // If callback server is running, close it
        if (this.callbackServer) {
            this.callbackServer.close();
            this.callbackServer = null;
        }

        // Clear auth URL and state
        this.currentAuthUrl = null;
        this.currentState = null;

        console.error('Authorization revoked, token cleared');
    }

    /**
     * Check if authorized
     */
    isAuthorized(): boolean {
        return this.stateManager.isAuthorized() && this.tokenManager.hasToken();
    }

    /**
     * Check if waiting for authorization
     */
    isPending(): boolean {
        return this.stateManager.isPending();
    }
}
