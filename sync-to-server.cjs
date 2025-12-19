/**
 * Sync Manager - همگام‌سازی خودکار فایل‌های static با سرور
 * 
 * استفاده:
 *   node sync-to-server.js --watch    # حالت مانیتورینگ (خودکار)
 *   node sync-to-server.js --sync     # یک‌بار همگام‌سازی
 *   node sync-to-server.js --file <path>  # آپلود یک فایل خاص
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chokidar = require('chokidar');

// 🔧 تنظیمات سرور
const SERVER_CONFIG = {
  host: '195.250.25.185',
  user: 'root',
  password: 'jIVeuzsrkoWPkhUY',
  remotePath: '/root/Mychurch/public/'
};

// 📁 پوشه‌هایی که باید sync بشن
const SYNC_FOLDERS = [
  'public/audio',
  'public/images',
  'public/assets',
  'public/documents',
  'public/data',
  'public/worship',
  'public/generated-images',
  'public/bible-timings'
];

// 🚫 فایل‌هایی که ignore میشن
const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/.DS_Store',
  '**/Thumbs.db',
  '**/*.tmp'
];

// 📊 آمار
const stats = {
  uploaded: 0,
  failed: 0,
  skipped: 0,
  totalSize: 0
};

/**
 * 📤 آپلود یک فایل به سرور
 */
function uploadFile(localPath) {
  try {
    // محاسبه مسیر نسبی
    const relativePath = localPath.replace(/\\/g, '/').replace('public/', '');
    const remotePath = `${SERVER_CONFIG.remotePath}${relativePath}`;
    
    // دریافت اطلاعات فایل
    const fileStats = fs.statSync(localPath);
    const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`\n📤 آپلود: ${relativePath} (${fileSizeMB} MB)`);
    
    // آپلود با SCP
    const scpCommand = `pscp -pw ${SERVER_CONFIG.password} -C "${localPath}" ${SERVER_CONFIG.user}@${SERVER_CONFIG.host}:"${remotePath}"`;
    
    execSync(scpCommand, { stdio: 'inherit' });
    
    stats.uploaded++;
    stats.totalSize += fileStats.size;
    
    console.log(`✅ موفق: ${relativePath}`);
    return true;
  } catch (error) {
    console.error(`❌ خطا در آپلود ${localPath}:`, error.message);
    stats.failed++;
    return false;
  }
}

/**
 * 🔍 پیدا کردن فایل‌های جدید یا تغییر یافته
 */
async function findChangedFiles() {
  console.log('\n🔍 اسکن فایل‌های تغییر یافته...\n');
  
  const changedFiles = [];
  
  for (const folder of SYNC_FOLDERS) {
    const folderPath = path.join(__dirname, folder);
    
    if (!fs.existsSync(folderPath)) {
      console.log(`⏭️  پوشه وجود ندارد: ${folder}`);
      continue;
    }
    
    // اسکن فایل‌ها
    const files = getAllFiles(folderPath);
    
    for (const file of files) {
      // چک کردن تاریخ آخرین تغییر
      const fileStats = fs.statSync(file);
      const modifiedTime = fileStats.mtime;
      
      // فایل‌هایی که در 24 ساعت گذشته تغییر کرده‌اند
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      if (modifiedTime > oneDayAgo) {
        changedFiles.push(file);
      }
    }
  }
  
  return changedFiles;
}

/**
 * 📂 دریافت تمام فایل‌ها به صورت بازگشتی
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      // چک کردن ignore patterns
      const shouldIgnore = IGNORE_PATTERNS.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(filePath);
      });
      
      if (!shouldIgnore) {
        arrayOfFiles.push(filePath);
      }
    }
  });
  
  return arrayOfFiles;
}

/**
 * 🔄 همگام‌سازی تمام فایل‌های تغییر یافته
 */
async function syncAll() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('   🔄 شروع همگام‌سازی با سرور');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const changedFiles = await findChangedFiles();
  
  if (changedFiles.length === 0) {
    console.log('✅ همه فایل‌ها به‌روز هستند! نیازی به همگام‌سازی نیست.\n');
    return;
  }
  
  console.log(`📊 ${changedFiles.length} فایل تغییر یافته پیدا شد:\n`);
  
  for (const file of changedFiles) {
    uploadFile(file);
  }
  
  // نمایش آمار
  const totalSizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2);
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('   ✅ همگام‌سازی تکمیل شد!');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`📊 آمار:`);
  console.log(`   ✅ موفق: ${stats.uploaded} فایل`);
  console.log(`   ❌ ناموفق: ${stats.failed} فایل`);
  console.log(`   📦 حجم کل: ${totalSizeMB} MB\n`);
}

/**
 * 👀 حالت Watch - مانیتورینگ تغییرات
 */
function startWatchMode() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('   👀 حالت مانیتورینگ فعال شد');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📁 پوشه‌های تحت نظر:');
  SYNC_FOLDERS.forEach(folder => console.log(`   • ${folder}`));
  console.log('\n⚠️  برای توقف: Ctrl+C\n');
  
  // ایجاد watcher
  const watcher = chokidar.watch(SYNC_FOLDERS, {
    ignored: IGNORE_PATTERNS,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });
  
  // رویدادها
  watcher
    .on('add', filePath => {
      console.log(`\n✨ فایل جدید شناسایی شد: ${filePath}`);
      uploadFile(filePath);
    })
    .on('change', filePath => {
      console.log(`\n🔄 فایل تغییر کرد: ${filePath}`);
      uploadFile(filePath);
    })
    .on('unlink', filePath => {
      console.log(`\n🗑️  فایل حذف شد: ${filePath}`);
      console.log('⚠️  توجه: فایل روی سرور حذف نمیشه (ایمن)');
    })
    .on('error', error => {
      console.error(`❌ خطا در watcher:`, error);
    });
}

/**
 * 🚀 اجرای برنامه
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--watch')) {
    // حالت مانیتورینگ
    startWatchMode();
  } else if (args.includes('--sync')) {
    // یک‌بار همگام‌سازی
    await syncAll();
  } else if (args.includes('--file')) {
    // آپلود یک فایل خاص
    const fileIndex = args.indexOf('--file') + 1;
    const filePath = args[fileIndex];
    
    if (!filePath) {
      console.error('❌ مسیر فایل را مشخص کنید: --file <path>');
      process.exit(1);
    }
    
    uploadFile(filePath);
  } else {
    // راهنما
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('   🔄 Sync Manager - مدیریت همگام‌سازی');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('استفاده:\n');
    console.log('  node sync-to-server.js --watch');
    console.log('    👀 حالت مانیتورینگ: هر فایل جدید خودکار آپلود میشه\n');
    console.log('  node sync-to-server.js --sync');
    console.log('    🔄 همگام‌سازی یک‌باره: فایل‌های تغییر یافته آپلود میشن\n');
    console.log('  node sync-to-server.js --file <path>');
    console.log('    📤 آپلود یک فایل خاص\n');
    console.log('مثال:\n');
    console.log('  node sync-to-server.js --file public/images/new-image.jpg\n');
  }
}

// اجرا
main().catch(error => {
  console.error('❌ خطای کلی:', error);
  process.exit(1);
});
