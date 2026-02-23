import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Environment Configuration Validation
 * Ensures all required environment variables are present
 */

interface EnvConfig {
  // Application
  NODE_ENV: string;
  PORT: number;
  API_BASE_URL: string;
  FRONTEND_URL: string;

  // Database
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;

  // Redis
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;

  // Security
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRY: string;
  JWT_REFRESH_EXPIRY: string;
  ENCRYPTION_KEY: string;
  SESSION_SECRET: string;

  // School Configuration
  DEFAULT_SCHOOL_CODE: string;
  DEFAULT_SCHOOL_NAME: string;
  DEFAULT_SCHOOL_NAME_NP: string;
  SCHOOL_NAME?: string;
  SCHOOL_ADDRESS?: string;
  PRINCIPAL_NAME?: string;

  // Feature Flags
  ENABLE_MULTI_SCHOOL: boolean;
  ENABLE_OFFLINE_MODE: boolean;
  ENABLE_SMS_NOTIFICATIONS: boolean;
  ENABLE_EMAIL_NOTIFICATIONS: boolean;
  ENABLE_PAYMENT_GATEWAY: boolean;

  // Backup Configuration
  BACKUP_ENABLED: boolean;
  BACKUP_SCHEDULE: string;
  BACKUP_RETENTION_DAYS: number;
  BACKUP_PATH: string;
  BACKUP_EXTERNAL_PATH?: string;
  BACKUP_COMPRESSION: boolean;
  BACKUP_ON_STARTUP: boolean;

  // CORS
  ALLOWED_ORIGINS: string[];

  // Payment Gateways
  esewa: {
    merchantId: string;
    merchantSecret: string;
    baseUrl: string;
  };
  khalti: {
    publicKey: string;
    secretKey: string;
    baseUrl: string;
  };
  imePay: {
    merchantCode: string;
    username: string;
    password: string;
    baseUrl: string;
  };

  // SMS Gateway (Sparrow SMS)
  sparrowSms: {
    token: string;
    senderId: string;
    baseUrl: string;
  };
}

const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'ENCRYPTION_KEY',
  'SESSION_SECRET'
];

/**
 * Validate required environment variables
 */
export const validateEnv = (): void => {
  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please copy .env.example to .env and configure all required variables.'
    );
  }

  // Validate key lengths
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
  }

  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)');
  }
};

/**
 * Parse boolean environment variable
 */
const parseBoolean = (value: string | undefined, defaultValue = false): boolean => {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

/**
 * Parse array from comma-separated string
 */
const parseArray = (value: string | undefined, defaultValue: string[] = []): string[] => {
  if (!value) return defaultValue;
  return value.split(',').map(item => item.trim());
};

/**
 * Environment configuration object
 */
export const env: EnvConfig = {
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000'),
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306'),
  DB_NAME: process.env.DB_NAME || 'school_management_system',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379'),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,

  // Security
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '30m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
  SESSION_SECRET: process.env.SESSION_SECRET || '',

  // School Configuration
  DEFAULT_SCHOOL_CODE: process.env.DEFAULT_SCHOOL_CODE || 'SCH001',
  DEFAULT_SCHOOL_NAME: process.env.DEFAULT_SCHOOL_NAME || 'School Management System',
  DEFAULT_SCHOOL_NAME_NP: process.env.DEFAULT_SCHOOL_NAME_NP || 'विद्यालय व्यवस्थापन प्रणाली',
  SCHOOL_NAME: process.env.SCHOOL_NAME || process.env.DEFAULT_SCHOOL_NAME || 'School Management System',
  SCHOOL_ADDRESS: process.env.SCHOOL_ADDRESS || 'School Address',
  PRINCIPAL_NAME: process.env.PRINCIPAL_NAME,

  // Feature Flags
  ENABLE_MULTI_SCHOOL: parseBoolean(process.env.ENABLE_MULTI_SCHOOL),
  ENABLE_OFFLINE_MODE: parseBoolean(process.env.ENABLE_OFFLINE_MODE, true),
  ENABLE_SMS_NOTIFICATIONS: parseBoolean(process.env.ENABLE_SMS_NOTIFICATIONS, true),
  ENABLE_EMAIL_NOTIFICATIONS: parseBoolean(process.env.ENABLE_EMAIL_NOTIFICATIONS, true),
  ENABLE_PAYMENT_GATEWAY: parseBoolean(process.env.ENABLE_PAYMENT_GATEWAY, true),

  // Backup Configuration
  BACKUP_ENABLED: parseBoolean(process.env.BACKUP_ENABLED, true),
  BACKUP_SCHEDULE: process.env.BACKUP_SCHEDULE || '0 2 * * *',
  BACKUP_RETENTION_DAYS: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
  BACKUP_PATH: process.env.BACKUP_PATH || path.join(__dirname, '../../backups'),
  BACKUP_EXTERNAL_PATH: process.env.BACKUP_EXTERNAL_PATH,
  BACKUP_COMPRESSION: parseBoolean(process.env.BACKUP_COMPRESSION, true),
  BACKUP_ON_STARTUP: parseBoolean(process.env.BACKUP_ON_STARTUP, false),

  // CORS
  ALLOWED_ORIGINS: parseArray(process.env.ALLOWED_ORIGINS, ['http://localhost:3000']),

  // Payment Gateways
  esewa: {
    merchantId: process.env.ESEWA_MERCHANT_ID || '',
    merchantSecret: process.env.ESEWA_MERCHANT_SECRET || '',
    baseUrl: process.env.ESEWA_BASE_URL || 'https://esewa.com.np/epay/main',
  },
  khalti: {
    publicKey: process.env.KHALTI_PUBLIC_KEY || '',
    secretKey: process.env.KHALTI_SECRET_KEY || '',
    baseUrl: process.env.KHALTI_BASE_URL || 'https://a.khalti.com/api/payment/',
  },
  imePay: {
    merchantCode: process.env.IMEPAY_MERCHANT_CODE || '',
    username: process.env.IMEPAY_USERNAME || '',
    password: process.env.IMEPAY_PASSWORD || '',
    baseUrl: process.env.IMEPAY_BASE_URL || 'https://dev.imepay.com.np:7979/api/WebLogin/Decrypt',
  },

  // SMS Gateway (Sparrow SMS)
  sparrowSms: {
    token: process.env.SPARROW_SMS_TOKEN || '',
    senderId: process.env.SPARROW_SMS_SENDER_ID || 'DEMO',
    baseUrl: process.env.SPARROW_SMS_BASE_URL || 'https://api.sparrowsms.com',
  }
};

export default env;
