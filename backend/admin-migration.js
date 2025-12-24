require('dotenv').config({ path: '../.env' });
const { pool } = require('./db-postgres');

async function runMigrations() {
  console.log('🔧 Running Admin Panel Migrations...\n');
  
  try {
    // 1. Create communications table
    console.log('1. Creating communications table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS communications (
        id SERIAL PRIMARY KEY,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        recipient_type VARCHAR(50) NOT NULL,
        recipient_ids JSONB,
        sent_by INTEGER,
        sent_at TIMESTAMPTZ DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'sent',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✅ Communications table ready');

    // 2. Create message_logs table
    console.log('2. Creating message_logs table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS message_logs (
        id SERIAL PRIMARY KEY,
        communication_id INTEGER,
        user_id INTEGER,
        delivered_at TIMESTAMPTZ,
        read_at TIMESTAMPTZ,
        status VARCHAR(20) DEFAULT 'pending'
      )
    `);
    console.log('   ✅ Message logs table ready');

    // 3. Create church_announcements table
    console.log('3. Creating church_announcements table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS church_announcements (
        id SERIAL PRIMARY KEY,
        title_fa VARCHAR(255),
        title_en VARCHAR(255),
        content_fa TEXT,
        content_en TEXT,
        type VARCHAR(50) DEFAULT 'general',
        priority INTEGER DEFAULT 0,
        start_date TIMESTAMPTZ,
        end_date TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('   ✅ Church announcements table ready');

    // 4. Check testimonials columns
    console.log('4. Checking testimonials columns...');
    const colCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'testimonials' AND column_name IN ('status', 'approved_at', 'approved_by')
    `);
    const existingCols = colCheck.rows.map(r => r.column_name);
    
    if (!existingCols.includes('status')) {
      try {
        await pool.query(`ALTER TABLE testimonials ADD COLUMN status VARCHAR(20) DEFAULT 'pending'`);
        console.log('   Added status column');
      } catch (e) {
        if (!e.message.includes('already exists')) console.log('   Status:', e.message);
      }
    }
    
    if (!existingCols.includes('approved_at')) {
      try {
        await pool.query(`ALTER TABLE testimonials ADD COLUMN approved_at TIMESTAMPTZ`);
        console.log('   Added approved_at column');
      } catch (e) {
        if (!e.message.includes('already exists')) console.log('   Approved_at:', e.message);
      }
    }
    
    if (!existingCols.includes('approved_by')) {
      try {
        await pool.query(`ALTER TABLE testimonials ADD COLUMN approved_by INTEGER`);
        console.log('   Added approved_by column');
      } catch (e) {
        if (!e.message.includes('already exists')) console.log('   Approved_by:', e.message);
      }
    }
    console.log('   ✅ Testimonials columns ready');

    // 5. Check settings
    console.log('5. Checking settings table...');
    try {
      const settingsCheck = await pool.query(`SELECT COUNT(*) as cnt FROM settings WHERE key = 'site_name'`);
      if (parseInt(settingsCheck.rows[0].cnt) === 0) {
        await pool.query(`
          INSERT INTO settings (key, value, category) VALUES
          ('site_name', 'Iranian Christian Church DC', 'general'),
          ('site_description', 'Welcome to our church community', 'general'),
          ('contact_email', 'info@iranianchurchdc.org', 'contact')
          ON CONFLICT (key) DO NOTHING
        `);
        console.log('   Inserted default settings');
      }
    } catch (e) {
      console.log('   Settings:', e.message);
    }
    console.log('   ✅ Settings ready');

    console.log('\n🎉 All migrations completed successfully!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runMigrations();
