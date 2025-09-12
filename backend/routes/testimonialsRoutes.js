const express = require('express');
const { pool } = require('../db-postgres');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { testimonialRateLimit, resetRateLimit } = require('../middleware/rateLimiter');
const router = express.Router();

/**
 * Validate CAPTCHA token for testimonials
 */
const validateCaptcha = (token) => {
  try {
    const decoded = atob(token);
    const [equation, timestamp] = decoded.split(':');
    
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    if (now - tokenTime > 5 * 60 * 1000) {
      return { valid: false, reason: 'Token expired' };
    }
    
    const [left, answer] = equation.split('=');
    const [num1, operator, num2] = left.match(/(\d+)([+\-])(\d+)/).slice(1);
    
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

// GET /api/testimonials - دریافت همه شهادت‌ها
router.get('/', async (req, res) => {
  try {
    const { public: isPublic, category, type, sort } = req.query;
    
    let query = 'SELECT * FROM testimonials';
    let conditions = [];
    let params = [];
    
    // Add filters
    if (isPublic === 'true') {
      conditions.push('is_public = $' + (params.length + 1));
      params.push(true);
    }
    
    if (category && category !== 'all') {
      conditions.push('category = $' + (params.length + 1));
      params.push(category);
    }
    
    if (type && type !== 'all') {
      conditions.push('type = $' + (params.length + 1));
      params.push(type);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Add sorting
    switch (sort) {
      case 'oldest':
        query += ' ORDER BY created_at ASC';
        break;
      case 'rating':
        query += ' ORDER BY rating DESC';
        break;
      case 'likes':
        query += ' ORDER BY likes_count DESC';
        break;
      default:
        query += ' ORDER BY created_at DESC';
    }
    
    const result = await pool.query(query, params);
    const testimonials = result.rows.map(testimonial => ({
      id: testimonial.id.toString(),
      type: testimonial.type || 'testimony',
      isAnonymous: testimonial.is_anonymous || false,
      testimonialText: parseJSON(testimonial.content, {}).en || parseJSON(testimonial.content, {}).fa || '',
      name: testimonial.is_anonymous ? undefined : testimonial.author,
      category: testimonial.category || 'general',
      isPublic: testimonial.is_public !== false,
      dateOfEvent: testimonial.date_of_event,
      location: testimonial.location,
      rating: testimonial.rating || 5,
      createdAt: testimonial.created_at,
      likesCount: testimonial.likes_count || 0,
      hasUserLiked: false, // Will be updated with user-specific logic
      verificationStatus: testimonial.status === 'approved' ? 'verified' : testimonial.status === 'pending' ? 'pending' : 'not_required'
    }));
    
    res.json({ testimonials });
  } catch (error) {
    console.error('Fetch Testimonials Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/testimonials - ایجاد شهادت جدید with anti-spam protection
router.post('/', testimonialRateLimit, async (req, res) => {
  const { 
    testimonialText, 
    type, 
    category, 
    isAnonymous, 
    name, 
    email,
    dateOfEvent, 
    location, 
    rating,
    captchaToken,
    website // honeypot field
  } = req.body;
  
  // Basic validation
  if (!testimonialText || !testimonialText.trim()) {
    return res.status(400).json({ 
      message: 'Testimonial text is required.',
      field: 'testimonialText'
    });
  }
  
  // Honeypot check
  if (!checkHoneypot(website)) {
    console.log(`Testimonial honeypot triggered for IP: ${req.ip}, value: ${website}`);
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
    console.log(`Testimonial CAPTCHA failed for IP: ${req.ip}, reason: ${captchaResult.reason}`);
    return res.status(400).json({ 
      message: 'Security verification failed. Please try again.',
      field: 'captcha',
      reason: captchaResult.reason
    });
  }
  
  // Enhanced validation
  if (testimonialText.trim().length < 20) {
    return res.status(400).json({ 
      message: 'Testimonial must be at least 20 characters long.',
      field: 'testimonialText'
    });
  }
  
  if (testimonialText.trim().length > 3000) {
    return res.status(400).json({ 
      message: 'Testimonial must be less than 3000 characters.',
      field: 'testimonialText'
    });
  }
  
  // Name validation if not anonymous
  if (!isAnonymous && name) {
    const nameRegex = /^[a-zA-Z\u0600-\u06FF\s'-]{2,50}$/;
    if (!nameRegex.test(name.trim())) {
      return res.status(400).json({ 
        message: 'Please enter a valid name (2-50 characters, letters only).',
        field: 'name'
      });
    }
  }
  
  // Email validation if provided
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ 
      message: 'Please enter a valid email address.',
      field: 'email'
    });
  }
  
  // Validate type
  const validTypes = ['testimony', 'blessing', 'confession'];
  if (!validTypes.includes(type || 'testimony')) {
    return res.status(400).json({ 
      message: 'Invalid testimonial type.',
      field: 'type'
    });
  }
  
  // Validate category
  const validCategories = ['general', 'healing', 'salvation', 'provision', 'guidance', 'family', 'breakthrough'];
  if (!validCategories.includes(category || 'general')) {
    return res.status(400).json({ 
      message: 'Invalid category.',
      field: 'category'
    });
  }
  
  // Validate rating
  const ratingValue = parseInt(rating) || 5;
  if (ratingValue < 1 || ratingValue > 5) {
    return res.status(400).json({ 
      message: 'Rating must be between 1 and 5.',
      field: 'rating'
    });
  }

  try {
    const result = await pool.query(
      'INSERT INTO testimonials (content, type, category, is_anonymous, author, date_of_event, location, rating, status, is_public, likes_count) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [
        JSON.stringify({ en: testimonialText.trim() }),
        type || 'testimony',
        category || 'general',
        isAnonymous || false,
        isAnonymous ? null : (name?.trim() || null),
        dateOfEvent || null,
        location?.trim() || null,
        ratingValue,
        'pending',
        true,
        0
      ]
    );

    // Reset rate limit on successful submission
    resetRateLimit(req, 'testimonial');

    const newTestimonial = result.rows[0];
    res.status(201).json({
      id: newTestimonial.id.toString(),
      type: newTestimonial.type,
      isAnonymous: newTestimonial.is_anonymous,
      testimonialText: parseJSON(newTestimonial.content, {}).en || '',
      name: newTestimonial.is_anonymous ? undefined : newTestimonial.author,
      category: newTestimonial.category,
      isPublic: newTestimonial.is_public,
      dateOfEvent: newTestimonial.date_of_event,
      location: newTestimonial.location,
      rating: newTestimonial.rating,
      createdAt: newTestimonial.created_at,
      likesCount: newTestimonial.likes_count,
      hasUserLiked: false,
      verificationStatus: 'pending'
    });
  } catch (error) {
    console.error('Create Testimonial Error:', error);
    res.status(500).json({ 
      message: 'Internal server error.',
      field: 'server'
    });
  }
});

// POST /api/testimonials/:id/like - لایک/آنلایک شهادت
router.post('/:id/like', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if testimonial exists
    const testimonialResult = await pool.query('SELECT * FROM testimonials WHERE id = $1', [id]);
    
    if (testimonialResult.rows.length === 0) {
      return res.status(404).json({ message: 'Testimonial not found.' });
    }
    
    const testimonial = testimonialResult.rows[0];
    const newLikesCount = (testimonial.likes_count || 0) + 1;
    
    // Update likes count (simplified - in a real app you'd track user likes)
    const result = await pool.query(
      'UPDATE testimonials SET likes_count = $1 WHERE id = $2 RETURNING *',
      [newLikesCount, id]
    );
    
    const updatedTestimonial = result.rows[0];
    
    res.json({
      success: true,
      likesCount: updatedTestimonial.likes_count,
      hasUserLiked: true
    });
  } catch (error) {
    console.error('Like Testimonial Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/testimonials/:id - ویرایش شهادت
router.put('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { title, content, author, status } = req.body;

  try {
    const result = await pool.query(
      'UPDATE testimonials SET title = $1, content = $2, author = $3, status = $4 WHERE id = $5 RETURNING *',
      [
        JSON.stringify(title),
        JSON.stringify(content),
        author,
        status || 'pending',
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Testimonial not found.' });
    }

    const updatedTestimonial = result.rows[0];
    res.json({
      id: updatedTestimonial.id,
      title: parseJSON(updatedTestimonial.title, {}),
      content: parseJSON(updatedTestimonial.content, {}),
      author: updatedTestimonial.author,
      status: updatedTestimonial.status
    });
  } catch (error) {
    console.error('Update Testimonial Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PATCH /api/testimonials/:id/status - تغییر وضعیت شهادت
router.patch('/:id/status', authenticateToken, authorizeRoles('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be pending, approved, or rejected.' });
  }

  try {
    const result = await pool.query(
      'UPDATE testimonials SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Testimonial not found.' });
    }

    const updatedTestimonial = result.rows[0];
    res.json({
      id: updatedTestimonial.id,
      title: parseJSON(updatedTestimonial.title, {}),
      content: parseJSON(updatedTestimonial.content, {}),
      author: updatedTestimonial.author,
      status: updatedTestimonial.status
    });
  } catch (error) {
    console.error('Update Testimonial Status Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/testimonials/:id - حذف شهادت
router.delete('/:id', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM testimonials WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Testimonial not found.' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete Testimonial Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;