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

// Normalize text helper
function normalizeTitle(title) {
  if (!title) return '';
  return title.replace(/[\u200C\u200B]/g, ' ') // remove zero-width chars
              .replace(/\s+/g, ' ') // normalize spaces
              .trim()
              .toLowerCase();
}

// Extract YouTube ID helper
function extractYoutubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.from\/watch\?v=|youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i);
  return match ? match[1] : null;
}

// Deep scrape helper for individual song page
async function scrapeIndividualSongPage(songUrl) {
  console.log(`🔍 Deep scraping individual page: ${songUrl}`);
  try {
    const response = await axios.get(songUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    
    // 1. Precise Title
    let titleFa = $('h1.title, h1.page-title, h1#page-title, .song-title, title').first().text().split('|')[0].trim();
    
    // 2. Artist / Composer / Singer
    let artist = $('.field-name-field-artist, .field-name-field-singer, .artist, .singer, .singer-name').first().text().replace(/خواننده|شاعر|آهنگساز|:/g, '').trim();
    if (!artist) {
      artist = $('.field-name-field-composer, .composer, .song-composer').first().text().replace(/آهنگساز|:/g, '').trim();
    }
    
    // 3. Farsi Lyrics
    let lyricsFa = $('.lyrics-text, .field-name-field-lyrics, .field-name-field-song-body, .lyrics, pre').first().text().trim();
    
    // Fallback search for lyrics in case of custom markup
    if (!lyricsFa || lyricsFa.length < 30) {
      $('pre, div').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 50 && text.length < 3000 && /[\u0600-\u06FF]/.test(text) && !text.includes('<!DOCTYPE')) {
          if (!lyricsFa || text.length > lyricsFa.length) {
            lyricsFa = text;
          }
        }
      });
    }

    // 4. Media Elements
    let audioUrl = null;
    let youtubeId = null;
    let pptxUrl = null;
    let chords = null;

    $('a').each((_, a) => {
      const href = $(a).attr('href') || '';
      if (href.includes('.mp3') || href.includes('.wav') || href.includes('.m4a')) {
        audioUrl = href;
      } else if (href.includes('.pptx') || href.includes('.ppt')) {
        pptxUrl = href;
      }
      
      const ytId = extractYoutubeId(href);
      if (ytId) youtubeId = ytId;
    });

    // 5. Chords
    const chordElem = $('.field-name-field-chord, .chord-base, select');
    chords = chordElem.first().attr('chord_base') || chordElem.first().val() || null;
    
    // If audio/pptx are relative, make them absolute
    if (audioUrl && !audioUrl.startsWith('http')) {
      audioUrl = KALAMEH_BASE_URL + (audioUrl.startsWith('/') ? '' : '/') + audioUrl;
    }
    if (pptxUrl && !pptxUrl.startsWith('http')) {
      pptxUrl = KALAMEH_BASE_URL + (pptxUrl.startsWith('/') ? '' : '/') + pptxUrl;
    }

    return {
      titleFa,
      artist: artist || 'ناشناس',
      lyricsFa: lyricsFa || null,
      audioUrl: audioUrl || null,
      youtubeId: youtubeId || null,
      pptxUrl: pptxUrl || null,
      chords: chords || null
    };
  } catch (err) {
    console.error(`⚠️ Failed to deep scrape ${songUrl}:`, err.message);
    return null;
  }
}

// Scrape Kalameh main function
async function scrapeKalamehSongs() {
  console.log('═'.repeat(60));
  console.log('🔄 STARTING KALAMEH SONGS DEEP SYNC');
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

  // Normalize existing titles for lookup
  const existingTitles = new Set(
    existingSongs.map(s => normalizeTitle(s.title_fa))
  );

  console.log(`✅ Loaded ${existingTitles.size} existing songs from DB.`);

  let page = 1;
  const maxPages = 5; 
  let totalNewSongsFound = 0;
  const newlyAdded = [];

  while (page <= maxPages) {
    const archiveUrl = `${KALAMEH_BASE_URL}/song-archive?page=${page}`; 
    console.log(`\n📥 Fetching Kalameh Page ${page} -> ${archiveUrl}`);
    
    try {
      const response = await axios.get(archiveUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        },
        timeout: 15000 
      });

      const $ = cheerio.load(response.data);
      
      // Step A: Check for Accordion Headers first (standard Kalameh archive format)
      const headers = $('h3.views-accordion-songs_and_video-page-header, h3.views-accordion-songs-header, .views-accordion-header');
      
      if (headers.length > 0) {
        console.log(`Found ${headers.length} inline accordion headers on page ${page}. Parsing...`);
        
        for (let i = 0; i < headers.length; i++) {
          const h = $(headers[i]);
          
          const titleFa = h.find('.song_title, .title').first().text().trim() || h.text().trim();
          const titleEn = h.find('.song_author, .title-en').first().text().trim() || null;
          const composer = h.find('.song_compositor, .composer').first().text().trim() || 'ناشناس';
          
          const normalized = normalizeTitle(titleFa);
          if (existingTitles.has(normalized)) continue; // skip duplicates

          const block = h.next('.views-row, .views-accordion-item-content, div');
          
          let chords = block.find('select').first().attr('chord_base') || block.find('select').first().val() || null;
          let lyricsFa = block.find('.lyrics-text, pre').first().text().trim() || null;
          
          let audioUrl = null;
          let youtubeId = null;
          let pptxUrl = null;
          
          block.find('a').each((_, a) => {
            const href = $(a).attr('href') || '';
            if (href.includes('.mp3') || href.includes('.wav') || href.includes('.m4a')) {
              audioUrl = href;
            } else if (href.includes('.pptx') || href.includes('.ppt')) {
              pptxUrl = href;
            }
            const ytId = extractYoutubeId(href);
            if (ytId) youtubeId = ytId;
          });

          // Absolute URLs
          if (audioUrl && !audioUrl.startsWith('http')) {
            audioUrl = KALAMEH_BASE_URL + (audioUrl.startsWith('/') ? '' : '/') + audioUrl;
          }
          if (pptxUrl && !pptxUrl.startsWith('http')) {
            pptxUrl = KALAMEH_BASE_URL + (pptxUrl.startsWith('/') ? '' : '/') + pptxUrl;
          }

          console.log(`✨ New Song Found (Accordion): ${titleFa}`);
          
          const newSongData = {
            title_fa: titleFa,
            title_en: titleEn,
            artist: composer,
            audio_url: audioUrl,
            youtube_id: youtubeId,
            lyrics_fa: lyricsFa,
            chords: chords,
            is_verified: false
          };

          const { data: insertedData, error: insertError } = await supabase
            .from('church_worship_songs')
            .insert([newSongData])
            .select();

          if (insertError) {
            console.error(`❌ DB Insert Error for "${titleFa}":`, insertError.message);
          } else if (insertedData && insertedData.length > 0) {
            console.log(`   ✅ Added successfully (ID: ${insertedData[0].id})`);
            existingTitles.add(normalized);
            newlyAdded.push(insertedData[0]);
            totalNewSongsFound++;
          }
        }
      } else {
        // Step B: Fallback - Deep Scrape links
        const songLinks = [];
        $('a').each((_, a) => {
          const href = $(a).attr('href') || '';
          if (href.includes('/song/') || href.includes('/node/')) {
            const fullUrl = href.startsWith('http') ? href : KALAMEH_BASE_URL + (href.startsWith('/') ? '' : '/') + href;
            if (!songLinks.includes(fullUrl)) {
              songLinks.push(fullUrl);
            }
          }
        });
        
        console.log(`Found ${songLinks.length} song page links on page ${page}. Scraping deeply...`);
        
        for (const link of songLinks) {
          // Double check before fetching the page to save requests
          // Extract a possible title from the URL slug to check if we already have it
          const urlSlug = link.split('/').pop().replace(/-/g, ' ');
          if (existingTitles.has(normalizeTitle(urlSlug))) {
            continue; // Skip if slug matches an existing song
          }

          const details = await scrapeIndividualSongPage(link);
          if (!details || !details.titleFa) continue;

          const normalized = normalizeTitle(details.titleFa);
          if (existingTitles.has(normalized)) continue;

          console.log(`✨ New Song Extracted (Deep): ${details.titleFa}`);
          
          const newSongData = {
            title_fa: details.titleFa,
            artist: details.artist,
            audio_url: details.audioUrl,
            youtube_id: details.youtubeId,
            lyrics_fa: details.lyricsFa,
            chords: details.chords,
            is_verified: false
          };

          const { data: insertedData, error: insertError } = await supabase
            .from('church_worship_songs')
            .insert([newSongData])
            .select();

          if (insertError) {
            console.error(`❌ DB Insert Error for "${details.titleFa}":`, insertError.message);
          } else if (insertedData && insertedData.length > 0) {
            console.log(`   ✅ Added successfully (ID: ${insertedData[0].id})`);
            existingTitles.add(normalized);
            newlyAdded.push(insertedData[0]);
            totalNewSongsFound++;
          }
          
          // Rate-limiting delay between individual requests
          await new Promise(r => setTimeout(r, 1500));
        }
      }

    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log(`End of pagination reached (404 on page ${page}).`);
      } else {
        console.error(`❌ Failed to fetch Kalameh page ${page}:`, err.message);
      }
      break; 
    }

    page++;
    await new Promise(r => setTimeout(r, 2000)); // Delay between page list crawls
  }

  console.log('\n' + '─'.repeat(40));
  console.log('🏁 SYNC COMPLETE');
  console.log(`📊 Result: ${totalNewSongsFound} new songs added.`);
  
  if (newlyAdded.length > 0) {
    console.log(`\n📧 Sending notifications for ${newlyAdded.length} new songs...`);
    const message = `🔔 ${newlyAdded.length} New Worship Songs Extracted!\nTitles:\n${newlyAdded.map(s => `- ${s.title_fa} (Artist: ${s.artist || 'Unknown'})`).join('\n')}`;
    console.log(message);
    const logFile = path.join(__dirname, '..', 'new_songs_notification.log');
    fs.appendFileSync(logFile, `[${new Date().toISOString()}]\n${message}\n\n`);
  } else {
    console.log('👍 DB is fully up to date with Kalameh.');
  }
}

// Execute
scrapeKalamehSongs().catch(console.error);
