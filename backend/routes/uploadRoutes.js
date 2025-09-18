const express = require('express');
const multer = require('multer');
const path = require('path');
const { pool } = require('../db-postgres');

const router = express.Router();

// تنظیم محل ذخیره فایل‌ها
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public_html/images')); // مسیر ذخیره
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// 📌 آپلود تصویر پروفایل کاربر
router.post('/user/:id', upload.single('profile_image'), async (req, res) => {
  try {
    const userId = req.params.id;
    const imageUrl = `/images/${req.file.filename}`;

    await pool.query(
      'UPDATE users SET profile_image_url = ? WHERE id = ?',
      [imageUrl, userId]
    );

    res.json({ message: 'Profile image updated successfully', imageUrl });
  } catch (error) {
    console.error('User image upload error:', error);
    res.status(500).json({ message: 'Server error while uploading image' });
  }
});

// 📌 آپلود تصویر رهبران
router.post('/leader/:id', upload.single('leader_image'), async (req, res) => {
  try {
    const leaderId = req.params.id;
    const imageUrl = `/images/${req.file.filename}`;

    await pool.query(
      'UPDATE leaders SET image_url = ? WHERE id = ?',
      [imageUrl, leaderId]
    );

    res.json({ message: 'Leader image updated successfully', imageUrl });
  } catch (error) {
    console.error('Leader image upload error:', error);
    res.status(500).json({ message: 'Server error while uploading image' });
  }
});

module.exports = router;
