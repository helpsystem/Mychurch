#!/usr/bin/env node

/**
 * 🔧 Fix Port Conflict - متوقف کردن process قدیمی
 */

require('dotenv').config({ path: './backend/.env' });
const { Client } = require('ssh2');

const sshConfig = {
  host: process.env.SSH_HOST,
  port: parseInt(process.env.SSH_PORT || '22'),
  username: process.env.SSH_USER,
  password: process.env.SSH_PASS,
  readyTimeout: 20000
};

console.log('🔧 در حال رفع مشکل Port Conflict...\n');

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ اتصال برقرار شد\n');
  
  const commands = [
    'pm2 list',
    'pm2 stop mychurch-backend',
    'pm2 delete mychurch-backend',
    'pm2 restart church-backend',
    'pm2 save',
    'pm2 list'
  ].join(' && ');
  
  conn.exec(commands, (err, stream) => {
    if (err) {
      console.log('❌ خطا:', err.message);
      conn.end();
      return;
    }

    stream.on('close', () => {
      console.log('\n✅ مشکل برطرف شد!');
      console.log('🚀 سرور church-backend در حال اجرا است');
      conn.end();
    });

    stream.on('data', (data) => {
      process.stdout.write(data.toString());
    });

    stream.stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
});

conn.on('error', (err) => {
  console.log('❌ خطا در اتصال:', err.message);
  process.exit(1);
});

conn.connect(sshConfig);
