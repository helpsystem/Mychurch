const { pool } = require('./db-postgres');

// bcrypt fallback: prefer native bcrypt, fall back to bcryptjs if native not available
let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  try {
    bcrypt = require('bcryptjs');
    console.warn('⚠️ native bcrypt not found, using bcryptjs as fallback');
  } catch (e2) {
    bcrypt = null;
    console.warn('⚠️ bcrypt and bcryptjs not available — admin password will be inserted without hashing (not secure)');
  }
}

// Helper to run queries that works with both real pool and dummyPool exported when DATABASE_URL is missing
const runQuery = async (sql, params = []) => {
  // If pool exposes query directly (normal Pool & dummyPool), use it
  if (pool && typeof pool.query === 'function') {
    return pool.query(sql, params);
  }

  // Otherwise try to connect and use client.query
  if (pool && typeof pool.connect === 'function') {
    const client = await pool.connect();
    try {
      if (client && typeof client.query === 'function') {
        return await client.query(sql, params);
      }
      // If client doesn't have query, but pool had a fallback query earlier, throw
      throw new Error('Database client has no query method');
    } finally {
      try { client.release && client.release(); } catch (e) {}
    }
  }

  throw new Error('No database query method available');
};

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
    abbreviation VARCHAR(10) UNIQUE NOT NULL,
    testament VARCHAR(10) CHECK (testament IN ('old', 'new')) NOT NULL,
    chapters_count INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  );`
];

const initializeDatabase = async () => {
  try {
    console.log('🔄 در حال ایجاد جداول PostgreSQL...');

    for (let i = 0; i < queries.length; i++) {
      await runQuery(queries[i]);
      console.log(`✅ جدول ${i + 1} با موفقیت ایجاد شد`);
    }
    
    console.log('✅ تمامی جداول با موفقیت در PostgreSQL ساخته شدند');
    
    // ایجاد کاربر admin پیش‌فرض
    const adminCheck = await runQuery('SELECT * FROM users WHERE email = $1', ['help.system@ymail.com']);
    if ((adminCheck.rows || []).length === 0) {
      let hashedPassword;
      if (bcrypt && typeof bcrypt.hash === 'function') {
        hashedPassword = await bcrypt.hash('admin123', 10);
      } else {
        // As a last resort, store plain text (not secure) — better than crashing during init
        hashedPassword = 'admin123';
      }
      await runQuery(
        'INSERT INTO users (email, password, role, permissions) VALUES ($1, $2, $3, $4)',
        ['help.system@ymail.com', hashedPassword, 'SUPER_ADMIN', JSON.stringify(['all'])]
      );
      console.log('✅ کاربر admin پیش‌فرض ایجاد شد (help.system@ymail.com / admin123)');
    }
  } catch (err) {
    console.error('❌ خطا در ساخت جداول:', err.message);
    throw err;
  }
};

// اگر مستقیماً اجرا شود
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 دیتابیس آماده است!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ خطا:', err);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };