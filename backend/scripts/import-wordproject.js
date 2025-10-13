const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { Client } = require('pg');

// ✅ مسیر فایل‌های HTML
const WORDPROJECT_PATH = 'C:\\Users\\Sami\\Desktop\\Iran Church DC\\My Web Sites\\wordproject.org\\wordproject.org\\bibles\\fa';

// ✅ اطلاعات 66 کتاب کتاب مقدس
const BIBLE_BOOKS = [
  // عهد عتیق (Old Testament)
  { number: 1, name_fa: 'پیدایش', name_en: 'Genesis', chapters: 50, testament: 'old' },
  { number: 2, name_fa: 'خروج', name_en: 'Exodus', chapters: 40, testament: 'old' },
  { number: 3, name_fa: 'لاویان', name_en: 'Leviticus', chapters: 27, testament: 'old' },
  { number: 4, name_fa: 'اعداد', name_en: 'Numbers', chapters: 36, testament: 'old' },
  { number: 5, name_fa: 'تَثنیه', name_en: 'Deuteronomy', chapters: 34, testament: 'old' },
  { number: 6, name_fa: 'یوشَع', name_en: 'Joshua', chapters: 24, testament: 'old' },
  { number: 7, name_fa: 'داوران', name_en: 'Judges', chapters: 21, testament: 'old' },
  { number: 8, name_fa: 'روت', name_en: 'Ruth', chapters: 4, testament: 'old' },
  { number: 9, name_fa: 'اول سموئیل', name_en: '1 Samuel', chapters: 31, testament: 'old' },
  { number: 10, name_fa: 'دوم سموئیل', name_en: '2 Samuel', chapters: 24, testament: 'old' },
  { number: 11, name_fa: 'اول پادشاهان', name_en: '1 Kings', chapters: 22, testament: 'old' },
  { number: 12, name_fa: 'دوم پادشاهان', name_en: '2 Kings', chapters: 25, testament: 'old' },
  { number: 13, name_fa: 'اول تواریخ', name_en: '1 Chronicles', chapters: 29, testament: 'old' },
  { number: 14, name_fa: 'دوم تواریخ', name_en: '2 Chronicles', chapters: 36, testament: 'old' },
  { number: 15, name_fa: 'عِزرا', name_en: 'Ezra', chapters: 10, testament: 'old' },
  { number: 16, name_fa: 'نِحِمیا', name_en: 'Nehemiah', chapters: 13, testament: 'old' },
  { number: 17, name_fa: 'اِستر', name_en: 'Esther', chapters: 10, testament: 'old' },
  { number: 18, name_fa: 'ایوب', name_en: 'Job', chapters: 42, testament: 'old' },
  { number: 19, name_fa: 'مزامیر', name_en: 'Psalms', chapters: 150, testament: 'old' },
  { number: 20, name_fa: 'امثال سلیمان', name_en: 'Proverbs', chapters: 31, testament: 'old' },
  { number: 21, name_fa: 'جامعه', name_en: 'Ecclesiastes', chapters: 12, testament: 'old' },
  { number: 22, name_fa: 'غزل غزلهای سلیمان', name_en: 'Song of Solomon', chapters: 8, testament: 'old' },
  { number: 23, name_fa: 'اِشعیا', name_en: 'Isaiah', chapters: 66, testament: 'old' },
  { number: 24, name_fa: 'اِرمیا', name_en: 'Jeremiah', chapters: 52, testament: 'old' },
  { number: 25, name_fa: 'مراثی اِرمیا', name_en: 'Lamentations', chapters: 5, testament: 'old' },
  { number: 26, name_fa: 'حِزقیال', name_en: 'Ezekiel', chapters: 48, testament: 'old' },
  { number: 27, name_fa: 'دانیال', name_en: 'Daniel', chapters: 12, testament: 'old' },
  { number: 28, name_fa: 'هوشَع', name_en: 'Hosea', chapters: 14, testament: 'old' },
  { number: 29, name_fa: 'یوئیل', name_en: 'Joel', chapters: 3, testament: 'old' },
  { number: 30, name_fa: 'عاموس', name_en: 'Amos', chapters: 9, testament: 'old' },
  { number: 31, name_fa: 'عوبَدیا', name_en: 'Obadiah', chapters: 1, testament: 'old' },
  { number: 32, name_fa: 'یونس', name_en: 'Jonah', chapters: 4, testament: 'old' },
  { number: 33, name_fa: 'میکاه', name_en: 'Micah', chapters: 7, testament: 'old' },
  { number: 34, name_fa: 'ناحوم', name_en: 'Nahum', chapters: 3, testament: 'old' },
  { number: 35, name_fa: 'حَبَقوق', name_en: 'Habakkuk', chapters: 3, testament: 'old' },
  { number: 36, name_fa: 'صَفَنیا', name_en: 'Zephaniah', chapters: 3, testament: 'old' },
  { number: 37, name_fa: 'حَجَّی', name_en: 'Haggai', chapters: 2, testament: 'old' },
  { number: 38, name_fa: 'زکریا', name_en: 'Zechariah', chapters: 14, testament: 'old' },
  { number: 39, name_fa: 'مَلاکی', name_en: 'Malachi', chapters: 4, testament: 'old' },
  
  // عهد جدید (New Testament)
  { number: 40, name_fa: 'مَتّی', name_en: 'Matthew', chapters: 28, testament: 'new' },
  { number: 41, name_fa: 'مَرقُس', name_en: 'Mark', chapters: 16, testament: 'new' },
  { number: 42, name_fa: 'لوقا', name_en: 'Luke', chapters: 24, testament: 'new' },
  { number: 43, name_fa: 'یوحنا', name_en: 'John', chapters: 21, testament: 'new' },
  { number: 44, name_fa: 'اعمال رسولان', name_en: 'Acts', chapters: 28, testament: 'new' },
  { number: 45, name_fa: 'رومیان', name_en: 'Romans', chapters: 16, testament: 'new' },
  { number: 46, name_fa: 'اول قُرِنتیان', name_en: '1 Corinthians', chapters: 16, testament: 'new' },
  { number: 47, name_fa: 'دوم قُرِنتیان', name_en: '2 Corinthians', chapters: 13, testament: 'new' },
  { number: 48, name_fa: 'غَلاطیان', name_en: 'Galatians', chapters: 6, testament: 'new' },
  { number: 49, name_fa: 'اَفِسُسیان', name_en: 'Ephesians', chapters: 6, testament: 'new' },
  { number: 50, name_fa: 'فیلیپیان', name_en: 'Philippians', chapters: 4, testament: 'new' },
  { number: 51, name_fa: 'کولُسیان', name_en: 'Colossians', chapters: 4, testament: 'new' },
  { number: 52, name_fa: 'اول تَسالونیکیان', name_en: '1 Thessalonians', chapters: 5, testament: 'new' },
  { number: 53, name_fa: 'دوم تَسالونیکیان', name_en: '2 Thessalonians', chapters: 3, testament: 'new' },
  { number: 54, name_fa: 'اول تیموتائوس', name_en: '1 Timothy', chapters: 6, testament: 'new' },
  { number: 55, name_fa: 'دوم تیموتائوس', name_en: '2 Timothy', chapters: 4, testament: 'new' },
  { number: 56, name_fa: 'تیطُس', name_en: 'Titus', chapters: 3, testament: 'new' },
  { number: 57, name_fa: 'فیلیمون', name_en: 'Philemon', chapters: 1, testament: 'new' },
  { number: 58, name_fa: 'عبرانیان', name_en: 'Hebrews', chapters: 13, testament: 'new' },
  { number: 59, name_fa: 'یعقوب', name_en: 'James', chapters: 5, testament: 'new' },
  { number: 60, name_fa: 'اول پِطرُس', name_en: '1 Peter', chapters: 5, testament: 'new' },
  { number: 61, name_fa: 'دوم پِطرُس', name_en: '2 Peter', chapters: 3, testament: 'new' },
  { number: 62, name_fa: 'اول یوحنا', name_en: '1 John', chapters: 5, testament: 'new' },
  { number: 63, name_fa: 'دوم یوحنا', name_en: '2 John', chapters: 1, testament: 'new' },
  { number: 64, name_fa: 'سوم یوحنا', name_en: '3 John', chapters: 1, testament: 'new' },
  { number: 65, name_fa: 'یهودا', name_en: 'Jude', chapters: 1, testament: 'new' },
  { number: 66, name_fa: 'مکاشفۀ یوحنا', name_en: 'Revelation', chapters: 22, testament: 'new' }
];

// ✅ استخراج آیات از HTML
function extractVersesFromHTML(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  const verses = [];
  const verseSpans = document.querySelectorAll('span.verse');
  
  verseSpans.forEach(span => {
    const verseNumber = parseInt(span.textContent.trim());
    const verseId = span.getAttribute('id');
    
    // متن آیه بعد از span هست
    let verseText = '';
    let nextNode = span.nextSibling;
    
    while (nextNode) {
      if (nextNode.nodeType === 3) { // Text node
        verseText += nextNode.textContent.trim() + ' ';
      } else if (nextNode.nodeName === 'BR') {
        break;
      } else if (nextNode.nodeName === 'SPAN' && nextNode.classList.contains('verse')) {
        break;
      }
      nextNode = nextNode.nextSibling;
    }
    
    if (verseText.trim()) {
      verses.push({
        number: verseNumber,
        text: verseText.trim().replace(/\s+/g, ' ')
      });
    }
  });
  
  return verses;
}

// ✅ خواندن یک باب HTML
function readChapterHTML(bookNumber, chapterNumber) {
  const bookFolder = String(bookNumber).padStart(2, '0');
  const filePath = path.join(WORDPROJECT_PATH, bookFolder, `${chapterNumber}.html`);
  
  try {
    if (fs.existsSync(filePath)) {
      const html = fs.readFileSync(filePath, 'utf8');
      return html;
    } else {
      console.warn(`⚠️ فایل پیدا نشد: ${filePath}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ خطا در خواندن فایل: ${filePath}`, error.message);
    return null;
  }
}

// ✅ ایجاد جدول در PostgreSQL
async function createTable(client) {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS wordproject_verses (
      id SERIAL PRIMARY KEY,
      book_number INTEGER NOT NULL,
      book_name_fa VARCHAR(100),
      book_name_en VARCHAR(100),
      testament VARCHAR(10),
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text_fa TEXT NOT NULL,
      audio_url VARCHAR(500),
      source VARCHAR(50) DEFAULT 'wordproject',
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(book_number, chapter, verse)
    );
    
    CREATE INDEX IF NOT EXISTS idx_wordproject_book_chapter 
    ON wordproject_verses(book_number, chapter);
    
    CREATE INDEX IF NOT EXISTS idx_wordproject_testament 
    ON wordproject_verses(testament);
  `;
  
  await client.query(createTableSQL);
  console.log('✅ جدول wordproject_verses ایجاد شد');
}

// ✅ Import اصلی
async function importWordproject() {
  const dotenvPath = path.resolve(__dirname, '../.env');
  console.log('📁 Loading .env from:', dotenvPath);
  require('dotenv').config({ path: dotenvPath });
  
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found in .env file');
    console.log('📝 .env path:', dotenvPath);
    console.log('🔍 Available env vars:', Object.keys(process.env).filter(k => k.includes('DATA')));
    process.exit(1);
  }
  
  console.log('🔗 Database URL found:', dbUrl.substring(0, 50) + '...');
  
  const client = new Client({
    connectionString: dbUrl.replace('?pgbouncer=true', ''),
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
    console.log('🔌 اتصال به PostgreSQL برقرار شد');
    
    // ایجاد جدول
    await createTable(client);
    
    let totalVerses = 0;
    let successCount = 0;
    let errorCount = 0;
    
    // حلقه روی تمام کتاب‌ها
    for (const book of BIBLE_BOOKS) {
      console.log(`\n📖 در حال پردازش: ${book.name_fa} (${book.name_en}) - ${book.chapters} باب`);
      
      // حلقه روی تمام باب‌ها
      for (let chapter = 1; chapter <= book.chapters; chapter++) {
        const html = readChapterHTML(book.number, chapter);
        
        if (!html) {
          console.warn(`  ⚠️ باب ${chapter} پیدا نشد`);
          continue;
        }
        
        const verses = extractVersesFromHTML(html);
        
        if (verses.length === 0) {
          console.warn(`  ⚠️ هیچ آیه‌ای در باب ${chapter} پیدا نشد`);
          continue;
        }
        
        // Insert آیات
        for (const verse of verses) {
          try {
            const audioUrl = `http://audio1.wordfree.net/bibles/app/audio/20/${book.number}/${chapter}.mp3`;
            
            await client.query(
              `INSERT INTO wordproject_verses 
              (book_number, book_name_fa, book_name_en, testament, chapter, verse, text_fa, audio_url)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              ON CONFLICT (book_number, chapter, verse) DO UPDATE 
              SET text_fa = EXCLUDED.text_fa, audio_url = EXCLUDED.audio_url`,
              [book.number, book.name_fa, book.name_en, book.testament, chapter, verse.number, verse.text, audioUrl]
            );
            
            successCount++;
            totalVerses++;
          } catch (error) {
            console.error(`    ❌ خطا در insert آیه ${verse.number}:`, error.message);
            errorCount++;
          }
        }
        
        process.stdout.write(`  ✅ باب ${chapter}: ${verses.length} آیه | کل: ${totalVerses}\r`);
      }
      
      console.log(`\n  ✅ ${book.name_fa} کامل شد!`);
    }
    
    console.log(`\n\n🎉 Import تکمیل شد!`);
    console.log(`📊 آمار:`);
    console.log(`   - تعداد کل آیات: ${totalVerses}`);
    console.log(`   - موفق: ${successCount}`);
    console.log(`   - خطا: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ خطای کلی:', error);
  } finally {
    await client.end();
    console.log('🔌 اتصال به PostgreSQL بسته شد');
  }
}

// ✅ اجرای اسکریپت
if (require.main === module) {
  console.log('🚀 شروع Import از Wordproject...\n');
  importWordproject().catch(console.error);
}

module.exports = { importWordproject };
