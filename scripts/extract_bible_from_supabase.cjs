
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

const OUTPUT_BASE = path.resolve(__dirname, '../bible_data/text');

async function extractBible() {
    console.log('Starting Bible Extraction...');

    // 1. Get Translations
    // We explicitly want MOJDEH, QADIM and NET.
    const { data: translations, error: transError } = await supabase
        .from('bible_translations')
        .select('id, code, language')
        .in('code', ['mojdeh', 'qadim', 'net']);

    if (transError) {
        console.error('Error fetching translations:', transError);
        return;
    }

    if (!translations || translations.length === 0) {
        console.error('No translations found');
        return;
    }

    console.log('Translations to extract:', translations.map(t => `${t.code} (${t.id}, ${t.language})`));

    // 2. Get Books
    // Column is 'book_iso' based on inspection
    const { data: books, error: bookError } = await supabase
        .from('bible_books')
        .select('id, book_iso')
        .order('id');

    if (bookError) {
        console.error('Error fetching books:', bookError);
        return;
    }

    // 3. Loop through Translations
    for (const trans of translations) {
        console.log(`\nProcessing ${trans.code}...`);
        const transDir = path.join(OUTPUT_BASE, trans.code.toUpperCase()); // Folder as UPPERCASE (MOJDEH, QADIM)
        if (!fs.existsSync(transDir)) fs.mkdirSync(transDir, { recursive: true });

        // Loop through Books
        for (const book of books) {
            const bookCode = book.book_iso;
            if (!bookCode) continue;

            const bookDir = path.join(transDir, bookCode);
            if (!fs.existsSync(bookDir)) fs.mkdirSync(bookDir, { recursive: true });

            // Fetch all verses for this book AND translation
            // We need chapter IDs for this book
            // Note: bible_chapters linked to book_id (or book_iso?)
            // Inspection said bible_chapters keys include 'book_iso', so we can search by that directly if populated,
            // OR we search by book_id if filtering. Let's try matching 'book_iso' column in bible_chapters first if it exists,
            // otherwise use relation. Inspection showed 'book_iso' in bible_chapters keys!

            const { data: chapters, error: chError } = await supabase
                .from('bible_chapters')
                .select('id, chapter_number')
                .eq('book_iso', bookCode);

            if (chError) { console.error(`Error fetching chapters for ${bookCode}:`, chError); continue; }

            if (!chapters || chapters.length === 0) continue;

            let versesExtracted = 0;

            // Loop Chapters
            for (const ch of chapters) {
                // Fetch Verses
                const { data: verses, error: vError } = await supabase
                    .from('bible_verses')
                    .select('verse_number, text_fa, text_en')
                    .eq('chapter_id', ch.id)
                    .eq('translation_id', trans.id)
                    .order('verse_number');

                if (vError) { console.error(`Error fetching verses for ${bookCode} ${ch.chapter_number}:`, vError); continue; }

                if (!verses || verses.length === 0) continue;
                versesExtracted += verses.length;

                // Determine text field based on language
                const textField = trans.language === 'en' ? 'text_en' : 'text_fa';

                // Build JSON Object (replicate TPV format)
                const jsonContent = {
                    translation: trans.code.toUpperCase(),
                    book: bookCode,
                    chapter: ch.chapter_number,
                    verses: verses.map(v => ({
                        verse: v.verse_number,
                        text: v[textField] || v.text_fa, // Fallback to fa if en is empty? Or just empty
                        usfm: `${bookCode}.${ch.chapter_number}.${v.verse_number}`
                    }))
                };

                // Write File
                const filePath = path.join(bookDir, `${ch.chapter_number}.json`);
                // Only write if different or new
                fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2));
            }

            if (versesExtracted > 0) process.stdout.write(`.${bookCode}`);
        }
    }
    console.log('\nExtraction Complete!');
}

extractBible().catch(err => console.error(err));
