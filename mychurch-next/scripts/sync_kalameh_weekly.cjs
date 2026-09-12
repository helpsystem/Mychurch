/**
 * sync_kalameh_weekly.cjs
 * همگام‌سازی و آپگرید سرودهای پرستشی از سایت کلمه (Kalameh Drupal 11)
 * 
 * استخراج دقیق و کامل:
 * - عنوان سرود (فارسی و انگلیسی)
 * - شاعر و آهنگساز (Artist / Composer)
 * - متن کامل و تمیز شعر با بخش‌بندی ([Verse], [Chorus], [Bridge])
 * - متن آکورددار کامل با آکوردهای درون‌خطی ([Chords])
 * - لینک فایل صوتی باکیفیت MP3 (Google Cloud Storage / Kalameh)
 * - لینک فایل پرزنتیشن پاورپوینت PPTX
 * - لینک نت و آکورد پی‌دی‌اف PDF Sheet Music
 * - شناسه ویدیو یوتیوب YouTube ID
 * 
 * همگام‌سازی دوطرفه: دیتابیس Supabase (church_worship_songs) + فایل‌های JSON پابلیک
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// ─── Configuration ───────────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const KALAMEH_BASE = 'https://www.kalameh.com';
const ARCHIVE_URL = `${KALAMEH_BASE}/song-archive`;
const REQUEST_DELAY_MS = 600;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const AXIOS_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'fa,en;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function normalizeTitle(title) {
  if (!title) return '';
  return title
    .replace(/[\u200C\u200B\u200D]/g, ' ')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function extractYoutubeId(html) {
  if (!html) return null;
  const patterns = [
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/i,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/i,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  return null;
}

function makeAbsoluteUrl(url) {
  if (!url) return null;
  url = url.trim();
  if (url.startsWith('http')) return url;
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return KALAMEH_BASE + url;
  return KALAMEH_BASE + '/' + url;
}

// ─── Scrape a single song page on Kalameh (Drupal 11) ─────────────────────────
async function scrapeSongPage(songUrl) {
  try {
    const resp = await axios.get(songUrl, { headers: AXIOS_HEADERS, timeout: 25000 });
    const html = resp.data;
    const $ = cheerio.load(html);

    // 1. Title
    let titleFa = $('h1').first().text().trim();
    if (!titleFa) {
      const t = $('title').text().trim();
      titleFa = t.split('|')[0].trim();
    }
    // Clean up parenthesis suffix e.g. "عنوان ( خدا عظیمتر )"
    titleFa = titleFa.replace(/\s+/g, ' ').trim();

    // 2. Artist & Composer
    let artist = '';
    const artistText = $('.artist').text().trim();
    if (artistText) {
      artist = artistText
        .replace(/شاعر و آهنگساز\s*:\s*/g, ' ')
        .replace(/سرود اصلی\s*:\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    if (!artist) {
      artist = $('span.song_author').text().trim() || $('span.song_compositor').text().trim() || 'ناشناس';
    }

    // 3. Audio URL
    let audioUrl = $('[data-audio]').attr('data-audio') || null;
    if (!audioUrl) {
      $('audio source, audio, a').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('href') || '';
        if (src.toLowerCase().includes('.mp3') || src.toLowerCase().includes('.wav') || src.toLowerCase().includes('.m4a')) {
          if (!audioUrl) audioUrl = makeAbsoluteUrl(src);
        }
      });
    }

    // 4. PPTX URL
    let pptxUrl = null;
    $('a[href*=".pptx"], a[href*=".ppt"]').each((_, a) => {
      const href = $(a).attr('href');
      if (href && !pptxUrl) pptxUrl = makeAbsoluteUrl(href);
    });

    // 5. PDF Sheet Music URL
    let pdfUrl = null;
    const pdfBtn = $('.sg-pdf-btn').attr('href');
    if (pdfBtn) {
      pdfUrl = makeAbsoluteUrl(pdfBtn);
    } else {
      $('a[href*=".pdf"]').each((_, a) => {
        const href = $(a).attr('href');
        if (href && !pdfUrl) pdfUrl = makeAbsoluteUrl(href);
      });
    }

    // 6. YouTube ID
    let youtubeId = extractYoutubeId(html);

    // 7. Clean Lyrics (Without chord markers)
    let cleanLyrics = '';
    const sheet = $('.sg-sheet');
    if (sheet.length > 0) {
      const cleanSheet = sheet.clone();
      cleanSheet.find('.chord').remove();
      const lines = [];
      cleanSheet.find('.sec-block').each((_, block) => {
        const secName = $(block).find('.section').text().trim();
        if (secName) lines.push(`[${secName}]`);
        $(block).find('.line').each((_, line) => {
          const lText = $(line).text().trim();
          if (lText) lines.push(lText);
        });
        lines.push('');
      });
      cleanLyrics = lines.join('\n').trim();
    }

    // Fallback for lyrics if no .sg-sheet
    if (!cleanLyrics) {
      const lyricSelectors = [
        '.field-name-field-song-body .field-item',
        '.field-name-field-lyrics .field-item',
        '.lyrics-text',
        'pre',
      ];
      for (const sel of lyricSelectors) {
        const t = $(sel).first().text().trim();
        if (t && t.length > 30 && /[\u0600-\u06FF]/.test(t)) {
          cleanLyrics = t;
          break;
        }
      }
    }

    // 8. Chords (Inline brackets)
    let chordText = '';
    if (sheet.length > 0) {
      const chordSheet = sheet.clone();
      chordSheet.find('.chord .inner').each((_, c) => {
        const chord = $(c).text().trim();
        $(c).replaceWith(`[${chord}]`);
      });
      const cLines = [];
      chordSheet.find('.sec-block').each((_, block) => {
        const secName = $(block).find('.section').text().trim();
        if (secName) cLines.push(`[${secName}]`);
        $(block).find('.line').each((_, line) => {
          const lText = $(line).text().trim();
          if (lText) cLines.push(lText);
        });
        cLines.push('');
      });
      chordText = cLines.join('\n').trim();
    }

    // Primary chord key
    let baseKey = null;
    const firstChordMatch = chordText.match(/\[([A-Ga-g][#b]?m?)\]/);
    if (firstChordMatch) baseKey = firstChordMatch[1];

    return {
      titleFa,
      artist,
      lyricsFa: cleanLyrics || null,
      chords: chordText || baseKey || null,
      baseKey,
      audioUrl,
      pptxUrl,
      pdfUrl,
      youtubeId,
      sourceUrl: songUrl,
    };
  } catch (err) {
    console.warn(`⚠️ Failed to scrape ${songUrl}: ${err.message}`);
    return null;
  }
}

// ─── Collect all song links from archive ──────────────────────────────────────
async function getAllSongLinks() {
  console.log(`\n📥 Fetching Kalameh song archive: ${ARCHIVE_URL}...`);
  const resp = await axios.get(ARCHIVE_URL, { headers: AXIOS_HEADERS, timeout: 30000 });
  const $ = cheerio.load(resp.data);
  const links = new Set();

  $('a[href*="/song/"]').each((_, a) => {
    const href = $(a).attr('href');
    if (href && !href.includes('#') && !href.includes('?')) {
      links.add(makeAbsoluteUrl(href));
    }
  });

  console.log(`✅ Discovered ${links.size} unique song links in archive.`);
  return Array.from(links);
}

// ─── Main sync function ───────────────────────────────────────────────────────
async function runSync(limit = 100) {
  console.log('═'.repeat(60));
  console.log('🔄 KALAMEH WORSHIP SONGS UPGRADE & SYNC');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log('═'.repeat(60));

  const songLinks = await getAllSongLinks();
  const targetLinks = limit ? songLinks.slice(0, limit) : songLinks;

  console.log(`\n🚀 Processing ${targetLinks.length} songs...`);

  // Load existing public JSON
  const jsonPath = path.join(__dirname, '..', 'public', 'worship', 'data', 'worship_songs.json');
  let publicSongs = [];
  try {
    if (fs.existsSync(jsonPath)) {
      publicSongs = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      console.log(`📖 Loaded ${publicSongs.length} existing songs from public JSON.`);
    }
  } catch (e) {
    console.warn('Could not load existing public JSON:', e.message);
  }

  // Load existing Supabase songs
  let existingDbMap = new Map();
  if (supabase) {
    const { data: dbSongs, error } = await supabase
      .from('church_worship_songs')
      .select('id, title_fa, audio_url, lyrics_fa, chords, artist, youtube_id');
    if (!error && dbSongs) {
      for (const s of dbSongs) {
        existingDbMap.set(normalizeTitle(s.title_fa), s);
      }
      console.log(`📖 Loaded ${existingDbMap.size} existing songs from Supabase.`);
    }
  }

  let updatedCount = 0;
  let newCount = 0;

  for (let i = 0; i < targetLinks.length; i++) {
    const link = targetLinks[i];
    console.log(`\n[${i + 1}/${targetLinks.length}] Scraping: ${link}`);
    const data = await scrapeSongPage(link);
    if (!data || !data.titleFa) continue;

    const norm = normalizeTitle(data.titleFa);

    // 1. Sync / Update in public JSON
    let existingJsonIdx = publicSongs.findIndex(s => {
      const tFa = typeof s.title === 'string' ? s.title : s.title?.fa;
      return normalizeTitle(tFa) === norm;
    });

    if (existingJsonIdx >= 0) {
      // Upgrade existing entry with richer data
      const current = publicSongs[existingJsonIdx];
      publicSongs[existingJsonIdx] = {
        ...current,
        artist: data.artist !== 'ناشناس' ? data.artist : current.artist,
        composer: data.artist !== 'ناشناس' ? data.artist : current.composer,
        audioUrl: data.audioUrl || current.audioUrl,
        presentationFileUrl: data.pptxUrl || current.presentationFileUrl,
        pdfFileUrl: data.pdfUrl || current.pdfFileUrl,
        youtubeId: data.youtubeId || current.youtubeId,
        chord: data.baseKey || current.chord,
        chordsText: data.chords || current.chordsText,
        lyrics: {
          fa: data.lyricsFa || current.lyrics?.fa || '',
          en: current.lyrics?.en || '',
        },
      };
      updatedCount++;
      console.log(`  ✓ Updated in JSON: "${data.titleFa}" (Audio: ${!!data.audioUrl}, Chords: ${!!data.chords})`);
    } else {
      // Add new song to JSON
      const newId = publicSongs.length ? Math.max(...publicSongs.map(s => Number(s.id) || 0)) + 1 : 1;
      publicSongs.push({
        id: newId,
        title: { fa: data.titleFa, en: '' },
        artist: data.artist,
        composer: data.artist,
        youtubeId: data.youtubeId || '',
        audioUrl: data.audioUrl || '',
        presentationFileUrl: data.pptxUrl || '',
        pdfFileUrl: data.pdfUrl || '',
        lyrics: { fa: data.lyricsFa || '', en: '' },
        chord: data.baseKey || '',
        chordsText: data.chords || '',
        language: 'fa',
        dateAdded: new Date().toISOString().split('T')[0],
        hasTiming: false,
      });
      newCount++;
      console.log(`  ✨ Added new to JSON: "${data.titleFa}"`);
    }

    // 2. Sync to Supabase if connected
    if (supabase) {
      const existingDb = existingDbMap.get(norm);
      if (existingDb) {
        // Upgrade fields in DB if new data is present
        const updatePayload = {};
        if (!existingDb.audio_url && data.audioUrl) updatePayload.audio_url = data.audioUrl;
        if (!existingDb.lyrics_fa && data.lyricsFa) updatePayload.lyrics_fa = data.lyricsFa;
        if (!existingDb.chords && data.chords) updatePayload.chords = data.chords;
        if ((!existingDb.artist || existingDb.artist === 'ناشناس') && data.artist) updatePayload.artist = data.artist;
        if (!existingDb.youtube_id && data.youtubeId) updatePayload.youtube_id = data.youtubeId;

        if (Object.keys(updatePayload).length > 0) {
          await supabase
            .from('church_worship_songs')
            .update(updatePayload)
            .eq('id', existingDb.id);
          console.log(`  ✓ Enriched in Supabase: "${data.titleFa}"`);
        }
      } else {
        // Insert brand new song into Supabase
        await supabase
          .from('church_worship_songs')
          .insert([{
            title_fa: data.titleFa,
            artist: data.artist,
            audio_url: data.audioUrl,
            youtube_id: data.youtubeId,
            lyrics_fa: data.lyricsFa,
            chords: data.chords,
            is_verified: false,
          }]);
        console.log(`  ✨ Inserted in Supabase: "${data.titleFa}"`);
      }
    }

    await sleep(REQUEST_DELAY_MS);
  }

  // Save updated JSON file
  fs.writeFileSync(jsonPath, JSON.stringify(publicSongs, null, 2), 'utf8');
  console.log(`\n💾 Successfully saved ${publicSongs.length} songs to ${jsonPath}!`);

  const fixedPath = path.join(__dirname, '..', 'public', 'worship', 'data', 'worship_songs_fixed.json');
  if (fs.existsSync(fixedPath)) {
    fs.writeFileSync(fixedPath, JSON.stringify(publicSongs, null, 2), 'utf8');
    console.log(`💾 Synced to worship_songs_fixed.json`);
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`🏁 UPGRADE COMPLETE: ${newCount} new, ${updatedCount} updated.`);
  console.log('═'.repeat(60));
}

// Check CLI arguments for limit (e.g. node scripts/sync_kalameh_weekly.cjs --limit 20 or full)
const limitArg = process.argv.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 30; // default batch 30 for safety

runSync(limit).catch(err => {
  console.error('Fatal error during sync:', err);
  process.exit(1);
});
