const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const KALAMEH_BASE_URL = 'https://www.kalameh.com';

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Setup email sending (assuming an email API endpoint exists or via logs for now)
async function notifyAdmins(newSongs) {
  console.log(`\n📧 Sending notification to admins/leaders about ${newSongs.length} new songs...`);
  
  // Real implementation would use an email service like Resend, Sendgrid, or an internal route (e.g. /api/admin/notify)
  // For now, let's keep it in the logs which PM2 will capture, and if you have an API, we can plug it in later.
  
  if (newSongs.length > 0) {
     const message = `
🔔 ${newSongs.length} New Worship Songs Extracted!
Please check the Worship Admin Panel to enrich these new songs. 
Titles: 
${newSongs.map(s => `- ${s.title_fa}`).join('\n')}
     `.trim();
     console.log('MESSAGE:', message);
     
     // Save a local log file that a UI can read as notifications
     const logFile = path.join(__dirname, '..', 'new_songs_notification.log');
     fs.appendFileSync(logFile, `[${new Date().toISOString()}]\n${message}\n\n`);
  }
}

async function scrapeKalamehSongs() {
  console.log('═'.repeat(60));
  console.log('🔄 STARTING KALAMEH SONGS SYNC');
  console.log('═'.repeat(60));

  // 1. Fetch current songs from Supabase to avoid duplicates
  console.log('Fetching existing songs from Supabase...');
  const { data: existingSongs, error: fetchError } = await supabase
    .from('church_worship_songs')
    .select('title_fa');

  if (fetchError) {
    console.error('❌ Error fetching existing songs:', fetchError);
    return;
  }

  // Normalize existing titles to help with matching
  const existingTitles = new Set(
    existingSongs.map(s => 
      (s.title_fa || '').replace(/[\u200C\u200B]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
    )
  );

  console.log(`✅ Loaded ${existingTitles.size} existing songs from DB.`);

  // 2. Fetch Kalameh Archive Page
  // We assume there's a main archive or pagination. For this script, we check the first few pages.
  let page = 1;
  const maxPages = 5; // Adjust based on how Kalameh is paginated
  let totalNewSongsFound = 0;
  const newlyAdded = [];

  while (page <= maxPages) {
    const archiveUrl = `${KALAMEH_BASE_URL}/song-archive?page=${page}`; // Adjust URL pattern if needed
    console.log(`\n📥 Fetching Kalameh Page ${page} -> ${archiveUrl}`);
    
    try {
      const response = await axios.get(archiveUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        },
        timeout: 10000 
      });

      const $ = cheerio.load(response.data);
      
      // Parse songs depending on Kalameh HTML structure
      // Example structure based on common CMS like Drupal (which Kalameh seems to use)
      const songElements = $('.views-row, .node, article, .song-item, .post');
      
      if (songElements.length === 0) {
        console.log('⚠️ No song elements found on this page. Stopping pagination.');
        // If Kalameh structure changed completely, standard scraper won't work.
        // Try fallback regex search just like python script did (titles, audio, youtube)
        break;
      }

      console.log(`Found ${songElements.length} song elements on page ${page}. Processing...`);

      for (const el of songElements) {
        const titleFa = $(el).find('h1, h2, h3, h4, a.title, h2.name').first().text().trim();
        const artist = $(el).find('.artist, .singer, .author').first().text().trim() || null;
        const description = $(el).find('p.description, .excerpt').first().text().trim() || null;
        
        // Links
        let audioUrl = null;
        let youtubeId = null;
        
        $(el).find('a').each((_, a) => {
           const href = $(a).attr('href') || '';
           if (href.includes('.mp3') || href.includes('.wav') || href.includes('.m4a')) {
               audioUrl = href;
               if (!audioUrl.startsWith('http')) {
                   audioUrl = KALAMEH_BASE_URL + (audioUrl.startsWith('/') ? '' : '/') + audioUrl;
               }
           }
           if (href.includes('youtube.com/watch?v=') || href.includes('youtu.be/')) {
               const match = href.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
               if (match) youtubeId = match[1];
           }
        });

        if (!titleFa) continue;

        const normalizedTitle = titleFa.replace(/[\u200C\u200B]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

        if (existingTitles.has(normalizedTitle)) {
           // Skip if we already have this song
           continue;
        }

        console.log(`✨ New Song Found! Title: ${titleFa}`);
        
        // Insert into database
        const newSongData = {
           title_fa: titleFa,
           artist: artist,
           audio_url: audioUrl,
           youtube_id: youtubeId,
           lyrics_fa: null, // Additional deep scraping per song page would be needed for lyrics
        };

        const { data: insertedData, error: insertError } = await supabase
           .from('church_worship_songs')
           .insert([newSongData])
           .select();

        if (insertError) {
           console.error(`❌ DB Insert Error for "${titleFa}":`, insertError.message);
        } else if (insertedData && insertedData.length > 0) {
           console.log(`   ✅ Successfully added to DB (ID: ${insertedData[0].id})`);
           existingTitles.add(normalizedTitle); // Add to local map to prevent duplicates in same run
           newlyAdded.push(insertedData[0]);
           totalNewSongsFound++;
        }
      }

    } catch (err) {
      if (err.response && err.response.status === 404) {
          console.log(`End of pagination reached (404 on page ${page}).`);
      } else {
          console.error(`❌ Failed to fetch Kalameh page ${page}:`, err.message);
      }
      break; // Stop on error
    }

    page++;
    // Polite delay
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n' + '─'.repeat(40));
  console.log('🏁 SYNC COMPLETE');
  console.log(`📊 Result: ${totalNewSongsFound} new songs added.`);
  
  if (newlyAdded.length > 0) {
      await notifyAdmins(newlyAdded);
  } else {
      console.log('👍 DB is fully up to date with Kalameh.');
  }
}

// Execute
scrapeKalamehSongs().catch(console.error);
