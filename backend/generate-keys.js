#!/usr/bin/env node

/**
 * Generate secure keys for Railway deployment
 * Run: node generate-keys.js
 */

const crypto = require('crypto');

console.log('\n🔐 Generating Secure Keys for Railway Deployment\n');
console.log('Copy these values to your Railway environment variables:\n');
console.log('─'.repeat(70));

// JWT Secret (64 characters)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('\nJWT_SECRET=');
console.log(jwtSecret);

// JWT Refresh Secret (64 characters)
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');
console.log('\nJWT_REFRESH_SECRET=');
console.log(jwtRefreshSecret);

// Encryption Key (64 characters for 32 bytes)
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log('\nENCRYPTION_KEY=');
console.log(encryptionKey);

// Encryption IV (32 characters for 16 bytes)
const encryptionIV = crypto.randomBytes(16).toString('hex');
console.log('\nENCRYPTION_IV=');
console.log(encryptionIV);

// Session Secret (64 characters)
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('\nSESSION_SECRET=');
console.log(sessionSecret);

console.log('\n' + '─'.repeat(70));
console.log('\n✅ Keys generated successfully!');
console.log('\n⚠️  IMPORTANT: Keep these keys secure and never commit them to git!\n');
