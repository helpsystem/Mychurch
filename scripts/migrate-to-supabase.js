const { Pool } = require('pg');
require('dotenv').config();

// Local database configuration (old database)
const localPool = new Pool({
  host: 'localhost',
  database: 'npyugcbr_iranjesusdc',
  user: 'npyugcbr_saman',
  password: 'Samyar@@1368',
  port: 5432,
});

// Supabase database configuration (new database)
const supabasePool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrateBibleData() {
  console.log('🚀 Starting Bible data migration from local to Supabase...');
  
  try {
    // Test connections
    console.log('📡 Testing local database connection...');
    const localClient = await localPool.connect();
    console.log('✅ Local database connected');
    localClient.release();
    
    console.log('📡 Testing Supabase database connection...');
    const supabaseClient = await supabasePool.connect();
    console.log('✅ Supabase database connected');
    supabaseClient.release();
    
    // Get all Bible tables data
    const tables = ['bible_books', 'bible_chapters', 'bible_verses'];
    
    for (const table of tables) {
      console.log(`\n📋 Migrating ${table}...`);
      
      // Get data from local database
      const localData = await localPool.query(`SELECT * FROM ${table} ORDER BY id`);
      console.log(`📊 Found ${localData.rows.length} records in local ${table}`);
      
      if (localData.rows.length === 0) {
        console.log(`⚠️  No data found in ${table}, skipping...`);
        continue;
      }
      
      // Clear existing data in Supabase (optional)
      await supabasePool.query(`DELETE FROM ${table}`);
      console.log(`🗑️  Cleared existing data from Supabase ${table}`);
      
      // Insert data into Supabase
      let insertedCount = 0;
      const batchSize = 100; // Insert in batches for better performance
      
      for (let i = 0; i < localData.rows.length; i += batchSize) {
        const batch = localData.rows.slice(i, i + batchSize);
        
        for (const row of batch) {
          try {
            // Generate column names and placeholders
            const columns = Object.keys(row);
            const values = Object.values(row);
            const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
            
            const insertQuery = `
              INSERT INTO ${table} (${columns.join(', ')})
              VALUES (${placeholders})
              ON CONFLICT (id) DO UPDATE SET
              ${columns.map(col => `${col} = EXCLUDED.${col}`).join(', ')}
            `;
            
            await supabasePool.query(insertQuery, values);
            insertedCount++;
          } catch (error) {
            console.error(`❌ Error inserting record ${row.id} in ${table}:`, error.message);
          }
        }
        
        console.log(`📤 Inserted batch ${Math.min(i + batchSize, localData.rows.length)}/${localData.rows.length}`);
      }
      
      console.log(`✅ Successfully migrated ${insertedCount}/${localData.rows.length} records to ${table}`);
    }
    
    // Verify migration
    console.log('\n🔍 Verifying migration...');
    for (const table of tables) {
      const count = await supabasePool.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`📊 ${table}: ${count.rows[0].count} records in Supabase`);
    }
    
    console.log('\n🎉 Bible data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await localPool.end();
    await supabasePool.end();
  }
}

// Run migration
migrateBibleData();