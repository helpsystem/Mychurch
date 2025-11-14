/**
 * HiDrive URL Prefix Migration using Supabase Service Key
 * Replaces local path prefixes with public HiDrive URL prefixes for:
 *   - sermons.audiourl: /audio/ -> https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/sermons/audio/
 *   - worship_songs.audiourl: /worship/audio/ -> https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/worship/audio/
 *   - events.imageurl: /images/ -> https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/events/images/
 *
 * Requirements:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_KEY (service role key for write access)
 *
 * Usage:
 *   node backend/scripts/hidrive-url-migrate.js
 */

require('dotenv').config({ path: process.cwd() + '/backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const mappings = [
  { table: 'sermons', column: 'audiourl', oldPrefix: '/audio/', newPrefix: 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/sermons/audio/' },
  { table: 'worship_songs', column: 'audiourl', oldPrefix: '/worship/audio/', newPrefix: 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/worship/audio/' },
  { table: 'events', column: 'imageurl', oldPrefix: '/images/', newPrefix: 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch/events/images/' }
];

async function migrateField({ table, column, oldPrefix, newPrefix }) {
  console.log(`\n=== Migrating ${table}.${column} (${oldPrefix} -> ${newPrefix}) ===`);

  // Fetch rows needing update
  const { data: rows, error } = await supabase
    .from(table)
    .select('id,' + column)
    .like(column, oldPrefix + '%');

  if (error) {
    console.error(`Fetch error on ${table}:`, error.message);
    return { table, column, updated: 0, skipped: 0, error: error.message };
  }

  if (!rows || rows.length === 0) {
    console.log('No rows needing update.');
    return { table, column, updated: 0, skipped: 0 };
  }

  let updated = 0;
  let skipped = 0;

  // Batch updates (Supabase up to ~1000 rows per call; we update individually for correctness)
  for (const row of rows) {
    const value = row[column];
    if (!value || !value.startsWith(oldPrefix)) { skipped++; continue; }
    const newValue = newPrefix + value.substring(oldPrefix.length);

    const { error: updErr } = await supabase
      .from(table)
      .update({ [column]: newValue })
      .eq('id', row.id);

    if (updErr) {
      console.error(`Failed row ${row.id}:`, updErr.message);
      skipped++;
    } else {
      updated++;
    }
  }

  // Sample verification
  const { data: sample, error: sampleErr } = await supabase
    .from(table)
    .select('id,' + column)
    .like(column, newPrefix + '%')
    .limit(5);

  if (sampleErr) {
    console.warn('Sample verification error:', sampleErr.message);
  } else {
    console.log('Sample updated rows:', sample);
  }

  console.log(`Result: ${updated} updated, ${skipped} skipped (total scanned ${rows.length})`);
  return { table, column, updated, skipped };
}

(async () => {
  console.log('Starting HiDrive URL migration via Supabase...');
  const results = [];
  for (const m of mappings) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await migrateField(m));
  }
  console.log('\n=== Summary ===');
  for (const r of results) {
    console.log(`${r.table}.${r.column}: updated ${r.updated}, skipped ${r.skipped}`);
  }
  console.log('\nDone.');
  process.exit(0);
})();
