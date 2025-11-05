/**
 * Simple Genesis Import - Direct verses without chapter dependency
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');

require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔗 Connecting to Supabase...');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
 * Import Genesis
 */
async function importGenesis() {
  console.log('\n🚀 Starting Simple Genesis Import...\n');

  // Get translation ID
  const { data: translationData, error: transError } = await supabase
    .from('bible_translations')
    .select('id')
    .eq('code', 'qadim')
    .single();

  if (transError) {
    console.error('❌ Translation error:', transError.message);
    return;
  }

  const translationId = translationData.id;
  console.log(`✅ Translation ID: ${translationId}\n`);

  // Scan Genesis directory
  const files = fs.readdirSync(GENESIS_PATH).filter(f => f.endsWith('.html')).sort((a, b) => {
    return parseInt(a) - parseInt(b);
  });
  
  console.log(`📂 Found ${files.length} chapter files\n`);

  let totalVerses = 0;

  for (const file of files) {
    const chapterNum = parseInt(file.replace('.html', ''));
    const filePath = path.join(GENESIS_PATH, file);

    console.log(`📖 Processing Genesis ${chapterNum}...`);

    // Get chapter_id - directly query existing chapters
    const { data: chapterData, error: chapterError } = await supabase
      .from('bible_chapters')
      .select('id')
      .eq('book_iso', 'GEN')
      .eq('chapter_number', chapterNum)
      .single();

    if (chapterError || !chapterData) {
      console.log(`   ⚠️  Chapter ID not found in bible_chapters (this is expected)`);
      console.log(`   ℹ️  Will insert verses directly with NULL chapter_id`);
      continue;  // Skip for now, we'll handle this differently
    }

    const chapterId = chapterData.id;

    const verses = parseHTMLFile(filePath);
    console.log(`   Found ${verses.length} verses`);

    if (verses.length > 0) {
      // Insert verses one by one to see which one fails
      for (const v of verses.slice(0, 3)) {  // Test with first 3 verses
        const verseToInsert = {
          chapter_id: chapterId,
          verse_number: v.verse_number,
          translation_id: translationId,
          text_fa: v.text
        };

        console.log(`   Inserting verse ${v.verse_number}...`);
        
        const { data, error } = await supabase
          .from('bible_verses')
          .insert(verseToInsert)
          .select();

        if (error) {
          console.error(`   ❌ Error on verse ${v.verse_number}:`, error.message);
          console.log('   Data attempted:', verseToInsert);
        } else {
          console.log(`   ✅ Verse ${v.verse_number} inserted`);
          totalVerses++;
        }
      }
    }

    break; // Test with just first chapter
  }

  console.log(`\n📊 Total verses imported: ${totalVerses}`);
}

importGenesis().catch(error => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
