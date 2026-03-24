const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDuplicates(dryRun = true) {
  console.log('═'.repeat(60));
  console.log(`🧹 SUPABASE DB: WORSHIP SONGS CLEANUP ${dryRun ? '(DRY RUN)' : '(REAL RUN)'}`);
  console.log('═'.repeat(60));

  console.log('Fetching all worship songs...');
  const { data: songs, error } = await supabase
    .from('church_worship_songs')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching songs:', error);
    return;
  }

  console.log(`Found ${songs.length} total songs.`);

  // Group by title_fa
  const titlesMap = new Map();
  const titleLessAndEmpty = [];
  
  // Scoring function: to pick the "best" song among duplicates
  const getScore = (song) => {
    let score = 0;
    if (song.audio_url) score += 10;
    if (song.youtube_id) score += 5;
    if (song.lyrics_fa && song.lyrics_fa.length > 50) score += 10;
    if (song.lyrics_en && song.lyrics_en.length > 20) score += 2;
    if (song.timing_data) score += 5;
    if (song.likes_count) score += song.likes_count;
    return score;
  };

  const normalizeTitle = (title) => {
      if (!title) return '';
      return title.replace(/[\u200C\u200B]/g, ' ') // remove zero-width chars
           .replace(/\s+/g, ' ') // normalize spaces
           .trim()
           .toLowerCase();
  };

  const toDeletes = [];

  for (const song of songs) {
    const title = normalizeTitle(song.title_fa);
    
    // Completely empty and no title?
    if (!title && !song.audio_url && !song.lyrics_fa) {
      titleLessAndEmpty.push(song);
      toDeletes.push(song.id);
      continue;
    }

    // Treat 'بدون نام' or '(بدون نام)' as titleless
    if (title === 'بدون نام' || title === '(بدون نام)') {
        // If it also doesn't have an audio_url, it's pretty useless
        if (!song.audio_url) {
            titleLessAndEmpty.push(song);
            toDeletes.push(song.id);
            continue;
        }
    }

    if (!titlesMap.has(title)) {
      titlesMap.set(title, [song]);
    } else {
      titlesMap.get(title).push(song);
    }
  }

  let duplicatedCount = 0;
  let incompleteCount = titleLessAndEmpty.length;

  for (const [title, group] of titlesMap.entries()) {
    if (group.length > 1) {
      // If the title is too generic and we have multiple (like "بدون نام"), maybe keep all if they have distinct audio?
      // For now, we delete duplicates based on title.
      if (title.includes('بدون نام')) continue;

      duplicatedCount += group.length - 1;
      
      // Sort by score descending
      group.sort((a, b) => getScore(b) - getScore(a));
      
      const bestSong = group[0];
      const duplicates = group.slice(1);
      
      console.log(`\n📌 Duplicate found: "${title}" (${group.length} versions)`);
      console.log(`   ✅ KEEPING ID: ${bestSong.id} | Score: ${getScore(bestSong)} | Audio: ${!!bestSong.audio_url} | Lyrics: ${!!bestSong.lyrics_fa}`);
      
      for (const dup of duplicates) {
        console.log(`   ❌ DELETING ID: ${dup.id} | Score: ${getScore(dup)} | Audio: ${!!dup.audio_url} | Lyrics: ${!!dup.lyrics_fa}`);
        toDeletes.push(dup.id);
      }
    }
  }

  console.log('\n' + '─'.repeat(40));
  console.log(`📊 Summary:`);
  console.log(`   - Total Songs: ${songs.length}`);
  console.log(`   - Unique Titles: ${titlesMap.size}`);
  console.log(`   - Incomplete/Useless: ${incompleteCount}`);
  console.log(`   - Duplicates to Remove: ${duplicatedCount}`);
  console.log(`   - Total to Delete: ${toDeletes.length}`);
  
  if (toDeletes.length === 0) {
      console.log('✅ Database is already clean! Nothing to delete.');
      return;
  }

  if (dryRun) {
    console.log('\n⚠️  THIS IS A DRY RUN. NO RECORDS WERE DELETED.');
    console.log('   Run with "node scripts/clean_worship_duplicates.cjs --force" to actually delete them.');
  } else {
    console.log('\n🔥 DELETING RECORDS...');
    
    // Delete in chunks of 50 to avoid timeout
    const chunkSize = 50;
    for (let i = 0; i < toDeletes.length; i += chunkSize) {
        const chunk = toDeletes.slice(i, i + chunkSize);
        
        const { error: delError } = await supabase
            .from('church_worship_songs')
            .delete()
            .in('id', chunk);

        if (delError) {
            console.error(`❌ Error deleting chunk ${i}:`, delError);
        } else {
            console.log(`   ✓ Deleted ${i + chunk.length}/${toDeletes.length}`);
        }
    }
    
    console.log('✅ Cleanup complete!');
  }
}

const args = process.argv.slice(2);
const isDryRun = !args.includes('--force');

cleanDuplicates(isDryRun).catch(console.error);
