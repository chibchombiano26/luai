#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Test script to validate Insurance API connectivity
 * Usage: node test-api.js
 */

const fs = require('fs');
const path = require('path');

// Load .env manually
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !match[1].startsWith('#')) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const axios = require('axios');
const https = require('https');

const enableNetworkProbe = process.env.ENABLE_TEST_API_NETWORK === '1';

if (!enableNetworkProbe) {
  console.log('test-api.js is disabled by default to avoid external API calls.');
  console.log('Set ENABLE_TEST_API_NETWORK=1 to run the connectivity checks.');
  process.exit(0);
}

console.log('🧪 Testing Insurance API Connectivity\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Check environment variables
console.log('📋 Environment Variables:\n');
const requiredEnvVars = [
  'PREVISORA_USERNAME',
  'PREVISORA_PASSWORD',
  'PREVISORA_API_URL',
];

const optionalEnvVars = [
  'PREVISORA_SESSION_COOKIE',
  'PDF_RECIPIENT_EMAILS',
];

let allRequiredPresent = true;

console.log('Required:');
requiredEnvVars.forEach((varName) => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const displayValue = value ? value.substring(0, 20) + '...' : 'NOT SET';
  console.log(`  ${status} ${varName}: ${displayValue}`);
  if (!value) allRequiredPresent = false;
});

console.log('\nOptional:');
optionalEnvVars.forEach((varName) => {
  const value = process.env[varName];
  const status = value ? '✅' : '⚠️ ';
  const displayValue = value ? value.substring(0, 20) + '...' : 'NOT SET';
  console.log(`  ${status} ${varName}: ${displayValue}`);
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!allRequiredPresent) {
  console.error('❌ Missing required environment variables. Cannot proceed.\n');
  process.exit(1);
}

// Test API connectivity
(async () => {
  try {
    console.log('🔄 Testing API Connectivity...\n');

    const baseURL = process.env.PREVISORA_API_URL;
    const sessionCookie = process.env.PREVISORA_SESSION_COOKIE;

    // Test 1: Simple connectivity
    console.log('Test 1️⃣  - API Base URL:');
    console.log(`  URL: ${baseURL}`);
    console.log(`  Status: ${baseURL ? '✅ Configured' : '❌ Not configured'}\n`);

    // Test 2: Check if API is reachable
    console.log('Test 2️⃣  - Attempt to reach API:');
    try {
      const response = await axios.head(baseURL, {
        timeout: 5000,
        httpsAgent: new https.Agent({
          rejectUnauthorized: true,
        }),
      });
      console.log(`  ✅ API is reachable (Status: ${response.status})\n`);
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.log(`  ❌ Cannot reach API: ${error.message}\n`);
        process.exit(1);
      } else if (error.response && error.response.status) {
        console.log(
          `  ✅ API is reachable (Status: ${error.response.status})\n`
        );
      } else {
        console.log(`  ⚠️  Got response: ${error.message}\n`);
      }
    }

    // Test 3: SSL/TLS validation
    console.log('Test 3️⃣  - SSL/TLS Certificate Validation:');
    console.log('  ✅ Secure validation ENABLED (rejectUnauthorized: true)\n');

    // Test 4: Session Cookie
    console.log('Test 4️⃣  - Session Cookie:');
    if (sessionCookie) {
      console.log(
        `  ✅ Cookie configured: cookiesession1=${sessionCookie.substring(0, 10)}...\n`
      );
    } else {
      console.log(`  ⚠️  No session cookie - PDF endpoints may not work\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ API Configuration: OK\n');
    console.log('Next steps:');
    console.log('1. Restart dev server: npm run dev');
    console.log('2. Try making a quote request\n');
  } catch (error) {
    console.error('❌ Error:', error.message, '\n');
    process.exit(1);
  }
})();
