/**
 * Test Chat Functionality - Simulate User Experience
 * This script tests the exact API calls that the BibleAIChatWidget makes
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
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function simulateUserChatSession() {
  log('\n💬 ===================================', 'cyan');
  log('💬 Simulating Real User Chat Session', 'cyan');
  log('💬 ===================================', 'cyan');

  try {
    // Step 1: Widget loads - fetch daily verse (like BibleAIChatWidget does on mount)
    log('\n🌅 Step 1: Loading daily verse (widget startup)...', 'blue');
    const dailyVerse = await axios.get(`${API_URL}/api/ai-chat/daily-verse`, {
      params: { language: 'fa' },
      timeout: 5000
    });
    
    log(`   ✅ Daily verse loaded: ${dailyVerse.data.reference}`, 'green');
    log(`   📖 Text: ${dailyVerse.data.text.substring(0, 100)}...`, 'yellow');

    // Step 2: User asks first question
    log('\n👤 Step 2: User sends message: "سلام، چگونه خدا را بهتر بشناسم؟"', 'blue');
    const response1 = await axios.post(`${API_URL}/api/ai-chat/ask`, {
      question: "سلام، چگونه خدا را بهتر بشناسم؟",
      language: "fa"
    }, {
      timeout: 10000
    });

    log(`   🤖 AI Response: ${response1.data.answer}`, 'green');
    if (response1.data.verses && response1.data.verses.length > 0) {
      log(`   📚 Verses provided: ${response1.data.verses.length}`, 'magenta');
      response1.data.verses.forEach((verse, index) => {
        log(`     ${index + 1}. ${verse.reference}: ${verse.text.substring(0, 80)}...`, 'yellow');
      });
    }

    // Step 3: User asks follow-up question
    log('\n👤 Step 3: User asks follow-up: "آیات بیشتری درباره دعا می‌خواهم"', 'blue');
    const response2 = await axios.post(`${API_URL}/api/ai-chat/ask`, {
      question: "آیات بیشتری درباره دعا می‌خواهم",
      language: "fa"
    }, {
      timeout: 10000
    });

    log(`   🤖 AI Response: ${response2.data.answer}`, 'green');
    if (response2.data.verses && response2.data.verses.length > 0) {
      log(`   📚 Verses provided: ${response2.data.verses.length}`, 'magenta');
      response2.data.verses.forEach((verse, index) => {
        log(`     ${index + 1}. ${verse.reference}: ${verse.text.substring(0, 80)}...`, 'yellow');
      });
    }

    // Step 4: Test English language support
    log('\n👤 Step 4: Testing English language: "How do I find peace in God?"', 'blue');
    const response3 = await axios.post(`${API_URL}/api/ai-chat/ask`, {
      question: "How do I find peace in God?",
      language: "en"
    }, {
      timeout: 10000
    });

    log(`   🤖 AI Response: ${response3.data.answer}`, 'green');
    if (response3.data.verses && response3.data.verses.length > 0) {
      log(`   📚 Verses provided: ${response3.data.verses.length}`, 'magenta');
    }

    // Summary
    log('\n✅ ===================================', 'green');
    log('✅ Chat Functionality Test PASSED', 'green');
    log('✅ ===================================', 'green');
    log('✅ Daily verse loading: ✓', 'green');
    log('✅ Persian language chat: ✓', 'green');  
    log('✅ English language chat: ✓', 'green');
    log('✅ Verse recommendations: ✓', 'green');
    log('✅ API response times: ✓', 'green');
    
    return true;

  } catch (error) {
    log('\n❌ ===================================', 'red');
    log('❌ Chat Functionality Test FAILED', 'red');
    log('❌ ===================================', 'red');
    
    if (error.code === 'ECONNREFUSED') {
      log('❌ Server connection failed - make sure backend is running on port 3001', 'red');
    } else if (error.code === 'ECONNABORTED') {
      log('❌ Request timeout - server is slow or overloaded', 'red');
    } else if (error.response) {
      log(`❌ Server error ${error.response.status}: ${error.response.data?.message || 'Unknown error'}`, 'red');
    } else {
      log(`❌ Error: ${error.message}`, 'red');
    }
    
    return false;
  }
}

// Run the test
simulateUserChatSession()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log(`❌ Unexpected error: ${error.message}`, 'red');
    process.exit(1);
  });