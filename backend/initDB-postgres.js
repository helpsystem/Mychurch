const { pool } = require('./db-postgres');

const queries = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('USER', 'MANAGER', 'SUPER_ADMIN')) NOT NULL,
    permissions JSONB DEFAULT '[]',
    profileData JSONB DEFAULT '{}',
    invitations JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS leaders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title JSONB NOT NULL,
    imageUrl VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS sermons (
    id SERIAL PRIMARY KEY,
    title JSONB NOT NULL,
    speaker VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    audioUrl VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title JSONB NOT NULL,
    date JSONB NOT NULL,
    description JSONB NOT NULL,
    imageUrl VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS worship_songs (
    id SERIAL PRIMARY KEY,
    title JSONB NOT NULL,
    artist VARCHAR(255) NOT NULL,
    youtubeId VARCHAR(50) NOT NULL,
    lyrics JSONB DEFAULT '{}',
    audioUrl VARCHAR(500),
    videoUrl VARCHAR(500),
    category VARCHAR(50) DEFAULT 'worship',
    tags JSONB DEFAULT '[]',
    copyright VARCHAR(500),
    presentation_file_url VARCHAR(500),
    pdf_file_url VARCHAR(500),
    sheet_music_url VARCHAR(500),
    chords TEXT,
    notation TEXT,
    notes TEXT,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS schedule_events (
    id SERIAL PRIMARY KEY,
    title JSONB NOT NULL,
    description JSONB NOT NULL,
    leader VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    type VARCHAR(20) CHECK (type IN ('in-person', 'online', 'hybrid')) NOT NULL,
    location VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS environment_variables (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    is_secret BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS prayer_requests (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    category VARCHAR(50) CHECK (category IN ('thanksgiving', 'healing', 'guidance', 'family', 'other')) DEFAULT 'other',
    is_anonymous BOOLEAN DEFAULT false,
    author_name VARCHAR(255),
    author_email VARCHAR(255),
    author_phone VARCHAR(50),
    prayer_count INTEGER DEFAULT 0,
    urgency VARCHAR(20) CHECK (urgency IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS testimonials (
    id SERIAL PRIMARY KEY,
    title JSONB NOT NULL,
    content JSONB NOT NULL,
    author VARCHAR(255) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS presentations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slides JSONB NOT NULL DEFAULT '[]',
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS daily_contents (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    scripture JSONB,
    worship_song JSONB,
    devotional_theme JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS daily_messages (
    id SERIAL PRIMARY KEY,
    title JSONB NOT NULL,
    content JSONB NOT NULL,
    bible_verse JSONB,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    channels JSONB NOT NULL DEFAULT '["website"]',
    is_published BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    recipient_count INTEGER DEFAULT 0,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(scheduled_date, scheduled_time)
  );`,

  `CREATE TABLE IF NOT EXISTS galleries (
    id SERIAL PRIMARY KEY,
    title JSONB NOT NULL,
    description JSONB DEFAULT '{}',
    images JSONB DEFAULT '[]',
    coverImage VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title JSONB NOT NULL,
    content JSONB NOT NULL,
    status VARCHAR(20) CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS bible_books (
    id SERIAL PRIMARY KEY,
    book_number INTEGER UNIQUE NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_fa VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(20) UNIQUE NOT NULL,
    testament VARCHAR(10) CHECK (testament IN ('old', 'new')) NOT NULL,
    chapters_count INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS bible_chapters (
    id SERIAL PRIMARY KEY,
    chapter_id VARCHAR(50) UNIQUE NOT NULL,
    book_id INTEGER REFERENCES bible_books(id),
    chapter_number INTEGER NOT NULL,
    title_en VARCHAR(255),
    title_fa VARCHAR(255),
    summary_en TEXT,
    summary_fa TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(book_id, chapter_number)
  );`,

  `CREATE TABLE IF NOT EXISTS bible_verses (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES bible_books(id),
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text_en TEXT,
    text_fa TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(book_id, chapter, verse)
  );`,

  `CREATE TABLE IF NOT EXISTS church_letters (
    id SERIAL PRIMARY KEY,
    title JSONB NOT NULL,
    content JSONB NOT NULL,
    author VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    imageUrl VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`
];

const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 در حال ایجاد جداول PostgreSQL...');
    
    for (let i = 0; i < queries.length; i++) {
      await client.query(queries[i]);
      console.log(`✅ جدول ${i + 1} با موفقیت ایجاد شد`);
    }
    
    console.log('✅ تمامی جداول با موفقیت در PostgreSQL ساخته شدند');
    
    // ایجاد کاربر admin امن
    const adminCheck = await client.query('SELECT * FROM users WHERE email = $1', ['admin@mychurch.com']);
    if (adminCheck.rows.length === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'MyChurchSecureAdmin2024!', 10);
      await client.query(
        'INSERT INTO users (email, password, role, permissions) VALUES ($1, $2, $3, $4)',
        ['admin@mychurch.com', hashedPassword, 'SUPER_ADMIN', JSON.stringify(['all'])]
      );
      console.log('✅ کاربر admin امن ایجاد شد (admin@mychurch.com / MyChurchSecureAdmin2024!)');
      console.log('⚠️  لطفاً پس از اولین ورود، رمز عبور را تغییر دهید!');
    }
    
  } catch (err) {
    console.error('❌ خطا در ساخت جداول:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

// اگر مستقیماً اجرا شود
if (require.main === module) {
  (async () => {
    try {
      await initializeDatabase();
      console.log('🎉 دیتابیس آماده است!');
      process.exit(0);
    } catch (err) {
      console.error('❌ خطا:', err);
      process.exit(1);
    }
  })();
}

module.exports = { initializeDatabase };