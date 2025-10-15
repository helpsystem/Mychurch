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

async function importBibleStructure() {
    try {
        // Read the extracted Bible structure
        const structurePath = path.join(__dirname, 'bible-structure-arabic.json');
        const bibleData = JSON.parse(fs.readFileSync(structurePath, 'utf-8'));
        
        console.log(`Importing Bible structure: ${bibleData.version.title}`);
        
        // 1. Insert/Update translation information
        const translation = {
            code: bibleData.version.abbreviation.toLowerCase().substring(0, 8), // Limit to 8 chars
            name_en: bibleData.version.title,
            name_fa: bibleData.version.local_title,
            description_en: bibleData.version.title,
            description_fa: bibleData.version.local_title,
            language: bibleData.version.language.iso_639_1 || 'ar', // Use short language code
            is_active: true,
            is_default: false,
            sort_order: 10
        };
        
        // Upsert translation
        const translationQuery = `
            INSERT INTO bible_translations (code, name_en, name_fa, description_en, description_fa, language, is_active, is_default, sort_order)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (code) DO UPDATE SET
                name_en = EXCLUDED.name_en,
                name_fa = EXCLUDED.name_fa,
                description_en = EXCLUDED.description_en,
                description_fa = EXCLUDED.description_fa,
                language = EXCLUDED.language,
                is_active = EXCLUDED.is_active,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        
        const translationResult = await pool.query(translationQuery, [
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
        
        console.log(`✓ Translation inserted: ${translation.code} (${translationResult.rows[0]?.name_en})`);
        
        // 2. Process books and chapters
        let bookCount = 0;
        let chapterCount = 0;
        
        for (const book of bibleData.books) {
            // Insert/Update book
            const bookData = {
                code: book.usfm,
                name_en: book.title_long || book.title,
                name_fa: book.title,
                testament: book.canon === 'ot' ? 'OT' : 'NT',
                chapters_count: book.chapters.length
            };
            
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
                const bookResult = await pool.query(bookQuery, [
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
                            await pool.query(chapterQuery, [
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
                
                console.log(`✓ Book processed: ${book.title} (${book.usfm}) - ${book.chapters.length} chapters`);
                
            } catch (bookError) {
                console.error(`Error inserting book ${book.usfm}:`, bookError.message);
                continue;
            }
        }
        
        console.log(`\n🎉 Import completed successfully!`);
        console.log(`📚 Books imported: ${bookCount}`);
        console.log(`📖 Chapters imported: ${chapterCount}`);
        console.log(`🌐 Translation: ${translation.name_en} (${translation.name_fa})`);
        
        // Display summary
        const totalBooksResult = await pool.query('SELECT COUNT(*) FROM bible_books');
        const totalChaptersResult = await pool.query('SELECT COUNT(*) FROM bible_chapters');
        const totalTranslationsResult = await pool.query('SELECT COUNT(*) FROM bible_translations');
        
        console.log(`\n📊 Database Summary:`);
        console.log(`Total books in database: ${totalBooksResult.rows[0].count}`);
        console.log(`Total chapters in database: ${totalChaptersResult.rows[0].count}`);
        console.log(`Total translations in database: ${totalTranslationsResult.rows[0].count}`);
        
    } catch (error) {
        console.error('❌ Error importing Bible structure:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the import
if (require.main === module) {
    importBibleStructure();
}

module.exports = { importBibleStructure };