const ftp = require('basic-ftp');
const path = require('path');
const fs = require('fs');

// FTP Configuration for samanabyar.online
require('dotenv').config({ path: './backend/.env' });
const config = {
  host: process.env.FTP_HOST || 'samanabyar.online',
  user: process.env.FTP_USER || 'root',
  password: process.env.FTP_PASS,
  port: parseInt(process.env.FTP_PORT || '21'),
  secure: process.env.FTP_SECURE === 'true'
};

const localDir = path.join(__dirname, 'dist');
const remoteDir = process.env.FTP_BASE_DIR || '/public_html/Mychurch';

async function deploy() {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    console.log('🚀 شروع آپلود به سرور...');
    console.log(`📂 مسیر محلی: ${localDir}`);
    console.log(`🌐 مسیر سرور: ${remoteDir}`);

    // Connect to FTP server
    await client.access(config);
    console.log('✅ اتصال برقرار شد!');

    // Ensure remote directory exists
    try {
      await client.ensureDir(remoteDir);
    } catch (err) {
      console.log('⚠️ در حال ایجاد پوشه...');
      await client.mkdir(remoteDir);
    }

    // Clear remote directory
    console.log('🗑️ در حال پاک کردن فایل‌های قدیمی...');
    try {
      await client.clearWorkingDir();
    } catch (err) {
      console.log('⚠️ مشکلی در پاک کردن فایل‌ها رخ داد (ممکن است پوشه خالی باشد)');
    }

    // Upload dist directory
    console.log('📤 در حال آپلود فایل‌ها...');
    await client.uploadFromDir(localDir);

    console.log('');
    console.log('✨ آپلود با موفقیت انجام شد!');
    console.log('🌐 سایت شما در آدرس زیر در دسترس است:');
    console.log('   https://samanabyar.online/Mychurch/');
    console.log('');

  } catch (err) {
    console.error('❌ خطا در آپلود:', err.message);
    throw err;
  } finally {
    client.close();
  }
}

// Run deployment
deploy().catch(err => {
  console.error('❌ خطای کلی:', err);
  process.exit(1);
});
