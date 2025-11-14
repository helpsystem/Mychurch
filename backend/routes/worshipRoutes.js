const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool, parseJSON } = require('../db-postgres');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { convertToProxyURL } = require('../middleware/urlConverter');
const router = express.Router();

// تنظیمات Multer برای آپلود فایل
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // تشخیص نوع فایل و انتخاب پوشه مناسب
    let folder = 'other';
    if (file.mimetype.startsWith('audio/')) {
      folder = 'audio';
    } else if (file.mimetype.includes('powerpoint') || file.mimetype.includes('presentation')) {
      folder = 'pptx';
    } else if (file.mimetype === 'application/pdf') {
      folder = 'pdf';
    } else if (file.mimetype.startsWith('image/')) {
      folder = 'images';
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'videos';
    }
    
    const uploadPath = path.join(__dirname, '../../public/worship', folder);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // استفاده از نام اصلی فایل (با encoding مناسب برای فارسی)
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const uniqueSuffix = Date.now();
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    cb(null, `${baseName}_${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('فقط فایل‌های PDF، PowerPoint و تصویر مجاز هستند'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// GET /api/worship-songs - دریافت همه آهنگ‌های پرستشی
router.get('/', async (req, res) => {
  try {
    // بهینه‌سازی: فقط فیلدهای لازم را SELECT کن (نه lyrics که خیلی بزرگ است)
    const result = await pool.query(`
      SELECT 
        id, title, artist, youtubeid, audiourl, videourl, 
        category, tags, copyright, 
        presentation_file_url, pdf_file_url, sheet_music_url,
        chords, notation, notes, attachments,
        timing_data IS NOT NULL as has_timing,
        timing_updated_at,
        created_at
      FROM worship_songs 
      ORDER BY created_at DESC
    `);
    
    const worshipSongs = result.rows.map(song => ({
      id: song.id,
      title: parseJSON(song.title, {}),
      artist: song.artist,
      youtubeId: song.youtubeid,
      audioUrl: convertToProxyURL(song.audiourl), // Convert to proxy URL
      videoUrl: song.videourl,
      category: song.category || 'worship',
      tags: parseJSON(song.tags, []),
      copyright: song.copyright,
      presentationFileUrl: convertToProxyURL(song.presentation_file_url),
      pdfFileUrl: convertToProxyURL(song.pdf_file_url),
      sheetMusicUrl: convertToProxyURL(song.sheet_music_url),
      chords: song.chords,
      notation: song.notation,
      notes: song.notes,
      attachments: parseJSON(song.attachments, []),
      hasTiming: song.has_timing,
      timingUpdatedAt: song.timing_updated_at
      // lyrics و timingData رو حذف کردیم چون خیلی بزرگ هستند
      // برای دریافت این دو از GET /api/worship-songs/:id استفاده می‌شود
    }));
    
    res.json(worshipSongs);
  } catch (error) {
    console.error('Fetch Worship Songs Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/worship-songs/:id - دریافت یک آهنگ با جزئیات کامل (شامل lyrics و timing)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM worship_songs WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Worship song not found' });
    }
    
    const song = result.rows[0];
    res.json({
      id: song.id,
      title: parseJSON(song.title, {}),
      artist: song.artist,
      youtubeId: song.youtubeid,
      lyrics: parseJSON(song.lyrics, {}),
      audioUrl: convertToProxyURL(song.audiourl), // Convert to proxy URL
      videoUrl: song.videourl,
      category: song.category || 'worship',
      tags: parseJSON(song.tags, []),
      copyright: song.copyright,
      presentationFileUrl: convertToProxyURL(song.presentation_file_url),
      pdfFileUrl: convertToProxyURL(song.pdf_file_url),
      sheetMusicUrl: convertToProxyURL(song.sheet_music_url),
      chords: song.chords,
      notation: song.notation,
      notes: song.notes,
      attachments: parseJSON(song.attachments, []),
      timingData: parseJSON(song.timing_data, null),
      timingUpdatedAt: song.timing_updated_at,
      hasTiming: !!song.timing_data,
      structure: parseJSON(song.structure, null),
      createdAt: song.created_at
    });
  } catch (error) {
    console.error('Fetch Worship Song by ID Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/worship-songs - ایجاد آهنگ پرستشی جدید
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { title, artist, youtubeId, lyrics, audioUrl, videoUrl, presentationFileUrl, pdfFileUrl, sheetMusicUrl, autoSync } = req.body;
  
  if (!title || !artist || !youtubeId) {
    return res.status(400).json({ message: 'Title, artist, and youtubeId are required.' });
  }

  try {
    // Insert worship song
    const result = await pool.query(
      `INSERT INTO worship_songs (title, artist, youtubeId, lyrics, audioUrl, videoUrl, presentation_file_url, pdf_file_url, sheet_music_url, auto_sync_enabled, processing_status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        JSON.stringify(title),
        artist,
        youtubeId,
        JSON.stringify(lyrics || {}),
        audioUrl || null,
        videoUrl || null,
        presentationFileUrl || null,
        pdfFileUrl || null,
        sheetMusicUrl || null,
        autoSync !== false, // Default true
        'not_processed'
      ]
    );

    const newSong = result.rows[0];

    // 🚀 AUTO-SYNC: Queue for background processing if audio and lyrics exist
    if (newSong.audiourl && (lyrics?.fa || lyrics?.en) && autoSync !== false) {
      try {
        await pool.query(`
          INSERT INTO sync_jobs (job_type, entity_id, priority, created_by)
          VALUES ('worship_song', $1, 5, $2)
        `, [newSong.id, req.user.id]);

        await pool.query(`
          UPDATE worship_songs 
          SET processing_status = 'queued'
          WHERE id = $1
        `, [newSong.id]);

        console.log(`✅ Queued worship song ${newSong.id} for auto-sync`);
      } catch (queueError) {
        console.error('Failed to queue song for sync:', queueError);
        // Don't fail the request, just log the error
      }
    }

    res.status(201).json({
      id: newSong.id,
      title: parseJSON(newSong.title, {}),
      artist: newSong.artist,
      youtubeId: newSong.youtubeid,
      lyrics: parseJSON(newSong.lyrics, {}),
      audioUrl: newSong.audiourl,
      videoUrl: newSong.videourl,
      presentationFileUrl: newSong.presentation_file_url,
      pdfFileUrl: newSong.pdf_file_url,
      sheetMusicUrl: newSong.sheet_music_url,
      processingStatus: newSong.processing_status,
      autoSyncEnabled: newSong.auto_sync_enabled
    });
  } catch (error) {
    console.error('Create Worship Song Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/worship-songs/:id - ویرایش آهنگ پرستشی
router.put('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { title, artist, youtubeId, lyrics, audioUrl, videoUrl, presentationFileUrl, pdfFileUrl, sheetMusicUrl } = req.body;

  try {
    const result = await pool.query(
      `UPDATE worship_songs SET title = $1, artist = $2, youtubeId = $3, lyrics = $4, audioUrl = $5, videoUrl = $6,
       presentation_file_url = $7, pdf_file_url = $8, sheet_music_url = $9
       WHERE id = $10 RETURNING *`,
      [
        JSON.stringify(title),
        artist,
        youtubeId,
        JSON.stringify(lyrics || {}),
        audioUrl,
        videoUrl,
        presentationFileUrl || null,
        pdfFileUrl || null,
        sheetMusicUrl || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Worship song not found.' });
    }

    const updatedSong = result.rows[0];
    res.json({
      id: updatedSong.id,
      title: parseJSON(updatedSong.title, {}),
      artist: updatedSong.artist,
      youtubeId: updatedSong.youtubeid,
      lyrics: parseJSON(updatedSong.lyrics, {}),
      audioUrl: updatedSong.audiourl,
      videoUrl: updatedSong.videourl,
      presentationFileUrl: updatedSong.presentation_file_url,
      pdfFileUrl: updatedSong.pdf_file_url,
      sheetMusicUrl: updatedSong.sheet_music_url
    });
  } catch (error) {
    console.error('Update Worship Song Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/worship-songs/:id - حذف آهنگ پرستشی
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    // دریافت اطلاعات سرود برای حذف فایل‌ها
    const songResult = await pool.query('SELECT * FROM worship_songs WHERE id = $1', [id]);
    if (songResult.rows.length === 0) {
      return res.status(404).json({ message: 'Worship song not found.' });
    }

    const song = songResult.rows[0];
    
    // حذف فایل‌ها از دیسک
    const filesToDelete = [
      song.presentation_file_url,
      song.pdf_file_url,
      song.sheet_music_url
    ].filter(Boolean);

    filesToDelete.forEach(fileUrl => {
      const filename = path.basename(fileUrl);
      const filePath = path.join(__dirname, '../public/worship-files', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // حذف از دیتابیس
    const result = await pool.query('DELETE FROM worship_songs WHERE id = $1', [id]);
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete Worship Song Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/worship-songs/upload-file - آپلود فایل (PowerPoint, PDF, نت موسیقی، MP3)
router.post('/upload-file', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'هیچ فایلی آپلود نشده است' });
    }

    // تعیین مسیر نسبی بر اساس نوع فایل
    let folder = 'other';
    if (req.file.mimetype.startsWith('audio/')) {
      folder = 'audio';
    } else if (req.file.mimetype.includes('powerpoint') || req.file.mimetype.includes('presentation')) {
      folder = 'pptx';
    } else if (req.file.mimetype === 'application/pdf') {
      folder = 'pdf';
    } else if (req.file.mimetype.startsWith('image/')) {
      folder = 'images';
    } else if (req.file.mimetype.startsWith('video/')) {
      folder = 'videos';
    }

    const fileUrl = `/worship/${folder}/${req.file.filename}`;
    
    res.json({
      success: true,
      fileUrl: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload File Error:', error);
    res.status(500).json({ message: 'خطا در آپلود فایل', error: error.message });
  }
});

// DELETE /api/worship-songs/delete-file - حذف فایل
router.delete('/delete-file', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { fileUrl } = req.body;
    
    if (!fileUrl) {
      return res.status(400).json({ message: 'آدرس فایل الزامی است' });
    }

    const filename = path.basename(fileUrl);
    const filePath = path.join(__dirname, '../public/worship-files', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'فایل با موفقیت حذف شد' });
    } else {
      res.status(404).json({ message: 'فایل یافت نشد' });
    }
  } catch (error) {
    console.error('Delete File Error:', error);
    res.status(500).json({ message: 'خطا در حذف فایل', error: error.message });
  }
});

// POST /api/worship-songs/:id/resync - Manual re-sync trigger for admins
router.post('/:id/resync', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body; // Optional: 1-10, default 5

    // Check if song exists
    const songResult = await pool.query('SELECT * FROM worship_songs WHERE id = $1', [id]);
    
    if (songResult.rows.length === 0) {
      return res.status(404).json({ message: 'Worship song not found' });
    }

    const song = songResult.rows[0];

    if (!song.audiourl) {
      return res.status(400).json({ message: 'No audio URL found for this song' });
    }

    // Check if already queued or processing
    const existingJob = await pool.query(`
      SELECT * FROM sync_jobs 
      WHERE job_type = 'worship_song' 
      AND entity_id = $1 
      AND status IN ('pending', 'processing')
      LIMIT 1
    `, [id]);

    if (existingJob.rows.length > 0) {
      return res.status(409).json({ 
        message: 'Song is already queued or processing',
        job: existingJob.rows[0]
      });
    }

    // Queue for processing with higher priority (manual = priority 1)
    await pool.query(`
      INSERT INTO sync_jobs (job_type, entity_id, priority, created_by)
      VALUES ('worship_song', $1, $2, $3)
    `, [id, priority || 1, req.user.id]);

    await pool.query(`
      UPDATE worship_songs 
      SET processing_status = 'queued'
      WHERE id = $1
    `, [id]);

    console.log(`🔄 Manual re-sync queued for worship song ${id} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Song queued for re-sync',
      songId: id,
      processingStatus: 'queued'
    });

  } catch (error) {
    console.error('Re-sync Error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// GET /api/worship-songs/:id/sync-status - Get sync job status
router.get('/:id/sync-status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get latest job for this song
    const jobResult = await pool.query(`
      SELECT * FROM sync_jobs 
      WHERE job_type = 'worship_song' 
      AND entity_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [id]);

    if (jobResult.rows.length === 0) {
      return res.json({ 
        hasJob: false,
        message: 'No sync job found for this song'
      });
    }

    const job = jobResult.rows[0];

    res.json({
      hasJob: true,
      job: {
        id: job.id,
        status: job.status,
        attempts: job.attempts,
        maxAttempts: job.max_attempts,
        errorMessage: job.error_message,
        result: job.result,
        createdAt: job.created_at,
        startedAt: job.started_at,
        completedAt: job.completed_at
      }
    });

  } catch (error) {
    console.error('Get Sync Status Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;