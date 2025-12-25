require('dotenv').config();
const { pool } = require('./backend/db-postgres');

async function testAnnouncementsQuery() {
  try {
    console.log('Testing announcements query...');
    
    // Step 1: Check table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'church_announcements'
      )
    `);
    console.log('Table exists check:', tableCheck.rows[0]);
    
    // Step 2: Get announcements
    const result = await pool.query(`
      SELECT * FROM church_announcements 
      WHERE status = 'published' 
      AND (publish_date IS NULL OR publish_date <= CURRENT_TIMESTAMP)
      AND (expiry_date IS NULL OR expiry_date > CURRENT_TIMESTAMP)
      ORDER BY created_at DESC
    `);
    console.log('Announcements count:', result.rowCount);
    console.log('Rows:', result.rows);
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

testAnnouncementsQuery();
