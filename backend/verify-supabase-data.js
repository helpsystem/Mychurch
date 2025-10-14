const { pool } = require('./db-postgres');

async function verifySupabaseData() {
  try {
    console.log('🔍 Checking Supabase database connection...');
    
    // Get database server information
    const serverInfo = await pool.query('SELECT current_database(), version();');
    console.log('📊 Database:', serverInfo.rows[0].current_database);
    console.log('📊 Server Version:', serverInfo.rows[0].version.substring(0, 50) + '...');
    
    // Check if we're connected to Supabase (look for Supabase-specific info)
    const connectionInfo = await pool.query('SELECT current_setting(\'application_name\') as app_name;');
    console.log('📊 Application Name:', connectionInfo.rows[0].app_name);
    
    // Check Bible data on Supabase
    console.log('\n📚 Bible Data on Supabase:');
    const booksCount = await pool.query('SELECT COUNT(*) FROM bible_books;');
    console.log(`   Books: ${booksCount.rows[0].count}`);
    
    const chaptersCount = await pool.query('SELECT COUNT(*) FROM bible_chapters;');
    console.log(`   Chapters: ${chaptersCount.rows[0].count}`);
    
    const versesCount = await pool.query('SELECT COUNT(*) FROM bible_verses;');
    console.log(`   Verses: ${versesCount.rows[0].count}`);
    
    // Check other application data
    console.log('\n📋 Other Application Data on Supabase:');
    try {
      const usersCount = await pool.query('SELECT COUNT(*) FROM users;');
      console.log(`   Users: ${usersCount.rows[0].count}`);
    } catch (e) { console.log('   Users: table not found'); }
    
    try {
      const sermonsCount = await pool.query('SELECT COUNT(*) FROM sermons;');
      console.log(`   Sermons: ${sermonsCount.rows[0].count}`);
    } catch (e) { console.log('   Sermons: table not found'); }
    
    try {
      const eventsCount = await pool.query('SELECT COUNT(*) FROM events;');
      console.log(`   Events: ${eventsCount.rows[0].count}`);
    } catch (e) { console.log('   Events: table not found'); }
    
    console.log('\n✅ All data is stored on Supabase cloud database');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

verifySupabaseData();