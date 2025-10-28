const http = require('http');

console.log('🧪 Testing Bible Audio API...\n');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/bible-audio/chapter/EPH/1?lang=fa',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('✅ Response received:');
    console.log(data);
    
    try {
      const json = JSON.parse(data);
      if (json.success && json.audio) {
        console.log('\n✅ Audio URL:', json.audio.url);
        console.log('✅ File size:', json.audio.file_size || 'N/A');
      } else {
        console.log('\n❌ Error:', json.message || 'Unknown error');
      }
    } catch (e) {
      console.log('\n❌ Failed to parse JSON:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.end();
