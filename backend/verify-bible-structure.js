const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkStructure() {
  console.log('\n📚 BIBLE DATABASE STRUCTURE REPORT\n');
  console.log('='.repeat(80));

  // 1. TRANSLATIONS
  console.log('\n1️⃣  TRANSLATIONS TABLE:');
  const { data: translations, count: transCount } = await supabase
    .from('bible_translations')
    .select('*', { count: 'exact' })
    .order('id');
  
  console.log(`✅ Total: ${transCount} translations\n`);
  translations.forEach(t => {
    console.log(`   [${t.id}] ${t.code.padEnd(12)} | ${t.name_en.padEnd(35)} | ${t.language} | ${t.name_fa || 'N/A'}`);
  });

  // 2. BOOKS
  console.log('\n2️⃣  BOOKS TABLE:');
  const { data: books, count: booksCount } = await supabase
    .from('bible_books')
    .select('*', { count: 'exact' })
    .order('book_order')
    .limit(10);
  
  console.log(`✅ Total: ${booksCount} books (Expected: 66)\n`);
  console.log('   First 10 books:');
  books.forEach(b => {
    console.log(`   [${String(b.book_order).padStart(2)}] ${b.book_code.padEnd(6)} | ${b.name_en.padEnd(25)} | ${b.name_fa?.padEnd(20) || 'N/A'.padEnd(20)} | ${b.testament} | Ch: ${b.chapter_count}`);
  });

  // 3. CHAPTERS (if exists)
  console.log('\n3️⃣  CHAPTERS TABLE:');
  const { data: chapters, count: chaptersCount } = await supabase
    .from('bible_chapters')
    .select('*', { count: 'exact' })
    .limit(5);
  
  if (chapters && chapters.length > 0) {
    console.log(`✅ Total: ${chaptersCount} chapters\n`);
    console.log('   Sample chapters:');
    chapters.forEach(c => {
      console.log(`   [${c.id}] Book: ${c.book_code}, Chapter: ${c.chapter_number}, Verses: ${c.verse_count || 'N/A'}`);
    });
  } else {
    console.log('❌ No chapters table or empty');
  }

  // 4. VERSES
  console.log('\n4️⃣  VERSES TABLE:');
  const { count: versesCount } = await supabase
    .from('bible_verses')
    .select('*', { count: 'exact', head: true });
  
  console.log(`✅ Total: ${versesCount} verses\n`);

  // Get sample verses with full details
  const { data: sampleVerses } = await supabase
    .from('bible_verses')
    .select('*')
    .limit(3);
  
  if (sampleVerses && sampleVerses.length > 0) {
    console.log('   Sample verses structure:');
    console.log('   Columns:', Object.keys(sampleVerses[0]).join(', '));
    console.log('\n   First verse:');
    console.log('   ' + JSON.stringify(sampleVerses[0], null, 4).split('\n').join('\n   '));
  }

  // 5. VERSE DISTRIBUTION
  console.log('\n5️⃣  VERSE DISTRIBUTION:');
  
  // Get all verses to analyze distribution
  const { data: allVerses } = await supabase
    .from('bible_verses')
    .select('chapter_id, translation_id');
  
  if (allVerses) {
    // Group by translation
    const byTranslation = {};
    allVerses.forEach(v => {
      byTranslation[v.translation_id] = (byTranslation[v.translation_id] || 0) + 1;
    });
    
    console.log('\n   Verses per translation ID:');
    Object.entries(byTranslation).sort((a, b) => a[0] - b[0]).forEach(([transId, count]) => {
      const trans = translations.find(t => t.id == transId);
      const name = trans ? `${trans.code} (${trans.name_en})` : `Unknown ID ${transId}`;
      console.log(`   Translation ${String(transId).padStart(2)}: ${String(count).padStart(6)} verses - ${name}`);
    });

    // Group by chapter
    const byChapter = {};
    allVerses.forEach(v => {
      byChapter[v.chapter_id] = (byChapter[v.chapter_id] || 0) + 1;
    });
    
    const chapterCounts = Object.values(byChapter);
    console.log(`\n   Chapter coverage:`);
    console.log(`   Unique chapters: ${Object.keys(byChapter).length}`);
    console.log(`   Avg verses/chapter: ${(allVerses.length / Object.keys(byChapter).length).toFixed(1)}`);
  }

  // 6. SAMPLE DATA (Genesis 1:1)
  console.log('\n6️⃣  SAMPLE CONTENT (Genesis 1:1):');
  
  // First, find Genesis book
  const { data: genesisBook } = await supabase
    .from('bible_books')
    .select('*')
    .eq('book_code', 'GEN')
    .single();
  
  if (genesisBook) {
    console.log(`   Genesis book ID: ${genesisBook.id}`);
    
    // Find chapter 1
    const { data: chapter1 } = await supabase
      .from('bible_chapters')
      .select('*')
      .eq('book_id', genesisBook.id)
      .eq('chapter_number', 1)
      .single();
    
    if (chapter1) {
      console.log(`   Genesis 1 chapter ID: ${chapter1.id}`);
      
      // Get first verse
      const { data: verse1 } = await supabase
        .from('bible_verses')
        .select('*')
        .eq('chapter_id', chapter1.id)
        .eq('verse_number', 1)
        .limit(3);
      
      if (verse1 && verse1.length > 0) {
        verse1.forEach(v => {
          const trans = translations.find(t => t.id === v.translation_id);
          console.log(`\n   [${trans?.code || v.translation_id}] Genesis 1:1:`);
          console.log(`   EN: ${v.text_en?.substring(0, 70)}${v.text_en?.length > 70 ? '...' : ''}`);
          console.log(`   FA: ${v.text_fa?.substring(0, 70)}${v.text_fa?.length > 70 ? '...' : ''}`);
        });
      } else {
        console.log('   ❌ No verses found');
      }
    } else {
      console.log('   ❌ Genesis chapter 1 not found');
    }
  } else {
    console.log('   ❌ Genesis book not found');
  }

  console.log('\n' + '='.repeat(80));
  
  // SUMMARY
  console.log('\n📋 SUMMARY:');
  console.log(`   ✅ ${transCount} translations`);
  console.log(`   ✅ ${booksCount} books (${booksCount === 66 ? 'COMPLETE' : 'INCOMPLETE'})`);
  console.log(`   ✅ ${versesCount} verses`);
  
  if (versesCount < 20000) {
    console.log(`   ⚠️  Warning: Full Bible should have ~31,000 verses`);
    console.log(`   💡 Current data appears to be partial/sample data`);
  } else {
    console.log(`   ✅ Verse count looks complete!`);
  }
  
  console.log('\n');
}

checkStructure().catch(console.error);
