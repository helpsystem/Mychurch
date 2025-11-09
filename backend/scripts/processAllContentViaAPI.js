// backend/scripts/processAllContentViaAPI.js
// پردازش دسته‌ای از طریق API endpoints

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';
const ADMIN_EMAIL = 'admin@mychurch.com';
const ADMIN_PASSWORD = 'MyChurchSecureAdmin2024!';

let authToken = null;

// Login and get token
async function login() {
  console.log('🔐 ورود به سیستم...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    const data = await response.json();
    
    if (data.token) {
      authToken = data.token;
      console.log('✅ ورود موفق\n');
      return true;
    } else {
      console.log('❌ خطا در ورود:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ خطا در اتصال:', error.message);
    return false;
  }
}

// Get all worship songs
async function getAllWorshipSongs() {
  console.log('📥 دریافت لیست سرودها...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/worship-songs`, {
      headers: { 
        'Authorization': `Bearer ${authToken}`
      }
    });

    const songs = await response.json();
    console.log(`✅ ${songs.length} سرود یافت شد\n`);
    return songs;
  } catch (error) {
    console.log('❌ خطا:', error.message);
    return [];
  }
}

// Process single worship song
async function processWorshipSong(song) {
  const title = song.title?.fa || song.title?.en || 'Unknown';
  console.log(`\n🎵 پردازش: ${title}`);
  console.log(`   ID: ${song.id}`);
  console.log(`   Audio: ${song.audioUrl || 'ندارد'}`);
  console.log(`   Timing: ${song.hasTiming ? '✅ دارد' : '❌ ندارد'}`);

  // Skip if already has timing
  if (song.hasTiming) {
    console.log(`   ⏭️  قبلاً پردازش شده - رد می‌شود`);
    return { success: true, skipped: true };
  }

  // Skip if no audio URL
  if (!song.audioUrl) {
    console.log(`   ⚠️  فایل صوتی ندارد - رد می‌شود`);
    return { success: false, reason: 'No audio' };
  }

  // Skip if no lyrics
  if (!song.lyrics || !song.lyrics.en) {
    console.log(`   ⚠️  متن انگلیسی ندارد - رد می‌شود`);
    return { success: false, reason: 'No lyrics' };
  }

  try {
    console.log(`   📥 دانلود صوتی...`);
    
    // Download audio
    const audioResponse = await fetch(song.audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`دانلود ناموفق: ${audioResponse.statusText}`);
    }

    const audioBlob = await audioResponse.blob();
    const audioBuffer = await audioBlob.arrayBuffer();
    const audioSize = (audioBuffer.byteLength / 1024 / 1024).toFixed(2);
    console.log(`   ✅ دانلود شد: ${audioSize} MB`);

    // Check size limit
    if (audioBuffer.byteLength > 20 * 1024 * 1024) {
      console.log(`   ⚠️  فایل بزرگ‌تر از 20MB - از fallback استفاده می‌شود`);
      // We'll still send it and let backend handle fallback
    }

    // Create FormData
    const FormData = require('form-data');
    const formData = new FormData();
    
    formData.append('audio', Buffer.from(audioBuffer), {
      filename: 'audio.mp3',
      contentType: 'audio/mpeg'
    });
    formData.append('finglishText', song.lyrics.en);
    formData.append('persianText', song.lyrics.fa || '');
    formData.append('worshipSongId', song.id.toString());

    console.log(`   🤖 ارسال به AI برای پردازش...`);

    // Send to processing API
    const processResponse = await fetch(`${BASE_URL}/api/audio-sync/process-worship`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    const result = await processResponse.json();

    if (result.success) {
      console.log(`   ✅ موفق: ${result.data.wordCount} کلمه پردازش شد`);
      return { success: true, wordCount: result.data.wordCount };
    } else {
      console.log(`   ❌ خطا: ${result.error}`);
      return { success: false, error: result.error };
    }

  } catch (error) {
    console.log(`   ❌ خطا: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main function
async function main() {
  console.log('\n🚀 ===============================');
  console.log('🚀 پردازش دسته‌ای سرودهای پرستشی');
  console.log('🚀 ===============================');
  console.log(`📅 تاریخ: ${new Date().toLocaleString('fa-IR')}\n`);

  // Login
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('\n❌ خطا در ورود - خروج از برنامه\n');
    process.exit(1);
  }

  // Get all songs
  const songs = await getAllWorshipSongs();
  
  if (songs.length === 0) {
    console.log('\n⚠️  هیچ سرودی یافت نشد\n');
    return;
  }

  // Filter songs without timing
  const songsToProcess = songs.filter(s => !s.hasTiming && s.audioUrl);
  console.log(`📊 سرودهای نیازمند پردازش: ${songsToProcess.length}\n`);

  if (songsToProcess.length === 0) {
    console.log('✅ همه سرودها قبلاً پردازش شده‌اند!\n');
    return;
  }

  // Process each song
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < songsToProcess.length; i++) {
    const song = songsToProcess[i];
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[${i + 1}/${songsToProcess.length}]`);
    
    const result = await processWorshipSong(song);
    
    if (result.skipped) {
      skippedCount++;
    } else if (result.success) {
      successCount++;
    } else {
      failCount++;
    }

    // Rate limiting - wait 3 seconds between requests
    if (i < songsToProcess.length - 1) {
      console.log(`\n⏱️  صبر 3 ثانیه تا درخواست بعدی...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Summary
  console.log('\n\n🎉 ===============================');
  console.log('🎉 پردازش کامل شد!');
  console.log('🎉 ===============================');
  console.log(`\n📊 خلاصه نتایج:`);
  console.log(`   ✅ موفق: ${successCount}`);
  console.log(`   ❌ ناموفق: ${failCount}`);
  console.log(`   ⏭️  رد شده: ${skippedCount}`);
  console.log(`   📈 کل: ${songsToProcess.length}\n`);
}

// Run
main().catch(console.error);
