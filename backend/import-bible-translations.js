const { pool } = require('./db-postgres');
const fs = require('fs').promises;
const path = require('path');

/**
 * 📖 Import Bible Translations Script
 * 
 * این اسکریپت فایل‌های ترجمه‌های مختلف بایبل را پردازش کرده و وارد دیتابیس می‌کند:
 * - verses_mojdeh_1757861410662.sql
 * - verses_qadim_1757861410663.sql  
 * - verses_tafsiri_ot_1757861410663.sql
 * - verses_tafsiri_nt_1757861410663.txt
 */

const ATTACHED_ASSETS_DIR = path.join(__dirname, '..', 'attached_assets');

// نقشه کتاب‌ها برای تطبیق نام‌ها
const bookNameMap = {
  // عهد عتیق
  'پیدایش': 'GEN', 'Genesis': 'GEN',
  'خروج': 'EXO', 'Exodus': 'EXO', 
  'لاویان': 'LEV', 'Leviticus': 'LEV',
  'اعداد': 'NUM', 'Numbers': 'NUM',
  'تثنیه': 'DEU', 'Deuteronomy': 'DEU',
  'یوشع': 'JOS', 'Joshua': 'JOS',
  'داوران': 'JDG', 'Judges': 'JDG',
  'روت': 'RUT', 'Ruth': 'RUT',
  '۱ سموئیل': '1SA', '1 Samuel': '1SA',
  '۲ سموئیل': '2SA', '2 Samuel': '2SA',
  '۱ پادشاهان': '1KI', '1 Kings': '1KI',
  '۲ پادشاهان': '2KI', '2 Kings': '2KI',
  '۱ تواریخ': '1CH', '1 Chronicles': '1CH',
  '۲ تواریخ': '2CH', '2 Chronicles': '2CH',
  'عزرا': 'EZR', 'Ezra': 'EZR',
  'نحمیا': 'NEH', 'Nehemiah': 'NEH',
  'استر': 'EST', 'Esther': 'EST',
  'ایوب': 'JOB', 'Job': 'JOB',
  'مزامیر': 'PSA', 'Psalms': 'PSA',
  'امثال': 'PRO', 'Proverbs': 'PRO',
  'جامعه': 'ECC', 'Ecclesiastes': 'ECC',
  'غزل الغزلها': 'SNG', 'Song of Songs': 'SNG',
  'اشعیا': 'ISA', 'Isaiah': 'ISA',
  'ارمیا': 'JER', 'Jeremiah': 'JER',
  'مراثی': 'LAM', 'Lamentations': 'LAM',
  'حزقیال': 'EZK', 'Ezekiel': 'EZK',
  'دانیال': 'DAN', 'Daniel': 'DAN',
  'هوشع': 'HOS', 'Hosea': 'HOS',
  'یوئیل': 'JOL', 'Joel': 'JOL',
  'عاموس': 'AMO', 'Amos': 'AMO',
  'عوبدیا': 'OBA', 'Obadiah': 'OBA',
  'یونس': 'JON', 'Jonah': 'JON',
  'میخا': 'MIC', 'Micah': 'MIC',
  'ناحوم': 'NAH', 'Nahum': 'NAH',
  'حبقوق': 'HAB', 'Habakkuk': 'HAB',
  'صفنیا': 'ZEP', 'Zephaniah': 'ZEP',
  'حجی': 'HAG', 'Haggai': 'HAG',
  'زکریا': 'ZEC', 'Zechariah': 'ZEC',
  'ملاکی': 'MAL', 'Malachi': 'MAL',
  
  // عهد جدید
  'متی': 'MAT', 'Matthew': 'MAT',
  'مرقس': 'MRK', 'Mark': 'MRK',
  'لوقا': 'LUK', 'Luke': 'LUK',
  'یوحنا': 'JHN', 'John': 'JHN',
  'اعمال': 'ACT', 'Acts': 'ACT',
  'رومیان': 'ROM', 'Romans': 'ROM',
  '۱ قرنتیان': '1CO', '1 Corinthians': '1CO',
  '۲ قرنتیان': '2CO', '2 Corinthians': '2CO',
  'غلاطیان': 'GAL', 'Galatians': 'GAL',
  'افسسیان': 'EPH', 'Ephesians': 'EPH',
  'فیلیپیان': 'PHP', 'Philippians': 'PHP',
  'کولسیان': 'COL', 'Colossians': 'COL',
  '۱ تسالونیکیان': '1TH', '1 Thessalonians': '1TH',
  '۲ تسالونیکیان': '2TH', '2 Thessalonians': '2TH',
  '۱ تیموتائوس': '1TI', '1 Timothy': '1TI',
  '۲ تیموتائوس': '2TI', '2 Timothy': '2TI',
  'تیطس': 'TIT', 'Titus': 'TIT',
  'فلیمون': 'PHM', 'Philemon': 'PHM',
  'عبرانیان': 'HEB', 'Hebrews': 'HEB',
  'یعقوب': 'JAS', 'James': 'JAS',
  '۱ پطرس': '1PE', '1 Peter': '1PE',
  '۲ پطرس': '2PE', '2 Peter': '2PE',
  '۱ یوحنا': '1JN', '1 John': '1JN',
  '۲ یوحنا': '2JN', '2 John': '2JN',
  '۳ یوحنا': '3JN', '3 John': '3JN',
  'یهودا': 'JUD', 'Jude': 'JUD',
  'مکاشفه': 'REV', 'Revelation': 'REV'
};

// تابع تمیز کردن متن
function cleanText(text) {
  if (!text) return null;
  return text.trim()
    .replace(/\s+/g, ' ')
    .replace(/[‌]/g, '') // حذف نیم‌فاصله
    .trim();
}

// تابع یافتن chapter_id بر اساس کتاب و فصل
async function getChapterId(client, bookAbbr, chapterNumber) {
  const result = await client.query(`
    SELECT bc.id 
    FROM bible_chapters bc
    JOIN bible_books bb ON bc.book_id = bb.id
    WHERE bb.code = $1 AND bc.chapter_number = $2
  `, [bookAbbr, chapterNumber]);
  
  return result.rows.length > 0 ? result.rows[0].id : null;
}

// تابع یافتن translation_id
async function getTranslationId(client, translationCode) {
  const result = await client.query(
    'SELECT id FROM bible_translations WHERE code = $1',
    [translationCode]
  );
  return result.rows.length > 0 ? result.rows[0].id : null;
}

// پردازش فایل SQL
async function processSQLFile(filePath, translationCode) {
  console.log(`📖 در حال پردازش ${path.basename(filePath)} برای ترجمه ${translationCode}...`);
  
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n');
  
  const verses = [];
  let currentBookAbbr = null;
  
  for (const line of lines) {
    if (line.trim().startsWith('INSERT IGNORE INTO')) {
      const match = line.match(/INSERT IGNORE INTO `bible` \(version, book, chapter, verse_number, text_fa, text_en\) VALUES/);
      if (!match) continue;
    }
    
    if (line.includes("('")) {
      // استخراج داده‌ها از خط SQL
      const regex = /\('([^']*)',\s*'([^']*)',\s*(\d+),\s*(\d+)\s*,\s*'([^']*)',\s*(.+?)\)/g;
      let match;
      
      while ((match = regex.exec(line)) !== null) {
        const [, version, book, chapter, verse, textFa] = match;
        
        if (version === translationCode && textFa && textFa.trim()) {
          // تشخیص کتاب از متن فارسی اگر book خالی باشد
          if (!book || book.trim() === '') {
            if (textFa.includes('پیدایش')) currentBookAbbr = 'GEN';
            else if (textFa.includes('خروج')) currentBookAbbr = 'EXO';
            // ... ادامه mapping ها
          }
          
          verses.push({
            bookAbbr: currentBookAbbr || 'GEN', // پیش‌فرض
            chapter: parseInt(chapter),
            verse: parseInt(verse),
            text: cleanText(textFa)
          });
        }
      }
    }
  }
  
  return verses;
}

// پردازش فایل TXT
async function processTXTFile(filePath, translationCode) {
  console.log(`📄 در حال پردازش ${path.basename(filePath)} برای ترجمه ${translationCode}...`);
  
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n');
  
  const verses = [];
  let currentBookAbbr = 'MAT'; // عهد جدید از متی شروع می‌شود
  let currentChapter = 1;
  let currentVerse = 1;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // تشخیص شروع کتاب جدید
    const bookMatch = Object.keys(bookNameMap).find(bookName => 
      trimmedLine.includes(bookName)
    );
    if (bookMatch) {
      currentBookAbbr = bookNameMap[bookMatch];
      currentChapter = 1;
      currentVerse = 1;
      continue;
    }
    
    // تشخیص شماره فصل
    const chapterMatch = trimmedLine.match(/^(\d+)/);
    if (chapterMatch && trimmedLine.length < 20) {
      currentChapter = parseInt(chapterMatch[1]);
      currentVerse = 1;
      continue;
    }
    
    // اگر خط شامل متن آیه است
    if (trimmedLine.length > 20) {
      verses.push({
        bookAbbr: currentBookAbbr,
        chapter: currentChapter,
        verse: currentVerse,
        text: cleanText(trimmedLine)
      });
      currentVerse++;
    }
  }
  
  return verses;
}

// وارد کردن آیات به دیتابیس
async function importVerses(client, verses, translationId) {
  console.log(`💾 در حال وارد کردن ${verses.length} آیه...`);
  
  let importedCount = 0;
  let skippedCount = 0;
  
  for (const verse of verses) {
    try {
      const chapterId = await getChapterId(client, verse.bookAbbr, verse.chapter);
      if (!chapterId) {
        console.log(`⚠️ Chapter not found: ${verse.bookAbbr} ${verse.chapter}`);
        skippedCount++;
        continue;
      }
      
      // چک کردن اینکه آیا آیه قبلاً وجود دارد
      const existing = await client.query(`
        SELECT id FROM bible_verses 
        WHERE chapter_id = $1 AND verse_number = $2 AND translation_id = $3
      `, [chapterId, verse.verse, translationId]);
      
      if (existing.rows.length > 0) {
        skippedCount++;
        continue;
      }
      
      // وارد کردن آیه جدید
      await client.query(`
        INSERT INTO bible_verses (chapter_id, verse_number, text_fa, translation_id)
        VALUES ($1, $2, $3, $4)
      `, [chapterId, verse.verse, verse.text, translationId]);
      
      importedCount++;
      
      if (importedCount % 1000 === 0) {
        console.log(`   📊 ${importedCount} آیه وارد شد...`);
      }
      
    } catch (err) {
      console.error(`❌ خطا در وارد کردن آیه ${verse.bookAbbr} ${verse.chapter}:${verse.verse}:`, err.message);
      skippedCount++;
    }
  }
  
  console.log(`✅ تکمیل: ${importedCount} آیه وارد شد، ${skippedCount} آیه رد شد`);
  return { imported: importedCount, skipped: skippedCount };
}

// تابع اصلی
async function importAllTranslations() {
  const client = await pool.connect();
  try {
    console.log('🚀 شروع وارد کردن ترجمه‌های بایبل...');
    
    const translationFiles = [
      { 
        file: 'verses_mojdeh_1757861410662.sql', 
        code: 'mojdeh', 
        type: 'sql' 
      },
      { 
        file: 'verses_qadim_1757861410663.sql', 
        code: 'qadim', 
        type: 'sql' 
      },
      { 
        file: 'verses_tafsiri_ot_1757861410663.sql', 
        code: 'tafsiri_ot', 
        type: 'sql' 
      },
      { 
        file: 'verses_tafsiri_nt_1757861410663.txt', 
        code: 'tafsiri_nt', 
        type: 'txt' 
      }
    ];
    
    const totalStats = { imported: 0, skipped: 0 };
    
    for (const translation of translationFiles) {
      const filePath = path.join(ATTACHED_ASSETS_DIR, translation.file);
      
      try {
        // بررسی وجود فایل
        await fs.access(filePath);
        
        // گرفتن translation_id
        const translationId = await getTranslationId(client, translation.code);
        if (!translationId) {
          console.log(`❌ Translation '${translation.code}' not found in database`);
          continue;
        }
        
        // پردازش فایل
        let verses;
        if (translation.type === 'sql') {
          verses = await processSQLFile(filePath, translation.code);
        } else {
          verses = await processTXTFile(filePath, translation.code);
        }
        
        console.log(`📋 ${verses.length} آیه پردازش شد برای ${translation.code}`);
        
        // وارد کردن به دیتابیس
        const stats = await importVerses(client, verses, translationId);
        totalStats.imported += stats.imported;
        totalStats.skipped += stats.skipped;
        
        console.log(`✅ ${translation.code} کامل شد\n`);
        
      } catch (err) {
        console.error(`❌ خطا در پردازش ${translation.file}:`, err.message);
      }
    }
    
    console.log('📊 خلاصه نهایی:');
    console.log(`   ✅ مجموع آیات وارد شده: ${totalStats.imported}`);
    console.log(`   ⚠️ مجموع آیات رد شده: ${totalStats.skipped}`);
    
    // گزارش نهایی
    const finalReport = await client.query(`
      SELECT bt.name_fa, bt.code, COUNT(bv.id) as verse_count
      FROM bible_translations bt
      LEFT JOIN bible_verses bv ON bt.id = bv.translation_id
      GROUP BY bt.id, bt.name_fa, bt.code
      ORDER BY bt.sort_order
    `);
    
    console.log('\n📈 گزارش ترجمه‌ها:');
    finalReport.rows.forEach(row => {
      console.log(`   ${row.name_fa} (${row.code}): ${row.verse_count} آیه`);
    });
    
  } catch (err) {
    console.error('❌ خطای کلی:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// اجرا اگر مستقیماً فراخوانی شود
if (require.main === module) {
  (async () => {
    try {
      await importAllTranslations();
      console.log('🎉 وارد کردن ترجمه‌ها با موفقیت انجام شد!');
      process.exit(0);
    } catch (err) {
      console.error('❌ خطا:', err);
      process.exit(1);
    }
  })();
}

module.exports = { importAllTranslations };