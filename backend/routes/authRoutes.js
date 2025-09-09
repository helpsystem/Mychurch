const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, parseUser } = require('../db-postgres');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const generateToken = (user) => {
  const name = user.profileData && user.profileData.name ? user.profileData.name : null;
  return jwt.sign(
    { email: user.email, role: user.role, name },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};


// -------------------- SIGNUP --------------------
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }
  try {
    const result = await pool.query('SELECT email FROM users WHERE email = $1', [email]);
    const existingUsers = result.rows;
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Email already in use.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const profileData = JSON.stringify({
      name,
      billingInfo: {},
      creditCards: [],
      imageUrl: `https://i.pravatar.cc/150?u=${email}`
    });

    await pool.query(
      'INSERT INTO users (email, password, role, permissions, profileData, invitations) VALUES ($1, $2, $3, $4, $5, $6)',
      [email, hashedPassword, 'USER', '[]', profileData, '[]']
    );

    const token = generateToken({ email, role: 'USER', profileData: { name } });
    res.status(201).json({ token, user: { email, role: 'USER', profileData: { name } } });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Internal server error during signup.' });
  }
});

// -------------------- USER LOGIN --------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    let user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    user = parseUser(user);
    const token = generateToken(user);
    delete user.password;
    res.json({ token, user });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// -------------------- ADMIN LOGIN --------------------
router.post('/admin-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    let user = users[0];
    if (user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    delete user.password;
    res.json({ token, user });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ message: 'Internal server error during admin login.' });
  }
});


// -------------------- PROFILE --------------------
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [req.user.email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    let user = users[0];
    user = parseUser(user);
    delete user.password;
    res.json({ user });
  } catch (error) {
    console.error('Fetch Me Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
