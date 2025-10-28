// Migration: اضافه کردن فیلدهای جدید به جدول worship_songs
require('dotenv').config();
const { pool } = require('../db-postgres');

async function addWorshipFields() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Starting migration: Add fields to worship_songs table...');
    
    // بررسی و اضافه کردن فیلد chords
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE worship_songs ADD COLUMN chords TEXT;
          RAISE NOTICE 'Added chords column';
        EXCEPTION
          WHEN duplicate_column THEN 
            RAISE NOTICE 'chords column already exists';
        END;
      END $$;
    `);
    
    // بررسی و اضافه کردن فیلد notation
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE worship_songs ADD COLUMN notation TEXT;
          RAISE NOTICE 'Added notation column';
        EXCEPTION
          WHEN duplicate_column THEN 
            RAISE NOTICE 'notation column already exists';
        END;
      END $$;
    `);
    
    // بررسی و اضافه کردن فیلد notes
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE worship_songs ADD COLUMN notes TEXT;
          RAISE NOTICE 'Added notes column';
        EXCEPTION
          WHEN duplicate_column THEN 
            RAISE NOTICE 'notes column already exists';
        END;
      END $$;
    `);
    
    // بررسی و اضافه کردن فیلد attachments
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE worship_songs ADD COLUMN attachments JSONB DEFAULT '[]';
          RAISE NOTICE 'Added attachments column';
        EXCEPTION
          WHEN duplicate_column THEN 
            RAISE NOTICE 'attachments column already exists';
        END;
      END $$;
    `);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Worship songs table now has: chords, notation, notes, attachments fields');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// اجرای migration
if (require.main === module) {
  addWorshipFields()
    .then(() => {
      console.log('✅ Done');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { addWorshipFields };
