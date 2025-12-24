const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Supabase (source)
const supabase = createClient(
  'https://wxzhzsqicgwfxffxayhy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4emh6c3FpY2d3ZnhmZnhheWh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc2MDcyOSwiZXhwIjoyMDc1MzM2NzI5fQ.el6gYYLZJTclBDfWePjSNUalX8Z8jSAAF6h1rnoqAuM'
);

// PostgreSQL (destination)
const pool = new Pool({
  connectionString: 'postgresql://mychurch_user:MyChurch2024Secure!@samanabyar.online:5433/mychurch',
  ssl: false
});

// Tables to migrate
const tables = [
  'users',
  'leaders', 
  'sermons',
  'events',
  'worship_songs',
  'prayer_requests',
  'testimonials',
  'galleries',
  'pages',
  'bible_books',
  'bible_chapters',
  'bible_verses',
  'church_letters',
  'daily_contents',
  'daily_messages',
  'environment_variables',
  'schedule_events',
  'presentations'
];

async function migrateTable(tableName) {
  console.log(`\n📦 Migrating ${tableName}...`);
  
  try {
    // Read from Supabase (with pagination for large tables)
    let allData = [];
    let offset = 0;
    const limit = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(offset, offset + limit - 1);
      
      if (error) {
        console.log(`  ⚠️ Error reading ${tableName}: ${error.message}`);
        return { table: tableName, count: 0, error: error.message };
      }
      
      if (!data || data.length === 0) break;
      
      allData = allData.concat(data);
      offset += limit;
      
      if (data.length < limit) break;
    }
    
    if (allData.length === 0) {
      console.log(`  ⏭️ ${tableName} is empty, skipping`);
      return { table: tableName, count: 0 };
    }
    
    console.log(`  📊 Found ${allData.length} rows`);
    
    // Insert into PostgreSQL
    let insertedCount = 0;
    
    for (const row of allData) {
      const columns = Object.keys(row);
      const values = Object.values(row);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES (${placeholders})
        ON CONFLICT DO NOTHING
      `;
      
      try {
        await pool.query(query, values);
        insertedCount++;
      } catch (insertErr) {
        // Try without id (let PostgreSQL generate it)
        if (insertErr.message.includes('duplicate key') || insertErr.message.includes('violates')) {
          continue;
        }
        console.log(`  ⚠️ Row insert error: ${insertErr.message.substring(0, 50)}...`);
      }
    }
    
    console.log(`  ✅ Inserted ${insertedCount}/${allData.length} rows`);
    return { table: tableName, count: insertedCount };
    
  } catch (err) {
    console.log(`  ❌ Failed: ${err.message}`);
    return { table: tableName, count: 0, error: err.message };
  }
}

async function migrate() {
  console.log('🚀 Starting migration from Supabase to PostgreSQL...\n');
  console.log('📍 Source: Supabase (wxzhzsqicgwfxffxayhy)');
  console.log('📍 Destination: samanabyar.online:5433/mychurch\n');
  
  // Test connections
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw new Error(error.message);
    console.log('✅ Supabase connection OK');
  } catch (err) {
    console.log('❌ Supabase connection failed:', err.message);
    process.exit(1);
  }
  
  try {
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connection OK');
  } catch (err) {
    console.log('❌ PostgreSQL connection failed:', err.message);
    process.exit(1);
  }
  
  // Migrate each table
  const results = [];
  
  for (const table of tables) {
    const result = await migrateTable(table);
    results.push(result);
  }
  
  // Summary
  console.log('\n\n📊 Migration Summary:');
  console.log('═'.repeat(50));
  
  let totalMigrated = 0;
  for (const r of results) {
    const status = r.error ? '❌' : (r.count > 0 ? '✅' : '⏭️');
    console.log(`${status} ${r.table.padEnd(25)} ${r.count} rows`);
    totalMigrated += r.count;
  }
  
  console.log('═'.repeat(50));
  console.log(`Total: ${totalMigrated} rows migrated`);
  
  await pool.end();
  console.log('\n🎉 Migration complete!');
}

migrate().catch(console.error);
