// سرور ساده Express فقط برای Bible API
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Error handling
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection:', reason);
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

console.log('🔗 Connecting to Supabase PostgreSQL...');

// Add all the route imports
const bibleRoutes = require('./routes/bibleRoutes');

// Check if Twilio is configured
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  console.log('⚠️ Twilio credentials not configured');
}

// Check mail service
const mailAvailable = Boolean(process.env.REPLIT_DB_URL);
console.log('📧 Replit Mail available:', mailAvailable);

// Use routes
app.use('/api/bible', bibleRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Bible API is running',
    timestamp: new Date().toISOString(),
    database: 'Supabase Connected'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Iran Church DC Bible API', 
    endpoints: ['/api/bible/books', '/api/bible/content/:book/:chapter', '/api/health']
  });
});

// Serve React app for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Initialize database in background
const initializeDatabase = async () => {
  try {
    console.log('🔄 شروع مقداردهی اولیه دیتابیس...');
    const { initializeDatabase: initDB } = require('./initDB-postgres');
    await initDB();
    console.log('✅ دیتابیس آماده است');
  } catch (error) {
    console.error('⚠️ خطا در مقداردهی اولیه دیتابیس:', error.message);
    console.log('🔄 ادامه اجرا بدون مقداردهی اولیه...');
  }
};

// Start server
app.listen(PORT, () => {
  console.log(`✅ Church API Backend running on http://localhost:${PORT}`);
  console.log('API endpoints available:');
  console.log('  📖 /api/bible/* - Bible content and search');
  console.log('  ❤️ /api/health - Health check');
  
  // Initialize database in background (non-blocking)
  setTimeout(initializeDatabase, 1000);
});