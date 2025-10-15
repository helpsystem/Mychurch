const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Use existing DB configuration
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.log('💡 Please set DATABASE_URL to your Supabase connection string');
    process.exit(1);
}

const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
        rejectUnauthorized: false
    }
});

async function importEnglishBible() {
    const client = await pool.connect();
    
    try {
        console.log('✅ Connected to database');
        
        // Read the English Bible structure
        const structurePath = path.join(__dirname, 'bible-structure-english.json');
        const bibleData = JSON.parse(fs.readFileSync(structurePath, 'utf-8'));
        
        console.log(`📖 Importing: ${bibleData.version.title} (${bibleData.version.local_title})`);
        
        // 1. Insert or update the translation
        const translation = {
            code: (bibleData.version.local_abbreviation || bibleData.version.abbreviation).toLowerCase().substring(0, 8),
            name_en: bibleData.version.title,
            name_fa: bibleData.version.local_title,
            description_en: bibleData.version.title,
            description_fa: bibleData.version.local_title,
            language: 'en', // English language code
            is_active: true,
            is_default: false,
            sort_order: 40
        };
        
        const translationResult = await client.query(`
            INSERT INTO bible_translations (code, name_en, name_fa, description_en, description_fa, language, is_active, is_default, sort_order)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (code) DO UPDATE SET
                name_en = EXCLUDED.name_en,
                name_fa = EXCLUDED.name_fa,
                description_en = EXCLUDED.description_en,
                description_fa = EXCLUDED.description_fa,
                updated_at = NOW()
            RETURNING id
        `, [
            translation.code,
            translation.name_en,
            translation.name_fa,
            translation.description_en,
            translation.description_fa,
            translation.language,
            translation.is_active,
            translation.is_default,
            translation.sort_order
        ]);
        
        const translationId = translationResult.rows[0].id;
        console.log(`✅ Translation inserted/updated: ${bibleData.version.title} (ID: ${translationId})`);
        
        // 2. Process and insert books
        let bookCount = 0;
        let chapterCount = 0;
        
        for (const book of bibleData.books) {
            // Insert/Update book
            const bookData = {
                code: book.usfm,
                name_en: book.title, // English name
                name_fa: book.text || book.usfm, // Fallback to code if no text
                testament: book.canon === 'ot' ? 'OT' : 'NT',
                chapters_count: book.chapters.length
            };
            
            // If no canon info, determine from position (books 1-39 are OT, 40-66 are NT)
            if (!book.canon) {
                const bookOrder = bookCount + 1;
                bookData.testament = bookOrder <= 39 ? 'OT' : 'NT';
            }
            
            const bookQuery = `
                INSERT INTO bible_books (code, name_en, name_fa, testament, chapters_count)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (code) DO UPDATE SET
                    name_en = EXCLUDED.name_en,
                    name_fa = EXCLUDED.name_fa,
                    testament = EXCLUDED.testament,
                    chapters_count = EXCLUDED.chapters_count
                RETURNING *;
            `;
            
            try {
                const bookResult = await client.query(bookQuery, [
                    bookData.code,
                    bookData.name_en,
                    bookData.name_fa,
                    bookData.testament,
                    bookData.chapters_count
                ]);
                
                const insertedBook = bookResult.rows[0];
                bookCount++;
                
                // Insert chapters for this book
                if (book.chapters.length > 0) {
                    for (const chapter of book.chapters) {
                        const chapterQuery = `
                            INSERT INTO bible_chapters (book_id, chapter_number, verses_count)
                            VALUES ($1, $2, $3)
                            ON CONFLICT (book_id, chapter_number) DO UPDATE SET
                                verses_count = EXCLUDED.verses_count
                            RETURNING *;
                        `;
                        
                        try {
                            await client.query(chapterQuery, [
                                insertedBook.id,
                                parseInt(chapter.number),
                                0 // Will be updated when verses are imported
                            ]);
                            chapterCount++;
                        } catch (chaptersError) {
                            console.error(`Error inserting chapter ${chapter.number} for ${book.usfm}:`, chaptersError.message);
                        }
                    }
                }
                
                console.log(`📚 ${book.title} (${book.usfm}) - ${book.chapters.length} chapters`);
                
            } catch (bookError) {
                console.error(`Error inserting book ${book.usfm}:`, bookError.message);
            }
        }
        
        console.log(`\n✅ Import completed successfully!`);
        console.log(`📊 Statistics:`);
        console.log(`   📖 Translation: ${bibleData.version.title}`);
        console.log(`   📚 Books imported: ${bookCount}`);
        console.log(`   📄 Chapters imported: ${chapterCount}`);
        console.log(`   🎵 Audio available: ${bibleData.version.audio ? 'Yes' : 'No'}`);
        
        // Verify the import
        const verifyResult = await client.query(`
            SELECT 
                bt.name_en, bt.name_fa, bt.code,
                COUNT(bb.id) as book_count,
                SUM(bb.chapters_count) as total_chapters
            FROM bible_translations bt,
                 bible_books bb
            WHERE bt.code = $1
            GROUP BY bt.id, bt.name_en, bt.name_fa, bt.code
        `, [translation.code]);
        
        if (verifyResult.rows.length > 0) {
            const stats = verifyResult.rows[0];
            console.log(`\n🔍 Verification:`);
            console.log(`   Translation: ${stats.name_en} (${stats.name_fa})`);
            console.log(`   Code: ${stats.code}`);
            console.log(`   Books in database: ${stats.book_count}`);
            console.log(`   Total chapters: ${stats.total_chapters}`);
        }
        
    } catch (error) {
        console.error('❌ Error importing English Bible:', error);
        throw error;
    } finally {
        client.release();
        console.log('🔐 Database connection closed');
    }
}

// Run the import
if (require.main === module) {
    importEnglishBible().catch(console.error);
}

module.exports = { importEnglishBible };