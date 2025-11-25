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
