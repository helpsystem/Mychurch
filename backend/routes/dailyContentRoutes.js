const express = require('express');
const { pool } = require('../db-postgres');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// GET /api/daily-content - Get all daily content (admin only)
router.get('/', authenticateToken, authorizeRoles('MANAGER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { 
      date,
      searchTerm, 
      filterStatus = 'all',
      page = 1,
      limit = 50 
    } = req.query;

    let query = 'SELECT * FROM daily_contents';
    let conditions = [];
    let params = [];
    let paramIndex = 1;

    // Date filter
    if (date) {
      conditions.push(`date = $${paramIndex}`);
      params.push(date);
      paramIndex++;
    }

    // Search filter
    if (searchTerm) {
      conditions.push(`(
        scripture->>'reference' ILIKE $${paramIndex} OR
        scripture->'text'->>'en' ILIKE $${paramIndex} OR
        scripture->'text'->>'fa' ILIKE $${paramIndex} OR
        devotional_theme->>'en' ILIKE $${paramIndex} OR
        devotional_theme->>'fa' ILIKE $${paramIndex}
      )`);
      params.push(`%${searchTerm}%`);
      paramIndex++;
    }

    // Status filter
    if (filterStatus !== 'all') {
      const isActive = filterStatus === 'active';
      conditions.push(`is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY date DESC';

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM daily_contents';
    let countParams = [];
    let countParamIndex = 1;
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      // Remove limit/offset params and add search params
      countParams = params.slice(0, -2);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      contents: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching daily contents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily contents',
      error: error.message
    });
  }
});

// GET /api/daily-content/public - Get public content by date (no auth required)
router.get('/public', async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const result = await pool.query(
      'SELECT * FROM daily_contents WHERE date = $1 AND is_active = true',
      [date]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        content: null,
        message: 'No content found for this date'
      });
    }

    res.json({
      success: true,
      content: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching public daily content:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily content',
      error: error.message
    });
  }
});

// POST /api/daily-content - Create new daily content (admin only)
router.post('/', authenticateToken, authorizeRoles('MANAGER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { 
      date,
      scripture,
      worshipSong,
      devotionalTheme,
      isActive = true
    } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Check if content already exists for this date
    const existingContent = await pool.query(
      'SELECT id FROM daily_contents WHERE date = $1',
      [date]
    );

    if (existingContent.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Content already exists for this date'
      });
    }

    const result = await pool.query(
      `INSERT INTO daily_contents 
       (date, scripture, worship_song, devotional_theme, is_active, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        date,
        scripture ? JSON.stringify(scripture) : null,
        worshipSong ? JSON.stringify(worshipSong) : null,
        devotionalTheme ? JSON.stringify(devotionalTheme) : null,
        isActive,
        req.user.email
      ]
    );

    res.status(201).json({
      success: true,
      content: result.rows[0],
      message: 'Daily content created successfully'
    });
  } catch (error) {
    console.error('Error creating daily content:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating daily content',
      error: error.message
    });
  }
});

// PUT /api/daily-content/:id - Update daily content (admin only)
router.put('/:id', authenticateToken, authorizeRoles('MANAGER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      date,
      scripture,
      worshipSong,
      devotionalTheme,
      isActive
    } = req.body;

    // Check if content exists
    const existingContent = await pool.query(
      'SELECT * FROM daily_contents WHERE id = $1',
      [id]
    );

    if (existingContent.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Check for date conflict with other content
    if (date) {
      const dateConflict = await pool.query(
        'SELECT id FROM daily_contents WHERE date = $1 AND id != $2',
        [date, id]
      );

      if (dateConflict.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Another content already exists for this date'
        });
      }
    }

    const result = await pool.query(
      `UPDATE daily_contents 
       SET date = COALESCE($1, date),
           scripture = COALESCE($2, scripture),
           worship_song = COALESCE($3, worship_song),
           devotional_theme = COALESCE($4, devotional_theme),
           is_active = COALESCE($5, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [
        date,
        scripture ? JSON.stringify(scripture) : null,
        worshipSong ? JSON.stringify(worshipSong) : null,
        devotionalTheme ? JSON.stringify(devotionalTheme) : null,
        isActive,
        id
      ]
    );

    res.json({
      success: true,
      content: result.rows[0],
      message: 'Daily content updated successfully'
    });
  } catch (error) {
    console.error('Error updating daily content:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating daily content',
      error: error.message
    });
  }
});

// DELETE /api/daily-content/:id - Delete daily content (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('MANAGER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM daily_contents WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      message: 'Daily content deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting daily content:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting daily content',
      error: error.message
    });
  }
});

// PATCH /api/daily-content/:id/toggle - Toggle active status (admin only)
router.patch('/:id/toggle', authenticateToken, authorizeRoles('MANAGER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const result = await pool.query(
      `UPDATE daily_contents 
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [isActive, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      content: result.rows[0],
      message: `Content ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling content status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling content status',
      error: error.message
    });
  }
});

// POST /api/daily-content/generate-week - Generate weekly content (admin only)
router.post('/generate-week', authenticateToken, authorizeRoles('MANAGER', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { startDate } = req.body;

    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date is required'
      });
    }

    const generatedContents = [];
    const startDateObj = new Date(startDate);

    // Sample scripture verses for generation
    const sampleScriptures = [
      {
        reference: 'John 3:16',
        text: {
          en: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
          fa: 'زیرا خدا آنقدر جهان را دوست داشت که پسر یگانه خود را داد، تا هر که بر او ایمان آورد هلاک نشود، بلکه حیات جاودانی یابد.'
        },
        theme: "God's Love"
      },
      {
        reference: 'Psalms 23:1',
        text: {
          en: 'The Lord is my shepherd, I lack nothing.',
          fa: 'خداوند شبان من است، محتاج چیزی نخواهم بود.'
        },
        theme: "God's Provision"
      },
      {
        reference: 'Philippians 4:13',
        text: {
          en: 'I can do all this through him who gives me strength.',
          fa: 'همه چیز را در مسیح که مرا تقویت می‌کند می‌توانم انجام دهم.'
        },
        theme: "Strength in Christ"
      },
      {
        reference: 'Romans 8:28',
        text: {
          en: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
          fa: 'و می‌دانیم که خدا همه چیز را برای خیر کسانی که او را دوست دارند و بر اساس قصد او خوانده شده‌اند، می‌سازد.'
        },
        theme: "God's Plan"
      },
      {
        reference: 'Jeremiah 29:11',
        text: {
          en: 'For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, to give you hope and a future.',
          fa: 'زیرا من نقشه‌هایی را که برای شما دارم می‌دانم، می‌فرماید خداوند، نقشه‌هایی برای رفاه شما و نه برای آسیب رساندن به شما، برای دادن امید و آینده به شما.'
        },
        theme: "Hope and Future"
      },
      {
        reference: 'Matthew 28:20',
        text: {
          en: 'And surely I am with you always, to the very end of the age.',
          fa: 'و یقیناً من همیشه تا آخر دوران با شما هستم.'
        },
        theme: "God's Presence"
      },
      {
        reference: '1 Corinthians 13:4-5',
        text: {
          en: 'Love is patient, love is kind. It does not envy, it does not boast, it is not proud. It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs.',
          fa: 'محبت صبور است، محبت مهربان است. حسادت نمی‌کند، فخر نمی‌فروشد، متکبر نیست. دیگران را بی‌احترام نمی‌کند، خودخواه نیست، زود عصبانی نمی‌شود، خطاها را یادداشت نمی‌کند.'
        },
        theme: "Love"
      }
    ];

    // Sample devotional themes
    const sampleThemes = [
      { en: "Walking in Faith", fa: "راه رفتن در ایمان" },
      { en: "God's Grace", fa: "فیض خدا" },
      { en: "Prayer and Trust", fa: "دعا و اعتماد" },
      { en: "Serving Others", fa: "خدمت به دیگران" },
      { en: "Peace in Christ", fa: "آرامش در مسیح" },
      { en: "Hope in Trials", fa: "امید در آزمایش‌ها" },
      { en: "God's Faithfulness", fa: "وفاداری خدا" }
    ];

    // Sample worship songs
    const sampleSongs = [
      {
        id: 'song-1',
        title: { en: 'Amazing Grace', fa: 'فیض شگفت‌انگیز' },
        artist: 'Traditional'
      },
      {
        id: 'song-2',
        title: { en: 'How Great Thou Art', fa: 'چقدر عظیم هستی' },
        artist: 'Carl Boberg'
      },
      {
        id: 'song-3',
        title: { en: 'Blessed Assurance', fa: 'اطمینان مبارک' },
        artist: 'Fanny Crosby'
      },
      {
        id: 'song-4',
        title: { en: 'Great Is Thy Faithfulness', fa: 'وفاداری تو عظیم است' },
        artist: 'Thomas Chisholm'
      }
    ];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDateObj);
      currentDate.setDate(startDateObj.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];

      // Check if content already exists for this date
      const existingContent = await pool.query(
        'SELECT id FROM daily_contents WHERE date = $1',
        [dateString]
      );

      if (existingContent.rows.length === 0) {
        const scripture = sampleScriptures[i % sampleScriptures.length];
        const theme = sampleThemes[i % sampleThemes.length];
        const song = sampleSongs[i % sampleSongs.length];

        const result = await pool.query(
          `INSERT INTO daily_contents 
           (date, scripture, worship_song, devotional_theme, is_active, created_by) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           RETURNING *`,
          [
            dateString,
            JSON.stringify(scripture),
            JSON.stringify(song),
            JSON.stringify(theme),
            true,
            req.user.email
          ]
        );

        generatedContents.push(result.rows[0]);
      }
    }

    res.json({
      success: true,
      generatedCount: generatedContents.length,
      contents: generatedContents,
      message: `Generated ${generatedContents.length} daily content entries for the week`
    });
  } catch (error) {
    console.error('Error generating weekly content:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating weekly content',
      error: error.message
    });
  }
});

module.exports = router;