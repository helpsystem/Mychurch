require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

async function createVerseViews() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 ساخت VIEWهای verses_* برای سازگاری با backend...\n');

    // تعریف VIEWها براساس translation_id
    const views = [
      { name: 'verses_mojdeh', translation_id: 1, description: 'ترجمه مژده - 11,745 آیه' },
      { name: 'verses_qadim', translation_id: 2, description: 'ترجمه قدیم' },
      { name: 'verses_tafsiri_ot', translation_id: 3, description: 'تفسیری عهد عتیق' },
      { name: 'verses_tafsiri_nt', translation_id: 4, description: 'تفسیری عهد جدید' },
      { name: 'verses_nav', translation_id: 5, description: 'عربی - كتاب الحياة' },
      { name: 'verses_pcb', translation_id: 6, description: 'معاصر' },
      { name: 'verses_rvr1960', translation_id: 8, description: 'اسپانیایی' },
      { name: 'verses_net', translation_id: 9, description: 'New English Translation' }
    ];

    // ساخت VIEW برای انگلیسی (جمع همه text_en ها - فرض می‌کنیم translation_id=1 کامل‌ترینه)
    console.log('📖 ساخت VIEW verses_eng (English)...');
    await pool.query(`
      CREATE OR REPLACE VIEW verses_eng AS
      SELECT 
        id,
        chapter_id,
        verse_number,
        text_en as verse_text,
        'eng' as book_code,
        chapter_id as chapter
      FROM bible_verses
      WHERE translation_id = 1 AND text_en IS NOT NULL;
    `);
    console.log('✅ verses_eng ساخته شد\n');

    // ساخت VIEWها برای هر ترجمه فارسی
    for (const view of views) {
      console.log(`📖 ساخت VIEW ${view.name} (${view.description})...`);
      
      await pool.query(`
        CREATE OR REPLACE VIEW ${view.name} AS
        SELECT 
          id,
          chapter_id,
          verse_number,
          text_fa as verse_text,
          'GEN' as book_code,
          chapter_id as chapter
        FROM bible_verses
        WHERE translation_id = ${view.translation_id} AND text_fa IS NOT NULL;
      `);
      
      const count = await pool.query(`SELECT COUNT(*) FROM ${view.name};`);
      console.log(`✅ ${view.name}: ${count.rows[0].count} آیه\n`);
    }

    // تست VIEWها
    console.log('\n🧪 تست VIEWها:');
    const testViews = ['verses_eng', 'verses_mojdeh', 'verses_qadim'];
    
    for (const viewName of testViews) {
      const result = await pool.query(`
        SELECT COUNT(*) as total, MIN(verse_number) as first, MAX(verse_number) as last
        FROM ${viewName};
      `);
      console.log(`✅ ${viewName}: ${result.rows[0].total} آیه (آیات ${result.rows[0].first}-${result.rows[0].last})`);
    }

    // نمونه داده
    console.log('\n📝 نمونه داده از verses_qadim:');
    const sample = await pool.query(`
      SELECT id, chapter_id, verse_number, LEFT(verse_text, 50) as preview
      FROM verses_qadim
      LIMIT 3;
    `);
    console.table(sample.rows);

    await pool.end();
    console.log('\n✅ همه VIEWها با موفقیت ساخته شدند!');
    console.log('💡 حالا backend می‌تونه از verses_qadim, verses_mojdeh, verses_eng استفاده کنه.');
  } catch (error) {
    console.error('\n❌ خطا:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createVerseViews();
