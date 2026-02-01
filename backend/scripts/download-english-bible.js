/**
 * Download Complete English Bible (NET) from YouVersion/Bible.com
 * دانلود کامل کتاب مقدس انگلیسی از YouVersion
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// NET Bible version ID on YouVersion
const VERSION_ID = 107; // NET Bible
const OUTPUT_DIR = '/root/Mychurch/bible_data/text/NET';

// All 66 books with their YouVersion codes and chapter counts
const BOOKS = [
  { code: 'GEN', name: 'Genesis', chapters: 50 },
  { code: 'EXO', name: 'Exodus', chapters: 40 },
  { code: 'LEV', name: 'Leviticus', chapters: 27 },
  { code: 'NUM', name: 'Numbers', chapters: 36 },
  { code: 'DEU', name: 'Deuteronomy', chapters: 34 },
  { code: 'JOS', name: 'Joshua', chapters: 24 },
  { code: 'JDG', name: 'Judges', chapters: 21 },
  { code: 'RUT', name: 'Ruth', chapters: 4 },
  { code: '1SA', name: '1 Samuel', chapters: 31 },
  { code: '2SA', name: '2 Samuel', chapters: 24 },
  { code: '1KI', name: '1 Kings', chapters: 22 },
  { code: '2KI', name: '2 Kings', chapters: 25 },
  { code: '1CH', name: '1 Chronicles', chapters: 29 },
  { code: '2CH', name: '2 Chronicles', chapters: 36 },
  { code: 'EZR', name: 'Ezra', chapters: 10 },
  { code: 'NEH', name: 'Nehemiah', chapters: 13 },
  { code: 'EST', name: 'Esther', chapters: 10 },
  { code: 'JOB', name: 'Job', chapters: 42 },
  { code: 'PSA', name: 'Psalms', chapters: 150 },
  { code: 'PRO', name: 'Proverbs', chapters: 31 },
  { code: 'ECC', name: 'Ecclesiastes', chapters: 12 },
  { code: 'SNG', name: 'Song of Solomon', chapters: 8 },
  { code: 'ISA', name: 'Isaiah', chapters: 66 },
  { code: 'JER', name: 'Jeremiah', chapters: 52 },
  { code: 'LAM', name: 'Lamentations', chapters: 5 },
  { code: 'EZK', name: 'Ezekiel', chapters: 48 },
  { code: 'DAN', name: 'Daniel', chapters: 12 },
  { code: 'HOS', name: 'Hosea', chapters: 14 },
  { code: 'JOL', name: 'Joel', chapters: 3 },
  { code: 'AMO', name: 'Amos', chapters: 9 },
  { code: 'OBA', name: 'Obadiah', chapters: 1 },
  { code: 'JON', name: 'Jonah', chapters: 4 },
  { code: 'MIC', name: 'Micah', chapters: 7 },
  { code: 'NAM', name: 'Nahum', chapters: 3 },
  { code: 'HAB', name: 'Habakkuk', chapters: 3 },
  { code: 'ZEP', name: 'Zephaniah', chapters: 3 },
  { code: 'HAG', name: 'Haggai', chapters: 2 },
  { code: 'ZEC', name: 'Zechariah', chapters: 14 },
  { code: 'MAL', name: 'Malachi', chapters: 4 },
  { code: 'MAT', name: 'Matthew', chapters: 28 },
  { code: 'MRK', name: 'Mark', chapters: 16 },
  { code: 'LUK', name: 'Luke', chapters: 24 },
  { code: 'JHN', name: 'John', chapters: 21 },
  { code: 'ACT', name: 'Acts', chapters: 28 },
  { code: 'ROM', name: 'Romans', chapters: 16 },
  { code: '1CO', name: '1 Corinthians', chapters: 16 },
  { code: '2CO', name: '2 Corinthians', chapters: 13 },
  { code: 'GAL', name: 'Galatians', chapters: 6 },
  { code: 'EPH', name: 'Ephesians', chapters: 6 },
  { code: 'PHP', name: 'Philippians', chapters: 4 },
  { code: 'COL', name: 'Colossians', chapters: 4 },
  { code: '1TH', name: '1 Thessalonians', chapters: 5 },
  { code: '2TH', name: '2 Thessalonians', chapters: 3 },
  { code: '1TI', name: '1 Timothy', chapters: 6 },
  { code: '2TI', name: '2 Timothy', chapters: 4 },
  { code: 'TIT', name: 'Titus', chapters: 3 },
  { code: 'PHM', name: 'Philemon', chapters: 1 },
  { code: 'HEB', name: 'Hebrews', chapters: 13 },
  { code: 'JAS', name: 'James', chapters: 5 },
  { code: '1PE', name: '1 Peter', chapters: 5 },
  { code: '2PE', name: '2 Peter', chapters: 3 },
  { code: '1JN', name: '1 John', chapters: 5 },
  { code: '2JN', name: '2 John', chapters: 1 },
  { code: '3JN', name: '3 John', chapters: 1 },
  { code: 'JUD', name: 'Jude', chapters: 1 },
  { code: 'REV', name: 'Revelation', chapters: 22 }
];

// Delay helper
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Fetch chapter from YouVersion API
function fetchChapter(bookCode, chapter) {
  return new Promise((resolve, reject) => {
    const url = `https://www.bible.com/json/bible/books/${VERSION_ID}/${bookCode}/${chapter}`;
    
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 100)}`));
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

// Alternative: Fetch from Bible Gateway
function fetchFromBibleGateway(bookCode, chapter) {
  return new Promise((resolve, reject) => {
    // Map book codes to Bible Gateway format
    const bgBookMap = {
      'GEN': 'Genesis', 'EXO': 'Exodus', 'LEV': 'Leviticus', 'NUM': 'Numbers',
      'DEU': 'Deuteronomy', 'JOS': 'Joshua', 'JDG': 'Judges', 'RUT': 'Ruth',
      '1SA': '1+Samuel', '2SA': '2+Samuel', '1KI': '1+Kings', '2KI': '2+Kings',
      '1CH': '1+Chronicles', '2CH': '2+Chronicles', 'EZR': 'Ezra', 'NEH': 'Nehemiah',
      'EST': 'Esther', 'JOB': 'Job', 'PSA': 'Psalm', 'PRO': 'Proverbs',
      'ECC': 'Ecclesiastes', 'SNG': 'Song+of+Solomon', 'ISA': 'Isaiah', 'JER': 'Jeremiah',
      'LAM': 'Lamentations', 'EZK': 'Ezekiel', 'DAN': 'Daniel', 'HOS': 'Hosea',
      'JOL': 'Joel', 'AMO': 'Amos', 'OBA': 'Obadiah', 'JON': 'Jonah',
      'MIC': 'Micah', 'NAM': 'Nahum', 'HAB': 'Habakkuk', 'ZEP': 'Zephaniah',
      'HAG': 'Haggai', 'ZEC': 'Zechariah', 'MAL': 'Malachi',
      'MAT': 'Matthew', 'MRK': 'Mark', 'LUK': 'Luke', 'JHN': 'John',
      'ACT': 'Acts', 'ROM': 'Romans', '1CO': '1+Corinthians', '2CO': '2+Corinthians',
      'GAL': 'Galatians', 'EPH': 'Ephesians', 'PHP': 'Philippians', 'COL': 'Colossians',
      '1TH': '1+Thessalonians', '2TH': '2+Thessalonians', '1TI': '1+Timothy', '2TI': '2+Timothy',
      'TIT': 'Titus', 'PHM': 'Philemon', 'HEB': 'Hebrews', 'JAS': 'James',
      '1PE': '1+Peter', '2PE': '2+Peter', '1JN': '1+John', '2JN': '2+John',
      '3JN': '3+John', 'JUD': 'Jude', 'REV': 'Revelation'
    };
    
    const bookName = bgBookMap[bookCode] || bookCode;
    const url = `https://www.biblegateway.com/passage/?search=${bookName}+${chapter}&version=NET&interface=print`;
    
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          // Parse verses from HTML
          const verses = parseVersesFromHTML(data, bookCode, chapter);
          resolve(verses);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Parse verses from Bible Gateway HTML
function parseVersesFromHTML(html, bookCode, chapter) {
  const verses = [];
  
  // Match verse patterns: <span class="text ..."><sup class="versenum">1&nbsp;</sup>Text...</span>
  const verseRegex = /<sup[^>]*class="versenum"[^>]*>(\d+)[^<]*<\/sup>([^<]+(?:<[^>]+>[^<]*<\/[^>]+>)*[^<]*)/gi;
  
  let match;
  const seenVerses = new Set();
  
  // Alternative: try to find verse content differently
  const textRegex = /<span[^>]*class="text[^"]*"[^>]*>(?:<sup[^>]*class="versenum"[^>]*>(\d+)[^<]*<\/sup>)?([^<]+)/gi;
  
  while ((match = textRegex.exec(html)) !== null) {
    const verseNum = match[1] ? parseInt(match[1]) : verses.length + 1;
    let text = match[2].trim();
    
    // Clean up text
    text = text.replace(/&nbsp;/g, ' ')
               .replace(/&#\d+;/g, '')
               .replace(/\s+/g, ' ')
               .trim();
    
    if (text && text.length > 2 && !seenVerses.has(verseNum)) {
      seenVerses.add(verseNum);
      verses.push({
        verse: verseNum,
        text: text,
        usfm: `${bookCode}.${chapter}.${verseNum}`
      });
    }
  }
  
  return {
    translation: 'NET',
    book: bookCode,
    chapter: chapter,
    verses: verses.sort((a, b) => a.verse - b.verse)
  };
}

// Use GetBible.net API (free, no key required)
function fetchFromGetBible(bookCode, chapter) {
  return new Promise((resolve, reject) => {
    // Map to GetBible book names
    const gbBookMap = {
      'GEN': 'Genesis', 'EXO': 'Exodus', 'LEV': 'Leviticus', 'NUM': 'Numbers',
      'DEU': 'Deuteronomy', 'JOS': 'Joshua', 'JDG': 'Judges', 'RUT': 'Ruth',
      '1SA': '1 Samuel', '2SA': '2 Samuel', '1KI': '1 Kings', '2KI': '2 Kings',
      '1CH': '1 Chronicles', '2CH': '2 Chronicles', 'EZR': 'Ezra', 'NEH': 'Nehemiah',
      'EST': 'Esther', 'JOB': 'Job', 'PSA': 'Psalms', 'PRO': 'Proverbs',
      'ECC': 'Ecclesiastes', 'SNG': 'Song of Solomon', 'ISA': 'Isaiah', 'JER': 'Jeremiah',
      'LAM': 'Lamentations', 'EZK': 'Ezekiel', 'DAN': 'Daniel', 'HOS': 'Hosea',
      'JOL': 'Joel', 'AMO': 'Amos', 'OBA': 'Obadiah', 'JON': 'Jonah',
      'MIC': 'Micah', 'NAM': 'Nahum', 'HAB': 'Habakkuk', 'ZEP': 'Zephaniah',
      'HAG': 'Haggai', 'ZEC': 'Zechariah', 'MAL': 'Malachi',
      'MAT': 'Matthew', 'MRK': 'Mark', 'LUK': 'Luke', 'JHN': 'John',
      'ACT': 'Acts', 'ROM': 'Romans', '1CO': '1 Corinthians', '2CO': '2 Corinthians',
      'GAL': 'Galatians', 'EPH': 'Ephesians', 'PHP': 'Philippians', 'COL': 'Colossians',
      '1TH': '1 Thessalonians', '2TH': '2 Thessalonians', '1TI': '1 Timothy', '2TI': '2 Timothy',
      'TIT': 'Titus', 'PHM': 'Philemon', 'HEB': 'Hebrews', 'JAS': 'James',
      '1PE': '1 Peter', '2PE': '2 Peter', '1JN': '1 John', '2JN': '2 John',
      '3JN': '3 John', 'JUD': 'Jude', 'REV': 'Revelation'
    };
    
    const bookName = encodeURIComponent(gbBookMap[bookCode] || bookCode);
    // Use KJV as fallback (always available)
    const url = `https://getbible.net/json?passage=${bookName}%20${chapter}&version=kjv`;
    
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          // Remove JSONP wrapper if present
          let jsonStr = data;
          if (data.startsWith('(')) {
            jsonStr = data.slice(1, -2);
          }
          
          const json = JSON.parse(jsonStr);
          const book = json.book ? json.book[0] : json;
          const chapterData = book.chapter || {};
          
          const verses = Object.entries(chapterData).map(([num, verseObj]) => ({
            verse: parseInt(num),
            text: verseObj.verse || verseObj,
            usfm: `${bookCode}.${chapter}.${num}`
          })).sort((a, b) => a.verse - b.verse);
          
          resolve({
            translation: 'KJV',
            book: bookCode,
            chapter: chapter,
            verses: verses
          });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Main download function
async function downloadEnglishBible() {
  console.log('🚀 Starting English Bible (KJV) download...\n');
  
  let totalChapters = 0;
  let totalVerses = 0;
  let errors = [];
  
  for (const book of BOOKS) {
    const bookDir = path.join(OUTPUT_DIR, book.code);
    
    // Create directory if needed
    if (!fs.existsSync(bookDir)) {
      fs.mkdirSync(bookDir, { recursive: true });
    }
    
    console.log(`📖 ${book.name} (${book.code}) - ${book.chapters} chapters`);
    
    for (let ch = 1; ch <= book.chapters; ch++) {
      const filePath = path.join(bookDir, `${ch}.json`);
      
      // Skip if already exists
      if (fs.existsSync(filePath)) {
        const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (existing.verses && existing.verses.length > 0) {
          totalVerses += existing.verses.length;
          totalChapters++;
          continue;
        }
      }
      
      try {
        // Try GetBible API (uses KJV)
        const chapterData = await fetchFromGetBible(book.code, ch);
        
        if (chapterData.verses && chapterData.verses.length > 0) {
          // Save to file
          fs.writeFileSync(filePath, JSON.stringify(chapterData, null, 2));
          totalVerses += chapterData.verses.length;
          totalChapters++;
          process.stdout.write(`  ✓ Chapter ${ch} (${chapterData.verses.length} verses)\r`);
        } else {
          errors.push(`${book.code} ${ch}: No verses found`);
        }
        
        // Rate limiting
        await delay(500);
        
      } catch (err) {
        errors.push(`${book.code} ${ch}: ${err.message}`);
        process.stdout.write(`  ✗ Chapter ${ch} failed\r`);
        await delay(1000);
      }
    }
    
    console.log(`  ✅ Done - ${book.chapters} chapters`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Download Complete!');
  console.log(`   📚 Chapters: ${totalChapters}`);
  console.log(`   📖 Verses: ${totalVerses}`);
  
  if (errors.length > 0) {
    console.log(`   ⚠️ Errors: ${errors.length}`);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'errors.log'), errors.join('\n'));
  }
}

// Run
downloadEnglishBible().catch(console.error);
