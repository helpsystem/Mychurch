/**
 * Extract Complete Bible Text from WordProject HTML files
 * 
 * This script reads the downloaded HTML files from fa_new folder
 * and creates complete JSON files with all verses including verse 1.
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../Project/fa_new/fa_new');
const targetDir = path.join(__dirname, '../public/text/bible/fa');

// Book names mapping
const BOOK_NAMES = {
  '01': 'Genesis', '02': 'Exodus', '03': 'Leviticus', '04': 'Numbers', '05': 'Deuteronomy',
  '06': 'Joshua', '07': 'Judges', '08': 'Ruth', '09': '1 Samuel', '10': '2 Samuel',
  '11': '1 Kings', '12': '2 Kings', '13': '1 Chronicles', '14': '2 Chronicles', '15': 'Ezra',
  '16': 'Nehemiah', '17': 'Esther', '18': 'Job', '19': 'Psalms', '20': 'Proverbs',
  '21': 'Ecclesiastes', '22': 'Song of Solomon', '23': 'Isaiah', '24': 'Jeremiah', '25': 'Lamentations',
  '26': 'Ezekiel', '27': 'Daniel', '28': 'Hosea', '29': 'Joel', '30': 'Amos',
  '31': 'Obadiah', '32': 'Jonah', '33': 'Micah', '34': 'Nahum', '35': 'Habakkuk',
  '36': 'Zephaniah', '37': 'Haggai', '38': 'Zechariah', '39': 'Malachi',
  '40': 'Matthew', '41': 'Mark', '42': 'Luke', '43': 'John', '44': 'Acts',
  '45': 'Romans', '46': '1 Corinthians', '47': '2 Corinthians', '48': 'Galatians', '49': 'Ephesians',
  '50': 'Philippians', '51': 'Colossians', '52': '1 Thessalonians', '53': '2 Thessalonians', '54': '1 Timothy',
  '55': '2 Timothy', '56': 'Titus', '57': 'Philemon', '58': 'Hebrews', '59': 'James',
  '60': '1 Peter', '61': '2 Peter', '62': '1 John', '63': '2 John', '64': '3 John',
  '65': 'Jude', '66': 'Revelation'
};

function extractVersesFromHTML(html) {
  const verses = {};
  
  // Match pattern: <span class="verse" id="N">N </span>&nbsp;text
  // Or: <span class="verse" id="N">N </span> text until next <br /> or </p>
  const versePattern = /<span class="verse" id="(\d+)">\d+\s*<\/span>\s*(&nbsp;)?\s*([^<]+)/g;
  
  let match;
  while ((match = versePattern.exec(html)) !== null) {
    const verseNum = match[1];
    let verseText = match[3];
    
    // Clean up the text
    verseText = verseText.replace(/&nbsp;/g, ' ');
    verseText = verseText.replace(/\s+/g, ' ');
    verseText = verseText.trim();
    
    if (verseText && verseText.length > 0) {
      verses[verseNum] = verseText;
    }
  }
  
  return verses;
}

function processBook(bookCode) {
  const bookSourceDir = path.join(sourceDir, bookCode);
  const bookTargetDir = path.join(targetDir, bookCode);
  
  if (!fs.existsSync(bookSourceDir)) {
    console.log(`⚠️ Source not found: ${bookCode}`);
    return 0;
  }
  
  // Ensure target directory exists
  if (!fs.existsSync(bookTargetDir)) {
    fs.mkdirSync(bookTargetDir, { recursive: true });
  }
  
  const htmlFiles = fs.readdirSync(bookSourceDir).filter(f => f.endsWith('.htm'));
  let updated = 0;
  
  for (const htmlFile of htmlFiles) {
    const chapterNum = htmlFile.replace('.htm', '');
    const htmlPath = path.join(bookSourceDir, htmlFile);
    const jsonPath = path.join(bookTargetDir, `${chapterNum}.json`);
    
    try {
      // Read HTML
      const html = fs.readFileSync(htmlPath, 'utf8');
      const newVerses = extractVersesFromHTML(html);
      
      if (Object.keys(newVerses).length === 0) {
        console.log(`⚠️ No verses found: ${bookCode}/${chapterNum}`);
        continue;
      }
      
      // Check if verse 1 exists in new data
      if (!newVerses["1"]) {
        console.log(`⚠️ No verse 1 in HTML: ${bookCode}/${chapterNum}`);
        continue;
      }
      
      // Read existing JSON if it exists
      let existingData = {
        book: BOOK_NAMES[bookCode] || 'Unknown',
        chapter: parseInt(chapterNum),
        language: 'fa',
        verses: {}
      };
      
      if (fs.existsSync(jsonPath)) {
        try {
          existingData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        } catch (e) {}
      }
      
      // Only update if verse 1 is missing in existing data
      if (!existingData.verses || !existingData.verses["1"]) {
        // Merge: prefer existing verses, add missing verse 1
        const mergedVerses = { ...newVerses };
        if (existingData.verses) {
          Object.keys(existingData.verses).forEach(key => {
            // Keep existing verses (they might be cleaner)
            if (key !== "1" || !mergedVerses["1"]) {
              // Actually, prefer the HTML version since it has verse 1
            }
          });
        }
        
        existingData.verses = mergedVerses;
        
        // Write back
        fs.writeFileSync(jsonPath, JSON.stringify(existingData, null, 2), 'utf8');
        console.log(`✅ Updated: ${bookCode}/${chapterNum} (${Object.keys(newVerses).length} verses)`);
        updated++;
      }
    } catch (err) {
      console.error(`❌ Error: ${bookCode}/${chapterNum}:`, err.message);
    }
  }
  
  return updated;
}

function main() {
  console.log('🔄 Extracting Bible text from HTML files...\n');
  
  let totalUpdated = 0;
  
  // Process all 66 books
  for (let i = 1; i <= 66; i++) {
    const bookCode = i.toString().padStart(2, '0');
    const updated = processBook(bookCode);
    totalUpdated += updated;
  }
  
  console.log(`\n📊 Summary: Updated ${totalUpdated} files`);
}

main();
