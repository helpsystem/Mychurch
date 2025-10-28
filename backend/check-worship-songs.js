// بررسی سرودهای پرستشی در دیتابیس
require('dotenv').config();
const { pool } = require('./db-postgres');

async function checkWorshipSongs() {
  try {
    console.log('🔍 Checking worship_songs table...\n');
    
    // تعداد کل سرودها
    const countResult = await pool.query('SELECT COUNT(*) FROM worship_songs');
    console.log(`📊 Total songs: ${countResult.rows[0].count}\n`);
    
    // نمونه 5 سرود اول
    const songsResult = await pool.query('SELECT id, title, artist, youtubeid, audiourl FROM worship_songs LIMIT 5');
    
    if (songsResult.rows.length > 0) {
      console.log('📝 Sample songs:');
      songsResult.rows.forEach((song, i) => {
        const title = typeof song.title === 'string' ? JSON.parse(song.title) : song.title;
        console.log(`\n${i + 1}. ID: ${song.id}`);
        console.log(`   Title (FA): ${title.fa || 'N/A'}`);
        console.log(`   Title (EN): ${title.en || 'N/A'}`);
        console.log(`   Artist: ${song.artist}`);
        console.log(`   YouTube ID: ${song.youtubeid || 'N/A'}`);
        console.log(`   Audio URL: ${song.audiourl ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('⚠️ No songs found in database!');
    }
    
    // بررسی ستون‌های جدول
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'worship_songs'
      ORDER BY ordinal_position
    `);
    
    console.log('\n\n📋 Table columns:');
    columnsResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkWorshipSongs();
