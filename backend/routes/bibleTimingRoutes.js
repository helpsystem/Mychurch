const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// مسیرها
const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');
const BIBLE_TIMING_DIR = path.join(PUBLIC_DIR, 'bible', 'data', 'timings');

// ایجاد پوشه timing اگر وجود ندارد
if (!fs.existsSync(BIBLE_TIMING_DIR)) {
  fs.mkdirSync(BIBLE_TIMING_DIR, { recursive: true });
}

/**
 * تخمین مدت زمان بر اساس تعداد کلمات
 */
function estimateDuration(wordCount) {
  const wordsPerMinute = 120; // سرعت خواندن متوسط
  const durationSeconds = (wordCount / wordsPerMinute) * 60;
  return Math.max(30, Math.min(durationSeconds, 1800)); // 30 ثانیه تا 30 دقیقه
}

/**
 * تولید timing ساده برای یک فصل
 */
function generateSimpleTiming(bookKey, chapterNum, verses, audioDuration = null) {
  const words = [];
  const lines = [];
  
  // محاسبه کل کلمات
  const totalWords = verses.reduce((sum, verse) => {
    const verseWords = verse.text.trim().split(/\s+/).filter(w => w.length > 0);
    return sum + verseWords.length;
  }, 0);
  
  // تعیین مدت زمان
  const totalDuration = audioDuration || estimateDuration(totalWords);
  
  let currentTime = 0;
  let wordCounter = 0;
  
  verses.forEach((verse, verseIndex) => {
    const verseText = verse.text.trim();
    const verseWords = verseText.split(/\s+/).filter(w => w.length > 0);
    const verseWordCount = verseWords.length;
    
    // مدت زمان این آیه بر اساس نسبت کلمات
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
 * POST /api/bible-timing/generate/:bookKey/:chapter
 * تولید فایل timing برای یک فصل
 */
router.post('/generate/:bookKey/:chapter', async (req, res) => {
  try {
    const { bookKey, chapter } = req.params;
    const { verses, audioDuration } = req.body;
    
    if (!bookKey || !chapter) {
      return res.status(400).json({
        success: false,
        error: 'Book key and chapter are required'
      });
    }
    
    if (!verses || !Array.isArray(verses) || verses.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Verses array is required'
      });
    }
    
    console.log(`📖 Generating timing for ${bookKey} ${chapter} (${verses.length} verses)...`);
    
    // تولید timing
    const timingData = generateSimpleTiming(
      bookKey.toUpperCase(),
      parseInt(chapter),
      verses,
      audioDuration
    );
    
    // ذخیره فایل
    const filename = `${bookKey.toUpperCase()}_${chapter}_timing.json`;
    const filepath = path.join(BIBLE_TIMING_DIR, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(timingData, null, 2), 'utf8');
    
    console.log(`✅ Timing saved: ${filename}`);
    
    res.json({
      success: true,
      message: 'Timing generated successfully',
      data: {
        filename,
        path: `/bible/data/timings/${filename}`,
        metadata: timingData.metadata
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating timing:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/bible-timing/check/:bookKey/:chapter
 * بررسی وجود فایل timing
 */
router.get('/check/:bookKey/:chapter', (req, res) => {
  try {
    const { bookKey, chapter } = req.params;
    const filename = `${bookKey.toUpperCase()}_${chapter}_timing.json`;
    const filepath = path.join(BIBLE_TIMING_DIR, filename);
    
    const exists = fs.existsSync(filepath);
    
    if (exists) {
      const data = fs.readFileSync(filepath, 'utf8');
      const timing = JSON.parse(data);
      
      res.json({
        success: true,
        exists: true,
        data: {
          filename,
          path: `/bible/data/timings/${filename}`,
          metadata: timing.metadata
        }
      });
    } else {
      res.json({
        success: true,
        exists: false,
        message: 'Timing file not found'
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking timing:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/bible-timing/delete/:bookKey/:chapter
 * حذف فایل timing
 */
router.delete('/delete/:bookKey/:chapter', (req, res) => {
  try {
    const { bookKey, chapter } = req.params;
    const filename = `${bookKey.toUpperCase()}_${chapter}_timing.json`;
    const filepath = path.join(BIBLE_TIMING_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        error: 'Timing file not found'
      });
    }
    
    fs.unlinkSync(filepath);
    
    console.log(`🗑️  Deleted timing: ${filename}`);
    
    res.json({
      success: true,
      message: 'Timing file deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Error deleting timing:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/bible-timing/list
 * لیست همه فایل‌های timing
 */
router.get('/list', (req, res) => {
  try {
    if (!fs.existsSync(BIBLE_TIMING_DIR)) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const files = fs.readdirSync(BIBLE_TIMING_DIR)
      .filter(file => file.endsWith('_timing.json'))
      .map(file => {
        const filepath = path.join(BIBLE_TIMING_DIR, file);
        const data = fs.readFileSync(filepath, 'utf8');
        const timing = JSON.parse(data);
        
        return {
          filename: file,
          path: `/bible/data/timings/${file}`,
          ...timing.metadata
        };
      });
    
    res.json({
      success: true,
      count: files.length,
      data: files
    });
    
  } catch (error) {
    console.error('❌ Error listing timings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/bible-timing/batch-generate
 * تولید timing برای چند فصل به صورت batch
 */
router.post('/batch-generate', async (req, res) => {
  try {
    const { chapters } = req.body; // Array of { bookKey, chapter, verses }
    
    if (!chapters || !Array.isArray(chapters)) {
      return res.status(400).json({
        success: false,
        error: 'Chapters array is required'
      });
    }
    
    console.log(`📖 Batch generating timing for ${chapters.length} chapters...`);
    
    const results = [];
    
    for (const chapterData of chapters) {
      try {
        const { bookKey, chapter, verses, audioDuration } = chapterData;
        
        // تولید timing
        const timingData = generateSimpleTiming(
          bookKey.toUpperCase(),
          parseInt(chapter),
          verses,
          audioDuration
        );
        
        // ذخیره فایل
        const filename = `${bookKey.toUpperCase()}_${chapter}_timing.json`;
        const filepath = path.join(BIBLE_TIMING_DIR, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(timingData, null, 2), 'utf8');
        
        results.push({
          success: true,
          bookKey,
          chapter,
          filename,
          metadata: timingData.metadata
        });
        
        console.log(`  ✅ ${bookKey} ${chapter}`);
        
      } catch (error) {
        console.error(`  ❌ ${chapterData.bookKey} ${chapterData.chapter}:`, error.message);
        results.push({
          success: false,
          bookKey: chapterData.bookKey,
          chapter: chapterData.chapter,
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`✅ Batch complete: ${successCount} success, ${failCount} failed`);
    
    res.json({
      success: true,
      message: `Generated ${successCount} timing files`,
      stats: {
        total: chapters.length,
        success: successCount,
        failed: failCount
      },
      results
    });
    
  } catch (error) {
    console.error('❌ Error in batch generation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
