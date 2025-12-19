#!/usr/bin/env node
/**
 * HiDrive WebDAV Bulk Upload Script
 * Uploads all MP3 files from local directory to HiDrive WebDAV storage
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const WEBDAV_URL = 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/worship/audio/kalameh';
const USERNAME = 'adminchurch';
const PASSWORD = 'SamanBbB1989bBb@';
const LOCAL_DIR = '/root/Mychurch/public/worship/audio/kalameh';

// Statistics
let total = 0;
let success = 0;
let failed = 0;
let count = 0;

// Get all MP3 files
const files = fs.readdirSync(LOCAL_DIR).filter(f => f.endsWith('.mp3'));
total = files.length;

console.log(`Found ${total} MP3 files to upload\n`);

// Upload function
function uploadFile(filename) {
  return new Promise((resolve, reject) => {
    const localPath = path.join(LOCAL_DIR, filename);
    const fileSize = fs.statSync(localPath).size;
    const encodedFilename = encodeURIComponent(filename);
    const remoteUrl = `${WEBDAV_URL}/${encodedFilename}`;
    
    // Parse URL
    const url = new URL(remoteUrl);
    const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
    
    // Read file
    const fileStream = fs.createReadStream(localPath);
    
    // HTTP request options
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Length': fileSize
      }
    };
    
    const req = https.request(options, (res) => {
      res.on('data', () => {}); // Consume response data
      
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 204) {
          resolve({ success: true, status: res.statusCode });
        } else {
          resolve({ success: false, status: res.statusCode });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    fileStream.pipe(req);
  });
}

// Upload all files sequentially
async function uploadAll() {
  for (const filename of files) {
    count++;
    
    try {
      const result = await uploadFile(filename);
      
      if (result.success) {
        success++;
        console.log(`[${count}/${total}] ✓ ${filename}`);
      } else {
        failed++;
        console.log(`[${count}/${total}] ✗ ${filename} (HTTP ${result.status})`);
      }
    } catch (error) {
      failed++;
      console.log(`[${count}/${total}] ✗ ${filename} - Error: ${error.message}`);
    }
    
    // Progress every 50 files
    if (count % 50 === 0) {
      const percent = Math.round((count / total) * 100);
      console.log(`\nProgress: ${count}/${total} (${percent}%) - Success: ${success}, Failed: ${failed}\n`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Upload Complete!');
  console.log(`Total: ${total}, Success: ${success}, Failed: ${failed}`);
  console.log('='.repeat(60));
}

// Start upload
uploadAll().catch(console.error);
