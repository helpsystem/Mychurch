/**
 * FINAL IMPORT - Works with existing database schema
 * 
 * Database schema (actual):
 * - bible_verses: (id, chapter_id, verse_number, text_fa, text_en, translation_id, ...)
 * - bible_chapters: (id, book_iso, chapter_number, ...)
 * 
 * Strategy:
 * 1. For each HTML file (chapter)
 * 2. Find bible_chapters.id WHERE book_iso='GEN' AND chapter_number=X
 * 3. Insert verses with that chapter_id
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');

require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔗 Supabase URL:', SUPABASE_URL);
console.log('🔑 Using key:', SUPABASE_KEY ? 'Yes' : 'NO!');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const GENESIS_PATH = 'D:\\https___www.wordproject.org_bibles_audio_01_english_index.htm\\www.wordproject.org\\bibles\\fa\\01';

/**
 * Parse HTML to extract verses
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
 * Main import
 */
async function importGenesis() {
  console.log('\n🚀 Starting FINAL Genesis Import...\n');

  //Get translation
  const { data: translationData, error: transError } = await supabase
    .from('bible_translations')
    .select('id, code, name_fa')
    .eq('code', 'qadim')
    .single();

  if (transError) {
    console.error('❌ Translation error:', transError);
    return;
  }

  const translationId = translationData.id;
  console.log(`✅ Translation: ${translationData.name_fa} (ID: ${translationId})\n`);

  // Get all Genesis chapters from database
  const { data: chapters, error: chaptersError } = await supabase
    .from('bible_chapters')
    .select('id, chapter_number')
    .eq('book_iso', 'GEN')
    .order('chapter_number');

  if (chaptersError) {
    console.error('❌ Chapters error:', chaptersError);
    return;
  }

  console.log(`✅ Found ${chapters.length} Genesis chapters in database\n`);

  // Scan HTML files
  const files = fs.readdirSync(GENESIS_PATH).filter(f => f.endsWith('.html'));
  console.log(`📂 Found ${files.length} HTML files\n`);

  let totalVerses = 0;
  let processedChapters = 0;

  for (const file of files.sort((a, b) => parseInt(a) - parseInt(b))) {
    const chapterNum = parseInt(file.replace('.html', ''));
    const filePath = path.join(GENESIS_PATH, file);

    // Find chapter_id from database
    const chapter = chapters.find(c => c.chapter_number === chapterNum);
    
    if (!chapter) {
      console.log(`⚠️  Genesis ${chapterNum}: No chapter record in database, skipping`);
      continue;
    }

    const chapterId = chapter.id;

    console.log(`📖 Genesis ${chapterNum} (chapter_id: ${chapterId})`);

    // Parse HTML
    const verses = parseHTMLFile(filePath);
    console.log(`   Parsed ${verses.length} verses`);

    if (verses.length === 0) {
      console.log(`   ⚠️  No verses found, skipping`);
      continue;
    }

    // Insert verses
    const versesToInsert = verses.map(v => ({
      chapter_id: chapterId,
      verse_number: v.verse_number,
      translation_id: translationId,
      text_fa: v.text,
      text_en: v.text  // Fallback to Persian for now
    }));

    // Use upsert to handle existing verses
    const { data: insertedData, error: insertError } = await supabase
      .from('bible_verses')
      .upsert(versesToInsert, {
        onConflict: 'chapter_id,verse_number,translation_id',
        ignoreDuplicates: false
      })
      .select();

    if (insertError) {
      console.error(`   ❌ Insert error:`, insertError.message);
      console.log(`   Details:`, insertError);
    } else {
      const insertedCount = insertedData ? insertedData.length : verses.length;
      console.log(`   ✅ Inserted/updated ${insertedCount} verses`);
      totalVerses += insertedCount;
      processedChapters++;
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n🎉 Import Complete!`);
  console.log(`📊 Processed ${processedChapters} chapters`);
  console.log(`📊 Total verses: ${totalVerses}`);
}

// Run
importGenesis().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
