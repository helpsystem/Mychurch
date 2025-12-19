
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY are required in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectBible() {
    console.log('Inspecting GEN 1 Data...');

    // 1. Check bible_chapters for GEN 1
    console.log('\n--- bible_chapters (GEN 1) ---');
    const { data: chapters, error: chapterError } = await supabase
        .from('bible_chapters')
        .select('*')
        .eq('book_iso', 'GEN')
        .eq('chapter_number', 1);

    if (chapterError) {
        console.error('Error fetching chapters:', chapterError);
    } else {
        console.log('Found chapters:', chapters.length);
        chapters.forEach(ch => {
            console.log(`ID: ${ch.id}, Lang: ${ch.language}, Audio: ${ch.audio_url}`);
        });
    }

    // 2. Check bible_verses for GEN 1 (MOJDEH, QADIM)
    // MOJDEH = 1, QADIM = 2 (based on previous log)
    console.log('\n--- bible_verses (GEN 1) count by Translation ---');

    // We need to know the chapter_id from above. 
    // If there are multiple chapters, we check them all?
    // Let's just check verses table generally for GEN 1 logic.
    // We'll join or just check by translation_id directly if possible, or we need chapter IDs first.

    if (chapters && chapters.length > 0) {
        const chapterIds = chapters.map(c => c.id);
        console.log('Checking verses for Chapter IDs:', chapterIds);

        const { data: verses, error: verseError } = await supabase
            .from('bible_verses')
            .select('id, translation_id, verse_number, text_fa')
            .in('chapter_id', chapterIds)
            .in('translation_id', [1, 2]) // MOJDEH and QADIM
            .limit(5);

        if (verseError) {
            console.error('Error fetching verses:', verseError);
        } else {
            console.log('Sample verses found:', verses.length);
            verses.forEach(v => {
                console.log(`Verse ${v.verse_number} (Trans ${v.translation_id}): ${v.text_fa.substring(0, 30)}...`);
            });

            // Count total verses for these translations
            // We can't easily count with 'select' + 'length' efficiently for ALL, but for sample it's fine.
        }
    }
}

inspectBible();
