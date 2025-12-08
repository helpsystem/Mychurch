import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envLocalPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envLocalPath });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Required Supabase environment variables not found.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUpsert() {
    console.log('Testing Upsert Behavior...');

    // 1. Find a valid chapter to test on (e.g., Genesis 1)
    const { data: book } = await supabase.from('bible_books').select('id').eq('code', '01').single();
    if (!book) {
        console.error('Genesis not found');
        return;
    }

    const { data: chapter } = await supabase.from('bible_chapters')
        .select('id')
        .eq('book_id', book.id)
        .eq('chapter_number', 1)
        .single();

    if (!chapter) {
        console.error('Genesis 1 not found');
        return;
    }

    const TEST_VERSE = 999; // Use a non-existent verse number to avoid messing up real data, or use a real one if we want to test update.
    // Let's use a temporary verse number.

    console.log(`Using Chapter ID: ${chapter.id}, Verse: ${TEST_VERSE}`);

    // Clean up first
    await supabase.from('bible_verses').delete().match({ chapter_id: chapter.id, verse_number: TEST_VERSE });

    // 2. Insert initial row with text_en
    const { error: insertError } = await supabase.from('bible_verses').insert({
        chapter_id: chapter.id,
        verse_number: TEST_VERSE,
        text_en: 'Initial English Text'
    });

    if (insertError) {
        console.error('Insert failed:', insertError);
        return;
    }
    console.log('Inserted initial row with text_en.');

    // 3. Perform Upsert with ONLY text_fa
    const { error: upsertError } = await supabase.from('bible_verses').upsert({
        chapter_id: chapter.id,
        verse_number: TEST_VERSE,
        text_fa: 'New Persian Text'
    }, { onConflict: 'chapter_id, verse_number' });

    if (upsertError) {
        console.error('Upsert failed:', upsertError);
        return;
    }
    console.log('Upserted text_fa.');

    // 4. Fetch the row to check if text_en is preserved
    const { data: result } = await supabase.from('bible_verses')
        .select('*')
        .match({ chapter_id: chapter.id, verse_number: TEST_VERSE })
        .single();

    console.log('Result:', result);

    if (result.text_en === 'Initial English Text' && result.text_fa === 'New Persian Text') {
        console.log('SUCCESS: Upsert performed a partial update (merged data).');
    } else {
        console.log('FAILURE: Upsert did NOT merge data correctly.');
    }

    // Cleanup
    await supabase.from('bible_verses').delete().match({ chapter_id: chapter.id, verse_number: TEST_VERSE });
}

testUpsert().catch(console.error);
