const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool, parseJSON } = require('../db-postgres');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// تنظیمات Multer برای آپلود فایل
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/worship-files');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
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
    const result = await pool.query('SELECT * FROM worship_songs ORDER BY created_at DESC');
    const worshipSongs = result.rows.map(song => ({
      id: song.id,
      title: parseJSON(song.title, {}),
      artist: song.artist,
      youtubeId: song.youtubeid,
      lyrics: parseJSON(song.lyrics, {}),
      audioUrl: song.audiourl,
      videoUrl: song.videourl,
      category: song.category || 'worship',
      tags: parseJSON(song.tags, []),
      copyright: song.copyright,
      presentationFileUrl: song.presentation_file_url,
      pdfFileUrl: song.pdf_file_url,
      sheetMusicUrl: song.sheet_music_url
    }));
    res.json({ songs: worshipSongs });
  } catch (error) {
    console.error('Fetch Worship Songs Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/worship-songs - ایجاد آهنگ پرستشی جدید
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { title, artist, youtubeId, lyrics, audioUrl, videoUrl, presentationFileUrl, pdfFileUrl, sheetMusicUrl } = req.body;
  
  if (!title || !artist || !youtubeId) {
    return res.status(400).json({ message: 'Title, artist, and youtubeId are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO worship_songs (title, artist, youtubeId, lyrics, audioUrl, videoUrl, presentation_file_url, pdf_file_url, sheet_music_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        JSON.stringify(title),
        artist,
        youtubeId,
        JSON.stringify(lyrics || {}),
        audioUrl || null,
        videoUrl || null,
        presentationFileUrl || null,
        pdfFileUrl || null,
        sheetMusicUrl || null
      ]
    );

    const newSong = result.rows[0];
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
      sheetMusicUrl: newSong.sheet_music_url
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

// POST /api/worship-songs/upload-file - آپلود فایل (PowerPoint, PDF, نت موسیقی)
router.post('/upload-file', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'هیچ فایلی آپلود نشده است' });
    }

    const fileUrl = `/worship-files/${req.file.filename}`;
    
    res.json({
      success: true,
      fileUrl: fileUrl,
      filename: req.file.originalname,
      size: req.file.size
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

module.exports = router;