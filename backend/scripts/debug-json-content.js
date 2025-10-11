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
          const parsed = JSON.parse(data);
          console.log('✅ Response received:\n');
          console.log(JSON.stringify(parsed, null, 2));
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// Test with Matthew 1 JSON format
makeApiRequest('/bibles/7cd100148df29c08-01/chapters/MAT.1?content-type=json&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false')
  .then(() => console.log('\n✅ Done'))
  .catch(err => console.error('❌ Error:', err));
