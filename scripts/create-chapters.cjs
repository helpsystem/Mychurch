/**
 * CREATE MISSING CHAPTERS
 * ایجاد فصل‌های مفقود
 * 
 * This script creates bible_chapters records for all books
 * that don't have them yet, based on HTML files in the WordProject data
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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
  '66': 'REV', '5': 'DEU'
};

/**
 * Create chapters for a book
 */
async function createChaptersForBook(bookNum, bookISO) {
  const bookPath = path.join(BIBLE_ROOT, bookNum);
  
  if (!fs.existsSync(bookPath)) {
    return { created: 0, message: 'Directory not found' };
  }

  // Count HTML files
  const files = fs.readdirSync(bookPath).filter(f => f.endsWith('.html'));
  if (files.length === 0) {
    return { created: 0, message: 'No HTML files' };
  }

  const chapterNumbers = files.map(f => parseInt(f.replace('.html', ''))).sort((a, b) => a - b);

  // Create chapters
  const chaptersToInsert = chapterNumbers.map(chNum => ({
    book_iso: bookISO,
    chapter_number: chNum,
    language: 'farsi',
    text_content: ''  // Will be populated later if needed
  }));

  const { data, error } = await supabase
    .from('bible_chapters')
    .insert(chaptersToInsert)
    .select();

  if (error) {
    return { created: 0, message: `Error: ${error.message}` };
  }

  return { created: data ? data.length : chapterNumbers.length, message: 'Success' };
}

/**
 * Main function
 */
async function createAllChapters() {
  console.log('\n📖 ================================');
  console.log('📖  CREATE MISSING CHAPTERS');
  console.log('📖  ایجاد فصل‌های مفقود');
  console.log('📖 ================================\n');

  // Get all books
  const { data: books, error: booksError } = await supabase
    .from('bible_books')
    .select('book_iso, book_name_fa')
    .order('book_number');

  if (booksError) {
    console.error('❌ Books error:', booksError);
    return;
  }

  console.log(`✅ Found ${books.length} books\n`);

  let totalChapters = 0;
  let processedBooks = 0;

  for (const [bookNum, bookISO] of Object.entries(BOOK_MAP)) {
    const bookInfo = books.find(b => b.book_iso === bookISO);
    if (!bookInfo) continue;

    const bookName = bookInfo.book_name_fa;

    process.stdout.write(`📖 ${bookISO.padEnd(6)} ${bookName.padEnd(20)} ... `);

    const result = await createChaptersForBook(bookNum, bookISO);

    if (result.created > 0) {
      console.log(`✅ ${result.created} chapters`);
      totalChapters += result.created;
      processedBooks++;
    } else {
      console.log(`⚠️  ${result.message}`);
    }

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📖 ================================');
  console.log('🎉  CHAPTERS CREATED!');
  console.log('📖 ================================\n');
  console.log(`📊 Books processed: ${processedBooks}`);
  console.log(`📊 Total chapters created: ${totalChapters}`);
  console.log('\n✅ Now run: node scripts/import-all-books.cjs\n');
}

// Run
createAllChapters().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
