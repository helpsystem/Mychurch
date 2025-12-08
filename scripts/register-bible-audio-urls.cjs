#!/usr/bin/env node

/**
 * 🎵 Register Bible Audio URLs in Database (FIXED)
 * ثبت URL های فایل‌های صوتی Bible از Hidrive در جدول bible_audio_timing
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.server') });

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

const HIDRIVE_PUBLIC_URL = process.env.HIDRIVE_PUBLIC_URL || 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch';

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

async function registerBibleAudioUrls() {
    console.log('🎵 ثبت URL های فایل‌های صوتی Bible در جدول bible_audio_timing\n');
    console.log('='.repeat(70));

    // بررسی اتصال به Supabase
    console.log('\n🔌 تست اتصال Supabase...');
    const { data: testData, error: testError } = await supabase
        .from('bible_verses')
        .select('id')
        .limit(1);

    if (testError) {
        console.error('❌ خطا در اتصال:', testError.message);
        return;
    }
    console.log('✅ اتصال موفق!\n');

    // بررسی وجود جدول bible_audio_timing
    console.log('📋 بررسی جدول bible_audio_timing...');
    const { data: tableCheck, error: tableError } = await supabase
        .from('bible_audio_timing')
        .select('id')
        .limit(1);

    if (tableError) {
        console.error('❌ جدول bible_audio_timing موجود نیست!');
        console.error('   لطفاً ابتدا migration را اجرا کنید:');
        console.error('   backend/migrations/complete_audio_sync_schema.sql');
        return;
    }
    console.log('✅ جدول موجود است\n');

    let totalInserted = 0;
    let totalErrors = 0;

    console.log('📤 شروع ثبت URL ها...\n');

    // ثبت URL ها برای هر کتاب و فصل
    for (const [bookIso, bookInfo] of Object.entries(BOOKS)) {
        console.log(`📖 ${bookInfo.fa} (${bookIso})...`);

        for (let chapter = 1; chapter <= bookInfo.chapters; chapter++) {
            // URL فارسی
            const faUrl = `${HIDRIVE_PUBLIC_URL}/bible/audio/${bookIso}_${chapter}_fa.mp3`;

            try {
                const { data, error } = await supabase
                    .from('bible_audio_timing')
                    .upsert({
                        book: bookIso,
                        chapter: chapter,
                        translation: 'fa',
                        audio_url: faUrl,
                        timing_data: {}, // خالی برای الان
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'book,chapter,translation'
                    })
                    .select();

                if (error) {
                    console.error(`  ❌ خطا در فصل ${chapter} (fa):`, error.message);
                    totalErrors++;
                } else {
                    totalInserted++;
                }
            } catch (err) {
                console.error(`  ❌ خطا در فصل ${chapter} (fa):`, err.message);
                totalErrors++;
            }

            // URL انگلیسی
            const enUrl = `${HIDRIVE_PUBLIC_URL}/bible/audio/${bookIso}_${chapter}_en.mp3`;

            try {
                const { data, error } = await supabase
                    .from('bible_audio_timing')
                    .upsert({
                        book: bookIso,
                        chapter: chapter,
                        translation: 'en',
                        audio_url: enUrl,
                        timing_data: {}, // خالی برای الان
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'book,chapter,translation'
                    })
                    .select();

                if (error) {
                    console.error(`  ❌ خطا در فصل ${chapter} (en):`, error.message);
                    totalErrors++;
                } else {
                    totalInserted++;
                }
            } catch (err) {
                console.error(`  ❌ خطا در فصل ${chapter} (en):`, err.message);
                totalErrors++;
            }
        }

        console.log(`  ✅ ${bookInfo.chapters} فصل ثبت شد`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n📊 خلاصه:\n');
    console.log(`  ✅ موفق: ${totalInserted} رکورد`);
    console.log(`  ❌ خطا: ${totalErrors} رکورد`);
    console.log('\n' + '='.repeat(70));

    // آمار نهایی از دیتابیس
    const { data: stats, error: statsError } = await supabase
        .from('bible_audio_timing')
        .select('translation');

    if (stats && !statsError) {
        const faCount = stats.filter(s => s.translation === 'fa').length;
        const enCount = stats.filter(s => s.translation === 'en').length;

        console.log('\n📈 آمار دیتابیس:');
        console.log(`  🇮🇷 فارسی: ${faCount} فایل`);
        console.log(`  🇬🇧 انگلیسی: ${enCount} فایل`);
        console.log(`  📁 کل: ${stats.length} فایل`);
    }

    console.log('\n✅ تمام!\n');
}

registerBibleAudioUrls()
    .then(() => {
        process.exit(0);
    })
    .catch(err => {
        console.error('\n❌ خطا:', err);
        process.exit(1);
    });
