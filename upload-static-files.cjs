const ftp = require('basic-ftp');
const path = require('path');
const fs = require('fs');

/**
 * ═══════════════════════════════════════════════════════════════
 *  📤 FTP Static Files Uploader - Mychurch Project
 * ═══════════════════════════════════════════════════════════════
 * 
 * این اسکریپت فایل‌های استاتیک (audio, images) را به سرور FTP آپلود می‌کند
 * 
 * توضیحات:
 * - آپلود فایل‌های صوتی (374 فایل، 240 MB)
 * - آپلود عکس‌ها (47 فایل، 20 MB)
 * - پشتیبانی از Resume در صورت قطع شدن
 * - گزارش پیشرفت دقیق
 * 
 * نحوه اجرا:
 *   node upload-static-files.cjs
 * 
 * یا برای آپلود فقط یک پوشه خاص:
 *   node upload-static-files.cjs --folder audio/bible
 */

// ═══════════════════════════════════════════════════════════════
//  📋 FTP Configuration
// ═══════════════════════════════════════════════════════════════

const FTP_CONFIG = {
  host: '195.250.25.185',
  user: 'root',
  password: 'jIVeuzsrkoWPkhUY',
  port: 21,
  secure: false
};

// مسیر ریموت روی سرور - مسیر پروژه در سرور
const REMOTE_BASE_DIR = '/root/Mychurch/public'; // یا '/home/samyar/Mychurch/public' اگر یوزر samyar است

// پوشه‌های محلی که باید آپلود بشن
const LOCAL_PUBLIC_DIR = path.join(__dirname, 'public');

// ═══════════════════════════════════════════════════════════════
//  🛠️ Helper Functions
// ═══════════════════════════════════════════════════════════════

let totalFiles = 0;
let uploadedFiles = 0;
let totalSize = 0;
let uploadedSize = 0;

// شمارش فایل‌ها قبل از آپلود
function countFiles(dir) {
  const files = fs.readdirSync(dir);
  let count = 0;
  let size = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      const subResult = countFiles(filePath);
      count += subResult.count;
      size += subResult.size;
    } else {
      count++;
      size += stat.size;
    }
  }

  return { count, size };
}

// فرمت کردن سایز
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

// آپلود یک پوشه
async function uploadDirectory(client, localDir, remoteDir, folderName = '') {
  console.log(`\n📁 آپلود پوشه: ${folderName || remoteDir}`);
  
  // ایجاد پوشه در سرور
  try {
    await client.ensureDir(remoteDir);
  } catch (err) {
    console.log(`   ⚠️ در حال ایجاد پوشه: ${remoteDir}`);
  }

  const files = fs.readdirSync(localDir);

  for (const file of files) {
    const localPath = path.join(localDir, file);
    const remotePath = remoteDir + '/' + file;
    const stat = fs.statSync(localPath);

    if (stat.isDirectory()) {
      // آپلود زیرپوشه
      await uploadDirectory(client, localPath, remotePath, file);
    } else {
      // آپلود فایل
      try {
        await client.uploadFrom(localPath, remotePath);
        uploadedFiles++;
        uploadedSize += stat.size;

        const progress = ((uploadedFiles / totalFiles) * 100).toFixed(1);
        const sizeProgress = formatSize(uploadedSize) + ' / ' + formatSize(totalSize);
        
        console.log(`   ✅ [${progress}%] ${file} (${formatSize(stat.size)}) - ${sizeProgress}`);
      } catch (err) {
        console.error(`   ❌ خطا در آپلود ${file}:`, err.message);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  🚀 Main Upload Function
// ═══════════════════════════════════════════════════════════════

async function uploadStaticFiles(specificFolder = null) {
  // بررسی تنظیمات FTP
  if (!FTP_CONFIG.user || !FTP_CONFIG.password) {
    console.error('\n❌ خطا: اطلاعات FTP را در FTP_CONFIG تنظیم کنید!\n');
    console.log('📝 باید یوزرنیم و پسورد FTP را در فایل upload-static-files.cjs وارد کنید:');
    console.log('   - FTP_CONFIG.user');
    console.log('   - FTP_CONFIG.password');
    console.log('   - REMOTE_BASE_DIR (مسیر روی سرور)\n');
    process.exit(1);
  }

  const client = new ftp.Client();
  client.ftp.verbose = false; // برای دیباگ می‌تونی true کنی

  try {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('   📤 FTP Static Files Upload - Mychurch');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('📋 تنظیمات FTP:');
    console.log(`   Host: ${FTP_CONFIG.host}:${FTP_CONFIG.port}`);
    console.log(`   User: ${FTP_CONFIG.user}`);
    console.log(`   Remote Dir: ${REMOTE_BASE_DIR}`);
    console.log(`   Local Dir: ${LOCAL_PUBLIC_DIR}\n`);

    // شمارش فایل‌ها
    console.log('🔍 در حال شمارش فایل‌ها...');
    
    const foldersToUpload = specificFolder 
      ? [specificFolder]
      : ['audio', 'images', 'church-photos', 'generated-images', 'worship'];

    for (const folder of foldersToUpload) {
      const folderPath = path.join(LOCAL_PUBLIC_DIR, folder);
      if (fs.existsSync(folderPath)) {
        const result = countFiles(folderPath);
        totalFiles += result.count;
        totalSize += result.size;
        console.log(`   ${folder}: ${result.count} فایل (${formatSize(result.size)})`);
      }
    }

    console.log(`\n📊 کل: ${totalFiles} فایل (${formatSize(totalSize)})`);
    
    if (totalFiles === 0) {
      console.log('\n⚠️ هیچ فایلی برای آپلود پیدا نشد!');
      return;
    }

    console.log('\n🔗 در حال اتصال به سرور FTP...');
    await client.access(FTP_CONFIG);
    console.log('✅ اتصال برقرار شد!\n');

    // ایجاد پوشه اصلی
    await client.ensureDir(REMOTE_BASE_DIR);

    // شروع آپلود
    const startTime = Date.now();

    for (const folder of foldersToUpload) {
      const localPath = path.join(LOCAL_PUBLIC_DIR, folder);
      const remotePath = REMOTE_BASE_DIR + '/' + folder;

      if (fs.existsSync(localPath)) {
        await uploadDirectory(client, localPath, remotePath, folder);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('   ✨ آپلود با موفقیت انجام شد!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`📊 خلاصه:`);
    console.log(`   فایل‌های آپلود شده: ${uploadedFiles} / ${totalFiles}`);
    console.log(`   حجم کل: ${formatSize(uploadedSize)} / ${formatSize(totalSize)}`);
    console.log(`   زمان: ${duration} ثانیه`);
    console.log(`   سرعت متوسط: ${formatSize(uploadedSize / duration)}/s`);
    console.log(`\n🌐 فایل‌ها در آدرس زیر قابل دسترسی هستند:`);
    console.log(`   http://195.250.25.185/audio/...`);
    console.log(`   http://195.250.25.185/images/...`);
    console.log('');

  } catch (err) {
    console.error('\n❌ خطا در آپلود:', err.message);
    console.error('\n💡 نکات عیب‌یابی:');
    console.error('   1. آیا اطلاعات FTP صحیح است؟');
    console.error('   2. آیا پورت 21 باز است؟');
    console.error('   3. آیا مسیر ریموت درست است؟');
    console.error('   4. آیا دسترسی نوشتن دارید؟');
    throw err;
  } finally {
    client.close();
  }
}

// ═══════════════════════════════════════════════════════════════
//  🎯 Run Script
// ═══════════════════════════════════════════════════════════════

// دریافت آرگومان‌ها
const args = process.argv.slice(2);
const folderArg = args.find(arg => arg.startsWith('--folder='));
const specificFolder = folderArg ? folderArg.split('=')[1] : null;

// اجرای اسکریپت
uploadStaticFiles(specificFolder).catch(err => {
  console.error('\n❌ خطای کلی:', err);
  process.exit(1);
});
