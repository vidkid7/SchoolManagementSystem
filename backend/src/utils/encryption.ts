import crypto from 'crypto';
import { env } from '@config/env';

/**
 * Encryption Utilities
 * For encrypting sensitive data like citizenship numbers
 */

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const ENCRYPTION_KEY = Buffer.from(env.ENCRYPTION_KEY, 'hex');

/**
 * Encrypt sensitive text
 */
export const encrypt = (text: string): string => {
  if (!text) return '';
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    throw new Error('Encryption failed');
  }
};

/**
 * Decrypt sensitive text
 */
export const decrypt = (encryptedText: string): string => {
  if (!encryptedText) return '';
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed');
  }
};

/**
 * Mask sensitive data for display
 */
export const maskSensitiveData = (data: string, type: 'phone' | 'email' | 'citizenship'): string => {
  if (!data) return '';
  
  switch (type) {
    case 'phone':
      // Show last 4 digits: ****6789
      return '*'.repeat(Math.max(0, data.length - 4)) + data.slice(-4);
      
    case 'email': {
      // Show first 2 and domain: jo***@email.com
      const [local, domain] = data.split('@');
      if (!domain) return data;
      return local.slice(0, 2) + '***@' + domain;
    }
      
    case 'citizenship':
      // Show only last 4: ****-****-1234
      return '****-****-' + data.slice(-4);
      
    default:
      return '***HIDDEN***';
  }
};

/**
 * Generate random token
 */
export const generateToken = (length = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash data (one-way, for verification purposes)
 */
export const hashData = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

export default {
  encrypt,
  decrypt,
  maskSensitiveData,
  generateToken,
  hashData
};
