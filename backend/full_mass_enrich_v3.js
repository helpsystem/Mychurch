const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// CORRECT
const TARGET_TABLE = 'worship_songs';
const SUPABASE_URL = 'https://xjliwbfdzmxncyebblxw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbGl3YmZkem14bmN5ZWJibHh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY1MTIyNywiZXhwIjoyMDg4MjI3MjI3fQ.M0clJXVWiqEQO1C5ttrqo1jl7nh8gri6nQ-qYhmk6Jo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const JSON_PATH = path.join(__dirname, '..', 'frontend', 'public', 'worship', 'data', 'worship_songs.json');

function normalizePersian(text) {
    if (!text) return "";
    return text
        .replace(/ي/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(/\u200C/g, ' ') // Replace ZWNJ with space for matching
        .trim();
}

async function enrich() {
    console.log("🚀 Starting Comprehensive Mass Enrichment (v3)...");
    
    let content = fs.readFileSync(JSON_PATH, 'utf8');
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    const jsonSongs = JSON.parse(content);
    console.log(`📊 Found ${jsonSongs.length} songs in JSON.`);

    const tableName = 'church_worship_songs';
    
    // Fetch all existing songs from DB to avoid matching in loop (better performance)
    const { data: dbSongs, error: fetchError } = await supabase.from(tableName).select('id, title_fa, title_en');
    if (fetchError) {
        console.error("❌ Failed to fetch existing songs:", fetchError.message);
        return;
    }
    console.log(`✅ Loaded ${dbSongs.length} existing songs from DB.`);

    let successCount = 0;
    let insertCount = 0;
    let errorCount = 0;

    for (const song of jsonSongs) {
        const titleFa = song.title?.fa || "";
        const titleEn = song.title?.en || "";
        const normFa = normalizePersian(titleFa);
        
        // Find match in dbSongs
        const dbMatch = dbSongs.find(s => 
            (s.title_fa && normalizePersian(s.title_fa) === normFa) || 
            (s.title_en && s.title_en.toLowerCase() === titleEn.toLowerCase())
        );

        const updateData = {
            artist: song.artist || "",
            youtube_id: song.youtubeId || "",
            lyrics_fa: song.lyrics?.fa || "",
            lyrics_en: song.lyrics?.en || "",
            audio_url: song.audioUrl || "",
            timepoints: song.timepoints ? JSON.stringify(song.timepoints) : null
        };

        if (dbMatch) {
            // Update existing
            const { error } = await supabase
                .from(tableName)
                .update(updateData)
                .eq('id', dbMatch.id);
            
            if (error) {
                console.error(`❌ Error updating ${titleFa}:`, error.message);
                errorCount++;
            } else {
                successCount++;
            }
        } else {
            // Insert missing
            const { error } = await supabase
                .from(tableName)
                .insert({
                    ...updateData,
                    title_fa: titleFa,
                    title_en: titleEn
                });
            
            if (error) {
                console.error(`❌ Error inserting ${titleFa}:`, error.message);
                errorCount++;
            } else {
                insertCount++;
            }
        }

        if ((successCount + insertCount + errorCount) % 50 === 0) {
            console.log(`⏳ Processed ${successCount + insertCount + errorCount} songs...`);
        }
    }

    console.log(`\n✨ ENRICHMENT SUMMARY`);
    console.log(`✅ Updated existing: ${successCount}`);
    console.log(`➕ Inserted new: ${insertCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`🎊 Total processed: ${jsonSongs.length}`);
}

enrich();
