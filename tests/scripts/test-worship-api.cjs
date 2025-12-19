const https = require('https');

console.log('🔍 Testing Worship Songs API...\n');

// Test 1: Health check
https.get('https://samanabyar.online/api/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('✅ Backend Health:', data);
    
    // Test 2: Worship songs
    console.log('\n🎵 Testing worship-songs endpoint...');
    const req = https.get('https://samanabyar.online/api/worship-songs', (res2) => {
      let data2 = '';
      let size = 0;
      
      res2.on('data', chunk => {
        data2 += chunk;
        size += chunk.length;
        if (size > 100000) { // Stop after 100KB
          req.abort();
          console.log(`📦 Response size: ${(size/1024).toFixed(2)} KB`);
          console.log('⚠️  Response is too large, stopping...');
          
          try {
            const json = JSON.parse(data2);
            console.log(`✅ Valid JSON received`);
            console.log(`📊 Songs count: ${json.length || 'unknown'}`);
            if (json[0]) {
              console.log('🎵 First song:', json[0].title);
            }
          } catch (e) {
            console.log('❌ Invalid JSON:', e.message);
          }
          process.exit(0);
        }
      });
      
      res2.on('end', () => {
        console.log(`📦 Total size: ${(size/1024).toFixed(2)} KB`);
        try {
          const json = JSON.parse(data2);
          console.log(`✅ Valid JSON`);
          console.log(`📊 Total songs: ${json.length}`);
          console.log('🎵 First 3 songs:');
          json.slice(0, 3).forEach((s, i) => {
            console.log(`  ${i+1}. ${s.title?.fa || s.title?.en || s.title} (ID: ${s.id})`);
            console.log(`     Has timing: ${s.has_timing || false}`);
          });
        } catch (e) {
          console.log('❌ Parse error:', e.message);
          console.log('📄 First 500 chars:', data2.substring(0, 500));
        }
        process.exit(0);
      });
    });
    
    req.on('error', (e) => {
      console.log('❌ Request error:', e.message);
      process.exit(1);
    });
    
    req.setTimeout(10000, () => {
      console.log('⏱️  Timeout after 10s');
      req.abort();
      process.exit(1);
    });
  });
}).on('error', (e) => {
  console.log('❌ Health check failed:', e.message);
  process.exit(1);
});
