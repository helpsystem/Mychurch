// downloadRoutes.js
// ============================================================
// API Routes for WordProject Audio Downloads
// ============================================================
// Endpoints:
//   POST /api/downloads/start - Start download(s)
//   GET  /api/downloads/status - Get queue status
//   GET  /api/downloads/:id - Get specific download status
//   DELETE /api/downloads/:id - Cancel download
//   POST /api/downloads/clear - Clear completed downloads
//   POST /api/downloads/stop - Stop all downloads
// ============================================================

const express = require('express');
const router = express.Router();
const WordProjectDownloader = require('../services/wordProjectDownloader');
const path = require('path');

// Create singleton downloader instance
const outputDir = path.join(__dirname, '../../public/audio/bible/wordproject');
const downloader = new WordProjectDownloader(outputDir);

// Track download history
const downloadHistory = [];

// Event listeners
downloader.on('queued', (data) => {
  console.log(`📥 Queued: ${data.book} ${data.chapter}`);
  downloadHistory.push({ ...data, event: 'queued', timestamp: Date.now() });
});

downloader.on('started', (data) => {
  console.log(`🔄 Started: ${data.book} ${data.chapter}`);
  downloadHistory.push({ ...data, event: 'started', timestamp: Date.now() });
});

downloader.on('progress', (data) => {
  // Only log every 25% to avoid spam
  if (data.progress % 25 === 0) {
    console.log(`⏳ Progress: ${data.book} ${data.chapter} - ${data.progress}%`);
  }
});

downloader.on('success', (data) => {
  console.log(`✅ Success: ${data.book} ${data.chapter}`);
  downloadHistory.push({ ...data, event: 'success', timestamp: Date.now() });
});

downloader.on('failed', (data) => {
  console.log(`❌ Failed: ${data.book} ${data.chapter} - ${data.error}`);
  downloadHistory.push({ ...data, event: 'failed', timestamp: Date.now() });
});

downloader.on('retry', (data) => {
  console.log(`🔁 Retry: ${data.book} ${data.chapter} - Attempt ${data.attempt}`);
  downloadHistory.push({ ...data, event: 'retry', timestamp: Date.now() });
});

downloader.on('skipped', (data) => {
  console.log(`⏭️ Skipped: ${data.book} ${data.chapter} - ${data.reason}`);
});

downloader.on('completed', () => {
  console.log('🎉 All downloads completed!');
});

// ============================================================
// POST /api/downloads/start
// Start one or more downloads
// Body: { book, chapter } or { jobs: [{book, chapter}, ...] }
// ============================================================
router.post('/start', async (req, res) => {
  try {
    const { book, chapter, jobs, priority, force } = req.body;

    if (!book && !jobs) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: book/chapter or jobs array',
      });
    }

    const options = { priority: priority || 0, force: force || false };

    if (jobs && Array.isArray(jobs)) {
      // Batch download
      const results = await downloader.addBatch(jobs, options);
      return res.json({
        success: true,
        message: `Added ${jobs.length} downloads to queue`,
        results,
        status: downloader.getStatus(),
      });
    } else {
      // Single download
      const result = await downloader.addToQueue(book, chapter, options);
      return res.json({
        success: true,
        message: result.skipped ? 'Download skipped' : 'Download queued',
        result,
        status: downloader.getStatus(),
      });
    }
  } catch (error) {
    console.error('Download start error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// GET /api/downloads/status
// Get current queue status
// ============================================================
router.get('/status', (req, res) => {
  try {
    const status = downloader.getStatus();
    res.json({
      success: true,
      status,
      history: downloadHistory.slice(-50), // Last 50 events
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// GET /api/downloads/:id
// Get specific download status
// ============================================================
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const status = downloader.getStatus();
    const job = status.jobs.find(j => j.id === id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Download not found',
      });
    }

    // Get history for this job
    const jobHistory = downloadHistory.filter(h => h.id === id);

    res.json({
      success: true,
      job,
      history: jobHistory,
    });
  } catch (error) {
    console.error('Job status error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// DELETE /api/downloads/:id
// Cancel a download
// ============================================================
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const cancelled = downloader.cancel(id);

    if (!cancelled) {
      return res.status(404).json({
        success: false,
        error: 'Download not found or already completed',
      });
    }

    res.json({
      success: true,
      message: 'Download cancelled',
      status: downloader.getStatus(),
    });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// POST /api/downloads/clear
// Clear completed downloads from history
// ============================================================
router.post('/clear', (req, res) => {
  try {
    downloader.clearCompleted();
    downloadHistory.length = 0; // Clear history

    res.json({
      success: true,
      message: 'Completed downloads cleared',
    });
  } catch (error) {
    console.error('Clear error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// POST /api/downloads/stop
// Stop all downloads
// ============================================================
router.post('/stop', (req, res) => {
  try {
    downloader.stop();

    res.json({
      success: true,
      message: 'All downloads stopped',
      status: downloader.getStatus(),
    });
  } catch (error) {
    console.error('Stop error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
