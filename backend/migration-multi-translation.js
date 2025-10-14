const { pool } = require('./db-postgres');

/**
 * 🔄 Migration Script: Add Multi-Translation Support to Bible System
 * 
 * این اسکریپت ساختار دیتابیس را برای پشتیبانی از چندین ترجمه بایبل تغییر می‌دهد:
 * 1. ایجاد جدول bible_translations
 * 2. اصلاح جدول bible_verses برای پشتیبانی از translation_id
 * 3. انتقال داده‌های موجود به ساختار جدید
 * 4. اضافه کردن ترجمه‌های جدید
 */

const migrationQueries = [
  // 1. ایجاد جدول bible_translations
  `CREATE TABLE IF NOT EXISTS bible_translations (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name_fa VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    description_fa TEXT,
    description_en TEXT,
    language VARCHAR(10) NOT NULL DEFAULT 'fa',
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // 2. اضافه کردن translation_id به bible_verses (اگر وجود ندارد)
  `DO $$ 
  BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bible_verses' AND column_name='translation_id') THEN
      ALTER TABLE bible_verses ADD COLUMN translation_id INTEGER REFERENCES bible_translations(id);
    END IF;
  END $$;`,

  // 3. تغییر unique constraint برای شامل translation_id
  `DO $$
  BEGIN
    -- حذف constraint قدیمی اگر موجود باشد
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name='bible_verses_chapter_id_verse_number_key' 
               AND table_name='bible_verses') THEN
      ALTER TABLE bible_verses DROP CONSTRAINT bible_verses_chapter_id_verse_number_key;
    END IF;
    
    -- اضافه کردن constraint جدید
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name='bible_verses_chapter_verse_translation_unique' 
                   AND table_name='bible_verses') THEN
      ALTER TABLE bible_verses ADD CONSTRAINT bible_verses_chapter_verse_translation_unique 
      UNIQUE (chapter_id, verse_number, translation_id);
    END IF;
  END $$;`
];

const insertTranslations = [
  // اضافه کردن ترجمه‌های مختلف
  `INSERT INTO bible_translations (code, name_fa, name_en, description_fa, description_en, language, is_default, sort_order)
   VALUES 
   ('mojdeh', 'ترجمه مژده', 'Mojdeh Translation', 'ترجمه مژده - یکی از ترجمه‌های محبوب کتاب مقدس به زبان فارسی', 'Mojdeh Translation - A popular Persian Bible translation', 'fa', true, 1),
   ('qadim', 'ترجمه قدیم', 'Old Translation', 'ترجمه قدیم کتاب مقدس به زبان فارسی', 'Classic Persian Bible translation', 'fa', false, 2),
   ('tafsiri_ot', 'ترجمه تفسیری عهد عتیق', 'Interpretive Old Testament', 'ترجمه تفسیری عهد عتیق با توضیحات کاملتر', 'Interpretive translation of Old Testament with detailed explanations', 'fa', false, 3),
   ('tafsiri_nt', 'ترجمه تفسیری عهد جدید', 'Interpretive New Testament', 'ترجمه تفسیری عهد جدید با توضیحات کاملتر', 'Interpretive translation of New Testament with detailed explanations', 'fa', false, 4)
   ON CONFLICT (code) DO UPDATE SET
   name_fa = EXCLUDED.name_fa,
   name_en = EXCLUDED.name_en,
   description_fa = EXCLUDED.description_fa,
   description_en = EXCLUDED.description_en,
   updated_at = CURRENT_TIMESTAMP;`
];

const migrateExistingData = `
  DO $$
  DECLARE
    default_translation_id INTEGER;
  BEGIN
    -- گرفتن ID ترجمه پیش‌فرض (mojdeh)
    SELECT id INTO default_translation_id FROM bible_translations WHERE code = 'mojdeh';
    
    -- به‌روزرسانی رکوردهای موجود که translation_id ندارند
    UPDATE bible_verses 
    SET translation_id = default_translation_id 
    WHERE translation_id IS NULL;
    
    -- ایجاد index برای بهبود عملکرد
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bible_verses_translation_chapter') THEN
      CREATE INDEX idx_bible_verses_translation_chapter ON bible_verses (translation_id, chapter_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bible_verses_chapter_verse') THEN
      CREATE INDEX idx_bible_verses_chapter_verse ON bible_verses (chapter_id, verse_number);
    END IF;
  END $$;
`;

const addMultiTranslationSupport = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 شروع migration برای پشتیبانی از چندین ترجمه...');
    
    // 1. اجرای migration queries
    for (let i = 0; i < migrationQueries.length; i++) {
      console.log(`🔄 اجرای migration query ${i + 1}/${migrationQueries.length}...`);
      await client.query(migrationQueries[i]);
      console.log(`✅ Migration query ${i + 1} انجام شد`);
    }
    
    // 2. اضافه کردن ترجمه‌ها
    console.log('🔄 اضافه کردن ترجمه‌های مختلف...');
    for (const query of insertTranslations) {
      await client.query(query);
    }
    console.log('✅ ترجمه‌ها با موفقیت اضافه شدند');
    
    // 3. انتقال داده‌های موجود
    console.log('🔄 انتقال داده‌های موجود به ساختار جدید...');
    await client.query(migrateExistingData);
    console.log('✅ داده‌های موجود با موفقیت منتقل شدند');
    
    // 4. بررسی نتایج
    const translationsResult = await client.query('SELECT * FROM bible_translations ORDER BY sort_order');
    console.log('📊 ترجمه‌های موجود:');
    translationsResult.rows.forEach(row => {
      console.log(`   ${row.code}: ${row.name_fa} (${row.name_en}) - Active: ${row.is_active}, Default: ${row.is_default}`);
    });
    
    const versesWithTranslation = await client.query(`
      SELECT COUNT(*) as count, translation_id, bt.name_fa 
      FROM bible_verses bv 
      LEFT JOIN bible_translations bt ON bv.translation_id = bt.id 
      GROUP BY translation_id, bt.name_fa 
      ORDER BY translation_id NULLS FIRST
    `);
    console.log('📊 آیات موجود بر اساس ترجمه:');
    versesWithTranslation.rows.forEach(row => {
      console.log(`   ${row.name_fa || 'نامشخص'}: ${row.count} آیه`);
    });
    
    console.log('🎉 Migration با موفقیت کامل شد!');
    
  } catch (err) {
    console.error('❌ خطا در migration:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

// اگر مستقیماً اجرا شود
if (require.main === module) {
  (async () => {
    try {
      await addMultiTranslationSupport();
      console.log('✅ سیستم multi-translation آماده است!');
      process.exit(0);
    } catch (err) {
      console.error('❌ خطا:', err);
      process.exit(1);
    }
  })();
}

module.exports = { addMultiTranslationSupport };