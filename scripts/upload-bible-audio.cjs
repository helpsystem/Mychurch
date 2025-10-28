// upload-bible-audio.cjs
// آپلود فایل‌های صوتی کتاب مقدس فارسی به Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase config
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dtvdxwfwsbtqfzcftoxw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dmR4d2Z3c2J0cWZ6Y2Z0b3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzOTAzMjksImV4cCI6MjA1MDk2NjMyOX0.MhQQh0e4rl1E5qZVr5g-23hSfCKfVPfGcfGxw1sLxFg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// مسیر فایل‌های صوتی فارسی
const AUDIO_PATH = 'D:/https___www.wordproject.org_bibles_audio_01_english_index.htm/www.wordproject.org/bibles/audio/20_farsi';

// نقشه شماره کتاب به ISO code
const BOOK_MAP = {
  '01': 'GEN', '02': 'EXO', '03': 'LEV', '04': 'NUM', '05': 'DEU',
  '06': 'JOS', '07': 'JDG', '08': 'RUT', '09': '1SA', '10': '2SA',
  '11': '1KI', '12': '2KI', '13': '1CH', '14': '2CH', '15': 'EZR',
  '16': 'NEH', '17': 'EST', '18': 'JOB', '19': 'PSA', '20': 'PRO',
  '21': 'ECC', '22': 'SNG', '23': 'ISA', '24': 'JER', '25': 'LAM',
  '26': 'EZK', '27': 'DAN', '28': 'HOS', '29': 'JOL', '30': 'AMO',
  '31': 'OBA', '32': 'JON', '33': 'MIC', '34': 'NAM', '35': 'HAB',
  '36': 'ZEP', '37': 'HAG', '38': 'ZEC', '39': 'MAL',
  '40': 'MAT', '41': 'MRK', '42': 'LUK', '43': 'JHN', '44': 'ACT',
  '45': 'ROM', '46': '1CO', '47': '2CO', '48': 'GAL', '49': 'EPH',
  '50': 'PHP', '51': 'COL', '52': '1TH', '53': '2TH', '54': '1TI',
  '55': '2TI', '56': 'TIT', '57': 'PHM', '58': 'HEB', '59': 'JAS',
  '60': '1PE', '61': '2PE', '62': '1JN', '63': '2JN', '64': '3JN',
  '65': 'JUD', '66': 'REV'
};

async function uploadAudioFiles() {
  console.log('🎵 شروع آپلود فایل‌های صوتی کتاب مقدس فارسی...\n');

  if (!fs.existsSync(AUDIO_PATH)) {
    console.error(`❌ مسیر فایل‌ها یافت نشد: ${AUDIO_PATH}`);
    return;
  }

  // خواندن تمام فایل‌ها
  const files = fs.readdirSync(AUDIO_PATH).filter(f => f.endsWith('.mp3'));
  console.log(`📁 ${files.length} فایل MP3 پیدا شد\n`);

  let uploaded = 0;
  let errors = 0;

  for (const file of files) {
    try {
      // تجزیه نام فایل - مثال: 01.mp3, 02.mp3, ..., 66.mp3
      const bookNum = file.replace('.mp3', '').padStart(2, '0');
      const bookISO = BOOK_MAP[bookNum];

      if (!bookISO) {
        console.warn(`⚠️  ${file}: شماره کتاب نامعتبر`);
        continue;
      }

      const filePath = path.join(AUDIO_PATH, file);
      const fileBuffer = fs.readFileSync(filePath);
      const fileSize = fs.statSync(filePath).size;

      // آپلود فایل به Supabase Storage
      const storagePath = `bible/audio/farsi/${bookISO}.mp3`;
      
      console.log(`📤 در حال آپلود: ${file} (${bookISO}) - ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

      const { data: storageData, error: storageError } = await supabase.storage
        .from('audio-files')
        .upload(storagePath, fileBuffer, {
          contentType: 'audio/mpeg',
          upsert: true
        });

      if (storageError) {
        console.error(`   ❌ خطا در آپلود: ${storageError.message}`);
        errors++;
        continue;
      }

      // دریافت URL عمومی
      const { data: urlData } = supabase.storage
        .from('audio-files')
        .getPublicUrl(storagePath);

      const publicUrl = urlData.publicUrl;

      // ثبت در دیتابیس
      const { error: dbError } = await supabase
        .from('bible_audio_files')
        .upsert({
          book_iso: bookISO,
          language: 'fa',
          filename: file,
          filepath: storagePath,
          url: publicUrl,
          file_size: fileSize,
          duration: null // می‌تونیم بعداً با library محاسبه کنیم
        }, {
          onConflict: 'book_iso,chapter_number,language'
        });

      if (dbError) {
        console.error(`   ❌ خطا در ثبت دیتابیس: ${dbError.message}`);
        errors++;
      } else {
        console.log(`   ✅ موفق: ${publicUrl}`);
        uploaded++;
      }

    } catch (err) {
      console.error(`❌ خطا در پردازش ${file}:`, err.message);
      errors++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 خلاصه:`);
  console.log(`   ✅ موفق: ${uploaded} فایل`);
  console.log(`   ❌ خطا: ${errors} فایل`);
  console.log(`${'='.repeat(60)}\n`);
}

// اجرا
uploadAudioFiles()
  .then(() => {
    console.log('✨ عملیات تکمیل شد!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ خطای کلی:', err);
    process.exit(1);
  });
