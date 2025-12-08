#!/usr/bin/env node

/**
 * 🔄 Update Database URLs to HiDrive
 * تغییر URL های محلی به URL های HiDrive در دیتابیس
 */

require('dotenv').config({ path: './backend/.env' });
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

const HIDRIVE_BASE = process.env.HIDRIVE_PUBLIC_URL || 
  'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch';

// تنظیمات دیتابیس
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * لود mapping فایل‌های فارسی
 */
async function loadMapping() {
  try {
    const mappingPath = './public/hidrive_mapping.json';
    const data = await fs.readFile(mappingPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

/**
 * تبدیل URL محلی به HiDrive URL
 */
function convertUrl(localUrl, mapping = {}) {
  if (!localUrl || localUrl.startsWith('http')) {
    return localUrl; // Already external or null
  }

  // حذف slash اول
  const cleanPath = localUrl.startsWith('/') ? localUrl.substring(1) : localUrl;
  
  // استخراج نام فایل
  const filename = path.basename(cleanPath);
  
  // چک کردن mapping برای فایل‌های فارسی
  const mappedFile = Object.entries(mapping).find(
    ([_, data]) => data.original === filename
  );
  
  if (mappedFile) {
    // استفاده از safe name
    const [safeName, data] = mappedFile;
    return data.url;
  }
  
  // ساخت URL از path
  if (cleanPath.includes('worship/audio')) {
    return `${HIDRIVE_BASE}/worship/audio/${filename}`;
  } else if (cleanPath.includes('bible/data/timings')) {
    return `${HIDRIVE_BASE}/bible/timings/${filename}`;
  } else if (cleanPath.includes('bible/audio')) {
    return `${HIDRIVE_BASE}/bible/audio/${filename}`;
  } else if (cleanPath.includes('sermons/audio')) {
    return `${HIDRIVE_BASE}/sermons/audio/${filename}`;
  } else if (cleanPath.includes('sermons/videos')) {
    return `${HIDRIVE_BASE}/sermons/videos/${filename}`;
  } else if (cleanPath.includes('images')) {
    return `${HIDRIVE_BASE}/images/${filename}`;
  } else if (cleanPath.includes('documents')) {
    return `${HIDRIVE_BASE}/documents/${filename}`;
  }
  
  return localUrl; // Unknown path, keep original
}

/**
 * Update Worship Songs
 */
async function updateWorshipSongs(mapping) {
  console.log(`\n${colors.cyan}📀 Updating Worship Songs...${colors.reset}`);
  
  try {
    // دریافت آهنگ‌ها با URL محلی
    const result = await pool.query(
      `SELECT id, title, audiourl FROM worship_songs 
       WHERE audiourl IS NOT NULL 
       AND audiourl NOT LIKE 'http%'
       ORDER BY id`
    );

    const songs = result.rows;
    console.log(`   Found ${songs.length} songs with local URLs`);

    let updated = 0;
    let failed = 0;

    for (const song of songs) {
      const newUrl = convertUrl(song.audiourl, mapping);
      
      if (newUrl !== song.audiourl) {
        try {
          await pool.query(
            'UPDATE worship_songs SET audiourl = $1 WHERE id = $2',
            [newUrl, song.id]
          );
          
          const title = song.title?.fa || song.title?.en || `Song ${song.id}`;
          console.log(`   ${colors.green}✓${colors.reset} ${title}`);
          updated++;
        } catch (error) {
          console.log(`   ${colors.red}✗${colors.reset} Song ${song.id}: ${error.message}`);
          failed++;
        }
      }
    }

    console.log(`   ${colors.green}✅ Updated: ${updated}, ❌ Failed: ${failed}${colors.reset}`);
    return { updated, failed };
  } catch (error) {
    console.log(`   ${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return { updated: 0, failed: 0 };
  }
}

/**
 * Update Bible Audio Files
 */
async function updateBibleAudio(mapping) {
  console.log(`\n${colors.cyan}📖 Updating Bible Audio Files...${colors.reset}`);
  
  try {
    // Update timing URLs
    const timingResult = await pool.query(
      `UPDATE bible_audio_files 
       SET timing_url = REPLACE(
         timing_url, 
         '/bible/data/timings/', 
         '${HIDRIVE_BASE}/bible/timings/'
       )
       WHERE timing_url LIKE '/bible/data/timings/%'
       RETURNING id`
    );
    
    console.log(`   ${colors.green}✓${colors.reset} Updated ${timingResult.rowCount} timing URLs`);

    // Update audio URLs
    const audioResult = await pool.query(
      `UPDATE bible_audio_files 
       SET audio_url = REPLACE(
         audio_url, 
         '/bible/audio/', 
         '${HIDRIVE_BASE}/bible/audio/'
       )
       WHERE audio_url LIKE '/bible/audio/%'
       RETURNING id`
    );
    
    console.log(`   ${colors.green}✓${colors.reset} Updated ${audioResult.rowCount} audio URLs`);

    return { 
      updated: timingResult.rowCount + audioResult.rowCount, 
      failed: 0 
    };
  } catch (error) {
    console.log(`   ${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return { updated: 0, failed: 0 };
  }
}

/**
 * Update Sermons
 */
async function updateSermons() {
  console.log(`\n${colors.cyan}🎤 Updating Sermons...${colors.reset}`);
  
  try {
    // Check if sermons table exists
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sermons'
      )`
    );

    if (!tableCheck.rows[0].exists) {
      console.log(`   ${colors.yellow}⊘${colors.reset} Sermons table doesn't exist, skipping`);
      return { updated: 0, failed: 0 };
    }

    // Update audio URLs
    const audioResult = await pool.query(
      `UPDATE sermons 
       SET audio_url = REPLACE(
         audio_url, 
         '/sermons/audio/', 
         '${HIDRIVE_BASE}/sermons/audio/'
       )
       WHERE audio_url LIKE '/sermons/audio/%'
       RETURNING id`
    );
    
    console.log(`   ${colors.green}✓${colors.reset} Updated ${audioResult.rowCount} audio URLs`);

    // Update video URLs
    const videoResult = await pool.query(
      `UPDATE sermons 
       SET video_url = REPLACE(
         video_url, 
         '/sermons/videos/', 
         '${HIDRIVE_BASE}/sermons/videos/'
       )
       WHERE video_url LIKE '/sermons/videos/%'
       RETURNING id`
    );
    
    console.log(`   ${colors.green}✓${colors.reset} Updated ${videoResult.rowCount} video URLs`);

    return { 
      updated: audioResult.rowCount + videoResult.rowCount, 
      failed: 0 
    };
  } catch (error) {
    console.log(`   ${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return { updated: 0, failed: 0 };
  }
}

/**
 * Update Events
 */
async function updateEvents() {
  console.log(`\n${colors.cyan}📅 Updating Events...${colors.reset}`);
  
  try {
    const result = await pool.query(
      `UPDATE events 
       SET image_url = REPLACE(
         image_url, 
         '/images/', 
         '${HIDRIVE_BASE}/images/'
       )
       WHERE image_url LIKE '/images/%'
       RETURNING id`
    );
    
    console.log(`   ${colors.green}✓${colors.reset} Updated ${result.rowCount} image URLs`);

    return { updated: result.rowCount, failed: 0 };
  } catch (error) {
    console.log(`   ${colors.red}❌ Error: ${error.message}${colors.reset}`);
    return { updated: 0, failed: 0 };
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`
${colors.cyan}${colors.bright}╔════════════════════════════════════════════╗
║   🔄 Update Database URLs to HiDrive       ║
╚════════════════════════════════════════════╝${colors.reset}
`);

  console.log(`${colors.cyan}🌐 HiDrive Base URL:${colors.reset}`);
  console.log(`   ${HIDRIVE_BASE}\n`);

  try {
    // لود mapping
    console.log(`${colors.cyan}📋 Loading mapping file...${colors.reset}`);
    const mapping = await loadMapping();
    console.log(`   Found ${Object.keys(mapping).length} mapped files`);

    // Update هر دسته
    const results = {
      worship: await updateWorshipSongs(mapping),
      bible: await updateBibleAudio(mapping),
      sermons: await updateSermons(),
      events: await updateEvents()
    };

    // خلاصه
    const totalUpdated = Object.values(results).reduce((sum, r) => sum + r.updated, 0);
    const totalFailed = Object.values(results).reduce((sum, r) => sum + r.failed, 0);

    console.log(`
${colors.cyan}${colors.bright}╔════════════════════════════════════════════╗
║            📊 Summary                      ║
╚════════════════════════════════════════════╝${colors.reset}

${colors.green}✅ Total Updated: ${totalUpdated}${colors.reset}
${colors.red}❌ Total Failed:  ${totalFailed}${colors.reset}

${colors.cyan}📝 Next Steps:${colors.reset}
1. Test file access from website
2. Monitor for any 404 errors
3. Remove old files from server (after testing)
`);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.log(`\n${colors.red}❌ Update failed: ${error.message}${colors.reset}`);
    await pool.end();
    process.exit(1);
  }
}

main();
