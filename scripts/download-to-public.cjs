/**
 * دانلود فایل‌های ZIP صوتی و ذخیره در public/audio
 * نیازی به Supabase Storage نیست - فایل‌ها local سرو می‌شوند
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// مسیرها
const PUBLIC_AUDIO_DIR = path.join(__dirname, '../public/audio/bible');
const TEMP_DIR = path.join(__dirname, '../temp/audio-downloads');

// ایجاد پوشه‌ها
[PUBLIC_AUDIO_DIR, TEMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// نقشه کتاب‌ها
const BIBLE_BOOKS = [
  { book_num: 1, iso: 'GEN', name_fa: 'پیدایش' },
  { book_num: 2, iso: 'EXO', name_fa: 'خروج' },
  { book_num: 3, iso: 'LEV', name_fa: 'لاویان' },
  { book_num: 4, iso: 'NUM', name_fa: 'اعداد' },
  { book_num: 5, iso: 'DEU', name_fa: 'تثنیه' },
  { book_num: 6, iso: 'JOS', name_fa: 'یوشع' },
  { book_num: 7, iso: 'JDG', name_fa: 'داوران' },
  { book_num: 8, iso: 'RUT', name_fa: 'روت' },
  { book_num: 9, iso: '1SA', name_fa: 'اول سموئیل' },
  { book_num: 10, iso: '2SA', name_fa: 'دوم سموئیل' },
  { book_num: 11, iso: '1KI', name_fa: 'اول پادشاهان' },
  { book_num: 12, iso: '2KI', name_fa: 'دوم پادشاهان' },
  { book_num: 13, iso: '1CH', name_fa: 'اول تواریخ' },
  { book_num: 14, iso: '2CH', name_fa: 'دوم تواریخ' },
  { book_num: 15, iso: 'EZR', name_fa: 'عزرا' },
  { book_num: 16, iso: 'NEH', name_fa: 'نحمیا' },
  { book_num: 17, iso: 'EST', name_fa: 'استر' },
  { book_num: 18, iso: 'JOB', name_fa: 'ایوب' },
  { book_num: 19, iso: 'PSA', name_fa: 'مزامیر' },
  { book_num: 20, iso: 'PRO', name_fa: 'امثال' },
  { book_num: 21, iso: 'ECC', name_fa: 'جامعه' },
  { book_num: 22, iso: 'SNG', name_fa: 'غزل غزلها' },
  { book_num: 23, iso: 'ISA', name_fa: 'اشعیا' },
  { book_num: 24, iso: 'JER', name_fa: 'ارمیا' },
  { book_num: 25, iso: 'LAM', name_fa: 'مراثی ارمیا' },
  { book_num: 26, iso: 'EZK', name_fa: 'حزقیال' },
  { book_num: 27, iso: 'DAN', name_fa: 'دانیال' },
  { book_num: 28, iso: 'HOS', name_fa: 'هوشع' },
  { book_num: 29, iso: 'JOL', name_fa: 'یوئیل' },
  { book_num: 30, iso: 'AMO', name_fa: 'عاموس' },
  { book_num: 31, iso: 'OBA', name_fa: 'عوبدیا' },
  { book_num: 32, iso: 'JON', name_fa: 'یونس' },
  { book_num: 33, iso: 'MIC', name_fa: 'میکاه' },
  { book_num: 34, iso: 'NAM', name_fa: 'ناحوم' },
  { book_num: 35, iso: 'HAB', name_fa: 'حبقوق' },
  { book_num: 36, iso: 'ZEP', name_fa: 'صفنیا' },
  { book_num: 37, iso: 'HAG', name_fa: 'حجی' },
  { book_num: 38, iso: 'ZEC', name_fa: 'زکریا' },
  { book_num: 39, iso: 'MAL', name_fa: 'ملاکی' },
  { book_num: 40, iso: 'MAT', name_fa: 'متی' },
  { book_num: 41, iso: 'MRK', name_fa: 'مرقس' },
  { book_num: 42, iso: 'LUK', name_fa: 'لوقا' },
  { book_num: 43, iso: 'JHN', name_fa: 'یوحنا' },
  { book_num: 44, iso: 'ACT', name_fa: 'اعمال' },
  { book_num: 45, iso: 'ROM', name_fa: 'رومیان' },
  { book_num: 46, iso: '1CO', name_fa: 'اول قرنتیان' },
  { book_num: 47, iso: '2CO', name_fa: 'دوم قرنتیان' },
  { book_num: 48, iso: 'GAL', name_fa: 'غلاطیان' },
  { book_num: 49, iso: 'EPH', name_fa: 'افسسیان' },
  { book_num: 50, iso: 'PHP', name_fa: 'فیلیپیان' },
  { book_num: 51, iso: 'COL', name_fa: 'کولسیان' },
  { book_num: 52, iso: '1TH', name_fa: 'اول تسالونیکیان' },
  { book_num: 53, iso: '2TH', name_fa: 'دوم تسالونیکیان' },
  { book_num: 54, iso: '1TI', name_fa: 'اول تیموتائوس' },
  { book_num: 55, iso: '2TI', name_fa: 'دوم تیموتائوس' },
  { book_num: 56, iso: 'TIT', name_fa: 'تیطس' },
  { book_num: 57, iso: 'PHM', name_fa: 'فلیمون' },
  { book_num: 58, iso: 'HEB', name_fa: 'عبرانیان' },
  { book_num: 59, iso: 'JAS', name_fa: 'یعقوب' },
  { book_num: 60, iso: '1PE', name_fa: 'اول پطرس' },
  { book_num: 61, iso: '2PE', name_fa: 'دوم پطرس' },
  { book_num: 62, iso: '1JN', name_fa: 'اول یوحنا' },
  { book_num: 63, iso: '2JN', name_fa: 'دوم یوحنا' },
  { book_num: 64, iso: '3JN', name_fa: 'سوم یوحنا' },
  { book_num: 65, iso: 'JUD', name_fa: 'یهودا' },
  { book_num: 66, iso: 'REV', name_fa: 'مکاشفه' }
];

/**
 * دانلود ZIP
 */
async function downloadZip(url, destPath) {
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream',
    timeout: 120000,
  });

  const writer = fs.createWriteStream(destPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

/**
 * پردازش یک کتاب
 */
async function processBook(book, language) {
  const langCode = language === 'fa' ? '20' : '1';
  const langName = language === 'fa' ? 'farsi' : 'english';
  const baseUrl = language === 'fa' 
    ? 'http://audio1.wordfree.net/bibles/app/audio'
    : 'http://kjv.wordfree.net/bibles/app/audio';
  
  const zipUrl = `${baseUrl}/${langCode}_${book.book_num}.zip`;
  const zipFile = path.join(TEMP_DIR, `${langCode}_${book.book_num}.zip`);
  const extractDir = path.join(TEMP_DIR, `${langCode}_${book.book_num}`);
  const finalDir = path.join(PUBLIC_AUDIO_DIR, langName, book.iso);

  try {
    console.log(`\n📖 ${book.name_fa} (${book.iso})`);

    // 1. دانلود
    console.log(`   📥 دانلود...`);
    await downloadZip(zipUrl, zipFile);
    const zipSize = fs.statSync(zipFile).size;
    console.log(`   ✅ ${(zipSize / 1024 / 1024).toFixed(2)} MB`);

    // 2. استخراج
    console.log(`   📦 استخراج...`);
    const zip = new AdmZip(zipFile);
    zip.extractAllTo(extractDir, true);
    const entries = zip.getEntries();

    // 3. کپی فایل‌ها به public/audio
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }

    let copiedCount = 0;
    for (const entry of entries) {
      if (!entry.entryName.toLowerCase().endsWith('.mp3')) continue;

      const match = entry.entryName.match(/(\d+)\.mp3$/);
      if (!match) continue;
      
      const chapterNum = parseInt(match[1]);
      const sourcePath = path.join(extractDir, entry.entryName);
      const destPath = path.join(finalDir, `${chapterNum}.mp3`);

      fs.copyFileSync(sourcePath, destPath);
      
      // ثبت در دیتابیس
      const fileSize = fs.statSync(destPath).size;
      const localUrl = `/audio/bible/${langName}/${book.iso}/${chapterNum}.mp3`;

      try {
        await pool.query(`
          INSERT INTO bible_audio_files 
            (book_iso, chapter_number, language, filename, filepath, url, file_size)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (book_iso, chapter_number, language) 
          DO UPDATE SET 
            url = EXCLUDED.url,
            file_size = EXCLUDED.file_size,
            updated_at = NOW()
        `, [
          book.iso,
          chapterNum,
          language,
          `${chapterNum}.mp3`,
          `public/audio/bible/${langName}/${book.iso}/${chapterNum}.mp3`,
          localUrl,
          fileSize
        ]);

        copiedCount++;
        process.stdout.write('.');
      } catch (dbErr) {
        console.error(`\n   ❌ DB خطا فصل ${chapterNum}: ${dbErr.message}`);
      }
    }

    console.log(`\n   ✅ ${copiedCount} فایل`);

    // 4. پاک‌سازی
    fs.unlinkSync(zipFile);
    fs.rmSync(extractDir, { recursive: true, force: true });

    return { success: true, files: copiedCount };

  } catch (error) {
    console.error(`   ❌ ${error.message}`);
    
    if (fs.existsSync(zipFile)) fs.unlinkSync(zipFile);
    if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });
    
    return { success: false, error: error.message };
  }
}

/**
 * اجرا
 */
async function main() {
  console.log('🎵 دانلود فایل‌های صوتی به public/audio');
  console.log('=' .repeat(60));

  const args = process.argv.slice(2);
  const languages = args.includes('--all-langs') ? ['fa', 'en'] : ['fa'];
  const bookFilter = args.find(arg => arg.startsWith('--book='));
  
  let booksToProcess = BIBLE_BOOKS;
  if (bookFilter) {
    const bookISO = bookFilter.split('=')[1].toUpperCase();
    booksToProcess = BIBLE_BOOKS.filter(b => b.iso === bookISO);
  }

  if (bookFilter) {
    console.log(`\n📌 فقط: ${booksToProcess[0]?.name_fa}\n`);
  }

  const stats = { total: 0, success: 0, failed: 0, totalFiles: 0 };

  for (const language of languages) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🌐 ${language === 'fa' ? 'فارسی' : 'English'}`);
    console.log('=' .repeat(60));

    for (const book of booksToProcess) {
      stats.total++;
      const result = await processBook(book, language);
      
      if (result.success) {
        stats.success++;
        stats.totalFiles += result.files;
      } else {
        stats.failed++;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 خلاصه:');
  console.log(`   ✅ ${stats.success} کتاب موفق`);
  console.log(`   📄 ${stats.totalFiles} فایل`);
  console.log(`   ❌ ${stats.failed} کتاب ناموفق`);
  console.log('=' .repeat(60));

  await pool.end();
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ خطا:', err);
    process.exit(1);
  });
