const fs = require('fs');
const path = require('path');
const https = require('https');

// ✅ اطلاعات 66 کتاب کتاب مقدس
const BIBLE_BOOKS = [
  { number: 1, name_fa: 'پیدایش', name_en: 'Genesis', chapters: 50 },
  { number: 2, name_fa: 'خروج', name_en: 'Exodus', chapters: 40 },
  { number: 3, name_fa: 'لاویان', name_en: 'Leviticus', chapters: 27 },
  { number: 4, name_fa: 'اعداد', name_en: 'Numbers', chapters: 36 },
  { number: 5, name_fa: 'تَثنیه', name_en: 'Deuteronomy', chapters: 34 },
  { number: 6, name_fa: 'یوشَع', name_en: 'Joshua', chapters: 24 },
  { number: 7, name_fa: 'داوران', name_en: 'Judges', chapters: 21 },
  { number: 8, name_fa: 'روت', name_en: 'Ruth', chapters: 4 },
  { number: 9, name_fa: 'اول سموئیل', name_en: '1 Samuel', chapters: 31 },
  { number: 10, name_fa: 'دوم سموئیل', name_en: '2 Samuel', chapters: 24 },
  { number: 11, name_fa: 'اول پادشاهان', name_en: '1 Kings', chapters: 22 },
  { number: 12, name_fa: 'دوم پادشاهان', name_en: '2 Kings', chapters: 25 },
  { number: 13, name_fa: 'اول تواریخ', name_en: '1 Chronicles', chapters: 29 },
  { number: 14, name_fa: 'دوم تواریخ', name_en: '2 Chronicles', chapters: 36 },
  { number: 15, name_fa: 'عِزرا', name_en: 'Ezra', chapters: 10 },
  { number: 16, name_fa: 'نِحِمیا', name_en: 'Nehemiah', chapters: 13 },
  { number: 17, name_fa: 'اِستر', name_en: 'Esther', chapters: 10 },
  { number: 18, name_fa: 'ایوب', name_en: 'Job', chapters: 42 },
  { number: 19, name_fa: 'مزامیر', name_en: 'Psalms', chapters: 150 },
  { number: 20, name_fa: 'امثال سلیمان', name_en: 'Proverbs', chapters: 31 },
  { number: 21, name_fa: 'جامعه', name_en: 'Ecclesiastes', chapters: 12 },
  { number: 22, name_fa: 'غزل غزلهای سلیمان', name_en: 'Song of Solomon', chapters: 8 },
  { number: 23, name_fa: 'اِشعیا', name_en: 'Isaiah', chapters: 66 },
  { number: 24, name_fa: 'اِرمیا', name_en: 'Jeremiah', chapters: 52 },
  { number: 25, name_fa: 'مراثی اِرمیا', name_en: 'Lamentations', chapters: 5 },
  { number: 26, name_fa: 'حِزقیال', name_en: 'Ezekiel', chapters: 48 },
  { number: 27, name_fa: 'دانیال', name_en: 'Daniel', chapters: 12 },
  { number: 28, name_fa: 'هوشَع', name_en: 'Hosea', chapters: 14 },
  { number: 29, name_fa: 'یوئیل', name_en: 'Joel', chapters: 3 },
  { number: 30, name_fa: 'عاموس', name_en: 'Amos', chapters: 9 },
  { number: 31, name_fa: 'عوبَدیا', name_en: 'Obadiah', chapters: 1 },
  { number: 32, name_fa: 'یونس', name_en: 'Jonah', chapters: 4 },
  { number: 33, name_fa: 'میکاه', name_en: 'Micah', chapters: 7 },
  { number: 34, name_fa: 'ناحوم', name_en: 'Nahum', chapters: 3 },
  { number: 35, name_fa: 'حَبَقوق', name_en: 'Habakkuk', chapters: 3 },
  { number: 36, name_fa: 'صَفَنیا', name_en: 'Zephaniah', chapters: 3 },
  { number: 37, name_fa: 'حَجَّی', name_en: 'Haggai', chapters: 2 },
  { number: 38, name_fa: 'زکریا', name_en: 'Zechariah', chapters: 14 },
  { number: 39, name_fa: 'مَلاکی', name_en: 'Malachi', chapters: 4 },
  { number: 40, name_fa: 'مَتّی', name_en: 'Matthew', chapters: 28 },
  { number: 41, name_fa: 'مَرقُس', name_en: 'Mark', chapters: 16 },
  { number: 42, name_fa: 'لوقا', name_en: 'Luke', chapters: 24 },
  { number: 43, name_fa: 'یوحنا', name_en: 'John', chapters: 21 },
  { number: 44, name_fa: 'اعمال رسولان', name_en: 'Acts', chapters: 28 },
  { number: 45, name_fa: 'رومیان', name_en: 'Romans', chapters: 16 },
  { number: 46, name_fa: 'اول قُرِنتیان', name_en: '1 Corinthians', chapters: 16 },
  { number: 47, name_fa: 'دوم قُرِنتیان', name_en: '2 Corinthians', chapters: 13 },
  { number: 48, name_fa: 'غَلاطیان', name_en: 'Galatians', chapters: 6 },
  { number: 49, name_fa: 'اَفِسُسیان', name_en: 'Ephesians', chapters: 6 },
  { number: 50, name_fa: 'فیلیپیان', name_en: 'Philippians', chapters: 4 },
  { number: 51, name_fa: 'کولُسیان', name_en: 'Colossians', chapters: 4 },
  { number: 52, name_fa: 'اول تَسالونیکیان', name_en: '1 Thessalonians', chapters: 5 },
  { number: 53, name_fa: 'دوم تَسالونیکیان', name_en: '2 Thessalonians', chapters: 3 },
  { number: 54, name_fa: 'اول تیموتائوس', name_en: '1 Timothy', chapters: 6 },
  { number: 55, name_fa: 'دوم تیموتائوس', name_en: '2 Timothy', chapters: 4 },
  { number: 56, name_fa: 'تیطُس', name_en: 'Titus', chapters: 3 },
  { number: 57, name_fa: 'فیلیمون', name_en: 'Philemon', chapters: 1 },
  { number: 58, name_fa: 'عبرانیان', name_en: 'Hebrews', chapters: 13 },
  { number: 59, name_fa: 'یعقوب', name_en: 'James', chapters: 5 },
  { number: 60, name_fa: 'اول پِطرُس', name_en: '1 Peter', chapters: 5 },
  { number: 61, name_fa: 'دوم پِطرُس', name_en: '2 Peter', chapters: 3 },
  { number: 62, name_fa: 'اول یوحنا', name_en: '1 John', chapters: 5 },
  { number: 63, name_fa: 'دوم یوحنا', name_en: '2 John', chapters: 1 },
  { number: 64, name_fa: 'سوم یوحنا', name_en: '3 John', chapters: 1 },
  { number: 65, name_fa: 'یهودا', name_en: 'Jude', chapters: 1 },
  { number: 66, name_fa: 'مکاشفۀ یوحنا', name_en: 'Revelation', chapters: 22 }
];

const DOWNLOAD_DIR = 'C:\\Users\\Sami\\Desktop\\Iran Church DC\\My Web Sites\\wordproject.org\\wordproject.org\\bibles\\fa';
const BASE_URL = 'https://www.wordproject.org/bibles/fa';

// ✅ دانلود یک فایل
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// ✅ تاخیر (برای جلوگیری از rate limiting)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ✅ دانلود اصلی
async function downloadAllChapters() {
  let totalChapters = 0;
  let downloaded = 0;
  let skipped = 0;
  let errors = 0;
  
  // محاسبه تعداد کل باب‌ها
  BIBLE_BOOKS.forEach(book => {
    totalChapters += book.chapters;
  });
  
  console.log(`🚀 شروع دانلود ${totalChapters} باب از کتاب مقدس فارسی...\n`);
  
  for (const book of BIBLE_BOOKS) {
    console.log(`\n📖 ${book.name_fa} (${book.name_en}) - ${book.chapters} باب`);
    
    // ایجاد فولدر کتاب
    const bookFolder = String(book.number).padStart(2, '0');
    const bookDir = path.join(DOWNLOAD_DIR, bookFolder);
    
    if (!fs.existsSync(bookDir)) {
      fs.mkdirSync(bookDir, { recursive: true });
    }
    
    // دانلود هر باب
    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      const filename = `${chapter}.html`;
      const filepath = path.join(bookDir, filename);
      const url = `${BASE_URL}/${bookFolder}/${filename}`;
      
      // چک کنیم فایل وجود داره یا نه
      if (fs.existsSync(filepath)) {
        skipped++;
        process.stdout.write(`  ⏭️ باب ${chapter} قبلاً دانلود شده\r`);
        continue;
      }
      
      try {
        await downloadFile(url, filepath);
        downloaded++;
        process.stdout.write(`  ✅ باب ${chapter}/${book.chapters} - کل: ${downloaded}/${totalChapters}\r`);
        
        // تاخیر 500ms برای جلوگیری از rate limiting
        await delay(500);
      } catch (error) {
        errors++;
        console.log(`\n  ❌ خطا در دانلود باب ${chapter}: ${error.message}`);
      }
    }
    
    console.log(`\n  ✅ ${book.name_fa} کامل شد!`);
  }
  
  console.log(`\n\n🎉 دانلود تکمیل شد!`);
  console.log(`📊 آمار:`);
  console.log(`   - تعداد کل باب‌ها: ${totalChapters}`);
  console.log(`   - دانلود شده: ${downloaded}`);
  console.log(`   - قبلاً موجود بود: ${skipped}`);
  console.log(`   - خطا: ${errors}`);
}

// ✅ اجرا
if (require.main === module) {
  downloadAllChapters().catch(console.error);
}

module.exports = { downloadAllChapters };
