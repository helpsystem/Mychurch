// اسکریپت batch processing برای تولید تایمینگ کامل کتاب مقدس
// پردازش 1189 فصل با قابلیت Resume و Progress tracking

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
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);

const BIBLE_AUDIO_DIR = path.join(__dirname, '../../bible_data/audio/TPV');
const OUTPUT_DIR = path.join(__dirname, '../../storage/data/bible_timings');
const LOG_FILE = path.join(__dirname, '../../logs/bible-timing-generation.log');
const STATE_FILE = path.join(__dirname, '../../storage/data/bible_timing_state.json');

// ایجاد دایرکتوری‌ها
[OUTPUT_DIR, path.dirname(LOG_FILE)].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// تابع logging
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(LOG_FILE, logMessage);
}

// تابع ذخیره state
function saveState(state) {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// تابع بارگذاری state
function loadState() {
    if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
    return {
        processedFiles: [],
        failedFiles: [],
        lastProcessedIndex: -1,
        startedAt: new Date().toISOString(),
        totalFiles: 0
    };
}

// تابع جمع‌آوری تمام فایل‌های صوتی
function collectAllAudioFiles() {
    const audioFiles = [];

    function scanDirectory(dir, bookCode = '') {
        const items = fs.readdirSync(dir);

        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // دایرکتوری = کد کتاب (مثلاً GEN, MAT)
                scanDirectory(fullPath, item);
            } else if (stat.isFile() && item.endsWith('.mp3')) {
                // فایل = فصل (مثلاً 1.mp3)
                const chapter = parseInt(path.basename(item, '.mp3'));
                if (!isNaN(chapter)) {
                    audioFiles.push({
                        bookCode,
                        chapter,
                        filepath: fullPath,
                        filename: item
                    });
                }
            }
        });
    }

    scanDirectory(BIBLE_AUDIO_DIR);
    return audioFiles;
}

// تابع تولید تایمینگ برای یک فصل
async function generateTimingForChapter(audioFile, index, total) {
    const { bookCode, chapter, filepath } = audioFile;

    log(`[${index + 1}/${total}] شروع پردازش: ${bookCode} ${chapter}`);

    try {
        // 1. دریافت متن فصل از دیتابیس
        const { data: verses, error: versesError } = await supabase
            .from('bible_verses')
            .select('verse_number, text_fa')
            .eq('book', bookCode)
            .eq('chapter', chapter)
            .eq('translation', 'tpv')
            .order('verse_number');

        if (versesError || !verses || verses.length === 0) {
            throw new Error(`متن یافت نشد: ${versesError?.message || 'No verses'}`);
        }

        log(`  ✓ ${verses.length} آیه یافت شد`);

        // 2. خواندن فایل صوتی
        const audioBuffer = fs.readFileSync(filepath);
        const audioBase64 = audioBuffer.toString('base64');

        // 3. ارسال به Gemini برای تولید تایمینگ    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
شما یک سیستم هوشمند برای سنکرونسازی متن و صوت کتاب مقدس هستید.
فایل صوتی فصل ${chapter} از کتاب ${bookCode} (ترجمه فارسی TPV) را دریافت کرده‌اید.

متن آیات:
${verses.map(v => `آیه ${v.verse_number}: ${v.text_fa}`).join('\n')}

لطفاً تایمینگ دقیق (start و end به ثانیه) برای هر آیه را استخراج کنید.

خروجی را به صورت JSON با فرمت زیر برگردانید:
{
  "metadata": {
    "book": "${bookCode}",
    "chapter": ${chapter},
    "translation": "tpv",
    "totalDuration": <مدت کل به ثانیه>,
    "verseCount": ${verses.length},
    "generatedAt": "${new Date().toISOString()}"
  },
  "verses": [
    {
      "verse": 1,
      "text": "متن آیه",
      "start": 0.0,
      "end": 5.2
    },
    ...
  ]
}

فقط JSON خالص برگردانید، بدون توضیح اضافی.`;

        log(`  → ارسال به Gemini API...`);

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

        // استخراج JSON از پاسخ
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('پاسخ Gemini شامل JSON معتبر نیست');
        }

        const timingData = JSON.parse(jsonMatch[0]);

        log(`  ✓ تایمینگ دریافت شد: ${timingData.metadata.totalDuration}s`);

        // 4. ذخیره فایل JSON
        const outputDir = path.join(OUTPUT_DIR, bookCode);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputPath = path.join(outputDir, `${chapter}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(timingData, null, 2));

        log(`  ✓ ذخیره شد: ${outputPath}`);

        // 5. به‌روزرسانی دیتابیس
        const { error: dbError } = await supabase
            .from('bible_audio_timing')
            .upsert({
                book: bookCode,
                chapter: chapter,
                translation: 'tpv',
                audio_url: filepath,
                timing_data: timingData,
                created_at: new Date().toISOString()
            }, {
                onConflict: 'book,chapter,translation'
            });

        if (dbError) {
            log(`  ⚠️ خطا در به‌روزرسانی دیتابیس: ${dbError.message}`);
        } else {
            log(`  ✓ دیتابیس به‌روز شد`);
        }

        return { success: true, timingData };

    } catch (error) {
        log(`  ❌ خطا: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// تابع اصلی batch processing
async function processBibleTimingBatch(options = {}) {
    const {
        startFrom = 0,
        limit = null,
        testMode = false,
        booksFilter = null  // مثلاً ['GEN', 'MAT'] برای پردازش فقط کتاب‌های خاص
    } = options;

    log('🎯 شروع Batch Processing تایمینگ کتاب مقدس');
    log('='.repeat(80));

    // بارگذاری state قبلی
    const state = loadState();

    // جمع‌آوری فایل‌های صوتی
    let audioFiles = collectAllAudioFiles();

    // فیلتر کتاب‌ها در صورت نیاز
    if (booksFilter) {
        audioFiles = audioFiles.filter(f => booksFilter.includes(f.bookCode));
    }

    // حذف فایل‌های پردازش شده قبلی
    if (state.processedFiles.length > 0) {
        audioFiles = audioFiles.filter(f => {
            const key = `${f.bookCode}_${f.chapter}`;
            return !state.processedFiles.includes(key);
        });
        log(`\n📂 Resume از آخرین نقطه: ${state.processedFiles.length} فصل قبلاً پردازش شده`);
    }

    const total = limit ? Math.min(audioFiles.length, limit) : audioFiles.length;
    state.totalFiles = audioFiles.length;

    log(`\n📊 تعداد کل فایل‌ها: ${audioFiles.length}`);
    log(`📊 فایل‌های برای پردازش: ${total}`);

    if (testMode) {
        log(`\n⚠️ حالت TEST: فقط ${total} فصل اول پردازش می‌شود\n`);
    }

    const results = {
        total: total,
        successful: 0,
        failed: 0,
        errors: []
    };

    // پردازش
    for (let i = startFrom; i < total; i++) {
        const audioFile = audioFiles[i];
        const result = await generateTimingForChapter(audioFile, i, total);

        const key = `${audioFile.bookCode}_${audioFile.chapter}`;

        if (result.success) {
            results.successful++;
            state.processedFiles.push(key);
        } else {
            results.failed++;
            state.failedFiles.push({ key, error: result.error });
            results.errors.push({ key, error: result.error });
        }

        state.lastProcessedIndex = i;
        saveState(state);

        // Rate limiting: استراحت بین درخواست‌ها
        if (i < total - 1) {
            log(`  ⏳ استراحت 2 ثانیه...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // گزارش نهایی
    log('\n\n📊 گزارش نهایی Batch Processing');
    log('='.repeat(80));
    log(`✅ موفق: ${results.successful} فصل`);
    log(`❌ ناموفق: ${results.failed} فصل`);
    log(`📈 درصد موفقیت: ${((results.successful / total) * 100).toFixed(1)}%`);

    if (results.errors.length > 0) {
        log(`\n❌ خطاها:`);
        results.errors.forEach(e => {
            log(`   ${e.key}: ${e.error}`);
        });
    }

    // ذخیره گزارش نهایی
    const reportPath = path.join(__dirname, '../storage/data/bible_timing_batch_report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        ...results,
        state,
        completedAt: new Date().toISOString()
    }, null, 2));

    log(`\n💾 گزارش کامل: ${reportPath}`);
    log('='.repeat(80));

    return results;
}

// Parse command line arguments
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {
        testMode: args.includes('--test-mode'),
        limit: null,
        booksFilter: null
    };

    // Parse --limit
    const limitArg = args.find(arg => arg.startsWith('--limit='));
    if (limitArg) {
        options.limit = parseInt(limitArg.split('=')[1]);
    }

    // Parse --books
    const booksArg = args.find(arg => arg.startsWith('--books='));
    if (booksArg) {
        options.booksFilter = booksArg.split('=')[1].split(',');
    }

    // Test mode default limit
    if (options.testMode && !options.limit) {
        options.limit = 5;
    }

    processBibleTimingBatch(options)
        .then(results => {
            console.log('\n✅ Batch processing تکمیل شد');
            process.exit(results.failed > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('\n❌ خطای کلی:', error);
            process.exit(1);
        });
}

module.exports = { processBibleTimingBatch };
