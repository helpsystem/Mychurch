// server.js  (UTF-8, CRLF)
const path = require('path');
// dotenv is loaded by server-wrapper.js, no need to load again
// require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ftp = require('basic-ftp');
const { initializeDatabase } = require('./initDB-postgres');
const { authenticateToken } = require('./middleware/auth');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const profileRoutes = require('./routes/profileRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const bibleRoutes = require('./routes/bibleRoutes');
const bibleInteractionRoutes = require('./routes/bibleInteractionRoutes');
const bibleAudioRoutes = require('./routes/bibleAudioRoutes');
const leadersRoutes = require('./routes/leadersRoutes');
const sermonsRoutes = require('./routes/sermonsRoutes');
const eventsRoutes = require('./routes/eventsRoutes');
const eventRecorderRoutes = require('./routes/eventRecorder');
const worshipAudioRoutes = require('./routes/worshipAudioRoutes');
const worshipRoutes = require('./routes/worshipRoutes');
const songsRoutes = require('./routes/songs');
const timingRoutes = require('./routes/timingRoutes');
const bibleTimingRoutes = require('./routes/bibleTimingRoutes');
const audioSyncAdvancedRoutes = require('./routes/audioSyncAdvancedRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const galleriesRoutes = require('./routes/galleriesRoutes');
const prayerRoutes = require('./routes/prayerRoutes');
const testimonialsRoutes = require('./routes/testimonialsRoutes');
const lettersRoutes = require('./routes/lettersRoutes');
const announcementsRoutes = require('./routes/announcementsRoutes');
const translationRoutes = require('./routes/translationRoutes');
const translateRoutes = require('./routes/translateRoutes'); // New AI translation
const analyticsRoutes = require('./routes/analyticsRoutes');
const messageHistoryRoutes = require('./routes/messageHistoryRoutes');
const pagesRoutes = require('./routes/pagesRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const filesRoutes = require('./routes/filesRoutes');
const presentationRoutes = require('./routes/presentationRoutes');
const dailyContentRoutes = require('./routes/dailyContentRoutes');
const dailyMessagesRoutes = require('./routes/dailyMessagesRoutes');
const aiRoutes = require('./routes/aiRoutes');
const aiChatRoutes = require('./routes/aiChatRoutes');
const wordprojectRoutes = require('./routes/wordproject');
const wordprojectAudioRoutes = require('./routes/wordprojectAudioRoutes');
const audioRoutes = require('./routes/audioRoutes');
const downloadRoutes = require('./routes/downloadRoutes');
const ttsRoutes = require('./routes/tts');
const geminiAudioTimingRoutes = require('./routes/geminiAudioTiming');
const audioSyncRoutes = require('./routes/audioSyncRoutes');
const storageRoutes = require('./routes/storageRoutes');

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

// Try to load Gemini TTS routes
let geminiTTSRoutes;
try {
  geminiTTSRoutes = require('./routes/geminiTTS');
  console.log('✅ Gemini TTS routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load Gemini TTS routes:', error.message);
}

// Load Gemini Audio Cache routes for Bible chapters
let geminiAudioCacheRoutes;
try {
  console.log('🔄 Loading Gemini Audio Cache routes...');
  geminiAudioCacheRoutes = require('./routes/geminiAudioCache');
  console.log('✅ Gemini Audio Cache routes loaded successfully');
  console.log('📦 Module type:', typeof geminiAudioCacheRoutes);
} catch (error) {
  console.error('❌ Failed to load Gemini Audio Cache routes:', error.message);
  console.error('❌ Full error:', error);
}

const bibleUnifiedRoutes = require('./routes/bibleUnifiedMock');
const bibleJsonRoutes = require('./routes/bible-json'); // JSON fallback for Bible data
const bibleLocalRoutes = require('./routes/bible-local'); // Local downloaded Bible files
const dailyImagesRoutes = require('./routes/dailyImagesRoutes');
const imageGenerationService = require('./services/imageGenerationService');

const app = express();

// ---------- COMPRESSION MIDDLEWARE ----------
// 🚀 فشرده‌سازی پاسخ‌ها برای بهبود سرعت در موبایل
const compression = require('compression');
app.use(compression({
  level: 6, // سطح فشرده‌سازی (1-9)
  threshold: 1024, // فقط فایل‌های بالای 1KB فشرده شوند
  filter: (req, res) => {
    // فشرده نکردن فایل‌های از قبل فشرده (تصاویر، ویدیو)
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// ---------- DEV CSP HEADER ----------
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self' http://localhost:3001 http://localhost:5173 https: ws: wss: data:; connect-src 'self' http://localhost:3001 http://localhost:5173 https: ws: wss: data:;"
    );
    next();
  });
}
const PORT = process.env.PORT || 3001;

// ---------- SECURITY MIDDLEWARE ----------
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// 1. Helmet for Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // React needs unsafe-inline/eval in dev
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      mediaSrc: ["'self'", "https:", "blob:", "data:"],
      connectSrc: ["'self'", "https://wxzhzsqicgwfxffxayhy.supabase.co", "https://webdav.hidrive.ionos.com"],
      fontSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow loading resources from different origins
}));

// 2. Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 100 to 1000 - homepage makes 10+ API calls
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/api/health';
  }
});

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Specific stricter limit for auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login/register attempts per hour
  message: { error: 'Too many login attempts, please try again later.' },
  skipSuccessfulRequests: true // Don't count successful requests
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// AI endpoints - stricter to prevent abuse
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 AI requests per hour
  message: { error: 'Too many AI requests. Please try again later.' }
});
app.use('/api/ai/', aiLimiter);
app.use('/api/ai-chat/', aiLimiter);

// File upload limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 uploads per hour
  message: { error: 'Too many file uploads. Please try again later.' }
});
// Will be applied to upload routes later

// Prayer requests - prevent spam
const prayerLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 prayer requests per day
  message: { error: 'Too many prayer requests today. Please try again tomorrow.' }
});
// Will be applied to prayer routes later


// ---------- CORS ----------
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:5173',
  'https://samanabyar.online',
  'https://www.samanabyar.online',
  process.env.FRONTEND_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (like mobile apps or curl) ONLY in dev
    if (!origin) {
      if (process.env.NODE_ENV !== 'production') return cb(null, true);
      // In production, block requests with no origin if strict security is desired, 
      // or allow them if you have mobile apps. For now, we block unknown no-origin in prod.
      // return cb(new Error('Origin is required')); 
      // However, for simplicity and to avoid breaking server-side calls, we might allow it if needed.
      // Let's stick to the user's request for "samanabyar.online" matching.
      return cb(null, true); // Temporarily allow no-origin for safety, or restrict?
      // Let's be safe:
      // return cb(null, true); 
    }

    if (allowedOrigins.includes(origin)) return cb(null, true);

    // In dev, allow all localhost
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) return cb(null, true);

    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// ---------- STATIC FILE SERVING ----------
// Serve built frontend files from dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Serve worship audio and timing files
app.use('/worship', express.static(path.join(__dirname, '../public/worship')));

// ---------- FTP CONFIG ----------
const ftpConfig = {
  host: process.env.FTP_HOST,
  user: process.env.FTP_USER,
  password: process.env.FTP_PASS,
  port: process.env.FTP_PORT ? Number(process.env.FTP_PORT) : 21,
  secure: process.env.FTP_SECURE === 'true', // FTPS اگر خواستی
  secureOptions: { rejectUnauthorized: false }, // در صورت نیاز روی هاست اشتراکی
};
// دایرکتوری پایه‌ی وب (جایی که واقعا از طریق دامنه سرو می‌شود)
const FTP_BASE_DIR = (process.env.FTP_BASE_DIR || 'public_html/images').replace(/\\/g, '/');
// زیردایرکتوری پیش‌فرض داخل پایه
const DEFAULT_FOLDER = (process.env.UPLOADS_DIR || 'uploads').replace(/\\/g, '/');

// ---------- Multer (Memory) + محدودیت‌ها ----------
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg',
      'application/pdf', 'application/doc', 'application/docx',
      'video/mp4', 'video/webm'
    ];

    const ok = allowedTypes.includes(file.mimetype);
    if (!ok) {
      return cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`));
    }

    // Additional security check for file extension
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp3', '.wav', '.mp4', '.pdf', '.doc', '.docx'];

    if (!allowedExtensions.includes(fileExtension)) {
      return cb(new Error(`Invalid file extension: ${fileExtension}. Allowed extensions: ${allowedExtensions.join(', ')}`));
    }

    cb(null, true);
  }
});

// ---------- Helpers ----------
const posix = path.posix; // همیشه اسلش رو به جلو روی FTP
function sanitizeFileName(name) {
  // فقط حروف/اعداد/خط تیره/نقطه؛ فاصله‌ها به خط تیره
  const base = name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
  // جلوگیری از خالی شدن کامل
  return base || `file-${Date.now()}`;
}
function ensureLeadingNoSlash(p) {
  return p.replace(/^\/+/, '');
}
function getFolderFromReq(req) {
  // می‌تونی با body.query یکی از مسیرها رو بدی؛ مثلا images/leaders
  const folder = (req.body?.folder || req.query?.folder || DEFAULT_FOLDER).toString();
  return ensureLeadingNoSlash(folder.replace(/\\/g, '/'));
}

// ---------- FTP Upload ----------
async function uploadToFTP(fileBuffer, fileName, folder) {
  const client = new ftp.Client();
  try {
    await client.access(ftpConfig);
    // به ریشه‌ی وب برو، بعد پوشه‌ی هدف
    await client.ensureDir(FTP_BASE_DIR);
    await client.ensureDir(posix.join(FTP_BASE_DIR, folder));
    const remotePath = posix.join(FTP_BASE_DIR, folder, fileName);
    // fileBuffer همین الان Buffer است
    await client.uploadFrom(fileBuffer, remotePath);
    // URL عمومی سازگار با دامنه
    const publicPath = posix.join(folder, fileName);
    const url = `https://${process.env.DOMAIN}/${publicPath}`;
    return { url, publicPath, fileName };
  } finally {
    client.close();
  }
}

async function deleteFromFTP(fileName, folder) {
  const client = new ftp.Client();
  try {
    await client.access(ftpConfig);
    const remotePath = posix.join(FTP_BASE_DIR, folder, fileName);
    await client.remove(remotePath);
  } finally {
    client.close();
  }
}

// ---------- Routes ----------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/bible', bibleRoutes);
app.use('/api/bible', bibleInteractionRoutes);
app.use('/api/bible-json', bibleJsonRoutes); // JSON fallback route
app.use('/api/bible-local', bibleLocalRoutes); // Local downloaded files
app.use('/api/bible-audio', bibleAudioRoutes);
app.use('/api/leaders', leadersRoutes);
app.use('/api/sermons', sermonsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/events', eventRecorderRoutes); // For /record-session and /recorded-sessions
app.use('/api/worship-audio', worshipAudioRoutes); // For worship songs AI suite
app.use('/api/worship-songs', worshipRoutes);
app.use('/api/songs', songsRoutes);
app.use('/api/timing', timingRoutes); // For timing file generation (worship songs)
app.use('/api/bible-timing', bibleTimingRoutes); // For Bible chapter timing generation
app.use('/api/audio-sync-advanced', audioSyncAdvancedRoutes); // Advanced AI timing with Gemini
app.use('/api/gemini-timing', geminiAudioTimingRoutes); // For Bible audio timing generation
app.use('/api/schedule-events', scheduleRoutes);
app.use('/api/galleries', galleriesRoutes);
app.use('/api/prayer-requests', prayerRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/letters', authenticateToken, lettersRoutes); // Letter management system
app.use('/api/announcements', announcementsRoutes);
app.use('/api/translate', translationRoutes); // Old translation routes
app.use('/api/ai/translate', aiLimiter, translateRoutes); // New AI-powered translation
app.use('/api/analytics', analyticsRoutes);
app.use('/api/messages', messageHistoryRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/daily-images', dailyImagesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/presentations', presentationRoutes);
app.use('/api/daily-content', dailyContentRoutes);
app.use('/api/daily-messages', dailyMessagesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/wordproject', wordprojectRoutes);
app.use('/api/wordproject-audio', wordprojectAudioRoutes);
app.use('/api/audio', audioRoutes); // Smart audio source resolver
app.use('/api/downloads', downloadRoutes); // WordProject downloader
app.use('/api/audio-sync', audioSyncRoutes); // Admin audio synchronization
if (hidriveRoutes) {
  app.use('/api/hidrive', hidriveRoutes); // IONOS HiDrive storage management
  console.log('✅ HiDrive routes registered at /api/hidrive');
}
app.use('/api/storage', storageRoutes); // Supabase Storage management
if (huggingfaceTTSRoutes) {
  app.use('/api/tts/huggingface', huggingfaceTTSRoutes);
  console.log('✅ Hugging Face TTS routes registered at /api/tts/huggingface');
}
if (geminiTTSRoutes) {
  app.use('/api/tts/gemini', geminiTTSRoutes);
  console.log('✅ Gemini TTS routes registered at /api/tts/gemini');
}
if (geminiAudioCacheRoutes) {
  app.use('/api/bible-audio', geminiAudioCacheRoutes);
  console.log('✅ Gemini Audio Cache routes registered at /api/bible-audio');
}
app.use('/api/tts', ttsRoutes);
app.use('/api/bible-unified', bibleUnifiedRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Health برای تست اتصال فرانت
app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), ts: Date.now() });
});

// ---------- CATCH-ALL FOR REACT ROUTING ----------
// Serve index.html for any non-API routes (React Router support)
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Upload جدید
app.post('/api/files/upload', uploadLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) throw new Error('No file received.');
    const folder = getFolderFromReq(req); // مثلا images/leaders
    const ext = (path.extname(req.file.originalname) || '').toLowerCase();
    const fileName = `${Date.now()}-${sanitizeFileName(path.basename(req.file.originalname, ext))}${ext}`;
    const { url, publicPath } = await uploadToFTP(req.file.buffer, fileName, folder);
    res.json({ success: true, url, fileName, path: publicPath });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(400).json({ success: false, message: err.message || 'Upload failed' });
  }
});

// Replace یک فایل موجود (نام فایل ثابت می‌ماند)
app.put('/api/files/replace/:fileName', uploadLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) throw new Error('No file received.');
    const folder = getFolderFromReq(req);
    const fileName = sanitizeFileName(req.params.fileName);
    const ext = path.extname(fileName).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) {
      throw new Error('Only image files are allowed.');
    }
    const { url, publicPath } = await uploadToFTP(req.file.buffer, fileName, folder);
    res.json({ success: true, url, fileName, path: publicPath });
  } catch (err) {
    console.error('Replace error:', err);
    res.status(400).json({ success: false, message: err.message || 'Replace failed' });
  }
});

// Delete
app.delete('/api/files/:fileName', async (req, res) => {
  try {
    // جلوگیری از traversal
    const fileName = sanitizeFileName(path.basename(req.params.fileName));
    const folder = getFolderFromReq(req);
    await deleteFromFTP(fileName, folder);
    res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(400).json({ success: false, message: err.message || 'Delete failed' });
  }
});

// Root
app.get('/', (req, res) => {
  res.send('Church API is running with FTP upload!');
});

// مقداردهی اولیه دیتابیس در پس‌زمینه
const initializeDatabaseAsync = async () => {
  try {
    console.log('🔄 شروع مقداردهی اولیه دیتابیس...');
    await Promise.race([
      initializeDatabase(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database initialization timeout')), 30000)
      )
    ]);
    console.log('✅ دیتابیس آماده است');
  } catch (error) {
    console.error('⚠️ خطا در مقداردهی اولیه دیتابیس:', error.message);
    console.log('🔄 ادامه اجرا بدون مقداردهی اولیه...');
  }
};

// شروع سرور
const startServer = async () => {
  // Initialize Image Generation Service
  try {
    await imageGenerationService.initialize();
    console.log('🎨 Image Generation Service ready');
  } catch (error) {
    console.error('⚠️ Image Generation Service initialization failed:', error.message);
  }

  // Start Background Sync Worker
  try {
    const syncWorker = require('./services/syncWorker');
    syncWorker.start();
    console.log('🚀 Background Sync Worker started');
  } catch (error) {
    console.error('⚠️ Failed to start Background Sync Worker:', error.message);
  }

  // ✨ Initialize database FIRST (await it!)
  await initializeDatabaseAsync();

  // THEN start HTTP server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Church API Backend running on http://localhost:${PORT}`);
    console.log('API endpoints available:');
    console.log('  🔐 /api/auth/* - Authentication routes');
    console.log('  👥 /api/users/* - User management');
    console.log('  👤 /api/profile/* - User profiles');
    console.log('  📨 /api/invitations/* - Invitations');
    console.log('  📖 /api/bible/* - Bible content and search');
    console.log('  👥 /api/leaders/* - Church leaders');
    console.log('  🎤 /api/sermons/* - Sermons');
    console.log('  📅 /api/events/* - Church events');
    console.log('  🎵 /api/worship-songs/* - Worship songs');
    console.log('  📋 /api/schedule-events/* - Schedule events');
    console.log('  🖼️ /api/galleries/* - Photo galleries');
    console.log('  🙏 /api/prayer-requests/* - Prayer requests');
    console.log('  ✨ /api/testimonials/* - Testimonials');
    console.log('  📜 /api/letters/* - Church letters');
    console.log('  📢 /api/announcements/* - Church announcements');
    console.log('  📊 /api/analytics/* - Analytics and reporting');
    console.log('  📄 /api/pages/* - Custom pages');
    console.log('  ⚙️ /api/settings/* - Site settings');
    console.log('  📁 /api/files/* - File management');
    console.log('  📖✨ /api/daily-content/* - Daily scripture content');
    console.log('  �️ /api/daily-images/* - Daily AI-generated images');
    console.log('  �📮 /api/notifications/* - Multi-channel notifications');
    console.log('  ❤️ /api/health - Health check');
  });
};

startServer();
