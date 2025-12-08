#!/usr/bin/env node

/**
 * 🚚 Migration Script: Local Files → IONOS HiDrive
 * انتقال تمام فایل‌های سنگین به HiDrive Storage
 * 
 * این اسکریپت:
 * 1. فایل‌های محلی رو آپلود می‌کنه
 * 2. برای فایل‌های فارسی hash می‌سازه
 * 3. mapping file برای پیدا کردن فایل‌ها می‌سازه
 * 4. گزارش کامل از migration می‌ده
 */

require('dotenv').config({ path: './backend/.env' });
const hidriveService = require('../backend/services/hidriveService');
const fs = require('fs').promises;
const path = require('path');

// رنگ‌ها برای خروجی
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.cyan}▶${colors.reset} ${colors.bright}${msg}${colors.reset}`)
};

// مسیرهای فایل‌های سنگین
const MIGRATION_MAP = [
  {
    name: 'Bible Audio Timings',
    localPath: './public/bible/data/timings',
    category: 'bible',
    subcategory: 'timings',
    pattern: /\.json$/
  },
  {
    name: 'Worship Songs Audio',
    localPath: './public/worship/audio/kalameh',
    category: 'worship',
    subcategory: 'audio',
    pattern: /\.mp3$/
  },
  {
    name: 'Worship Data Files',
    localPath: './public/worship/data',
    category: 'worship',
    subcategory: 'data',
    pattern: /\.(json|txt)$/
  },
  {
    name: 'Bible Audio Files',
    localPath: './public/bible/audio',
    category: 'bible',
    subcategory: 'audio',
    pattern: /\.mp3$/
  },
  {
    name: 'Sermon Audio',
    localPath: './public/sermons/audio',
    category: 'sermons',
    subcategory: 'audio',
    pattern: /\.(mp3|m4a)$/
  },
  {
    name: 'Sermon Videos',
    localPath: './public/sermons/videos',
    category: 'sermons',
    subcategory: 'videos',
    pattern: /\.(mp4|webm)$/
  },
  {
    name: 'Images',
    localPath: './public/images',
    category: 'images',
    subcategory: '',
    pattern: /\.(jpg|jpeg|png|gif|webp|svg)$/
  },
  {
    name: 'Documents',
    localPath: './public/documents',
    category: 'documents',
    subcategory: '',
    pattern: /\.(pdf|doc|docx|txt)$/
  }
];

/**
 * بررسی وجود دایرکتوری
 */
async function directoryExists(dirPath) {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * دریافت لیست فایل‌ها با فیلتر
 */
async function getFilteredFiles(dirPath, pattern) {
  try {
    const files = await fs.readdir(dirPath);
    return files.filter(file => pattern.test(file)).map(file => path.join(dirPath, file));
  } catch (error) {
    return [];
  }
}

/**
 * Migration یک دسته
 */
async function migrateCategory(config) {
  log.step(`Migration: ${config.name}`);
  log.info(`Local: ${config.localPath}`);
  log.info(`Target: HiDrive/${config.category}/${config.subcategory || ''}`);

  // بررسی وجود دایرکتوری
  const exists = await directoryExists(config.localPath);
  if (!exists) {
    log.warning(`دایرکتوری وجود ندارد، رد می‌شود`);
    return { skipped: true, reason: 'Directory not found' };
  }

  // دریافت فایل‌ها
  const files = await getFilteredFiles(config.localPath, config.pattern);
  if (files.length === 0) {
    log.warning(`هیچ فایلی یافت نشد، رد می‌شود`);
    return { skipped: true, reason: 'No files found' };
  }

  log.info(`${files.length} فایل یافت شد`);

  // آپلود فایل‌ها
  const results = {
    total: files.length,
    success: [],
    failed: [],
    mapping: {}
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filename = path.basename(file);
    
    try {
      process.stdout.write(`  [${i + 1}/${files.length}] ${filename}... `);
      
      const result = await hidriveService.uploadFile(
        file,
        config.category,
        config.subcategory
      );

      // ذخیره mapping برای فایل‌های با نام متفاوت
      if (result.originalName !== result.safeName) {
        results.mapping[result.safeName] = {
          original: result.originalName,
          safe: result.safeName,
          url: result.publicUrl,
          path: `${config.category}/${config.subcategory}/${result.safeName}`
        };
      }

      results.success.push(result);
      process.stdout.write(`${colors.green}✓${colors.reset}\n`);
    } catch (error) {
      results.failed.push({ file: filename, error: error.message });
      process.stdout.write(`${colors.red}✗${colors.reset}\n`);
      log.error(`  Error: ${error.message}`);
    }
  }

  log.success(`✅ Success: ${results.success.length}, ❌ Failed: ${results.failed.length}`);
  
  return results;
}

/**
 * ذخیره mapping file
 */
async function saveMappingFile(allMappings) {
  const mappingPath = './public/hidrive_mapping.json';
  
  try {
    await fs.writeFile(mappingPath, JSON.stringify(allMappings, null, 2), 'utf8');
    log.success(`Mapping file saved: ${mappingPath}`);
    
    // آپلود mapping file به HiDrive
    const result = await hidriveService.uploadFile(mappingPath, 'config', '');
    log.success(`Mapping file uploaded to HiDrive: ${result.publicUrl}`);
  } catch (error) {
    log.error(`Failed to save mapping file: ${error.message}`);
  }
}

/**
 * نمایش خلاصه migration
 */
function displaySummary(results) {
  console.log(`
${colors.bright}${colors.cyan}
╔════════════════════════════════════════════╗
║          📊 MIGRATION SUMMARY              ║
╚════════════════════════════════════════════╝${colors.reset}
`);

  let totalFiles = 0;
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalSize = 0;

  for (const result of results) {
    if (result.skipped) {
      console.log(`${colors.yellow}⊘ ${result.config.name}: Skipped (${result.reason})${colors.reset}`);
    } else {
      totalFiles += result.total;
      totalSuccess += result.success.length;
      totalFailed += result.failed.length;
      
      const size = result.success.reduce((sum, f) => sum + (f.size || 0), 0);
      totalSize += size;
      const sizeMB = (size / 1024 / 1024).toFixed(2);

      console.log(`
${colors.bright}${result.config.name}:${colors.reset}
  ✅ Success: ${colors.green}${result.success.length}${colors.reset}
  ❌ Failed:  ${colors.red}${result.failed.length}${colors.reset}
  📦 Size:    ${sizeMB} MB
      `.trim());
    }
  }

  const totalSizeGB = (totalSize / 1024 / 1024 / 1024).toFixed(2);
  
  console.log(`
${colors.bright}${colors.magenta}
─────────────────────────────────────────────
TOTAL:
  📁 Files:   ${totalFiles}
  ✅ Success: ${totalSuccess}
  ❌ Failed:  ${totalFailed}
  📦 Size:    ${totalSizeGB} GB
─────────────────────────────────────────────${colors.reset}
`);
}

/**
 * Main function
 */
async function main() {
  console.log(`
${colors.bright}${colors.cyan}
╔════════════════════════════════════════════╗
║   🚚 MIGRATE TO IONOS HIDRIVE STORAGE      ║
╚════════════════════════════════════════════╝${colors.reset}
`);

  // بررسی تنظیمات
  if (!process.env.HIDRIVE_PASSWORD) {
    log.error('HIDRIVE_PASSWORD not configured in backend/.env');
    log.info('Please add HIDRIVE_PASSWORD to backend/.env');
    process.exit(1);
  }

  const allResults = [];
  const allMappings = {};

  try {
    // اتصال به HiDrive
    log.step('Connecting to HiDrive...');
    await hidriveService.connect();
    log.success('Connected to HiDrive');

    // Migration هر دسته
    for (const config of MIGRATION_MAP) {
      const result = await migrateCategory(config);
      result.config = config;
      allResults.push(result);

      // اضافه کردن mapping ها
      if (result.mapping && Object.keys(result.mapping).length > 0) {
        Object.assign(allMappings, result.mapping);
      }
    }

    // ذخیره mapping file
    if (Object.keys(allMappings).length > 0) {
      log.step('Saving mapping file...');
      await saveMappingFile(allMappings);
    }

    // قطع اتصال
    await hidriveService.disconnect();

    // نمایش خلاصه
    displaySummary(allResults);

    log.success('Migration completed!');

    console.log(`
${colors.cyan}📝 Next Steps:${colors.reset}
1. Update database URLs to point to HiDrive
2. Update frontend to use HiDrive URLs
3. Test file access from website
4. Remove old files from server (after testing)

${colors.cyan}🌐 HiDrive Public URL:${colors.reset}
   ${process.env.HIDRIVE_PUBLIC_URL || 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch'}
`);

  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    console.error(error);
    
    // قطع اتصال در صورت خطا
    try {
      await hidriveService.disconnect();
    } catch {}

    process.exit(1);
  }
}

// اجرای اسکریپت
if (require.main === module) {
  main();
}

module.exports = { migrateCategory, MIGRATION_MAP };
