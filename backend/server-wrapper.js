#!/usr/bin/env node

/**
 * PM2 Wrapper Script for Production Server
 * This script explicitly loads .env file before starting the server
 * to ensure all environment variables are available
 */

const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables from root .env file
const envPath = path.resolve(__dirname, '../.env');

if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found at:', envPath);
    process.exit(1);
}

console.log('🔧 Loading environment from:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('❌ Failed to load .env file:', result.error);
    process.exit(1);
}

// Verify critical environment variables
const criticalVars = ['DATABASE_URL', 'JWT_SECRET'];
const missing = criticalVars.filter(v => !process.env[v]);

if (missing.length > 0) {
    console.error('❌ Missing critical environment variables:', missing.join(', '));
    process.exit(1);
}

console.log('✅ Environment variables loaded successfully');
console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL.substring(0, 20) + '...');
console.log('🚀 Starting production server...\n');

// Now require and start the actual server
require('./server.js');
