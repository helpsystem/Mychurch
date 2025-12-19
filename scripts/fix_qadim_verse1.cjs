const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function fixQadimVerse1() {
    console.log('🔧 Fixing QADIM Verse 1...');
    
    // Get all verse 1 for QADIM that have test text
    const { data: verses, error } = await supabase
        .from('bible_verses')
        .select('id, chapter_id, text_en')
        .eq('translation_id', 2)
        .eq('verse_number', 1)
        .ilike('text_fa', '%RPC%');
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    console.log(`Found ${verses.length} test verses to fix`);
    
    let fixed = 0;
    for (const verse of verses) {
        if (verse.text_en) {
            const { error: updateError } = await supabase
                .from('bible_verses')
                .update({ text_fa: verse.text_en })
                .eq('id', verse.id);
            
            if (!updateError) fixed++;
        }
    }
    
    console.log(`✅ Fixed ${fixed} verses!`);
}

fixQadimVerse1().catch(console.error);
