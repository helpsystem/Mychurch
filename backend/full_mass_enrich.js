const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = 'https://xjliwbfdzmxncyebblxw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbGl3YmZkem14bmN5ZWJibHh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY1MTIyNywiZXhwIjoyMDg4MjI3MjI3fQ.M0clJXVWiqEQO1C5ttrqo1jl7nh8gri6nQ-qYhmk6Jo';

if (!SUPABASE_KEY) {
    console.error("❌ SUPABASE_SERVICE_KEY is missing in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const JSON_PATH = path.join(__dirname, '..', 'frontend', 'public', 'worship', 'data', 'worship_songs.json');

async function enrich() {
    console.log("🚀 Starting Full Mass Enrichment...");

    if (!fs.existsSync(JSON_PATH)) {
        console.error(`❌ File not found at ${JSON_PATH}`);
        return;
    }

    let content = fs.readFileSync(JSON_PATH, 'utf8');
    // Strip BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }
    const songs = JSON.parse(content);
    console.log(`📊 Found ${songs.length} songs in JSON.`);

    let tableName = 'worship_songs';
    console.log(`📝 Using table: ${tableName}`);

    let successCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;

    for (const song of songs) {
        const titleFa = song.title?.fa;
        const titleEn = song.title?.en || "";
        const artist = song.artist || "";
        const youtubeId = song.youtubeId || "";
        const lyricsFa = song.lyrics?.fa || "";
        
        if (!titleFa && !titleEn) continue;

        // Try to update by title_fa first, if provided
        let query = supabase.from(tableName).update({
            artist: artist,
            youtube_id: youtubeId,
            lyrics_fa: lyricsFa
        });

        if (titleFa) {
            query = query.eq('title_fa', titleFa);
        } else {
            query = query.eq('title_en', titleEn);
        }

        const { data, error, count, status } = await query.select();

        if (error) {
            console.error(`❌ Error updating ${titleFa || titleEn}:`, error.message);
            errorCount++;
        } else if (data && data.length > 0) {
            successCount++;
        } else {
            // Try title_en fallback if title_fa failed
            if (titleFa && titleEn) {
                const { data: dataEn, error: errorEn } = await supabase
                    .from(tableName)
                    .update({
                        artist: artist,
                        youtube_id: youtubeId,
                        lyrics_fa: lyricsFa
                    })
                    .eq('title_en', titleEn)
                    .select();
                
                if (!errorEn && dataEn && dataEn.length > 0) {
                    successCount++;
                    continue;
                }
            }
            notFoundCount++;
        }
    }

    console.log(`\n✅ Enrichment complete!`);
    console.log(`✨ Successful updates: ${successCount}`);
    console.log(`🔍 Not Found in DB: ${notFoundCount}`);
    console.log(`❌ Errors: ${errorCount}`);
}

enrich();
