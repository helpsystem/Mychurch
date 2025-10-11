const https = require('https');
require('dotenv').config();

function makeApiRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.scripture.api.bible',
      path: `/v1${endpoint}`,
      method: 'GET',
      headers: {
        'api-key': process.env.BIBLE_API_KEY
      }
    };

    https.get(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          console.log('\nRAW RESPONSE:');
          console.log(data);
          console.log('\n---\n');
          
          const parsed = JSON.parse(data);
          console.log('PARSED:');
          console.log(JSON.stringify(parsed, null, 2));
          
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// Test with Genesis 1
makeApiRequest('/bibles/7cd100148df29c08-01/chapters/GEN.1/verses')
  .then(() => console.log('\n✅ Done'))
  .catch(err => console.error('❌ Error:', err));
