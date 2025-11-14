// Verification script for Admin Panel setup
const axios = require('axios');

const BASE_URL = 'https://samanabyar.online';

async function verifyAdminSetup() {
  console.log('🔍 Verifying Admin Panel setup...\n');
  
  const checks = {
    backendHealth: false,
    worshipSongsAPI: false,
    audioSyncAPI: false,
    databaseSchema: false
  };
  
  try {
    // Check 1: Backend Health
    console.log('1. Checking backend health...');
    try {
      const response = await axios.get(`${BASE_URL}/api/health`);
      if (response.data && response.data.ok) {
        checks.backendHealth = true;
        console.log('✅ Backend is running');
      } else {
        console.log('❌ Backend health check failed');
      }
    } catch (error) {
      console.log('❌ Backend health check failed:', error.message);
    }
    
    // Check 2: Worship Songs API
    console.log('\n2. Checking worship songs API...');
    try {
      const response = await axios.get(`${BASE_URL}/api/worship-songs`);
      if (response.data && Array.isArray(response.data)) {
        checks.worshipSongsAPI = true;
        console.log(`✅ Worship songs API working (${response.data.length} songs found)`);
        
        // Check songs needing processing
        const songsWithoutTiming = response.data.filter(song => !song.hasTiming);
        console.log(`📊 Songs needing processing: ${songsWithoutTiming.length}/${response.data.length}`);
        
        if (songsWithoutTiming.length > 0) {
          console.log('📝 First song needing processing:');
          console.log(`   ID: ${songsWithoutTiming[0].id}`);
          console.log(`   Title: ${songsWithoutTiming[0].title.fa || songsWithoutTiming[0].title.en}`);
        }
      } else {
        console.log('❌ Worship songs API returned invalid data');
      }
    } catch (error) {
      console.log('❌ Worship songs API failed:', error.message);
    }
    
    // Check 3: Audio Sync API
    console.log('\n3. Checking audio sync API...');
    try {
      const response = await axios.get(`${BASE_URL}/api/audio-sync/health`);
      if (response.data && response.data.ok) {
        checks.audioSyncAPI = true;
        console.log('✅ Audio sync API is working');
      } else {
        console.log('❌ Audio sync API health check failed');
      }
    } catch (error) {
      console.log('❌ Audio sync API failed:', error.message);
    }
    
    // Check 4: Database Schema (by checking a sample song)
    console.log('\n4. Checking database schema...');
    try {
      const songsResponse = await axios.get(`${BASE_URL}/api/worship-songs`);
      if (songsResponse.data && songsResponse.data.length > 0) {
        const sampleSong = songsResponse.data[0];
        
        // Check if required fields exist
        const requiredFields = ['id', 'title', 'lyrics', 'audioUrl', 'hasTiming', 'timingData'];
        const missingFields = requiredFields.filter(field => !(field in sampleSong));
        
        if (missingFields.length === 0) {
          checks.databaseSchema = true;
          console.log('✅ Database schema is correct');
          console.log(`📊 Sample song ID: ${sampleSong.id}`);
          console.log(`📊 Has timing: ${sampleSong.hasTiming}`);
          console.log(`📊 Timing data: ${sampleSong.timingData ? 'Available' : 'Not available'}`);
        } else {
          console.log('❌ Database schema missing fields:', missingFields.join(', '));
        }
      }
    } catch (error) {
      console.log('❌ Database schema check failed:', error.message);
    }
    
    // Summary
    console.log('\n📋 Summary:');
    console.log(`Backend Health: ${checks.backendHealth ? '✅' : '❌'}`);
    console.log(`Worship Songs API: ${checks.worshipSongsAPI ? '✅' : '❌'}`);
    console.log(`Audio Sync API: ${checks.audioSyncAPI ? '✅' : '❌'}`);
    console.log(`Database Schema: ${checks.databaseSchema ? '✅' : '❌'}`);
    
    const allChecksPassed = Object.values(checks).every(check => check);
    
    if (allChecksPassed) {
      console.log('\n🎉 All checks passed! Admin Panel is ready for testing.');
      console.log('\n📋 Next steps:');
      console.log('1. Go to: https://samanabyar.online/#/admin/sync-management');
      console.log('2. Login with: help.system@ymail.com / Samyar@1989');
      console.log('3. Clear cache with Ctrl+Shift+R');
      console.log('4. Select a song and click the process button');
    } else {
      console.log('\n⚠️  Some checks failed. Please fix the issues before testing.');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyAdminSetup();