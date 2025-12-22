// بررسی جامع وضعیت تایمینگ فایل‌های صوتی
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeAudioTimingStatus() {
    console.log('🔍 بررسی جامع وضعیت تایمینگ فایل‌های صوتی\n');
    console.log('='.repeat(80) + '\n');

    const report = {
        worship_songs: {
            total: 0,
            with_timing_file: 0,
            without_timing: 0,
            timing_files_on_disk: 0,
            missing_songs: []
        },
        bible_audio: {
            total_audio_files: 0,
            total_chapters_in_db: 0,
            with_timing: 0,
            without_timing: 0,
            missing_chapters: []
        },
        summary: {}
    };

    // ============================================
    // بخش 1: بررسی سرودهای پرستشی
    // ============================================
    console.log('📖 بخش 1: بررسی سرودهای پرستشی (Worship Songs)');
    console.log('-'.repeat(80));

    // بررسی فایل‌های تایمینگ موجود روی دیسک
    const timingsDir = path.join(__dirname, '../storage/data/timings');

    try {
        if (fs.existsSync(timingsDir)) {
            const files = fs.readdirSync(timingsDir);
            const jsonTimings = files.filter(f => f.match(/^song_\d+_timing\.json$/));
            report.worship_songs.timing_files_on_disk = jsonTimings.length;

            console.log(`✅ فایل‌های تایمینگ موجود روی دیسک: ${jsonTimings.length}`);

            // استخراج شماره‌های سرود
            const songNumbers = jsonTimings.map(f => {
                const match = f.match(/song_(\d+)_timing\.json/);
                return match ? parseInt(match[1]) : null;
            }).filter(n => n !== null).sort((a, b) => a - b);

            console.log(`   • محدوده: song_${songNumbers[0]} تا song_${songNumbers[songNumbers.length - 1]}`);

            // بررسی سرودهای گم‌شده
            const missing = [];
            for (let i = songNumbers[0]; i <= songNumbers[songNumbers.length - 1]; i++) {
                if (!songNumbers.includes(i)) {
                    missing.push(i);
                }
            }

            if (missing.length > 0) {
                console.log(`   ⚠️  سرودهای بدون تایمینگ روی دیسک (${missing.length}): ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}`);
                report.worship_songs.missing_songs = missing;
            } else {
                console.log(`   ✅ همه سرودها در محدوده دارای تایمینگ هستند`);
            }
        } else {
            console.log('   ⚠️  پوشه timings پیدا نشد');
        }
    } catch (error) {
        console.log(`   ❌ خطا در خواندن پوشه: ${error.message}`);
    }

    // بررسی دیتابیس worship_songs
    try {
        const { data: songs, error } = await supabase
            .from('worship_songs')
            .select('id, title, timing_file, audio_url');

        if (error) {
            console.log(`\n   ⚠️  خطا در خواندن worship_songs از دیتابیس: ${error.message}`);
        } else {
            report.worship_songs.total = songs.length;
            report.worship_songs.with_timing_file = songs.filter(s => s.timing_file).length;
            report.worship_songs.without_timing = songs.filter(s => !s.timing_file).length;

            console.log(`\n   📊 وضعیت در دیتابیس:`);
            console.log(`   • تعداد کل سرودها: ${report.worship_songs.total}`);
            console.log(`   • با فیلد timing_file: ${report.worship_songs.with_timing_file}`);
            console.log(`   • بدون timing_file: ${report.worship_songs.without_timing}`);

            if (report.worship_songs.without_timing > 0) {
                const songsWithoutTiming = songs.filter(s => !s.timing_file).slice(0, 5);
                console.log(`\n   ⚠️  نمونه سرودهای بدون تایمینگ:`);
                songsWithoutTiming.forEach(s => {
                    const title = typeof s.title === 'object' ? (s.title.fa || s.title.en || 'No title') : s.title;
                    console.log(`      - ID ${s.id}: ${title}`);
                });
            }
        }
    } catch (error) {
        console.log(`\n   ❌ خطا: ${error.message}`);
    }

    // ============================================
    // بخش 2: بررسی کتاب مقدس
    // ============================================
    console.log('\n\n📖 بخش 2: بررسی فایل‌های صوتی کتاب مقدس');
    console.log('-'.repeat(80));

    // شمارش فایل‌های صوتی روی دیسک
    const bibleAudioDir = path.join(__dirname, '../bible_data/audio/TPV');

    try {
        if (fs.existsSync(bibleAudioDir)) {
            let audioCount = 0;
            const countAudioFiles = (dir) => {
                const files = fs.readdirSync(dir);
                files.forEach(file => {
                    const fullPath = path.join(dir, file);
                    if (fs.statSync(fullPath).isDirectory()) {
                        countAudioFiles(fullPath);
                    } else if (file.endsWith('.mp3')) {
                        audioCount++;
                    }
                });
            };

            countAudioFiles(bibleAudioDir);
            report.bible_audio.total_audio_files = audioCount;
            console.log(`✅ تعداد فایل‌های صوتی موجود: ${audioCount} فایل`);
        } else {
            console.log('   ⚠️  پوشه صوتی کتاب مقدس پیدا نشد');
        }
    } catch (error) {
        console.log(`   ❌ خطا: ${error.message}`);
    }

    // بررسی دیتابیس bible_audio_timing  
    try {
        const { data: timingData, error: timingError } = await supabase
            .from('bible_audio_timing')
            .select('id, book, chapter, translation');

        if (timingError) {
            console.log(`\n   ⚠️  خطا در خواندن bible_audio_timing: ${timingError.message}`);
        } else {
            report.bible_audio.with_timing = timingData ? timingData.length : 0;
            console.log(`\n   📊 وضعیت تایمینگ در دیتابیس:`);
            console.log(`   • تعداد فصول با تایمینگ: ${report.bible_audio.with_timing}`);

            if (timingData && timingData.length > 0) {
                // گروه‌بندی بر اساس کتاب
                const byBook = {};
                timingData.forEach(t => {
                    if (!byBook[t.book]) byBook[t.book] = [];
                    byBook[t.book].push(t.chapter);
                });

                console.log(`   • تعداد کتاب‌های مختلف: ${Object.keys(byBook).length}`);
                console.log(`   • نمونه کتاب‌ها: ${Object.keys(byBook).slice(0, 5).join(', ')}`);
            }
        }
    } catch (error) {
        console.log(`\n   ❌ خطا: ${error.message}`);
    }

    // بررسی bible_chapters
    try {
        const { data: chapters, error: chaptersError } = await supabase
            .from('bible_chapters')
            .select('id, book_iso, chapter_number, audio_url');

        if (chaptersError) {
            console.log(`\n   ⚠️  خطا در خواندن bible_chapters: ${chaptersError.message}`);
        } else {
            report.bible_audio.total_chapters_in_db = chapters ? chapters.length : 0;
            const withAudio = chapters ? chapters.filter(c => c.audio_url).length : 0;

            console.log(`\n   📊 وضعیت فصول در دیتابیس:`);
            console.log(`   • تعداد کل فصول: ${report.bible_audio.total_chapters_in_db}`);
            console.log(`   • فصول با audio_url: ${withAudio}`);
            console.log(`   • فصول بدون audio_url: ${report.bible_audio.total_chapters_in_db - withAudio}`);
        }
    } catch (error) {
        console.log(`\n   ❌ خطا: ${error.message}`);
    }

    // محاسبه تعداد فصول بدون تایمینگ
    report.bible_audio.without_timing = Math.max(
        0,
        report.bible_audio.total_audio_files - report.bible_audio.with_timing
    );

    // ============================================
    // خلاصه نهایی
    // ============================================
    console.log('\n\n📊 خلاصه نهایی');
    console.log('='.repeat(80));

    const worshipComplete = report.worship_songs.timing_files_on_disk;
    const worshipTotal = Math.max(report.worship_songs.total, report.worship_songs.timing_files_on_disk);
    const worshipPercent = worshipTotal > 0 ? ((worshipComplete / worshipTotal) * 100).toFixed(1) : 0;

    const bibleComplete = report.bible_audio.with_timing;
    const bibleTotal = Math.max(report.bible_audio.total_audio_files, report.bible_audio.total_chapters_in_db);
    const biblePercent = bibleTotal > 0 ? ((bibleComplete / bibleTotal) * 100).toFixed(1) : 0;

    console.log(`\n🎵 سرودهای پرستشی:`);
    console.log(`   ✅ کامل: ${worshipComplete} از ${worshipTotal} (${worshipPercent}%)`);
    console.log(`   📂 فایل‌های تایمینگ روی دیسک: ${report.worship_songs.timing_files_on_disk}`);
    if (report.worship_songs.missing_songs.length > 0) {
        console.log(`   ⚠️  سرودهای گم‌شده: ${report.worship_songs.missing_songs.length}`);
    }

    console.log(`\n📖 کتاب مقدس (فارسی TPV):`);
    console.log(`   ✅ فصول با تایمینگ: ${bibleComplete} فصل`);
    console.log(`   📂 فایل‌های صوتی: ${report.bible_audio.total_audio_files} فایل`);
    console.log(`   📊 فصول در دیتابیس: ${report.bible_audio.total_chapters_in_db} فصل`);
    console.log(`   📈 درصد پوشش: ${biblePercent}%`);

    const totalComplete = worshipComplete + bibleComplete;
    const totalFiles = worshipTotal + bibleTotal;
    const totalPercent = totalFiles > 0 ? ((totalComplete / totalFiles) * 100).toFixed(1) : 0;

    console.log(`\n🎯 وضعیت کلی:`);
    console.log(`   • تعداد کل فایل‌ها: ${totalFiles}`);
    console.log(`   • فایل‌های با تایمینگ: ${totalComplete}`);
    console.log(`   • فایل‌های بدون تایمینگ: ${totalFiles - totalComplete}`);
    console.log(`   • درصد تکمیل کلی: ${totalPercent}%`);

    if (totalPercent >= 100) {
        console.log(`\n   🎉 عالی! همه فایل‌های صوتی دارای تایمینگ هستند!`);
    } else if (totalPercent >= 80) {
        console.log(`\n   ✨ خوب! بیشتر فایل‌ها دارای تایمینگ هستند`);
    } else {
        console.log(`\n   ⚠️  هنوز کار زیادی باقی مانده است`);
    }

    console.log('\n' + '='.repeat(80));

    // ذخیره گزارش
    const reportPath = path.join(__dirname, '../storage/data/timing_status_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 گزارش کامل ذخیره شد: ${reportPath}`);

    return report;
}

// اجرای اسکریپت
analyzeAudioTimingStatus()
    .then(() => {
        console.log('\n✅ بررسی با موفقیت تکمیل شد');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ خطا:', error);
        process.exit(1);
    });
