#!/usr/bin/env node

/**
 * 🚀 Automatic Deployment Script
 * این اسکریپت به صورت خودکار سایت را به سرور A2 Hosting منتقل می‌کند
 */

require('dotenv').config({ path: './backend/.env' });
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

// رنگ‌ها برای خروجی
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

// تنظیمات SSH از .env
const sshConfig = {
  host: process.env.SSH_HOST || 'mi3-cl8-its2.a2hosting.com',
  port: parseInt(process.env.SSH_PORT || '7822'),
  username: process.env.SSH_USER || 'samanabyar',
  password: process.env.SSH_PASS,
  readyTimeout: 30000
};

const projectPath = process.env.SSH_PROJECT_PATH || '/home/samanabyar/public_html/Mychurch';

// لیست دستورات برای اجرا روی سرور
const deployCommands = [
  // رفتن به پوشه پروژه
  `cd ${projectPath}`,
  
  // پشتیبان از شاخه فعلی
  `git stash || true`,
  
  // دریافت آخرین تغییرات
  `git fetch origin`,
  `git reset --hard origin/main`,
  `git pull origin main`,
  
  // نصب dependencies جدید
  `cd ${projectPath}/backend`,
  `npm install --production`,
  
  // ریستارت PM2
  `pm2 restart church-backend || pm2 start server.js --name church-backend`,
  
  // نمایش وضعیت
  `pm2 list`,
  `pm2 logs church-backend --lines 10 --nostream`
];

async function executeSSHCommands(conn) {
  return new Promise((resolve, reject) => {
    const allCommands = deployCommands.join(' && ');
    
    log.info('اجرای دستورات deployment...');
    
    conn.exec(allCommands, (err, stream) => {
      if (err) {
        reject(err);
        return;
      }

      let output = '';
      let errorOutput = '';

      stream.on('close', (code, signal) => {
        if (code === 0) {
          log.success('تمام دستورات با موفقیت اجرا شدند');
          resolve(output);
        } else {
          log.error(`دستورات با خطا متوقف شدند (exit code: ${code})`);
          if (errorOutput) {
            console.log('\n--- خروجی خطا ---');
            console.log(errorOutput);
          }
          reject(new Error(`Exit code: ${code}`));
        }
      });

      stream.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
      });

      stream.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        process.stderr.write(text);
      });
    });
  });
}

async function checkServerHealth(projectPath) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    
    conn.on('ready', () => {
      log.info('بررسی سلامت سرور...');
      
      conn.exec(`curl -s http://localhost:3001/api/health || echo "FAILED"`, (err, stream) => {
        if (err) {
          conn.end();
          reject(err);
          return;
        }

        let output = '';
        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.on('close', () => {
          conn.end();
          if (output.includes('"status":"ok"') || output.includes('ok')) {
            log.success('سرور سالم است و در حال اجرا می‌باشد');
            resolve(true);
          } else {
            log.warning('سرور پاسخ نمی‌دهد یا خطا دارد');
            resolve(false);
          }
        });
      });
    });

    conn.on('error', (err) => {
      log.error(`خطا در اتصال به سرور: ${err.message}`);
      reject(err);
    });

    conn.connect(sshConfig);
  });
}

async function main() {
  console.log(`
${colors.bright}╔════════════════════════════════════════════╗
║     🚀 AUTOMATIC DEPLOYMENT SCRIPT         ║
║     Deploy to: ${sshConfig.host}           
╚════════════════════════════════════════════╝${colors.reset}
`);

  // چک کردن تنظیمات
  if (!sshConfig.password) {
    log.error('پسورد SSH در .env تنظیم نشده است');
    log.info('لطفاً SSH_PASS را در backend/.env تنظیم کنید');
    process.exit(1);
  }

  const conn = new Client();

  try {
    // 1. اتصال به سرور
    log.step('مرحله 1: اتصال به سرور SSH');
    
    await new Promise((resolve, reject) => {
      conn.on('ready', () => {
        log.success(`اتصال به ${sshConfig.host} برقرار شد`);
        resolve();
      });

      conn.on('error', (err) => {
        log.error(`خطا در اتصال SSH: ${err.message}`);
        reject(err);
      });

      log.info(`در حال اتصال به ${sshConfig.username}@${sshConfig.host}:${sshConfig.port}...`);
      conn.connect(sshConfig);
    });

    // 2. اجرای دستورات deployment
    log.step('مرحله 2: اجرای دستورات deployment');
    await executeSSHCommands(conn);

    // 3. بستن اتصال
    conn.end();
    log.success('اتصال SSH بسته شد');

    // 4. چک کردن سلامت سرور
    log.step('مرحله 3: بررسی سلامت سرور');
    await new Promise(resolve => setTimeout(resolve, 2000)); // انتظار 2 ثانیه
    await checkServerHealth(projectPath);

    // موفقیت
    console.log(`
${colors.green}${colors.bright}
╔════════════════════════════════════════════╗
║        ✅ DEPLOYMENT SUCCESSFUL!           ║
╚════════════════════════════════════════════╝${colors.reset}

${colors.cyan}🌐 سایت شما در آدرس زیر در دسترس است:${colors.reset}
   ${colors.bright}https://samanabyar.online${colors.reset}

${colors.cyan}📊 برای مشاهده لاگ‌های سرور:${colors.reset}
   ssh ${sshConfig.username}@${sshConfig.host} -p ${sshConfig.port}
   pm2 logs church-backend
`);

  } catch (error) {
    log.error(`خطا در deployment: ${error.message}`);
    console.log(`
${colors.red}${colors.bright}
╔════════════════════════════════════════════╗
║         ❌ DEPLOYMENT FAILED!              ║
╚════════════════════════════════════════════╝${colors.reset}

${colors.yellow}🔍 راهنمای عیب‌یابی:${colors.reset}
1. مطمئن شوید اطلاعات SSH در .env صحیح است
2. بررسی کنید که Git repository روی سرور وجود دارد
3. PM2 باید نصب شده باشد: npm install -g pm2
4. دسترسی‌های لازم روی سرور را چک کنید

${colors.yellow}💡 برای اطلاعات بیشتر:${colors.reset}
   cat backend/REMOTE_DEPLOYMENT_GUIDE.md
`);
    process.exit(1);
  }
}

// اجرای اسکریپت
main();
