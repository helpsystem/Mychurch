const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

function cleanTitle(str) {
  if (!str) return '';
  return str
    .replace(/^سرود\s*(شماره)?\s*\d*[\s:ـ-]*/i, '')
    .replace(/[\u200c\u200b\s]+/g, ' ')
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[0-9۰-۹]/g, '')
    .replace(/[،,.:;!؟?()«»"'\-_/\\]/g, '')
    .trim()
    .toLowerCase();
}

function cleanLyrics(str) {
  if (!str) return '';
  return str
    .replace(/[\u200c\u200b\s]+/g, ' ')
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[،,.:;!؟?()«»"'\-_/\\]/g, '')
    .trim()
    .toLowerCase()
    .slice(0, 80); // first 80 chars
}

async function run() {
  const songs = (await pool.query('SELECT id, title_fa, title_en, artist, lyrics_fa, audio_url, video_url FROM church_worship_songs ORDER BY id ASC')).rows;
  console.log(`Analyzing ${songs.length} worship songs in church_worship_songs...`);

  // 1. Cleaned title duplicates
  const titleMap = new Map();
  const titleDupes = [];
  for (const s of songs) {
    const key = cleanTitle(s.title_fa);
    if (!key || key.length < 3) continue;
    if (titleMap.has(key)) {
      titleDupes.push({ first: titleMap.get(key), second: s, key });
    } else {
      titleMap.set(key, s);
    }
  }
  console.log(`\n1. Songs with almost identical titles (ignoring prefix 'سرود', numbers, symbols): ${titleDupes.length}`);
  for (const d of titleDupes) {
    console.log(`   - "${d.first.title_fa}" (ID: ${d.first.id}) <=> "${d.second.title_fa}" (ID: ${d.second.id}) [key: ${d.key}]`);
  }

  // 2. Exact or near duplicate lyrics
  const lyricsMap = new Map();
  const lyricDupes = [];
  for (const s of songs) {
    if (!s.lyrics_fa || s.lyrics_fa.trim().length < 20) continue;
    const lKey = cleanLyrics(s.lyrics_fa);
    if (lyricsMap.has(lKey)) {
      lyricDupes.push({ first: lyricsMap.get(lKey), second: s });
    } else {
      lyricsMap.set(lKey, s);
    }
  }
  console.log(`\n2. Songs with identical lyric beginnings (possible duplicate entries): ${lyricDupes.length}`);
  for (const d of lyricDupes) {
    console.log(`   - "${d.first.title_fa}" (#${d.first.id}) <=> "${d.second.title_fa}" (#${d.second.id})`);
  }

  // 3. Songs with broken/test/placeholder content
  const suspicious = [];
  for (const s of songs) {
    const issues = [];
    if (!s.title_fa || s.title_fa.trim().length === 0) issues.push('empty title_fa');
    if (s.title_fa && /^\d+$/.test(s.title_fa.trim())) issues.push('title is only numbers');
    if (s.lyrics_fa && /test|lorem|null|undefined|<html|<body/i.test(s.lyrics_fa)) issues.push('suspicious text in lyrics');
    if (s.audio_url && !s.audio_url.startsWith('http') && !s.audio_url.startsWith('/')) issues.push('invalid audio_url format');
    if (s.video_url && !s.video_url.startsWith('http') && !s.video_url.startsWith('/')) issues.push('invalid video_url format');
    if (issues.length > 0) {
      suspicious.push({ song: s, issues });
    }
  }
  console.log(`\n3. Suspicious / malformed entries: ${suspicious.length}`);
  for (const item of suspicious) {
    console.log(`   - Song #${item.song.id} ("${item.song.title_fa}"): ${item.issues.join(', ')}`);
  }

  // 4. Songs without audio AND without video AND without lyrics
  const emptySongs = songs.filter(s => 
    (!s.lyrics_fa || s.lyrics_fa.trim().length === 0) &&
    (!s.audio_url || s.audio_url.trim().length === 0) &&
    (!s.video_url || s.video_url.trim().length === 0)
  );
  console.log(`\n4. Empty placeholder songs (no lyrics, no audio, no video): ${emptySongs.length}`);
  for (const s of emptySongs.slice(0, 10)) {
    console.log(`   - #${s.id}: "${s.title_fa}" by "${s.artist || 'Unknown'}"`);
  }
}

run().catch(console.error).finally(() => pool.end());
