// تست ساده اتصال و سرور
require('dotenv').config();
const express = require('express');
const cors = require('cors');

console.log('🚀 Starting simple test server...');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Test route
app.get('/api/health', (req, res) => {
  console.log('📋 Health check requested');
  res.json({ status: 'OK', message: 'Server is running!' });
});

// Simple books test
app.get('/api/bible/books', async (req, res) => {
  console.log('📚 Books requested');
  try {
    // Test database connection
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('🔗 Testing database connection...');
    const result = await pool.query('SELECT COUNT(*) FROM bible_books');
    console.log('✅ Found', result.rows[0].count, 'books in database');
    
    // Get actual books
    const booksResult = await pool.query(`
      SELECT id, name_en, name_fa, abbreviation, book_number
      FROM bible_books 
      ORDER BY book_number 
      LIMIT 5
    `);
    
    res.json({
      success: true,
      count: result.rows[0].count,
      sample: booksResult.rows
    });
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log('📋 Test: curl http://localhost:3001/api/health');
  console.log('📚 Test: curl http://localhost:3001/api/bible/books');
}).on('error', (err) => {
  console.error('❌ Server error:', err);
});
