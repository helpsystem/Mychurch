#!/usr/bin/env node

/**
 * 📖 تولید Timing برای همه 1189 فصل کتاب مقدس (از فایل‌های JSON لوکال)
 * 
 * این اسکریپت از فایل‌های JSON موجود در public/text/bible/fa استفاده می‌کند
 * و فایل‌های timing را تولید می‌کند.
 * 
 * استفاده:
 *   node scripts/generate-bible-timing-local.cjs [--force]
 */

const fs = require('fs');
const path = require('path');

// مسیرها
const BIBLE_TEXT_DIR = path.join(__dirname, '..', 'public', 'text', 'bible', 'fa');
const BIBLE_TIMING_DIR = path.join(__dirname, '..', 'public', 'bible', 'data', 'timings');

// ایجاد پوشه timing
if (!fs.existsSync(BIBLE_TIMING_DIR)) {
  fs.mkdirSync(BIBLE_TIMING_DIR, { recursive: true });
}

// پارس آرگومان‌ها
const args = process.argv.slice(2);
const FORCE_OVERWRITE = args.includes('--force');

// نام کتاب‌ها
const BOOK_NAMES = {
  '01': { en: 'Genesis', fa: 'پیدایش', key: 'GEN' },
  '02': { en: 'Exodus', fa: 'خروج', key: 'EXO' },
  '03': { en: 'Leviticus', fa: 'لاویان', key: 'LEV' },
  '04': { en: 'Numbers', fa: 'اعداد', key: 'NUM' },
  '05': { en: 'Deuteronomy', fa: 'تثنیه', key: 'DEU' },
  '06': { en: 'Joshua', fa: 'یوشع', key: 'JOS' },
  '07': { en: 'Judges', fa: 'داوران', key: 'JDG' },
  '08': { en: 'Ruth', fa: 'روت', key: 'RUT' },
  '09': { en: '1 Samuel', fa: 'اول سموئیل', key: '1SA' },
  '10': { en: '2 Samuel', fa: 'دوم سموئیل', key: '2SA' },
  '11': { en: '1 Kings', fa: 'اول پادشاهان', key: '1KI' },
  '12': { en: '2 Kings', fa: 'دوم پادشاهان', key: '2KI' },
  '13': { en: '1 Chronicles', fa: 'اول تواریخ', key: '1CH' },
  '14': { en: '2 Chronicles', fa: 'دوم تواریخ', key: '2CH' },
  '15': { en: 'Ezra', fa: 'عزرا', key: 'EZR' },
  '16': { en: 'Nehemiah', fa: 'نحمیا', key: 'NEH' },
  '17': { en: 'Esther', fa: 'استر', key: 'EST' },
  '18': { en: 'Job', fa: 'ایوب', key: 'JOB' },
  '19': { en: 'Psalms', fa: 'مزامیر', key: 'PSA' },
  '20': { en: 'Proverbs', fa: 'امثال', key: 'PRO' },
  '21': { en: 'Ecclesiastes', fa: 'جامعه', key: 'ECC' },
  '22': { en: 'Song of Solomon', fa: 'غزل غزلها', key: 'SNG' },
  '23': { en: 'Isaiah', fa: 'اشعیا', key: 'ISA' },
  '24': { en: 'Jeremiah', fa: 'ارمیا', key: 'JER' },
  '25': { en: 'Lamentations', fa: 'مراثی ارمیا', key: 'LAM' },
  '26': { en: 'Ezekiel', fa: 'حزقیال', key: 'EZK' },
  '27': { en: 'Daniel', fa: 'دانیال', key: 'DAN' },
  '28': { en: 'Hosea', fa: 'هوشع', key: 'HOS' },
  '29': { en: 'Joel', fa: 'یوئیل', key: 'JOL' },
  '30': { en: 'Amos', fa: 'عاموس', key: 'AMO' },
  '31': { en: 'Obadiah', fa: 'عوبدیا', key: 'OBA' },
  '32': { en: 'Jonah', fa: 'یونس', key: 'JON' },
  '33': { en: 'Micah', fa: 'میکاه', key: 'MIC' },
  '34': { en: 'Nahum', fa: 'ناحوم', key: 'NAM' },
  '35': { en: 'Habakkuk', fa: 'حبقوق', key: 'HAB' },
  '36': { en: 'Zephaniah', fa: 'صفنیا', key: 'ZEP' },
  '37': { en: 'Haggai', fa: 'حجی', key: 'HAG' },
  '38': { en: 'Zechariah', fa: 'زکریا', key: 'ZEC' },
  '39': { en: 'Malachi', fa: 'ملاکی', key: 'MAL' },
  '40': { en: 'Matthew', fa: 'متی', key: 'MAT' },
  '41': { en: 'Mark', fa: 'مرقس', key: 'MRK' },
  '42': { en: 'Luke', fa: 'لوقا', key: 'LUK' },
  '43': { en: 'John', fa: 'یوحنا', key: 'JHN' },
  '44': { en: 'Acts', fa: 'اعمال رسولان', key: 'ACT' },
  '45': { en: 'Romans', fa: 'رومیان', key: 'ROM' },
  '46': { en: '1 Corinthians', fa: 'اول قرنتیان', key: '1CO' },
  '47': { en: '2 Corinthians', fa: 'دوم قرنتیان', key: '2CO' },
  '48': { en: 'Galatians', fa: 'غلاطیان', key: 'GAL' },
  '49': { en: 'Ephesians', fa: 'افسسیان', key: 'EPH' },
  '50': { en: 'Philippians', fa: 'فیلیپیان', key: 'PHP' },
  '51': { en: 'Colossians', fa: 'کولسیان', key: 'COL' },
  '52': { en: '1 Thessalonians', fa: 'اول تسالونیکیان', key: '1TH' },
  '53': { en: '2 Thessalonians', fa: 'دوم تسالونیکیان', key: '2TH' },
  '54': { en: '1 Timothy', fa: 'اول تیموتائوس', key: '1TI' },
  '55': { en: '2 Timothy', fa: 'دوم تیموتائوس', key: '2TI' },
  '56': { en: 'Titus', fa: 'تیتوس', key: 'TIT' },
  '57': { en: 'Philemon', fa: 'فلیمون', key: 'PHM' },
  '58': { en: 'Hebrews', fa: 'عبرانیان', key: 'HEB' },
  '59': { en: 'James', fa: 'یعقوب', key: 'JAS' },
  '60': { en: '1 Peter', fa: 'اول پطرس', key: '1PE' },
  '61': { en: '2 Peter', fa: 'دوم پطرس', key: '2PE' },
  '62': { en: '1 John', fa: 'اول یوحنا', key: '1JN' },
  '63': { en: '2 John', fa: 'دوم یوحنا', key: '2JN' },
  '64': { en: '3 John', fa: 'سوم یوحنا', key: '3JN' },
  '65': { en: 'Jude', fa: 'یهودا', key: 'JUD' },
  '66': { en: 'Revelation', fa: 'مکاشفه', key: 'REV' }
};

/**
 * تخمین مدت زمان
 */
function estimateDuration(wordCount) {
  const wordsPerMinute = 120;
  const durationSeconds = (wordCount / wordsPerMinute) * 60;
  return Math.max(30, Math.min(durationSeconds, 1800));
}

/**
 * تولید timing
 */
function generateTiming(bookCode, chapterNum, verses) {
  const words = [];
  const lines = [];
  
  // شمارش کل کلمات
  let totalWordCount = 0;
  const versesList = Object.entries(verses)
    .map(([num, text]) => ({ number: parseInt(num), text }))
    .sort((a, b) => a.number - b.number);
  
  versesList.forEach(verse => {
    const verseWords = verse.text.trim().split(/\s+/).filter(w => w.length > 0);
    totalWordCount += verseWords.length;
  });
  
  const totalDuration = estimateDuration(totalWordCount);
  
  let currentTime = 0;
  let wordCounter = 0;
  
  versesList.forEach((verse, verseIndex) => {
    const verseText = verse.text.trim();
    const verseWords = verseText.split(/\s+/).filter(w => w.length > 0);
    const verseWordCount = verseWords.length;
    
    const verseDuration = (verseWordCount / totalWordCount) * totalDuration;
    const wordDuration = verseDuration / verseWordCount;
    
    const lineStart = currentTime;
    const lineWords = [];
    
    verseWords.forEach((word) => {
      const wordStart = currentTime;
      const wordEnd = currentTime + wordDuration;
      
      const wordData = {
        word: word,
        start: parseFloat(wordStart.toFixed(2)),
        end: parseFloat(wordEnd.toFixed(2)),
        lineIndex: verseIndex,
        verseNum: verse.number
      };
      
      words.push(wordData);
      lineWords.push({
        word: word,
        start: wordData.start,
        end: wordData.end
      });
      
      currentTime += wordDuration;
      wordCounter++;
    });
    
    lines.push({
      line: verseText,
      verseNum: verse.number,
      start: parseFloat(lineStart.toFixed(2)),
      end: parseFloat(currentTime.toFixed(2)),
      words: lineWords
    });
  });
  
  const bookInfo = BOOK_NAMES[bookCode];
  
  return {
    metadata: {
      title: `${bookInfo.fa} ${chapterNum}`,
      titleEn: `${bookInfo.en} ${chapterNum}`,
      book: bookInfo.key,
      bookCode: bookCode,
      chapter: chapterNum,
      totalDuration: parseFloat(totalDuration.toFixed(2)),
      wordCount: wordCounter,
      verseCount: versesList.length,
      generatedAt: new Date().toISOString(),
      method: 'simple',
      description: 'Simple timing - Equal spacing based on word count'
    },
    words,
    lines
  };
}

/**
 * پردازش یک فصل
 */
function processChapter(bookCode, chapterNum) {
  const bookInfo = BOOK_NAMES[bookCode];
  if (!bookInfo) return null;
  
  const textFile = path.join(BIBLE_TEXT_DIR, bookCode, `${chapterNum}.json`);
  const timingFile = path.join(BIBLE_TIMING_DIR, `${bookInfo.key}_${chapterNum}_timing.json`);
  
  // بررسی وجود فایل متن
  if (!fs.existsSync(textFile)) {
    return { error: 'No text file' };
  }
  
  // بررسی وجود فایل تایمینگ
  if (fs.existsSync(timingFile) && !FORCE_OVERWRITE) {
    return { skipped: true };
  }
  
  try {
    const textData = JSON.parse(fs.readFileSync(textFile, 'utf8'));
    const verses = textData.verses;
    
    if (!verses || Object.keys(verses).length === 0) {
      return { error: 'No verses' };
    }
    
    const timingData = generateTiming(bookCode, chapterNum, verses);
    fs.writeFileSync(timingFile, JSON.stringify(timingData, null, 2), 'utf8');
    
    return {
      success: true,
      verses: timingData.metadata.verseCount,
      words: timingData.metadata.wordCount,
      duration: timingData.metadata.totalDuration
    };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Main
 */
function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║      📖 Generate Timing for ALL Bible Chapters (Local)       ║');
  console.log('║      از فایل‌های JSON محلی                                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`🔧 Configuration:`);
  console.log(`   Text Dir: ${BIBLE_TEXT_DIR}`);
  console.log(`   Output: ${BIBLE_TIMING_DIR}`);
  console.log(`   Overwrite: ${FORCE_OVERWRITE ? '✅ Yes' : '❌ No'}\n`);
  
  let totalSuccess = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  
  // پردازش همه کتاب‌ها
  const bookCodes = Object.keys(BOOK_NAMES);
  
  for (let i = 0; i < bookCodes.length; i++) {
    const bookCode = bookCodes[i];
    const bookInfo = BOOK_NAMES[bookCode];
    const bookDir = path.join(BIBLE_TEXT_DIR, bookCode);
    
    if (!fs.existsSync(bookDir)) {
      console.log(`⚠️ [${i+1}/66] ${bookInfo.fa} - No directory`);
      continue;
    }
    
    const chapters = fs.readdirSync(bookDir)
      .filter(f => f.endsWith('.json'))
      .map(f => parseInt(f.replace('.json', '')))
      .sort((a, b) => a - b);
    
    let bookSuccess = 0;
    let bookSkipped = 0;
    let bookFailed = 0;
    
    for (const chapterNum of chapters) {
      const result = processChapter(bookCode, chapterNum);
      
      if (result.success) {
        bookSuccess++;
        totalSuccess++;
      } else if (result.skipped) {
        bookSkipped++;
        totalSkipped++;
      } else {
        bookFailed++;
        totalFailed++;
      }
    }
    
    console.log(`📚 [${String(i+1).padStart(2)}/66] ${bookInfo.fa.padEnd(20)} ${chapters.length} chapters | ✅ ${bookSuccess} | ⏭️ ${bookSkipped} | ❌ ${bookFailed}`);
  }
  
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('📊 Final Summary:');
  console.log(`   ✅ Generated: ${totalSuccess}`);
  console.log(`   ⏭️ Skipped: ${totalSkipped}`);
  console.log(`   ❌ Failed: ${totalFailed}`);
  console.log(`   📁 Total: ${totalSuccess + totalSkipped + totalFailed}`);
  console.log('════════════════════════════════════════════════════════════════\n');
}

main();
