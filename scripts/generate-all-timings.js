#!/usr/bin/env node

/**
 * 🎵 Batch Timing Generator
 * این اسکریپت برای ساخت فایل‌های timing برای همه سرودهای پرستشی استفاده میشه
 * 
 * Usage:
 *   node scripts/generate-all-timings.js
 *   node scripts/generate-all-timings.js --skip-existing
 */

const fs = require('fs').promises;
const path = require('path');

// Paths
const WORSHIP_SONGS_PATH = path.join(__dirname, '../public/worship/data/worship_songs.json');
const TIMING_DIR = path.join(__dirname, '../public/worship/data/timings');

// Config
const SKIP_EXISTING = process.argv.includes('--skip-existing');
const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Parse lyrics and remove chord/section markers
 */
function cleanLyrics(lyrics) {
  if (!lyrics) return '';
  
  return lyrics
    .split('\n')
    .map(line => line.trim())
    .filter(line => {
      // Remove empty lines
      if (line.length === 0) return false;
      
      // Remove chord markers [Am], [G], etc.
      if (line.match(/^\[.*\]$/)) return false;
      
      // Remove section markers (Verse 1, Chorus, etc.)
      if (line.match(/^(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Interlude|Coda)/i)) return false;
      
      // Remove standalone chords (Am7, G#m, etc.)
      if (line.match(/^[A-G][#b]?m?[0-9]?$/)) return false;
      
      return true;
    })
    .join('\n');
}

/**
 * Generate timing data for a song
 */
function generateTimingData(song, estimatedDuration) {
  const lyrics = cleanLyrics(song.lyrics?.fa || song.lyrics?.en || '');
  const lines = lyrics.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length === 0) {
    return null;
  }
  
  // Simple equal spacing
  const timePerLine = estimatedDuration / lines.length;
  
  const timingLines = lines.map((line, index) => {
    const start = index * timePerLine;
    const end = (index + 1) * timePerLine;
    
    // Word-level timing
    const words = line.split(/\s+/).filter(w => w.length > 0);
    const timePerWord = words.length > 0 ? (end - start) / words.length : 0;
    
    const wordTimings = words.map((word, wordIndex) => ({
      word: word,
      start: parseFloat((start + (wordIndex * timePerWord)).toFixed(2)),
      end: parseFloat((start + ((wordIndex + 1) * timePerWord)).toFixed(2))
    }));
    
    return {
      line: line,
      start: parseFloat(start.toFixed(2)),
      end: parseFloat(end.toFixed(2)),
      words: wordTimings
    };
  });
  
  return {
    metadata: {
      title: song.title?.fa || song.title?.en || 'Unknown',
      artist: song.artist || 'Unknown',
      totalDuration: parseFloat(estimatedDuration.toFixed(2)),
      wordCount: lines.join(' ').split(/\s+/).length,
      generatedAt: new Date().toISOString(),
      generationMethod: 'batch-equal-spacing',
      songId: song.id,
      note: 'Auto-generated timing. Use admin panel to adjust manually for better accuracy.'
    },
    lines: timingLines
  };
}

/**
 * Check if timing file exists
 */
async function timingExists(songId) {
  try {
    const timingPath = path.join(TIMING_DIR, `song_${songId}_timing.json`);
    await fs.access(timingPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Save timing to file
 */
async function saveTimingFile(songId, timingData) {
  await fs.mkdir(TIMING_DIR, { recursive: true });
  const timingPath = path.join(TIMING_DIR, `song_${songId}_timing.json`);
  await fs.writeFile(timingPath, JSON.stringify(timingData, null, 2), 'utf-8');
}

/**
 * Main function
 */
async function main() {
  console.log('🎵 Batch Timing Generator Started\n');
  console.log(`📁 Reading songs from: ${WORSHIP_SONGS_PATH}`);
  console.log(`💾 Timing output directory: ${TIMING_DIR}`);
  console.log(`⚙️  Skip existing: ${SKIP_EXISTING ? 'YES' : 'NO'}`);
  console.log(`🧪 Dry run: ${DRY_RUN ? 'YES' : 'NO'}\n`);
  
  try {
    // Read worship songs
    const songsData = await fs.readFile(WORSHIP_SONGS_PATH, 'utf-8');
    const songs = JSON.parse(songsData);
    
    console.log(`✅ Found ${songs.length} worship songs\n`);
    console.log('━'.repeat(80));
    
    const results = {
      total: songs.length,
      generated: 0,
      skipped: 0,
      failed: 0,
      noLyrics: 0
    };
    
    // Process each song
    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      const progress = `[${i + 1}/${songs.length}]`;
      
      // Check if timing exists
      const exists = await timingExists(song.id);
      
      if (exists && SKIP_EXISTING) {
        console.log(`${progress} ⏭️  SKIPPED: Song #${song.id} - ${song.title?.fa || song.title?.en} (timing exists)`);
        results.skipped++;
        continue;
      }
      
      // Check if lyrics exist
      const lyrics = cleanLyrics(song.lyrics?.fa || song.lyrics?.en || '');
      if (!lyrics || lyrics.length === 0) {
        console.log(`${progress} ⚠️  NO LYRICS: Song #${song.id} - ${song.title?.fa || song.title?.en}`);
        results.noLyrics++;
        continue;
      }
      
      try {
        // Estimate duration (average 4 seconds per line, or use actual if available)
        const lineCount = lyrics.split('\n').filter(l => l.trim().length > 0).length;
        const estimatedDuration = lineCount * 4; // 4 seconds per line
        
        // Generate timing
        const timingData = generateTimingData(song, estimatedDuration);
        
        if (!timingData) {
          console.log(`${progress} ❌ FAILED: Song #${song.id} - ${song.title?.fa || song.title?.en} (no valid lines)`);
          results.failed++;
          continue;
        }
        
        // Save file (unless dry run)
        if (!DRY_RUN) {
          await saveTimingFile(song.id, timingData);
        }
        
        const status = exists ? '🔄 UPDATED' : '✅ CREATED';
        console.log(`${progress} ${status}: Song #${song.id} - ${song.title?.fa || song.title?.en || 'Unknown'} (${timingData.lines.length} lines, ${estimatedDuration}s)`);
        results.generated++;
        
        // Small delay to avoid overwhelming the system
        if (i % 10 === 0 && i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.log(`${progress} ❌ ERROR: Song #${song.id} - ${error.message}`);
        results.failed++;
      }
    }
    
    // Summary
    console.log('\n' + '━'.repeat(80));
    console.log('📊 SUMMARY:');
    console.log(`   Total songs: ${results.total}`);
    console.log(`   ✅ Generated: ${results.generated}`);
    console.log(`   ⏭️  Skipped (existing): ${results.skipped}`);
    console.log(`   ⚠️  No lyrics: ${results.noLyrics}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log('━'.repeat(80));
    
    if (DRY_RUN) {
      console.log('\n🧪 DRY RUN - No files were actually written');
      console.log('   Run without --dry-run to generate timing files');
    } else {
      console.log('\n🎉 Batch generation completed!');
      console.log(`   Timing files saved to: ${TIMING_DIR}`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
