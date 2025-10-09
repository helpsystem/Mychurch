// سرور خیلی ساده فقط برای تست
const http = require('http');
require('dotenv').config();

console.log('🚀 شروع سرور ساده...');

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  console.log('📥 درخواست:', req.method, req.url);
  
  try {
    if (req.url === '/api/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ 
        status: 'OK', 
        message: 'سرور در حال اجراست!',
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    if (req.url === '/api/bible/books') {
      console.log('📚 درخواست کتاب‌ها...');
      
      // Test database
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      
      const result = await pool.query(`
        SELECT id, name_en, name_fa, abbreviation, book_number, chapters_count
        FROM bible_books 
        ORDER BY book_number 
        LIMIT 10
      `);
      
      console.log('✅ یافت شد:', result.rows.length, 'کتاب');
      
      const books = result.rows.map(book => ({
        key: book.abbreviation,
        name: {
          en: book.name_en,
          fa: book.name_fa
        },
        chapters: book.chapters_count || 1,
        bookNumber: book.book_number
      }));
      
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        books: books,
        count: result.rows.length
      }));
      
      await pool.end();
      return;
    }
    
    // 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'مسیر پیدا نشد' }));
    
  } catch (error) {
    console.error('❌ خطا:', error.message);
    res.writeHead(500);
    res.end(JSON.stringify({ 
      error: 'خطای سرور', 
      message: error.message 
    }));
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`✅ سرور HTTP ساده در حال اجرا: http://localhost:${PORT}`);
  console.log('🔗 تست: curl http://localhost:3001/api/health');
  console.log('📚 تست: curl http://localhost:3001/api/bible/books');
});

server.on('error', (err) => {
  console.error('❌ خطای سرور:', err.message);
});

process.on('SIGINT', () => {
  console.log('\n👋 بستن سرور...');
  server.close();
  process.exit(0);
});