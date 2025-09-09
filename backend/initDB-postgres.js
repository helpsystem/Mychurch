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

  `CREATE TABLE IF NOT EXISTS prayers (
    id SERIAL PRIMARY KEY,
    title JSONB NOT NULL,
    description JSONB NOT NULL,
    author VARCHAR(255) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS testimonials (
    id SERIAL PRIMARY KEY,
    title JSONB NOT NULL,
    content JSONB NOT NULL,
    author VARCHAR(255) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
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
    
    // ایجاد کاربر admin پیش‌فرض
    const adminCheck = await client.query('SELECT * FROM users WHERE email = $1', ['admin@church.com']);
    if (adminCheck.rows.length === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await client.query(
        'INSERT INTO users (email, password, role, permissions) VALUES ($1, $2, $3, $4)',
        ['admin@church.com', hashedPassword, 'SUPER_ADMIN', JSON.stringify(['all'])]
      );
      console.log('✅ کاربر admin پیش‌فرض ایجاد شد (admin@church.com / admin123)');
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