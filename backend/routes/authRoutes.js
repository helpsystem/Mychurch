const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, parseUser } = require('../db-postgres');
const { authenticateToken } = require('../middleware/auth');
const { signupRateLimit, loginRateLimit, resetRateLimit } = require('../middleware/rateLimiter');

const router = express.Router();

const generateToken = (user) => {
  const name = user.profileData && user.profileData.name ? user.profileData.name : null;
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
  return jwt.sign(
    { email: user.email, role: user.role, name },
    jwtSecret,
    { expiresIn: '24h' }
  );
};

/**
 * Validate CAPTCHA token from frontend
 */
const validateCaptcha = (token) => {
  try {
    // Decode the base64 token
    const decoded = atob(token);
    const [equation, timestamp] = decoded.split(':');
    
    // Check if token is not too old (5 minutes max)
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    if (now - tokenTime > 5 * 60 * 1000) {
      return { valid: false, reason: 'Token expired' };
    }
    
    // Parse the equation
    const [left, answer] = equation.split('=');
    const [num1, operator, num2] = left.match(/(\d+)([+\-])(\d+)/).slice(1);
    
    // Calculate expected answer
    let expectedAnswer;
    if (operator === '+') {
      expectedAnswer = parseInt(num1) + parseInt(num2);
    } else if (operator === '-') {
      expectedAnswer = parseInt(num1) - parseInt(num2);
    } else {
      return { valid: false, reason: 'Invalid operator' };
    }
    
    // Verify answer
    if (parseInt(answer) === expectedAnswer) {
      return { valid: true };
    } else {
      return { valid: false, reason: 'Incorrect answer' };
    }
  } catch (error) {
    return { valid: false, reason: 'Invalid token format' };
  }
};

/**
 * Check for honeypot field (should be empty)
 */
const checkHoneypot = (honeypotValue) => {
  return !honeypotValue || honeypotValue.trim() === '';
};


// -------------------- SIGNUP --------------------
router.post('/signup', signupRateLimit, async (req, res) => {
  const { name, email, password, captchaToken, website } = req.body;
  
  // Basic field validation
  if (!name || !email || !password) {
    return res.status(400).json({ 
      message: 'Name, email, and password are required.',
      field: 'required_fields'
    });
  }
  
  // Honeypot check
  if (!checkHoneypot(website)) {
    console.log(`Honeypot triggered for IP: ${req.ip}, value: ${website}`);
    return res.status(400).json({ 
      message: 'Suspicious activity detected. Please contact support if this continues.',
      field: 'security'
    });
  }
  
  // CAPTCHA validation
  if (!captchaToken) {
    return res.status(400).json({ 
      message: 'Please complete the security verification.',
      field: 'captcha'
    });
  }
  
  const captchaResult = validateCaptcha(captchaToken);
  if (!captchaResult.valid) {
    console.log(`CAPTCHA failed for IP: ${req.ip}, reason: ${captchaResult.reason}`);
    return res.status(400).json({ 
      message: 'Security verification failed. Please try again.',
      field: 'captcha',
      reason: captchaResult.reason
    });
  }
  
  // Enhanced email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      message: 'Please enter a valid email address.',
      field: 'email'
    });
  }
  
  // Enhanced name validation (no excessive special characters)
  const nameRegex = /^[a-zA-Z\u0600-\u06FF\s'-]{2,50}$/;
  if (!nameRegex.test(name.trim())) {
    return res.status(400).json({ 
      message: 'Please enter a valid name (2-50 characters, letters only).',
      field: 'name'
    });
  }
  
  // Password strength validation
  if (password.length < 6) {
    return res.status(400).json({ 
      message: 'Password must be at least 6 characters long.',
      field: 'password'
    });
  }
  
  try {
    const result = await pool.query('SELECT email FROM users WHERE email = $1', [email.toLowerCase()]);
    const existingUsers = result.rows;
    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        message: 'Email already in use.',
        field: 'email'
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const profileData = JSON.stringify({
      name: name.trim(),
      billingInfo: {},
      creditCards: [],
      imageUrl: `https://i.pravatar.cc/150?u=${email.toLowerCase()}`
    });

    await pool.query(
      'INSERT INTO users (email, password, role, permissions, profileData, invitations) VALUES ($1, $2, $3, $4, $5, $6)',
      [email.toLowerCase(), hashedPassword, 'USER', '[]', profileData, '[]']
    );

    // Reset rate limit on successful signup
    resetRateLimit(req, 'signup');
    
    const token = generateToken({ email: email.toLowerCase(), role: 'USER', profileData: { name: name.trim() } });
    res.status(201).json({ 
      token, 
      user: { 
        email: email.toLowerCase(), 
        role: 'USER', 
        profileData: { name: name.trim() } 
      } 
    });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ 
      message: 'Internal server error during signup.',
      field: 'server'
    });
  }
});

// -------------------- USER LOGIN --------------------
router.post('/login', loginRateLimit, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    let user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    user = parseUser(user);
    
    // Reset rate limit on successful login
    resetRateLimit(req, 'login');
    
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
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    let user = result.rows[0];
    if (user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
    const token = jwt.sign(
      { email: user.email, role: user.role },
      jwtSecret,
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
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [req.user.email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    let user = result.rows[0];
    user = parseUser(user);
    delete user.password;
    res.json({ user });
  } catch (error) {
    console.error('Fetch Me Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
