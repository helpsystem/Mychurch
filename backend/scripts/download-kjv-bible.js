/**
 * Download Complete English Bible using Bible-api.com (free, no key required)
 * دانلود کامل کتاب مقدس انگلیسی KJV
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = '/root/Mychurch/bible_data/text/KJV';

// All 66 books
const BOOKS = [
  { code: 'GEN', name: 'genesis', chapters: 50 },
  { code: 'EXO', name: 'exodus', chapters: 40 },
  { code: 'LEV', name: 'leviticus', chapters: 27 },
  { code: 'NUM', name: 'numbers', chapters: 36 },
  { code: 'DEU', name: 'deuteronomy', chapters: 34 },
  { code: 'JOS', name: 'joshua', chapters: 24 },
  { code: 'JDG', name: 'judges', chapters: 21 },
  { code: 'RUT', name: 'ruth', chapters: 4 },
  { code: '1SA', name: '1samuel', chapters: 31 },
  { code: '2SA', name: '2samuel', chapters: 24 },
  { code: '1KI', name: '1kings', chapters: 22 },
  { code: '2KI', name: '2kings', chapters: 25 },
  { code: '1CH', name: '1chronicles', chapters: 29 },
  { code: '2CH', name: '2chronicles', chapters: 36 },
  { code: 'EZR', name: 'ezra', chapters: 10 },
  { code: 'NEH', name: 'nehemiah', chapters: 13 },
  { code: 'EST', name: 'esther', chapters: 10 },
  { code: 'JOB', name: 'job', chapters: 42 },
  { code: 'PSA', name: 'psalms', chapters: 150 },
  { code: 'PRO', name: 'proverbs', chapters: 31 },
  { code: 'ECC', name: 'ecclesiastes', chapters: 12 },
  { code: 'SNG', name: 'songofsolomon', chapters: 8 },
  { code: 'ISA', name: 'isaiah', chapters: 66 },
  { code: 'JER', name: 'jeremiah', chapters: 52 },
  { code: 'LAM', name: 'lamentations', chapters: 5 },
  { code: 'EZK', name: 'ezekiel', chapters: 48 },
  { code: 'DAN', name: 'daniel', chapters: 12 },
  { code: 'HOS', name: 'hosea', chapters: 14 },
  { code: 'JOL', name: 'joel', chapters: 3 },
  { code: 'AMO', name: 'amos', chapters: 9 },
  { code: 'OBA', name: 'obadiah', chapters: 1 },
  { code: 'JON', name: 'jonah', chapters: 4 },
  { code: 'MIC', name: 'micah', chapters: 7 },
  { code: 'NAM', name: 'nahum', chapters: 3 },
  { code: 'HAB', name: 'habakkuk', chapters: 3 },
  { code: 'ZEP', name: 'zephaniah', chapters: 3 },
  { code: 'HAG', name: 'haggai', chapters: 2 },
  { code: 'ZEC', name: 'zechariah', chapters: 14 },
  { code: 'MAL', name: 'malachi', chapters: 4 },
  { code: 'MAT', name: 'matthew', chapters: 28 },
  { code: 'MRK', name: 'mark', chapters: 16 },
  { code: 'LUK', name: 'luke', chapters: 24 },
  { code: 'JHN', name: 'john', chapters: 21 },
  { code: 'ACT', name: 'acts', chapters: 28 },
  { code: 'ROM', name: 'romans', chapters: 16 },
  { code: '1CO', name: '1corinthians', chapters: 16 },
  { code: '2CO', name: '2corinthians', chapters: 13 },
  { code: 'GAL', name: 'galatians', chapters: 6 },
  { code: 'EPH', name: 'ephesians', chapters: 6 },
  { code: 'PHP', name: 'philippians', chapters: 4 },
  { code: 'COL', name: 'colossians', chapters: 4 },
  { code: '1TH', name: '1thessalonians', chapters: 5 },
  { code: '2TH', name: '2thessalonians', chapters: 3 },
  { code: '1TI', name: '1timothy', chapters: 6 },
  { code: '2TI', name: '2timothy', chapters: 4 },
  { code: 'TIT', name: 'titus', chapters: 3 },
  { code: 'PHM', name: 'philemon', chapters: 1 },
  { code: 'HEB', name: 'hebrews', chapters: 13 },
  { code: 'JAS', name: 'james', chapters: 5 },
  { code: '1PE', name: '1peter', chapters: 5 },
  { code: '2PE', name: '2peter', chapters: 3 },
  { code: '1JN', name: '1john', chapters: 5 },
  { code: '2JN', name: '2john', chapters: 1 },
  { code: '3JN', name: '3john', chapters: 1 },
  { code: 'JUD', name: 'jude', chapters: 1 },
  { code: 'REV', name: 'revelation', chapters: 22 }
];

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Fetch from bible-api.com (free API)
function fetchChapter(bookName, chapter) {
  return new Promise((resolve, reject) => {
    const url = `https://bible-api.com/${bookName}+${chapter}?translation=kjv`;
    
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 Bible Downloader',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function downloadBible() {
  console.log('🚀 Starting KJV Bible download from bible-api.com...\n');
  
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  let totalChapters = 0;
  let totalVerses = 0;
  const errors = [];
  
  for (const book of BOOKS) {
    const bookDir = path.join(OUTPUT_DIR, book.code);
    if (!fs.existsSync(bookDir)) {
      fs.mkdirSync(bookDir, { recursive: true });
    }
    
    let bookVerses = 0;
    
    for (let ch = 1; ch <= book.chapters; ch++) {
      const filePath = path.join(bookDir, `${ch}.json`);
      
      // Skip if exists
      if (fs.existsSync(filePath)) {
        try {
          const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (existing.verses && existing.verses.length > 0) {
            bookVerses += existing.verses.length;
            totalChapters++;
            continue;
          }
        } catch (e) {}
      }
      
      try {
        const data = await fetchChapter(book.name, ch);
        
        if (data.verses && data.verses.length > 0) {
          // Format verses
          const formatted = {
            translation: 'KJV',
            book: book.code,
            chapter: ch,
            verses: data.verses.map(v => ({
              verse: v.verse,
              text: v.text.trim(),
              usfm: `${book.code}.${ch}.${v.verse}`
            }))
          };
          
          fs.writeFileSync(filePath, JSON.stringify(formatted, null, 2));
          bookVerses += formatted.verses.length;
          totalChapters++;
          totalVerses += formatted.verses.length;
        }
        
        // Rate limit
        await delay(300);
        
      } catch (err) {
        errors.push(`${book.code} ${ch}: ${err.message}`);
        await delay(1000);
      }
    }
    
    console.log(`✅ ${book.name} (${book.code}): ${book.chapters} chapters, ${bookVerses} verses`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Download Complete!');
  console.log(`   📚 Chapters: ${totalChapters}`);
  console.log(`   📖 Verses: ${totalVerses}`);
  
  if (errors.length > 0) {
    console.log(`   ⚠️ Errors: ${errors.length}`);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'errors.log'), errors.join('\n'));
  }
  
  // Create summary
  fs.writeFileSync(path.join(OUTPUT_DIR, 'summary.json'), JSON.stringify({
    translation: 'KJV',
    language: 'en',
    totalBooks: 66,
    totalChapters,
    totalVerses,
    downloadedAt: new Date().toISOString()
  }, null, 2));
}

downloadBible().catch(console.error);
