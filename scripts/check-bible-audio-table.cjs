#!/usr/bin/env node

/**
 * 🔍 Check Bible Audio Table Schema
 * بررسی ساختار جدول bible_audio_files
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.server') });

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableSchema() {
    console.log('🔍 بررسی ساختار جدول bible_audio_files\n');
    console.log('='.repeat(70));

    try {
        // تلاش برای دریافت یک رکورد نمونه
        const { data, error } = await supabase
            .from('bible_audio_files')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ خطا:', error.message);
            console.log('\n💡 احتمالاً جدول موجود نیست. لطفاً SQL زیر را اجرا کنید:');
            console.log('   scripts/create-bible-audio-table.sql\n');
            return;
        }

        if (data && data.length > 0) {
            console.log('✅ جدول موجود است\n');
            console.log('📋 ستون‌های موجود:');
            Object.keys(data[0]).forEach(col => {
                console.log(`   - ${col}`);
            });
            console.log('\n📊 نمونه داده:');
            console.log(JSON.stringify(data[0], null, 2));
        } else {
            console.log('✅ جدول موجود است اما خالی است\n');

            // تلاش برای insert نمونه
            const testInsert = await supabase
                .from('bible_audio_files')
                .insert({
                    book_iso: 'TEST',
                    chapter_number: 1,
                    language: 'fa',
                    audio_url: 'https://test.com/test.mp3',
                    source: 'test'
                })
                .select();

            if (testInsert.error) {
                console.error('❌ خطا در insert تستی:', testInsert.error.message);
                console.log('\n💡 ساختار جدول:');
                console.log(testInsert.error);
            } else {
                console.log('✅ Insert تستی موفق!');
                console.log('\n📋 ستون‌های قابل استفاده:');
                Object.keys(testInsert.data[0]).forEach(col => {
                    console.log(`   - ${col}`);
                });

                // حذف رکورد تستی
                await supabase
                    .from('bible_audio_files')
                    .delete()
                    .eq('book_iso', 'TEST');

                console.log('\n🗑️ رکورد تستی حذف شد');
            }
        }

        // شمارش کل رکوردها
        const { count } = await supabase
            .from('bible_audio_files')
            .select('*', { count: 'exact', head: true });

        console.log(`\n📈 تعداد کل رکوردها: ${count}`);

    } catch (err) {
        console.error('❌ خطای غیرمنتظره:', err.message);
    }

    console.log('\n' + '='.repeat(70));
}

checkTableSchema()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('\n❌ خطا:', err);
        process.exit(1);
    });
