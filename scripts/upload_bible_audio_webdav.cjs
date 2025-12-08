const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.server') });

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Hidrive WebDAV config
const HIDRIVE_WEBDAV_URL = 'https://webdav.hidrive.ionos.com';
const HIDRIVE_USER = process.env.HIDRIVE_USER || 'adminchurch';
const HIDRIVE_PASSWORD = process.env.HIDRIVE_PASSWORD;
const HIDRIVE_BASE_PATH = '/users/adminchurch/mychurch/bible/audio';

// مسیر فایل‌های صوتی
const AUDIO_BASE_PATH = 'D:\\Windows.old\\Users\\Sami\\Desktop\\Iran Church DC\\Git\\Mychurch\\Project\\My Web Sites\\Bible\\www.kalameh.com';

async function uploadToHidriveWebDAV(localPath, remoteName) {
    const fileBuffer = await fs.readFile(localPath);
    const remoteUrl = `${HIDRIVE_WEBDAV_URL}${HIDRIVE_BASE_PATH}/${remoteName}`;

    try {
        const response = await axios.put(remoteUrl, fileBuffer, {
            auth: {
                username: HIDRIVE_USER,
                password: HIDRIVE_PASSWORD
            },
            headers: {
                'Content-Type': 'audio/mpeg'
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        return `${process.env.HIDRIVE_PUBLIC_URL}/bible/audio/${remoteName}`;
    } catch (error) {
        throw new Error(`WebDAV upload failed: ${error.message}`);
    }
}

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
    console.log('🎵 آپلود فایل‌های صوتی Bible به Hidrive (WebDAV)\n');
    console.log('='.repeat(70));

    // تست اتصال WebDAV
    console.log('\n🔌 تست اتصال WebDAV...');
    try {
        await axios({
            method: 'PROPFIND',
            url: `${HIDRIVE_WEBDAV_URL}${HIDRIVE_BASE_PATH}`,
            auth: {
                username: HIDRIVE_USER,
                password: HIDRIVE_PASSWORD
            },
            headers: {
                'Depth': '0'
            }
        });
        console.log('✅ اتصال WebDAV موفق!\n');
    } catch (error) {
        if (error.response?.status === 404) {
            console.log('⚠️ پوشه وجود ندارد، ایجاد می‌شود...');
            try {
                await axios({
                    method: 'MKCOL',
                    url: `${HIDRIVE_WEBDAV_URL}${HIDRIVE_BASE_PATH}`,
                    auth: {
                        username: HIDRIVE_USER,
                        password: HIDRIVE_PASSWORD
                    }
                });
                console.log('✅ پوشه ایجاد شد!\n');
            } catch (mkcolError) {
                console.error('❌ خطا در ایجاد پوشه:', mkcolError.message);
                return;
            }
        } else {
            console.error('❌ خطا در اتصال WebDAV:', error.message);
            return;
        }
    }

    // پیدا کردن تمام فایل‌های MP3
    const audioFiles = await findAllAudioFiles(AUDIO_BASE_PATH);

    console.log(`📊 ${audioFiles.length} فایل صوتی پیدا شد\n`);

    if (audioFiles.length === 0) {
        console.log('❌ هیچ فایل صوتی پیدا نشد!');
        return;
    }

    // فیلتر کردن فایل‌های بزرگ‌تر از 100KB
    const validFiles = [];
    for (const file of audioFiles) {
        const stats = await fs.stat(file);
        if (stats.size > 100 * 1024) { // بزرگتر از 100KB
            validFiles.push(file);
        }
    }

    console.log(`📁 ${validFiles.length} فایل معتبر (>100KB)\n`);

    console.log('📤 شروع آپلود...\n');
    console.log('⏰ این ممکنه چند دقیقه طول بکشه...\n');

    let uploaded = 0;
    let failed = 0;
    const results = [];

    for (const [index, filePath] of validFiles.entries()) {
        const filename = path.basename(filePath);
        const progress = `[${index + 1}/${validFiles.length}]`;

        try {
            // Clean filename
            const cleanName = filename.replace(/[^\w\s.-]/g, '_');

            console.log(`${progress} ${filename}...`);

            const hidriveUrl = await uploadToHidriveWebDAV(filePath, cleanName);

            console.log(`  ✅ ${hidriveUrl.substring(0, 80)}...`);

            results.push({
                filename,
                cleanName,
                filePath,
                hidriveUrl,
                success: true
            });

            uploaded++;

            // هر 10 فایل یک خلاصه چاپ کن
            if ((index + 1) % 10 === 0) {
                console.log(`\n📊 پیشرفت: ${uploaded}/${validFiles.length} (${Math.round(uploaded / validFiles.length * 100)}%)\n`);
            }

        } catch (error) {
            console.error(`  ❌ خطا: ${error.message}`);
            results.push({
                filename,
                filePath,
                error: error.message,
                success: false
            });
            failed++;
        }

        // Delay برای جلوگیری از rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n📊 خلاصه آپلود:\n');
    console.log(`  ✅ موفق: ${uploaded} فایل`);
    console.log(`  ❌ ناموفق: ${failed} فایل`);
    console.log(`  📁 کل: ${validFiles.length} فایل`);

    // ذخیره گزارش
    const reportPath = path.join(__dirname, 'bible_audio_upload_report.json');
    await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 گزارش: ${reportPath}`);

    console.log('\n' + '='.repeat(70));

    return results;
}

uploadBibleAudio()
    .then(() => {
        console.log('\n✅ تمام!');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n❌ خطا:', err);
        process.exit(1);
    });
