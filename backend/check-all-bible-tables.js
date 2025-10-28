require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

async function checkAllTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 بررسی همه جداول Bible و Verses در Supabase...\n');

    // لیست همه جداول
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE 'bible%' OR table_name LIKE 'verses%')
      ORDER BY table_name;
    `);

    console.log(`📋 تعداد جداول: ${result.rows.length}\n`);

    // بررسی هر جدول
    for (const row of result.rows) {
      const tableName = row.table_name;
      
      try {
        // تعداد رکوردها
        const countResult = await pool.query(`SELECT COUNT(*) FROM "${tableName}";`);
        const count = parseInt(countResult.rows[0].count);
        
        // ستون‌ها
        const columnsResult = await pool.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position 
          LIMIT 8;
        `, [tableName]);
        
        const columns = columnsResult.rows.map(c => `${c.column_name}(${c.data_type})`).join(', ');
        
        console.log(`✅ ${tableName}: ${count.toLocaleString()} ردیف`);
        console.log(`   ستون‌ها: ${columns}`);
        
        // نمونه داده اگر داره
        if (count > 0) {
          const sampleResult = await pool.query(`SELECT * FROM "${tableName}" LIMIT 1;`);
          const keys = Object.keys(sampleResult.rows[0]).slice(0, 5);
          console.log(`   کلیدها: ${keys.join(', ')}`);
        }
        
        console.log();
      } catch (err) {
        console.log(`❌ ${tableName}: خطا - ${err.message.substring(0, 60)}\n`);
      }
    }

    await pool.end();
    console.log('✅ بررسی کامل شد!');
  } catch (error) {
    console.error('❌ خطا:', error.message);
    process.exit(1);
  }
}

checkAllTables();
