const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fullCheck() {
  console.log('\n' + '='.repeat(80));
  console.log('📚 گزارش کامل ساختار دیتابیس کتاب مقدس');
  console.log('='.repeat(80) + '\n');

  // 1. TRANSLATIONS
  const { data: translations, count: transCount } = await supabase
    .from('bible_translations')
    .select('*', { count: 'exact' })
    .order('id');
  
  console.log('1️⃣  ترجمه‌ها (TRANSLATIONS):');
  console.log(`   ✅ تعداد کل: ${transCount} ترجمه\n`);
  translations.forEach(t => {
    console.log(`   [${t.id}] ${t.code.padEnd(15)} | ${t.language} | ${t.name_en.padEnd(35)} | ${t.name_fa || ''}`);
  });

  // 2. BOOKS
  const { data: books, count: booksCount } = await supabase
    .from('bible_books')
    .select('*', { count: 'exact' })
    .order('id');
  
  console.log(`\n2️⃣  کتاب‌ها (BOOKS):`);
  console.log(`   ✅ تعداد کل: ${booksCount} کتاب (انتظار: 66 کتاب)\n`);
  
  if (books && books.length > 0) {
    console.log('   نمونه 10 کتاب اول:');
    books.slice(0, 10).forEach(b => {
      console.log(`   [${String(b.id).padStart(2)}] ${b.code.padEnd(6)} | ${b.name_en.padEnd(25)} | ${(b.name_fa || '').padEnd(20)} | ${b.testament} | ${b.chapters_count} فصل`);
    });
  }

  // 3. CHAPTERS
  const { count: chaptersCount } = await supabase
    .from('bible_chapters')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n3️⃣  فصل‌ها (CHAPTERS):`);
  console.log(`   ✅ تعداد کل: ${chaptersCount} فصل`);
  
  // Sample chapters
  const { data: sampleChapters } = await supabase
    .from('bible_chapters')
    .select('*')
    .limit(5);
  
  if (sampleChapters && sampleChapters.length > 0) {
    console.log('\n   نمونه فصل‌ها:');
    console.log('   Columns:', Object.keys(sampleChapters[0]).join(', '));
    sampleChapters.forEach(c => {
      console.log(`   Chapter ID: ${c.id}, Book ID: ${c.book_id}, Chapter #: ${c.chapter_number}`);
    });
  }

  // 4. VERSES
  const { count: versesCount } = await supabase
    .from('bible_verses')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n4️⃣  آیات (VERSES):`);
  console.log(`   ✅ تعداد کل: ${versesCount} آیه`);
  
  // Sample verse structure
  const { data: sampleVerses } = await supabase
    .from('bible_verses')
    .select('*')
    .limit(2);
  
  if (sampleVerses && sampleVerses.length > 0) {
    console.log('\n   ساختار جدول آیات:');
    console.log('   Columns:', Object.keys(sampleVerses[0]).join(', '));
    console.log('\n   نمونه آیه:');
    console.log(JSON.stringify(sampleVerses[0], null, 2));
  }

  // 5. VERSE DISTRIBUTION
  console.log(`\n5️⃣  توزیع آیات بر اساس ترجمه:`);
  
  const { data: allVerses } = await supabase
    .from('bible_verses')
    .select('translation_id');
  
  if (allVerses) {
    const byTranslation = {};
    allVerses.forEach(v => {
      byTranslation[v.translation_id] = (byTranslation[v.translation_id] || 0) + 1;
    });
    
    console.log('');
    Object.entries(byTranslation).sort((a, b) => a[0] - b[0]).forEach(([transId, count]) => {
      const trans = translations.find(t => t.id == transId);
      if (trans) {
        console.log(`   ${trans.code.padEnd(15)} [ID:${String(transId).padStart(2)}]: ${String(count).padStart(6)} آیه | ${trans.name_en}`);
      } else {
        console.log(`   Unknown [ID:${String(transId).padStart(2)}]: ${String(count).padStart(6)} آیه`);
      }
    });
  }

  // 6. SAMPLE CONTENT
  console.log(`\n6️⃣  نمونه محتوا (پیدایش 1:1):`);
  
  const { data: genesisBook } = await supabase
    .from('bible_books')
    .select('*')
    .eq('code', 'GEN')
    .single();
  
  if (genesisBook) {
    const { data: chapter1 } = await supabase
      .from('bible_chapters')
      .select('*')
      .eq('book_id', genesisBook.id)
      .eq('chapter_number', 1)
      .single();
    
    if (chapter1) {
      const { data: verses } = await supabase
        .from('bible_verses')
        .select('*')
        .eq('chapter_id', chapter1.id)
        .eq('verse_number', 1);
      
      if (verses && verses.length > 0) {
        console.log('');
        verses.forEach(v => {
          const trans = translations.find(t => t.id === v.translation_id);
          console.log(`   [${trans?.code || v.translation_id}]:`);
          if (v.text_fa) console.log(`   فارسی: ${v.text_fa}`);
          if (v.text_en) console.log(`   English: ${v.text_en}`);
          console.log('');
        });
      }
    }
  }

  // 7. DATA COMPLETENESS CHECK
  console.log('7️⃣  بررسی کامل بودن داده‌ها:\n');
  
  const expectedVersesPerTranslation = 31102; // Full Bible verse count
  const minExpectedVerses = expectedVersesPerTranslation * 0.9; // 90% threshold
  
  if (versesCount >= minExpectedVerses * transCount) {
    console.log(`   ✅ داده‌ها کامل به نظر می‌رسند`);
  } else if (versesCount >= 10000) {
    console.log(`   ⚠️  داده‌ها بخشی از کتاب مقدس را شامل می‌شوند`);
  } else {
    console.log(`   ⚠️  فقط داده‌های نمونه موجود هستند`);
  }

  console.log(`\n   تعداد آیات موجود: ${versesCount.toLocaleString()}`);
  console.log(`   تعداد مورد انتظار (برای ${transCount} ترجمه کامل): ${(expectedVersesPerTranslation * transCount).toLocaleString()}`);
  console.log(`   درصد تکمیل: ${((versesCount / (expectedVersesPerTranslation * transCount)) * 100).toFixed(1)}%`);

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 خلاصه:');
  console.log(`   ✅ ${transCount} ترجمه`);
  console.log(`   ✅ ${booksCount} کتاب ${booksCount === 66 ? '(کامل ✓)' : '(ناقص ✗)'}`);
  console.log(`   ✅ ${chaptersCount} فصل`);
  console.log(`   ✅ ${versesCount.toLocaleString()} آیه`);
  
  if (versesCount < 20000) {
    console.log(`\n   ⚠️  توجه: کتاب مقدس کامل باید حدود 31,102 آیه برای هر ترجمه داشته باشد`);
    console.log(`   💡 به نظر می‌رسد فقط داده‌های نمونه یا بخشی از کتاب مقدس موجود است`);
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

fullCheck().catch(console.error);
