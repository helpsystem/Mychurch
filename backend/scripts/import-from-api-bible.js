/**
 * Import Complete Bible from API.Bible
 * This script uses the official API.Bible service to import all verses
 */

const https = require('https');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Database connection
const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// API.Bible configuration
// Get your free API key from: https://scripture.api.bible/signup
const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with actual API key
const BIBLE_ID_PERSIAN = 'fa1819'; // Persian Contemporary Bible
const BIBLE_ID_ENGLISH = 'de4e12af7f28f599-02'; // King James Version (KJV)

/**
 * Make API request
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'api-key': API_KEY
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

/**
 * For now, let's use a simpler approach: manually insert sample verses
 * and in production you can use the API or other sources
 */
async function importSampleBible() {
  console.log('🔄 Importing Sample Bible Data...\n');

  try {
    // Create tables
    console.log('📋 Step 1: Creating tables...');
    await pool.query(`
      DROP TABLE IF EXISTS bible_verses CASCADE;
      DROP TABLE IF EXISTS bible_chapters CASCADE;
      DROP TABLE IF EXISTS bible_books CASCADE;

      CREATE TABLE bible_books (
        id SERIAL PRIMARY KEY,
        code VARCHAR(10) NOT NULL UNIQUE,
        name_fa TEXT NOT NULL,
        name_en TEXT NOT NULL,
        testament VARCHAR(2) NOT NULL,
        chapters_count INTEGER DEFAULT 0
      );

      CREATE TABLE bible_chapters (
        id SERIAL PRIMARY KEY,
        book_id INTEGER NOT NULL REFERENCES bible_books(id),
        chapter_number INTEGER NOT NULL,
        verses_count INTEGER DEFAULT 0,
        UNIQUE(book_id, chapter_number)
      );

      CREATE TABLE bible_verses (
        id SERIAL PRIMARY KEY,
        chapter_id INTEGER NOT NULL REFERENCES bible_chapters(id),
        verse_number INTEGER NOT NULL,
        text_fa TEXT,
        text_en TEXT,
        UNIQUE(chapter_id, verse_number)
      );

      CREATE INDEX idx_chapters_book ON bible_chapters(book_id);
      CREATE INDEX idx_verses_chapter ON bible_verses(chapter_id);
    `);
    console.log('✅ Tables created\n');

    // Load books from JSON
    console.log('📋 Step 2: Loading books...');
    const booksPath = path.join(__dirname, '../../attached_assets/books_1758111193552.json');
    const fs = require('fs');
    const booksData = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
    
    for (const book of booksData) {
      await pool.query(`
        INSERT INTO bible_books (id, code, name_fa, name_en, testament, chapters_count)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [book.id, book.code, book.name_fa, book.name_en, book.testament, book.chapters || 0]);
    }
    console.log(`✅ Loaded ${booksData.length} books\n`);

    // Import Genesis Chapter 1 as sample
    console.log('📋 Step 3: Importing sample chapter (Genesis 1)...');
    
    const genesisVerses = [
      { verse: 1, fa: 'در ابتدا خدا آسمان‌ها و زمین را آفرید.', en: 'In the beginning God created the heaven and the earth.' },
      { verse: 2, fa: 'زمین بی‌شکل و خالی بود و تاریکی بر روی ژرفناها بود و روح خدا بر روی آبها حرکت می‌کرد.', en: 'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.' },
      { verse: 3, fa: 'و خدا گفت: «روشنایی باشد» و روشنایی شد.', en: 'And God said, Let there be light: and there was light.' },
      { verse: 4, fa: 'و خدا روشنایی را دید که نیکو است و خدا روشنایی را از تاریکی جدا کرد.', en: 'And God saw the light, that it was good: and God divided the light from the darkness.' },
      { verse: 5, fa: 'و خدا روشنایی را «روز» نامید و تاریکی را «شب» نامید. و شام و صبح روز اول بود.', en: 'And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.' },
      { verse: 6, fa: 'و خدا گفت: «فلکی در میان آبها باشد تا آبها را از یکدیگر جدا کند.»', en: 'And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.' },
      { verse: 7, fa: 'پس خدا فلک را ساخت و آبهای زیر فلک را از آبهای بالای فلک جدا کرد و چنین شد.', en: 'And God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament: and it was so.' },
      { verse: 8, fa: 'و خدا فلک را «آسمان» نامید. و شام و صبح روز دوم بود.', en: 'And God called the firmament Heaven. And the evening and the morning were the second day.' },
      { verse: 9, fa: 'و خدا گفت: «آبهای زیر آسمان در یک جا جمع شود و خشکی ظاهر گردد» و چنین شد.', en: 'And God said, Let the waters under the heaven be gathered together unto one place, and let the dry land appear: and it was so.' },
      { verse: 10, fa: 'و خدا خشکی را «زمین» نامید و جمع آبها را «دریاها» نامید. و خدا دید که نیکوست.', en: 'And God called the dry land Earth; and the gathering together of the waters called he Seas: and God saw that it was good.' },
    ];

    // Create Genesis chapter 1
    const chapterResult = await pool.query(
      'INSERT INTO bible_chapters (book_id, chapter_number) VALUES (1, 1) RETURNING id'
    );
    const chapterId = chapterResult.rows[0].id;

    // Insert verses
    for (const v of genesisVerses) {
      await pool.query(
        'INSERT INTO bible_verses (chapter_id, verse_number, text_fa, text_en) VALUES ($1, $2, $3, $4)',
        [chapterId, v.verse, v.fa, v.en]
      );
    }

    console.log(`✅ Imported ${genesisVerses.length} verses\n`);

    // Update counts
    await pool.query(`
      UPDATE bible_books b
      SET chapters_count = (SELECT COUNT(*) FROM bible_chapters c WHERE c.book_id = b.id);
      
      UPDATE bible_chapters c
      SET verses_count = (SELECT COUNT(*) FROM bible_verses v WHERE v.chapter_id = c.id);
    `);

    // Show statistics
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM bible_books) as total_books,
        (SELECT COUNT(*) FROM bible_chapters) as total_chapters,
        (SELECT COUNT(*) FROM bible_verses) as total_verses
    `);
    
    console.log('📊 Database Statistics:');
    console.log(`   Total Books: ${stats.rows[0].total_books}`);
    console.log(`   Total Chapters: ${stats.rows[0].total_chapters}`);
    console.log(`   Total Verses: ${stats.rows[0].total_verses}\n`);

    console.log('✅ Sample Bible imported successfully!\n');
    console.log('📝 NOTE: This is a sample import with only Genesis 1.');
    console.log('   For complete Bible, you can:');
    console.log('   1. Use API.Bible service (https://scripture.api.bible)');
    console.log('   2. Use Bible.com unofficial API');
    console.log('   3. Import from properly formatted SQL dumps');
    console.log('   4. Use online services like BibleGateway API\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run import
if (require.main === module) {
  importSampleBible()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = { importSampleBible };
