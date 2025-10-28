/**
 * تست سریع API فایل‌های صوتی
 */

const http = require('http');

function testAPI(path, label) {
  return new Promise((resolve) => {
    console.log(`\n🔍 در حال تست: ${label}`);
    console.log(`   📡 ${path}`);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`   ✅ موفق:`);
          console.log(`   ${JSON.stringify(json, null, 2).split('\n').map(l => '   ' + l).join('\n')}`);
          resolve(true);
        } catch (e) {
          console.log(`   ❌ خطا در parse: ${e.message}`);
          console.log(`   Raw: ${data.substring(0, 200)}`);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`   ❌ خطای اتصال: ${e.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log(`   ⏱️ Timeout`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function runTests() {
  console.log('🎵 تست API فایل‌های صوتی کتاب مقدس');
  console.log('=' .repeat(60));

  // تست 1: آمار کلی
  await testAPI('/api/bible-audio/stats', 'آمار کلی فایل‌ها');

  // تست 2: لیست کتاب‌ها
  await testAPI('/api/bible-audio/list?lang=fa', 'لیست کتاب‌های فارسی');

  // تست 3: فایل صوتی افسسیان
  await testAPI('/api/bible-audio/book/EPH?lang=fa', 'فایل صوتی افسسیان');

  // تست 4: فایل صوتی پیدایش فصل 1
  await testAPI('/api/bible-audio/chapter/GEN/1?lang=fa', 'پیدایش فصل 1');

  console.log('\n' + '='.repeat(60));
  console.log('✅ تست‌ها تمام شد!');
}

// اجرا
runTests().catch(console.error);
