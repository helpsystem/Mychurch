const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
    try {
        console.log('📊 Sync Status Report');
        console.log('=====================');
        console.log(`🔗 Connecting to ${supabaseUrl}`);

        // 1. Worship Songs
        const { count: songsTotal, error: err1 } = await supabase
            .from('worship_songs')
            .select('*', { count: 'exact', head: true });

        if (err1) throw err1;

        const { count: songsSynced, error: err2 } = await supabase
            .from('worship_songs')
            .select('*', { count: 'exact', head: true })
            .eq('has_timing', true);

        if (err2) throw err2;

        const songsTotalCount = songsTotal || 0;
        const songsSyncedCount = songsSynced || 0;

        console.log('\n🎵 Worship Songs:');
        console.log(`   - Total: ${songsTotalCount}`);
        console.log(`   - Synced: ${songsSyncedCount}`);
        console.log(`   - Remaining: ${songsTotalCount - songsSyncedCount}`);

        // 2. Bible Chapters (Persian TPV/MOJDEH)
        // Counting distinct manually via query is hard with Supabase JS client without rpc.
        // We will do a rough check or use a known view if available.
        // Alternatively, fetch all and count in memory (might be heavy but accurate for counts < 1000s)

        // Fetch distinct book/chapter for Persian translations
        /*
        const { data: bibleData, error: err3 } = await supabase
            .from('bible_verses')
            .select('book, chapter, translation')
            .in('translation', ['TPV', 'MOJDEH', 'POV-FAS']);
        
        if (err3) throw err3;
    
        // Deduplicate in JS
        const uniqueChapters = new Set(bibleData.map(i => `${i.translation}|${i.book}|${i.chapter}`));
        const bibleTotal = uniqueChapters.size;
        */

        // Simplified: Just check bible_audio_timing count vs estimate
        const { count: bibleSynced, error: err4 } = await supabase
            .from('bible_audio_timing')
            .select('*', { count: 'exact', head: true })
            .in('translation', ['TPV', 'MOJDEH', 'QADIM']); // Using known codes

        if (err4) throw err4;

        // For total chapters, simpler to just assume we want to know what IS synced.
        // Or we can count bible_chapters table if it exists and is reliable.
        const { count: totalChapters, error: err5 } = await supabase
            .from('bible_chapters')
            .select('*', { count: 'exact', head: true });

        // Assuming ~1189 chapters * 2 main translations = ~2378
        const bibleTotalEstimated = totalChapters ? totalChapters * 2 : 2378;
        const bibleSyncedCount = bibleSynced || 0;

        console.log('\n📖 Bible Chapters (Persian):');
        console.log(`   - Total Chapters (Est): ${bibleTotalEstimated}`);
        console.log(`   - Synced (Audio Timing): ${bibleSyncedCount}`);
        console.log(`   - Remaining (Est): ${bibleTotalEstimated - bibleSyncedCount}`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error checking status:', err);
        process.exit(1);
    }
}

checkStatus();
