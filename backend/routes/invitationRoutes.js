const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool, parseUser } = require('../db');

// Middleware: بررسی JWT
const authenticateToken = (req, res, next) => {
  const token = (req.headers.authorization && req.headers.authorization.split(' ')[1]) || null;
  if (!token) return res.status(401).json({ message: 'Unauthorized: Token missing' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Middleware: فقط ادمین یا سوپر ادمین
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'MANAGER') {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  next();
};

// 📌 1. ایجاد دعوت‌نامه
router.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
  const { email, role } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const [result] = await pool.query(
      'INSERT INTO users (email, password, role, permissions, profileData, invitations) VALUES (?, ?, ?, ?, ?, ?)',
      [
        email,
        '', // رمز بعداً توسط کاربر تنظیم می‌شود
        role || 'USER',
        '[]',
        JSON.stringify({ name: '', imageUrl: '' }),
        JSON.stringify([{ invitedBy: req.user.email, date: new Date().toISOString() }])
      ]
    );

    res.status(201).json({
      message: 'Invitation created successfully',
      invitationId: result.insertId
    });
  } catch (error) {
    console.error('Error creating invitation:', error.message);
    res.status(500).json({ message: 'Internal server error while creating invitation' });
  }
});

// 📌 2. دریافت لیست دعوت‌نامه‌ها
router.get('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, email, role, invitations FROM users WHERE invitations IS NOT NULL AND invitations != '[]'"
    );

    const invitations = rows.map(row => ({
      id: row.id,
      email: row.email,
      role: row.role,
      invitations: JSON.parse(row.invitations || '[]')
    }));

    res.status(200).json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error.message);
    res.status(500).json({ message: 'Internal server error while fetching invitations' });
  }
});

// 📌 3. حذف دعوت‌نامه
router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM users WHERE id = ? AND invitations IS NOT NULL AND invitations != "[]"',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    res.status(200).json({ message: 'Invitation deleted successfully' });
  } catch (error) {
    console.error('Error deleting invitation:', error.message);
    res.status(500).json({ message: 'Internal server error while deleting invitation' });
  }
});

module.exports = router;
