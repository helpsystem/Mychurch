/**
 * Complete API Test Suite for Bible AI Chat
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001';

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealthCheck() {
  log('\n📋 Test 1: Health Check', 'cyan');
  try {
    const response = await axios.get(`${API_URL}/api/health`);
    log(`   ✅ Server is healthy`, 'green');
    log(`   Uptime: ${response.data.uptime}s`, 'blue');
    return true;
  } catch (error) {
    log(`   ❌ Health check failed: ${error.message}`, 'red');
    return false;
  }
}

async function testBibleBooks() {
  log('\n📋 Test 2: Get Bible Books', 'cyan');
  try {
    const response = await axios.get(`${API_URL}/api/bible/books`);
    log(`   ✅ Retrieved ${response.data.length} books`, 'green');
    if (response.data.length > 0) {
      log(`   Sample: ${response.data[0].name_fa} (${response.data[0].code})`, 'blue');
    }
    return true;
  } catch (error) {
    log(`   ❌ Failed: ${error.message}`, 'red');
    return false;
  }
}

async function testDailyVerse() {
  log('\n📋 Test 3: Get Daily Verse', 'cyan');
  try {
    const response = await axios.get(`${API_URL}/api/ai-chat/daily-verse?language=fa`);
    log(`   ✅ Daily verse retrieved`, 'green');
    log(`   Reference: ${response.data.reference}`, 'blue');
    log(`   Text: ${response.data.text.substring(0, 80)}...`, 'blue');
    return true;
  } catch (error) {
    log(`   ❌ Failed: ${error.message}`, 'red');
    return false;
  }
}

async function testSearchVerses() {
  log('\n📋 Test 4: Search Verses (محبت)', 'cyan');
  try {
    const response = await axios.post(`${API_URL}/api/ai-chat/search`, {
      query: 'محبت',
      language: 'fa',
      limit: 3
    });
    log(`   ✅ Found ${response.data.verses.length} verses`, 'green');
    if (response.data.verses.length > 0) {
      const v = response.data.verses[0];
      log(`   Sample: ${v.book_name} ${v.chapter_number}:${v.verse_number}`, 'blue');
    }
    return true;
  } catch (error) {
    log(`   ❌ Failed: ${error.message}`, 'red');
    return false;
  }
}

async function testGetVerse() {
  log('\n📋 Test 5: Get Verse by Reference (یوحنا 3:16)', 'cyan');
  try {
    const response = await axios.get(`${API_URL}/api/ai-chat/verse/یوحنا 3:16?language=fa`);
    log(`   ✅ Verse retrieved`, 'green');
    log(`   Reference: ${response.data.reference}`, 'blue');
    log(`   Text: ${response.data.text.substring(0, 80)}...`, 'blue');
    return true;
  } catch (error) {
    log(`   ❌ Failed: ${error.message}`, 'red');
    return false;
  }
}

async function testAIChat() {
  log('\n📋 Test 6: AI Chat - "چگونه می‌توانم آرامش پیدا کنم؟"', 'cyan');
  try {
    const response = await axios.post(`${API_URL}/api/ai-chat/ask`, {
      question: 'چگونه می‌توانم آرامش پیدا کنم؟',
      language: 'fa'
    });
    log(`   ✅ AI response generated`, 'green');
    log(`   Answer: ${response.data.answer}`, 'blue');
    log(`   Verses provided: ${response.data.verses.length}`, 'blue');
    if (response.data.verses.length > 0) {
      log(`   Sample verse: ${response.data.verses[0].reference}`, 'blue');
    }
    return true;
  } catch (error) {
    log(`   ❌ Failed: ${error.message}`, 'red');
    return false;
  }
}

async function testVerseContext() {
  log('\n📋 Test 7: Get Verse Context (JHN 3:16)', 'cyan');
  try {
    const response = await axios.get(`${API_URL}/api/ai-chat/context/JHN/3/16?contextSize=2`);
    log(`   ✅ Context retrieved`, 'green');
    log(`   Verses in context: ${response.data.verses.length}`, 'blue');
    return true;
  } catch (error) {
    log(`   ❌ Failed: ${error.message}`, 'red');
    return false;
  }
}

async function testCrossReferences() {
  log('\n📋 Test 8: Get Cross References', 'cyan');
  try {
    const response = await axios.post(`${API_URL}/api/ai-chat/cross-references`, {
      keywords: ['محبت', 'عشق'],
      language: 'fa',
      limit: 3
    });
    log(`   ✅ Cross-references found`, 'green');
    log(`   Count: ${response.data.verses.length}`, 'blue');
    return true;
  } catch (error) {
    log(`   ❌ Failed: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n🧪 ===================================', 'yellow');
  log('🧪 Bible AI Chat - Complete API Tests', 'yellow');
  log('🧪 ===================================\n', 'yellow');
  
  const results = [];
  
  results.push(await testHealthCheck());
  results.push(await testBibleBooks());
  results.push(await testDailyVerse());
  results.push(await testSearchVerses());
  results.push(await testGetVerse());
  results.push(await testAIChat());
  results.push(await testVerseContext());
  results.push(await testCrossReferences());
  
  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  
  log('\n📊 ===================================', 'yellow');
  log(`📊 Test Results: ${passed}/${results.length} passed`, passed === results.length ? 'green' : 'yellow');
  log('📊 ===================================\n', 'yellow');
  
  if (passed === results.length) {
    log('🎉 All tests passed! ✅', 'green');
    process.exit(0);
  } else {
    log(`⚠️  ${failed} test(s) failed`, 'red');
    process.exit(1);
  }
}

// Wait a bit for server to start
setTimeout(runAllTests, 2000);
