// server.js  (UTF-8, CRLF)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ftp = require('basic-ftp');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const profileRoutes = require('./routes/profileRoutes');
const invitationRoutes = require('./routes/invitationRoutes');

const app = express();
const PORT = process.env.PORT || 8080;

// ---------- CORS ----------
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json());

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

// Health برای تست اتصال فرانت
app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), ts: Date.now() });
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

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
