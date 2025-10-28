/**
 * Development Server - سرور سبک برای توسعه
 * بدون initialization دیتابیس - فقط برای تست سریع
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const bibleRoutes = require('./routes/bibleRoutes');
const aiChatRoutes = require('./routes/aiChatRoutes');
const leadersRoutes = require('./routes/leadersRoutes');
const sermonsRoutes = require('./routes/sermonsRoutes');
const eventsRoutes = require('./routes/eventsRoutes');
const worshipRoutes = require('./routes/worshipRoutes');
const prayerRoutes = require('./routes/prayerRoutes');
const imageRoutes = require('./routes/imageRoutes');
const wordprojectRoutes = require('./routes/wordproject');
const ttsRoutes = require('./routes/tts');

// Try to load Hugging Face TTS routes
let huggingfaceTTSRoutes;
try {
  huggingfaceTTSRoutes = require('./routes/huggingfaceTTS');
  console.log('✅ Hugging Face TTS routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Hugging Face TTS routes:', error.message);
  console.error('   Stack:', error.stack);
}

// Import services
const imageService = require('./services/imageGenerationService');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://localhost:3001',
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, true); // در dev mode همه رو قبول کن
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Serve static files (generated images)
app.use('/generated-images', express.static(path.join(__dirname, '..', 'public', 'generated-images')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    uptime: process.uptime(), 
    ts: Date.now(),
    mode: 'development',
    version: '1.0.0'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bible', bibleRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/leaders', leadersRoutes);
app.use('/api/sermons', sermonsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/worship-songs', worshipRoutes);
app.use('/api/prayer-requests', prayerRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/wordproject', wordprojectRoutes);
if (huggingfaceTTSRoutes) {
  app.use('/api/tts/huggingface', huggingfaceTTSRoutes);
  console.log('✅ Hugging Face TTS routes registered at /api/tts/huggingface');
}
app.use('/api/tts', ttsRoutes);

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'Church API - Development Server',
    mode: 'development',
    endpoints: {
      health: '/api/health',
      bible: '/api/bible/*',
      aiChat: '/api/ai-chat/*',
      auth: '/api/auth/*',
      leaders: '/api/leaders/*',
      sermons: '/api/sermons/*',
      events: '/api/events/*',
      worship: '/api/worship-songs/*',
      prayer: '/api/prayer-requests/*'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log('\n🚀 ====================================');
  console.log('🚀  Development Server Started');
  console.log('🚀 ====================================\n');
  console.log(`✅ Server: http://localhost:${PORT}`);
  console.log(`📖 Bible API: http://localhost:${PORT}/api/bible/books`);
  console.log(`🤖 AI Chat: http://localhost:${PORT}/api/ai-chat/daily-verse`);
  console.log(`🎨 Images: http://localhost:${PORT}/api/images/status`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/health\n`);
  console.log('📝 Available Routes:');
  console.log('   🔐 /api/auth/* - Authentication');
  console.log('   📖 /api/bible/* - Bible content');
  console.log('   🤖 /api/ai-chat/* - AI Chat assistant');
  console.log('   👥 /api/leaders/* - Church leaders');
  console.log('   🎤 /api/sermons/* - Sermons');
  console.log('   📅 /api/events/* - Events');
  console.log('   🎵 /api/worship-songs/* - Worship songs');
  console.log('   🙏 /api/prayer-requests/* - Prayer requests');
  console.log('   🎨 /api/images/* - Auto-generated images\n');
  console.log('🔧 Mode: Development (No DB initialization)');
  console.log('🔧 Hot reload: nodemon recommended\n');
  
  // Initialize Image Generation Service
  try {
    await imageService.initialize();
    console.log('🎨 Image Generation Service ready\n');
  } catch (error) {
    console.error('⚠️  Image Generation Service failed to start:', error.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
