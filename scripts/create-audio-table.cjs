// create-audio-table.cjs
// ساخت جدول bible_audio_files در Supabase
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dtvdxwfwsbtqfzcftoxw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dmR4d2Z3c2J0cWZ6Y2Z0b3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzOTAzMjksImV4cCI6MjA1MDk2NjMyOX0.MhQQh0e4rl1E5qZVr5g-23hSfCKfVPfGcfGxw1sLxFg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createTable() {
  console.log('📊 در حال ساخت جدول bible_audio_files...\n');

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS bible_audio_files (
        id SERIAL PRIMARY KEY,
        book_iso VARCHAR(10) NOT NULL,
        chapter_number INT DEFAULT NULL,
        language VARCHAR(10) NOT NULL DEFAULT 'fa',
        file_url TEXT NOT NULL,
        file_size BIGINT,
        duration FLOAT,
        source VARCHAR(50) DEFAULT 'wordproject',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(book_iso, chapter_number, language)
      );

      CREATE INDEX IF NOT EXISTS idx_bible_audio_book_lang ON bible_audio_files(book_iso, language);
      CREATE INDEX IF NOT EXISTS idx_bible_audio_chapter ON bible_audio_files(book_iso, chapter_number, language);
    `
  });

  if (error) {
    console.error('❌ خطا:', error);
    console.log('\n💡 لطفاً SQL را مستقیماً در Supabase SQL Editor اجرا کنید:');
    console.log('   Dashboard → SQL Editor → New Query');
    return false;
  }

  console.log('✅ جدول با موفقیت ساخته شد!');
  return true;
}

// بررسی وجود جدول
async function checkTable() {
  console.log('🔍 بررسی جدول...\n');

  const { data, error } = await supabase
    .from('bible_audio_files')
    .select('count')
    .limit(1);

  if (error) {
    if (error.message.includes('does not exist')) {
      console.log('⚠️  جدول وجود ندارد. در حال ساخت...\n');
      return false;
    }
    console.error('❌ خطا در بررسی:', error.message);
    return false;
  }

  console.log('✅ جدول وجود دارد!');
  return true;
}

async function main() {
  const exists = await checkTable();
  
  if (!exists) {
    console.log('\n⚠️  از آنجا که API محدودیت دارد، لطفاً SQL زیر را در Supabase اجرا کنید:\n');
    console.log('=' .repeat(70));
    console.log(`
CREATE TABLE IF NOT EXISTS bible_audio_files (
  id SERIAL PRIMARY KEY,
  book_iso VARCHAR(10) NOT NULL,
  chapter_number INT DEFAULT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'fa',
  file_url TEXT NOT NULL,
  file_size BIGINT,
  duration FLOAT,
  source VARCHAR(50) DEFAULT 'wordproject',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(book_iso, chapter_number, language)
);

CREATE INDEX IF NOT EXISTS idx_bible_audio_book_lang ON bible_audio_files(book_iso, language);
CREATE INDEX IF NOT EXISTS idx_bible_audio_chapter ON bible_audio_files(book_iso, chapter_number, language);
    `);
    console.log('=' .repeat(70));
    console.log('\n📍 مراحل:');
    console.log('   1. به Supabase Dashboard بروید');
    console.log('   2. SQL Editor → New Query');
    console.log('   3. SQL بالا را کپی کنید و Run کنید');
    console.log('   4. سپس اسکریپت upload-bible-audio.cjs را اجرا کنید\n');
  } else {
    console.log('\n✅ همه چیز آماده است! می‌توانید فایل‌ها را آپلود کنید:');
    console.log('   node scripts/upload-bible-audio.cjs\n');
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ خطا:', err);
    process.exit(1);
  });
