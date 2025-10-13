/**
 * Migration Script: Add file upload fields to worship_songs table
 * 
 * این اسکریپت فیلدهای جدید برای آپلود فایل را به جدول worship_songs اضافه می‌کند
 */

const { pool } = require('../db-postgres');

async function addFileColumnsToWorshipSongs() {
  console.log('🔄 شروع Migration...');

  try {
    // بررسی وجود ستون‌ها
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'worship_songs' 
      AND column_name IN ('presentation_file_url', 'pdf_file_url', 'sheet_music_url');
    `;
    
    const existingColumns = await pool.query(checkQuery);
    const existingColumnNames = existingColumns.rows.map(row => row.column_name);

    console.log('📋 ستون‌های موجود:', existingColumnNames);

    // اضافه کردن ستون‌های جدید
    const columnsToAdd = [
      { name: 'presentation_file_url', type: 'VARCHAR(500)' },
      { name: 'pdf_file_url', type: 'VARCHAR(500)' },
      { name: 'sheet_music_url', type: 'VARCHAR(500)' }
    ];

    for (const column of columnsToAdd) {
      if (!existingColumnNames.includes(column.name)) {
        const alterQuery = `
          ALTER TABLE worship_songs 
          ADD COLUMN ${column.name} ${column.type};
        `;
        
        await pool.query(alterQuery);
        console.log(`✅ ستون ${column.name} با موفقیت اضافه شد`);
      } else {
        console.log(`⏭️  ستون ${column.name} قبلاً وجود دارد`);
      }
    }

    console.log('✅ Migration با موفقیت انجام شد!');

    // نمایش اطلاعات جدول
    const tableInfoQuery = `
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'worship_songs'
      ORDER BY ordinal_position;
    `;
    
    const tableInfo = await pool.query(tableInfoQuery);
    console.log('\n📊 ساختار نهایی جدول worship_songs:');
    console.table(tableInfo.rows);

  } catch (error) {
    console.error('❌ خطا در Migration:', error.message);
    throw error;
  }
}

// اجرای Migration
if (require.main === module) {
  addFileColumnsToWorshipSongs()
    .then(() => {
      console.log('\n🎉 Migration تکمیل شد!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Migration با خطا مواجه شد:', error);
      process.exit(1);
    });
}

module.exports = { addFileColumnsToWorshipSongs };
