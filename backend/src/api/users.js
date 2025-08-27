const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, role FROM users');
    res.json(rows);
  } catch (error) {
    console.error('Failed to get users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/users - Create a new user
router.post('/', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
      [name, email, password] // IMPORTANT: Use parameterized queries to prevent SQL injection
    );
    res.status(201).json({ id: result.insertId, name, email });
  } catch (error) {
    console.error('Failed to create user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ... other routes for GET by ID, PUT, DELETE will go here ...

module.exports = router;