/**
 * OAuth Core Logic Module
 * 
 * Implements the core logic for OAuth2 authorization flow
 */

import * as crypto from 'crypto';
import { OAuth2Config, APP_CONFIG } from './config.js';
import { TokenManager, TokenData } from './token.js';
import { OAuthCallbackServer } from './oauth-server.js';
import { AuthStateManager, AuthState } from './auth-state.js';
import { sha256 } from './utils/hash.js';

/**
 * OAuth Manager
 */
export class OAuthManager {
    private config: OAuth2Config;
    private tokenManager: TokenManager;
    private stateManager: AuthStateManager;
    private callbackServer: OAuthCallbackServer | null = null;
    private currentState: string | null = null;

    constructor(config: OAuth2Config) {
        this.config = config;
        this.tokenManager = new TokenManager(config.clientId, config.clientSecret);
        this.stateManager = new AuthStateManager();

        // Check if there's a valid Token on startup
        if (this.tokenManager.hasToken() && this.tokenManager.isTokenValid()) {
            this.stateManager.setAuthorized();
            console.error('Found valid token on startup');
        } else if (this.tokenManager.hasToken()) {
            console.error('Found expired token on startup, need to refresh or re-authorize');
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
        // Check if authorization is already in progress
        if (this.stateManager.isPending()) {
            throw new Error('Authorization already in progress. Please complete or cancel the current authorization.');
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
            refresh_token: data.refresh_token,
            expires_at: Date.now() + (data.expires_in * 1000),
            created_at: Date.now(),
            scope: data.scope || this.config.scope,
            token_type: data.token_type,
            clientId: this.config.clientId,
            clientSecretHash: sha256(this.config.clientSecret),
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
     * Get valid Access Token (auto-refresh)
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
     * @returns {AuthStateInfo} Status information
     */
    getAuthStatus() {
        return this.stateManager.getStateInfo();
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

        console.error('Authorization revoked, token cleared');
    }

    /**
     * Get Token manager (for external use)
     */
    getTokenManager(): TokenManager {
        return this.tokenManager;
    }

    /**
     * Get state manager (for external use)
     */
    getStateManager(): AuthStateManager {
        return this.stateManager;
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
