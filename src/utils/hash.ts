/**
 * Hash Utility Module
 * 
 * Provides cryptographic hashing functions for security purposes
 */

import * as crypto from 'crypto';

/**
 * Generate SHA-256 hash of a string
 * 
 * @param {string} input - Input string to hash
 * @returns {string} Hexadecimal hash string
 */
export function sha256(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Generate truncated SHA-256 hash (first 16 characters)
 * Useful for shorter identifiers while maintaining security
 * 
 * @param {string} input - Input string to hash
 * @returns {string} Truncated hexadecimal hash string (16 chars)
 */
export function sha256Short(input: string): string {
    return sha256(input).substring(0, 16);
}
