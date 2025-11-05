/**
 * Quick Test Import - Genesis Only
 * تست سریع با فقط کتاب پیدایش
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// Supabase Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔗 Connecting to Supabase...');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Source path - Genesis only (book 01)
const GENESIS_PATH = 'D:\\https___www.wordproject.org_bibles_audio_01_english_index.htm\\www.wordproject.org\\bibles\\fa\\01';

/**
 * Parse HTML file
 */
function parseHTMLFile(filePath) {
  const html = fs.readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html);
  const verses = [];

  $('span.verse').each((i, elem) => {
    const $span = $(elem);
    const verseNum = parseInt($span.attr('id') || $span.text().trim());
    
    if (verseNum > 0) {
      let text = '';
      let $next = $span.next();
      
      while ($next.length > 0) {
        if ($next.is('br')) break;
        if ($next.is('span.verse')) break;
        text += $next.text() + ' ';
        $next = $next.next();
      }
      
      const directText = $span[0].nextSibling;
      if (directText && directText.type === 'text') {
        text = directText.data + ' ' + text;
      }
      
      text = text.replace(/&nbsp;/g, '').trim();
      
      if (text) {
        verses.push({ verse_number: verseNum, text: text });
      }
    }
  });

  return verses;
}

/**
 * Get translation ID
 */
async function getTranslationId() {
  const { data, error } = await supabase
    .from('bible_translations')
    .select('id')
    .eq('code', 'qadim')
    .single();

  if (error) {
    console.error('❌ Error getting translation:', error.message);
    return null;
  }

  return data?.id;
}

/**
 * Import verses for Genesis
 */
async function importGenesis() {
  console.log('\n🚀 Starting Genesis Import Test...\n');

  const translationId = await getTranslationId();
  if (!translationId) {
    console.error('❌ Translation "qadim" not found!');
    return;
  }

  console.log(`✅ Translation ID: ${translationId}`);

  // Get book ID for Genesis
  const { data: bookData, error: bookError } = await supabase
    .from('bible_books')
    .select('id')
    .eq('book_iso', 'GEN')
    .single();

  if (bookError) {
    console.error('❌ Genesis not found:', bookError.message);
    return;
  }

  const bookId = bookData.id;
  console.log(`✅ Genesis Book ID: ${bookId}\n`);

  // Scan Genesis directory
  const files = fs.readdirSync(GENESIS_PATH).filter(f => f.endsWith('.html'));
  console.log(`📂 Found ${files.length} chapter files\n`);

  let totalVerses = 0;

  for (const file of files) {
    const chapterNum = parseInt(file.replace('.html', ''));
    const filePath = path.join(GENESIS_PATH, file);

    console.log(`📖 Processing Genesis ${chapterNum}...`);

    // Get or create chapter_id
    let { data: chapterData, error: chapterError } = await supabase
      .from('bible_chapters')
      .select('id')
      .eq('book_id', bookId)
      .eq('chapter_number', chapterNum)
      .single();

    if (chapterError || !chapterData) {
      // Create chapter if doesn't exist
      const { data: newChapter, error: createError } = await supabase
        .from('bible_chapters')
        .insert({ book_id: bookId, chapter_number: chapterNum, verse_count: 0 })
        .select('id')
        .single();

      if (createError) {
        console.error(`   ❌ Error creating chapter:`, createError.message);
        continue;
      }
      chapterData = newChapter;
    }

    const chapterId = chapterData.id;

    const verses = parseHTMLFile(filePath);
    console.log(`   Found ${verses.length} verses`);

    if (verses.length > 0) {
      const versesToInsert = verses.map(v => ({
        chapter_id: chapterId,
        verse_number: v.verse_number,
        translation_id: translationId,
        text_fa: v.text
      }));

      const { error } = await supabase
        .from('bible_verses')
        .upsert(versesToInsert, {
          onConflict: 'chapter_id,verse_number,translation_id'
        });

      if (error) {
        console.error(`   ❌ Error:`, error.message);
      } else {
        console.log(`   ✅ Imported ${verses.length} verses`);
        totalVerses += verses.length;
      }
    }
  }

  console.log(`\n🎉 Genesis import completed!`);
  console.log(`📊 Total verses imported: ${totalVerses}`);
}

// Run import
importGenesis().catch(error => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
