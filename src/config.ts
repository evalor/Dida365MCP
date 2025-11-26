import * as fs from 'fs';
import * as path from 'path';

/**
 * Load environment variables from .env file (development only)
 *
 * In production (MCP runtime), environment variables should be passed via
 * the MCP client's configuration file (e.g., claude_desktop_config.json).
 * The .env file is only for local development convenience.
 */

// Load .env file manually to avoid dotenv stdout output in MCP
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envLines = envContent.split('\n');

        for (const line of envLines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join('=').trim();
                    if (value.startsWith('"') && value.endsWith('"')) {
                        process.env[key.trim()] = value.slice(1, -1);
                    } else if (value.startsWith("'") && value.endsWith("'")) {
                        process.env[key.trim()] = value.slice(1, -1);
                    } else {
                        process.env[key.trim()] = value;
                    }
                }
            }
        }
    } catch (error) {
        // Silently ignore .env loading errors in production
        console.error('Warning: Failed to load .env file:', error);
    }
}

/**
 * Application Configuration Module
 * 
 * Central configuration management for the Dida365 MCP Server
 * Contains all application-wide constants and settings
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
 * Get region from environment variable
 */
function getRegion(): 'china' | 'international' {
    const region = process.env.DIDA365_REGION?.toLowerCase().trim();
    if (region === 'international') {
        return 'international';
    }
    return 'china'; // default
}

/**
 * Get OAuth endpoints based on region
 */
function getOAuthEndpoints(region: 'china' | 'international') {
    if (region === 'international') {
        return {
            AUTH_ENDPOINT: 'https://ticktick.com/oauth/authorize',
            TOKEN_ENDPOINT: 'https://ticktick.com/oauth/token',
        };
    } else {
        return {
            AUTH_ENDPOINT: 'https://dida365.com/oauth/authorize',
            TOKEN_ENDPOINT: 'https://dida365.com/oauth/token',
        };
    }
}

/**
 * Get API base URL based on region
 */
function getApiBaseUrl(region: 'china' | 'international'): string {
    return region === 'international' ? 'https://api.ticktick.com' : 'https://api.dida365.com';
}

/**
 * Application configuration constants
 * Contains all fixed configuration values for the application
 */
export const APP_CONFIG = (() => {
    const region = getRegion();
    const endpoints = getOAuthEndpoints(region);

    return {
        // Region configuration
        REGION: region,

        // OAuth2 Configuration
        OAUTH: {
            // Fixed callback address
            REDIRECT_URI: 'http://localhost:8521/callback',

            // Callback server configuration
            CALLBACK_HOST: 'localhost',
            CALLBACK_PORT: 8521,

            // Fixed permission scope
            SCOPE: 'tasks:read tasks:write',

            // OAuth endpoints based on region
            AUTH_ENDPOINT: endpoints.AUTH_ENDPOINT,
            TOKEN_ENDPOINT: endpoints.TOKEN_ENDPOINT,

            // Authorization timeout (10 minutes in milliseconds)
            AUTH_TIMEOUT_MS: 10 * 60 * 1000,
        },

        // API Configuration
        API: {
            // API base URL based on region
            BASE_URL: getApiBaseUrl(region),
        },
    };
})();

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
        redirectUri: APP_CONFIG.OAUTH.REDIRECT_URI,
        scope: APP_CONFIG.OAUTH.SCOPE,
        authEndpoint: APP_CONFIG.OAUTH.AUTH_ENDPOINT,
        tokenEndpoint: APP_CONFIG.OAUTH.TOKEN_ENDPOINT,
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
        config.clientSecret.length > 0
    );
}

/**
 * Print configuration info (for debugging, hide sensitive information)
 * 
 * @param {OAuth2Config} config - OAuth2 configuration object
 */
export function printConfigInfo(config: OAuth2Config): void {
    console.error('OAuth2 Configuration:');
    console.error(`  Region: ${APP_CONFIG.REGION}`);
    console.error(`  Client ID: ${maskSensitiveString(config.clientId)}`);
    console.error(`  Client Secret: ${maskSensitiveString(config.clientSecret)}`);
    console.error(`  Redirect URI: ${config.redirectUri}`);
    console.error(`  Scope: ${config.scope}`);
    console.error(`  Auth Endpoint: ${config.authEndpoint}`);
    console.error(`  Token Endpoint: ${config.tokenEndpoint}`);
    console.error(`  API Base URL: ${APP_CONFIG.API.BASE_URL}`);
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
