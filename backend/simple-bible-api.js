const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3006;

app.use(cors());
app.use(express.json());

const BOOKS = [
  { code: 'GEN', number: 1, testament: 'OT', names: { en: 'Genesis', fa: 'پیدایش' }, chapterCount: 50 }
];

const VERSES = [
  { number: 1, text: { en: 'In the beginning God created the heaven and the earth.', fa: 'در ابتدا خدا آسمان‌ها و زمین را آفرید.' } },
  { number: 2, text: { en: 'And the earth was without form.', fa: 'و زمین بی‌شکل بود.' } },
  { number: 3, text: { en: 'And God said, Let there be light.', fa: 'و خدا گفت: نور بشود.' } }
];

app.get('/api/bible-unified/books', (req, res) => {
  console.log('GET /books');
  res.json({ success: true, books: BOOKS, totalBooks: BOOKS.length });
});

app.get('/api/bible-unified/chapter', (req, res) => {
  console.log('GET /chapter');
  const verses = VERSES.map(v => ({ ...v, id: `GEN-1-${v.number}` }));
  res.json({
    success: true,
    chapter: {
      book: BOOKS[0],
      chapterNumber: 1,
      verseCount: verses.length,
      verses
    }
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ Simple Bible API on http://localhost:${PORT}\n`);
});
