const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Basic manual connection info relying on current context or env variables
// You may need to load dotenv if available, otherwise fallback to local defaults
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', 'mychurch-next', '.env.local') });

// Connect to the active database on port 5433 directly now that CF proxy is off
const connectionString = 'postgresql://mychurch_user:MyChurch2024Secure!@samanabyar.online:5433/mychurch';

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false } // Keeping SSL bypass for self-signed or direct IPs
});

const SQL_FILE = path.join(__dirname, 'create_unified_tables.sql');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const BIBLE_FILE = path.join(OUTPUT_DIR, 'aligned_bible_all.tsv');
const SONGS_FILE = path.join(OUTPUT_DIR, 'aligned_songs_with_media.tsv');

async function importBibleData() {
  console.log('📖 Starting Bible verses import...');
  if (!fs.existsSync(BIBLE_FILE)) {
    console.error(`❌ File not found: ${BIBLE_FILE}`);
    return;
  }

  // Clear existing to avoid duplicates
  await pool.query('TRUNCATE TABLE unified_bible_verses RESTART IDENTITY;');

  const lines = fs.readFileSync(BIBLE_FILE, 'utf8').split('\n').filter(l => l.trim() !== '');
  // Skip header
  lines.shift();

  let count = 0;
  const BATCH_SIZE = 1000;
  let batch = [];

  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.length < 11) continue;

    batch.push(`(
      '${cols[0].replace(/'/g, "''")}',
      ${parseInt(cols[1])},
      ${parseInt(cols[2])},
      '${cols[3].replace(/'/g, "''")}',
      '${cols[4].replace(/'/g, "''")}',
      '${cols[5].replace(/'/g, "''")}',
      '${cols[6].replace(/'/g, "''")}',
      '${cols[7].replace(/'/g, "''")}',
      '${cols[8].replace(/'/g, "''")}',
      '${cols[9].replace(/'/g, "''")}',
      '${cols[10].replace(/'/g, "''")}'
    )`);

    count++;

    if (batch.length >= BATCH_SIZE) {
      await insertBibleBatch(batch);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await insertBibleBatch(batch);
  }

  console.log(`✅ Successfully imported ${count} Bible verses.`);
}

async function insertBibleBatch(batch) {
  const query = `
    INSERT INTO unified_bible_verses 
    (book_code, chapter, verse, en_kjv, fa_tpv, fa_mojdeh, fa_qadim, fa_wp, tpv_audio_url, mojdeh_audio_url, qadim_audio_url)
    VALUES ${batch.join(',\n')}
  `;
  try {
    await pool.query(query);
  } catch (err) {
    console.error('Error inserting bible batch:', err.message);
  }
}

async function importSongsData() {
  console.log('🎶 Starting Worship Songs import...');
  if (!fs.existsSync(SONGS_FILE)) {
    console.error(`❌ File not found: ${SONGS_FILE}`);
    return;
  }

  // Clear existing to avoid duplicates
  await pool.query('TRUNCATE TABLE unified_worship_songs RESTART IDENTITY;');

  const lines = fs.readFileSync(SONGS_FILE, 'utf8').split('\n').filter(l => l.trim() !== '');
  // Skip header
  lines.shift();

  let count = 0;
  const BATCH_SIZE = 1000;
  let batch = [];

  for (const line of lines) {
    const cols = line.split('\t');
    if (cols.length < 9) continue;

    batch.push(`(
      '${cols[0].replace(/'/g, "''")}',
      '${cols[1].replace(/'/g, "''")}',
      '${cols[2].replace(/'/g, "''")}',
      ${parseInt(cols[3])},
      '${cols[4].replace(/'/g, "''")}',
      '${cols[5].replace(/'/g, "''")}',
      '${cols[6].replace(/'/g, "''")}',
      '${cols[7].replace(/'/g, "''")}',
      ${cols[8].trim() === 'Yes' ? 'true' : 'false'}
    )`);

    count++;

    if (batch.length >= BATCH_SIZE) {
      await insertSongsBatch(batch);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await insertSongsBatch(batch);
  }

  console.log(`✅ Successfully imported ${count} worship song lines.`);
}

async function insertSongsBatch(batch) {
  const query = `
    INSERT INTO unified_worship_songs 
    (song_id, title_fa, title_en, line_num, persian_lyric, english_lyric, audio_url, video_url, has_timing)
    VALUES ${batch.join(',\n')}
  `;
  try {
    await pool.query(query);
  } catch (err) {
    console.error('Error inserting songs batch:', err.message);
  }
}

async function main() {
  console.log('🚀 Connecting to database and starting import...');
  
  try {
    console.log('🏗️ Creating database tables...');
    const sqlScript = fs.readFileSync(SQL_FILE, 'utf8');
    await pool.query(sqlScript);
    console.log('✅ Tables created successfully!');

    await importBibleData();
    await importSongsData();
    console.log('🎉 Unified database import complete!');
  } catch (err) {
    console.error('❌ Fatal error during import:', err);
  } finally {
    await pool.end();
  }
}

main();
