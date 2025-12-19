const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require('fs').promises;
const hidriveStorage = require('../backend/services/hidriveStorage');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

// مسیر فایل‌های صوتی
// مسیر فایل‌های صوتی
const AUDIO_BASE_PATH = path.join(__dirname, '../bible_data/audio');

async function findAllAudioFiles(basePath) {
    console.log('🔍 جستجوی فایل‌های صوتی...\n');

    const audioFiles = [];

    async function searchDir(dir) {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    await searchDir(fullPath);
                } else if (entry.name.toLowerCase().endsWith('.mp3')) {
                    audioFiles.push(fullPath);
                }
            }
        } catch (err) {
            console.warn(`⚠️ نمی‌توان دایرکتوری را خواند: ${dir}`);
        }
    }

    await searchDir(basePath);
    return audioFiles;
}

async function uploadBibleAudio() {
    console.log('🎵 آپلود فایل‌های صوتی Bible به Hidrive\n');
    console.log('='.repeat(70));

    // پیدا کردن تمام فایل‌های MP3
    const audioFiles = await findAllAudioFiles(AUDIO_BASE_PATH);

    console.log(`\n📊 ${audioFiles.length} فایل صوتی پیدا شد\n`);

    if (audioFiles.length === 0) {
        console.log('❌ هیچ فایل صوتی پیدا نشد!');
        return;
    }

    // نمایش چند فایل نمونه
    console.log('📁 نمونه فایل‌ها:');
    audioFiles.slice(0, 10).forEach((file, i) => {
        const filename = path.basename(file);
        const relativePath = file.replace(AUDIO_BASE_PATH, '');
        console.log(`  ${i + 1}. ${filename}`);
        console.log(`     مسیر: ${relativePath}`);
    });

    if (audioFiles.length > 10) {
        console.log(`  ... و ${audioFiles.length - 10} فایل دیگر`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n📤 شروع آپلود به Hidrive...\n');

    let uploaded = 0;
    let failed = 0;
    const results = [];

    for (const [index, filePath] of audioFiles.entries()) {
        const filename = path.basename(filePath);
        const progress = `[${index + 1}/${audioFiles.length}]`;
        try {
            // Use relative path for remote filename to preserve structure
            const relativePath = path.relative(AUDIO_BASE_PATH, filePath);
            // Normalized path for HiDrive (forward slashes)
            const remoteFilename = relativePath.split(path.sep).join('/');

            console.log(`${progress} در حال آپلود: ${remoteFilename}...`);

            // آپلود به Hidrive
            // Note: uploadFile takes (localPath, category, filename)
            // We pass the full relative path as 'filename' so it appends to category base
            const hidriveUrl = await hidriveStorage.uploadFile(
                filePath,
                'bible-audio',
                remoteFilename
            );

            console.log(`  ✅ آپلود موفق: ${hidriveUrl}`);

            results.push({
                filename,
                filePath,
                hidriveUrl,
                success: true
            });

            uploaded++;

        } catch (error) {
            console.error(`  ❌ خطا در آپلود ${filename}:`, error.message);
            results.push({
                filename,
                filePath,
                error: error.message,
                success: false
            });
            failed++;
        }

        // Delay کوتاه برای جلوگیری از overload
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n📊 خلاصه آپلود:\n');
    console.log(`  ✅ موفق: ${uploaded} فایل`);
    console.log(`  ❌ ناموفق: ${failed} فایل`);
    console.log(`  📁 کل: ${audioFiles.length} فایل`);

    // ذخیره گزارش در فایل JSON
    const reportPath = path.join(__dirname, 'bible_audio_upload_report.json');
    await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 گزارش کامل ذخیره شد: ${reportPath}`);

    console.log('\n' + '='.repeat(70));

    return results;
}

// اجرا
uploadBibleAudio()
    .then(() => {
        console.log('\n✅ فرآیند آپلود به پایان رسید!');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n❌ خطای کلی:', err);
        process.exit(1);
    });
