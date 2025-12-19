// Test script for Admin Panel functionality
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Admin Panel functionality...\n');

// Test 1: Check if AdminSyncManagementPage exists
console.log('✅ Test 1: Checking AdminSyncManagementPage component');
try {
  const adminPagePath = path.join(__dirname, 'pages', 'AdminSyncManagementPage.tsx');
  if (fs.existsSync(adminPagePath)) {
    const adminPageContent = fs.readFileSync(adminPagePath, 'utf8');
    
    // Check for key components
    const hasAuthCheck = adminPageContent.includes('useAuth') && adminPageContent.includes('isAdmin');
    const hasWorshipProcessing = adminPageContent.includes('handleProcessWorshipSong');
    const hasBatchProcessing = adminPageContent.includes('handleBatchProcess');
    const hasUpload = adminPageContent.includes('handleUploadNewSong');
    
    console.log(`  - Authentication check: ${hasAuthCheck ? '✅' : '❌'}`);
    console.log(`  - Worship song processing: ${hasWorshipProcessing ? '✅' : '❌'}`);
    console.log(`  - Batch processing: ${hasBatchProcessing ? '✅' : '❌'}`);
    console.log(`  - Upload functionality: ${hasUpload ? '✅' : '❌'}`);
  } else {
    console.log('  ❌ AdminSyncManagementPage.tsx not found');
  }
} catch (error) {
  console.log(`  ❌ Error reading AdminSyncManagementPage: ${error.message}`);
}

// Test 2: Check if audio sync routes exist
console.log('\n✅ Test 2: Checking audio sync API routes');
try {
  const routesPath = path.join(__dirname, 'backend', 'routes', 'audioSyncRoutes.js');
  if (fs.existsSync(routesPath)) {
    const routesContent = fs.readFileSync(routesPath, 'utf8');
    
    const hasWorshipProcess = routesContent.includes('process-worship');
    const hasBibleProcess = routesContent.includes('process-bible');
    const hasBatchEndpoints = routesContent.includes('process-batch');
    
    console.log(`  - Worship processing endpoint: ${hasWorshipProcess ? '✅' : '❌'}`);
    console.log(`  - Bible processing endpoint: ${hasBibleProcess ? '✅' : '❌'}`);
    console.log(`  - Batch processing endpoints: ${hasBatchEndpoints ? '✅' : '❌'}`);
  } else {
    console.log('  ❌ audioSyncRoutes.js not found');
  }
} catch (error) {
  console.log(`  ❌ Error reading audioSyncRoutes.js: ${error.message}`);
}

// Test 3: Check database schema
console.log('\n✅ Test 3: Checking database schema');
try {
  const schemaPath = path.join(__dirname, 'backend', 'migrations', 'complete_audio_sync_schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    const hasWorshipTable = schemaContent.includes('worship_songs');
    const hasTimingTable = schemaContent.includes('bible_audio_timing');
    const hasTimingColumns = schemaContent.includes('has_timing') || schemaContent.includes('hasTiming');
    const hasTimingData = schemaContent.includes('timing_data');
    
    console.log(`  - Worship songs table: ${hasWorshipTable ? '✅' : '❌'}`);
    console.log(`  - Bible timing table: ${hasTimingTable ? '✅' : '❌'}`);
    console.log(`  - Timing columns: ${hasTimingColumns ? '✅' : '❌'}`);
    console.log(`  - Timing data storage: ${hasTimingData ? '✅' : '❌'}`);
  } else {
    console.log('  ❌ complete_audio_sync_schema.sql not found');
  }
} catch (error) {
  console.log(`  ❌ Error reading schema file: ${error.message}`);
}

// Test 4: Check authentication configuration
console.log('\n✅ Test 4: Checking authentication configuration');
try {
  const authPath = path.join(__dirname, 'lib', 'auth.ts');
  if (fs.existsSync(authPath)) {
    const authContent = fs.readFileSync(authPath, 'utf8');
    
    const hasAdminLogin = authContent.includes('adminLogin');
    const hasUserFetch = authContent.includes('fetchCurrentUser');
    const hasTokenManager = authContent.includes('getAuthToken');
    
    console.log(`  - Admin login function: ${hasAdminLogin ? '✅' : '❌'}`);
    console.log(`  - User fetch function: ${hasUserFetch ? '✅' : '❌'}`);
    console.log(`  - Token manager integration: ${hasTokenManager ? '✅' : '❌'}`);
  } else {
    console.log('  ❌ auth.ts not found');
  }
} catch (error) {
  console.log(`  ❌ Error reading auth.ts: ${error.message}`);
}

// Test 5: Check API configuration
console.log('\n✅ Test 5: Checking API configuration');
try {
  const axiosPath = path.join(__dirname, 'lib', 'axios.ts');
  if (fs.existsSync(axiosPath)) {
    const axiosContent = fs.readFileSync(axiosPath, 'utf8');
    
    const hasBaseURL = axiosContent.includes('baseURL');
    const hasAuthHeader = axiosContent.includes('Authorization');
    const hasContentType = axiosContent.includes('Content-Type');
    
    console.log(`  - Base URL configured: ${hasBaseURL ? '✅' : '❌'}`);
    console.log(`  - Authorization header: ${hasAuthHeader ? '✅' : '❌'}`);
    console.log(`  - Content-Type handling: ${hasContentType ? '✅' : '❌'}`);
  } else {
    console.log('  ❌ axios.ts not found');
  }
} catch (error) {
  console.log(`  ❌ Error reading axios.ts: ${error.message}`);
}

console.log('\n🎯 Manual Testing Instructions:');
console.log('1. Open https://samanabyar.online/#/admin/sync-management');
console.log('2. Use credentials: help.system@ymail.com / Samyar@1989');
console.log('3. Clear cache with Ctrl+Shift+R');
console.log('4. Test single song processing');
console.log('5. Test batch processing');
console.log('6. Verify output format includes timing_data, chords, and structure');

console.log('\n📋 Expected Output Format:');
console.log('```json');
console.log('{');
console.log('  "timing_data": [');
console.log('    {"word": "خدایا", "startTime": 0.5, "endTime": 1.2}');
console.log('  ],');
console.log('  "chords": [');
console.log('    {"time": 0.0, "chord": "C"}');
console.log('  ],');
console.log('  "structure": {');
console.log('    "intro": {"start": 0, "end": 5},');
console.log('    "verse1": {"start": 5, "end": 20}');
console.log('  }');
console.log('}');
console.log('```');