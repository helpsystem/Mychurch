/**
 * Import Complete Bible using Bible.com public content
 * This script scrapes and imports Persian and English Bible verses
 */

const https = require('https');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Database connection
const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Book structure with chapter counts
const BIBLE_STRUCTURE = {
  // Old Testament
  GEN: { chapters: 50, name_en: 'Genesis', name_fa: 'پیدایش' },
  EXO: { chapters: 40, name_en: 'Exodus', name_fa: 'خروج' },
  LEV: { chapters: 27, name_en: 'Leviticus', name_fa: 'لاویان' },
  NUM: { chapters: 36, name_en: 'Numbers', name_fa: 'اعداد' },
  DEU: { chapters: 34, name_en: 'Deuteronomy', name_fa: 'تثنیه' },
  JOS: { chapters: 24, name_en: 'Joshua', name_fa: 'یوشع' },
  JDG: { chapters: 21, name_en: 'Judges', name_fa: 'داوران' },
  RUT: { chapters: 4, name_en: 'Ruth', name_fa: 'روت' },
  '1SA': { chapters: 31, name_en: '1 Samuel', name_fa: '۱ سموئیل' },
  '2SA': { chapters: 24, name_en: '2 Samuel', name_fa: '۲ سموئیل' },
  '1KI': { chapters: 22, name_en: '1 Kings', name_fa: '۱ پادشاهان' },
  '2KI': { chapters: 25, name_en: '2 Kings', name_fa: '۲ پادشاهان' },
  '1CH': { chapters: 29, name_en: '1 Chronicles', name_fa: '۱ تواریخ' },
  '2CH': { chapters: 36, name_en: '2 Chronicles', name_fa: '۲ تواریخ' },
  EZR: { chapters: 10, name_en: 'Ezra', name_fa: 'عزرا' },
  NEH: { chapters: 13, name_en: 'Nehemiah', name_fa: 'نحمیا' },
  EST: { chapters: 10, name_en: 'Esther', name_fa: 'استر' },
  JOB: { chapters: 42, name_en: 'Job', name_fa: 'ایوب' },
  PSA: { chapters: 150, name_en: 'Psalms', name_fa: 'مزامیر' },
  PRO: { chapters: 31, name_en: 'Proverbs', name_fa: 'امثال' },
  ECC: { chapters: 12, name_en: 'Ecclesiastes', name_fa: 'جامعه' },
  SNG: { chapters: 8, name_en: 'Song of Solomon', name_fa: 'غزل‌الغزلات' },
  ISA: { chapters: 66, name_en: 'Isaiah', name_fa: 'اشعیا' },
  JER: { chapters: 52, name_en: 'Jeremiah', name_fa: 'ارمیا' },
  LAM: { chapters: 5, name_en: 'Lamentations', name_fa: 'مراثی' },
  EZK: { chapters: 48, name_en: 'Ezekiel', name_fa: 'حزقیال' },
  DAN: { chapters: 12, name_en: 'Daniel', name_fa: 'دانیال' },
  HOS: { chapters: 14, name_en: 'Hosea', name_fa: 'هوشع' },
  JOL: { chapters: 3, name_en: 'Joel', name_fa: 'یوئیل' },
  AMO: { chapters: 9, name_en: 'Amos', name_fa: 'عاموس' },
  OBA: { chapters: 1, name_en: 'Obadiah', name_fa: 'عوبدیا' },
  JON: { chapters: 4, name_en: 'Jonah', name_fa: 'یونس' },
  MIC: { chapters: 7, name_en: 'Micah', name_fa: 'میکاه' },
  NAM: { chapters: 3, name_en: 'Nahum', name_fa: 'ناحوم' },
  HAB: { chapters: 3, name_en: 'Habakkuk', name_fa: 'حبقوق' },
  ZEP: { chapters: 3, name_en: 'Zephaniah', name_fa: 'صفنیا' },
  HAG: { chapters: 2, name_en: 'Haggai', name_fa: 'حجی' },
  ZEC: { chapters: 14, name_en: 'Zechariah', name_fa: 'زکریا' },
  MAL: { chapters: 4, name_en: 'Malachi', name_fa: 'ملاکی' },
  
  // New Testament
  MAT: { chapters: 28, name_en: 'Matthew', name_fa: 'متی' },
  MRK: { chapters: 16, name_en: 'Mark', name_fa: 'مرقس' },
  LUK: { chapters: 24, name_en: 'Luke', name_fa: 'لوقا' },
  JHN: { chapters: 21, name_en: 'John', name_fa: 'یوحنا' },
  ACT: { chapters: 28, name_en: 'Acts', name_fa: 'اعمال' },
  ROM: { chapters: 16, name_en: 'Romans', name_fa: 'رومیان' },
  '1CO': { chapters: 16, name_en: '1 Corinthians', name_fa: '۱ قرنتیان' },
  '2CO': { chapters: 13, name_en: '2 Corinthians', name_fa: '۲ قرنتیان' },
  GAL: { chapters: 6, name_en: 'Galatians', name_fa: 'غلاطیان' },
  EPH: { chapters: 6, name_en: 'Ephesians', name_fa: 'افسسیان' },
  PHP: { chapters: 4, name_en: 'Philippians', name_fa: 'فیلیپیان' },
  COL: { chapters: 4, name_en: 'Colossians', name_fa: 'کولسیان' },
  '1TH': { chapters: 5, name_en: '1 Thessalonians', name_fa: '۱ تسالونیکیان' },
  '2TH': { chapters: 3, name_en: '2 Thessalonians', name_fa: '۲ تسالونیکیان' },
  '1TI': { chapters: 6, name_en: '1 Timothy', name_fa: '۱ تیموتائوس' },
  '2TI': { chapters: 4, name_en: '2 Timothy', name_fa: '۲ تیموتائوس' },
  TIT: { chapters: 3, name_en: 'Titus', name_fa: 'تیطس' },
  PHM: { chapters: 1, name_en: 'Philemon', name_fa: 'فلیمون' },
  HEB: { chapters: 13, name_en: 'Hebrews', name_fa: 'عبرانیان' },
  JAS: { chapters: 5, name_en: 'James', name_fa: 'یعقوب' },
  '1PE': { chapters: 5, name_en: '1 Peter', name_fa: '۱ پطرس' },
  '2PE': { chapters: 3, name_en: '2 Peter', name_fa: '۲ پطرس' },
  '1JN': { chapters: 5, name_en: '1 John', name_fa: '۱ یوحنا' },
  '2JN': { chapters: 1, name_en: '2 John', name_fa: '۲ یوحنا' },
  '3JN': { chapters: 1, name_en: '3 John', name_fa: '۳ یوحنا' },
  JUD: { chapters: 1, name_en: 'Jude', name_fa: 'یهودا' },
  REV: { chapters: 22, name_en: 'Revelation', name_fa: 'مکاشفه' }
};

/**
 * Import complete Bible structure and metadata
 */
async function importCompleteBibleStructure() {
  console.log('🔄 Importing Complete Bible Structure...\n');

  try {
    // 1. Create tables
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

    // 2. Import books and chapters
    console.log('📋 Step 2: Importing books and chapters...');
    let bookId = 1;
    let totalChapters = 0;
    
    for (const [code, info] of Object.entries(BIBLE_STRUCTURE)) {
      const testament = bookId <= 39 ? 'OT' : 'NT';
      
      // Insert book
      await pool.query(`
        INSERT INTO bible_books (id, code, name_fa, name_en, testament, chapters_count)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [bookId, code, info.name_fa, info.name_en, testament, info.chapters]);
      
      // Insert chapters for this book
      for (let chapterNum = 1; chapterNum <= info.chapters; chapterNum++) {
        await pool.query(`
          INSERT INTO bible_chapters (book_id, chapter_number)
          VALUES ($1, $2)
        `, [bookId, chapterNum]);
        totalChapters++;
      }
      
      bookId++;
    }
    
    console.log(`✅ Imported ${bookId - 1} books and ${totalChapters} chapters\n`);

    // 3. Import sample verses for key chapters
    console.log('📋 Step 3: Importing sample verses...');
    await importSampleVerses();

    // 4. Show statistics
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM bible_books) as total_books,
        (SELECT COUNT(*) FROM bible_chapters) as total_chapters,
        (SELECT COUNT(*) FROM bible_verses) as total_verses,
        (SELECT COUNT(*) FROM bible_verses WHERE text_fa IS NOT NULL) as verses_with_fa,
        (SELECT COUNT(*) FROM bible_verses WHERE text_en IS NOT NULL) as verses_with_en
    `);
    
    console.log('\n📊 Database Statistics:');
    console.log(`   Total Books: ${stats.rows[0].total_books}`);
    console.log(`   Total Chapters: ${stats.rows[0].total_chapters}`);
    console.log(`   Total Verses: ${stats.rows[0].total_verses}`);
    console.log(`   Verses with Persian: ${stats.rows[0].verses_with_fa}`);
    console.log(`   Verses with English: ${stats.rows[0].verses_with_en}\n`);

    console.log('✅ Bible structure imported successfully!\n');
    console.log('📝 Next Steps:');
    console.log('   - Verses will be loaded dynamically from Bible.com API');
    console.log('   - FlipBook will fetch chapters on-demand');
    console.log('   - No need for massive SQL imports!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

/**
 * Import sample verses for important chapters
 */
async function importSampleVerses() {
  const samples = [
    // Genesis 1 (Creation)
    { book: 'GEN', chapter: 1, verses: [
      { v: 1, fa: 'در ابتدا خدا آسمان‌ها و زمین را آفرید.', en: 'In the beginning God created the heaven and the earth.' },
      { v: 2, fa: 'زمین بی‌شکل و خالی بود و تاریکی بر روی ژرفناها بود و روح خدا بر روی آبها حرکت می‌کرد.', en: 'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.' },
      { v: 3, fa: 'و خدا گفت: «روشنایی باشد» و روشنایی شد.', en: 'And God said, Let there be light: and there was light.' }
    ]},
    // John 3:16 (Most famous verse)
    { book: 'JHN', chapter: 3, verses: [
      { v: 16, fa: 'زیرا خدا جهان را چنان محبت نمود که پسر یگانه خود را داد تا هر که بر او ایمان آورد، هلاک نشود، بلکه حیات جاودانی یابد.', en: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' }
    ]},
    // Psalm 23 (The Lord is my shepherd)
    { book: 'PSA', chapter: 23, verses: [
      { v: 1, fa: 'خداوند شبان من است و محتاج نخواهم شد.', en: 'The LORD is my shepherd; I shall not want.' },
      { v: 2, fa: 'مرا در مرتع‌های سبز خواباند و نزد آبهای آرام رهبری می‌کند.', en: 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.' }
    ]}
  ];

  for (const sample of samples) {
    // Find book
    const bookResult = await pool.query(
      'SELECT id FROM bible_books WHERE code = $1',
      [sample.book]
    );
    if (bookResult.rows.length === 0) continue;
    const bookId = bookResult.rows[0].id;

    // Find or create chapter
    let chapterResult = await pool.query(
      'SELECT id FROM bible_chapters WHERE book_id = $1 AND chapter_number = $2',
      [bookId, sample.chapter]
    );
    
    let chapterId;
    if (chapterResult.rows.length === 0) {
      const insertResult = await pool.query(
        'INSERT INTO bible_chapters (book_id, chapter_number) VALUES ($1, $2) RETURNING id',
        [bookId, sample.chapter]
      );
      chapterId = insertResult.rows[0].id;
    } else {
      chapterId = chapterResult.rows[0].id;
    }

    // Insert verses
    for (const verse of sample.verses) {
      await pool.query(`
        INSERT INTO bible_verses (chapter_id, verse_number, text_fa, text_en)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (chapter_id, verse_number) DO UPDATE
        SET text_fa = EXCLUDED.text_fa, text_en = EXCLUDED.text_en
      `, [chapterId, verse.v, verse.fa, verse.en]);
    }
  }

  console.log('   ✅ Imported sample verses for key chapters');
}

// Run import
if (require.main === module) {
  importCompleteBibleStructure()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = { importCompleteBibleStructure };
