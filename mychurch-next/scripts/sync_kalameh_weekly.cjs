/**
 * sync_kalameh_weekly.cjs
 * اسکریپت همگام‌سازی هفتگی سرودهای کلمه
 * 
 * روش: صفحه آرشیو سرودها + deep scrape تک‌تک صفحات سرود
 * آکلاس‌های HTML کلمه: song_title, song_author, song_compositor, chord_base
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
const REQUEST_DELAY_MS = 2000;
const PAGE_DELAY_MS = 3000;
const MAX_PAGES = 30; // صفحات آرشیو

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const AXIOS_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'fa,en;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function normalizeTitle(title) {
  if (!title) return '';
  return title
    .replace(/[\u200C\u200B\u200D]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function extractYoutubeId(html) {
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
  if (url.startsWith('../')) return KALAMEH_BASE + '/' + url.replace(/^(\.\.\/)+/, '');
  return KALAMEH_BASE + '/' + url;
}

// ─── Deep scrape a single song page ──────────────────────────────────────────

async function scrapeSongPage(songUrl) {
  try {
    const resp = await axios.get(songUrl, { headers: AXIOS_HEADERS, timeout: 20000 });
    const html = resp.data;
    const $ = cheerio.load(html);

    // ── 1. Title ──────────────────────────────────────────────────────────────
    // Kalameh pattern: <h1 class="page-header">عنوان | کلمه</h1>
    // or <title>عنوان | کلمه</title>
    let titleFa = '';

    // From <h1 class="page-header"> or <h1>
    const h1Text = $('h1.page-header, h1').first().text().trim();
    if (h1Text) titleFa = h1Text.split('|')[0].trim();

    // Fallback to <title>
    if (!titleFa) {
      const titleTag = $('title').text().trim();
      titleFa = titleTag.split('|')[0].trim();
    }

    // Also look for the accordion header in case we landed on list page
    if (!titleFa) {
      titleFa = $('h3.views-accordion-songs_and_video-page-header .song_title').first().text().trim();
    }

    // ── 2. Artist / Composer ──────────────────────────────────────────────────
    // Kalameh uses: <span class="song_author">نام خواننده</span>
    //               <span class="song_compositor">نام آهنگساز</span>
    let artist = '';
    const authorEl = $('span.song_author').first().text().trim();
    const compositorEl = $('span.song_compositor').first().text().trim();

    if (authorEl) artist = authorEl;
    else if (compositorEl) artist = compositorEl;
    else {
      // Fallback: field-name-field-artist
      artist = $('.field-name-field-artist .field-item').first().text().trim();
    }

    // ── 3. Lyrics ─────────────────────────────────────────────────────────────
    // Kalameh stores lyrics in: .field-name-field-song-body .field-item
    // or inside <pre> tags or .lyrics-text
    let lyricsFa = '';

    const lyricSelectors = [
      '.field-name-field-song-body .field-item',
      '.field-name-field-lyrics .field-item',
      '.lyrics-text',
      '.field-name-body .field-item',
      'pre',
    ];

    for (const sel of lyricSelectors) {
      const text = $(sel).first().text().trim();
      if (text && text.length > 30 && /[\u0600-\u06FF]/.test(text)) {
        lyricsFa = text;
        break;
      }
    }

    // Last resort: find any big Persian text block
    if (!lyricsFa) {
      $('div, p, section').each((_, el) => {
        const text = $(el).text().trim();
        if (
          text.length > 80 &&
          text.length < 5000 &&
          /[\u0600-\u06FF]/.test(text) &&
          !text.includes('DOCTYPE') &&
          !text.includes('jQuery')
        ) {
          if (text.length > (lyricsFa ? lyricsFa.length : 0)) {
            lyricsFa = text;
          }
        }
      });
    }

    // ── 4. Media: Audio, PPTX, YouTube ───────────────────────────────────────
    let audioUrl = null;
    let pptxUrl = null;
    let youtubeId = extractYoutubeId(html); // from raw HTML (iframes etc)

    $('a').each((_, a) => {
      const href = $(a).attr('href') || '';
      const hrefLower = href.toLowerCase();
      if (hrefLower.includes('.mp3') || hrefLower.includes('.wav') || hrefLower.includes('.m4a')) {
        if (!audioUrl) audioUrl = makeAbsoluteUrl(href);
      }
      if (hrefLower.includes('.pptx') || hrefLower.includes('.ppt')) {
        if (!pptxUrl) pptxUrl = makeAbsoluteUrl(href);
      }
      // also check for youtube in hrefs
      if (!youtubeId) {
        youtubeId = extractYoutubeId(href);
      }
    });

    // Also check <source> tags
    $('source').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (src.toLowerCase().includes('.mp3') && !audioUrl) {
        audioUrl = makeAbsoluteUrl(src);
      }
    });

    // ── 5. Chord / Key ────────────────────────────────────────────────────────
    // Kalameh: <select chord_base="D">
    let chords = null;
    const chordAttr = $('[chord_base]').attr('chord_base');
    if (chordAttr) chords = chordAttr;
    else {
      // Try regex on raw HTML
      const chordMatch = html.match(/chord_base="([A-Ga-g][#b]?)"/);
      if (chordMatch) chords = chordMatch[1];
    }

    // ── 6. Song URL (canonical) ───────────────────────────────────────────────
    const canonicalUrl = $('link[rel="canonical"]').attr('href') || songUrl;

    return {
      titleFa: titleFa || null,
      artist: artist || 'ناشناس',
      lyricsFa: lyricsFa || null,
      audioUrl: audioUrl || null,
      youtubeId: youtubeId || null,
      pptxUrl: pptxUrl || null,
      chords: chords || null,
      sourceUrl: canonicalUrl,
    };
  } catch (err) {
    console.error(`⚠️  Failed to scrape ${songUrl}: ${err.message}`);
    return null;
  }
}

// ─── Collect song links from archive page ────────────────────────────────────

async function getSongLinksFromPage(pageNum) {
  const url = pageNum === 0 ? ARCHIVE_URL : `${ARCHIVE_URL}?page=${pageNum}`;
  console.log(`\n📥 Fetching archive page ${pageNum}: ${url}`);

  try {
    const resp = await axios.get(url, { headers: AXIOS_HEADERS, timeout: 20000 });
    const $ = cheerio.load(resp.data);
    const html = resp.data;

    const songLinks = new Set();

    // Method 1: accordion headers contain links to individual song pages
    // Pattern: <h3 class="views-accordion-songs_and_video-page-header">
    //            <a href="/song/...">...</a>
    //          </h3>
    $('h3.views-accordion-songs_and_video-page-header a').each((_, a) => {
      const href = $(a).attr('href') || '';
      if (href) songLinks.add(makeAbsoluteUrl(href));
    });

    // Method 2: Any link inside .view-songs-and-video
    $('.view-songs-and-video a, .view-content a').each((_, a) => {
      const href = $(a).attr('href') || '';
      if (
        href &&
        (href.includes('/song/') || href.includes('/node/')) &&
        !href.includes('#') &&
        !href.includes('?')
      ) {
        songLinks.add(makeAbsoluteUrl(href));
      }
    });

    // Method 3: fallback - any link with /song/ or persian-slug patterns
    if (songLinks.size === 0) {
      $('a').each((_, a) => {
        const href = $(a).attr('href') || '';
        if (
          href.startsWith('/song/') ||
          href.match(/^\/[^\/?#]{5,}$/) && /[\u0600-\u06FF]/.test(decodeURIComponent(href))
        ) {
          songLinks.add(makeAbsoluteUrl(href));
        }
      });
    }

    // Detect if there is a next page
    const hasNextPage = $('li.pager-next a, a.pager-next, .pager__item--next a').length > 0;

    console.log(`   Found ${songLinks.size} song links. Next page: ${hasNextPage}`);

    // Also try to extract inline data (accordion items fully rendered in HTML)
    const inlineSongs = [];
    $('h3.views-accordion-songs_and_video-page-header').each((_, h3) => {
      const h = $(h3);
      const titleFa = h.find('span.song_title').text().trim() || h.text().trim().split('\n')[0].trim();
      const artist = h.find('span.song_author').text().trim() || h.find('span.song_compositor').text().trim() || 'ناشناس';
      const link = h.find('a').attr('href') || null;

      if (titleFa) {
        // Try to get content block (sibling)
        const contentBlock = h.next();
        let lyricsFa = contentBlock.find('.lyrics-text, pre').first().text().trim() || null;
        let audioUrl = null;
        let youtubeId = null;
        let pptxUrl = null;
        let chords = null;

        const blockHtml = contentBlock.html() || '';
        youtubeId = extractYoutubeId(blockHtml);

        const chordMatch = blockHtml.match(/chord_base="([A-Ga-g][#b]?)"/);
        if (chordMatch) chords = chordMatch[1];

        contentBlock.find('a').each((_, a) => {
          const href = $(a).attr('href') || '';
          const hrefLower = href.toLowerCase();
          if (hrefLower.includes('.mp3') || hrefLower.includes('.wav')) {
            if (!audioUrl) audioUrl = makeAbsoluteUrl(href);
          }
          if (hrefLower.includes('.pptx') || hrefLower.includes('.ppt')) {
            if (!pptxUrl) pptxUrl = makeAbsoluteUrl(href);
          }
          if (!youtubeId) youtubeId = extractYoutubeId(href);
        });

        inlineSongs.push({
          titleFa,
          artist,
          lyricsFa,
          audioUrl,
          youtubeId,
          pptxUrl,
          chords,
          sourceUrl: link ? makeAbsoluteUrl(link) : null,
        });
      }
    });

    return { songLinks: Array.from(songLinks), hasNextPage, inlineSongs };
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.log(`   End of archive (404 on page ${pageNum})`);
    } else {
      console.error(`❌ Error fetching archive page ${pageNum}: ${err.message}`);
    }
    return { songLinks: [], hasNextPage: false, inlineSongs: [] };
  }
}

// ─── Main sync function ───────────────────────────────────────────────────────

async function syncKalamehSongs() {
  console.log('═'.repeat(60));
  console.log('🔄 KALAMEH SONGS WEEKLY SYNC');
  console.log(`📅 ${new Date().toLocaleString('fa-IR')}`);
  console.log('═'.repeat(60));

  // 1. Load existing songs from DB
  console.log('\n📊 Fetching existing songs from Supabase...');
  const { data: existingSongs, error: fetchError } = await supabase
    .from('church_worship_songs')
    .select('title_fa');

  if (fetchError) {
    console.error('❌ Cannot fetch existing songs:', fetchError.message);
    process.exit(1);
  }

  const existingTitles = new Set(existingSongs.map(s => normalizeTitle(s.title_fa)));
  const existingUrls = new Set(); // for URL dedup during this session

  console.log(`✅ ${existingTitles.size} existing songs loaded.`);

  const newlyAdded = [];
  const processedUrls = new Set();

  // 2. Iterate through archive pages
  let pageNum = 0;
  let hasMore = true;

  while (hasMore && pageNum < MAX_PAGES) {
    const { songLinks, hasNextPage, inlineSongs } = await getSongLinksFromPage(pageNum);

    // Process inline songs (direct from accordion HTML)
    for (const song of inlineSongs) {
      const normalized = normalizeTitle(song.titleFa);
      if (existingTitles.has(normalized)) continue;
      if (song.sourceUrl && existingUrls.has(song.sourceUrl)) continue;

      // If we have a source URL, do deep scrape for complete data
      let fullSong = song;
      if (song.sourceUrl && !processedUrls.has(song.sourceUrl)) {
        processedUrls.add(song.sourceUrl);
        await sleep(REQUEST_DELAY_MS);
        const deepData = await scrapeSongPage(song.sourceUrl);
        if (deepData && deepData.titleFa) {
          // Merge: prefer deepData but fall back to inline
          fullSong = {
            titleFa: deepData.titleFa || song.titleFa,
            artist: deepData.artist !== 'ناشناس' ? deepData.artist : song.artist,
            lyricsFa: deepData.lyricsFa || song.lyricsFa,
            audioUrl: deepData.audioUrl || song.audioUrl,
            youtubeId: deepData.youtubeId || song.youtubeId,
            pptxUrl: deepData.pptxUrl || song.pptxUrl,
            chords: deepData.chords || song.chords,
            sourceUrl: deepData.sourceUrl || song.sourceUrl,
          };
        }
      }

      await insertSong(fullSong, existingTitles, existingUrls, newlyAdded);
    }

    // Process individual song page links
    for (const link of songLinks) {
      if (processedUrls.has(link)) continue;
      if (existingUrls.has(link)) continue;
      processedUrls.add(link);

      await sleep(REQUEST_DELAY_MS);
      const songData = await scrapeSongPage(link);
      if (!songData || !songData.titleFa) continue;

      await insertSong(songData, existingTitles, existingUrls, newlyAdded);
    }

    hasMore = hasNextPage;
    pageNum++;

    if (hasMore) {
      console.log(`\n⏳ Waiting before next page...`);
      await sleep(PAGE_DELAY_MS);
    }
  }

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  console.log('🏁 SYNC COMPLETE');
  console.log(`📊 ${newlyAdded.length} new songs added to DB`);

  if (newlyAdded.length > 0) {
    const summary = newlyAdded.map(s =>
      `  • ${s.title_fa}${s.artist ? ' — ' + s.artist : ''}` +
      `${s.youtube_id ? ' [YT]' : ''}${s.audio_url ? ' [MP3]' : ''}${s.lyrics_fa ? ' [Lyrics]' : ''}`
    ).join('\n');

    console.log('\n🎵 New Songs:\n' + summary);

    const logFile = path.join(__dirname, '..', 'sync_log.txt');
    const logEntry = `\n[${new Date().toISOString()}] Added ${newlyAdded.length} songs:\n${summary}\n`;
    fs.appendFileSync(logFile, logEntry, 'utf8');
    console.log(`\n📝 Log saved to sync_log.txt`);
  } else {
    console.log('👍 Database is already up to date with Kalameh.');
  }
}

// ─── Insert a song into DB ────────────────────────────────────────────────────

async function insertSong(songData, existingTitles, existingUrls, newlyAdded) {
  if (!songData.titleFa) return;

  const normalized = normalizeTitle(songData.titleFa);
  if (existingTitles.has(normalized)) return;

  console.log(`\n✨ NEW: ${songData.titleFa}`);
  console.log(`   Artist: ${songData.artist || '—'}`);
  console.log(`   Audio: ${songData.audioUrl ? '✅' : '—'}  YouTube: ${songData.youtubeId ? '✅' : '—'}  Lyrics: ${songData.lyricsFa ? '✅' : '—'}  Chords: ${songData.chords || '—'}`);

  const row = {
    title_fa: songData.titleFa,
    artist: songData.artist || null,
    audio_url: songData.audioUrl || null,
    youtube_id: songData.youtubeId || null,
    lyrics_fa: songData.lyricsFa || null,
    chords: songData.chords || null,
    is_verified: false,
    timing_data: null,
  };

  const { data, error } = await supabase
    .from('church_worship_songs')
    .insert([row])
    .select('id, title_fa, artist, audio_url, youtube_id, lyrics_fa');

  if (error) {
    console.error(`   ❌ DB Error: ${error.message}`);
  } else if (data && data[0]) {
    console.log(`   ✅ Inserted (ID: ${data[0].id})`);
    existingTitles.add(normalized);
    if (songData.sourceUrl) existingUrls.add(songData.sourceUrl);
    newlyAdded.push(data[0]);
  }
}

// ─── Run ──────────────────────────────────────────────────────────────────────
syncKalamehSongs().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
