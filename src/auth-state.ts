/**
 * Auth State Management Module
 * 
 * Manages OAuth authorization state machine
 */

/**
 * Authorization state enum
 */
export enum AuthState {
    NOT_AUTHORIZED = 'not_authorized',    // Not authorized
    PENDING = 'pending',                  // Waiting for user authorization
    AUTHORIZED = 'authorized',            // Authorized
    EXPIRED = 'expired',                  // Token expired
    ERROR = 'error'                       // Authorization error
}

/**
 * Authorization state information
 */
export interface AuthStateInfo {
    state: AuthState;
    message: string;
    authorized: boolean;
    error?: string;
    timestamp: number;
    auth_url?: string;  // Authorization URL (only present when state is PENDING)
}

/**
 * Authorization state manager
 */
export class AuthStateManager {
    private currentState: AuthState = AuthState.NOT_AUTHORIZED;
    private authStartTime?: number;
    private lastError?: string;

    /**
     * Start authorization flow
     */
    startAuthFlow(): void {
        this.currentState = AuthState.PENDING;
        this.authStartTime = Date.now();
        this.lastError = undefined;
        console.error('Auth state: PENDING (waiting for user authorization)');
    }

    /**
     * Authorization successful
     */
    setAuthorized(): void {
        this.currentState = AuthState.AUTHORIZED;
        this.authStartTime = undefined;
        this.lastError = undefined;
        console.error('Auth state: AUTHORIZED');
    }

    /**
     * Set to not authorized
     */
    setNotAuthorized(): void {
        this.currentState = AuthState.NOT_AUTHORIZED;
        this.authStartTime = undefined;
        this.lastError = undefined;
        console.error('Auth state: NOT_AUTHORIZED');
    }

    /**
     * Set to expired
     */
    setExpired(): void {
        this.currentState = AuthState.EXPIRED;
        this.lastError = 'Token expired';
        console.error('Auth state: EXPIRED');
    }

    /**
     * Set error state
     * 
     * @param {string} error - Error message
     */
    setError(error: string): void {
        this.currentState = AuthState.ERROR;
        this.lastError = error;
        this.authStartTime = undefined;
        console.error(`Auth state: ERROR - ${error}`);
    }

    /**
     * Check if authorization timeout (5 minutes)
     * 
     * @returns {boolean} Whether timed out
     */
    isAuthTimeout(): boolean {
        if (!this.authStartTime) {
            return false;
        }
        return Date.now() - this.authStartTime > 5 * 60 * 1000;
    }

    /**
     * Get current state
     * 
     * @returns {AuthState} Current authorization state
     */
    getState(): AuthState {
        // If waiting for authorization and timed out, auto-transition to error state
        if (this.currentState === AuthState.PENDING && this.isAuthTimeout()) {
            this.setError('Authorization timeout (exceeded 5 minutes)');
        }
        return this.currentState;
    }

    /**
     * Get detailed state information
     * 
     * @returns {AuthStateInfo} State information
     */
    getStateInfo(): AuthStateInfo {
        const state = this.getState();
        const authorized = state === AuthState.AUTHORIZED;

        let message: string;
        switch (state) {
            case AuthState.NOT_AUTHORIZED:
                message = 'Not authorized. Please authorize first using get_auth_url tool.';
                break;
            case AuthState.PENDING:
                const elapsed = this.authStartTime ? Math.floor((Date.now() - this.authStartTime) / 1000) : 0;
                message = `Waiting for authorization (${elapsed}s elapsed, timeout in ${300 - elapsed}s)`;
                break;
            case AuthState.AUTHORIZED:
                message = 'Successfully authorized';
                break;
            case AuthState.EXPIRED:
                message = 'Token expired. Please re-authorize.';
                break;
            case AuthState.ERROR:
                message = `Authorization error: ${this.lastError || 'Unknown error'}`;
                break;
            default:
                message = 'Unknown state';
        }

        return {
            state,
            message,
            authorized,
            error: this.lastError,
            timestamp: Date.now(),
        };
    }

    /**
     * Check if authorized
     * 
     * @returns {boolean} Whether authorized
     */
    isAuthorized(): boolean {
        return this.getState() === AuthState.AUTHORIZED;
    }

    /**
     * Check if waiting for authorization
     * 
     * @returns {boolean} Whether waiting
     */
    isPending(): boolean {
        return this.getState() === AuthState.PENDING;
    }
}
