const express = require('express');
const { pool } = require('../db-postgres');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

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

// GET /api/settings - دریافت تمام تنظیمات
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings');
    const settings = {};
    
    result.rows.forEach(setting => {
      settings[setting.key] = parseJSON(setting.value, setting.value);
    });

    // If no settings exist, return defaults
    if (Object.keys(settings).length === 0) {
      const defaultSettings = {
        churchName: { en: 'Iranian Christian Church of D.C.', fa: 'کلیسای مسیحی ایرانی واشنگتن دی‌سی' },
        footerDescription: { en: 'A new way to find faith and community. Reliable, and welcoming.', fa: 'راهی جدید برای یافتن ایمان و اجتماع. قابل اعتماد و پذیرا.' },
        address: '1234 Main St, Washington, DC 20001',
        phone: '+1 (555) 123-4567',
        whatsappNumber: '+1 (555) 123-4567',
        meetingTime: { en: 'Sundays 10:30 AM', fa: 'یکشنبه‌ها ساعت ۱۰:۳۰ صبح' },
        facebookUrl: 'https://facebook.com/churchname',
        youtubeUrl: 'https://youtube.com/churchname',
        instagramUrl: 'https://instagram.com/churchname',
        logoUrl: '/images/church-logo-ultra-hd.png',
        verseOfTheDayAttribution: { en: 'In His Service,\nRev. Javad Pishghadamian\nSenior Pastor', fa: 'در خدمت او،\nکشیش جواد پیشقدمیان\nکشیش ارشد' },
        newsletterUrl: '#',
        telegramUrl: '#',
        whatsappGroupUrl: '#'
      };
      res.json(defaultSettings);
    } else {
      res.json(settings);
    }
  } catch (error) {
    console.error('Fetch Settings Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/settings/storage - دریافت تنظیمات ذخیره‌سازی
router.get('/storage', async (req, res) => {
  try {
    const result = await pool.query('SELECT value FROM settings WHERE key = $1', ['storage']);
    
    if (result.rows.length === 0) {
      // Return default storage settings
      const defaultStorageSettings = {
        defaultImageStorage: 'local',
        ftp: {
          host: '',
          port: 21,
          user: '',
          pass: '',
          path: '/public_html/images'
        }
      };
      res.json(defaultStorageSettings);
    } else {
      res.json(parseJSON(result.rows[0].value, {}));
    }
  } catch (error) {
    console.error('Fetch Storage Settings Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/settings - بروزرسانی تنظیمات
router.put('/', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const settings = req.body;

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete all existing settings
      await client.query('DELETE FROM settings WHERE key != $1', ['storage']);
      
      // Insert new settings
      for (const [key, value] of Object.entries(settings)) {
        if (key !== 'storage') {
          await client.query(
            'INSERT INTO settings (key, value, description) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
            [key, JSON.stringify(value), `Setting for ${key}`]
          );
        }
      }
      
      await client.query('COMMIT');
      res.json({ message: 'Settings updated successfully.' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update Settings Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/settings/storage - بروزرسانی تنظیمات ذخیره‌سازی
router.put('/storage', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const storageSettings = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO settings (key, value, description) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP RETURNING *',
      ['storage', JSON.stringify(storageSettings), 'Storage configuration settings']
    );

    res.json({
      message: 'Storage settings updated successfully.',
      settings: parseJSON(result.rows[0].value, {})
    });
  } catch (error) {
    console.error('Update Storage Settings Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/settings/:key - دریافت تنظیم خاص
router.get('/:key', async (req, res) => {
  const { key } = req.params;

  try {
    const result = await pool.query('SELECT value FROM settings WHERE key = $1', [key]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Setting not found.' });
    }

    res.json({ [key]: parseJSON(result.rows[0].value, null) });
  } catch (error) {
    console.error('Fetch Setting Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/settings/:key - بروزرسانی تنظیم خاص
router.put('/:key', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO settings (key, value, description) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP RETURNING *',
      [key, JSON.stringify(value), `Setting for ${key}`]
    );

    res.json({
      message: 'Setting updated successfully.',
      [key]: parseJSON(result.rows[0].value, null)
    });
  } catch (error) {
    console.error('Update Setting Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;