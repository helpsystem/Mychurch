// Quick test - upload one file
const axios = require('axios');
const fs = require('fs').promises;

async function testUpload() {
  const testFile = '../bible_data/audio/TPV/GEN/1.mp3';
  const remotePath = 'bible/audio/TPV/GEN/1.mp3';
  const webdavBase = process.env.HIDRIVE_PUBLIC_URL || 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch';
  const auth = {
    username: process.env.HIDRIVE_USER,
    password: process.env.HIDRIVE_PASSWORD
  };

  console.log('🧪 Testing single file upload...\n');

  try {
    // Create directories
    console.log('Creating directories...');
    await axios({ method: 'MKCOL', url: `${webdavBase}/bible`, auth }).catch(() => {});
    await axios({ method: 'MKCOL', url: `${webdavBase}/bible/audio`, auth }).catch(() => {});
    await axios({ method: 'MKCOL', url: `${webdavBase}/bible/audio/TPV`, auth }).catch(() => {});
    await axios({ method: 'MKCOL', url: `${webdavBase}/bible/audio/TPV/GEN`, auth }).catch(() => {});

    // Upload file
    console.log(`Reading: ${testFile}`);
    const fileBuffer = await fs.readFile(testFile);
    console.log(`Size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    console.log(`\nUploading to: ${remotePath}...`);
    const uploadUrl = `${webdavBase}/${remotePath}`;
    
    await axios.put(uploadUrl, fileBuffer, {
      auth,
      headers: { 'Content-Type': 'audio/mpeg' },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });

    console.log('✅ Upload successful!\n');

    // Verify
    console.log('Verifying...');
    const response = await axios.head(uploadUrl, { auth });
    console.log(`✅ File exists! Size: ${response.headers['content-length']} bytes`);

    // Test public API access
    console.log('\nTesting API access...');
    const apiUrl = `https://samanabyar.online/api/hidrive/stream/bible/audio/TPV/GEN/1.mp3`;
    const apiResponse = await axios.head(apiUrl);
    console.log(`✅ API access works! Status: ${apiResponse.status}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
  }
}

testUpload();
