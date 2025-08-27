const mysql = require('mysql2/promise');

// Use dotenv for local development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  // For Cloud Run, use a socket path. For local dev, use host/port.
  socketPath: process.env.INSTANCE_CONNECTION_NAME ? `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}` : undefined,
  host: process.env.DB_HOST, // e.g., '127.0.0.1' for local
  port: process.env.DB_PORT, // e.g., 3306 for local
};

const pool = mysql.createPool(dbConfig);

module.exports = pool;