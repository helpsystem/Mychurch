#!/usr/bin/env node

/**
 * Revert worship songs URLs from HiDrive back to local paths
 * Run on server: node rollback-to-local.cjs
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration  
const SUPABASE_URL = 'https://yxeobqzgqghndjvkzwjy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZW9icXpncWdobmRqdmt6d2p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTU3MDE5NiwiZXhwIjoyMDQxMTQ2MTk2fQ.SkR-sLh4YS1RRLYd9KHh5Hq37L9wJOqiZKhJ95qwGHs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function rollbackToLocal() {
  console.log('🔄 Rolling back worship songs URLs to local paths...\n');

  try {
    // Get all worship songs with HiDrive URLs
    const { data: songs, error: fetchError } = await supabase
      .from('worship_songs')
      .select('id, title, audiourl')
      .like('audiourl', '%hidrive%');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`📊 Found ${songs.length} songs with HiDrive URLs\n`);

    let updated = 0;
    let failed = 0;

    for (const song of songs) {
      try {
        // Extract filename from HiDrive URL
        // https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/worship/audio/kalameh/filename.mp3
        // -> /worship/audio/kalameh/filename.mp3
        
        const match = song.audiourl.match(/\/worship\/audio\/.+$/);
        if (!match) {
          console.log(`⚠️  Could not extract path from: ${song.audiourl}`);
          failed++;
          continue;
        }

        const localPath = match[0]; // e.g., /worship/audio/kalameh/filename.mp3

        // Update to local path
        const { error: updateError } = await supabase
          .from('worship_songs')
          .update({ audiourl: localPath })
          .eq('id', song.id);

        if (updateError) {
          console.log(`❌ Failed to update song ${song.id}: ${updateError.message}`);
          failed++;
        } else {
          const title = song.title?.fa || song.title?.en || `Song ${song.id}`;
          console.log(`✅ Updated: ${title.substring(0, 40)}`);
          console.log(`   From: ${song.audiourl.substring(0, 70)}...`);
          console.log(`   To: ${localPath}\n`);
          updated++;
        }

      } catch (error) {
        console.log(`❌ Error processing song ${song.id}:`, error.message);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Rollback completed!`);
    console.log(`   Updated: ${updated} songs`);
    console.log(`   Failed: ${failed} songs`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  }
}

// Run the rollback
rollbackToLocal();
