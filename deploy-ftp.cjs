#!/usr/bin/env node

/**
 * 🚀 FTP Deployment Script
 * از FTP برای آپلود فایل‌ها استفاده می‌کند (بدون نیاز به SSH)
 */

require('dotenv').config({ path: './backend/.env' });
const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');

// رنگ‌ها
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.cyan}▶${colors.reset} ${colors.bright}${msg}${colors.reset}`)
};

const ftpConfig = {
  host: process.env.FTP_HOST || 'mi3-cl8-its2.a2hosting.com',
  user: process.env.FTP_USER || 'samanabyar',
  password: process.env.FTP_PASS,
  port: parseInt(process.env.FTP_PORT || '21'),
  secure: process.env.FTP_SECURE === 'true'
};

const remotePath = '/public_html/Mychurch/backend';

async function uploadFile(client, localFile, remoteFile) {
  try {
    await client.uploadFrom(localFile, remoteFile);
    return true;
  } catch (err) {
    log.error(`خطا در آپلود ${path.basename(localFile)}: ${err.message}`);
    return false;
  }
}

async function uploadDirectory(client, localDir, remoteDir) {
  const files = fs.readdirSync(localDir);
  let uploaded = 0;
  let failed = 0;

  for (const file of files) {
    const localPath = path.join(localDir, file);
    const remotePath = `${remoteDir}/${file}`;
    const stat = fs.statSync(localPath);

    // Skip node_modules and hidden files
    if (file === 'node_modules' || file.startsWith('.') || file === 'uploads') {
      continue;
    }

    if (stat.isDirectory()) {
      try {
        await client.ensureDir(remotePath);
        const result = await uploadDirectory(client, localPath, remotePath);
        uploaded += result.uploaded;
        failed += result.failed;
      } catch (err) {
        log.warning(`نمی‌توان پوشه ${file} را ساخت`);
      }
    } else {
      process.stdout.write(`📤 ${file}... `);
      const success = await uploadFile(client, localPath, remotePath);
      if (success) {
        console.log(`${colors.green}✓${colors.reset}`);
        uploaded++;
      } else {
        console.log(`${colors.red}✗${colors.reset}`);
        failed++;
      }
    }
  }

  return { uploaded, failed };
}

async function main() {
  console.log(`
${colors.bright}╔════════════════════════════════════════════╗
║     🚀 FTP DEPLOYMENT SCRIPT               ║
║     Server: ${ftpConfig.host}              
╚════════════════════════════════════════════╝${colors.reset}
`);

  if (!ftpConfig.password) {
    log.error('پسورد FTP در .env تنظیم نشده است');
    log.info('لطفاً FTP_PASS را در backend/.env تنظیم کنید');
    process.exit(1);
  }

  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    // اتصال به FTP
    log.step('مرحله 1: اتصال به FTP Server');
    log.info(`در حال اتصال به ${ftpConfig.user}@${ftpConfig.host}...`);
    
    await client.access(ftpConfig);
    log.success('اتصال FTP برقرار شد');

    // رفتن به پوشه پروژه
    log.step('مرحله 2: بررسی پوشه remote');
    try {
      await client.cd(remotePath);
      log.success(`پوشه ${remotePath} وجود دارد`);
    } catch (err) {
      log.warning(`پوشه ${remotePath} وجود ندارد، ساخته می‌شود...`);
      await client.ensureDir(remotePath);
      await client.cd(remotePath);
    }

    // آپلود فایل‌های backend
    log.step('مرحله 3: آپلود فایل‌های Backend');
    
    const backendPath = path.join(__dirname, 'backend');
    const result = await uploadDirectory(client, backendPath, remotePath);

    log.success(`${result.uploaded} فایل با موفقیت آپلود شد`);
    if (result.failed > 0) {
      log.warning(`${result.failed} فایل با خطا مواجه شد`);
    }

    // آپلود package.json
    log.step('مرحله 4: آپلود package.json');
    const packagePath = path.join(__dirname, 'backend', 'package.json');
    const remotePackage = `${remotePath}/package.json`;
    await uploadFile(client, packagePath, remotePackage);
    log.success('package.json آپلود شد');

    client.close();

    console.log(`
${colors.green}${colors.bright}
╔════════════════════════════════════════════╗
║        ✅ FTP UPLOAD SUCCESSFUL!           ║
╚════════════════════════════════════════════╝${colors.reset}

${colors.cyan}📝 مراحل بعدی (دستی):${colors.reset}

1️⃣  اتصال SSH به سرور:
   ssh ${ftpConfig.user}@${ftpConfig.host} -p 7822

2️⃣  رفتن به پوشه پروژه:
   cd /public_html/Mychurch/backend

3️⃣  نصب dependencies:
   npm install --production

4️⃣  ریستارت PM2:
   pm2 restart church-backend

${colors.yellow}💡 برای deployment کامل خودکار، باید SSH Key راه‌اندازی کنید${colors.reset}
`);

  } catch (err) {
    log.error(`خطا در FTP: ${err.message}`);
    console.log(`
${colors.red}${colors.bright}
╔════════════════════════════════════════════╗
║          ❌ FTP UPLOAD FAILED!             ║
╚════════════════════════════════════════════╝${colors.reset}

${colors.yellow}🔍 راهنمای عیب‌یابی:${colors.reset}
1. مطمئن شوید اطلاعات FTP در .env صحیح است
2. بررسی کنید که host و port قابل دسترسی هستند
3. از cPanel دسترسی FTP را فعال کنید
`);
    process.exit(1);
  } finally {
    client.close();
  }
}

main();
