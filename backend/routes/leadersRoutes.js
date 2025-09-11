const express = require('express');
const { pool, parseJSON } = require('../db-postgres');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// GET /api/leaders - دریافت همه رهبران
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leaders ORDER BY created_at DESC');
    const leaders = result.rows.map(leader => ({
      id: leader.id,
      name: parseJSON(leader.name, {}),
      title: parseJSON(leader.title, {}),
      imageUrl: leader.imageurl,
      bio: parseJSON(leader.bio, {}),
      whatsappNumber: leader.whatsappnumber
    }));
    res.json(leaders);
  } catch (error) {
    console.error('Fetch Leaders Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/leaders - ایجاد رهبر جدید
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { name, title, imageUrl, bio, whatsappNumber } = req.body;
  
  if (!name || !title) {
    return res.status(400).json({ message: 'Name and title are required.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO leaders (name, title, imageUrl, bio, whatsappNumber) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        JSON.stringify(name),
        JSON.stringify(title),
        imageUrl || null,
        JSON.stringify(bio || {}),
        whatsappNumber || null
      ]
    );

    const newLeader = result.rows[0];
    res.status(201).json({
      id: newLeader.id,
      name: parseJSON(newLeader.name, {}),
      title: parseJSON(newLeader.title, {}),
      imageUrl: newLeader.imageurl,
      bio: parseJSON(newLeader.bio, {}),
      whatsappNumber: newLeader.whatsappnumber
    });
  } catch (error) {
    console.error('Create Leader Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/leaders/:id - ویرایش رهبر
router.put('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { name, title, imageUrl, bio, whatsappNumber } = req.body;

  try {
    const result = await pool.query(
      'UPDATE leaders SET name = $1, title = $2, imageUrl = $3, bio = $4, whatsappNumber = $5 WHERE id = $6 RETURNING *',
      [
        JSON.stringify(name),
        JSON.stringify(title),
        imageUrl,
        JSON.stringify(bio || {}),
        whatsappNumber,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Leader not found.' });
    }

    const updatedLeader = result.rows[0];
    res.json({
      id: updatedLeader.id,
      name: parseJSON(updatedLeader.name, {}),
      title: parseJSON(updatedLeader.title, {}),
      imageUrl: updatedLeader.imageurl,
      bio: parseJSON(updatedLeader.bio, {}),
      whatsappNumber: updatedLeader.whatsappnumber
    });
  } catch (error) {
    console.error('Update Leader Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/leaders/:id - حذف رهبر
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM leaders WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Leader not found.' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete Leader Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;