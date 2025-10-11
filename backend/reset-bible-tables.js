const { pool } = require('./db-postgres');

async function resetBibleTables() {
  const client = await pool.connect();
  try {
    console.log('🔄 Dropping existing Bible tables...');
    
    await client.query('DROP TABLE IF EXISTS bible_verses CASCADE;');
    console.log('✅ Dropped bible_verses');
    
    await client.query('DROP TABLE IF EXISTS bible_chapters CASCADE;');
    console.log('✅ Dropped bible_chapters');
    
    await client.query('DROP TABLE IF EXISTS bible_books CASCADE;');
    console.log('✅ Dropped bible_books');
    
    console.log('\n🔄 Creating new Bible tables with correct schema...');
    
    await client.query(`
      CREATE TABLE bible_books (
        id SERIAL PRIMARY KEY,
        book_number INTEGER UNIQUE NOT NULL,
        name_en VARCHAR(255) NOT NULL,
        name_fa VARCHAR(255) NOT NULL,
        abbreviation VARCHAR(20) UNIQUE NOT NULL,
        testament VARCHAR(10) CHECK (testament IN ('old', 'new')) NOT NULL,
        chapters_count INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created bible_books');
    
    await client.query(`
      CREATE TABLE bible_chapters (
        id SERIAL PRIMARY KEY,
        chapter_id VARCHAR(50) UNIQUE NOT NULL,
        book_id INTEGER REFERENCES bible_books(id),
        chapter_number INTEGER NOT NULL,
        title_en VARCHAR(255),
        title_fa VARCHAR(255),
        summary_en TEXT,
        summary_fa TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(book_id, chapter_number)
      );
    `);
    console.log('✅ Created bible_chapters');
    
    await client.query(`
      CREATE TABLE bible_verses (
        id SERIAL PRIMARY KEY,
        book_id INTEGER REFERENCES bible_books(id),
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        text_en TEXT,
        text_fa TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(book_id, chapter, verse)
      );
    `);
    console.log('✅ Created bible_verses');
    
    console.log('\n✅ Bible tables reset successfully!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

resetBibleTables()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
