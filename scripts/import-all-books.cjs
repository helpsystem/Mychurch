/**
 * COMPLETE BIBLE IMPORT - All 66 books
 * ورود کامل کتاب مقدس - تمام 66 کتاب
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');

require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BIBLE_ROOT = 'D:\\https___www.wordproject.org_bibles_audio_01_english_index.htm\\www.wordproject.org\\bibles\\fa';

// Book number to ISO code mapping
const BOOK_MAP = {
  '01': 'GEN', '02': 'EXO', '03': 'LEV', '04': 'NUM', '05': 'DEU',
  '06': 'JOS', '07': 'JDG', '08': 'RUT', '09': '1SA', '10': '2SA',
  '11': '1KI', '12': '2KI', '13': '1CH', '14': '2CH', '15': 'EZR',
  '16': 'NEH', '17': 'EST', '18': 'JOB', '19': 'PSA', '20': 'PRO',
  '21': 'ECC', '22': 'SNG', '23': 'ISA', '24': 'JER', '25': 'LAM',
  '26': 'EZK', '27': 'DAN', '28': 'HOS', '29': 'JOL', '30': 'AMO',
  '31': 'OBA', '32': 'JON', '33': 'MIC', '34': 'NAM', '35': 'HAB',
  '36': 'ZEP', '37': 'HAG', '38': 'ZEC', '39': 'MAL', '40': 'MAT',
  '41': 'MRK', '42': 'LUK', '43': 'JHN', '44': 'ACT', '45': 'ROM',
  '46': '1CO', '47': '2CO', '48': 'GAL', '49': 'EPH', '50': 'PHP',
  '51': 'COL', '52': '1TH', '53': '2TH', '54': '1TI', '55': '2TI',
  '56': 'TIT', '57': 'PHM', '58': 'HEB', '59': 'JAS', '60': '1PE',
  '61': '2PE', '62': '1JN', '63': '2JN', '64': '3JN', '65': 'JUD',
  '66': 'REV', '5': 'DEU'  // Handle '5' as duplicate of '05'
};

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
 * Import one book
 */
async function importBook(bookNum, bookISO, translationId) {
  const bookPath = path.join(BIBLE_ROOT, bookNum);
  
  if (!fs.existsSync(bookPath)) {
    console.log(`⚠️  ${bookISO}: Directory not found`);
    return { chapters: 0, verses: 0 };
  }

  // Get chapters from database
  const { data: chapters, error: chaptersError } = await supabase
    .from('bible_chapters')
    .select('id, chapter_number')
    .eq('book_iso', bookISO)
    .order('chapter_number');

  if (chaptersError || !chapters || chapters.length === 0) {
    console.log(`⚠️  ${bookISO}: No chapters in database`);
    return { chapters: 0, verses: 0 };
  }

  // Scan HTML files
  const files = fs.readdirSync(bookPath).filter(f => f.endsWith('.html'));
  
  let bookVerses = 0;
  let processedChapters = 0;

  for (const file of files.sort((a, b) => parseInt(a) - parseInt(b))) {
    const chapterNum = parseInt(file.replace('.html', ''));
    const filePath = path.join(bookPath, file);

    // Find chapter_id
    const chapter = chapters.find(c => c.chapter_number === chapterNum);
    if (!chapter) continue;

    // Parse verses
    const verses = parseHTMLFile(filePath);
    if (verses.length === 0) continue;

    // Insert verses
    const versesToInsert = verses.map(v => ({
      chapter_id: chapter.id,
      verse_number: v.verse_number,
      translation_id: translationId,
      text_fa: v.text,
      text_en: v.text
    }));

    const { error: insertError } = await supabase
      .from('bible_verses')
      .upsert(versesToInsert, {
        onConflict: 'chapter_id,verse_number,translation_id',
        ignoreDuplicates: false
      });

    if (!insertError) {
      bookVerses += verses.length;
      processedChapters++;
    }

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { chapters: processedChapters, verses: bookVerses };
}

/**
 * Main import
 */
async function importAllBooks() {
  console.log('\n📖 ================================');
  console.log('📖  COMPLETE BIBLE IMPORT');
  console.log('📖  ورود کامل کتاب مقدس');
  console.log('📖 ================================\n');

  // Get translation
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

  // Get all books from database
  const { data: booksInDB, error: booksError } = await supabase
    .from('bible_books')
    .select('book_iso, book_name_fa')
    .order('book_iso');

  if (booksError) {
    console.error('❌ Books error:', booksError);
    return;
  }

  console.log(`✅ Found ${booksInDB.length} books in database\n`);
  console.log('⏳ Starting import...\n');

  let totalBooks = 0;
  let totalChapters = 0;
  let totalVerses = 0;

  for (const [bookNum, bookISO] of Object.entries(BOOK_MAP)) {
    const bookInfo = booksInDB.find(b => b.book_iso === bookISO);
    const bookName = bookInfo ? bookInfo.book_name_fa : bookISO;

    process.stdout.write(`📖 ${bookISO.padEnd(6)} ${bookName.padEnd(20)} ... `);

    const result = await importBook(bookNum, bookISO, translationId);

    if (result.verses > 0) {
      console.log(`✅ ${result.chapters} chapters, ${result.verses} verses`);
      totalBooks++;
      totalChapters += result.chapters;
      totalVerses += result.verses;
    } else {
      console.log(`⚠️  Skipped`);
    }
  }

  console.log('\n📖 ================================');
  console.log('🎉  IMPORT COMPLETE!');
  console.log('📖 ================================\n');
  console.log(`📊 Books processed: ${totalBooks}`);
  console.log(`📊 Chapters processed: ${totalChapters}`);
  console.log(`📊 Total verses imported: ${totalVerses}`);
  console.log('\n✅ You can now view the Bible at: http://localhost:5173/#/bible\n');
}

// Run
importAllBooks().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
