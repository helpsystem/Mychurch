/**
 * Simple test for Hugging Face TTS API
 */

const axios = require('axios');

async function testAPI() {
  console.log('🧪 Testing Hugging Face TTS API...\n');
  
  // Test 1: Health check
  console.log('1️⃣ Testing health endpoint...');
  try {
    const healthRes = await axios.get('http://localhost:3001/api/tts/huggingface/health');
    console.log('✅ Health check:', healthRes.data);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.status, error.response.data);
    }
  }
  
  console.log('\n2️⃣ Testing models endpoint...');
  try {
    const modelsRes = await axios.get('http://localhost:3001/api/tts/huggingface/models');
    console.log('✅ Available models:', JSON.stringify(modelsRes.data, null, 2));
  } catch (error) {
    console.error('❌ Models endpoint failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.status, error.response.data);
    }
  }
  
  console.log('\n3️⃣ Testing synthesize endpoint...');
  try {
    const synthesizeRes = await axios.post('http://localhost:3001/api/tts/huggingface/synthesize', {
      text: 'سلام',
      voice: 'female'
    });
    console.log('✅ Synthesis result:', synthesizeRes.data);
  } catch (error) {
    console.error('❌ Synthesis failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.status, error.response.data);
    }
  }
}

testAPI();
