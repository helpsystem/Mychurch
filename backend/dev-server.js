/**
 * Development Server - سرور سبک برای توسعه
 * بدون initialization دیتابیس - فقط برای تست سریع
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { initBroadcastWebSocket } = require('./broadcastWebSocket');

// Import routes
const authRoutes = require('./routes/authRoutes');
const bibleRoutes = require('./routes/bibleRoutes');
const bibleJsonRoutes = require('./routes/bible-json'); // JSON fallback
const aiChatRoutes = require('./routes/aiChatRoutes');
const leadersRoutes = require('./routes/leadersRoutes');
const sermonsRoutes = require('./routes/sermonsRoutes');
const eventsRoutes = require('./routes/eventsRoutes');
const worshipRoutes = require('./routes/worshipRoutes');
const prayerRoutes = require('./routes/prayerRoutes');
const imageRoutes = require('./routes/imageRoutes');
const wordprojectRoutes = require('./routes/wordproject');
const ttsRoutes = require('./routes/tts');
const audioRoutes = require('./routes/audioRoutes'); // Smart Audio Source Resolver
const downloadRoutes = require('./routes/downloadRoutes'); // WordProject Downloader
const bibleLocalRoutes = require('./routes/bible-local'); // Local Bible Data with HiDrive audio integration

// Schedule Events Routes
const scheduleRoutes = require('./routes/scheduleRoutes');

// Admin Panel Routes - Added for Admin features
const analyticsRoutes = require('./routes/analyticsRoutes');
const communicationsRoutes = require('./routes/communicationsRoutes');
const userRoutes = require('./routes/userRoutes');
const testimonialsRoutes = require('./routes/testimonialsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const announcementsRoutes = require('./routes/announcementsRoutes');
const galleriesRoutes = require('./routes/galleriesRoutes');
const broadcastRoutes = require('./routes/broadcastRoutes'); // Broadcast configs/presentations/uploads
const broadcastUploadRoutes = require('./routes/broadcastUploadRoutes'); // Video upload to HiDrive

// Try to load HiDrive routes
let hidriveRoutes;
try {
  hidriveRoutes = require('./routes/hidriveRoutes');
  console.log('✅ HiDrive routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load HiDrive routes:', error.message);
  hidriveRoutes = null;
}

// Try to load Hugging Face TTS routes
let huggingfaceTTSRoutes;
try {
  huggingfaceTTSRoutes = require('./routes/huggingfaceTTS');
  console.log('✅ Hugging Face TTS routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Hugging Face TTS routes:', error.message);
  console.error('   Stack:', error.stack);
}

// Try to load Gemini Audio Cache routes
let geminiAudioCacheRoutes;
try {
  console.log('🔄 Loading Gemini Audio Cache routes...');
  geminiAudioCacheRoutes = require('./routes/geminiAudioCache');
  console.log('✅ Gemini Audio Cache routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Gemini Audio Cache routes:', error.message);
  console.error('   Stack:', error.stack);
}

// Try to load Precision Timing routes (Gemini 2.5 Pro for worship songs)
let precisionTimingRoutes;
try {
  console.log('🔄 Loading Precision Timing routes...');
  precisionTimingRoutes = require('./routes/precisionTimingRoutes');
  console.log('✅ Precision Timing routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Precision Timing routes:', error.message);
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

// Serve Bible data (audio and timestamps) - IMPORTANT for local Bible audio playback
app.use('/bible_data', express.static(path.join(__dirname, '..', 'public', 'bible_data')));

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
app.use('/api/bible-json', bibleJsonRoutes); // JSON fallback API
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/leaders', leadersRoutes);
app.use('/api/sermons', sermonsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/worship-songs', worshipRoutes);
app.use('/api/prayer-requests', prayerRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/wordproject', wordprojectRoutes);

// Admin Panel Routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/communications', communicationsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/galleries', galleriesRoutes);
app.use('/api/schedule-events', scheduleRoutes);
app.use('/api/broadcast', broadcastRoutes); // Broadcast configs/presentations/file uploads
app.use('/api/broadcast/upload', broadcastUploadRoutes); // Video recording upload

if (huggingfaceTTSRoutes) {
  app.use('/api/tts/huggingface', huggingfaceTTSRoutes);
  console.log('✅ Hugging Face TTS routes registered at /api/tts/huggingface');
}
if (geminiAudioCacheRoutes) {
  app.use('/api/bible-audio', geminiAudioCacheRoutes);
  console.log('✅ Gemini Audio Cache routes registered at /api/bible-audio');
}
app.use('/api/tts', ttsRoutes);
app.use('/api/audio', audioRoutes); // Smart Audio Source Resolver
app.use('/api/downloads', downloadRoutes); // WordProject Downloader
app.use('/api/bible-local', bibleLocalRoutes); // Local Bible Data
if (hidriveRoutes) {
  app.use('/api/hidrive', hidriveRoutes); // IONOS HiDrive storage
  console.log('✅ HiDrive routes registered at /api/hidrive');
}
if (precisionTimingRoutes) {
  app.use('/api/timing', precisionTimingRoutes); // Precision Timing (Gemini 2.5 Pro)
  console.log('✅ Precision Timing routes registered at /api/timing');
}
console.log('✅ Smart Audio Source Resolver registered at /api/audio');
console.log('✅ WordProject Downloader registered at /api/downloads');

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
const server = http.createServer(app);

// Initialize WebSocket for broadcast sync
initBroadcastWebSocket(server);
console.log('🔌 Broadcast WebSocket initialized');

server.listen(PORT, '0.0.0.0', async () => {
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
  console.log('   🎨 /api/images/* - Auto-generated images');
  console.log(`   🔌 ws://localhost:${PORT}/ws/broadcast-sync - Broadcast WebSocket\n`);
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
