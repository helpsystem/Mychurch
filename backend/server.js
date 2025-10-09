// server.js  (UTF-8, CRLF)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const ftp = require('basic-ftp');
const { initializeDatabase } = require('./initDB-postgres');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const profileRoutes = require('./routes/profileRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const bibleRoutes = require('./routes/bibleRoutes');
const leadersRoutes = require('./routes/leadersRoutes');
const sermonsRoutes = require('./routes/sermonsRoutes');
const eventsRoutes = require('./routes/eventsRoutes');
const worshipRoutes = require('./routes/worshipRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const galleriesRoutes = require('./routes/galleriesRoutes');
const prayerRoutes = require('./routes/prayerRoutes');
const testimonialsRoutes = require('./routes/testimonialsRoutes');
const lettersRoutes = require('./routes/lettersRoutes');
const announcementsRoutes = require('./routes/announcementsRoutes');
const translationRoutes = require('./routes/translationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const messageHistoryRoutes = require('./routes/messageHistoryRoutes');
const pagesRoutes = require('./routes/pagesRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const filesRoutes = require('./routes/filesRoutes');
const presentationRoutes = require('./routes/presentationRoutes');
const dailyContentRoutes = require('./routes/dailyContentRoutes');
const dailyMessagesRoutes = require('./routes/dailyMessagesRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// ---------- CORS ----------
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:5173', // Vite dev server
  'https://localhost:3001',
  // Custom domain(s)
  'https://samanabyar.online',
  'https://www.samanabyar.online',
  // GitHub Pages (user/organization pages)
  'https://helpsystem.github.io',
  // Optional configurable frontend origins
  process.env.FRONTEND_ORIGIN || null,
  process.env.FRONTEND_ORIGIN_2 || null,
  process.env.FRONTEND_ORIGIN_3 || null,
  process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null,
  process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN.replace(':3001', '')}` : null
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (like mobile apps or curl) and in non-production
    if (!origin || process.env.NODE_ENV !== 'production') return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));
app.use(express.json());

// ---------- STATIC FILE SERVING ----------
// Serve built frontend files from dist directory
app.use(express.static(path.join(__dirname, '../dist')));

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
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'].includes(file.mimetype);
    if (!ok) return cb(new Error('Only image files are allowed.'));
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
app.use('/api/leaders', leadersRoutes);
app.use('/api/sermons', sermonsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/worship-songs', worshipRoutes);
app.use('/api/schedule-events', scheduleRoutes);
app.use('/api/galleries', galleriesRoutes);
app.use('/api/prayer-requests', prayerRoutes);
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/letters', lettersRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/translate', translationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/messages', messageHistoryRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/presentations', presentationRoutes);
app.use('/api/daily-content', dailyContentRoutes);
app.use('/api/daily-messages', dailyMessagesRoutes);
app.use('/api/ai', aiRoutes);
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
app.post('/api/files/upload', upload.single('file'), async (req, res) => {
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
app.put('/api/files/replace/:fileName', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) throw new Error('No file received.');
    const folder = getFolderFromReq(req);
    const fileName = sanitizeFileName(req.params.fileName);
    const ext = path.extname(fileName).toLowerCase();
    if (!['.jpg','.jpeg','.png','.webp','.gif','.svg'].includes(ext)) {
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
const startServer = () => {
  // سرور را اول شروع کن
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
    console.log('  📮 /api/notifications/* - Multi-channel notifications');
    console.log('  ❤️ /api/health - Health check');
    
    // مقداردهی اولیه دیتابیس در پس‌زمینه
    initializeDatabaseAsync();
  });
};

startServer();
