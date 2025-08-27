const pool = require('./db');

const queries = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('USER', 'MANAGER', 'SUPER_ADMIN') NOT NULL,
    permissions JSON,
    profileData JSON,
    invitations JSON
  );`,

  `CREATE TABLE IF NOT EXISTS leaders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title JSON NOT NULL,
    imageUrl VARCHAR(500)
  );`,

  `CREATE TABLE IF NOT EXISTS sermons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title JSON NOT NULL,
    speaker VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    audioUrl VARCHAR(500) NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title JSON NOT NULL,
    date JSON NOT NULL,
    description JSON NOT NULL,
    imageUrl VARCHAR(500) NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS worship_songs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title JSON NOT NULL,
    artist VARCHAR(255) NOT NULL,
    youtubeId VARCHAR(50) NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS schedule_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title JSON NOT NULL,
    description JSON NOT NULL,
    leader VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    type ENUM('in-person', 'online', 'hybrid') NOT NULL,
    location VARCHAR(500) NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS environment_variables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    is_secret BOOLEAN NOT NULL DEFAULT 1
  );`
];

(async () => {
  const connection = await pool.getConnection();
  try {
    for (let i = 0; i < queries.length; i++) {
      await connection.query(queries[i]);
      console.log(`✅ Table ${i + 1} created successfully.`);
    }
    console.log('✅ تمامی جداول با موفقیت در MySQL ساخته شدند');
  } catch (err) {
    console.error('❌ خطا در ساخت جداول:', err.message);
  } finally {
    connection.release();
    process.exit(0);
  }
})();
