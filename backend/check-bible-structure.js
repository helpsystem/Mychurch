const { pool } = require('./db-postgres');

(async () => {
  const client = await pool.connect();
  try {
    console.log('=== bible_books columns ===');
    const books = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bible_books' 
      ORDER BY ordinal_position
    `);
    books.rows.forEach(row => console.log(row.column_name));
    
    console.log('\n=== bible_chapters columns ===');
    const chapters = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bible_chapters' 
      ORDER BY ordinal_position
    `);
    chapters.rows.forEach(row => console.log(row.column_name));
    
    console.log('\n=== Sample Books ===');
    const sampleBooks = await client.query('SELECT * FROM bible_books LIMIT 5');
    console.log(sampleBooks.rows);
    
    console.log('\n=== Sample Chapters ===');
    const sampleChapters = await client.query('SELECT * FROM bible_chapters LIMIT 5');
    console.log(sampleChapters.rows);
    
  } finally {
    client.release();
    process.exit(0);
  }
})();