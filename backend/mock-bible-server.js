// سرور Bible بدون اتصال به دیتابیس - فقط mock data
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3005;

app.use(cors({ origin: '*' }));
app.use(express.json());

console.log('🚀 Starting Mock Bible API...');

// Mock Bible data
const mockBooks = [
  { key: 'Gen', name: { en: 'Genesis', fa: 'پیدایش' }, chapters: 50, testament: 'OT', bookNumber: 1 },
  { key: 'Exod', name: { en: 'Exodus', fa: 'خروج' }, chapters: 40, testament: 'OT', bookNumber: 2 },
  { key: 'Matt', name: { en: 'Matthew', fa: 'متی' }, chapters: 28, testament: 'NT', bookNumber: 40 },
  { key: 'John', name: { en: 'John', fa: 'یوحنا' }, chapters: 21, testament: 'NT', bookNumber: 43 }
];

const mockVerses = {
  en: [
    'In the beginning God created the heavens and the earth.',
    'Now the earth was formless and empty, darkness was over the surface of the deep.',
    'And God said, "Let there be light," and there was light.'
  ],
  fa: [
    'در ابتدا خدا آسمان و زمین را آفرید.',
    'و زمین بی‌شکل و خالی بود و تاریکی بر وجه غمرها بود.',
    'و خدا گفت: نور بشود. پس نور شد.'
  ]
};

// Routes
app.get('/api/bible/books', (req, res) => {
  console.log('📚 Getting mock Bible books...');
  res.json({
    success: true,
    books: mockBooks,
    message: 'Mock data - Supabase connection will be added later'
  });
});

app.get('/api/bible/content/:bookKey/:chapter', (req, res) => {
  const { bookKey, chapter } = req.params;
  console.log(`📖 Getting mock ${bookKey} chapter ${chapter}...`);
  
  const book = mockBooks.find(b => 
    b.key.toLowerCase() === bookKey.toLowerCase() || 
    b.name.en.toLowerCase() === bookKey.toLowerCase()
  );
  
  if (!book) {
    return res.status(404).json({ 
      success: false, 
      message: 'Book not found in mock data' 
    });
  }
  
  res.json({
    success: true,
    book: {
      key: book.key,
      name: book.name
    },
    chapter: parseInt(chapter),
    verses: mockVerses,
    message: 'Mock data - Real verses will load from Supabase when connection is fixed'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Mock Bible API',
    database: 'Mock Data (Supabase connection pending)',
    port: PORT
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Iran Church DC - Mock Bible API', 
    note: 'Using mock data until Supabase connection is resolved',
    endpoints: ['/api/bible/books', '/api/bible/content/:book/:chapter', '/api/health']
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Mock Bible API running on http://localhost:${PORT}`);
  console.log('📖 Mock endpoints ready (no database connection required)');
  console.log('🔧 Ready for frontend testing');
});