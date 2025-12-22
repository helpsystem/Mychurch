// تست واقعی با یک فصل - استفاده از Gemini Flash رایگان
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env');
    process.exit(1);
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const genAI = new GoogleGenerativeAI(geminiApiKey);

async function testOneChapter() {
    console.log('🧪 تست تولید تایمینگ با Gemini Flash (رایگان)\n');
    console.log('='.repeat(70));

    // پیدا کردن اولین فایل MP3
    const audioDir = 'd:/Windows.old/Users/Sami/Desktop/Iran Church DC/Git/Mychurch/bible_data/audio/TPV';

    let testFile = null;
    let bookCode = null;
    let chapter = null;

    function findFirstMP3(dir, book = '') {
        if (testFile) return;

        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                findFirstMP3(fullPath, item);
            } else if (item.endsWith('.mp3')) {
                testFile = fullPath;
                bookCode = book;
                chapter = parseInt(path.basename(item, '.mp3'));
                return;
            }
        }
    }

    findFirstMP3(audioDir);

    if (!testFile) {
        console.error('❌ فایل MP3 یافت نشد');
        return;
    }

    console.log(`\n📖 کتاب: ${bookCode}`);
    console.log(`📖 فصل: ${chapter}`);
    console.log(`🎵 فایل: ${path.basename(testFile)}`);
    console.log(`📊 حجم: ${(fs.statSync(testFile).size / 1024 / 1024).toFixed(2)} MB`);

    // دریافت متن از دیتابیس (اگر موجود باشد)
    let verses = [];
    if (supabase) {
        console.log('\n📡 دریافت متن از دیتابیس...');
        const { data, error } = await supabase
            .from('bible_verses')
            .select('verse_number, text_fa')
            .eq('book', bookCode)
            .eq('chapter', chapter)
            .eq('translation', 'tpv')
            .order('verse_number');

        if (!error && data && data.length > 0) {
            verses = data;
            console.log(`   ✅ ${verses.length} آیه یافت شد`);
        } else {
            console.log('   ⚠️ متن از دیتابیس یافت نشد - استفاده از متن نمونه');
            // متن نمونه برای تست
            verses = [
                { verse_number: 1, text_fa: 'در ابتدا خدا آسمانها و زمین را آفرید' },
                { verse_number: 2, text_fa: 'و زمین بی‌شکل و خالی بود و تاریکی بر روی دریا بود' }
            ];
        }
    } else {
        console.log('\n⚠️ Supabase در دسترس نیست - استفاده از متن نمونه');
        verses = [
            { verse_number: 1, text_fa: 'در ابتدا خدا آسمانها و زمین را آفرید' },
            { verse_number: 2, text_fa: 'و زمین بی‌شکل و خالی بود' }
        ];
    }

    // خواندن فایل صوتی
    console.log('\n📂 خواندن فایل صوتی...');
    const audioBuffer = fs.readFileSync(testFile);
    const audioBase64 = audioBuffer.toString('base64');
    console.log(`   ✅ فایل خوانده شد: ${(audioBuffer.length / 1024).toFixed(2)} KB`);

    // ارسال به Gemini
    console.log('\n🤖 ارسال به Gemini 1.5 Flash (رایگان)...');

    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash'  // نسخه رایگان
    });

    const prompt = `
تحلیل این فایل صوتی فارسی از کتاب مقدس و تایمینگ هر آیه را استخراج کن.

کتاب: ${bookCode}
فصل: ${chapter}

آیات:
${verses.map(v => `آیه ${v.verse_number}: ${v.text_fa}`).join('\n')}

خروجی را به صورت JSON برگردان:
{
  "metadata": {
    "book": "${bookCode}",
    "chapter": ${chapter},
    "totalDuration": <مدت کل به ثانیه>,
    "verseCount": ${verses.length}
  },
  "verses": [
    {"verse": 1, "text": "متن", "start": 0.0, "end": 5.2},
    ...
  ]
}

فقط JSON برگردان.`;

    try {
        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: 'audio/mp3',
                    data: audioBase64
                }
            },
            { text: prompt }
        ]);

        const response = await result.response;
        const text = response.text();

        console.log('\n✅ پاسخ دریافت شد!');
        console.log('\n' + '='.repeat(70));
        console.log('پاسخ Gemini:');
        console.log(text.substring(0, 500) + '...');
        console.log('='.repeat(70));

        // استخراج JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const timingData = JSON.parse(jsonMatch[0]);

            console.log('\n✅ JSON استخراج شد:');
            console.log(`   • مدت کل: ${timingData.metadata?.totalDuration || 'N/A'} ثانیه`);
            console.log(`   • تعداد آیات: ${timingData.verses?.length || 0}`);

            if (timingData.verses && timingData.verses.length > 0) {
                console.log('\n📊 نمونه آیات:');
                timingData.verses.slice(0, 3).forEach(v => {
                    console.log(`   آیه ${v.verse}: ${v.start}s - ${v.end}s`);
                });
            }

            // ذخیره فایل تست
            const outputPath = path.join(__dirname, `../storage/data/test_timing_${bookCode}_${chapter}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(timingData, null, 2));
            console.log(`\n💾 ذخیره شد: ${outputPath}`);

            console.log('\n✅ تست موفق! سیستم آماده پردازش کامل است.');
            return timingData;
        } else {
            console.error('\n❌ JSON در پاسخ یافت نشد');
            return null;
        }

    } catch (error) {
        console.error('\n❌ خطا در Gemini:', error.message);
        if (error.message.includes('quota')) {
            console.log('\n⚠️ Quota تمام شده - لطفاً API key را بررسی کنید');
        }
        throw error;
    }
}

testOneChapter()
    .then(result => {
        if (result) {
            console.log('\n' + '='.repeat(70));
            console.log('🎉 تست کامل موفق بود!');
            console.log('\nمرحله بعد: اجرای batch processing برای همه فصول');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 خطا:', error);
        process.exit(1);
    });
