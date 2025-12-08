#!/usr/bin/env node

/**
 * 📝 Generate SQL Script to Register Bible Audio URLs
 * ساخت اسکریپت SQL برای ثبت تمام URL ها
 */

const fs = require('fs').promises;
const path = require('path');

// نقشه کتاب‌های کتاب مقدس (ISO → نام)
const BOOKS = {
    'GEN': { en: 'Genesis', fa: 'پیدایش', chapters: 50 },
    'EXO': { en: 'Exodus', fa: 'خروج', chapters: 40 },
    'LEV': { en: 'Leviticus', fa: 'لاویان', chapters: 27 },
    'NUM': { en: 'Numbers', fa: 'اعداد', chapters: 36 },
    'DEU': { en: 'Deuteronomy', fa: 'تثنیه', chapters: 34 },
    'JOS': { en: 'Joshua', fa: 'یوشع', chapters: 24 },
    'JDG': { en: 'Judges', fa: 'داوران', chapters: 21 },
    'RUT': { en: 'Ruth', fa: 'روت', chapters: 4 },
    '1SA': { en: '1 Samuel', fa: 'اول سموئیل', chapters: 31 },
    '2SA': { en: '2 Samuel', fa: 'دوم سموئیل', chapters: 24 },
    '1KI': { en: '1 Kings', fa: 'اول پادشاهان', chapters: 22 },
    '2KI': { en: '2 Kings', fa: 'دوم پادشاهان', chapters: 25 },
    '1CH': { en: '1 Chronicles', fa: 'اول تواریخ', chapters: 29 },
    '2CH': { en: '2 Chronicles', fa: 'دوم تواریخ', chapters: 36 },
    'EZR': { en: 'Ezra', fa: 'عزرا', chapters: 10 },
    'NEH': { en: 'Nehemiah', fa: 'نحمیا', chapters: 13 },
    'EST': { en: 'Esther', fa: 'استر', chapters: 10 },
    'JOB': { en: 'Job', fa: 'ایوب', chapters: 42 },
    'PSA': { en: 'Psalms', fa: 'مزامیر', chapters: 150 },
    'PRO': { en: 'Proverbs', fa: 'امثال', chapters: 31 },
    'ECC': { en: 'Ecclesiastes', fa: 'جامعه', chapters: 12 },
    'SNG': { en: 'Song of Songs', fa: 'غزل غزلها', chapters: 8 },
    'ISA': { en: 'Isaiah', fa: 'اشعیا', chapters: 66 },
    'JER': { en: 'Jeremiah', fa: 'ارمیا', chapters: 52 },
    'LAM': { en: 'Lamentations', fa: 'مراثی', chapters: 5 },
    'EZK': { en: 'Ezekiel', fa: 'حزقیال', chapters: 48 },
    'DAN': { en: 'Daniel', fa: 'دانیال', chapters: 12 },
    'HOS': { en: 'Hosea', fa: 'هوشع', chapters: 14 },
    'JOL': { en: 'Joel', fa: 'یوئیل', chapters: 3 },
    'AMO': { en: 'Amos', fa: 'عاموس', chapters: 9 },
    'OBA': { en: 'Obadiah', fa: 'عوبدیا', chapters: 1 },
    'JON': { en: 'Jonah', fa: 'یونس', chapters: 4 },
    'MIC': { en: 'Micah', fa: 'میکاه', chapters: 7 },
    'NAM': { en: 'Nahum', fa: 'ناحوم', chapters: 3 },
    'HAB': { en: 'Habakkuk', fa: 'حبقوق', chapters: 3 },
    'ZEP': { en: 'Zephaniah', fa: 'صفنیا', chapters: 3 },
    'HAG': { en: 'Haggai', fa: 'حجی', chapters: 2 },
    'ZEC': { en: 'Zechariah', fa: 'زکریا', chapters: 14 },
    'MAL': { en: 'Malachi', fa: 'ملاکی', chapters: 4 },
    'MAT': { en: 'Matthew', fa: 'متی', chapters: 28 },
    'MRK': { en: 'Mark', fa: 'مرقس', chapters: 16 },
    'LUK': { en: 'Luke', fa: 'لوقا', chapters: 24 },
    'JHN': { en: 'John', fa: 'یوحنا', chapters: 21 },
    'ACT': { en: 'Acts', fa: 'اعمال', chapters: 28 },
    'ROM': { en: 'Romans', fa: 'رومیان', chapters: 16 },
    '1CO': { en: '1 Corinthians', fa: 'اول قرنتیان', chapters: 16 },
    '2CO': { en: '2 Corinthians', fa: 'دوم قرنتیان', chapters: 13 },
    'GAL': { en: 'Galatians', fa: 'غلاطیان', chapters: 6 },
    'EPH': { en: 'Ephesians', fa: 'افسسیان', chapters: 6 },
    'PHP': { en: 'Philippians', fa: 'فیلیپیان', chapters: 4 },
    'COL': { en: 'Colossians', fa: 'کولسیان', chapters: 4 },
    '1TH': { en: '1 Thessalonians', fa: 'اول تسالونیکیان', chapters: 5 },
    '2TH': { en: '2 Thessalonians', fa: 'دوم تسالونیکیان', chapters: 3 },
    '1TI': { en: '1 Timothy', fa: 'اول تیموتائوس', chapters: 6 },
    '2TI': { en: '2 Timothy', fa: 'دوم تیموتائوس', chapters: 4 },
    'TIT': { en: 'Titus', fa: 'تیطس', chapters: 3 },
    'PHM': { en: 'Philemon', fa: 'فلیمون', chapters: 1 },
    'HEB': { en: 'Hebrews', fa: 'عبرانیان', chapters: 13 },
    'JAS': { en: 'James', fa: 'یعقوب', chapters: 5 },
    '1PE': { en: '1 Peter', fa: 'اول پطرس', chapters: 5 },
    '2PE': { en: '2 Peter', fa: 'دوم پطرس', chapters: 3 },
    '1JN': { en: '1 John', fa: 'اول یوحنا', chapters: 5 },
    '2JN': { en: '2 John', fa: 'دوم یوحنا', chapters: 1 },
    '3JN': { en: '3 John', fa: 'سوم یوحنا', chapters: 1 },
    'JUD': { en: 'Jude', fa: 'یهودا', chapters: 1 },
    'REV': { en: 'Revelation', fa: 'مکاشفه', chapters: 22 }
};

const HIDRIVE_PUBLIC_URL = 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch';

async function generateSQL() {
    console.log('📝 ساخت اسکریپت SQL برای ثبت URL های Bible Audio...\n');

    let sql = `-- ثبت URL های فایل‌های صوتی Bible در جدول bible_audio_timing
-- تاریخ: ${new Date().toISOString()}
-- تعداد رکوردها: (تقریباً 1164 URL)

BEGIN;

-- حذف رکوردهای قبلی (اختیاری)
-- DELETE FROM bible_audio_timing WHERE audio_url LIKE '%hidrive%';

-- ثبت URL ها
INSERT INTO bible_audio_timing (book, chapter, translation, audio_url, timing_data)
VALUES
`;

    const values = [];
    let count = 0;

    for (const [bookIso, bookInfo] of Object.entries(BOOKS)) {
        for (let chapter = 1; chapter <= bookInfo.chapters; chapter++) {
            // فارسی
            const faUrl = `${HIDRIVE_PUBLIC_URL}/bible/audio/${bookIso}_${chapter}_fa.mp3`;
            values.push(`  ('${bookIso}', ${chapter}, 'fa', '${faUrl}', '{}')`);
            count++;

            // انگلیسی  
            const enUrl = `${HIDRIVE_PUBLIC_URL}/bible/audio/${bookIso}_${chapter}_en.mp3`;
            values.push(`  ('${bookIso}', ${chapter}, 'en', '${enUrl}', '{}')`);
            count++;
        }
    }

    sql += values.join(',\n');
    sql += `
ON CONFLICT (book, chapter, translation) 
DO UPDATE SET 
  audio_url = EXCLUDED.audio_url,
  updated_at = CURRENT_TIMESTAMP;

COMMIT;

-- بررسی نهایی
SELECT 
  translation,
  COUNT(*) as total_files
FROM bible_audio_timing
WHERE audio_url IS NOT NULL
GROUP BY translation
ORDER BY translation;

-- نمایش چند نمونه
SELECT book, chapter, translation, audio_url
FROM bible_audio_timing
WHERE audio_url LIKE '%hidrive%'
ORDER BY book, chapter, translation
LIMIT 10;
`;

    const outputPath = path.join(__dirname, 'register-bible-audio-urls.sql');
    await fs.writeFile(outputPath, sql, 'utf8');

    console.log('✅ اسکریپت SQL ساخته شد!');
    console.log(`📁 مسیر: ${outputPath}`);
    console.log(`📊 تعداد URL ها: ${count}`);
    console.log('\n📝 دستورالعمل:');
    console.log('  1. برو به Supabase Dashboard');
    console.log('  2. SQL Editor را باز کن');
    console.log('  3. محتوای فایل را کپی و اجرا کن');
    console.log('\n✅ تمام!\n');
}

generateSQL()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('\n❌ خطا:', err);
        process.exit(1);
    });
