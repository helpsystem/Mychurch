const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.server') });

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateDatabaseWithAudioUrls() {
    console.log('📊 آپدیت database با لینک‌های صوتی\n');
    console.log('='.repeat(70));

    // خواندن گزارش آپلود
    const reportPath = path.join(__dirname, 'bible_audio_upload_report.json');

    try {
        const reportContent = await fs.readFile(reportPath, 'utf-8');
        const uploadResults = JSON.parse(reportContent);

        console.log(`\n📁 ${uploadResults.length} فایل در گزارش\n`);

        // فیلتر فایل‌های موفق
        const successfulUploads = uploadResults.filter(r => r.success);
        console.log(`✅ ${successfulUploads.length} فایل موفق آپلود شده\n`);

        if (successfulUploads.length === 0) {
            console.log('❌ هیچ فایل موفقی برای آپدیت نیست!');
            return;
        }

        console.log('🔍 تطابق فایل‌ها با chapters...\n');

        // نمونه mapping - این باید بر اساس naming pattern واقعی فایل‌ها باشه
        // الان فقط چند نمونه رو می‌سازیم
        const mappings = [];

        for (const upload of successfulUploads) {
            // این فقط نمونه است - باید pattern واقعی رو پیدا کنی
            // مثلاً: "GEN_1.mp3" -> Genesis Chapter 1
            // یا: "Moses 01.mp3" -> ?

            console.log(`  ${upload.filename} -> ${upload.hidriveUrl.substring(0, 80)}...`);

            mappings.push({
                filename: upload.filename,
                url: upload.hidriveUrl,
                // book_iso: ?, // باید از نام فایل استخراج بشه
                // chapter_number: ? // باید از نام فایل استخراج بشه
            });

            // فقط  10 تا اول رو نمایش بده
            if (mappings.length >= 10) {
                console.log('  ...');
                break;
            }
        }

        console.log(`\n⚠️ توجه: فایل‌های صوتی naming pattern خاصی ندارن`);
        console.log(`   برای mapping به chapters باید pattern رو شناسایی کنیم\n`);

        console.log('📝 فایل‌های نمونه:');
        successfulUploads.slice(0, 20).forEach((u, i) => {
            console.log(`  ${i + 1}. ${u.filename}`);
        });

        console.log('\n💡 پیشنهاد:');
        console.log('   1. فایل‌ها بر اساس کتاب/chapter نگذاری شدن');
        console.log('   2. بهتره یه mapping دستی ایجاد کنی');
        console.log('   3. یا از metadata فایل‌ها استفاده کنی');
        console.log('   4. یا اگه فایل‌ها برای بخش خاصی هستن (مثلاً فقط Psalms)');
        console.log('      می‌تونی اونا رو به صورت دسته‌ای به chapters اختصاص بدی\n');

    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error('❌ فایل گزارش پیدا نشد!');
            console.log('   ابتدا باید اسکریپت آپلود رو اجرا کنی.');
        } else {
            console.error('❌ خطا:', error.message);
        }
        return;
    }

    console.log('='.repeat(70));
}

updateDatabaseWithAudioUrls()
    .then(() => {
        console.log('\n✅ تمام!');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n❌ خطا:', err);
        process.exit(1);
    });
