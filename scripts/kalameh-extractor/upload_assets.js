/**
 * Worship Songs Asset Uploader
 * Uploads extracted songs data and audio files to remote server via SFTP
 * 
 * Uses SSH credentials from root .env file
 */

import dotenv from 'dotenv';
import Client from 'ssh2-sftp-client';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (2 levels up)
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

console.log(`\n📋 Loading configuration from: ${envPath}`);

// Configuration from environment
const config = {
  // Use SSH credentials from main .env
  host: process.env.SSH_HOST || process.env.SERVER_HOST || 'localhost',
  port: parseInt(process.env.SSH_PORT || process.env.SERVER_PORT) || 22,
  username: process.env.SSH_USER || process.env.SERVER_USER || 'root',
  password: process.env.SSH_pass || process.env.SERVER_PASS,
  privateKey: process.env.SERVER_KEY ? fs.readFileSync(process.env.SERVER_KEY) : undefined,
  
  localExportDir: process.env.LOCAL_EXPORT_DIR || path.join(__dirname, 'export'),
  remoteBaseDir: process.env.REMOTE_BASE_DIR || '/root/public_html/worship-songs',
  
  uploadAudio: process.env.UPLOAD_AUDIO === 'true',
  audioSourceDir: process.env.AUDIO_SOURCE_DIR || '',
  remoteAudioDir: process.env.REMOTE_AUDIO_DIR || '/root/public_html/worship-songs/audio'
};

const sftp = new Client();

/**
 * Ensure remote directory exists
 */
async function ensureRemoteDir(client, remotePath) {
  try {
    const exists = await client.exists(remotePath);
    if (!exists) {
      console.log(`📁 Creating remote directory: ${remotePath}`);
      await client.mkdir(remotePath, true);
    }
  } catch (error) {
    console.error(`❌ Failed to create directory ${remotePath}:`, error.message);
    throw error;
  }
}

/**
 * Upload a single file with progress
 */
async function uploadFile(client, localPath, remotePath) {
  try {
    const stats = fs.statSync(localPath);
    const fileName = path.basename(localPath);
    
    console.log(`⬆️  Uploading ${fileName} (${(stats.size / 1024).toFixed(2)} KB)...`);
    
    await client.put(localPath, remotePath);
    console.log(`   ✅ Uploaded: ${remotePath}`);
  } catch (error) {
    console.error(`   ❌ Failed to upload ${localPath}:`, error.message);
  }
}

/**
 * Upload all export files (JSON, CSV, SQL)
 */
async function uploadExportFiles(client) {
  console.log('\n📦 Uploading export files...');
  
  const exportFiles = [
    'worship_songs_index.json',
    'worship_songs_flat.json',
    'worship_songs.csv',
    'worship_songs.sql',
    'parse_log.txt'
  ];
  
  await ensureRemoteDir(client, config.remoteBaseDir);
  
  for (const file of exportFiles) {
    const localPath = path.join(config.localExportDir, file);
    
    if (fs.existsSync(localPath)) {
      const remotePath = path.posix.join(config.remoteBaseDir, file);
      await uploadFile(client, localPath, remotePath);
    } else {
      console.log(`⚠️  File not found, skipping: ${file}`);
    }
  }
}

/**
 * Upload audio files referenced in the exported data
 */
async function uploadAudioFiles(client) {
  if (!config.uploadAudio || !config.audioSourceDir) {
    console.log('\n⏭️  Audio upload skipped (UPLOAD_AUDIO=false or no AUDIO_SOURCE_DIR)');
    return;
  }
  
  console.log('\n🎵 Uploading audio files...');
  
  // Read the exported data to find audio files
  const dataPath = path.join(config.localExportDir, 'worship_songs_flat.json');
  
  if (!fs.existsSync(dataPath)) {
    console.log('⚠️  worship_songs_flat.json not found, skipping audio upload');
    return;
  }
  
  const songs = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const audioFiles = new Set();
  
  // Collect unique audio file paths
  songs.forEach(song => {
    if (song.mp3_local && fs.existsSync(song.mp3_local)) {
      audioFiles.add(song.mp3_local);
    }
  });
  
  if (audioFiles.size === 0) {
    console.log('ℹ️  No local audio files found in the export data');
    return;
  }
  
  await ensureRemoteDir(client, config.remoteAudioDir);
  
  console.log(`📊 Found ${audioFiles.size} unique audio files`);
  
  let uploaded = 0;
  let failed = 0;
  
  for (const localPath of audioFiles) {
    try {
      const fileName = path.basename(localPath);
      const remotePath = path.posix.join(config.remoteAudioDir, fileName);
      
      await uploadFile(client, localPath, remotePath);
      uploaded++;
    } catch (error) {
      failed++;
    }
  }
  
  console.log(`\n📊 Audio upload summary: ${uploaded} uploaded, ${failed} failed`);
}

/**
 * Main upload function
 */
async function main() {
  console.log('=' .repeat(80));
  console.log('🚀 Worship Songs Asset Uploader');
  console.log('='.repeat(80));
  console.log('\n📋 Configuration:');
  console.log(`   🌐 Host: ${config.host}:${config.port}`);
  console.log(`   👤 User: ${config.username}`);
  console.log(`   🔑 Auth: ${config.password ? '✓ Password' : '✓ SSH Key'}`);
  console.log(`   📂 Local Export: ${config.localExportDir}`);
  console.log(`   📁 Remote Base: ${config.remoteBaseDir}`);
  console.log(`   🎵 Upload Audio: ${config.uploadAudio ? '✓ Yes' : '✗ No'}`);
  
  // Validate credentials
  if (!config.host || config.host === 'localhost') {
    console.error('\n❌ Error: SSH_HOST not configured in .env file');
    console.error('   Please check your .env file in project root');
    process.exit(1);
  }
  
  if (!config.password && !config.privateKey) {
    console.error('\n❌ Error: No authentication method configured');
    console.error('   Please set SSH_pass or SERVER_KEY in .env file');
    process.exit(1);
  }
  
  try {
    // Connect to SFTP server
    console.log('\n🔌 Connecting to SFTP server...');
    await sftp.connect({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      privateKey: config.privateKey,
      readyTimeout: 30000
    });
    console.log('✅ Connected successfully to ' + config.host);
    
    // Upload export files
    await uploadExportFiles(sftp);
    
    // Upload audio files if enabled
    await uploadAudioFiles(sftp);
    
    console.log('\n✅ Upload complete!');
    console.log('🌐 Files should be accessible at: http://' + process.env.DOMAIN + '/worship-songs/');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
    if (error.message.includes('connect')) {
      console.error('   Check your SSH credentials and server address');
      console.error('   Host: ' + config.host);
      console.error('   Port: ' + config.port);
    }
    console.error('\n' + error.stack);
    process.exit(1);
  } finally {
    await sftp.end();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { uploadExportFiles, uploadAudioFiles };
