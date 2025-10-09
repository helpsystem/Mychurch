const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function importToSupabase() {
  try {
    // بررسی متغیرهای محیطی
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log(`
🔑 لطفاً ابتدا متغیرهای محیطی را تنظیم کنید:

Windows PowerShell:
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_SERVICE_KEY="your-service-role-key"

سپس دوباره اجرا کنید:
node scripts/import-to-supabase.js
      `);
      return;
    }

    console.log('🌐 اتصال به Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // ساخت جداول
    console.log('📋 ساخت جداول...');
    
    const createTables = `
      -- حذف جداول موجود
      DROP TABLE IF EXISTS public.verses;
      DROP TABLE IF EXISTS public.chapters;
      
      -- ساخت جدول chapters
      CREATE TABLE public.chapters (
        id BIGINT PRIMARY KEY,
        book_id INTEGER NOT NULL,
        chapter_number INTEGER NOT NULL,
        audio_local TEXT,
        audio_online_fa TEXT,
        audio_online_en TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      -- ساخت جدول verses
      CREATE TABLE public.verses (
        id BIGINT PRIMARY KEY,
        chapter_id BIGINT NOT NULL,
        verse_number INTEGER NOT NULL,
        text_fa TEXT,
        text_en TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (chapter_id) REFERENCES public.chapters(id)
      );
      
      -- ایندکس‌ها برای بهبود عملکرد
      CREATE INDEX idx_chapters_book_id ON public.chapters(book_id);
      CREATE INDEX idx_verses_chapter_id ON public.verses(chapter_id);
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTables 
    });
    
    if (createError) {
      console.log('⚠️ خطا در ساخت جداول:', createError.message);
      console.log('💡 احتمالاً جداول از قبل موجود هستند، ادامه می‌دهیم...');
    } else {
      console.log('✅ جداول ساخته شدند');
    }
    
    // خواندن فایل SQL
    console.log('📖 خواندن داده‌های کتاب مقدس...');
    const sqlPath = path.join(__dirname, '../scripts/db/all_bibles_final.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // استخراج INSERT ها
    const insertPattern = /INSERT INTO (chapters|verses) VALUES \([^;]+\);/g;
    const insertStatements = sqlContent.match(insertPattern) || [];
    
    console.log(`📊 پیدا شد: ${insertStatements.length} INSERT statement`);
    
    // وارد کردن به دسته‌های کوچک
    const batchSize = 50;
    let successCount = 0;
    
    for (let i = 0; i < insertStatements.length; i += batchSize) {
      const batch = insertStatements.slice(i, i + batchSize);
      const batchSQL = batch.join('\n');
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: batchSQL });
        if (error) throw error;
        
        successCount += batch.length;
        console.log(`📈 پیشرفت: ${successCount}/${insertStatements.length} (${Math.round(successCount/insertStatements.length*100)}%)`);
        
      } catch (err) {
        console.log(`⚠️ خطا در batch ${i}: ${err.message.substring(0, 100)}...`);
      }
    }
    
    // تست نهایی
    console.log('🔍 تست داده‌های وارد شده...');
    
    const { data: chaptersCount, error: chaptersError } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true });
      
    const { data: versesCount, error: versesError } = await supabase
      .from('verses')
      .select('*', { count: 'exact', head: true });
    
    if (!chaptersError && !versesError) {
      console.log(`✅ موفق! آمار:`);
      console.log(`   📚 فصل‌ها: ${chaptersCount?.length || 0}`);
      console.log(`   📖 آیات: ${versesCount?.length || 0}`);
    }
    
    // به‌روزرسانی .env
    console.log('📝 به‌روزرسانی تنظیمات backend...');
    const envPath = path.join(__dirname, '../backend/.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // جایگزین کردن DATABASE_URL
    const newDatabaseUrl = `postgresql://postgres:[password]@db.${supabaseUrl.split('.')[0].split('//')[1]}.supabase.co:5432/postgres`;
    
    envContent = envContent.replace(
      /DATABASE_URL=.*/g,
      `DATABASE_URL=${newDatabaseUrl}`
    );
    
    // اضافه کردن تنظیمات Supabase اگر وجود ندارد
    if (!envContent.includes('SUPABASE_URL')) {
      envContent += `\n# Supabase Configuration\nSUPABASE_URL=${supabaseUrl}\nSUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY || 'your-anon-key'}\nSUPABASE_SERVICE_KEY=${supabaseKey}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ فایل .env به‌روزرسانی شد');
    
    console.log(`
🎉 راه‌اندازی کامل شد!

🔗 لینک‌های مفید:
- Supabase Dashboard: ${supabaseUrl}
- Table Editor: ${supabaseUrl}/project/default/editor

📋 مراحل بعدی:
1. Backend را restart کنید
2. تست کنید: http://localhost:3001/api/bible/books
3. Frontend را متصل کنید
    `);
    
  } catch (error) {
    console.error('❌ خطا:', error.message);
  }
}

// اجرا
importToSupabase();