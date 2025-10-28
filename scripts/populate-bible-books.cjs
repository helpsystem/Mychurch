require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const BIBLE_BOOKS = [
  // عهد عتیق (Old Testament) - 39 کتاب
  { book_iso: 'GEN', book_name: 'Genesis', book_name_fa: 'پیدایش', testament: 'OT', book_number: 1 },
  { book_iso: 'EXO', book_name: 'Exodus', book_name_fa: 'خروج', testament: 'OT', book_number: 2 },
  { book_iso: 'LEV', book_name: 'Leviticus', book_name_fa: 'لاویان', testament: 'OT', book_number: 3 },
  { book_iso: 'NUM', book_name: 'Numbers', book_name_fa: 'اعداد', testament: 'OT', book_number: 4 },
  { book_iso: 'DEU', book_name: 'Deuteronomy', book_name_fa: 'تثنیه', testament: 'OT', book_number: 5 },
  { book_iso: 'JOS', book_name: 'Joshua', book_name_fa: 'یوشع', testament: 'OT', book_number: 6 },
  { book_iso: 'JDG', book_name: 'Judges', book_name_fa: 'داوران', testament: 'OT', book_number: 7 },
  { book_iso: 'RUT', book_name: 'Ruth', book_name_fa: 'روت', testament: 'OT', book_number: 8 },
  { book_iso: '1SA', book_name: '1 Samuel', book_name_fa: 'اول سموئیل', testament: 'OT', book_number: 9 },
  { book_iso: '2SA', book_name: '2 Samuel', book_name_fa: 'دوم سموئیل', testament: 'OT', book_number: 10 },
  { book_iso: '1KI', book_name: '1 Kings', book_name_fa: 'اول پادشاهان', testament: 'OT', book_number: 11 },
  { book_iso: '2KI', book_name: '2 Kings', book_name_fa: 'دوم پادشاهان', testament: 'OT', book_number: 12 },
  { book_iso: '1CH', book_name: '1 Chronicles', book_name_fa: 'اول تواریخ', testament: 'OT', book_number: 13 },
  { book_iso: '2CH', book_name: '2 Chronicles', book_name_fa: 'دوم تواریخ', testament: 'OT', book_number: 14 },
  { book_iso: 'EZR', book_name: 'Ezra', book_name_fa: 'عزرا', testament: 'OT', book_number: 15 },
  { book_iso: 'NEH', book_name: 'Nehemiah', book_name_fa: 'نحمیا', testament: 'OT', book_number: 16 },
  { book_iso: 'EST', book_name: 'Esther', book_name_fa: 'استر', testament: 'OT', book_number: 17 },
  { book_iso: 'JOB', book_name: 'Job', book_name_fa: 'ایوب', testament: 'OT', book_number: 18 },
  { book_iso: 'PSA', book_name: 'Psalms', book_name_fa: 'مزامیر', testament: 'OT', book_number: 19 },
  { book_iso: 'PRO', book_name: 'Proverbs', book_name_fa: 'امثال', testament: 'OT', book_number: 20 },
  { book_iso: 'ECC', book_name: 'Ecclesiastes', book_name_fa: 'جامعه', testament: 'OT', book_number: 21 },
  { book_iso: 'SNG', book_name: 'Song of Solomon', book_name_fa: 'غزل غزلها', testament: 'OT', book_number: 22 },
  { book_iso: 'ISA', book_name: 'Isaiah', book_name_fa: 'اشعیا', testament: 'OT', book_number: 23 },
  { book_iso: 'JER', book_name: 'Jeremiah', book_name_fa: 'ارمیا', testament: 'OT', book_number: 24 },
  { book_iso: 'LAM', book_name: 'Lamentations', book_name_fa: 'مراثی ارمیا', testament: 'OT', book_number: 25 },
  { book_iso: 'EZK', book_name: 'Ezekiel', book_name_fa: 'حزقیال', testament: 'OT', book_number: 26 },
  { book_iso: 'DAN', book_name: 'Daniel', book_name_fa: 'دانیال', testament: 'OT', book_number: 27 },
  { book_iso: 'HOS', book_name: 'Hosea', book_name_fa: 'هوشع', testament: 'OT', book_number: 28 },
  { book_iso: 'JOL', book_name: 'Joel', book_name_fa: 'یوئیل', testament: 'OT', book_number: 29 },
  { book_iso: 'AMO', book_name: 'Amos', book_name_fa: 'عاموس', testament: 'OT', book_number: 30 },
  { book_iso: 'OBA', book_name: 'Obadiah', book_name_fa: 'عوبدیا', testament: 'OT', book_number: 31 },
  { book_iso: 'JON', book_name: 'Jonah', book_name_fa: 'یونس', testament: 'OT', book_number: 32 },
  { book_iso: 'MIC', book_name: 'Micah', book_name_fa: 'میکاه', testament: 'OT', book_number: 33 },
  { book_iso: 'NAM', book_name: 'Nahum', book_name_fa: 'ناحوم', testament: 'OT', book_number: 34 },
  { book_iso: 'HAB', book_name: 'Habakkuk', book_name_fa: 'حبقوق', testament: 'OT', book_number: 35 },
  { book_iso: 'ZEP', book_name: 'Zephaniah', book_name_fa: 'صفنیا', testament: 'OT', book_number: 36 },
  { book_iso: 'HAG', book_name: 'Haggai', book_name_fa: 'حجی', testament: 'OT', book_number: 37 },
  { book_iso: 'ZEC', book_name: 'Zechariah', book_name_fa: 'زکریا', testament: 'OT', book_number: 38 },
  { book_iso: 'MAL', book_name: 'Malachi', book_name_fa: 'ملاکی', testament: 'OT', book_number: 39 },
  
  // عهد جدید (New Testament) - 27 کتاب
  { book_iso: 'MAT', book_name: 'Matthew', book_name_fa: 'متی', testament: 'NT', book_number: 40 },
  { book_iso: 'MRK', book_name: 'Mark', book_name_fa: 'مرقس', testament: 'NT', book_number: 41 },
  { book_iso: 'LUK', book_name: 'Luke', book_name_fa: 'لوقا', testament: 'NT', book_number: 42 },
  { book_iso: 'JHN', book_name: 'John', book_name_fa: 'یوحنا', testament: 'NT', book_number: 43 },
  { book_iso: 'ACT', book_name: 'Acts', book_name_fa: 'اعمال رسولان', testament: 'NT', book_number: 44 },
  { book_iso: 'ROM', book_name: 'Romans', book_name_fa: 'رومیان', testament: 'NT', book_number: 45 },
  { book_iso: '1CO', book_name: '1 Corinthians', book_name_fa: 'اول قرنتیان', testament: 'NT', book_number: 46 },
  { book_iso: '2CO', book_name: '2 Corinthians', book_name_fa: 'دوم قرنتیان', testament: 'NT', book_number: 47 },
  { book_iso: 'GAL', book_name: 'Galatians', book_name_fa: 'غلاطیان', testament: 'NT', book_number: 48 },
  { book_iso: 'EPH', book_name: 'Ephesians', book_name_fa: 'افسسیان', testament: 'NT', book_number: 49 },
  { book_iso: 'PHP', book_name: 'Philippians', book_name_fa: 'فیلیپیان', testament: 'NT', book_number: 50 },
  { book_iso: 'COL', book_name: 'Colossians', book_name_fa: 'کولسیان', testament: 'NT', book_number: 51 },
  { book_iso: '1TH', book_name: '1 Thessalonians', book_name_fa: 'اول تسالونیکیان', testament: 'NT', book_number: 52 },
  { book_iso: '2TH', book_name: '2 Thessalonians', book_name_fa: 'دوم تسالونیکیان', testament: 'NT', book_number: 53 },
  { book_iso: '1TI', book_name: '1 Timothy', book_name_fa: 'اول تیموتائوس', testament: 'NT', book_number: 54 },
  { book_iso: '2TI', book_name: '2 Timothy', book_name_fa: 'دوم تیموتائوس', testament: 'NT', book_number: 55 },
  { book_iso: 'TIT', book_name: 'Titus', book_name_fa: 'تیطس', testament: 'NT', book_number: 56 },
  { book_iso: 'PHM', book_name: 'Philemon', book_name_fa: 'فلیمون', testament: 'NT', book_number: 57 },
  { book_iso: 'HEB', book_name: 'Hebrews', book_name_fa: 'عبرانیان', testament: 'NT', book_number: 58 },
  { book_iso: 'JAS', book_name: 'James', book_name_fa: 'یعقوب', testament: 'NT', book_number: 59 },
  { book_iso: '1PE', book_name: '1 Peter', book_name_fa: 'اول پطرس', testament: 'NT', book_number: 60 },
  { book_iso: '2PE', book_name: '2 Peter', book_name_fa: 'دوم پطرس', testament: 'NT', book_number: 61 },
  { book_iso: '1JN', book_name: '1 John', book_name_fa: 'اول یوحنا', testament: 'NT', book_number: 62 },
  { book_iso: '2JN', book_name: '2 John', book_name_fa: 'دوم یوحنا', testament: 'NT', book_number: 63 },
  { book_iso: '3JN', book_name: '3 John', book_name_fa: 'سوم یوحنا', testament: 'NT', book_number: 64 },
  { book_iso: 'JUD', book_name: 'Jude', book_name_fa: 'یهودا', testament: 'NT', book_number: 65 },
  { book_iso: 'REV', book_name: 'Revelation', book_name_fa: 'مکاشفه', testament: 'NT', book_number: 66 }
];

async function populateBibleBooks() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 شروع وارد کردن 66 کتاب کتاب مقدس...\n');

    // چک کنیم آیا جدول خالیه
    const countResult = await pool.query('SELECT COUNT(*) FROM bible_books;');
    const existingCount = parseInt(countResult.rows[0].count);
    
    if (existingCount > 0) {
      console.log(`⚠️  توجه: ${existingCount} کتاب از قبل موجود است!`);
      console.log('آیا می‌خواهید جدول را خالی کنید و دوباره پر کنید؟ (Ctrl+C برای انصراف)\n');
      
      // پاک کردن داده‌های قبلی
      await pool.query('DELETE FROM bible_books;');
      console.log('✅ داده‌های قبلی پاک شد.\n');
    }

    // وارد کردن داده‌ها
    let insertedCount = 0;
    let errors = 0;

    for (const book of BIBLE_BOOKS) {
      try {
        await pool.query(`
          INSERT INTO bible_books (book_iso, book_name, book_name_fa, testament, book_number, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          ON CONFLICT (book_iso) DO UPDATE
          SET 
            book_name = EXCLUDED.book_name,
            book_name_fa = EXCLUDED.book_name_fa,
            testament = EXCLUDED.testament,
            book_number = EXCLUDED.book_number,
            updated_at = NOW();
        `, [book.book_iso, book.book_name, book.book_name_fa, book.testament, book.book_number]);
        
        insertedCount++;
        process.stdout.write(`\r✅ وارد شده: ${insertedCount} / ${BIBLE_BOOKS.length}`);
      } catch (err) {
        errors++;
        console.log(`\n❌ خطا در ${book.book_name}: ${err.message}`);
      }
    }

    console.log('\n');
    
    // بررسی نتیجه نهایی
    const finalCount = await pool.query('SELECT COUNT(*) FROM bible_books;');
    const totalBooks = parseInt(finalCount.rows[0].count);

    console.log('\n📊 نتیجه نهایی:');
    console.log(`  ✅ کل کتاب‌ها: ${totalBooks}`);
    console.log(`  ✅ وارد شده: ${insertedCount}`);
    console.log(`  ❌ خطاها: ${errors}`);

    // نمایش تعداد کتاب‌های هر عهد
    const otCount = await pool.query("SELECT COUNT(*) FROM bible_books WHERE testament = 'OT';");
    const ntCount = await pool.query("SELECT COUNT(*) FROM bible_books WHERE testament = 'NT';");
    
    console.log(`\n  📖 عهد عتیق: ${otCount.rows[0].count} کتاب`);
    console.log(`  📖 عهد جدید: ${ntCount.rows[0].count} کتاب`);

    // نمایش چند نمونه
    console.log('\n📚 نمونه کتاب‌ها:');
    const samples = await pool.query(`
      SELECT book_number, book_iso, book_name, book_name_fa, testament 
      FROM bible_books 
      ORDER BY book_number 
      LIMIT 5;
    `);
    console.table(samples.rows);

    await pool.end();
    console.log('\n✅ عملیات با موفقیت کامل شد!');
  } catch (error) {
    console.error('\n❌ خطای اصلی:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// اجرای اسکریپت
if (require.main === module) {
  populateBibleBooks();
}

module.exports = { BIBLE_BOOKS };
