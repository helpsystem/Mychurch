// Test WebDAV access to HiDrive
const axios = require('axios');

async function testWebDAV() {
  const testUrl = 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/worship/audio/';
  
  console.log('🧪 Testing WebDAV access...');
  console.log(`URL: ${testUrl}\n`);
  
  try {
    const response = await axios.get(testUrl, {
      auth: {
        username: process.env.HIDRIVE_USER,
        password: process.env.HIDRIVE_PASSWORD
      },
      timeout: 10000
    });
    
    console.log('✅ WebDAV access successful!');
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    
  } catch (error) {
    console.error('❌ WebDAV access failed');
    console.error(`Status: ${error.response?.status || 'N/A'}`);
    console.error(`Message: ${error.message}`);
  }
  
  // Test bible/audio directory
  console.log('\n🔍 Checking bible/audio directory...');
  
  const bibleUrl = 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/bible/audio/';
  
  try {
    const response = await axios.get(bibleUrl, {
      auth: {
        username: process.env.HIDRIVE_USER,
        password: process.env.HIDRIVE_PASSWORD
      },
      timeout: 10000
    });
    
    console.log('✅ bible/audio directory exists!');
    console.log(`Status: ${response.status}`);
    
    // Check for TPV translation
    const tpvUrl = bibleUrl + 'TPV/';
    try {
      const tpvResponse = await axios.get(tpvUrl, {
        auth: {
          username: process.env.HIDRIVE_USER,
          password: process.env.HIDRIVE_PASSWORD
        },
        timeout: 10000
      });
      console.log('  ✅ TPV directory exists!');
    } catch (err) {
      console.log('  ❌ TPV directory not found');
    }
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('❌ bible/audio directory does not exist on HiDrive');
      console.log('ℹ️  Files need to be uploaded');
    } else {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}

testWebDAV();
