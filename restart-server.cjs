#!/usr/bin/env node

/**
 * 🔄 Restart Server - ریستارت سریع سرور
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

const projectPath = process.env.SSH_PROJECT_PATH || '/root/Mychurch';

console.log('🔄 ریستارت سرور...\n');

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ اتصال برقرار شد\n');
  
  const commands = [
    `cd ${projectPath}/backend`,
    'pm2 stop all',
    'pm2 delete all',
    'pm2 start server.js --name church-backend',
    'pm2 save',
    'sleep 2',
    'pm2 list',
    'echo "\\n--- بررسی سلامت ---"',
    'curl -s http://localhost:3001/api/health || echo "سرور هنوز آماده نیست"'
  ].join(' && ');
  
  conn.exec(commands, (err, stream) => {
    if (err) {
      console.log('❌ خطا:', err.message);
      conn.end();
      return;
    }

    stream.on('close', (code) => {
      console.log('\n✅ ریستارت کامل شد!');
      console.log('\n🌐 سایت: https://samanabyar.online');
      console.log('📊 API Health: https://samanabyar.online/api/health');
      conn.end();
      process.exit(code);
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
