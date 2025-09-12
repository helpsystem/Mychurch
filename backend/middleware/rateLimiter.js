/**
 * Rate limiting middleware to prevent spam and abuse
 * Tracks attempts by IP address with time-based windows
 */

// In-memory store for rate limiting (in production, use Redis or similar)
const attemptStore = new Map();

// Configuration
const RATE_LIMITS = {
  signup: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 60 * 60 * 1000 // 1 hour block
  },
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000 // 30 minutes block
  },
  prayer: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 10 * 60 * 1000 // 10 minutes block
  },
  testimonial: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 15 * 60 * 1000 // 15 minutes block
  }
};

/**
 * Get client IP address, handling proxies
 */
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         '127.0.0.1';
};

/**
 * Clean up expired attempts from store
 */
const cleanupExpiredAttempts = () => {
  const now = Date.now();
  for (const [key, data] of attemptStore.entries()) {
    if (now - data.lastAttempt > Math.max(...Object.values(RATE_LIMITS).map(r => r.windowMs))) {
      attemptStore.delete(key);
    }
  }
};

/**
 * Rate limiting middleware factory
 */
const createRateLimiter = (type) => {
  const config = RATE_LIMITS[type];
  if (!config) {
    throw new Error(`Rate limit configuration not found for type: ${type}`);
  }

  return (req, res, next) => {
    // Clean up expired attempts periodically
    if (Math.random() < 0.01) { // 1% chance to cleanup
      cleanupExpiredAttempts();
    }

    const clientIP = getClientIP(req);
    const key = `${type}:${clientIP}`;
    const now = Date.now();

    let attemptData = attemptStore.get(key);

    // Initialize if not exists
    if (!attemptData) {
      attemptData = {
        count: 0,
        firstAttempt: now,
        lastAttempt: now,
        isBlocked: false,
        blockUntil: null
      };
    }

    // Check if IP is currently blocked
    if (attemptData.isBlocked && attemptData.blockUntil && now < attemptData.blockUntil) {
      const remainingTime = Math.ceil((attemptData.blockUntil - now) / 1000 / 60); // minutes
      return res.status(429).json({
        message: 'Too many attempts. Please try again later.',
        rateLimited: true,
        retryAfter: remainingTime,
        type: 'blocked'
      });
    }

    // Reset if window has passed
    if (now - attemptData.firstAttempt > config.windowMs) {
      attemptData = {
        count: 0,
        firstAttempt: now,
        lastAttempt: now,
        isBlocked: false,
        blockUntil: null
      };
    }

    // Check if limit exceeded
    if (attemptData.count >= config.maxAttempts) {
      attemptData.isBlocked = true;
      attemptData.blockUntil = now + config.blockDurationMs;
      attemptStore.set(key, attemptData);

      const remainingTime = Math.ceil(config.blockDurationMs / 1000 / 60); // minutes
      return res.status(429).json({
        message: 'Rate limit exceeded. Please wait before trying again.',
        rateLimited: true,
        retryAfter: remainingTime,
        type: 'rate_limit_exceeded'
      });
    }

    // Increment attempt count
    attemptData.count++;
    attemptData.lastAttempt = now;
    attemptStore.set(key, attemptData);

    // Add rate limit info to response headers
    res.set({
      'X-RateLimit-Limit': config.maxAttempts,
      'X-RateLimit-Remaining': Math.max(0, config.maxAttempts - attemptData.count),
      'X-RateLimit-Reset': new Date(attemptData.firstAttempt + config.windowMs).toISOString()
    });

    // Warning when approaching limit
    if (attemptData.count >= config.maxAttempts - 1) {
      res.set('X-RateLimit-Warning', 'Approaching rate limit');
    }

    next();
  };
};

/**
 * Reset rate limit for a specific IP and type (for successful operations)
 */
const resetRateLimit = (req, type) => {
  const clientIP = getClientIP(req);
  const key = `${type}:${clientIP}`;
  attemptStore.delete(key);
};

/**
 * Check if IP is currently rate limited without incrementing
 */
const isRateLimited = (req, type) => {
  const clientIP = getClientIP(req);
  const key = `${type}:${clientIP}`;
  const now = Date.now();
  const attemptData = attemptStore.get(key);

  if (!attemptData) return false;

  // Check if blocked
  if (attemptData.isBlocked && attemptData.blockUntil && now < attemptData.blockUntil) {
    return true;
  }

  // Check if within window and over limit
  if (now - attemptData.firstAttempt <= RATE_LIMITS[type].windowMs && 
      attemptData.count >= RATE_LIMITS[type].maxAttempts) {
    return true;
  }

  return false;
};

/**
 * Get current rate limit status for an IP
 */
const getRateLimitStatus = (req, type) => {
  const clientIP = getClientIP(req);
  const key = `${type}:${clientIP}`;
  const attemptData = attemptStore.get(key);
  const config = RATE_LIMITS[type];

  if (!attemptData) {
    return {
      attempts: 0,
      remaining: config.maxAttempts,
      resetTime: null,
      isBlocked: false
    };
  }

  const now = Date.now();
  const windowRemaining = attemptData.firstAttempt + config.windowMs - now;

  return {
    attempts: attemptData.count,
    remaining: Math.max(0, config.maxAttempts - attemptData.count),
    resetTime: windowRemaining > 0 ? new Date(attemptData.firstAttempt + config.windowMs) : null,
    isBlocked: attemptData.isBlocked && attemptData.blockUntil && now < attemptData.blockUntil,
    blockUntil: attemptData.blockUntil ? new Date(attemptData.blockUntil) : null
  };
};

// Export specific rate limiters for different endpoints
module.exports = {
  signupRateLimit: createRateLimiter('signup'),
  loginRateLimit: createRateLimiter('login'),
  prayerRateLimit: createRateLimiter('prayer'),
  testimonialRateLimit: createRateLimiter('testimonial'),
  resetRateLimit,
  isRateLimited,
  getRateLimitStatus,
  getClientIP
};