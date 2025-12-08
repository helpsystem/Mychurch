const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.server') });

// Hidrive WebDAV config
const HIDRIVE_WEBDAV_URL = 'https://webdav.hidrive.ionos.com';
const HIDRIVE_USER = process.env.HIDRIVE_USER || 'adminchurch';
const HIDRIVE_PASSWORD = process.env.HIDRIVE_PASSWORD;
const HIDRIVE_BASE_PATH = '/users/adminchurch/mychurch/bible/audio';

// مسیر فایل‌های صوتی
const AUDIO_BASE_PATH = 'D:\\Windows.old\\Users\\Sami\\Desktop\\Iran Church DC\\Git\\Mychurch\\Project\\My Web Sites\\Bible\\www.kalameh.com';

// 🔥 فایل checkpoint برای ذخیره پیشرفت
const CHECKPOINT_FILE = path.join(__dirname, 'upload_checkpoint.json');

async function loadCheckpoint() {
    try {
        const data = await fs.readFile(CHECKPOINT_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return { uploadedFiles: [], lastIndex: -1 };
    }
}

async function saveCheckpoint(checkpoint) {
    await fs.writeFile(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
}

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

async function uploadBibleAudioWithResume() {
    console.log('🎵 آپلود فایل‌های صوتی Bible به Hidrive (با قابلیت Resume)\n');
    console.log('='.repeat(70));

    // بارگذاری checkpoint
    const checkpoint = await loadCheckpoint();
    console.log(`\n📂 Checkpoint بارگذاری شد: ${checkpoint.uploadedFiles.length} فایل قبلاً آپلود شده\n`);

    // تست اتصال WebDAV
    console.log('🔌 تست اتصال WebDAV...');
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
        if (stats.size > 100 * 1024) {
            validFiles.push(file);
        }
    }

    console.log(`📁 ${validFiles.length} فایل معتبر (>100KB)\n`);

    // 🔥 فیلتر کردن فایل‌هایی که قبلاً آپلود شده‌اند
    const uploadedSet = new Set(checkpoint.uploadedFiles);
    const remainingFiles = validFiles.filter(f => !uploadedSet.has(path.basename(f)));

    if (remainingFiles.length === 0) {
        console.log('✅ همه فایل‌ها قبلاً آپلود شده‌اند!\n');
        return checkpoint.uploadedFiles;
    }

    console.log(`🔄 ${remainingFiles.length} فایل باقی‌مانده برای آپلود\n`);
    console.log('📤 شروع آپلود...\n');

    let uploaded = checkpoint.uploadedFiles.length;
    let failed = 0;
    const results = [];

    for (const [index, filePath] of remainingFiles.entries()) {
        const filename = path.basename(filePath);
        const totalIndex = validFiles.indexOf(filePath) + 1;
        const progress = `[${totalIndex}/${validFiles.length}]`;

        try {
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

            // 🔥 ذخیره checkpoint بعد از هر فایل موفق
            checkpoint.uploadedFiles.push(filename);
            checkpoint.lastIndex = totalIndex - 1;
            await saveCheckpoint(checkpoint);

            if (uploaded % 10 === 0) {
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

        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n📊 خلاصه آپلود:\n');
    console.log(`  ✅ موفق: ${uploaded} فایل`);
    console.log(`  ❌ ناموفق: ${failed} فایل`);
    console.log(`  📁 کل: ${validFiles.length} فایل`);

    // ذخیره گزارش نهایی
    const reportPath = path.join(__dirname, 'bible_audio_upload_report_resume.json');
    await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 گزارش: ${reportPath}`);

    // پاک کردن checkpoint بعد از اتمام موفق
    if (failed === 0) {
        await fs.unlink(CHECKPOINT_FILE).catch(() => { });
        console.log('🗑️ Checkpoint پاک شد (آپلود کامل شد)');
    }

    console.log('\n' + '='.repeat(70));

    return results;
}

uploadBibleAudioWithResume()
    .then(() => {
        console.log('\n✅ تمام!');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n❌ خطا:', err);
        process.exit(1);
    });
