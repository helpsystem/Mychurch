const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const BOOKS = [
    { iso: 'LEV', id: 3 },
    { iso: 'NUM', id: 4 },
    { iso: 'DEU', id: 5 }
];

const DATA_DIR = 'bible_data/scraped_raw';
const TRANSLATION_ID = 1; // MOJDEH

async function importBooks() {
    console.log('🚀 Starting Import for Missing Mojdeh Books...');

    for (const book of BOOKS) {
        console.log(`\n📘 Importing ${book.iso} (ID: ${book.id})...`);
        const bookDir = path.join(DATA_DIR, book.iso);

        if (!fs.existsSync(bookDir)) {
            console.log(`  ❌ Directory not found: ${bookDir}`);
            continue;
        }

        const files = fs.readdirSync(bookDir).filter(f => f.endsWith('.json'));
        // Sort files numerically properly
        files.sort((a, b) => parseInt(a) - parseInt(b));

        for (const file of files) {
            const filePath = path.join(bookDir, file);
            try {
                const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                const chapter = content.chapter;

                console.log(`  Processing Chapter ${chapter} (${content.verses.length} verses)...`);

                // 1. Lookup Correct Chapter ID (Language = 'farsi')
                const { data: chapterData, error: chapterError } = await supabase
                    .from('bible_chapters')
                    .select('id')
                    .eq('book_iso', book.iso)
                    .eq('chapter_number', chapter)
                    .eq('language', 'farsi') // KEY: Select the Farsi chapter
                    .single();

                if (chapterError || !chapterData) {
                    console.error(`    ❌ Chapter lookup failed for ${book.iso} ${chapter}:`, chapterError ? chapterError.message : 'Not found');
                    // Optional: logic to create chapter if it doesn't exist could go here
                    continue;
                }

                const chapterId = chapterData.id;

                let rows = content.verses.map(v => ({
                    // book_id: book.id, // Removed: Not in bible_verses table
                    chapter_id: chapterId,
                    verse_number: v.verse,
                    text_fa: v.text,
                    translation_id: TRANSLATION_ID
                }));

                // Deduplicate rows based on verse_number
                const uniqueRows = [];
                const seenVerses = new Set();
                for (const row of rows) {
                    if (!seenVerses.has(row.verse_number)) {
                        seenVerses.add(row.verse_number);
                        uniqueRows.push(row);
                    }
                }
                rows = uniqueRows;

                // Upsert in batches
                const { error } = await supabase
                    .from('bible_verses')
                    .upsert(rows, { onConflict: 'translation_id,chapter_id,verse_number' });

                if (error) {
                    console.error(`    ❌ Error inserting chapter ${chapter}:`, error.message);
                } else {
                    console.log(`    ✅ Inserted/Updated ${rows.length} verses (Chapter ID: ${chapterId})`);
                }
            } catch (err) {
                console.error(`    ❌ Error reading file ${file}:`, err.message);
            }
        }
    }
    console.log('\n✨ Import Complete!');
}

importBooks();
