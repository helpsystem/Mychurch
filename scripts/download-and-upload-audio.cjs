/**
 * دانلود فایل‌های ZIP صوتی از WordProject و استخراج آنها
 * هر کتاب یک فایل ZIP دارد که تمام فصل‌ها در آن هستند
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const AdmZip = require('adm-zip');

// Supabase config
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dtvdxwfwsbtqfzcftoxw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dmR4d2Z3c2J0cWZ6Y2Z0b3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzOTAzMjksImV4cCI6MjA1MDk2NjMyOX0.MhQQh0e4rl1E5qZVr5g-23hSfCKfVPfGcfGxw1sLxFg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// مسیر ذخیره فایل‌های دانلود شده
const DOWNLOAD_DIR = path.join(__dirname, '../public/audio/bible');
const TEMP_DIR = path.join(__dirname, '../temp/audio-downloads');

// ایجاد پوشه‌ها
[DOWNLOAD_DIR, TEMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// نقشه کتاب‌ها به شماره WordProject
const BIBLE_BOOKS = [
  { book_num: 1, iso: 'GEN', name_en: 'Genesis', name_fa: 'پیدایش' },
  { book_num: 2, iso: 'EXO', name_en: 'Exodus', name_fa: 'خروج' },
  { book_num: 3, iso: 'LEV', name_en: 'Leviticus', name_fa: 'لاویان' },
  { book_num: 4, iso: 'NUM', name_en: 'Numbers', name_fa: 'اعداد' },
  { book_num: 5, iso: 'DEU', name_en: 'Deuteronomy', name_fa: 'تثنیه' },
  { book_num: 6, iso: 'JOS', name_en: 'Joshua', name_fa: 'یوشع' },
  { book_num: 7, iso: 'JDG', name_en: 'Judges', name_fa: 'داوران' },
  { book_num: 8, iso: 'RUT', name_en: 'Ruth', name_fa: 'روت' },
  { book_num: 9, iso: '1SA', name_en: '1 Samuel', name_fa: 'اول سموئیل' },
  { book_num: 10, iso: '2SA', name_en: '2 Samuel', name_fa: 'دوم سموئیل' },
  { book_num: 11, iso: '1KI', name_en: '1 Kings', name_fa: 'اول پادشاهان' },
  { book_num: 12, iso: '2KI', name_en: '2 Kings', name_fa: 'دوم پادشاهان' },
  { book_num: 13, iso: '1CH', name_en: '1 Chronicles', name_fa: 'اول تواریخ' },
  { book_num: 14, iso: '2CH', name_en: '2 Chronicles', name_fa: 'دوم تواریخ' },
  { book_num: 15, iso: 'EZR', name_en: 'Ezra', name_fa: 'عزرا' },
  { book_num: 16, iso: 'NEH', name_en: 'Nehemiah', name_fa: 'نحمیا' },
  { book_num: 17, iso: 'EST', name_en: 'Esther', name_fa: 'استر' },
  { book_num: 18, iso: 'JOB', name_en: 'Job', name_fa: 'ایوب' },
  { book_num: 19, iso: 'PSA', name_en: 'Psalms', name_fa: 'مزامیر' },
  { book_num: 20, iso: 'PRO', name_en: 'Proverbs', name_fa: 'امثال' },
  { book_num: 21, iso: 'ECC', name_en: 'Ecclesiastes', name_fa: 'جامعه' },
  { book_num: 22, iso: 'SNG', name_en: 'Song of Solomon', name_fa: 'غزل غزلها' },
  { book_num: 23, iso: 'ISA', name_en: 'Isaiah', name_fa: 'اشعیا' },
  { book_num: 24, iso: 'JER', name_en: 'Jeremiah', name_fa: 'ارمیا' },
  { book_num: 25, iso: 'LAM', name_en: 'Lamentations', name_fa: 'مراثی ارمیا' },
  { book_num: 26, iso: 'EZK', name_en: 'Ezekiel', name_fa: 'حزقیال' },
  { book_num: 27, iso: 'DAN', name_en: 'Daniel', name_fa: 'دانیال' },
  { book_num: 28, iso: 'HOS', name_en: 'Hosea', name_fa: 'هوشع' },
  { book_num: 29, iso: 'JOL', name_en: 'Joel', name_fa: 'یوئیل' },
  { book_num: 30, iso: 'AMO', name_en: 'Amos', name_fa: 'عاموس' },
  { book_num: 31, iso: 'OBA', name_en: 'Obadiah', name_fa: 'عوبدیا' },
  { book_num: 32, iso: 'JON', name_en: 'Jonah', name_fa: 'یونس' },
  { book_num: 33, iso: 'MIC', name_en: 'Micah', name_fa: 'میکاه' },
  { book_num: 34, iso: 'NAM', name_en: 'Nahum', name_fa: 'ناحوم' },
  { book_num: 35, iso: 'HAB', name_en: 'Habakkuk', name_fa: 'حبقوق' },
  { book_num: 36, iso: 'ZEP', name_en: 'Zephaniah', name_fa: 'صفنیا' },
  { book_num: 37, iso: 'HAG', name_en: 'Haggai', name_fa: 'حجی' },
  { book_num: 38, iso: 'ZEC', name_en: 'Zechariah', name_fa: 'زکریا' },
  { book_num: 39, iso: 'MAL', name_en: 'Malachi', name_fa: 'ملاکی' },
  { book_num: 40, iso: 'MAT', name_en: 'Matthew', name_fa: 'متی' },
  { book_num: 41, iso: 'MRK', name_en: 'Mark', name_fa: 'مرقس' },
  { book_num: 42, iso: 'LUK', name_en: 'Luke', name_fa: 'لوقا' },
  { book_num: 43, iso: 'JHN', name_en: 'John', name_fa: 'یوحنا' },
  { book_num: 44, iso: 'ACT', name_en: 'Acts', name_fa: 'اعمال' },
  { book_num: 45, iso: 'ROM', name_en: 'Romans', name_fa: 'رومیان' },
  { book_num: 46, iso: '1CO', name_en: '1 Corinthians', name_fa: 'اول قرنتیان' },
  { book_num: 47, iso: '2CO', name_en: '2 Corinthians', name_fa: 'دوم قرنتیان' },
  { book_num: 48, iso: 'GAL', name_en: 'Galatians', name_fa: 'غلاطیان' },
  { book_num: 49, iso: 'EPH', name_en: 'Ephesians', name_fa: 'افسسیان' },
  { book_num: 50, iso: 'PHP', name_en: 'Philippians', name_fa: 'فیلیپیان' },
  { book_num: 51, iso: 'COL', name_en: 'Colossians', name_fa: 'کولسیان' },
  { book_num: 52, iso: '1TH', name_en: '1 Thessalonians', name_fa: 'اول تسالونیکیان' },
  { book_num: 53, iso: '2TH', name_en: '2 Thessalonians', name_fa: 'دوم تسالونیکیان' },
  { book_num: 54, iso: '1TI', name_en: '1 Timothy', name_fa: 'اول تیموتائوس' },
  { book_num: 55, iso: '2TI', name_en: '2 Timothy', name_fa: 'دوم تیموتائوس' },
  { book_num: 56, iso: 'TIT', name_en: 'Titus', name_fa: 'تیطس' },
  { book_num: 57, iso: 'PHM', name_en: 'Philemon', name_fa: 'فلیمون' },
  { book_num: 58, iso: 'HEB', name_en: 'Hebrews', name_fa: 'عبرانیان' },
  { book_num: 59, iso: 'JAS', name_en: 'James', name_fa: 'یعقوب' },
  { book_num: 60, iso: '1PE', name_en: '1 Peter', name_fa: 'اول پطرس' },
  { book_num: 61, iso: '2PE', name_en: '2 Peter', name_fa: 'دوم پطرس' },
  { book_num: 62, iso: '1JN', name_en: '1 John', name_fa: 'اول یوحنا' },
  { book_num: 63, iso: '2JN', name_en: '2 John', name_fa: 'دوم یوحنا' },
  { book_num: 64, iso: '3JN', name_en: '3 John', name_fa: 'سوم یوحنا' },
  { book_num: 65, iso: 'JUD', name_en: 'Jude', name_fa: 'یهودا' },
  { book_num: 66, iso: 'REV', name_en: 'Revelation', name_fa: 'مکاشفه' }
];

/**
 * دانلود یک فایل ZIP
 */
async function downloadZip(url, destPath) {
  console.log(`   📥 دانلود از: ${url}`);
  
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream',
    timeout: 120000, // 2 دقیقه timeout
  });

  const writer = fs.createWriteStream(destPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

/**
 * استخراج فایل ZIP
 */
function extractZip(zipPath, extractTo) {
  console.log(`   📦 استخراج به: ${extractTo}`);
  
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(extractTo, true);
  
  // لیست فایل‌های استخراج شده
  const entries = zip.getEntries();
  return entries.map(entry => entry.entryName);
}

/**
 * آپلود فایل به Supabase Storage
 */
async function uploadToSupabase(filePath, storagePath, language) {
  const fileBuffer = fs.readFileSync(filePath);
  const fileSize = fs.statSync(filePath).size;

  const { data, error } = await supabase.storage
    .from('audio-files')
    .upload(storagePath, fileBuffer, {
      contentType: 'audio/mpeg',
      upsert: true
    });

  if (error) {
    throw error;
  }

  // دریافت URL عمومی
  const { data: urlData } = supabase.storage
    .from('audio-files')
    .getPublicUrl(storagePath);

  return {
    publicUrl: urlData.publicUrl,
    fileSize: fileSize
  };
}

/**
 * پردازش یک کتاب
 */
async function processBook(book, language) {
  const langCode = language === 'fa' ? '20' : '1'; // 20 = farsi, 1 = english
  const langName = language === 'fa' ? 'farsi' : 'english';
  const baseUrl = language === 'fa' 
    ? 'http://audio1.wordfree.net/bibles/app/audio'
    : 'http://kjv.wordfree.net/bibles/app/audio';
  
  const zipUrl = `${baseUrl}/${langCode}_${book.book_num}.zip`;
  const zipFile = path.join(TEMP_DIR, `${langCode}_${book.book_num}.zip`);
  const extractDir = path.join(TEMP_DIR, `${langCode}_${book.book_num}`);

  try {
    console.log(`\n📖 ${book.name_fa} (${book.iso}) - ${langName.toUpperCase()}`);

    // 1. دانلود ZIP
    await downloadZip(zipUrl, zipFile);
    const zipSize = fs.statSync(zipFile).size;
    console.log(`   ✅ دانلود شد: ${(zipSize / 1024 / 1024).toFixed(2)} MB`);

    // 2. استخراج
    const extractedFiles = extractZip(zipFile, extractDir);
    console.log(`   ✅ ${extractedFiles.length} فایل استخراج شد`);

    // 3. آپلود فایل‌ها به Supabase
    let uploadedCount = 0;
    for (const fileName of extractedFiles) {
      // فقط فایل‌های MP3
      if (!fileName.toLowerCase().endsWith('.mp3')) continue;

      const localFilePath = path.join(extractDir, fileName);
      
      // تشخیص شماره فصل از نام فایل (مثلاً: 1.mp3 → فصل 1)
      const match = fileName.match(/(\d+)\.mp3$/);
      if (!match) continue;
      
      const chapterNum = parseInt(match[1]);
      
      // آپلود به Supabase
      const storagePath = `bible/audio/${langName}/${book.iso}/${chapterNum}.mp3`;
      
      try {
        const { publicUrl, fileSize } = await uploadToSupabase(localFilePath, storagePath, language);
        
        // ثبت در دیتابیس
        const { error: dbError } = await supabase
          .from('bible_audio_files')
          .upsert({
            book_iso: book.iso,
            chapter_number: chapterNum,
            language: language,
            filename: `${chapterNum}.mp3`,
            filepath: storagePath,
            url: publicUrl,
            file_size: fileSize,
            duration: null
          }, {
            onConflict: 'book_iso,chapter_number,language',
            ignoreDuplicates: false
          });

        if (dbError) {
          console.error(`   ❌ خطا در ثبت DB فصل ${chapterNum}: ${dbError.message}`);
        } else {
          uploadedCount++;
          process.stdout.write('.');
        }
      } catch (uploadErr) {
        console.error(`\n   ❌ خطا در آپلود فصل ${chapterNum}: ${uploadErr.message}`);
      }
    }

    console.log(`\n   ✅ ${uploadedCount} فایل آپلود و ثبت شد`);

    // 4. پاک‌سازی
    fs.unlinkSync(zipFile);
    fs.rmSync(extractDir, { recursive: true, force: true });

    return { success: true, uploaded: uploadedCount };

  } catch (error) {
    console.error(`   ❌ خطا: ${error.message}`);
    
    // پاک‌سازی در صورت خطا
    if (fs.existsSync(zipFile)) fs.unlinkSync(zipFile);
    if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });
    
    return { success: false, error: error.message };
  }
}

/**
 * اجرای اصلی
 */
async function main() {
  // بررسی نصب بودن adm-zip
  try {
    require('adm-zip');
  } catch (e) {
    console.error('❌ لطفاً ابتدا adm-zip را نصب کنید:');
    console.error('   npm install adm-zip');
    process.exit(1);
  }

  console.log('🎵 دانلود و آپلود فایل‌های صوتی کتاب مقدس');
  console.log('=' .repeat(60));

  const args = process.argv.slice(2);
  const languages = args.includes('--all') ? ['fa', 'en'] : ['fa'];
  const bookFilter = args.find(arg => arg.startsWith('--book='));
  
  let booksToProcess = BIBLE_BOOKS;
  if (bookFilter) {
    const bookISO = bookFilter.split('=')[1].toUpperCase();
    booksToProcess = BIBLE_BOOKS.filter(b => b.iso === bookISO);
    console.log(`\n📌 فقط کتاب: ${booksToProcess[0]?.name_fa || bookISO}\n`);
  }

  const stats = {
    total: 0,
    success: 0,
    failed: 0
  };

  for (const language of languages) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🌐 زبان: ${language === 'fa' ? 'فارسی' : 'انگلیسی'}`);
    console.log('=' .repeat(60));

    for (const book of booksToProcess) {
      stats.total++;
      const result = await processBook(book, language);
      
      if (result.success) {
        stats.success++;
      } else {
        stats.failed++;
      }

      // کمی استراحت بین درخواست‌ها
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 خلاصه نهایی:');
  console.log(`   ✅ موفق: ${stats.success} کتاب`);
  console.log(`   ❌ ناموفق: ${stats.failed} کتاب`);
  console.log(`   📚 مجموع: ${stats.total} کتاب`);
  console.log('=' .repeat(60));
}

// اجرا
main()
  .then(() => {
    console.log('\n✨ عملیات تکمیل شد!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ خطای کلی:', err);
    process.exit(1);
  });
