/**
 * OAuth Callback Server Module
 * 
 * Responsible for starting a temporary HTTP server to receive OAuth callbacks
 */

import * as http from 'http';
import { APP_CONFIG } from './config.js';
import fs from 'fs';
import path from 'path';

/**
 * OAuth callback result
 */
export interface OAuthCallbackResult {
    code: string;
    state: string;
}

/**
 * OAuth Callback Server
 */
export class OAuthCallbackServer {
    private server: http.Server | null = null;
    private pendingState: string | null = null;
    private resolveCallback: ((result: OAuthCallbackResult) => void) | null = null;
    private rejectCallback: ((error: Error) => void) | null = null;
    private timeoutHandle: NodeJS.Timeout | null = null;

    /**
     * Start server and wait for authorization callback
     * 
     * @param {string} state - CSRF protection state parameter
     * @param {number} timeoutMs - Timeout in milliseconds, default 5 minutes
     * @returns {Promise<OAuthCallbackResult>} Authorization code and state
     */
    async waitForCallback(state: string, timeoutMs: number = 5 * 60 * 1000): Promise<OAuthCallbackResult> {
        this.pendingState = state;

        return new Promise((resolve, reject) => {
            this.resolveCallback = resolve;
            this.rejectCallback = reject;

            // Create HTTP server
            this.server = http.createServer(async (req, res) => {
                await this.handleRequest(req, res);
            });

            // Listen on port
            const host = APP_CONFIG.OAUTH.CALLBACK_HOST;
            const port = APP_CONFIG.OAUTH.CALLBACK_PORT;

            this.server.listen(port, host, () => {
                console.error(`OAuth callback server listening on http://${host}:${port}`);
            });

            // Set timeout
            this.timeoutHandle = setTimeout(() => {
                this.close();
                reject(new Error('Authorization timeout (5 minutes)'));
            }, timeoutMs);

            // Error handling
            this.server.on('error', (error: NodeJS.ErrnoException) => {
                if (error.code === 'EADDRINUSE') {
                    reject(new Error(`Port ${port} is already in use. Please close other applications using this port.`));
                } else {
                    reject(error);
                }
                this.close();
            });
        });
    }

    /**
     * Handle HTTP request
     */
    private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        const url = new URL(req.url || '', `http://${req.headers.host}`);

        // Serve static files
        if (url.pathname.startsWith('/static/')) {
            await this.serveStatic(req, res, url.pathname);
            return;
        }

        // Only handle callback path
        if (url.pathname !== '/callback') {
            this.send404(res);
            return;
        }

        const code = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');
        const error = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');

        // Check for errors
        if (error) {
            const errorMsg = errorDescription || error;
            this.sendErrorPage(res, `Authorization failed: ${errorMsg}`);

            if (this.rejectCallback) {
                this.rejectCallback(new Error(`Authorization failed: ${errorMsg}`));
            }

            this.close();
            return;
        }

        // Validate required parameters
        if (!code || !returnedState) {
            this.sendErrorPage(res, 'Missing required parameters (code or state)');

            if (this.rejectCallback) {
                this.rejectCallback(new Error('Missing code or state parameter'));
            }

            this.close();
            return;
        }

        // Validate state (CSRF protection)
        if (returnedState !== this.pendingState) {
            this.sendErrorPage(res, 'Invalid state parameter (CSRF protection)');

            if (this.rejectCallback) {
                this.rejectCallback(new Error('CSRF validation failed: state mismatch'));
            }

            this.close();
            return;
        }

        // Successfully obtained authorization code
        this.sendSuccessPage(res);

        if (this.resolveCallback) {
            this.resolveCallback({ code, state: returnedState });
        }

        // Delay server close to let user see success page
        setTimeout(() => {
            this.close();
        }, 2000);
    }

    /**
     * Send success page
     */
    private sendSuccessPage(res: http.ServerResponse): void {
        const publicDir = path.join(process.cwd(), 'public');
        const filePath = path.join(publicDir, 'success.html');
        let html: string;
        try {
            html = fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            console.error(`Failed to read ${filePath}:`, error);
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Internal Server Error');
            return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    /**
     * Send error page
     */
    private sendErrorPage(res: http.ServerResponse, errorMessage: string): void {
        const publicDir = path.join(process.cwd(), 'public');
        const filePath = path.join(publicDir, 'error.html');
        let html: string;
        try {
            html = fs.readFileSync(filePath, 'utf8');
            html = html.replace(/{{ERROR_MESSAGE}}/g, escapeHtml(errorMessage));
        } catch (error) {
            console.error(`Failed to read ${filePath}:`, error);
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Internal Server Error');
            return;
        }
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    /**
     * Send 404 page
     */
    private send404(res: http.ServerResponse): void {
        const publicDir = path.join(process.cwd(), 'public');
        const filePath = path.join(publicDir, '404.html');
        let html: string;
        try {
            html = fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            console.error(`Failed to read ${filePath}:`, error);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
            return;
        }
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    /**
     * Serve static files
     */
    private async serveStatic(req: http.IncomingMessage, res: http.ServerResponse, pathname: string): Promise<void> {
        const publicDir = path.join(process.cwd(), 'public');
        const filePath = path.join(publicDir, pathname.slice(1)); // Remove leading '/'

        const ext = path.extname(filePath).toLowerCase();
        let contentType = 'application/octet-stream';

        switch (ext) {
            case '.png':
                contentType = 'image/png';
                break;
            case '.jpg':
            case '.jpeg':
                contentType = 'image/jpeg';
                break;
            case '.gif':
                contentType = 'image/gif';
                break;
            case '.svg':
                contentType = 'image/svg+xml';
                break;
            case '.css':
                contentType = 'text/css; charset=utf-8';
                break;
            case '.js':
                contentType = 'application/javascript';
                break;
            case '.html':
                contentType = 'text/html; charset=utf-8';
                break;
        }

        // Prevent directory traversal attack
        if (filePath.includes('..') || !filePath.startsWith(publicDir)) {
            this.send404(res);
            return;
        }

        try {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath);
                res.writeHead(200, {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=3600'
                });
                res.end(content);
            } else {
                this.send404(res);
            }
        } catch (error) {
            console.error('Static file serve error:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Internal Server Error');
        }
    }

    /**
     * Close server
     */
    close(): void {
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
            this.timeoutHandle = null;
        }

        if (this.server) {
            this.server.close(() => {
                console.error('OAuth callback server closed');
            });
            this.server = null;
        }

        this.pendingState = null;
        this.resolveCallback = null;
        this.rejectCallback = null;
    }
}

/**
 * HTML escape function
 */
function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
}
