require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function seedWorshipSongs() {
    const filePath = path.join(__dirname, '..', '..', 'data', 'worship_songs.json');

    if (!fs.existsSync(filePath)) {
        console.error('❌ File not found:', filePath);
        return;
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const songs = JSON.parse(rawData);

    console.log(`\n📁 Found ${songs.length} songs in worship_songs.json`);
    console.log('🚀 Starting import to Supabase...\n');

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    // Process in batches of 50 to avoid rate limits
    const BATCH_SIZE = 50;

    for (let i = 0; i < songs.length; i += BATCH_SIZE) {
        const batch = songs.slice(i, i + BATCH_SIZE);

        const rows = batch.map(song => {
            // Clean up title - remove extra artist info appended to title
            let titleFa = (song.title?.fa || '').trim();
            let titleEn = (song.title?.en || '').trim();

            // Remove HTML entities
            titleFa = titleFa.replace(/&#039;/g, "'").replace(/&amp;/g, '&');
            titleEn = titleEn.replace(/&#039;/g, "'").replace(/&amp;/g, '&');

            return {
                title_fa: titleFa || '(بدون نام)',
                title_en: titleEn || null,
                artist: (song.artist || '').trim() || null,
                youtube_id: song.youtubeId || null,
                audio_url: song.audioUrl || null,
                lyrics_fa: (song.lyrics?.fa || '').trim() || null,
                lyrics_en: (song.lyrics?.en || '').trim() || null,
            };
        });

        const { error } = await supabase
            .from('worship_songs')
            .insert(rows);

        if (error) {
            console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
            errors += batch.length;
        } else {
            inserted += batch.length;
            process.stdout.write(`✅ Imported ${inserted}/${songs.length} songs...\r`);
        }
    }

    console.log(`\n\n🎉 Import complete!`);
    console.log(`   ✅ Inserted: ${inserted}`);
    console.log(`   ⚠️  Errors:  ${errors}`);
}

seedWorshipSongs();
