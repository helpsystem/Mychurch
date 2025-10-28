require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

async function checkDatabaseStructure() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 بررسی ساختار دیتابیس برای Bible API...\n');

    // 1. چک کردن جداول verses_*
    console.log('📋 جستجوی جداول verses_*:');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'verses_%'
      ORDER BY table_name;
    `);
    
    if (tables.rows.length === 0) {
      console.log('❌ هیچ جدول verses_* یافت نشد!');
      console.log('   Backend انتظار دارد: verses_qadim, verses_mojdeh, verses_eng');
    } else {
      console.log(`✅ یافت شد: ${tables.rows.length} جدول`);
      tables.rows.forEach(r => console.log(`   - ${r.table_name}`));
    }

    // 2. بررسی bible_verses (11,780 آیه)
    console.log('\n📖 بررسی ساختار bible_verses:');
    const versesStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'bible_verses'
      ORDER BY ordinal_position;
    `);
    console.table(versesStructure.rows);

    // 3. نمونه داده از bible_verses
    console.log('\n📝 نمونه داده از bible_verses:');
    const sample = await pool.query(`
      SELECT bv.id, bv.chapter_id, bv.verse_number, 
             LEFT(bv.text_fa, 60) as text_fa_preview,
             LEFT(bv.text_en, 60) as text_en_preview,
             bv.translation_id
      FROM bible_verses bv
      LIMIT 3;
    `);
    console.table(sample.rows);

    // 4. بررسی رابطه با bible_translations
    console.log('\n🌐 رابطه با bible_translations:');
    const translationCheck = await pool.query(`
      SELECT DISTINCT 
        bv.translation_id, 
        bt.code, 
        bt.name_fa,
        COUNT(bv.id) as verse_count
      FROM bible_verses bv
      LEFT JOIN bible_translations bt ON bt.id = bv.translation_id
      GROUP BY bv.translation_id, bt.code, bt.name_fa
      ORDER BY bv.translation_id;
    `);
    console.table(translationCheck.rows);

    // 5. بررسی رابطه با bible_chapters
    console.log('\n📚 نمونه رابطه chapter_id → bible_chapters:');
    const chapterRelation = await pool.query(`
      SELECT 
        bv.chapter_id,
        COUNT(bv.id) as verse_count
      FROM bible_verses bv
      GROUP BY bv.chapter_id
      ORDER BY bv.chapter_id
      LIMIT 5;
    `);
    console.table(chapterRelation.rows);

    // 6. سوال کلیدی: آیا باید از bible_verses استفاده کنیم یا verses_* ایجاد کنیم؟
    console.log('\n💡 نتیجه‌گیری:');
    console.log('   Backend انتظار دارد: جداول verses_qadim, verses_mojdeh, verses_eng');
    console.log('   موجود در دیتابیس: bible_verses با 11,780 آیه');
    console.log('   راه‌حل‌های ممکن:');
    console.log('     1️⃣ تغییر backend برای استفاده از bible_verses');
    console.log('     2️⃣ ساخت VIEW‌های verses_qadim, verses_mojdeh, verses_eng از bible_verses');
    console.log('     3️⃣ ساخت جداول جدید verses_* با کپی از bible_verses');

    await pool.end();
  } catch (error) {
    console.error('❌ خطا:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkDatabaseStructure();
