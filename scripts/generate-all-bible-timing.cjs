#!/usr/bin/env node

/**
 * 📖 تولید Timing برای همه 1189 فصل کتاب مقدس
 * 
 * این اسکریپت به صورت خودکار:
 * 1. همه 66 کتاب را از API می‌خواند
 * 2. برای هر کتاب، همه فصل‌ها را پردازش می‌کند
 * 3. فایل timing تولید و ذخیره می‌کند
 * 4. گزارش کامل نمایش می‌دهد
 * 
 * پیش‌نیاز: Backend باید روشن باشد (port 3001)
 * 
 * استفاده:
 *   node scripts/generate-all-bible-timing.cjs [--force] [--test]
 *   
 * گزینه‌ها:
 *   --force    بازنویسی فایل‌های موجود
 *   --test     فقط 5 کتاب اول (برای تست)
 *   --ot       فقط عهد عتیق (39 کتاب)
 *   --nt       فقط عهد جدید (27 کتاب)
 */

const fs = require('fs');
const path = require('path');

// مسیرها
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const BIBLE_TIMING_DIR = path.join(PUBLIC_DIR, 'bible', 'data', 'timings');

// تنظیمات
const API_URL = process.env.API_URL || 'http://localhost:3001';
const DELAY_BETWEEN_REQUESTS = 100; // میلی‌ثانیه (برای جلوگیری از rate limit)

// ایجاد پوشه timing
if (!fs.existsSync(BIBLE_TIMING_DIR)) {
  fs.mkdirSync(BIBLE_TIMING_DIR, { recursive: true });
}

// پارس آرگومان‌ها
const args = process.argv.slice(2);
const FORCE_OVERWRITE = args.includes('--force');
const TEST_MODE = args.includes('--test');
const ONLY_OT = args.includes('--ot');
const ONLY_NT = args.includes('--nt');

/**
 * تاخیر (sleep)
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
function generateSimpleTiming(bookKey, chapterNum, verses) {
  const words = [];
  const lines = [];
  
  const totalWords = verses.reduce((sum, verse) => {
    const verseWords = verse.text.trim().split(/\s+/).filter(w => w.length > 0);
    return sum + verseWords.length;
  }, 0);
  
  const totalDuration = estimateDuration(totalWords);
  
  let currentTime = 0;
  let wordCounter = 0;
  
  verses.forEach((verse, verseIndex) => {
    const verseText = verse.text.trim();
    const verseWords = verseText.split(/\s+/).filter(w => w.length > 0);
    const verseWordCount = verseWords.length;
    
    const verseDuration = (verseWordCount / totalWords) * totalDuration;
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
        lineIndex: verseIndex
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
      start: parseFloat(lineStart.toFixed(2)),
      end: parseFloat(currentTime.toFixed(2)),
      words: lineWords
    });
  });
  
  return {
    metadata: {
      title: `${bookKey} ${chapterNum}`,
      book: bookKey,
      chapter: chapterNum,
      totalDuration: parseFloat(totalDuration.toFixed(2)),
      wordCount: wordCounter,
      verseCount: verses.length,
      generatedAt: new Date().toISOString(),
      method: 'simple',
      description: 'Simple timing - Equal spacing based on word count'
    },
    words,
    lines
  };
}

/**
 * بارگذاری لیست کتاب‌ها از API
 */
async function loadBibleBooks() {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${API_URL}/api/bible/books`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.books) {
      throw new Error('Invalid API response');
    }
    
    return data.books;
    
  } catch (error) {
    console.error('❌ Failed to load books from API:', error.message);
    console.error('   Make sure backend is running on', API_URL);
    process.exit(1);
  }
}

/**
 * بارگذاری آیات یک فصل از API
 */
async function loadChapterVerses(bookKey, chapterNum) {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${API_URL}/api/bible/content/${bookKey}/${chapterNum}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.verses || !data.verses.fa) {
      throw new Error('Invalid API response');
    }
    
    // فیلتر کردن null values و map کردن به فرمت مورد نیاز
    const verses = data.verses.fa
      .filter(text => text && typeof text === 'string' && text.trim()) // ابتدا null و empty را حذف می‌کنیم
      .map((text, index) => ({
        number: index + 1,
        text: text.trim()
      }));
    
    return verses;
    
  } catch (error) {
    console.error(`   ❌ Failed to load verses: ${error.message}`);
    return null;
  }
}

/**
 * پردازش یک فصل
 */
async function processChapter(bookKey, chapterNum, bookName) {
  const timingFile = path.join(BIBLE_TIMING_DIR, `${bookKey}_${chapterNum}_timing.json`);
  
  // بررسی وجود فایل
  if (fs.existsSync(timingFile) && !FORCE_OVERWRITE) {
    return { skipped: true };
  }
  
  // بارگذاری آیات
  const verses = await loadChapterVerses(bookKey, chapterNum);
  
  if (!verses || verses.length === 0) {
    return { error: 'No verses' };
  }
  
  // تولید timing
  const timingData = generateSimpleTiming(bookKey, chapterNum, verses);
  
  // ذخیره فایل
  fs.writeFileSync(timingFile, JSON.stringify(timingData, null, 2), 'utf8');
  
  return { 
    success: true, 
    verses: verses.length, 
    words: timingData.metadata.wordCount,
    duration: timingData.metadata.totalDuration
  };
}

/**
 * پردازش یک کتاب
 */
async function processBook(book, bookIndex, totalBooks) {
  const { key, name, chapters } = book;
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📖 [${bookIndex}/${totalBooks}] ${name.fa} (${name.en})`);
  console.log(`   Key: ${key}, Chapters: ${chapters}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  const results = {
    success: 0,
    skipped: 0,
    failed: 0,
    totalVerses: 0,
    totalWords: 0,
    totalDuration: 0
  };
  
  for (let chapter = 1; chapter <= chapters; chapter++) {
    process.stdout.write(`   Ch ${chapter.toString().padStart(3)}/${chapters} ... `);
    
    const result = await processChapter(key, chapter, name.fa);
    
    if (result.skipped) {
      console.log('⏭️  Skipped (exists)');
      results.skipped++;
    } else if (result.success) {
      console.log(`✅ ${result.verses}v, ${result.words}w, ${result.duration.toFixed(0)}s`);
      results.success++;
      results.totalVerses += result.verses;
      results.totalWords += result.words;
      results.totalDuration += result.duration;
    } else {
      console.log(`❌ ${result.error}`);
      results.failed++;
    }
    
    // تاخیر برای جلوگیری از rate limit
    await sleep(DELAY_BETWEEN_REQUESTS);
  }
  
  console.log(`\n✅ Book completed: ${name.fa}`);
  console.log(`   Success: ${results.success}, Skipped: ${results.skipped}, Failed: ${results.failed}`);
  console.log(`   Total: ${results.totalVerses} verses, ${results.totalWords} words, ${(results.totalDuration / 60).toFixed(1)} min`);
  
  return results;
}

/**
 * Main function
 */
async function main() {
  const startTime = Date.now();
  
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║      📖 Generate Timing for ALL Bible Chapters              ║');
  console.log('║      Simple Timing System (Equal Spacing)                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🔧 Configuration:`);
  console.log(`   API URL: ${API_URL}`);
  console.log(`   Output: ${BIBLE_TIMING_DIR}`);
  console.log(`   Mode: ${TEST_MODE ? '🧪 TEST (5 books)' : '🚀 FULL (all books)'}`);
  console.log(`   Overwrite: ${FORCE_OVERWRITE ? '✅ Yes' : '❌ No (skip existing)'}`);
  console.log(`   Testament: ${ONLY_OT ? '📜 OT only' : ONLY_NT ? '📕 NT only' : '📚 Both'}`);
  console.log('');
  
  // بارگذاری کتاب‌ها
  console.log('📚 Loading Bible books from API...');
  let books = await loadBibleBooks();
  console.log(`✅ Loaded ${books.length} books`);
  
  // فیلتر بر اساس عهد
  if (ONLY_OT) {
    books = books.filter(b => b.testament === 'OT');
    console.log(`📜 Filtered to ${books.length} Old Testament books`);
  } else if (ONLY_NT) {
    books = books.filter(b => b.testament === 'NT');
    console.log(`📕 Filtered to ${books.length} New Testament books`);
  }
  
  // حالت تست
  if (TEST_MODE) {
    books = books.slice(0, 5);
    console.log(`🧪 TEST MODE: Processing only ${books.length} books`);
  }
  
  const totalBooks = books.length;
  const totalChapters = books.reduce((sum, book) => sum + book.chapters, 0);
  
  console.log(`\n🎯 Target: ${totalBooks} books, ${totalChapters} chapters\n`);
  
  // آمار کلی
  const grandTotal = {
    success: 0,
    skipped: 0,
    failed: 0,
    totalVerses: 0,
    totalWords: 0,
    totalDuration: 0
  };
  
  // پردازش هر کتاب
  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    const results = await processBook(book, i + 1, totalBooks);
    
    grandTotal.success += results.success;
    grandTotal.skipped += results.skipped;
    grandTotal.failed += results.failed;
    grandTotal.totalVerses += results.totalVerses;
    grandTotal.totalWords += results.totalWords;
    grandTotal.totalDuration += results.totalDuration;
  }
  
  // گزارش نهایی
  const endTime = Date.now();
  const elapsedSeconds = (endTime - startTime) / 1000;
  
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    🎉 GENERATION COMPLETE                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📊 Statistics:');
  console.log(`   ✅ Success:   ${grandTotal.success} chapters`);
  console.log(`   ⏭️  Skipped:   ${grandTotal.skipped} chapters`);
  console.log(`   ❌ Failed:    ${grandTotal.failed} chapters`);
  console.log(`   📖 Total:     ${grandTotal.success + grandTotal.skipped + grandTotal.failed} chapters`);
  console.log('');
  console.log('📈 Content:');
  console.log(`   📝 Verses:    ${grandTotal.totalVerses.toLocaleString()}`);
  console.log(`   🔤 Words:     ${grandTotal.totalWords.toLocaleString()}`);
  console.log(`   ⏱️  Duration:  ${(grandTotal.totalDuration / 3600).toFixed(1)} hours`);
  console.log('');
  console.log('⏱️  Performance:');
  console.log(`   Time:        ${elapsedSeconds.toFixed(1)}s`);
  console.log(`   Speed:       ${(grandTotal.success / elapsedSeconds).toFixed(2)} chapters/sec`);
  console.log('');
  console.log('📁 Output:');
  console.log(`   Directory:   ${BIBLE_TIMING_DIR}`);
  console.log(`   Files:       ${grandTotal.success} JSON files`);
  
  const totalFiles = fs.readdirSync(BIBLE_TIMING_DIR).filter(f => f.endsWith('_timing.json')).length;
  console.log(`   Total files: ${totalFiles} in directory`);
  console.log('');
  
  if (grandTotal.failed > 0) {
    console.log('⚠️  Warning: Some chapters failed. Check the logs above.');
  }
  
  console.log('✨ Done! You can now use the timing files in your app.\n');
}

// اجرا
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  console.error(error.stack);
  process.exit(1);
});
