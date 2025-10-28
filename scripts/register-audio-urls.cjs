/**
 * ثبت URL های فایل‌های صوتی WordProject در دیتابیس
 * بدون نیاز به آپلود فایل‌ها - مستقیم از سرور WordProject
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dtvdxwfwsbtqfzcftoxw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dmR4d2Z3c2J0cWZ6Y2Z0b3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzOTAzMjksImV4cCI6MjA1MDk2NjMyOX0.MhQQh0e4rl1E5qZVr5g-23hSfCKfVPfGcfGxw1sLxFg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// نقشه شماره کتاب به ISO code و تعداد فصول
const BIBLE_BOOKS = [
  { book_num: 1, iso: 'GEN', chapters: 50 },
  { book_num: 2, iso: 'EXO', chapters: 40 },
  { book_num: 3, iso: 'LEV', chapters: 27 },
  { book_num: 4, iso: 'NUM', chapters: 36 },
  { book_num: 5, iso: 'DEU', chapters: 34 },
  { book_num: 6, iso: 'JOS', chapters: 24 },
  { book_num: 7, iso: 'JDG', chapters: 21 },
  { book_num: 8, iso: 'RUT', chapters: 4 },
  { book_num: 9, iso: '1SA', chapters: 31 },
  { book_num: 10, iso: '2SA', chapters: 24 },
  { book_num: 11, iso: '1KI', chapters: 22 },
  { book_num: 12, iso: '2KI', chapters: 25 },
  { book_num: 13, iso: '1CH', chapters: 29 },
  { book_num: 14, iso: '2CH', chapters: 36 },
  { book_num: 15, iso: 'EZR', chapters: 10 },
  { book_num: 16, iso: 'NEH', chapters: 13 },
  { book_num: 17, iso: 'EST', chapters: 10 },
  { book_num: 18, iso: 'JOB', chapters: 42 },
  { book_num: 19, iso: 'PSA', chapters: 150 },
  { book_num: 20, iso: 'PRO', chapters: 31 },
  { book_num: 21, iso: 'ECC', chapters: 12 },
  { book_num: 22, iso: 'SNG', chapters: 8 },
  { book_num: 23, iso: 'ISA', chapters: 66 },
  { book_num: 24, iso: 'JER', chapters: 52 },
  { book_num: 25, iso: 'LAM', chapters: 5 },
  { book_num: 26, iso: 'EZK', chapters: 48 },
  { book_num: 27, iso: 'DAN', chapters: 12 },
  { book_num: 28, iso: 'HOS', chapters: 14 },
  { book_num: 29, iso: 'JOL', chapters: 3 },
  { book_num: 30, iso: 'AMO', chapters: 9 },
  { book_num: 31, iso: 'OBA', chapters: 1 },
  { book_num: 32, iso: 'JON', chapters: 4 },
  { book_num: 33, iso: 'MIC', chapters: 7 },
  { book_num: 34, iso: 'NAM', chapters: 3 },
  { book_num: 35, iso: 'HAB', chapters: 3 },
  { book_num: 36, iso: 'ZEP', chapters: 3 },
  { book_num: 37, iso: 'HAG', chapters: 2 },
  { book_num: 38, iso: 'ZEC', chapters: 14 },
  { book_num: 39, iso: 'MAL', chapters: 4 },
  { book_num: 40, iso: 'MAT', chapters: 28 },
  { book_num: 41, iso: 'MRK', chapters: 16 },
  { book_num: 42, iso: 'LUK', chapters: 24 },
  { book_num: 43, iso: 'JHN', chapters: 21 },
  { book_num: 44, iso: 'ACT', chapters: 28 },
  { book_num: 45, iso: 'ROM', chapters: 16 },
  { book_num: 46, iso: '1CO', chapters: 16 },
  { book_num: 47, iso: '2CO', chapters: 13 },
  { book_num: 48, iso: 'GAL', chapters: 6 },
  { book_num: 49, iso: 'EPH', chapters: 6 },
  { book_num: 50, iso: 'PHP', chapters: 4 },
  { book_num: 51, iso: 'COL', chapters: 4 },
  { book_num: 52, iso: '1TH', chapters: 5 },
  { book_num: 53, iso: '2TH', chapters: 3 },
  { book_num: 54, iso: '1TI', chapters: 6 },
  { book_num: 55, iso: '2TI', chapters: 4 },
  { book_num: 56, iso: 'TIT', chapters: 3 },
  { book_num: 57, iso: 'PHM', chapters: 1 },
  { book_num: 58, iso: 'HEB', chapters: 13 },
  { book_num: 59, iso: 'JAS', chapters: 5 },
  { book_num: 60, iso: '1PE', chapters: 5 },
  { book_num: 61, iso: '2PE', chapters: 3 },
  { book_num: 62, iso: '1JN', chapters: 5 },
  { book_num: 63, iso: '2JN', chapters: 1 },
  { book_num: 64, iso: '3JN', chapters: 1 },
  { book_num: 65, iso: 'JUD', chapters: 1 },
  { book_num: 66, iso: 'REV', chapters: 22 }
];

async function registerAudioUrls() {
  console.log('🎵 ثبت URL های فایل‌های صوتی WordProject...\n');

  let success = 0;
  let errors = 0;

  for (const book of BIBLE_BOOKS) {
    console.log(`\n📖 ${book.iso} - ${book.chapters} فصل`);

    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      try {
        // ساخت URL فایل صوتی
        const audioUrl = `http://audio1.wordfree.net/bibles/app/audio/20/${book.book_num}/${chapter}.mp3`;
        
        // ثبت در دیتابیس (استفاده از insert به جای upsert)
        const { error } = await supabase
          .from('bible_audio_files')
          .insert({
            book_iso: book.iso,
            chapter_number: chapter,
            language: 'fa',
            filename: `${book.book_num}_${chapter}.mp3`,
            filepath: `wordproject/20/${book.book_num}/${chapter}`,
            url: audioUrl,
            file_size: null, // نمی‌دونیم - باید دانلود کنیم
            duration: null
          });

        if (error) {
          console.error(`   ❌ فصل ${chapter}: ${error.message}`);
          errors++;
        } else {
          process.stdout.write(`   ✅ ${chapter}`);
          if (chapter % 10 === 0) process.stdout.write('\n');
          success++;
        }

      } catch (err) {
        console.error(`   ❌ فصل ${chapter}: ${err.message}`);
        errors++;
      }
    }
    console.log(''); // خط جدید
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 خلاصه:`);
  console.log(`   ✅ موفق: ${success} فصل`);
  console.log(`   ❌ خطا: ${errors} فصل`);
  console.log(`   📚 ${BIBLE_BOOKS.length} کتاب`);
  console.log(`${'='.repeat(60)}\n`);
}

// اجرا
registerAudioUrls()
  .then(() => {
    console.log('✨ ثبت URL ها تکمیل شد!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ خطا:', err);
    process.exit(1);
  });
