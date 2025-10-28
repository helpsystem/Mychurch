/**
 * تست دانلود یک کتاب (افسسیان - فارسی)
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const TEMP_DIR = path.join(__dirname, '../temp/audio-test');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

async function testDownload() {
  console.log('🧪 تست دانلود افسسیان (فارسی)...\n');

  // افسسیان = کتاب شماره 49
  const zipUrl = 'http://audio1.wordfree.net/bibles/app/audio/20_49.zip';
  const zipFile = path.join(TEMP_DIR, '20_49.zip');
  const extractDir = path.join(TEMP_DIR, '20_49');

  try {
    // 1. دانلود
    console.log('📥 در حال دانلود...');
    console.log(`   URL: ${zipUrl}`);
    
    const response = await axios({
      method: 'GET',
      url: zipUrl,
      responseType: 'stream',
      timeout: 60000,
    });

    const writer = fs.createWriteStream(zipFile);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    const fileSize = fs.statSync(zipFile).size;
    console.log(`✅ دانلود شد: ${(fileSize / 1024 / 1024).toFixed(2)} MB\n`);

    // 2. استخراج
    console.log('📦 در حال استخراج...');
    const zip = new AdmZip(zipFile);
    zip.extractAllTo(extractDir, true);

    const entries = zip.getEntries();
    console.log(`✅ ${entries.length} فایل استخراج شد:\n`);

    // نمایش فایل‌ها
    entries.forEach(entry => {
      const localPath = path.join(extractDir, entry.entryName);
      const size = fs.existsSync(localPath) ? fs.statSync(localPath).size : 0;
      console.log(`   📄 ${entry.entryName} - ${(size / 1024).toFixed(0)} KB`);
    });

    console.log(`\n✅ فایل‌ها در: ${extractDir}`);
    console.log(`\n💡 برای پاک‌سازی: rmdir /s "${TEMP_DIR}"`);

  } catch (error) {
    console.error('❌ خطا:', error.message);
  }
}

testDownload();
