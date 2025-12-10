#!/usr/bin/env node

const crypto = require('crypto');

/**
 * Generate random token utility
 * Usage: node scripts/generate-token.js [type] [length]
 * 
 * Types:
 * - jwt: JWT secret key (default, 64 bytes)
 * - api: API key (32 bytes)
 * - session: Session token (32 bytes)
 * - password: Password reset token (32 bytes)
 * - otp: OTP code (6 digits)
 * - custom: Custom length token
 */

const types = {
  jwt: { length: 64, description: 'JWT Secret Key' },
  api: { length: 32, description: 'API Key' },
  session: { length: 32, description: 'Session Token' },
  password: { length: 32, description: 'Password Reset Token' },
  otp: { length: 6, description: 'OTP Code (6 digits)', numeric: true },
  custom: { length: 32, description: 'Custom Token' },
};

function generateToken(type = 'jwt', customLength = null) {
  const config = types[type] || types.custom;
  const length = customLength || config.length;

  if (type === 'otp' || config.numeric) {
    // Generate numeric OTP
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Generate random bytes and convert to base64url
  const bytes = crypto.randomBytes(length);
  return bytes.toString('base64url');
}

function generateHexToken(type = 'jwt', customLength = null) {
  const config = types[type] || types.custom;
  const length = customLength || config.length;

  if (type === 'otp' || config.numeric) {
    return generateToken(type, customLength);
  }

  const bytes = crypto.randomBytes(length);
  return bytes.toString('hex');
}

// Main execution
const args = process.argv.slice(2);
const type = args[0] || 'jwt';
const length = args[1] ? parseInt(args[1]) : null;
const format = args[2] || 'base64url'; // base64url or hex

let token;
if (format === 'hex') {
  token = generateHexToken(type, length);
} else {
  token = generateToken(type, length);
}

const config = types[type] || types.custom;
const description = config.description || `Custom Token (${length || config.length} bytes)`;

console.log('\n' + '='.repeat(60));
console.log(`Token Type: ${description}`);
console.log(`Format: ${format.toUpperCase()}`);
console.log(`Length: ${token.length} characters`);
console.log('='.repeat(60));
console.log('\nToken:');
console.log(token);
console.log('\n' + '='.repeat(60));

// Generate multiple tokens if requested
if (args.includes('--multiple') || args.includes('-m')) {
  const count = parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1] || '5');
  console.log(`\nGenerating ${count} tokens:\n`);
  
  for (let i = 1; i <= count; i++) {
    let multiToken;
    if (format === 'hex') {
      multiToken = generateHexToken(type, length);
    } else {
      multiToken = generateToken(type, length);
    }
    console.log(`${i}. ${multiToken}`);
  }
}

console.log('\nUsage examples:');
console.log('  node scripts/generate-token.js jwt              # JWT secret (default)');
console.log('  node scripts/generate-token.js api             # API key');
console.log('  node scripts/generate-token.js otp             # 6-digit OTP');
console.log('  node scripts/generate-token.js custom 48       # Custom 48-byte token');
console.log('  node scripts/generate-token.js jwt 64 hex      # JWT in hex format');
console.log('  node scripts/generate-token.js api --multiple --count=10  # Generate 10 API keys');
console.log('');

