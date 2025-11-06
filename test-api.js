#!/usr/bin/env node

/**
 * MyChurch API Test Script
 * =======================
 * This script tests all critical API endpoints to ensure everything is working correctly.
 * Run with: node test-api.js
 */

const axios = require('axios');
const chalk = require('chalk');

// Configuration
const BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001';
const ADMIN_EMAIL = 'admin@mychurch.com';
const ADMIN_PASSWORD = 'MyChurchSecureAdmin2024!';

let authToken = '';

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: 0
};

// Helper functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString();
  switch (type) {
    case 'success':
      console.log(chalk.green(`✅ [${timestamp}] ${message}`));
      break;
    case 'error':
      console.log(chalk.red(`❌ [${timestamp}] ${message}`));
      break;
    case 'warning':
      console.log(chalk.yellow(`⚠️  [${timestamp}] ${message}`));
      break;
    default:
      console.log(chalk.blue(`ℹ️  [${timestamp}] ${message}`));
  }
};

const testEndpoint = async (name, method, url, data = null, headers = {}) => {
  results.total++;
  
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    
    // Check for successful status code
    if (response.status >= 200 && response.status < 300) {
      results.passed++;
      log(`${name}: PASSED (${response.status})`, 'success');
      return response.data;
    } else {
      results.failed++;
      log(`${name}: FAILED (${response.status}) - ${response.data.message || 'Unknown error'}`, 'error');
      return null;
    }
  } catch (error) {
    results.failed++;
    const message = error.response ? 
      `${error.response.status} - ${error.response.data.message || 'Unknown error'}` : 
      error.message;
    log(`${name}: FAILED - ${message}`, 'error');
    return null;
  }
};

const testWithAuth = async (name, method, url, data = null) => {
  if (!authToken) {
    log('Authentication token not available', 'error');
    return null;
  }
  
  return testEndpoint(name, method, url, data, {
    'Authorization': `Bearer ${authToken}`
  });
};

// Test suites
const runHealthChecks = async () => {
  log('Running Health Checks...', 'info');
  
  await testEndpoint('Health Check', 'GET', '/api/health');
  await testEndpoint('Database Status', 'GET', '/api/database/status');
  await testEndpoint('API Status', 'GET', '/api/status');
  
  log('Health checks completed', 'info');
};

const runAuthenticationTests = async () => {
  log('Running Authentication Tests...', 'info');
  
  // Login
  const loginData = await testEndpoint(
    'Admin Login', 
    'POST', 
    '/api/auth/login', 
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
  );
  
  if (loginData && loginData.token) {
    authToken = loginData.token;
    log('Authentication successful', 'success');
    
    // Test protected endpoint
    await testWithAuth('Protected Endpoint Test', 'GET', '/api/user/profile');
    
    // Test logout
    await testWithAuth('Logout', 'POST', '/api/auth/logout');
  } else {
    log('Authentication failed', 'error');
  }
  
  log('Authentication tests completed', 'info');
};

const runBibleTests = async () => {
  log('Running Bible Tests...', 'info');
  
  await testWithAuth('Get Books', 'GET', '/api/bible/books?limit=5');
  await testWithAuth('Get Verses', 'GET', '/api/bible/verses?book=1&chapter=1&verse=1');
  await testWithAuth('Search Bible', 'GET', '/api/bible/search?q=love');
  await testWithAuth('Get Daily Verse', 'GET', '/api/bible/daily-verse');
  
  log('Bible tests completed', 'info');
};

const runMediaTests = async () => {
  log('Running Media Tests...', 'info');
  
  await testWithAuth('Get Media Categories', 'GET', '/api/media/categories');
  await testWithAuth('Get Media Files', 'GET', '/api/media/files');
  await testWithAuth('Upload Test', 'POST', '/api/upload/test');
  
  log('Media tests completed', 'info');
};

const runTTSTests = async () => {
  log('Running TTS Tests...', 'info');
  
  await testWithAuth('TTS Generate', 'POST', '/api/tts/generate', {
    text: 'در ابتدا کلام بود و کلام نزد خدا بود',
    language: 'fa'
  });
  
  await testWithAuth('TTS Voices', 'GET', '/api/tts/voices');
  await testWithAuth('TTS Settings', 'GET', '/api/tts/settings');
  
  log('TTS tests completed', 'info');
};

const runAdminTests = async () => {
  log('Running Admin Tests...', 'info');
  
  await testWithAuth('Admin Dashboard', 'GET', '/api/admin/dashboard');
  await testWithAuth('Get Users', 'GET', '/api/admin/users');
  await testWithAuth('Get System Stats', 'GET', '/api/admin/stats');
  
  log('Admin tests completed', 'info');
};

// Main test runner
const runAllTests = async () => {
  log('Starting MyChurch API Tests...', 'info');
  log(`Base URL: ${BASE_URL}`, 'info');
  log(`Admin Email: ${ADMIN_EMAIL}`, 'info');
  
  try {
    // Run all test suites
    await runHealthChecks();
    await runAuthenticationTests();
    await runBibleTests();
    await runMediaTests();
    await runTTSTests();
    await runAdminTests();
    
    // Print final results
    log('\n' + '='.repeat(50), 'info');
    log('Test Results Summary', 'info');
    log('='.repeat(50), 'info');
    log(`Total Tests: ${results.total}`, 'info');
    log(`Passed: ${chalk.green(results.passed)}`, 'success');
    log(`Failed: ${chalk.red(results.failed)}`, 'error');
    
    const successRate = ((results.passed / results.total) * 100).toFixed(1);
    log(`Success Rate: ${successRate}%`, successRate >= 90 ? 'success' : 'warning');
    
    if (results.failed === 0) {
      log('\n🎉 All tests passed! The system is ready for production!', 'success');
    } else {
      log(`\n⚠️  ${results.failed} test(s) failed. Please check the issues above.`, 'warning');
    }
    
    process.exit(results.failed === 0 ? 0 : 1);
    
  } catch (error) {
    log(`Test runner failed: ${error.message}`, 'error');
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
  process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, testEndpoint, testWithAuth };