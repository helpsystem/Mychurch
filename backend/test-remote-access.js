#!/usr/bin/env node

/**
 * 🔍 Test Remote Server Access
 * این اسکریپت دسترسی به سرور remote را تست می‌کند
 */

require('dotenv').config();
const http = require('http');
const https = require('https');

const config = {
  local: `http://localhost:${process.env.PORT || 3001}/api/health`,
  remote: `${process.env.DOMAIN || 'https://samanabyar.online'}/api/health`
};

console.log('🔍 Testing Server Access...\n');

// Test Local
console.log('1️⃣  Testing LOCAL server:');
console.log(`   URL: ${config.local}`);

testEndpoint(config.local, 'local');

// Test Remote (after 2 seconds)
setTimeout(() => {
  console.log('\n2️⃣  Testing REMOTE server:');
  console.log(`   URL: ${config.remote}`);
  testEndpoint(config.remote, 'remote');
}, 2000);

function testEndpoint(url, type) {
  const protocol = url.startsWith('https') ? https : http;
  
  const startTime = Date.now();
  
  protocol.get(url, (res) => {
    const duration = Date.now() - startTime;
    
    console.log(`   Status: ${res.statusCode}`);
    console.log(`   Response Time: ${duration}ms`);
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log(`   ✅ ${type.toUpperCase()} server is healthy!`);
        console.log(`   Response:`, json);
      } catch (e) {
        console.log(`   ⚠️  Response:`, data);
      }
    });
  }).on('error', (err) => {
    console.log(`   ❌ ${type.toUpperCase()} server ERROR:`, err.message);
    if (type === 'local') {
      console.log(`   💡 Tip: Make sure backend server is running with "npm start"`);
    } else {
      console.log(`   💡 Tip: Check if server is deployed and HOST=0.0.0.0 in .env`);
    }
  });
}
