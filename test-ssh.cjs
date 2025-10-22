#!/usr/bin/env node

/**
 * 🧪 Test SSH Connection
 * تست سریع اتصال SSH به سرور
 */

require('dotenv').config({ path: './backend/.env' });
const { Client } = require('ssh2');

const sshConfig = {
  host: process.env.SSH_HOST || 'mi3-cl8-its2.a2hosting.com',
  port: parseInt(process.env.SSH_PORT || '7822'),
  username: process.env.SSH_USER || 'samanabyar',
  password: process.env.SSH_PASS,
  readyTimeout: 20000
};

console.log('🔍 Testing SSH Connection...\n');
console.log(`Host: ${sshConfig.host}`);
console.log(`Port: ${sshConfig.port}`);
console.log(`User: ${sshConfig.username}`);
console.log(`Password: ${sshConfig.password ? '***' : '❌ NOT SET'}\n`);

if (!sshConfig.password) {
  console.log('❌ خطا: پسورد SSH تنظیم نشده است');
  console.log('💡 لطفاً SSH_PASS را در backend/.env تنظیم کنید');
  process.exit(1);
}

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ اتصال SSH برقرار شد!\n');
  
  // تست یک دستور ساده
  console.log('📋 اجرای دستور تست: pwd && whoami\n');
  
  conn.exec('pwd && whoami && node --version 2>/dev/null || echo "Node not found" && npm --version 2>/dev/null || echo "npm not found" && pm2 --version 2>/dev/null || echo "PM2 not found" && ls -la /home/samanabyar/public_html/ 2>/dev/null || echo "Directory not found"', (err, stream) => {
    if (err) {
      console.log('❌ خطا در اجرای دستور:', err.message);
      conn.end();
      return;
    }

    stream.on('close', (code) => {
      console.log(`\n✅ دستور با کد خروجی ${code} به پایان رسید`);
      conn.end();
      
      if (code === 0) {
        console.log('\n✨ سرور آماده deployment است!');
        console.log('\n🚀 برای deploy استفاده کنید:');
        console.log('   npm run host:update');
      }
    });

    stream.on('data', (data) => {
      console.log('📤 خروجی:', data.toString().trim());
    });

    stream.stderr.on('data', (data) => {
      console.log('⚠️ خطا:', data.toString().trim());
    });
  });
});

conn.on('error', (err) => {
  console.log('❌ خطا در اتصال SSH:', err.message);
  console.log('\n💡 راهنمای عیب‌یابی:');
  console.log('   1. بررسی اتصال اینترنت');
  console.log('   2. چک کردن username/password در .env');
  console.log('   3. مطمئن شدن از باز بودن پورت', sshConfig.port);
  process.exit(1);
});

console.log('⏳ در حال اتصال به سرور...\n');
conn.connect(sshConfig);

// Timeout برای جلوگیری از hang
setTimeout(() => {
  console.log('\n⏱️ زمان اتصال به پایان رسید');
  console.log('❌ نمی‌توان به سرور متصل شد');
  process.exit(1);
}, 25000);
