const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkBibleData() {
  console.log('\n📊 BIBLE DATABASE STRUCTURE CHECK\n');
  console.log('=' .repeat(80));

  // 1. Check translations
  console.log('\n1️⃣  TRANSLATIONS:');
  const { data: translations, error: transError } = await supabase
    .from('bible_translations')
    .select('code, name_en, name_fa, language')
    .order('code');
  
  if (transError) {
    console.log('❌ Error:', transError.message);
  } else {
    console.log(`✅ Total: ${translations.length} translations`);
    translations.forEach(t => {
      console.log(`   ${t.code.padEnd(15)} | ${t.name_en.padEnd(30)} | ${t.language} | ${t.name_fa || 'N/A'}`);
    });
  }

  // 2. Check books
  console.log('\n2️⃣  BOOKS:');
  const { count: booksCount, error: booksError } = await supabase
    .from('bible_books')
    .select('*', { count: 'exact', head: true });
  
  if (booksError) {
    console.log('❌ Error:', booksError.message);
  } else {
    console.log(`✅ Total: ${booksCount} books (Expected: 66)`);
  }

  // Check books structure
  const { data: sampleBooks, error: sampleError } = await supabase
    .from('bible_books')
    .select('book_code, name_en, name_fa, testament, chapter_count')
    .limit(5);
  
  if (!sampleError && sampleBooks.length > 0) {
    console.log('\n   Sample books:');
    sampleBooks.forEach(b => {
      console.log(`   ${b.book_code.padEnd(10)} | ${b.name_en.padEnd(25)} | ${b.name_fa?.padEnd(20) || 'N/A'.padEnd(20)} | ${b.testament} | Chapters: ${b.chapter_count}`);
    });
  }

  // 3. Check verses
  console.log('\n3️⃣  VERSES:');
  const { count: versesCount, error: versesError } = await supabase
    .from('bible_verses')
    .select('*', { count: 'exact', head: true });
  
  if (versesError) {
    console.log('❌ Error:', versesError.message);
  } else {
    console.log(`✅ Total: ${versesCount} verses`);
  }

  // Check verse distribution by translation
  console.log('\n   Verses per translation:');
  const { data: versesByTrans, error: vbtError } = await supabase
    .from('bible_verses')
    .select('translation_code');
  
  if (!vbtError) {
    const counts = {};
    versesByTrans.forEach(v => {
      counts[v.translation_code] = (counts[v.translation_code] || 0) + 1;
    });
    Object.entries(counts).sort().forEach(([code, count]) => {
      console.log(`   ${code.padEnd(15)}: ${count.toLocaleString()} verses`);
    });
  }

  // 4. Check sample verses (Genesis 1:1-3)
  console.log('\n4️⃣  SAMPLE VERSES (Genesis 1:1-3):');
  const { data: sampleVerses, error: svError } = await supabase
    .from('bible_verses')
    .select('translation_code, verse_number, text')
    .eq('book_code', 'GEN')
    .eq('chapter_number', 1)
    .in('verse_number', [1, 2, 3])
    .order('translation_code')
    .order('verse_number');
  
  if (svError) {
    console.log('❌ Error:', svError.message);
  } else {
    sampleVerses.forEach(v => {
      const preview = v.text.substring(0, 60) + (v.text.length > 60 ? '...' : '');
      console.log(`   ${v.translation_code.padEnd(10)} ${v.verse_number}: ${preview}`);
    });
  }

  // 5. Check completeness (all books have all translations)
  console.log('\n5️⃣  DATA COMPLETENESS:');
  const { data: bookTrans, error: btError } = await supabase
    .from('bible_verses')
    .select('book_code, translation_code')
    .limit(1000);
  
  if (!btError) {
    const booksByTrans = {};
    bookTrans.forEach(v => {
      if (!booksByTrans[v.translation_code]) booksByTrans[v.translation_code] = new Set();
      booksByTrans[v.translation_code].add(v.book_code);
    });
    
    Object.entries(booksByTrans).forEach(([trans, books]) => {
      console.log(`   ${trans.padEnd(15)}: ${books.size} books`);
    });
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

checkBibleData().catch(console.error);
