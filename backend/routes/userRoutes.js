const express = require('express');
const { pool, parseUser } = require('../db-postgres');
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

// PUT /api/users/:email/role - Update user role
router.put('/:email/role', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { email } = req.params;
  const { role } = req.body;
  
  const validRoles = ['USER', 'LEADER', 'WORSHIP_LEADER', 'MANAGER', 'SUPER_ADMIN'];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
  }
  
  try {
    const result = await pool.query('UPDATE users SET role = $1 WHERE email = $2', [role, email]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ success: true, message: 'Role updated successfully' });
  } catch (error) {
    console.error('Update Role Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/users - Create new user (admin)
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { name, email, password, role = 'USER', permissions = [] } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }
  
  try {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }
    
    const result = await pool.query(
      `INSERT INTO users (first_name, email, password, role, permissions, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [name, email, hashedPassword, role, JSON.stringify(permissions)]
    );
    
    const newUser = parseUser(result.rows[0]);
    delete newUser.password;
    
    res.status(201).json({ user: newUser });
  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/users/:email - Update user details (admin)
router.put('/:email', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { email } = req.params;
  const updates = req.body;
  
  try {
    // Build dynamic update query
    const allowedFields = ['first_name', 'last_name', 'role', 'permissions'];
    const updateParts = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateParts.push(`${key} = $${paramIndex}`);
        values.push(key === 'permissions' ? JSON.stringify(value) : value);
        paramIndex++;
      }
    }
    
    if (updateParts.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update.' });
    }
    
    values.push(email);
    const query = `UPDATE users SET ${updateParts.join(', ')} WHERE email = $${paramIndex} RETURNING *`;
    
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    const updatedUser = parseUser(result.rows[0]);
    delete updatedUser.password;
    
    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;