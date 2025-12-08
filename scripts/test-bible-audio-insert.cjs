#!/usr/bin/env node

/**
 * 🧪 Test Bible Audio Table Insert
 * تست ساده برای insert در جدول
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.server') });

const supabase = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testInsert() {
    console.log('🧪 تست Insert در جدول Bible Audio\n');
    console.log('='.repeat(70));

    // 1. تست اتصال
    console.log('\n🔌 تست اتصال...');
    const { data: connTest } = await supabase.from('bible_verses').select('id').limit(1);
    if (!connTest) {
        console.error('❌ اتصال ناموفق!');
        return;
    }
    console.log('✅ اتصال موفق');

    // 2. لیست جداول
    console.log('\n📋 جداول موجود:');
    const tables = ['bible_audio_timing', 'bible_audio_files', 'bible_chapters'];
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`   ❌ ${table}: ${error.message}`);
        } else {
            console.log(`   ✅ ${table}: موجود ${data && data.length > 0 ? '(با داده)' : '(خالی)'}`);
            if (data && data.length > 0) {
                console.log(`      ستون‌ها: ${Object.keys(data[0]).join(', ')}`);
            }
        }
    }

    // 3. تست insert در bible_audio_timing
    console.log('\n🧪 تست Insert در bible_audio_timing...');

    const testRecord = {
        book: 'TEST',
        chapter: 999,
        translation: 'test',
        timing_data: { test: true }
    };

    console.log('   داده تستی:', JSON.stringify(testRecord, null, 2));

    const { data: insertData, error: insertError } = await supabase
        .from('bible_audio_timing')
        .insert(testRecord)
        .select();

    if (insertError) {
        console.error('   ❌ Insert ناموفق:', insertError.message);
        console.error('   جزئیات:', insertError);
    } else {
        console.log('   ✅ Insert موفق!');
        console.log('   داده ثبت شده:', insertData);

        // حذف رکورد تستی
        await supabase.from('bible_audio_timing').delete().eq('book', 'TEST');
        console.log('   🗑️ رکورد تستی حذف شد');
    }

    console.log('\n' + '='.repeat(70));
}

testInsert()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('\n❌ خطا:', err);
        process.exit(1);
    });
