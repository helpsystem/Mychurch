/**
 * ============================================================
 *  RBAC Migration Runner
 *  Applies the rbac_upgrade.sql migration to PostgreSQL
 * ============================================================
 *
 * Usage:
 *   node backend/scripts/run-rbac-migration.js
 *
 * Or from project root:
 *   node scripts/run-rbac-migration.js
 */

const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔐 MyChurch RBAC Migration');
  console.log('══════════════════════════════════════════');

  // Load the pool from db-postgres
  let pool;
  try {
    const dbModule = require('../db-postgres');
    pool = dbModule.pool;
  } catch (e) {
    // Try alternative path
    const dbModule = require('../../backend/db-postgres');
    pool = dbModule.pool;
  }

  if (!pool) {
    console.error('❌ Could not connect to database. Check your .env configuration.');
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    // Read migration SQL
    const sqlPath = path.join(__dirname, '..', 'migrations', 'rbac_upgrade.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📄 Running rbac_upgrade.sql...\n');

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('\n✅ RBAC migration completed successfully!');

    // Verify
    console.log('\n📊 Verification:');
    const usersResult = await client.query('SELECT email, role, roles, permissions FROM users LIMIT 10');
    console.log(`   Found ${usersResult.rows.length} user(s):`);
    for (const u of usersResult.rows) {
      console.log(`   - ${u.email} | role: ${u.role} | roles: ${JSON.stringify(u.roles)} | perms: ${Array.isArray(u.permissions) ? u.permissions.length : 0} items`);
    }

    // Check columns
    const colResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    console.log('\n📋 Users table schema:');
    for (const col of colResult.rows) {
      console.log(`   ${col.column_name} (${col.data_type})`);
    }

    console.log('\n══════════════════════════════════════════');
    console.log('🎉 Migration done! You can now deploy the updated backend.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
  }

  process.exit(0);
}

runMigration();
