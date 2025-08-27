const pool = require('./db');

const insertData = async () => {
  const connection = await pool.getConnection();
  try {
    console.log('🚀 شروع وارد کردن داده‌های اولیه...');

    // Leaders
    await connection.query(`
      INSERT INTO leaders (name, title, imageUrl) VALUES
      ('Rev. Javad Pishghadamian', '{"en": "Senior Pastor", "fa": "کشیش ارشد"}', 'https://i.pravatar.cc/400?u=javad'),
      ('Nazi Rasti', '{"en": "Women\\'s Bible Study Leader", "fa": "رهبر مطالعه کتاب مقدس بانوان"}', 'https://i.pravatar.cc/400?u=nazi')
      ON DUPLICATE KEY UPDATE name=VALUES(name);
    `);

    // Sermons
    await connection.query(`
      INSERT INTO sermons (title, speaker, date, audioUrl) VALUES
      ('{"en": "The Power of Forgiveness", "fa": "قدرت بخشش"}', 'Rev. Javad Pishghadamian', '2024-07-21', '#'),
      ('{"en": "Living in Hope", "fa": "زندگی در امید"}', 'Rev. Javad Pishghadamian', '2024-07-14', '#')
      ON DUPLICATE KEY UPDATE speaker=VALUES(speaker);
    `);

    // Events
    await connection.query(`
      INSERT INTO events (title, date, description, imageUrl) VALUES
      ('{"en": "Summer Picnic", "fa": "پیک‌نیک تابستانی"}', '{"en": "August 17, 2024", "fa": "مرداد ۲۷, ۱۴۰۳"}',
      '{"en": "Join us for a day of fun, food, and fellowship at Rock Creek Park.", "fa": "برای یک روز پر از سرگرمی، غذا و مشارکت در پارک راک کریک به ما بپیوندید."}',
      'https://images.unsplash.com/photo-1508361001413-7a9dca2c302d')
      ON DUPLICATE KEY UPDATE imageUrl=VALUES(imageUrl);
    `);

    // Worship Songs
    await connection.query(`
      INSERT INTO worship_songs (title, artist, youtubeId) VALUES
      ('{"en": "In Christ Alone", "fa": "تنها در مسیح"}', 'Kristian Stanfill, Passion', 'rJgN-p_8p9Y'),
      ('{"en": "Amazing Grace (My Chains Are Gone)", "fa": "فیض حیرت‌انگیز (زنجیرهایم گسست)"}', 'Chris Tomlin', 'Jbe7OruLk8I')
      ON DUPLICATE KEY UPDATE artist=VALUES(artist);
    `);

    // Schedule Events
    await connection.query(`
      INSERT INTO schedule_events (title, description, leader, date, startTime, endTime, type, location) VALUES
      ('{"en": "Sunday Worship Service", "fa": "مراسم پرستشی یکشنبه"}',
      '{"en": "Join us for our main weekly gathering.", "fa": "به ما در گردهمایی اصلی هفتگی بپیوندید."}',
      'Rev. Javad Pishghadamian', '2024-08-04', '16:00', '18:00', 'in-person',
      '13000 Georgia Ave, Silver Spring, MD 20906, USA')
      ON DUPLICATE KEY UPDATE leader=VALUES(leader);
    `);

    // Environment Variables
    await connection.query(`
      INSERT INTO environment_variables (name, value, is_secret) VALUES
      ('DB_HOST', 'localhost', 0),
      ('DB_NAME', 'npyugcbr_iranjesusdc', 0),
      ('DB_USER', 'npyugcbr_saman', 0),
      ('DB_PASS', 'Samyar@@1368', 1),
      ('JWT_SECRET', 'eyJhbGciOiJIUzI1NiJ9.MySuperSecretKey.3GSrJhSk', 1)
      ON DUPLICATE KEY UPDATE value=VALUES(value);
    `);

    console.log('✅ داده‌های اولیه با موفقیت وارد شدند.');
  } catch (err) {
    console.error('❌ خطا در وارد کردن داده‌های اولیه:', err.message);
  } finally {
    connection.release();
    process.exit(0);
  }
};

insertData();
