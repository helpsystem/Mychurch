#!/usr/bin/env node

/**
 * 📖 اسکریپت تولید Timing برای فصل‌های کتاب مقدس
 * 
 * این اسکریپت برای هر فصل کتاب مقدس یک فایل timing می‌سازد
 * با استفاده از الگوریتم Simple Timing (تقسیم یکنواخت زمان)
 * 
 * استفاده:
 *   node scripts/generate-bible-timing.cjs [bookKey] [chapter]
 *   node scripts/generate-bible-timing.cjs GEN 1          # فقط پیدایش فصل 1
 *   node scripts/generate-bible-timing.cjs GEN            # همه فصل‌های پیدایش
 *   node scripts/generate-bible-timing.cjs                # همه کتاب‌ها و فصل‌ها
 */

const fs = require('fs');
const path = require('path');

// مسیرها
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const BIBLE_DATA_DIR = path.join(PUBLIC_DIR, 'bible', 'data');
const BIBLE_AUDIO_DIR = path.join(PUBLIC_DIR, 'bible', 'audio');
const BIBLE_TIMING_DIR = path.join(BIBLE_DATA_DIR, 'timings');
const BIBLE_BOOKS_FILE = path.join(BIBLE_DATA_DIR, 'bible_books.json');

// ایجاد پوشه timing اگر وجود ندارد
if (!fs.existsSync(BIBLE_TIMING_DIR)) {
  fs.mkdirSync(BIBLE_TIMING_DIR, { recursive: true });
  console.log('✅ Created directory:', BIBLE_TIMING_DIR);
}

/**
 * تخمین مدت زمان یک فصل بر اساس تعداد کلمات
 * @param {number} wordCount - تعداد کلمات
 * @returns {number} - مدت زمان تقریبی به ثانیه
 */
function estimateDuration(wordCount) {
  // فرض: 120 کلمه در دقیقه (سرعت خواندن متوسط برای کتاب مقدس)
  const wordsPerMinute = 120;
  const durationMinutes = wordCount / wordsPerMinute;
  const durationSeconds = durationMinutes * 60;
  
  // حداقل 30 ثانیه، حداکثر 30 دقیقه
  return Math.max(30, Math.min(durationSeconds, 1800));
}

/**
 * تولید فایل timing برای یک فصل
 * @param {string} bookKey - کلید کتاب (مثلاً GEN، EXO)
 * @param {number} chapterNum - شماره فصل
 * @param {Array} verses - آرایه آیات با متن فارسی
 * @param {number} audioDuration - مدت زمان فایل صوتی (اختیاری)
 */
function generateChapterTiming(bookKey, chapterNum, verses, audioDuration = null) {
  const words = [];
  const lines = [];
  let wordCounter = 0;
  
  // محاسبه کل کلمات
  const totalWords = verses.reduce((sum, verse) => {
    const verseWords = verse.text.trim().split(/\s+/).filter(w => w.length > 0);
    return sum + verseWords.length;
  }, 0);
  
  // تعیین مدت زمان
  const totalDuration = audioDuration || estimateDuration(totalWords);
  
  // محاسبه مدت زمان هر آیه بر اساس تعداد کلمات
  let currentTime = 0;
  
  verses.forEach((verse, verseIndex) => {
    const verseText = verse.text.trim();
    const verseWords = verseText.split(/\s+/).filter(w => w.length > 0);
    const verseWordCount = verseWords.length;
    
    // مدت زمان این آیه بر اساس نسبت کلمات
    const verseDuration = (verseWordCount / totalWords) * totalDuration;
    const wordDuration = verseDuration / verseWordCount;
    
    const lineStart = currentTime;
    const lineWords = [];
    
    verseWords.forEach((word, wordIndex) => {
      const wordStart = currentTime;
      const wordEnd = currentTime + wordDuration;
      
      words.push({
        word: word,
        start: parseFloat(wordStart.toFixed(2)),
        end: parseFloat(wordEnd.toFixed(2)),
        lineIndex: verseIndex
      });
      
      lineWords.push({
        word: word,
        start: parseFloat(wordStart.toFixed(2)),
        end: parseFloat(wordEnd.toFixed(2))
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
  
  // ساخت متادیتا
  const metadata = {
    title: `${bookKey} ${chapterNum}`,
    book: bookKey,
    chapter: chapterNum,
    totalDuration: parseFloat(totalDuration.toFixed(2)),
    wordCount: wordCounter,
    verseCount: verses.length,
    generatedAt: new Date().toISOString(),
    method: 'simple',
    description: 'Simple timing - Equal spacing based on word count'
  };
  
  return {
    metadata,
    words,
    lines
  };
}

/**
 * ذخیره فایل timing
 */
function saveTimingFile(bookKey, chapterNum, timingData) {
  const filename = `${bookKey}_${chapterNum}_timing.json`;
  const filepath = path.join(BIBLE_TIMING_DIR, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(timingData, null, 2), 'utf8');
  console.log(`✅ Saved: ${filename} (${timingData.metadata.verseCount} verses, ${timingData.metadata.wordCount} words)`);
  
  return filepath;
}

/**
 * بارگذاری لیست کتاب‌ها
 */
function loadBibleBooks() {
  if (!fs.existsSync(BIBLE_BOOKS_FILE)) {
    console.error('❌ Bible books file not found:', BIBLE_BOOKS_FILE);
    return [];
  }
  
  const data = fs.readFileSync(BIBLE_BOOKS_FILE, 'utf8');
  return JSON.parse(data);
}

/**
 * بارگذاری آیات یک فصل از API
 */
async function loadChapterVerses(bookKey, chapterNum) {
  try {
    // استفاده از fetch برای Node.js 18+
    const fetch = (await import('node-fetch')).default;
    
    const API_URL = process.env.API_URL || 'http://localhost:3001';
    const url = `${API_URL}/api/bible/content/${bookKey}/${chapterNum}`;
    
    console.log(`   📡 Fetching from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
    
    console.log(`   ✅ Loaded ${verses.length} verses`);
    
    return verses;
    
  } catch (error) {
    console.error(`   ❌ Failed to load verses: ${error.message}`);
    return null;
  }
}

/**
 * پردازش یک فصل
 */
async function processChapter(bookKey, chapterNum) {
  console.log(`\n📖 Processing: ${bookKey} Chapter ${chapterNum}...`);
  
  // بررسی وجود فایل timing
  const timingFile = path.join(BIBLE_TIMING_DIR, `${bookKey}_${chapterNum}_timing.json`);
  if (fs.existsSync(timingFile)) {
    console.log(`   ⏭️  Skipping (already exists): ${path.basename(timingFile)}`);
    return { skipped: true };
  }
  
  // بارگذاری آیات
  const verses = await loadChapterVerses(bookKey, chapterNum);
  
  if (!verses || verses.length === 0) {
    console.log(`   ❌ No verses found for ${bookKey} ${chapterNum}`);
    return { error: 'No verses' };
  }
  
  // تولید timing
  const timingData = generateChapterTiming(bookKey, chapterNum, verses);
  
  // ذخیره فایل
  saveTimingFile(bookKey, chapterNum, timingData);
  
  return { success: true, verses: verses.length, words: timingData.metadata.wordCount };
}

/**
 * پردازش یک کتاب (همه فصل‌ها)
 */
async function processBook(bookKey) {
  const books = loadBibleBooks();
  const book = books.find(b => b.key === bookKey);
  
  if (!book) {
    console.error(`❌ Book not found: ${bookKey}`);
    return;
  }
  
  console.log(`\n📚 Processing book: ${book.name.fa} (${book.name.en})`);
  console.log(`   Chapters: ${book.chapters}`);
  
  const results = {
    success: 0,
    skipped: 0,
    failed: 0
  };
  
  for (let chapter = 1; chapter <= book.chapters; chapter++) {
    const result = await processChapter(bookKey, chapter);
    
    if (result.skipped) results.skipped++;
    else if (result.success) results.success++;
    else results.failed++;
  }
  
  console.log(`\n✅ Book completed: ${book.name.fa}`);
  console.log(`   Success: ${results.success}, Skipped: ${results.skipped}, Failed: ${results.failed}`);
  
  return results;
}

/**
 * پردازش همه کتاب‌ها
 */
async function processAllBooks() {
  const books = loadBibleBooks();
  
  console.log(`\n📚 Processing all ${books.length} books...`);
  
  const totalResults = {
    success: 0,
    skipped: 0,
    failed: 0
  };
  
  for (const book of books) {
    const results = await processBook(book.key);
    
    if (results) {
      totalResults.success += results.success;
      totalResults.skipped += results.skipped;
      totalResults.failed += results.failed;
    }
  }
  
  console.log(`\n🎉 All books completed!`);
  console.log(`   Success: ${totalResults.success}`);
  console.log(`   Skipped: ${totalResults.skipped}`);
  console.log(`   Failed: ${totalResults.failed}`);
  console.log(`   Total: ${totalResults.success + totalResults.skipped + totalResults.failed}`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   📖 Bible Chapter Timing Generator           ║');
  console.log('║   Simple Timing System (Equal Spacing)        ║');
  console.log('╚════════════════════════════════════════════════╝');
  
  if (args.length === 0) {
    // پردازش همه کتاب‌ها
    console.log('\n🔄 Mode: Generate timing for ALL books');
    await processAllBooks();
  } else if (args.length === 1) {
    // پردازش یک کتاب (همه فصل‌ها)
    const bookKey = args[0].toUpperCase();
    console.log(`\n🔄 Mode: Generate timing for book "${bookKey}"`);
    await processBook(bookKey);
  } else if (args.length === 2) {
    // پردازش یک فصل خاص
    const bookKey = args[0].toUpperCase();
    const chapterNum = parseInt(args[1]);
    console.log(`\n🔄 Mode: Generate timing for ${bookKey} Chapter ${chapterNum}`);
    await processChapter(bookKey, chapterNum);
  } else {
    console.error('\n❌ Invalid arguments!');
    console.log('\nUsage:');
    console.log('  node scripts/generate-bible-timing.cjs                    # All books');
    console.log('  node scripts/generate-bible-timing.cjs GEN                # All Genesis chapters');
    console.log('  node scripts/generate-bible-timing.cjs GEN 1              # Only Genesis chapter 1');
    process.exit(1);
  }
  
  console.log('\n✨ Done!\n');
}

// اجرای اسکریپت
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
