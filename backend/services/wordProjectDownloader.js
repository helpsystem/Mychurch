// wordProjectDownloader.js
// ============================================================
// WordProject Audio Downloader Service
// ============================================================
// Downloads Bible audio files from WordProject CDN
// Features:
//   - Queue management with priority
//   - Concurrent downloads (max 3)
//   - Retry logic with exponential backoff
//   - Progress tracking
//   - Error handling and recovery
// ============================================================

const axios = require('axios');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

// Book code to WordProject number mapping
const BOOK_TO_NUMBER = {
  'GEN': 1, 'EXO': 2, 'LEV': 3, 'NUM': 4, 'DEU': 5, 'JOS': 6, 'JDG': 7, 'RUT': 8,
  '1SA': 9, '2SA': 10, '1KI': 11, '2KI': 12, '1CH': 13, '2CH': 14, 'EZR': 15, 'NEH': 16,
  'EST': 17, 'JOB': 18, 'PSA': 19, 'PRO': 20, 'ECC': 21, 'SNG': 22, 'ISA': 23, 'JER': 24,
  'LAM': 25, 'EZK': 26, 'DAN': 27, 'HOS': 28, 'JOL': 29, 'AMO': 30, 'OBA': 31, 'JON': 32,
  'MIC': 33, 'NAM': 34, 'HAB': 35, 'ZEP': 36, 'HAG': 37, 'ZEC': 38, 'MAL': 39,
  'MAT': 40, 'MRK': 41, 'LUK': 42, 'JHN': 43, 'ACT': 44, 'ROM': 45, '1CO': 46, '2CO': 47,
  'GAL': 48, 'EPH': 49, 'PHP': 50, 'COL': 51, '1TH': 52, '2TH': 53, '1TI': 54, '2TI': 55,
  'TIT': 56, 'PHM': 57, 'HEB': 58, 'JAS': 59, '1PE': 60, '2PE': 61, '1JN': 62, '2JN': 63,
  '3JN': 64, 'JUD': 65, 'REV': 66
};

class WordProjectDownloader extends EventEmitter {
  constructor(outputDir) {
    super();
    this.outputDir = outputDir || path.join(__dirname, '../../public/audio/bible/wordproject');
    this.queue = [];
    this.activeDownloads = new Map();
    this.maxConcurrent = 3;
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 seconds
    this.isProcessing = false;
  }

  /**
   * Generate WordProject CDN URL
   */
  generateCDNUrl(book, chapter) {
    const bookNum = BOOK_TO_NUMBER[book.toUpperCase()];
    if (!bookNum) {
      throw new Error(`Invalid book code: ${book}`);
    }
    return `https://www.wordproject.org/bibles/audio_fa/${bookNum}/${chapter}.mp3`;
  }

  /**
   * Get output file path
   */
  getOutputPath(book, chapter) {
    const bookNum = BOOK_TO_NUMBER[book.toUpperCase()];
    const bookDir = path.join(this.outputDir, bookNum.toString());
    return path.join(bookDir, `${chapter}.mp3`);
  }

  /**
   * Check if file already exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Add download job to queue
   */
  async addToQueue(book, chapter, options = {}) {
    const id = `${book}_${chapter}`;
    const outputPath = this.getOutputPath(book, chapter);

    // Check if already exists
    if (!options.force && await this.fileExists(outputPath)) {
      this.emit('skipped', { id, book, chapter, reason: 'exists' });
      return { success: true, skipped: true };
    }

    // Check if already in queue
    if (this.queue.find(j => j.id === id) || this.activeDownloads.has(id)) {
      this.emit('skipped', { id, book, chapter, reason: 'queued' });
      return { success: true, skipped: true };
    }

    const job = {
      id,
      book,
      chapter,
      url: this.generateCDNUrl(book, chapter),
      outputPath,
      status: 'pending',
      progress: 0,
      retries: 0,
      priority: options.priority || 0,
      createdAt: Date.now(),
    };

    this.queue.push(job);
    this.queue.sort((a, b) => b.priority - a.priority); // Higher priority first

    this.emit('queued', { id, book, chapter });

    if (!this.isProcessing) {
      this.startProcessing();
    }

    return { success: true, id };
  }

  /**
   * Add multiple downloads to queue
   */
  async addBatch(jobs, options = {}) {
    const results = [];
    for (const { book, chapter } of jobs) {
      const result = await this.addToQueue(book, chapter, options);
      results.push({ book, chapter, ...result });
    }
    return results;
  }

  /**
   * Start processing queue
   */
  async startProcessing() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0 || this.activeDownloads.size > 0) {
      // Start new downloads if under limit
      while (this.queue.length > 0 && this.activeDownloads.size < this.maxConcurrent) {
        const job = this.queue.shift();
        this.activeDownloads.set(job.id, job);
        this.downloadFile(job).catch(err => {
          console.error(`Download error for ${job.id}:`, err);
        });
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
    this.emit('completed');
  }

  /**
   * Download a single file
   */
  async downloadFile(job) {
    job.status = 'downloading';
    this.emit('started', { id: job.id, book: job.book, chapter: job.chapter });

    try {
      // Ensure directory exists
      const dir = path.dirname(job.outputPath);
      await fs.mkdir(dir, { recursive: true });

      // Download file
      const response = await axios({
        method: 'GET',
        url: job.url,
        responseType: 'stream',
        timeout: 60000, // 60 seconds
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            job.progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            this.emit('progress', {
              id: job.id,
              book: job.book,
              chapter: job.chapter,
              progress: job.progress,
            });
          }
        },
      });

      // Save to file
      const writer = fsSync.createWriteStream(job.outputPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Success
      job.status = 'completed';
      job.progress = 100;
      this.activeDownloads.delete(job.id);
      this.emit('success', {
        id: job.id,
        book: job.book,
        chapter: job.chapter,
        path: job.outputPath,
      });

    } catch (error) {
      job.retries++;

      if (job.retries < this.maxRetries) {
        // Retry with exponential backoff
        const delay = this.retryDelay * Math.pow(2, job.retries - 1);
        this.emit('retry', {
          id: job.id,
          book: job.book,
          chapter: job.chapter,
          attempt: job.retries,
          delay,
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Re-queue the job
        this.activeDownloads.delete(job.id);
        job.status = 'pending';
        job.progress = 0;
        this.queue.unshift(job); // Add to front of queue

      } else {
        // Max retries exceeded
        job.status = 'failed';
        job.error = error.message;
        this.activeDownloads.delete(job.id);
        this.emit('failed', {
          id: job.id,
          book: job.book,
          chapter: job.chapter,
          error: error.message,
        });
      }
    }
  }

  /**
   * Get current queue status
   */
  getStatus() {
    return {
      pending: this.queue.length,
      active: this.activeDownloads.size,
      jobs: [
        ...this.queue.map(j => ({ ...j, status: 'pending' })),
        ...Array.from(this.activeDownloads.values()),
      ],
    };
  }

  /**
   * Cancel a download
   */
  cancel(id) {
    // Remove from queue
    const queueIndex = this.queue.findIndex(j => j.id === id);
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1);
      this.emit('cancelled', { id });
      return true;
    }

    // Can't cancel active downloads easily, but we can mark them
    if (this.activeDownloads.has(id)) {
      this.emit('cancelled', { id, note: 'Will complete current download' });
      return true;
    }

    return false;
  }

  /**
   * Clear completed and failed jobs
   */
  clearCompleted() {
    // Active downloads and queue are already cleaned
    // This is mainly for future job history tracking
    this.emit('cleared');
  }

  /**
   * Stop all downloads
   */
  stop() {
    this.queue = [];
    this.isProcessing = false;
    this.emit('stopped');
  }
}

module.exports = WordProjectDownloader;
