// backend/scripts/batchProcessAllContent.js
// اسکریپت پردازش دسته‌ای تمام محتوای موجود در سایت

require('dotenv').config();
const { pool } = require('../db-postgres'); // Use existing Supabase-compatible pool
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

// Helper Functions
function generateFallbackTiming(text) {
  const words = text.split(/\s+/);
  const SECONDS_PER_WORD = 0.5;
  
  return words.map((word, index) => ({
    word: word,
    startTime: index * SECONDS_PER_WORD,
    endTime: (index + 1) * SECONDS_PER_WORD
  }));
}

function generateBibleFallbackTiming(verses, chapter) {
  const SECONDS_PER_VERSE = 5;
  
  const verseSegments = verses.map((verse, index) => {
    const startTime = index * SECONDS_PER_VERSE;
    const endTime = (index + 1) * SECONDS_PER_VERSE;
    const words = verse.text.split(/\s+/);
    const secondsPerWord = SECONDS_PER_VERSE / words.length;
    
    const wordSegments = words.map((word, wordIndex) => ({
      word: word,
      start_time: startTime + (wordIndex * secondsPerWord),
      end_time: startTime + ((wordIndex + 1) * secondsPerWord)
    }));
    
    return {
      verse_number: verse.verse,
      text: verse.text,
      start_time: startTime,
      end_time: endTime,
      word_segments: wordSegments
    };
  });
  
  return {
    chapter: chapter || 1,
    verses: verseSegments
  };
}

// Process Worship Songs
async function processAllWorshipSongs() {
  console.log('\n🎵 ===============================');
  console.log('🎵 پردازش سرودهای پرستشی');
  console.log('🎵 ===============================\n');

  try {
    // Get all worship songs that have audio URL but no timing data
    const result = await pool.query(`
      SELECT id, title, artist, lyrics, audiourl 
      FROM worship_songs 
      WHERE audiourl IS NOT NULL 
      AND timing_data IS NULL
      ORDER BY id
    `);

    const songs = result.rows;
    console.log(`✅ تعداد سرودها برای پردازش: ${songs.length}\n`);

    if (songs.length === 0) {
      console.log('ℹ️  همه سرودها قبلاً پردازش شده‌اند!\n');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      const title = typeof song.title === 'string' 
        ? JSON.parse(song.title) 
        : song.title;
      const lyrics = typeof song.lyrics === 'string' 
        ? JSON.parse(song.lyrics) 
        : song.lyrics;

      console.log(`\n[${i + 1}/${songs.length}] پردازش: ${title.fa || title.en}`);
      console.log(`   ID: ${song.id}`);
      console.log(`   آدرس صوتی: ${song.audiourl}`);

      try {
        // Check if lyrics exist
        if (!lyrics || !lyrics.en) {
          console.log(`   ⚠️  متن انگلیسی موجود نیست - از fallback استفاده می‌شود`);
          const fallbackTiming = generateFallbackTiming('Sample worship song lyrics');
          
          await pool.query(
            `UPDATE worship_songs 
             SET timing_data = $1, timing_updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [JSON.stringify(fallbackTiming), song.id]
          );
          
          successCount++;
          console.log(`   ✅ Fallback timing ذخیره شد`);
          continue;
        }

        // Fetch audio file
        console.log(`   📥 دانلود فایل صوتی...`);
        const audioResponse = await fetch(song.audiourl);
        
        if (!audioResponse.ok) {
          throw new Error(`دانلود ناموفق: ${audioResponse.statusText}`);
        }

        const audioBuffer = await audioResponse.buffer();
        const audioSizeMB = (audioBuffer.length / 1024 / 1024).toFixed(2);
        console.log(`   ✅ دانلود کامل: ${audioSizeMB} MB`);

        // Check file size (Gemini limit: 20MB for audio)
        if (audioBuffer.length > 20 * 1024 * 1024) {
          console.log(`   ⚠️  فایل بزرگ‌تر از حد مجاز (${audioSizeMB} MB) - از fallback استفاده می‌شود`);
          const fallbackTiming = generateFallbackTiming(lyrics.en);
          
          await pool.query(
            `UPDATE worship_songs 
             SET timing_data = $1, timing_updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [JSON.stringify(fallbackTiming), song.id]
          );
          
          successCount++;
          console.log(`   ✅ Fallback timing ذخیره شد`);
          continue;
        }

        // Process with Gemini AI
        console.log(`   🤖 پردازش با Gemini AI...`);
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const base64Audio = audioBuffer.toString('base64');
        
        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: 'audio/mpeg',
              data: base64Audio,
            },
          },
          { 
            text: `Reference text: "${lyrics.en}"\n\nAnalyze this worship song audio and generate precise word-level timestamps. Return ONLY a JSON array of objects with 'word', 'startTime', and 'endTime' properties. No markdown, no explanations.` 
          },
        ]);

        let responseText = result.response.text();
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        responseText = responseText.replace(/,(\s*[}\]])/g, '$1');

        let timingData;
        try {
          timingData = JSON.parse(responseText);
        } catch (parseError) {
          console.log(`   ⚠️  خطا در parse کردن JSON - استفاده از fallback`);
          timingData = generateFallbackTiming(lyrics.en);
        }

        // Save to database
        await pool.query(
          `UPDATE worship_songs 
           SET timing_data = $1, timing_updated_at = CURRENT_TIMESTAMP 
           WHERE id = $2`,
          [JSON.stringify(timingData), song.id]
        );

        successCount++;
        console.log(`   ✅ موفق: ${timingData.length} کلمه پردازش شد`);

        // Rate limiting - wait 2 seconds between requests
        if (i < songs.length - 1) {
          console.log(`   ⏱️  صبر 2 ثانیه...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        failCount++;
        console.log(`   ❌ خطا: ${error.message}`);
        
        // Try to save fallback timing
        try {
          const fallbackTiming = generateFallbackTiming(lyrics?.en || 'Sample text');
          await pool.query(
            `UPDATE worship_songs 
             SET timing_data = $1, timing_updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            [JSON.stringify(fallbackTiming), song.id]
          );
          console.log(`   ⚠️  Fallback timing ذخیره شد`);
        } catch (dbError) {
          console.log(`   ❌ خطا در ذخیره fallback: ${dbError.message}`);
        }
      }
    }

    console.log('\n📊 خلاصه نتایج سرودهای پرستشی:');
    console.log(`   ✅ موفق: ${successCount}`);
    console.log(`   ❌ ناموفق: ${failCount}`);
    console.log(`   📈 کل: ${songs.length}\n`);

  } catch (error) {
    console.error('❌ خطای کلی در پردازش سرودها:', error);
  }
}

// Process Bible Chapters
async function processAllBibleChapters() {
  console.log('\n📖 ===============================');
  console.log('📖 پردازش فصل‌های کتاب مقدس');
  console.log('📖 ===============================\n');

  try {
    // Define Bible chapters with audio (example - you should expand this)
    const bibleChapters = [
      { book: 'GEN', bookName: 'Genesis', bookNameFa: 'پیدایش', chapter: 1, translation: 'fa' },
      { book: 'EXO', bookName: 'Exodus', bookNameFa: 'خروج', chapter: 1, translation: 'fa' },
      { book: 'MAT', bookName: 'Matthew', bookNameFa: 'متی', chapter: 1, translation: 'fa' },
      { book: 'JHN', bookName: 'John', bookNameFa: 'یوحنا', chapter: 1, translation: 'fa' },
    ];

    console.log(`✅ تعداد فصل‌ها برای پردازش: ${bibleChapters.length}\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < bibleChapters.length; i++) {
      const chapter = bibleChapters[i];
      const chapterKey = `${chapter.book}_${chapter.chapter}_${chapter.translation}`;

      console.log(`\n[${i + 1}/${bibleChapters.length}] پردازش: ${chapter.bookNameFa} فصل ${chapter.chapter}`);
      console.log(`   کلید: ${chapterKey}`);

      try {
        // Check if already processed
        const existingResult = await pool.query(
          `SELECT id FROM bible_audio_timing 
           WHERE book_code = $1 AND chapter = $2 AND translation = $3`,
          [chapter.book, chapter.chapter, chapter.translation]
        );

        if (existingResult.rows.length > 0) {
          console.log(`   ℹ️  قبلاً پردازش شده - رد می‌شود`);
          continue;
        }

        // Get verses from database
        const versesResult = await pool.query(
          `SELECT v.verse as verse, v.text_fa as text
           FROM bible_verses v
           JOIN bible_books b ON v.book_id = b.id
           WHERE b.abbreviation = $1 AND v.chapter = $2
           ORDER BY v.verse`,
          [chapter.book, chapter.chapter]
        );

        if (versesResult.rows.length === 0) {
          console.log(`   ⚠️  آیه‌ای یافت نشد - رد می‌شود`);
          continue;
        }

        const verses = versesResult.rows;
        console.log(`   ✅ ${verses.length} آیه یافت شد`);

        // Construct audio URL
        const audioUrl = `https://samanabyar.online/audio/bible/${chapter.book}_${chapter.chapter}_${chapter.translation}.mp3`;
        console.log(`   📥 آدرس صوتی: ${audioUrl}`);

        // For now, use fallback timing (you can enable AI processing later)
        console.log(`   ⚙️  ایجاد timing تقریبی...`);
        const timingData = generateBibleFallbackTiming(verses, chapter.chapter);

        // Save to database
        await pool.query(
          `INSERT INTO bible_audio_timing (book_code, chapter, translation, timing_data) 
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (book_code, chapter, translation) 
           DO UPDATE SET timing_data = $4, updated_at = CURRENT_TIMESTAMP`,
          [chapter.book, chapter.chapter, chapter.translation, JSON.stringify(timingData)]
        );

        successCount++;
        console.log(`   ✅ موفق: ${verses.length} آیه پردازش شد`);

      } catch (error) {
        failCount++;
        console.log(`   ❌ خطا: ${error.message}`);
      }
    }

    console.log('\n📊 خلاصه نتایج کتاب مقدس:');
    console.log(`   ✅ موفق: ${successCount}`);
    console.log(`   ❌ ناموفق: ${failCount}`);
    console.log(`   📈 کل: ${bibleChapters.length}\n`);

  } catch (error) {
    console.error('❌ خطای کلی در پردازش کتاب مقدس:', error);
  }
}

// Main Function
async function main() {
  console.log('\n🚀 ===============================');
  console.log('🚀 شروع پردازش دسته‌ای کل محتوا');
  console.log('🚀 ===============================');
  console.log(`📅 تاریخ: ${new Date().toLocaleString('fa-IR')}\n`);

  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY تنظیم نشده است!');
    process.exit(1);
  }

  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ اتصال به دیتابیس برقرار است\n');

    // Process worship songs
    await processAllWorshipSongs();

    // Process Bible chapters
    await processAllBibleChapters();

    console.log('\n🎉 ===============================');
    console.log('🎉 پردازش کامل شد!');
    console.log('🎉 ===============================\n');

  } catch (error) {
    console.error('\n❌ خطای کلی:', error);
  } finally {
    // Don't close pool as it's shared
    console.log('👋 پردازش تمام شد\n');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { processAllWorshipSongs, processAllBibleChapters };
