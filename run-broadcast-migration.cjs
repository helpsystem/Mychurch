// Run broadcast_sessions migration
require('dotenv').config();
const db = require('./backend/db-postgres');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    // Read migration file
    const sqlPath = path.join(__dirname, 'migrations', 'broadcast_sessions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Run migration
    console.log('Running broadcast_sessions migration...');
    await db.pool.query(sql);
    
    // Verify
    const result = await db.pool.query('SELECT COUNT(*) as count FROM broadcast_sessions');
    console.log('✅ Migration successful! Rows:', result.rows[0].count);
    
    // Show templates
    const templates = await db.pool.query('SELECT id, name, is_template FROM broadcast_sessions LIMIT 5');
    console.log('Sessions:', templates.rows);
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error(error);
  } finally {
    process.exit();
  }
}

runMigration();
