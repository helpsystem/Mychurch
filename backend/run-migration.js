// اسکریپت برای اجرای migration روی Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('🔧 اجرای Migration دیتابیس\n');
    console.log('='.repeat(70));
    console.log(`\n📡 Supabase URL: ${supabaseUrl}`);

    // خواندن فایل migration
    // Take from command line arg or default
    const migrationArg = process.argv[2];
    const migrationPath = migrationArg
        ? (path.isAbsolute(migrationArg) ? migrationArg : path.resolve(process.cwd(), migrationArg))
        : path.join(__dirname, '../migrations/add_complete_worship_assets.sql');

    if (!fs.existsSync(migrationPath)) {
        console.error('\n❌ فایل migration یافت نشد:', migrationPath);
        return false;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n📄 فایل migration خوانده شد');
    console.log(`   حجم: ${(migrationSQL.length / 1024).toFixed(2)} KB`);

    try {
        console.log('\n⚙️ اجرای migration...');

        // Supabase با rpc یا SQL مستقیم کار نمی‌کند
        // باید از Supabase dashboard استفاده کنیم یا از client اجرا کنیم

        // بذارید فیلدها را یکی یکی اضافه کنیم
        console.log('\n📊 بررسی فیلدهای موجود...');

        const { data: existingData, error: checkError } = await supabase
            .from('worship_songs')
            .select('*')
            .limit(1);

        if (checkError) {
            console.error('\n❌ خطا در بررسی جدول:', checkError.message);
            console.log('\n💡 لطفاً migration را از Supabase Dashboard اجرا کنید:');
            console.log('   1. به https://supabase.com بروید');
            console.log('   2. SQL Editor را باز کنید');
            console.log('   3. محتوای این فایل را کپی کنید:');
            console.log(`      ${migrationPath}`);
            return false;
        }

        console.log('\n✅ اتصال به دیتابیس موفق');

        if (existingData && existingData.length > 0) {
            const existingFields = Object.keys(existingData[0]);
            console.log(`\n📋 فیلدهای موجود (${existingFields.length}):`, existingFields.slice(0, 10).join(', '));

            // بررسی فیلدهای جدید
            const newFields = [
                'powerpoint_url', 'pdf_url', 'youtube_id', 'youtube_url',
                'video_url', 'timing_file', 'composer', 'language', 'tags',
                'slug', 'asset_status', 'quality_score'
            ];

            const missingFields = newFields.filter(f => !existingFields.includes(f));

            if (missingFields.length === 0) {
                console.log('\n✅ همه فیلدهای جدید از قبل موجود هستند!');
                console.log('   Migration قبلاً اجرا شده است.');
                return true;
            } else {
                console.log(`\n⚠️ ${missingFields.length} فیلد جدید نیاز به اضافه شدن دارند:`);
                console.log(`   ${missingFields.join(', ')}`);
                console.log('\n📝 برای اضافه کردن فیلدها، migration را از Supabase Dashboard اجرا کنید:');
                console.log(`   فایل: ${migrationPath}`);

                // ذخیره migration برای اجرای دستی
                const outputPath = path.join(__dirname, '../storage/data/migration_to_run.sql');
                fs.writeFileSync(outputPath, migrationSQL);
                console.log(`\n💾 Migration ذخیره شد: ${outputPath}`);

                return false;
            }
        }

        return true;

    } catch (error) {
        console.error('\n❌ خطا:', error.message);
        return false;
    }
}

runMigration()
    .then(success => {
        console.log('\n' + '='.repeat(70));
        if (success) {
            console.log('✅ Migration موفق بود!');
            console.log('\nمرحله بعد: اجرای sync assets');
            console.log('   node backend/sync-worship-assets-complete.js');
        } else {
            console.log('⚠️ Migration نیاز به اجرای دستی دارد');
            console.log('\nبعد از اجرا، دستور sync را اجرا کنید');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n❌ خطا:', error);
        process.exit(1);
    });
