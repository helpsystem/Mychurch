const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Sample verses for Genesis Chapter 1
const genesisVerses = {
    fa: [
        "در ابتدا خدا آسمان و زمین را آفرید.",
        "زمین بی‌شکل و خالی بود و تاریکی بر عمق آبها بود، و روح خدا بر آبها در حرکت بود.",
        "خدا گفت: «روشنایی باشد» و روشنایی شد.",
        "خدا روشنایی را دید که نیکوست، و خدا روشنایی را از تاریکی جدا کرد.",
        "خدا روشنایی را روز، و تاریکی را شب نامید. و شام شد و صبح شد، روز اول."
    ],
    en: [
        "In the beginning God created the heavens and the earth.",
        "Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.",
        "And God said, \"Let there be light,\" and there was light.",
        "God saw that the light was good, and he separated the light from the darkness.",
        "God called the light \"day,\" and the darkness he called \"night.\" And there was evening, and there was morning—the first day."
    ],
    ar: [
        "في البدء خلق الله السماوات والأرض.",
        "وكانت الأرض خربة وخالية، وعلى وجه الغمر ظلمة، وروح الله يرف على وجه المياه.",
        "وقال الله: \"ليكن نور\"، فكان نور.",
        "ورأى الله النور أنه حسن. وفصل الله بين النور والظلمة.",
        "ودعا الله النور نهارا، والظلمة دعاها ليلا. وكان مساء وكان صباح يوما واحدا."
    ]
};

async function insertSampleVerses() {
    const client = await pool.connect();
    
    try {
        console.log('✅ Connected to database');
        
        // Get Genesis book and chapter 1
        const bookResult = await client.query('SELECT id FROM bible_books WHERE code = $1', ['GEN']);
        if (bookResult.rows.length === 0) {
            throw new Error('Genesis book not found');
        }
        const bookId = bookResult.rows[0].id;
        
        const chapterResult = await client.query('SELECT id FROM bible_chapters WHERE book_id = $1 AND chapter_number = $2', [bookId, 1]);
        if (chapterResult.rows.length === 0) {
            throw new Error('Genesis chapter 1 not found');
        }
        const chapterId = chapterResult.rows[0].id;
        
        // Get translations
        const translations = await client.query('SELECT id, code, language FROM bible_translations WHERE is_active = true');
        console.log(`Found ${translations.rows.length} translations`);
        
        let insertedCount = 0;
        
        for (const translation of translations.rows) {
            let verses;
            
            // Choose verses based on language
            switch (translation.language) {
                case 'fa': // Persian
                    verses = genesisVerses.fa;
                    break;
                case 'ar': // Arabic
                    verses = genesisVerses.ar;
                    break;
                case 'en': // English
                    verses = genesisVerses.en;
                    break;
                case 'es': // Spanish
                    verses = genesisVerses.en; // Use English as fallback
                    break;
                default:
                    verses = genesisVerses.en; // Default to English
            }
            
            // Insert verses for this translation
            for (let i = 0; i < verses.length; i++) {
                const verseNumber = i + 1;
                const verseText = verses[i];
                
                try {
                    await client.query(`
                        INSERT INTO bible_verses (chapter_id, translation_id, verse_number, text_fa, text_en)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (chapter_id, translation_id, verse_number) DO UPDATE SET
                            text_fa = EXCLUDED.text_fa,
                            text_en = EXCLUDED.text_en
                    `, [chapterId, translation.id, verseNumber, verseText, verseText]);
                    
                    insertedCount++;
                } catch (verseError) {
                    console.error(`Error inserting verse ${verseNumber} for translation ${translation.code}:`, verseError.message);
                }
            }
            
            console.log(`✅ Inserted ${verses.length} verses for translation: ${translation.code}`);
        }
        
        console.log(`\n🎉 Successfully inserted ${insertedCount} verses total`);
        console.log('📖 Genesis Chapter 1 is now available for testing!');
        
    } catch (error) {
        console.error('❌ Error inserting sample verses:', error);
        throw error;
    } finally {
        client.release();
        console.log('🔐 Database connection closed');
    }
}

// Run the import
if (require.main === module) {
    insertSampleVerses().catch(console.error);
}

module.exports = { insertSampleVerses };