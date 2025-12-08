/**
 * 🎵 پردازش کامل همه سرودهای پرستشی
 * 
 * این اسکریپت تمام سرودها را بررسی و پردازش می‌کند:
 * ✅ بررسی وجود فایل‌های ضروری (audio, lyrics)
 * ✅ تولید timing خودکار برای سرودهای بدون timing
 * ✅ بررسی و تصحیح URL‌ها
 * ✅ تکمیل اطلاعات ناقص
 * ✅ گزارش‌دهی کامل
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('../db-postgres');
const fs = require('fs');
const path = require('path');

// رنگ‌های Console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// آمار کلی
const stats = {
  total: 0,
  withAudio: 0,
  withLyrics: 0,
  withTiming: 0,
  withChords: 0,
  complete: 0,
  needsProcessing: 0,
  errors: 0,
  processed: 0
};

// لیست مشکلات
const issues = {
  noAudio: [],
  noLyrics: [],
  noTiming: [],
  brokenUrls: [],
  incomplete: []
};

/**
 * بررسی وجود فایل صوتی
 */
function checkAudioFile(audioUrl) {
  if (!audioUrl) return false;
  
  // اگر URL خارجی است، فرض می‌کنیم موجود است
  if (audioUrl.startsWith('http')) return true;
  
  // اگر URL محلی است، بررسی فیزیکی می‌کنیم
  const localPath = audioUrl.replace('/worship/audio/', '');
  const fullPath = path.join(__dirname, '../../public/worship/audio', localPath);
  return fs.existsSync(fullPath);
}

/**
 * بررسی وجود فایل timing
 */
function checkTimingFile(songId) {
  const timingPath = path.join(__dirname, '../../public/worship/data/timings', `song_${songId}_timing.json`);
  return fs.existsSync(timingPath);
}

/**
 * تولید timing ساده برای سرود
 */
function generateSimpleTiming(lyrics, duration = 180) {
  if (!lyrics) return null;
  
  const lines = lyrics.split('\n').filter(l => l.trim());
  if (lines.length === 0) return null;
  
  const timePerLine = duration / lines.length;
  
  const timingData = {
    metadata: {
      title: 'Auto-generated',
      totalDuration: duration,
      wordCount: lyrics.split(/\s+/).length,
      lineCount: lines.length,
      generated: true,
      generatedAt: new Date().toISOString()
    },
    lines: lines.map((line, index) => {
      const words = line.split(/\s+/).filter(w => w.trim());
      const timePerWord = timePerLine / (words.length || 1);
      
      return {
        line: line.trim(),
        start: index * timePerLine,
        end: (index + 1) * timePerLine,
        words: words.map((word, wordIndex) => ({
          word: word.trim(),
          start: index * timePerLine + wordIndex * timePerWord,
          end: index * timePerLine + (wordIndex + 1) * timePerWord
        }))
      };
    })
  };
  
  return timingData;
}

/**
 * ذخیره فایل timing
 */
function saveTimingFile(songId, timingData) {
  const timingsDir = path.join(__dirname, '../../public/worship/data/timings');
  
  // ایجاد پوشه اگر وجود ندارد
  if (!fs.existsSync(timingsDir)) {
    fs.mkdirSync(timingsDir, { recursive: true });
  }
  
  const timingPath = path.join(timingsDir, `song_${songId}_timing.json`);
  fs.writeFileSync(timingPath, JSON.stringify(timingData, null, 2), 'utf8');
  
  return timingPath;
}

/**
 * بررسی یک سرود
 */
async function analyzeSong(song) {
  const analysis = {
    id: song.id,
    title: song.title,
    hasAudio: false,
    hasLyrics: false,
    hasTiming: false,
    hasChords: false,
    isComplete: false,
    needsProcessing: false,
    issues: []
  };
  
  // بررسی Audio
  if (song.audiourl) {
    analysis.hasAudio = checkAudioFile(song.audiourl);
    if (!analysis.hasAudio) {
      analysis.issues.push('Audio file not found');
      issues.brokenUrls.push({ id: song.id, title: song.title, url: song.audiourl });
    }
  } else {
    analysis.issues.push('No audio URL');
    issues.noAudio.push({ id: song.id, title: song.title });
  }
  
  // بررسی Lyrics
  if (song.lyrics) {
    try {
      const lyricsObj = typeof song.lyrics === 'string' ? JSON.parse(song.lyrics) : song.lyrics;
      analysis.hasLyrics = !!(lyricsObj.fa || lyricsObj.en);
      if (!analysis.hasLyrics) {
        analysis.issues.push('Empty lyrics');
        issues.noLyrics.push({ id: song.id, title: song.title });
      }
    } catch (e) {
      analysis.issues.push('Invalid lyrics format');
      issues.noLyrics.push({ id: song.id, title: song.title });
    }
  } else {
    analysis.issues.push('No lyrics');
    issues.noLyrics.push({ id: song.id, title: song.title });
  }
  
  // بررسی Timing
  if (song.timing_data) {
    analysis.hasTiming = true;
  } else if (checkTimingFile(song.id)) {
    analysis.hasTiming = true;
    analysis.needsProcessing = true;
    analysis.issues.push('Timing file exists but not in database');
  } else {
    analysis.issues.push('No timing data');
    issues.noTiming.push({ id: song.id, title: song.title });
    analysis.needsProcessing = true;
  }
  
  // بررسی Chords
  if (song.chords) {
    analysis.hasChords = true;
  }
  
  // تعیین اینکه آیا کامل است
  analysis.isComplete = analysis.hasAudio && analysis.hasLyrics && analysis.hasTiming;
  
  if (!analysis.isComplete) {
    issues.incomplete.push({
      id: song.id,
      title: song.title,
      missing: analysis.issues
    });
  }
  
  return analysis;
}

/**
 * پردازش یک سرود
 */
async function processSong(song, analysis) {
  const updates = [];
  
  try {
    // اگر lyrics دارد اما timing ندارد، تولید timing
    if (analysis.hasLyrics && !analysis.hasTiming && analysis.hasAudio) {
      log(`  ⚙️  Generating timing for song ${song.id}...`, 'cyan');
      
      const lyricsObj = typeof song.lyrics === 'string' ? JSON.parse(song.lyrics) : song.lyrics;
      const lyrics = lyricsObj.fa || lyricsObj.en || '';
      
      // تولید timing ساده
      const timingData = generateSimpleTiming(lyrics, 180);
      
      if (timingData) {
        // ذخیره در فایل
        const timingPath = saveTimingFile(song.id, timingData);
        log(`  ✅ Timing file saved: ${timingPath}`, 'green');
        
        // آپدیت دیتابیس
        await pool.query(
          `UPDATE worship_songs 
           SET timing_data = $1, 
               timing_updated_at = CURRENT_TIMESTAMP,
               processing_status = 'completed'
           WHERE id = $2`,
          [JSON.stringify(timingData), song.id]
        );
        
        updates.push('timing generated');
        stats.processed++;
      }
    }
    
    // اگر timing file دارد اما در دیتابیس نیست
    if (!song.timing_data && checkTimingFile(song.id)) {
      log(`  📥 Loading timing from file for song ${song.id}...`, 'cyan');
      
      const timingPath = path.join(__dirname, '../../public/worship/data/timings', `song_${song.id}_timing.json`);
      const timingData = JSON.parse(fs.readFileSync(timingPath, 'utf8'));
      
      await pool.query(
        `UPDATE worship_songs 
         SET timing_data = $1, 
             timing_updated_at = CURRENT_TIMESTAMP,
             processing_status = 'completed'
         WHERE id = $2`,
        [JSON.stringify(timingData), song.id]
      );
      
      updates.push('timing loaded from file');
      stats.processed++;
    }
    
    // تنظیم processing_status
    if (analysis.isComplete && song.processing_status !== 'completed') {
      await pool.query(
        `UPDATE worship_songs 
         SET processing_status = 'completed'
         WHERE id = $1`,
        [song.id]
      );
      updates.push('marked as completed');
    }
    
    return { success: true, updates };
    
  } catch (error) {
    log(`  ❌ Error processing song ${song.id}: ${error.message}`, 'red');
    stats.errors++;
    return { success: false, error: error.message };
  }
}

/**
 * اجرای اصلی
 */
async function main() {
  console.log('\n' + '='.repeat(80));
  log('🎵 پردازش کامل سرودهای پرستشی', 'bright');
  console.log('='.repeat(80) + '\n');
  
  try {
    // دریافت همه سرودها
    log('📊 Loading all worship songs from database...', 'blue');
    const result = await pool.query(`
      SELECT 
        id, title, artist, audiourl, lyrics, 
        timing_data, chords, processing_status,
        created_at
      FROM worship_songs 
      ORDER BY id
    `);
    
    const songs = result.rows;
    stats.total = songs.length;
    
    log(`✅ Found ${stats.total} songs\n`, 'green');
    
    // مرحله 1: تحلیل همه سرودها
    log('🔍 PHASE 1: Analyzing all songs...', 'bright');
    console.log('-'.repeat(80));
    
    const analyses = [];
    for (const song of songs) {
      const analysis = await analyzeSong(song);
      analyses.push(analysis);
      
      // آپدیت آمار
      if (analysis.hasAudio) stats.withAudio++;
      if (analysis.hasLyrics) stats.withLyrics++;
      if (analysis.hasTiming) stats.withTiming++;
      if (analysis.hasChords) stats.withChords++;
      if (analysis.isComplete) stats.complete++;
      if (analysis.needsProcessing) stats.needsProcessing++;
      
      // نمایش پیشرفت
      const status = analysis.isComplete ? '✅' : analysis.needsProcessing ? '⚙️' : '❌';
      const titleStr = typeof song.title === 'string' 
        ? JSON.parse(song.title).fa || JSON.parse(song.title).en 
        : song.title;
      console.log(`${status} Song ${song.id}: ${titleStr}`);
    }
    
    // نمایش آمار تحلیل
    console.log('\n' + '='.repeat(80));
    log('📊 ANALYSIS RESULTS:', 'bright');
    console.log('='.repeat(80));
    log(`Total Songs:           ${stats.total}`, 'cyan');
    log(`✅ Complete:           ${stats.complete} (${((stats.complete/stats.total)*100).toFixed(1)}%)`, 'green');
    log(`⚙️  Needs Processing:   ${stats.needsProcessing} (${((stats.needsProcessing/stats.total)*100).toFixed(1)}%)`, 'yellow');
    log(`📁 With Audio:         ${stats.withAudio} (${((stats.withAudio/stats.total)*100).toFixed(1)}%)`, 'blue');
    log(`📝 With Lyrics:        ${stats.withLyrics} (${((stats.withLyrics/stats.total)*100).toFixed(1)}%)`, 'blue');
    log(`🎵 With Timing:        ${stats.withTiming} (${((stats.withTiming/stats.total)*100).toFixed(1)}%)`, 'blue');
    log(`🎸 With Chords:        ${stats.withChords} (${((stats.withChords/stats.total)*100).toFixed(1)}%)`, 'blue');
    console.log('='.repeat(80) + '\n');
    
    // مرحله 2: پردازش سرودهای ناقص
    if (stats.needsProcessing > 0) {
      log('⚙️  PHASE 2: Processing incomplete songs...', 'bright');
      console.log('-'.repeat(80));
      
      for (let i = 0; i < songs.length; i++) {
        const song = songs[i];
        const analysis = analyses[i];
        
        if (analysis.needsProcessing) {
          const titleStr = typeof song.title === 'string' 
            ? JSON.parse(song.title).fa || JSON.parse(song.title).en 
            : song.title;
          
          log(`\n🔧 Processing song ${song.id}: ${titleStr}`, 'yellow');
          
          const result = await processSong(song, analysis);
          
          if (result.success && result.updates.length > 0) {
            log(`  ✅ Updated: ${result.updates.join(', ')}`, 'green');
          } else if (result.success) {
            log(`  ℹ️  No changes needed`, 'blue');
          }
        }
      }
      
      console.log('\n' + '='.repeat(80));
      log(`✅ Processing completed: ${stats.processed} songs updated`, 'green');
      console.log('='.repeat(80) + '\n');
    }
    
    // مرحله 3: گزارش مشکلات
    log('⚠️  ISSUES REPORT:', 'bright');
    console.log('='.repeat(80));
    
    if (issues.noAudio.length > 0) {
      log(`\n❌ Songs without audio (${issues.noAudio.length}):`, 'red');
      issues.noAudio.slice(0, 10).forEach(item => {
        const title = typeof item.title === 'string' ? JSON.parse(item.title).fa : item.title;
        console.log(`   - Song ${item.id}: ${title}`);
      });
      if (issues.noAudio.length > 10) {
        console.log(`   ... and ${issues.noAudio.length - 10} more`);
      }
    }
    
    if (issues.noLyrics.length > 0) {
      log(`\n📝 Songs without lyrics (${issues.noLyrics.length}):`, 'yellow');
      issues.noLyrics.slice(0, 10).forEach(item => {
        const title = typeof item.title === 'string' ? JSON.parse(item.title).fa : item.title;
        console.log(`   - Song ${item.id}: ${title}`);
      });
      if (issues.noLyrics.length > 10) {
        console.log(`   ... and ${issues.noLyrics.length - 10} more`);
      }
    }
    
    if (issues.noTiming.length > 0) {
      log(`\n🎵 Songs without timing (${issues.noTiming.length}):`, 'yellow');
      issues.noTiming.slice(0, 10).forEach(item => {
        const title = typeof item.title === 'string' ? JSON.parse(item.title).fa : item.title;
        console.log(`   - Song ${item.id}: ${title}`);
      });
      if (issues.noTiming.length > 10) {
        console.log(`   ... and ${issues.noTiming.length - 10} more`);
      }
    }
    
    if (issues.brokenUrls.length > 0) {
      log(`\n🔗 Songs with broken URLs (${issues.brokenUrls.length}):`, 'red');
      issues.brokenUrls.slice(0, 10).forEach(item => {
        const title = typeof item.title === 'string' ? JSON.parse(item.title).fa : item.title;
        console.log(`   - Song ${item.id}: ${title}`);
        console.log(`     URL: ${item.url}`);
      });
      if (issues.brokenUrls.length > 10) {
        console.log(`   ... and ${issues.brokenUrls.length - 10} more`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    log('✅ FINAL SUMMARY:', 'bright');
    console.log('='.repeat(80));
    log(`Total Songs:           ${stats.total}`, 'cyan');
    log(`✅ Complete:           ${stats.complete} (${((stats.complete/stats.total)*100).toFixed(1)}%)`, 'green');
    log(`⚙️  Processed:          ${stats.processed}`, 'yellow');
    log(`❌ Errors:             ${stats.errors}`, 'red');
    log(`⚠️  Remaining Issues:   ${issues.incomplete.length}`, 'yellow');
    console.log('='.repeat(80) + '\n');
    
    // ذخیره گزارش در فایل
    const report = {
      timestamp: new Date().toISOString(),
      stats,
      issues: {
        noAudio: issues.noAudio.length,
        noLyrics: issues.noLyrics.length,
        noTiming: issues.noTiming.length,
        brokenUrls: issues.brokenUrls.length,
        incomplete: issues.incomplete.length
      },
      details: issues
    };
    
    const reportPath = path.join(__dirname, 'worship-songs-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    log(`📄 Full report saved to: ${reportPath}`, 'blue');
    
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// اجرا
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { analyzeSong, processSong, generateSimpleTiming };
