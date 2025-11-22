/**
 * OAuth2 Configuration Module
 * 
 * Responsible for loading and validating Dida365 OAuth2 configuration parameters
 */

/**
 * OAuth2 configuration interface
 */
export interface OAuth2Config {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope: string;
    authEndpoint: string;
    tokenEndpoint: string;
}

/**
 * Read-only mode configuration
 * Parsed from command line arguments
 */
let isReadOnlyMode = false;

/**
 * Parse command line arguments
 */
function parseCommandLineArgs(): void {
    const args = process.argv.slice(2);
    if (args.includes('--readonly') || args.includes('-r')) {
        isReadOnlyMode = true;
        console.error('⚠️  Read-Only Mode Enabled - All write/delete operations are disabled');
    }
}

// Parse args on module load
parseCommandLineArgs();

/**
 * Check if server is running in read-only mode
 */
export function isReadOnly(): boolean {
    return isReadOnlyMode;
}

/**
 * Fixed configuration constants
 */
export const OAUTH_CONSTANTS = {
    // Fixed callback address
    REDIRECT_URI: 'http://localhost:8521/callback',

    // Callback server configuration
    CALLBACK_HOST: 'localhost',
    CALLBACK_PORT: 8521,

    // Fixed permission scope
    SCOPE: 'tasks:read tasks:write',

    // Dida365 OAuth endpoints
    AUTH_ENDPOINT: 'https://dida365.com/oauth/authorize',
    TOKEN_ENDPOINT: 'https://dida365.com/oauth/token',

    // Dida365 API base URL
    API_BASE_URL: 'https://api.dida365.com',
} as const;

/**
 * Load OAuth2 configuration from environment variables
 * 
 * @throws {Error} If required environment variables are not set
 * @returns {OAuth2Config} Complete OAuth2 configuration object
 */
export function loadOAuthConfig(): OAuth2Config {
    // Read environment variables
    const clientId = process.env.DIDA365_CLIENT_ID;
    const clientSecret = process.env.DIDA365_CLIENT_SECRET;

    // Validate required parameters
    if (!clientId) {
        throw new Error(
            'DIDA365_CLIENT_ID environment variable is not set. ' +
            'Please set it to your Dida365 OAuth Client ID. ' +
            'Get it from https://developer.dida365.com'
        );
    }

    if (!clientSecret) {
        throw new Error(
            'DIDA365_CLIENT_SECRET environment variable is not set. ' +
            'Please set it to your Dida365 OAuth Client Secret. ' +
            'Get it from https://developer.dida365.com'
        );
    }

    // Validate parameter format (basic check)
    if (clientId.trim().length === 0) {
        throw new Error('DIDA365_CLIENT_ID cannot be empty');
    }

    if (clientSecret.trim().length === 0) {
        throw new Error('DIDA365_CLIENT_SECRET cannot be empty');
    }

    // Return complete configuration
    return {
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        redirectUri: OAUTH_CONSTANTS.REDIRECT_URI,
        scope: OAUTH_CONSTANTS.SCOPE,
        authEndpoint: OAUTH_CONSTANTS.AUTH_ENDPOINT,
        tokenEndpoint: OAUTH_CONSTANTS.TOKEN_ENDPOINT,
    };
}

/**
 * Validate whether OAuth2 configuration is valid
 * 
 * @param {OAuth2Config} config - Configuration object to validate
 * @returns {boolean} Whether configuration is valid
 */
export function validateOAuthConfig(config: OAuth2Config): boolean {
    return (
        !!config.clientId &&
        !!config.clientSecret &&
        config.clientId.length > 0 &&
        config.clientSecret.length > 0 &&
        config.redirectUri === OAUTH_CONSTANTS.REDIRECT_URI
    );
}

/**
 * Print configuration info (for debugging, hide sensitive information)
 * 
 * @param {OAuth2Config} config - OAuth2 configuration object
 */
export function printConfigInfo(config: OAuth2Config): void {
    console.error('OAuth2 Configuration:');
    console.error(`  Client ID: ${maskSensitiveString(config.clientId)}`);
    console.error(`  Client Secret: ${maskSensitiveString(config.clientSecret)}`);
    console.error(`  Redirect URI: ${config.redirectUri}`);
    console.error(`  Scope: ${config.scope}`);
    console.error(`  Auth Endpoint: ${config.authEndpoint}`);
    console.error(`  Token Endpoint: ${config.tokenEndpoint}`);
    console.error(`  Read-Only Mode: ${isReadOnlyMode ? 'ENABLED ⚠️' : 'DISABLED'}`);
}

/**
 * Mask sensitive string (only show first and last 4 characters)
 * 
 * @param {string} str - String to mask
 * @returns {string} Masked string
 */
function maskSensitiveString(str: string): string {
    if (str.length <= 8) {
        return '***';
    }
    return `${str.substring(0, 4)}...${str.substring(str.length - 4)}`;
}
