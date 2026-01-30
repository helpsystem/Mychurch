/**
 * Quick Bible Server - Mock Data Only
 * Use when database is unavailable
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mock Bible Books
const BIBLE_BOOKS = [
  { key: 'GEN', name: { en: 'Genesis', fa: 'پیدایش' }, chapters: 50, testament: 'OT' },
  { key: 'EXO', name: { en: 'Exodus', fa: 'خروج' }, chapters: 40, testament: 'OT' },
  { key: 'LEV', name: { en: 'Leviticus', fa: 'لاویان' }, chapters: 27, testament: 'OT' },
  { key: 'NUM', name: { en: 'Numbers', fa: 'اعداد' }, chapters: 36, testament: 'OT' },
  { key: 'DEU', name: { en: 'Deuteronomy', fa: 'تثنیه' }, chapters: 34, testament: 'OT' },
  { key: 'JOS', name: { en: 'Joshua', fa: 'یوشع' }, chapters: 24, testament: 'OT' },
  { key: 'JDG', name: { en: 'Judges', fa: 'داوران' }, chapters: 21, testament: 'OT' },
  { key: 'RUT', name: { en: 'Ruth', fa: 'روت' }, chapters: 4, testament: 'OT' },
  { key: '1SA', name: { en: '1 Samuel', fa: 'اول سموئیل' }, chapters: 31, testament: 'OT' },
  { key: '2SA', name: { en: '2 Samuel', fa: 'دوم سموئیل' }, chapters: 24, testament: 'OT' },
  { key: '1KI', name: { en: '1 Kings', fa: 'اول پادشاهان' }, chapters: 22, testament: 'OT' },
  { key: '2KI', name: { en: '2 Kings', fa: 'دوم پادشاهان' }, chapters: 25, testament: 'OT' },
  { key: 'MAT', name: { en: 'Matthew', fa: 'متی' }, chapters: 28, testament: 'NT' },
  { key: 'MRK', name: { en: 'Mark', fa: 'مرقس' }, chapters: 16, testament: 'NT' },
  { key: 'LUK', name: { en: 'Luke', fa: 'لوقا' }, chapters: 24, testament: 'NT' },
  { key: 'JHN', name: { en: 'John', fa: 'یوحنا' }, chapters: 21, testament: 'NT' },
  { key: 'ACT', name: { en: 'Acts', fa: 'اعمال' }, chapters: 28, testament: 'NT' },
  { key: 'ROM', name: { en: 'Romans', fa: 'رومیان' }, chapters: 16, testament: 'NT' },
  { key: '1CO', name: { en: '1 Corinthians', fa: 'اول قرنتیان' }, chapters: 16, testament: 'NT' },
  { key: '2CO', name: { en: '2 Corinthians', fa: 'دوم قرنتیان' }, chapters: 13, testament: 'NT' },
  { key: 'GAL', name: { en: 'Galatians', fa: 'غلاطیان' }, chapters: 6, testament: 'NT' },
  { key: 'EPH', name: { en: 'Ephesians', fa: 'افسسیان' }, chapters: 6, testament: 'NT' },
  { key: 'PHP', name: { en: 'Philippians', fa: 'فیلیپیان' }, chapters: 4, testament: 'NT' },
  { key: 'COL', name: { en: 'Colossians', fa: 'کولسیان' }, chapters: 4, testament: 'NT' },
  { key: '1TH', name: { en: '1 Thessalonians', fa: 'اول تسالونیکیان' }, chapters: 5, testament: 'NT' },
  { key: '2TH', name: { en: '2 Thessalonians', fa: 'دوم تسالونیکیان' }, chapters: 3, testament: 'NT' },
  { key: 'REV', name: { en: 'Revelation', fa: 'مکاشفه' }, chapters: 22, testament: 'NT' }
];

// Generate mock verses
function generateMockVerses(bookKey, chapter) {
  const verseCount = Math.floor(Math.random() * 20) + 10; // 10-30 verses
  const verses = { fa: [], en: [] };
  
  for (let i = 0; i < verseCount; i++) {
    verses.fa.push(`آیه فارسی ${i + 1} از ${bookKey} فصل ${chapter} - این یک متن نمونه است.`);
    verses.en.push(`Sample verse ${i + 1} from ${bookKey} chapter ${chapter}.`);
  }
  
  return verses;
}

// API Routes

// Get all books
app.get('/api/bible/books', (req, res) => {
  console.log('📖 Serving mock Bible books');
  res.json({
    success: true,
    books: BIBLE_BOOKS,
    usingMockData: true
  });
});

// Get translations
app.get('/api/bible/translations', (req, res) => {
  console.log('🌐 Serving mock translations');
  res.json({
    success: true,
    translations: [
      { id: 1, code: 'mojdeh', name: { en: 'Good News Persian', fa: 'مژده فارسی' }, language: 'fa' },
      { id: 2, code: 'qadim', name: { en: 'Persian Old Version', fa: 'ترجمه قدیم فارسی' }, language: 'fa' },
      { id: 8, code: 'NET', name: { en: 'New English Translation', fa: 'ترجمه نوین انگلیسی' }, language: 'en' }
    ],
    usingMockData: true
  });
});

// Get chapter content
app.get('/api/bible/content/:bookKey/:chapter', (req, res) => {
  const { bookKey, chapter } = req.params;
  const book = BIBLE_BOOKS.find(b => b.key.toLowerCase() === bookKey.toLowerCase());
  
  if (!book) {
    return res.status(404).json({
      success: false,
      message: 'Book not found'
    });
  }
  
  console.log(`📖 Serving mock verses: ${bookKey} ${chapter}`);
  
  const verses = generateMockVerses(bookKey, parseInt(chapter));
  
  res.json({
    success: true,
    book: {
      key: book.key,
      name: book.name
    },
    chapter: parseInt(chapter),
    verses: verses,
    translation: {
      code: 'qadim',
      name: { en: 'Persian Old Version', fa: 'ترجمه قدیم فارسی' }
    },
    usingMockData: true
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Quick Bible Server - Mock Data Only',
    timestamp: new Date().toISOString()
  });
});

// Fallback for undefined routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found in Quick Bible Server',
    availableEndpoints: [
      '/api/bible/books',
      '/api/bible/translations',
      '/api/bible/content/:bookKey/:chapter',
      '/api/health'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ Quick Bible Server (Mock Data) running on http://localhost:${PORT}`);
  console.log(`📖 Available endpoints:`);
  console.log(`   GET /api/bible/books`);
  console.log(`   GET /api/bible/translations`);
  console.log(`   GET /api/bible/content/:bookKey/:chapter`);
  console.log(`   GET /api/health`);
  console.log(`\n⚠️  Using mock data only - no database connection\n`);
});
