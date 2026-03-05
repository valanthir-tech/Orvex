/**
 * Credential Encryption Utility
 * 
 * Encrypts/decrypts sensitive data (ERPNext API keys) before storing in Supabase.
 * Uses AES-256-GCM via Node.js crypto module (server-side only).
 */

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error(
            'ENCRYPTION_KEY environment variable is not set. ' +
            'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
        );
    }
    return Buffer.from(key, 'hex');
}

/**
 * Encrypt a plaintext string.
 * Returns a base64-encoded string: iv:authTag:ciphertext
 */
export function encrypt(plaintext: string): string {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:ciphertext (all hex-encoded)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an encrypted string produced by encrypt().
 */
export function decrypt(encryptedData: string): string {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');

    if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, ciphertext] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Encrypt tenant credentials for storage.
 */
export function encryptCredentials(credentials: {
    apiKey: string;
    apiSecret: string;
}): { encryptedApiKey: string; encryptedApiSecret: string } {
    return {
        encryptedApiKey: encrypt(credentials.apiKey),
        encryptedApiSecret: encrypt(credentials.apiSecret),
    };
}

/**
 * Decrypt tenant credentials from storage.
 */
export function decryptCredentials(encrypted: {
    encryptedApiKey: string;
    encryptedApiSecret: string;
}): { apiKey: string; apiSecret: string } {
    return {
        apiKey: decrypt(encrypted.encryptedApiKey),
        apiSecret: decrypt(encrypted.encryptedApiSecret),
    };
}
