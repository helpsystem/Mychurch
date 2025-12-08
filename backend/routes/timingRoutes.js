const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

/**
 * 🎵 Generate Timing File for Worship Song
 * POST /api/timing/generate/:songId
 * 
 * این API برای ساخت فایل timing استفاده میشه
 * فعلاً به صورت simple timing میسازه (equal spacing)
 * بعداً با Whisper/Gemini AI واقعی میشه
 */
router.post('/generate/:songId', async (req, res) => {
  try {
    const { songId } = req.params;
    const { lyrics, title, artist, duration } = req.body;

    if (!lyrics || !songId) {
      return res.status(400).json({
        success: false,
        error: 'lyrics and songId are required'
      });
    }

    // Parse lyrics into lines
    const lines = lyrics.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('[') && !line.match(/^[A-G][#b]?m?[0-9]?/));

    if (lines.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid lyrics lines found'
      });
    }

    // Simple equal spacing timing
    const estimatedDuration = duration || (lines.length * 4); // 4 seconds per line average
    const timePerLine = estimatedDuration / lines.length;

    const timingLines = lines.map((line, index) => {
      const start = index * timePerLine;
      const end = (index + 1) * timePerLine;
      
      // Simple word timing (split by spaces)
      const words = line.split(/\s+/).filter(w => w.length > 0);
      const timePerWord = (end - start) / words.length;
      
      const wordTimings = words.map((word, wordIndex) => ({
        word: word,
        start: start + (wordIndex * timePerWord),
        end: start + ((wordIndex + 1) * timePerWord)
      }));

      return {
        line: line,
        start: parseFloat(start.toFixed(2)),
        end: parseFloat(end.toFixed(2)),
        words: wordTimings
      };
    });

    // Create timing data structure
    const timingData = {
      metadata: {
        title: title || 'Unknown',
        artist: artist || 'Unknown',
        totalDuration: parseFloat(estimatedDuration.toFixed(2)),
        wordCount: lines.join(' ').split(/\s+/).length,
        generatedAt: new Date().toISOString(),
        generationMethod: 'simple-equal-spacing',
        note: 'This is auto-generated timing. Use timing editor to adjust manually.'
      },
      lines: timingLines
    };

    // Save to file
    const timingDir = path.join(__dirname, '../../public/worship/data/timings');
    await fs.mkdir(timingDir, { recursive: true });
    
    const timingFilePath = path.join(timingDir, `song_${songId}_timing.json`);
    await fs.writeFile(timingFilePath, JSON.stringify(timingData, null, 2), 'utf-8');

    console.log(`✅ Generated timing for song ${songId}: ${timingLines.length} lines`);

    res.json({
      success: true,
      message: 'Timing file generated successfully',
      data: {
        songId,
        linesCount: timingLines.length,
        duration: estimatedDuration,
        filePath: `/worship/data/timings/song_${songId}_timing.json`,
        generationMethod: 'simple-equal-spacing'
      }
    });

  } catch (error) {
    console.error('❌ Error generating timing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate timing file',
      details: error.message
    });
  }
});

/**
 * 🎵 Batch Generate Timing for Multiple Songs
 * POST /api/timing/batch-generate
 * Body: { songIds: [1, 2, 3, ...] }
 */
router.post('/batch-generate', async (req, res) => {
  try {
    const { songs } = req.body; // Array of {id, lyrics, title, artist, duration}

    if (!Array.isArray(songs) || songs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'songs array is required'
      });
    }

    const results = {
      success: [],
      failed: []
    };

    for (const song of songs) {
      try {
        const { id, lyrics, title, artist, duration } = song;
        
        if (!lyrics || !id) {
          results.failed.push({ id, error: 'Missing lyrics or id' });
          continue;
        }

        // Parse lyrics
        const lines = lyrics.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.startsWith('[') && !line.match(/^[A-G][#b]?m?[0-9]?/));

        if (lines.length === 0) {
          results.failed.push({ id, error: 'No valid lyrics' });
          continue;
        }

        // Generate timing
        const estimatedDuration = duration || (lines.length * 4);
        const timePerLine = estimatedDuration / lines.length;

        const timingLines = lines.map((line, index) => {
          const start = index * timePerLine;
          const end = (index + 1) * timePerLine;
          
          const words = line.split(/\s+/).filter(w => w.length > 0);
          const timePerWord = (end - start) / words.length;
          
          const wordTimings = words.map((word, wordIndex) => ({
            word: word,
            start: start + (wordIndex * timePerWord),
            end: start + ((wordIndex + 1) * timePerWord)
          }));

          return {
            line: line,
            start: parseFloat(start.toFixed(2)),
            end: parseFloat(end.toFixed(2)),
            words: wordTimings
          };
        });

        const timingData = {
          metadata: {
            title: title || 'Unknown',
            artist: artist || 'Unknown',
            totalDuration: parseFloat(estimatedDuration.toFixed(2)),
            wordCount: lines.join(' ').split(/\s+/).length,
            generatedAt: new Date().toISOString(),
            generationMethod: 'simple-equal-spacing-batch'
          },
          lines: timingLines
        };

        // Save file
        const timingDir = path.join(__dirname, '../../public/worship/data/timings');
        await fs.mkdir(timingDir, { recursive: true });
        
        const timingFilePath = path.join(timingDir, `song_${id}_timing.json`);
        await fs.writeFile(timingFilePath, JSON.stringify(timingData, null, 2), 'utf-8');

        results.success.push({
          id,
          title,
          linesCount: timingLines.length
        });

      } catch (error) {
        results.failed.push({
          id: song.id,
          error: error.message
        });
      }
    }

    console.log(`✅ Batch generated: ${results.success.length} success, ${results.failed.length} failed`);

    res.json({
      success: true,
      message: 'Batch generation completed',
      results
    });

  } catch (error) {
    console.error('❌ Error in batch generation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to batch generate timing files',
      details: error.message
    });
  }
});

/**
 * 🎵 Delete Timing File
 * DELETE /api/timing/:songId
 */
router.delete('/:songId', async (req, res) => {
  try {
    const { songId } = req.params;
    const timingFilePath = path.join(__dirname, '../../public/worship/data/timings', `song_${songId}_timing.json`);
    
    await fs.unlink(timingFilePath);
    
    res.json({
      success: true,
      message: 'Timing file deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete timing file',
      details: error.message
    });
  }
});

/**
 * 🎵 Check if Timing Exists
 * GET /api/timing/check/:songId
 */
router.get('/check/:songId', async (req, res) => {
  try {
    const { songId } = req.params;
    const timingFilePath = path.join(__dirname, '../../public/worship/data/timings', `song_${songId}_timing.json`);
    
    try {
      await fs.access(timingFilePath);
      res.json({
        success: true,
        exists: true,
        path: `/worship/data/timings/song_${songId}_timing.json`
      });
    } catch {
      res.json({
        success: true,
        exists: false
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
