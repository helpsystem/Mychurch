const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

/**
 * Parse Bible HTML files from local directory
 * Directory structure: D:\Windows.old\Users\Sami\Desktop\Iran Church DC\My Web Sites\Bible\www.bible.com
 */

const BIBLE_DIR = 'D:\\Windows.old\\Users\\Sami\\Desktop\\Iran Church DC\\My Web Sites\\Bible\\www.bible.com';
const OUTPUT_FILE = './parsed-bible-data.json';

// Bible book codes mapping (66 books)
const BOOK_CODES = {
  // Old Testament (39 books)
  'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM', 'Deuteronomy': 'DEU',
  'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT', '1 Samuel': '1SA', '2 Samuel': '2SA',
  '1 Kings': '1KI', '2 Kings': '2KI', '1 Chronicles': '1CH', '2 Chronicles': '2CH',
  'Ezra': 'EZR', 'Nehemiah': 'NEH', 'Esther': 'EST', 'Job': 'JOB', 'Psalms': 'PSA',
  'Proverbs': 'PRO', 'Ecclesiastes': 'ECC', 'Song of Solomon': 'SNG', 'Isaiah': 'ISA',
  'Jeremiah': 'JER', 'Lamentations': 'LAM', 'Ezekiel': 'EZK', 'Daniel': 'DAN',
  'Hosea': 'HOS', 'Joel': 'JOL', 'Amos': 'AMO', 'Obadiah': 'OBA', 'Jonah': 'JON',
  'Micah': 'MIC', 'Nahum': 'NAH', 'Habakkuk': 'HAB', 'Zephaniah': 'ZEP',
  'Haggai': 'HAG', 'Zechariah': 'ZEC', 'Malachi': 'MAL',
  
  // New Testament (27 books)
  'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN', 'Acts': 'ACT',
  'Romans': 'ROM', '1 Corinthians': '1CO', '2 Corinthians': '2CO', 'Galatians': 'GAL',
  'Ephesians': 'EPH', 'Philippians': 'PHP', 'Colossians': 'COL',
  '1 Thessalonians': '1TH', '2 Thessalonians': '2TH', '1 Timothy': '1TI', '2 Timothy': '2TI',
  'Titus': 'TIT', 'Philemon': 'PHM', 'Hebrews': 'HEB', 'James': 'JAS',
  '1 Peter': '1PE', '2 Peter': '2PE', '1 John': '1JN', '2 John': '2JN', '3 John': '3JN',
  'Jude': 'JUD', 'Revelation': 'REV'
};

const PERSIAN_BOOK_NAMES = {
  'GEN': 'پیدایش', 'EXO': 'خروج', 'LEV': 'لاویان', 'NUM': 'اعداد', 'DEU': 'تثنیه',
  'JOS': 'یوشع', 'JDG': 'داوران', 'RUT': 'روت', '1SA': 'اول سموئیل', '2SA': 'دوم سموئیل',
  '1KI': 'اول پادشاهان', '2KI': 'دوم پادشاهان', '1CH': 'اول تواریخ', '2CH': 'دوم تواریخ',
  'EZR': 'عزرا', 'NEH': 'نحمیا', 'EST': 'استر', 'JOB': 'ایوب', 'PSA': 'مزامیر',
  'PRO': 'امثال', 'ECC': 'جامعه', 'SNG': 'غزل غزلها', 'ISA': 'اشعیا',
  'JER': 'ارمیا', 'LAM': 'مراثی ارمیا', 'EZK': 'حزقیال', 'DAN': 'دانیال',
  'HOS': 'هوشع', 'JOL': 'یوئیل', 'AMO': 'عاموس', 'OBA': 'عوبدیا', 'JON': 'یونس',
  'MIC': 'میکاه', 'NAH': 'ناحوم', 'HAB': 'حبقوق', 'ZEP': 'صفنیا',
  'HAG': 'حجی', 'ZEC': 'زکریا', 'MAL': 'ملاکی',
  'MAT': 'متی', 'MRK': 'مرقس', 'LUK': 'لوقا', 'JHN': 'یوحنا', 'ACT': 'اعمال رسولان',
  'ROM': 'رومیان', '1CO': 'اول قرنتیان', '2CO': 'دوم قرنتیان', 'GAL': 'غلاطیان',
  'EPH': 'افسسیان', 'PHP': 'فیلیپیان', 'COL': 'کولسیان',
  '1TH': 'اول تسالونیکیان', '2TH': 'دوم تسالونیکیان', '1TI': 'اول تیموتائوس', '2TI': 'دوم تیموتائوس',
  'TIT': 'تیطس', 'PHM': 'فلیمون', 'HEB': 'عبرانیان', 'JAS': 'یعقوب',
  '1PE': 'اول پطرس', '2PE': 'دوم پطرس', '1JN': 'اول یوحنا', '2JN': 'دوم یوحنا', '3JN': 'سوم یوحنا',
  'JUD': 'یهودا', 'REV': 'مکاشفه'
};

class BibleParser {
  constructor(directory) {
    this.directory = directory;
    this.bibleData = {
      books: [],
      verses: []
    };
  }

  // Check if directory exists
  validateDirectory() {
    if (!fs.existsSync(this.directory)) {
      throw new Error(`Bible directory not found: ${this.directory}`);
    }
    console.log(`✓ Found Bible directory: ${this.directory}`);
  }

  // Parse HTML files to extract verses
  parseHTMLFile(filePath) {
    try {
      const html = fs.readFileSync(filePath, 'utf-8');
      const $ = cheerio.load(html);
      
      // Extract book, chapter info from filename or HTML
      const fileName = path.basename(filePath, '.html');
      const verses = [];

      // Try different HTML structures (adjust selectors based on actual HTML)
      $('.verse').each((index, element) => {
        const verseNumber = $(element).find('.verse-number').text().trim();
        const verseText = $(element).find('.verse-text').text().trim();
        
        if (verseText) {
          verses.push({
            number: parseInt(verseNumber) || index + 1,
            text: verseText
          });
        }
      });

      // Alternative structure
      if (verses.length === 0) {
        $('p[data-verse]').each((index, element) => {
          const verseNumber = $(element).attr('data-verse');
          const verseText = $(element).text().trim();
          
          if (verseText) {
            verses.push({
              number: parseInt(verseNumber) || index + 1,
              text: verseText
            });
          }
        });
      }

      return verses;
    } catch (error) {
      console.error(`Error parsing file ${filePath}:`, error.message);
      return [];
    }
  }

  // Scan directory for Bible files
  scanDirectory() {
    console.log('\nScanning directory structure...');
    
    // Adjust this based on actual directory structure
    const files = fs.readdirSync(this.directory);
    
    files.forEach(file => {
      const fullPath = path.join(this.directory, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        console.log(`  Directory: ${file}`);
        // Recursively scan subdirectories if needed
      } else if (file.endsWith('.html') || file.endsWith('.htm')) {
        console.log(`  File: ${file}`);
      }
    });
  }

  // Parse all Bible content
  parseAll() {
    console.log('\n=== Starting Bible Parser ===\n');
    
    try {
      this.validateDirectory();
      this.scanDirectory();
      
      // TODO: Implement actual parsing based on directory structure
      console.log('\n⚠ Parser structure discovered. Manual adjustment needed based on actual HTML format.');
      console.log('\nNext steps:');
      console.log('1. Inspect HTML files in the directory');
      console.log('2. Identify HTML structure (verse containers, selectors)');
      console.log('3. Update parseHTMLFile() method with correct selectors');
      console.log('4. Run parser to extract all verses');
      
    } catch (error) {
      console.error('Error:', error.message);
    }
  }

  // Save parsed data to JSON
  saveToJSON() {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(this.bibleData, null, 2));
    console.log(`\n✓ Bible data saved to ${OUTPUT_FILE}`);
    console.log(`  Books: ${this.bibleData.books.length}`);
    console.log(`  Verses: ${this.bibleData.verses.length}`);
  }
}

// Run parser
if (require.main === module) {
  const parser = new BibleParser(BIBLE_DIR);
  parser.parseAll();
}

module.exports = BibleParser;
