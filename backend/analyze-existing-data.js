require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

async function analyzeData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 تحلیل داده‌های موجود در Supabase...\n');

    // 1. بررسی bible_verses
    console.log('📖 تحلیل bible_verses (11,780 آیه):');
    const versesAnalysis = await pool.query(`
      SELECT 
        chapter_id,
        COUNT(*) as verse_count,
        translation_id,
        MIN(verse_number) as first_verse,
        MAX(verse_number) as last_verse
      FROM bible_verses 
      GROUP BY chapter_id, translation_id
      ORDER BY chapter_id
      LIMIT 10;
    `);
    
    console.log('نمونه از chapter_id ها:');
    console.table(versesAnalysis.rows);

    // 2. بررسی bible_translations
    console.log('\n🌐 ترجمه‌های موجود:');
    const translations = await pool.query('SELECT * FROM bible_translations;');
    console.table(translations.rows);

    // 3. بررسی bible_chapters که ما آپلود کردیم
    console.log('\n📚 نمونه از bible_chapters (WordProject):');
    const chaptersAnalysis = await pool.query(`
      SELECT 
        book_iso,
        chapter_number,
        language,
        LENGTH(text_content) as text_length,
        audio_url
      FROM bible_chapters 
      ORDER BY book_iso, chapter_number
      LIMIT 10;
    `);
    console.table(chaptersAnalysis.rows);

    // 4. چک کردن آیا book_iso های ما با system قدیمی match میشن
    console.log('\n🔗 book_iso های یونیک در bible_chapters:');
    const bookIsos = await pool.query(`
      SELECT DISTINCT book_iso, COUNT(*) as chapter_count
      FROM bible_chapters
      GROUP BY book_iso
      ORDER BY book_iso;
    `);
    console.table(bookIsos.rows);

    await pool.end();
    console.log('\n✅ تحلیل کامل شد!');
  } catch (error) {
    console.error('❌ خطا:', error.message);
    console.error(error);
    process.exit(1);
  }
}

analyzeData();
