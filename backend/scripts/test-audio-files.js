// اسکریپت ساده برای تست تولید تایمینگ - یک فصل واحد
// این اسکریپت برای تست اولیه استفاده می‌شود

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
    console.error('❌ Missing required credentials in .env');
    console.log('SUPABASE_URL:', supabaseUrl ? 'set' : 'missing');
    console.log('SUPABASE_SERVICE_KEY:', supabaseKey ? 'set' : 'missing');
    console.log('GEMINI_API_KEY:', geminiApiKey ? 'set' : 'missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);

async function testSingleChapterTiming() {
    console.log('🧪 تست تولید تایمینگ برای یک فصل\n');
    console.log('='.repeat(60));

    // مسیرهای مختلف ممکن برای فایل‌های صوتی
    const possiblePaths = [
        'd:/Windows.old/Users/Sami/Desktop/Iran Church DC/Git/Mychurch/bible_data/audio/TPV',
        'd:/Windows.old/Users/Sami/Desktop/Iran Church DC/Git/Mychurch/bible_data/audio',
        'd:/Windows.old/Users/Sami/Desktop/Iran Church DC/Git/Mychurch/storage/audio/bible'
    ];

    let audioDir = null;
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            console.log(`✅ پیدا شد: ${p}`);
            audioDir = p;
            break;
        } else {
            console.log(`❌ وجود ندارد: ${p}`);
        }
    }

    if (!audioDir) {
        console.error('\n❌ هیچ دایرکتوری صوتی یافت نشد!');
        console.log('\nلطفاً مسیر درست فایل‌های صوتی را مشخص کنید.');
        return;
    }

    // جستجوی اولین فایل MP3
    console.log(`\n📂 جستجو در: ${audioDir}`);

    let testAudioFile = null;
    function findFirstMP3(dir) {
        if (testAudioFile) return;

        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                findFirstMP3(fullPath);
            } else if (item.endsWith('.mp3')) {
                testAudioFile = fullPath;
                return;
            }
        }
    }

    findFirstMP3(audioDir);

    if (!testAudioFile) {
        console.error('\n❌ هیچ فایل MP3 یافت نشد!');
        return;
    }

    console.log(`\n🎵 فایل تست: ${testAudioFile}`);
    console.log(`📊 حجم: ${(fs.statSync(testAudioFile).size / 1024 / 1024).toFixed(2)} MB`);

    // در اینجا فقط اطلاعات را نمایش می‌دهیم
    // نیازی به فرستادن به Gemini نیست در این مرحله

    console.log('\n✅ تست موفق: فایل‌های صوتی قابل دسترسی هستند');
    console.log('\n📍 مسیر فایل‌های صوتی: ' + audioDir);

    return {
        audioDir,
        testFile: testAudioFile,
        status: 'ready'
    };
}

testSingleChapterTiming()
    .then(result => {
        if (result) {
            console.log('\n' + '='.repeat(60));
            console.log('✅ تست تکمیل شد - سیستم آماده است');
            console.log('\nمرحله بعد: بررسی اتصال به دیتابیس Supabase');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ خطا:', error);
        process.exit(1);
    });
