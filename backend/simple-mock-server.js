const http = require('http');

// Mock Bible data
const mockBibleData = {
  books: [
    { id: 1, name: { en: 'Genesis', fa: 'پیدایش' }, chapters: 50 },
    { id: 2, name: { en: 'Exodus', fa: 'خروج' }, chapters: 40 },
    { id: 3, name: { en: 'Leviticus', fa: 'لاویان' }, chapters: 27 },
    { id: 4, name: { en: 'Numbers', fa: 'اعداد' }, chapters: 36 },
    { id: 5, name: { en: 'Deuteronomy', fa: 'تثنیه' }, chapters: 34 },
    { id: 40, name: { en: 'Matthew', fa: 'متی' }, chapters: 28 },
    { id: 41, name: { en: 'Mark', fa: 'مرقس' }, chapters: 16 },
    { id: 42, name: { en: 'Luke', fa: 'لوقا' }, chapters: 24 },
    { id: 43, name: { en: 'John', fa: 'یوحنا' }, chapters: 21 }
  ],
  verses: {
    Genesis: {
      1: {
        en: [
          'In the beginning God created the heavens and the earth.',
          'Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.',
          'And God said, "Let there be light," and there was light.',
          'God saw that the light was good, and he separated the light from the darkness.',
          'God called the light "day," and the darkness he called "night." And there was evening, and there was morning—the first day.',
          'And God said, "Let there be a vault between the waters to separate water from water."',
          'So God made the vault and separated the water under the vault from the water above it. And it was so.',
          'God called the vault "sky." And there was evening, and there was morning—the second day.'
        ],
        fa: [
          'در ابتدا خدا آسمانها و زمین را آفرید.',
          'و زمین بی‌صورت و خالی بود و تاریکی بر وجه لجه بود و روح خدا بر سطح آبها حوم می‌کرد.',
          'و خدا گفت: «نور بشود.» و نور شد.',
          'و خدا نور را دید که نیکوست. و خدا در میان نور و تاریکی تمیز کرد.',
          'و خدا نور را روز نامید و تاریکی را شب نامید. پس شام بود و صبح بود، روز اول.',
          'و خدا گفت: «فلکی در میان آبها بشود تا در میان آب و آب جدایی کند.»',
          'پس خدا فلک را بساخت و در میان آبی که زیر فلک است و آبی که بالای فلک است تمیز کرد. و چنین شد.',
          'و خدا فلک را آسمان نامید. پس شام بود و صبح بود، روز دوم.'
        ]
      }
    },
    Matthew: {
      1: {
        en: [
          'This is the genealogy of Jesus the Messiah the son of David, the son of Abraham:',
          'Abraham was the father of Isaac, Isaac the father of Jacob, Jacob the father of Judah and his brothers,',
          'Judah the father of Perez and Zerah, whose mother was Tamar, Perez the father of Hezron, Hezron the father of Ram,',
          'Ram the father of Amminadab, Amminadab the father of Nahshon, Nahshon the father of Salmon,',
          'Salmon the father of Boaz, whose mother was Rahab, Boaz the father of Obed, whose mother was Ruth, Obed the father of Jesse,'
        ],
        fa: [
          'نسب نامه عیسی مسیح، پسر داود، پسر ابراهیم:',
          'ابراهیم پدر اسحاق بود. اسحاق پدر یعقوب بود. یعقوب پدر یهودا و برادرانش بود.',
          'یهودا از تامار پدر فارص و زارح بود. فارص پدر حصرون بود. حصرون پدر رام بود.',
          'رام پدر عمیناداب بود. عمیناداب پدر نحشون بود. نحشون پدر سلمون بود.',
          'سلمون از راحاب پدر بوعز بود. بوعز از روت پدر عوبید بود. عوبید پدر یسا بود.'
        ]
      }
    }
  }
};

// Simple HTTP server
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log('Request:', req.method, req.url);

  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', message: 'Mock server running' }));
    return;
  }

  if (req.url === '/api/bible/books') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, books: mockBibleData.books }));
    return;
  }

  // Bible content endpoint
  const bibleContentMatch = req.url.match(/^\/api\/bible\/content\/([^\/]+)\/(\d+)$/);
  if (bibleContentMatch) {
    const [, book, chapter] = bibleContentMatch;
    const chapterNum = parseInt(chapter);
    
    const verses = mockBibleData.verses[book]?.[chapterNum];
    
    if (verses) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        book,
        chapter: chapterNum,
        verses 
      }));
    } else {
      // Generate generic verses for missing books/chapters
      const genericVerses = {
        en: Array.from({ length: 5 }, (_, i) => 
          `Sample verse ${i + 1} for ${book} chapter ${chapter}`
        ),
        fa: Array.from({ length: 5 }, (_, i) => 
          `نمونه آیه ${i + 1} برای ${book} فصل ${chapter}`
        )
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        book,
        chapter: chapterNum,
        verses: genericVerses 
      }));
    }
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 3006;
server.listen(PORT, (err) => {
  if (err) {
    console.error('Server failed to start:', err);
    process.exit(1);
  }
  console.log(`🚀 Mock Bible Server running on http://localhost:${PORT}`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});