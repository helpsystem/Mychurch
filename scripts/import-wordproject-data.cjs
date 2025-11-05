/**
 * Import WordProject Bible Data to Supabase
 * 
 * این اسکریپت داده‌های کتاب مقدس را از فایل‌های HTML استخراج‌شده WordProject
 * به دیتابیس Supabase وارد می‌کند
 * 
 * مسیرهای منبع:
 * - D:\https___www.wordproject.org_bibles_audio_01_english_index.htm\www.wordproject.org\bibles\fa\01
 * - D:\https___www.wordproject.org_bibles_audio_01_english_index.htm\www.wordproject.org\bibles\kj\index.html
 * - D:\https___www.wordproject.org_bibles_audio_01_english_index.htm\www.wordproject.org\bibles\audio\20_farsi
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');

// Supabase Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wxzhzsqicgwfxffxayhy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Source paths
const SOURCE_PATHS = {
  farsi: 'D:\\https___www.wordproject.org_bibles_audio_01_english_index.htm\\www.wordproject.org\\bibles\\fa\\01',
  english: 'D:\\https___www.wordproject.org_bibles_audio_01_english_index.htm\\www.wordproject.org\\bibles\\kj',
  audio_farsi: 'D:\\https___www.wordproject.org_bibles_audio_01_english_index.htm\\www.wordproject.org\\bibles\\audio\\20_farsi'
};

// Bible book mapping (ISO codes)
const BOOK_CODES = {
  '01': 'GEN', '02': 'EXO', '03': 'LEV', '04': 'NUM', '05': 'DEU',
  '06': 'JOS', '07': 'JDG', '08': 'RUT', '09': '1SA', '10': '2SA',
  '11': '1KI', '12': '2KI', '13': '1CH', '14': '2CH', '15': 'EZR',
  '16': 'NEH', '17': 'EST', '18': 'JOB', '19': 'PSA', '20': 'PRO',
  '21': 'ECC', '22': 'SNG', '23': 'ISA', '24': 'JER', '25': 'LAM',
  '26': 'EZK', '27': 'DAN', '28': 'HOS', '29': 'JOL', '30': 'AMO',
  '31': 'OBA', '32': 'JON', '33': 'MIC', '34': 'NAM', '35': 'HAB',
  '36': 'ZEP', '37': 'HAG', '38': 'ZEC', '39': 'MAL',
  '40': 'MAT', '41': 'MRK', '42': 'LUK', '43': 'JHN', '44': 'ACT',
  '45': 'ROM', '46': '1CO', '47': '2CO', '48': 'GAL', '49': 'EPH',
  '50': 'PHP', '51': 'COL', '52': '1TH', '53': '2TH', '54': '1TI',
  '55': '2TI', '56': 'TIT', '57': 'PHM', '58': 'HEB', '59': 'JAS',
  '60': '1PE', '61': '2PE', '62': '1JN', '63': '2JN', '64': '3JN',
  '65': 'JUD', '66': 'REV'
};

/**
 * Parse HTML file and extract verses
 */
function parseHTMLFile(filePath) {
  try {
    const html = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(html);
    const verses = [];

    // WordProject structure: <span class="verse" id="1">1 </span>&nbsp;متن آیه<br />
    $('span.verse').each((i, elem) => {
      const $span = $(elem);
      const verseNum = parseInt($span.attr('id') || $span.text().trim());
      
      if (verseNum > 0) {
        // Get text after this span until next <br> or next span.verse
        let text = '';
        let $next = $span.next();
        
        // Collect text nodes and elements
        while ($next.length > 0) {
          if ($next.is('br')) break;
          if ($next.is('span.verse')) break;
          
          text += $next.text() + ' ';
          $next = $next.next();
        }
        
        // Also get direct text after span
        const directText = $span[0].nextSibling;
        if (directText && directText.type === 'text') {
          text = directText.data + ' ' + text;
        }
        
        text = text.replace(/&nbsp;/g, '').trim();
        
        if (text) {
          verses.push({
            verse_number: verseNum,
            text: text
          });
        }
      }
    });

    return verses;
  } catch (error) {
    console.error(`❌ Error parsing ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Get book ID from database
 */
async function getBookId(bookCode) {
  const { data, error } = await supabase
    .from('bible_books')
    .select('id')
    .eq('book_iso', bookCode)
    .single();

  if (error) {
    console.error(`❌ Error getting book ID for ${bookCode}:`, error.message);
    return null;
  }

  return data?.id;
}

/**
 * Get translation ID
 */
async function getTranslationId(code) {
  const { data, error } = await supabase
    .from('bible_translations')
    .select('id')
    .eq('code', code)
    .single();

  if (error) {
    console.error(`❌ Error getting translation ID for ${code}:`, error.message);
    return null;
  }

  return data?.id;
}

/**
 * Import verses for a book/chapter
 */
async function importVerses(bookCode, chapterNum, versesData, translationId, language) {
  const bookId = await getBookId(bookCode);
  
  if (!bookId) {
    console.error(`❌ Book not found: ${bookCode}`);
    return false;
  }

  console.log(`📖 Importing ${bookCode} Chapter ${chapterNum} (${versesData.length} verses)...`);

  const versesToInsert = versesData.map(verse => ({
    book_id: bookId,
    chapter_number: chapterNum,
    verse_number: verse.verse_number,
    translation_id: translationId,
    [language === 'fa' ? 'text_fa' : 'text_en']: verse.text
  }));

  // Insert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < versesToInsert.length; i += batchSize) {
    const batch = versesToInsert.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('bible_verses')
      .upsert(batch, {
        onConflict: 'book_id,chapter_number,verse_number,translation_id'
      });

    if (error) {
      console.error(`❌ Error inserting batch:`, error.message);
      return false;
    }
  }

  console.log(`✅ Imported ${versesToInsert.length} verses`);
  return true;
}

/**
 * Scan directory and import all chapters
 */
async function importFromDirectory(dirPath, translationId, language) {
  if (!fs.existsSync(dirPath)) {
    console.error(`❌ Directory not found: ${dirPath}`);
    return;
  }

  console.log(`\n📂 Scanning directory: ${dirPath}`);

  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively scan subdirectories
      await importFromDirectory(filePath, translationId, language);
    } else if (file.endsWith('.html') || file.endsWith('.htm')) {
      // Parse filename: e.g., "01_01.html" = Book 01, Chapter 01
      const match = file.match(/(\d{2})_(\d{2,3})\.(html|htm)/);
      
      if (match) {
        const bookNum = match[1];
        const chapterNum = parseInt(match[2]);
        const bookCode = BOOK_CODES[bookNum];

        if (bookCode) {
          const verses = parseHTMLFile(filePath);
          
          if (verses.length > 0) {
            await importVerses(bookCode, chapterNum, verses, translationId, language);
          } else {
            console.warn(`⚠️  No verses found in ${file}`);
          }
        }
      }
    }
  }
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Starting WordProject Bible Data Import...\n');

  try {
    // 1. Import Persian (Farsi) verses
    console.log('=' .repeat(60));
    console.log('📖 IMPORTING PERSIAN VERSES (Farsi Old Translation)');
    console.log('='.repeat(60));
    
    const farsiTransId = await getTranslationId('qadim'); // ترجمه قدیم فارسی
    
    if (farsiTransId) {
      await importFromDirectory(SOURCE_PATHS.farsi, farsiTransId, 'fa');
    } else {
      console.error('❌ Persian translation not found in database!');
    }

    // 2. Import English verses (KJV)
    console.log('\n' + '='.repeat(60));
    console.log('📖 IMPORTING ENGLISH VERSES (King James Version)');
    console.log('='.repeat(60));
    
    const englishTransId = await getTranslationId('kjv');
    
    if (englishTransId) {
      await importFromDirectory(SOURCE_PATHS.english, englishTransId, 'en');
    } else {
      console.error('❌ English translation not found in database!');
    }

    console.log('\n✅ Import completed successfully!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run import
if (require.main === module) {
  main();
}

module.exports = { importVerses, parseHTMLFile };
