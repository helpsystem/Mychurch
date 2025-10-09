// سرور فوق‌العاده ساده فقط برای Bible
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

console.log('🚀 Starting Bible API Server...');

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Import Bible routes
const bibleRoutes = require('./routes/bibleRoutes');

// Use Bible routes
app.use('/api/bible', bibleRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Bible API Server is running',
    database: 'Supabase',
    timestamp: new Date().toISOString()
  });
});

// Root
app.get('/', (req, res) => {
  res.json({ 
    message: 'Iran Church DC - Bible API', 
    endpoints: {
      books: '/api/bible/books',
      chapter: '/api/bible/content/:book/:chapter',
      health: '/api/health'
    }
  });
});

// Start server without any database initialization
app.listen(PORT, () => {
  console.log(`✅ Bible API Server running on http://localhost:${PORT}`);
  console.log('📖 Available endpoints:');
  console.log('  GET /api/bible/books - List all Bible books');
  console.log('  GET /api/bible/content/:book/:chapter - Get chapter content');
  console.log('  GET /api/health - Health check');
  console.log('🔗 Database: Connected to Supabase PostgreSQL');
});