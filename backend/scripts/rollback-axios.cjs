const axios = require('axios');

// Supabase configuration with embedded credentials
const SUPABASE_URL = 'https://yxeobqzgqghndjvkzwjy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZW9icXpncWdobmRqdmt6d2p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTU3MDE5NiwiZXhwIjoyMDQxMTQ2MTk2fQ.SkR-sLh4YS1RRLYd9KHh5Hq37L9wJOqiZKhJ95qwGHs';

async function rollbackURLs() {
  console.log('🔄 Rolling back worship songs URLs to local paths...\n');

  try {
    // Step 1: Get all songs with HiDrive URLs
    console.log('📊 Fetching songs with HiDrive URLs...');
    const { data: songs } = await axios.get(
      `${SUPABASE_URL}/rest/v1/worship_songs?audiourl=like.*hidrive*&select=id,title,audiourl`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );

    console.log(`Found ${songs.length} songs to update\n`);

    if (songs.length === 0) {
      console.log('✅ No songs need updating!');
      return;
    }

    // Step 2: Update each song
    let updated = 0;
    let failed = 0;

    for (const song of songs) {
      try {
        // Convert HiDrive URL to local path
        // From: https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/worship/audio/kalameh/filename.mp3
        // To: /worship/audio/kalameh/filename.mp3
        
        const localUrl = song.audiourl.replace(
          'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch',
          ''
        );

        // Update the song
        await axios.patch(
          `${SUPABASE_URL}/rest/v1/worship_songs?id=eq.${song.id}`,
          { audiourl: localUrl },
          {
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            }
          }
        );

        const title = song.title?.fa || song.title?.en || `Song ${song.id}`;
        console.log(`✅ ${title.substring(0, 50)}`);
        console.log(`   ${localUrl}\n`);
        updated++;

      } catch (error) {
        console.log(`❌ Failed to update song ${song.id}: ${error.message}\n`);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Rollback completed!`);
    console.log(`   Updated: ${updated} songs`);
    console.log(`   Failed: ${failed} songs`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

rollbackURLs();
