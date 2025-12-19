const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function findMissingChapters() {
    console.log('Finding missing MOJDEH chapters...\n');

    // Get all chapters
    const { data: allChapters } = await supabase
        .from('bible_chapters')
        .select('id, book_iso, chapter_number')
        .order('book_iso')
        .order('chapter_number');

    let missing = [];

    for (const ch of allChapters) {
        const { count } = await supabase
            .from('bible_verses')
            .select('*', { count: 'exact', head: true })
            .eq('chapter_id', ch.id)
            .eq('translation_id', 1);

        if (count === 0) {
            missing.push(`${ch.book_iso} ${ch.chapter_number}`);
        }
    }

    console.log(`Missing chapters (${missing.length}):`);
    console.log(missing.slice(0, 20).join(', '));
    if (missing.length > 20) {
        console.log(`... and ${missing.length - 20} more`);
    }
}

findMissingChapters().catch(console.error);
