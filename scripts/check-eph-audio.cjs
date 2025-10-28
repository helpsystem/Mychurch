const {Pool}=require('pg');
require('dotenv').config();

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:{rejectUnauthorized:false}
});

pool.query(`
  SELECT book_iso, chapter_number, url, file_size 
  FROM bible_audio_files 
  WHERE book_iso='EPH' AND language='fa' 
  ORDER BY chapter_number
`).then(r=>{
  console.log('📖 افسسیان - فایل‌های صوتی فارسی:\n');
  r.rows.forEach(row => {
    console.log(`   ${row.chapter_number}. ${row.url} (${(row.file_size/1024).toFixed(0)} KB)`);
  });
  pool.end();
}).catch(e => {
  console.error('❌', e.message);
  pool.end();
});
