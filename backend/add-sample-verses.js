const { pool } = require('./db-postgres');

/**
 * 🧪 Test Multi-Translation System
 * اضافه کردن نمونه آیات برای تست سیستم multi-translation
 */

async function addSampleVerses() {
  const client = await pool.connect();
  try {
    console.log('🧪 اضافه کردن آیات نمونه برای تست...');
    
    // گرفتن translation IDs
    const translations = await client.query('SELECT id, code FROM bible_translations ORDER BY sort_order');
    const translationMap = {};
    translations.rows.forEach(row => {
      translationMap[row.code] = row.id;
    });
    
    console.log('📋 ترجمه‌های موجود:', translationMap);
    
    // گرفتن chapter ID برای پیدایش فصل 1
    const genesisChapter = await client.query(`
      SELECT bc.id 
      FROM bible_chapters bc
      JOIN bible_books bb ON bc.book_id = bb.id
      WHERE bb.code = 'GEN' AND bc.chapter_number = 1
    `);
    
    if (genesisChapter.rows.length === 0) {
      console.log('❌ Genesis Chapter 1 not found');
      return;
    }
    
    const chapterId = genesisChapter.rows[0].id;
    console.log(`📖 Genesis Chapter 1 ID: ${chapterId}`);
    
    // نمونه آیات مختلف برای ترجمه‌های مختلف
    const sampleVerses = [
      // ترجمه مژده - Genesis 1:1-3
      {
        chapter_id: chapterId,
        verse_number: 1,
        text_fa: 'در ابتدا، خدا آسمانها و زمین را آفرید.',
        translation_id: translationMap['mojdeh']
      },
      {
        chapter_id: chapterId,
        verse_number: 2,
        text_fa: 'زمین خالی و بدون شکل بود. همهجا آب بود و تاریکی آن را پوشانده بود و روح خدا بر روی آبها حرکت می‌کرد.',
        translation_id: translationMap['mojdeh']
      },
      {
        chapter_id: chapterId,
        verse_number: 3,
        text_fa: 'خدا فرمود: «روشنایی بشود» و روشنایی شد.',
        translation_id: translationMap['mojdeh']
      },
      
      // ترجمه قدیم - Genesis 1:1-3
      {
        chapter_id: chapterId,
        verse_number: 1,
        text_fa: 'در ابتدا خدا آسمانها و زمین را آفرید.',
        translation_id: translationMap['qadim']
      },
      {
        chapter_id: chapterId,
        verse_number: 2,
        text_fa: 'و زمین خراب و خالی بود و ظلمت بر روی عمق بود. و روح خدا بر روی آبها جنبان بود.',
        translation_id: translationMap['qadim']
      },
      {
        chapter_id: chapterId,
        verse_number: 3,
        text_fa: 'و خدا گفت که روشنایی باشد، پس روشنایی شد.',
        translation_id: translationMap['qadim']
      },
      
      // ترجمه تفسیری عهد عتیق - Genesis 1:1-3
      {
        chapter_id: chapterId,
        verse_number: 1,
        text_fa: 'در آغاز، هنگامی که خدا آسمانها و زمین را آفرید',
        translation_id: translationMap['tafsiri_ot']
      },
      {
        chapter_id: chapterId,
        verse_number: 2,
        text_fa: 'زمین، خالی و بی شکل بود، و روح خدا روی تودهٔهای تاریکِ بخار حرکت می‌کرد.',
        translation_id: translationMap['tafsiri_ot']
      },
      {
        chapter_id: chapterId,
        verse_number: 3,
        text_fa: 'خدا فرمود: «روشنایی بشود». و روشنایی شد.',
        translation_id: translationMap['tafsiri_ot']
      }
    ];
    
    console.log(`💾 وارد کردن ${sampleVerses.length} آیه نمونه...`);
    
    let addedCount = 0;
    for (const verse of sampleVerses) {
      try {
        // چک کردن اینکه آیا آیه قبلاً وجود دارد
        const existing = await client.query(`
          SELECT id FROM bible_verses 
          WHERE chapter_id = $1 AND verse_number = $2 AND translation_id = $3
        `, [verse.chapter_id, verse.verse_number, verse.translation_id]);
        
        if (existing.rows.length === 0) {
          await client.query(`
            INSERT INTO bible_verses (chapter_id, verse_number, text_fa, translation_id)
            VALUES ($1, $2, $3, $4)
          `, [verse.chapter_id, verse.verse_number, verse.text_fa, verse.translation_id]);
          
          addedCount++;
          console.log(`   ✅ آیه ${verse.verse_number} اضافه شد برای ترجمه ID ${verse.translation_id}`);
        } else {
          console.log(`   ⚠️ آیه ${verse.verse_number} قبلاً موجود برای ترجمه ID ${verse.translation_id}`);
        }
      } catch (err) {
        console.error(`   ❌ خطا در آیه ${verse.verse_number}:`, err.message);
      }
    }
    
    console.log(`✅ ${addedCount} آیه جدید اضافه شد`);
    
    // گزارش نهایی
    const report = await client.query(`
      SELECT bt.name_fa, bt.code, COUNT(bv.id) as verse_count
      FROM bible_translations bt
      LEFT JOIN bible_verses bv ON bt.id = bv.translation_id
      GROUP BY bt.id, bt.name_fa, bt.code
      ORDER BY bt.sort_order
    `);
    
    console.log('\n📊 گزارش ترجمه‌ها بعد از اضافه کردن آیات نمونه:');
    report.rows.forEach(row => {
      console.log(`   ${row.name_fa} (${row.code}): ${row.verse_count} آیه`);
    });
    
  } catch (err) {
    console.error('❌ خطا:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// اجرا اگر مستقیماً فراخوانی شود
if (require.main === module) {
  (async () => {
    try {
      await addSampleVerses();
      console.log('🎉 آیات نمونه با موفقیت اضافه شدند!');
      process.exit(0);
    } catch (err) {
      console.error('❌ خطا:', err);
      process.exit(1);
    }
  })();
}

module.exports = { addSampleVerses };