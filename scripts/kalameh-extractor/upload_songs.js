/**
 * Upload Songs to Server via FTP
 * Deploys exported song data and media files
 */

const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const FTP_CONFIG = {
  host: process.env.FTP_HOST || 'mi3-cl8-its2.a2hosting.com',
  user: process.env.FTP_USER,
  password: process.env.FTP_PASS,
  port: parseInt(process.env.FTP_PORT) || 21,
  secure: process.env.FTP_SECURE === 'true'
};

const LOCAL_EXPORT_DIR = path.join(__dirname, '..', '..', 'export');
const REMOTE_BASE_DIR = process.env.FTP_BASE_DIR || 'public_html/songs';

async function uploadSongs() {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    console.log('🔌 Connecting to FTP server...');
    await client.access(FTP_CONFIG);
    console.log('✅ Connected successfully!');

    // Change to base directory
    await client.ensureDir(REMOTE_BASE_DIR);
    console.log(`📂 Changed to directory: ${REMOTE_BASE_DIR}`);

    // Upload JSON index
    const jsonFile = path.join(LOCAL_EXPORT_DIR, 'songs_index.json');
    if (fs.existsSync(jsonFile)) {
      console.log('📤 Uploading songs_index.json...');
      await client.uploadFrom(jsonFile, 'songs_index.json');
      console.log('✅ Uploaded songs_index.json');
    }

    // Upload CSV manifest
    const csvFile = path.join(LOCAL_EXPORT_DIR, 'songs_manifest.csv');
    if (fs.existsSync(csvFile)) {
      console.log('📤 Uploading songs_manifest.csv...');
      await client.uploadFrom(csvFile, 'songs_manifest.csv');
      console.log('✅ Uploaded songs_manifest.csv');
    }

    // Upload SQLite database
    const dbFile = path.join(LOCAL_EXPORT_DIR, 'songs.db');
    if (fs.existsSync(dbFile)) {
      console.log('📤 Uploading songs.db...');
      await client.uploadFrom(dbFile, 'songs.db');
      console.log('✅ Uploaded songs.db');
    }

    // Upload TTS sync files if they exist
    const ttsSyncDir = path.join(LOCAL_EXPORT_DIR, 'tts_sync');
    if (fs.existsSync(ttsSyncDir)) {
      console.log('📤 Uploading TTS sync files...');
      await client.ensureDir('tts_sync');
      await client.uploadFromDir(ttsSyncDir, 'tts_sync');
      console.log('✅ Uploaded TTS sync files');
    }

    console.log('\n✅ All files uploaded successfully!');
    console.log(`📍 Files available at: https://${process.env.DOMAIN}/songs/`);

  } catch (error) {
    console.error('❌ Upload failed:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

// Run if executed directly
if (require.main === module) {
  if (!FTP_CONFIG.user || !FTP_CONFIG.password) {
    console.error('❌ FTP credentials not found in .env file');
    console.log('   Please set FTP_USER and FTP_PASS environment variables');
    process.exit(1);
  }

  uploadSongs();
}

module.exports = { uploadSongs };
