const express = require('express');
const { pool } = require('../db-postgres');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { prayerRateLimit, resetRateLimit } = require('../middleware/rateLimiter');
const router = express.Router();

/**
 * Validate CAPTCHA token for prayer requests
 */
const validateCaptcha = (token) => {
  try {
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

// Helper function to parse JSON safely
const parseJSON = (value, defaultValue = {}) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return defaultValue;
    }
  }
  return value || defaultValue;
};

// GET /api/prayer-requests - Get all prayer requests
router.get('/', async (req, res) => {
  try {
    const { public_only } = req.query;
    let query = 'SELECT * FROM prayer_requests ORDER BY created_at DESC';
    
    if (public_only === 'true') {
      query = 'SELECT * FROM prayer_requests WHERE is_public = true ORDER BY created_at DESC';
    }
    
    const result = await pool.query(query);
    const prayerRequests = result.rows.map(prayer => ({
      id: prayer.id,
      text: prayer.text,
      category: prayer.category,
      isAnonymous: prayer.is_anonymous,
      authorName: prayer.author_name,
      authorEmail: prayer.author_email,
      authorPhone: prayer.author_phone,
      prayerCount: prayer.prayer_count || 0,
      urgency: prayer.urgency,
      isPublic: prayer.is_public,
      createdAt: prayer.created_at
    }));
    res.json(prayerRequests);
  } catch (error) {
    console.error('Fetch Prayer Requests Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/prayer-requests - Create new prayer request with anti-spam protection
router.post('/', prayerRateLimit, async (req, res) => {
  const { 
    text, 
    category = 'other', 
    isAnonymous = false, 
    authorName, 
    authorEmail, 
    authorPhone,
    urgency = 'normal',
    isPublic = false,
    captchaToken,
    website // honeypot field
  } = req.body;
  
  // Basic validation
  if (!text || !text.trim()) {
    return res.status(400).json({ 
      message: 'Prayer request text is required.',
      field: 'text'
    });
  }
  
  // Honeypot check
  if (!checkHoneypot(website)) {
    console.log(`Prayer request honeypot triggered for IP: ${req.ip}, value: ${website}`);
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
    console.log(`Prayer request CAPTCHA failed for IP: ${req.ip}, reason: ${captchaResult.reason}`);
    return res.status(400).json({ 
      message: 'Security verification failed. Please try again.',
      field: 'captcha',
      reason: captchaResult.reason
    });
  }

  // Validate category
  const validCategories = ['thanksgiving', 'healing', 'guidance', 'family', 'other'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ 
      message: 'Invalid category.',
      field: 'category'
    });
  }

  // Validate urgency
  const validUrgencies = ['low', 'normal', 'high', 'urgent'];
  if (!validUrgencies.includes(urgency)) {
    return res.status(400).json({ 
      message: 'Invalid urgency level.',
      field: 'urgency'
    });
  }
  
  // Enhanced text validation
  if (text.trim().length < 10) {
    return res.status(400).json({ 
      message: 'Prayer request must be at least 10 characters long.',
      field: 'text'
    });
  }
  
  if (text.trim().length > 2000) {
    return res.status(400).json({ 
      message: 'Prayer request must be less than 2000 characters.',
      field: 'text'
    });
  }
  
  // Enhanced email validation if provided
  if (authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
    return res.status(400).json({ 
      message: 'Please enter a valid email address.',
      field: 'email'
    });
  }
  
  // Enhanced name validation if not anonymous
  if (!isAnonymous && authorName) {
    const nameRegex = /^[a-zA-Z\u0600-\u06FF\s'-]{2,50}$/;
    if (!nameRegex.test(authorName.trim())) {
      return res.status(400).json({ 
        message: 'Please enter a valid name (2-50 characters, letters only).',
        field: 'name'
      });
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO prayer_requests 
       (text, category, is_anonymous, author_name, author_email, author_phone, urgency, is_public, prayer_count) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        text.trim(),
        category,
        isAnonymous,
        isAnonymous ? null : (authorName?.trim() || null),
        isAnonymous ? null : (authorEmail?.toLowerCase() || null),
        isAnonymous ? null : (authorPhone?.trim() || null),
        urgency,
        isPublic,
        0
      ]
    );

    // Reset rate limit on successful submission
    resetRateLimit(req, 'prayer');

    const newPrayer = result.rows[0];
    res.status(201).json({
      id: newPrayer.id,
      text: newPrayer.text,
      category: newPrayer.category,
      isAnonymous: newPrayer.is_anonymous,
      authorName: newPrayer.author_name,
      authorEmail: newPrayer.author_email,
      authorPhone: newPrayer.author_phone,
      prayerCount: newPrayer.prayer_count,
      urgency: newPrayer.urgency,
      isPublic: newPrayer.is_public,
      createdAt: newPrayer.created_at
    });
  } catch (error) {
    console.error('Create Prayer Request Error:', error);
    res.status(500).json({ 
      message: 'Internal server error.',
      field: 'server'
    });
  }
});

// PUT /api/prayer-requests/:id - Update prayer request
router.put('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { text, category, isAnonymous, authorName, authorEmail, authorPhone, urgency, isPublic } = req.body;

  try {
    const result = await pool.query(
      `UPDATE prayer_requests SET 
       text = $1, category = $2, is_anonymous = $3, author_name = $4, 
       author_email = $5, author_phone = $6, urgency = $7, is_public = $8 
       WHERE id = $9 RETURNING *`,
      [
        text,
        category,
        isAnonymous,
        authorName,
        authorEmail,
        authorPhone,
        urgency,
        isPublic,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Prayer request not found.' });
    }

    const updatedPrayer = result.rows[0];
    res.json({
      id: updatedPrayer.id,
      text: updatedPrayer.text,
      category: updatedPrayer.category,
      isAnonymous: updatedPrayer.is_anonymous,
      authorName: updatedPrayer.author_name,
      authorEmail: updatedPrayer.author_email,
      authorPhone: updatedPrayer.author_phone,
      prayerCount: updatedPrayer.prayer_count,
      urgency: updatedPrayer.urgency,
      isPublic: updatedPrayer.is_public,
      createdAt: updatedPrayer.created_at
    });
  } catch (error) {
    console.error('Update Prayer Request Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PATCH /api/prayer-requests/:id/pray - Increment prayer count
router.patch('/:id/pray', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE prayer_requests SET prayer_count = prayer_count + 1 WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Prayer request not found.' });
    }

    const updatedPrayer = result.rows[0];
    res.json({
      id: updatedPrayer.id,
      text: updatedPrayer.text,
      category: updatedPrayer.category,
      isAnonymous: updatedPrayer.is_anonymous,
      authorName: updatedPrayer.author_name,
      prayerCount: updatedPrayer.prayer_count,
      urgency: updatedPrayer.urgency,
      isPublic: updatedPrayer.is_public,
      createdAt: updatedPrayer.created_at
    });
  } catch (error) {
    console.error('Update Prayer Count Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/prayer-requests/:id - Delete prayer request
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM prayer_requests WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Prayer request not found.' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete Prayer Request Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;