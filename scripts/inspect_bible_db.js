
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY are required in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectBible() {
    console.log('Inspecting Bible Translations...');

    // 1. Get Translation IDs
    const { data: translations, error: transError } = await supabase
        .from('bible_translations')
        .select('*');

    if (transError) {
        console.error('Error fetching translations:', transError);
        return;
    }

    console.log('Translations found:', translations.map(t => `${t.code} (${t.id})`));

    const mojdeh = translations.find(t => t.code === 'MOJDEH');
    const qadim = translations.find(t => t.code === 'QADIM');

    if (!mojdeh && !qadim) {
        console.log('Neither MOJDEH nor QADIM found in translations table.');
        return;
    }

    // 2. Check a few verses for Audio
    // Note: Schema says 'bible_verses' has 'audio_url_fa', but it's not translation-specific directly in that column 
    // unless we assume one translation per row OR the table structure is normalizing verses.
    // Let's check how verses are stored. Join with chapters and books.

    // Wait, the schema showed 'bible_verses' has 'text_en', 'text_fa', 'audio_url_fa'. 
    // This implies ONE Persian translation per verse row if following that schema strictly.
    // OR maybe there are multiple rows for the same reference but different translation?
    // Let's check existing logic. Usually it's either:
    // A) One row per verse, specific translation columns (text_mojdeh, text_tpv) - Unlikely based on schema.
    // B) One row per verse, generic 'text_fa', and we don't store multiple FA translations in one row?
    // C) One row per verse PER translation? - This would mean 'chapter_id' + 'verse_number' is NOT Unique, OR 'bible_chapters' is per translation?

    // Schema says: UNIQUE (chapter_id, verse_number). So only ONE row per verse number per chapter.
    // And 'bible_chapters' has 'book_id' and 'chapter_number'.
    // This schema seems to support ONE generic 'Persian' text. 
    // IF so, how do we store MOJDEH vs QADIM?

    // Maybe 'bible_translations' is not linked to 'bible_verses' in the schema I read?
    // Let's re-read schema... 
    // "CREATE TABLE bible_translations..."
    // But 'bible_verses' does NOT have 'translation_id'.
    // It has 'text_en', 'text_fa'. 

    // HYPOTHESIS: The current schema in `bible-schema.sql` might be a simplified or "Unified" one, 
    // NOT describing how MOJDEH and QADIM are currently stored if they coexist.
    // OR, maybe they are in a different table? 'bible_verses_translations'?

    // Let's check table structure of 'bible_verses' dynamically to see all columns.

    // We'll just fetch one row from 'bible_verses' and see what keys it has.
    const { data: sampleVerse, error: sampleError } = await supabase
        .from('bible_verses')
        .select('*')
        .limit(1);

    if (sampleError) {
        console.error('Error fetching sample verse:', sampleError);
    } else {
        console.log('Sample Verse Keys:', Object.keys(sampleVerse[0] || {}));
    }

    // Also check if there are other tables like 'bible_verses_mojdeh' etc.
    // (We can't easily list tables via simple client unless we use specific SQL function, 
    // but we can try to select from likely names)
}

inspectBible();
