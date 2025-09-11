const express = require('express');
const { pool, parseUser } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// GET /api/users
router.get('/', authenticateToken, authorizeRoles('MANAGER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    const sanitizedUsers = result.rows.map(user => {
      const parsedUser = parseUser(user);
      delete parsedUser.password;
      return parsedUser;
    });
    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/users/:email/permissions
router.put('/:email/permissions', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { email } = req.params;
  const { permissions } = req.body;
  if (!Array.isArray(permissions)) {
    return res.status(400).json({ message: 'Permissions must be an array.' });
  }
  try {
    const permissionsJSON = JSON.stringify(permissions);
    const result = await pool.query('UPDATE users SET permissions = $1 WHERE email = $2', [permissionsJSON, email]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Update Permissions Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;