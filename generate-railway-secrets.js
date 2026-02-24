#!/usr/bin/env node
/**
 * Generate secure secrets for Railway deployment
 * Run: node generate-railway-secrets.js
 */

const crypto = require('crypto');

console.log('🔐 Generating Secure Secrets for Railway\n');
console.log('Copy these to your Railway Backend environment variables:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// JWT Secret (64 bytes)
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET=' + jwtSecret);

// JWT Refresh Secret (64 bytes)
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_REFRESH_SECRET=' + jwtRefreshSecret);

// Encryption Key (32 bytes = 64 hex chars)
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log('ENCRYPTION_KEY=' + encryptionKey);

// Encryption IV (16 bytes = 32 hex chars)
const encryptionIV = crypto.randomBytes(16).toString('hex');
console.log('ENCRYPTION_IV=' + encryptionIV);

// Session Secret (64 bytes)
const sessionSecret = crypto.randomBytes(64).toString('hex');
console.log('SESSION_SECRET=' + sessionSecret);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('⚠️  Keep these secrets secure and never commit them to git!\n');
