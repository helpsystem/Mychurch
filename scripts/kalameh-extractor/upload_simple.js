/**
 * Simple Upload Test - Worship Songs to Server
 */

import dotenv from 'dotenv';
import Client from 'ssh2-sftp-client';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
const envPath = path.resolve(__dirname, '../../.env');
console.log(`\n📋 Loading configuration from: ${envPath}\n`);
dotenv.config({ path: envPath });

// Configuration
const config = {
  host: process.env.SSH_HOST,
  port: parseInt(process.env.SSH_PORT) || 22,
  username: process.env.SSH_USER,
  password: process.env.SSH_pass,
  localExportDir: path.join(__dirname, 'export'),
  remoteBaseDir: '/var/www/html/worship-songs'
};

console.log('================================================================================');
console.log('🚀 Worship Songs Uploader');
console.log('================================================================================');
console.log(`🌐 Host: ${config.host}:${config.port}`);
console.log(`👤 User: ${config.username}`);
console.log(`🔑 Password: ${config.password ? '✓ Set' : '✗ Missing'}`);
console.log(`📂 Local: ${config.localExportDir}`);
console.log(`📁 Remote: ${config.remoteBaseDir}`);
console.log('================================================================================\n');

// Validate
if (!config.host || !config.password) {
  console.error('❌ Missing SSH credentials in .env file!');
  process.exit(1);
}

// Check local files
const files = [
  'index.html',
  'songs_index.json',
  'songs_flat.json',
  'songs_export.csv',
  'songs_schema.sql'
];

console.log('📦 Checking local files...');
for (const file of files) {
  const filePath = path.join(config.localExportDir, file);
  if (fs.existsSync(filePath)) {
    const size = (fs.statSync(filePath).size / 1024).toFixed(2);
    console.log(`   ✓ ${file} (${size} KB)`);
  } else {
    console.log(`   ✗ ${file} - NOT FOUND`);
  }
}

// Upload
const sftp = new Client();

async function upload() {
  try {
    console.log('\n🔌 Connecting to SFTP server...');
    await sftp.connect({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      readyTimeout: 30000,
      retries: 2
    });
    console.log('✅ Connected to ' + config.host + '\n');
    
    // Create remote directory
    console.log('📁 Creating remote directory...');
    const exists = await sftp.exists(config.remoteBaseDir);
    if (!exists) {
      await sftp.mkdir(config.remoteBaseDir, true);
      console.log('   ✓ Created: ' + config.remoteBaseDir);
    } else {
      console.log('   ✓ Exists: ' + config.remoteBaseDir);
    }
    
    // Upload files
    console.log('\n📤 Uploading files...\n');
    let uploaded = 0;
    let failed = 0;
    
    for (const file of files) {
      const localPath = path.join(config.localExportDir, file);
      if (!fs.existsSync(localPath)) continue;
      
      const remotePath = `${config.remoteBaseDir}/${file}`;
      const size = (fs.statSync(localPath).size / 1024).toFixed(2);
      
      try {
        process.stdout.write(`   Uploading ${file} (${size} KB)... `);
        await sftp.put(localPath, remotePath);
        console.log('✓');
        uploaded++;
      } catch (err) {
        console.log('✗ ' + err.message);
        failed++;
      }
    }
    
    console.log('\n================================================================================');
    console.log(`✅ Upload Complete!`);
    console.log(`   📊 Uploaded: ${uploaded} files`);
    if (failed > 0) console.log(`   ❌ Failed: ${failed} files`);
    console.log(`   🌐 Access at: http://${process.env.DOMAIN}/worship-songs/songs_index.json`);
    console.log('================================================================================\n');
    
  } catch (error) {
    console.error('\n❌ Upload failed!');
    console.error('   Error:', error.message);
    if (error.message.includes('ENOTFOUND') || error.message.includes('EHOSTUNREACH')) {
      console.error('   Check: SSH_HOST address is correct');
    } else if (error.message.includes('Authentication')) {
      console.error('   Check: SSH_USER and SSH_pass are correct');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('   Check: SSH_PORT (currently ' + config.port + ') is correct');
    }
    console.error('\n   Full error:', error);
    process.exit(1);
  } finally {
    await sftp.end();
  }
}

// Run
upload().catch(console.error);
