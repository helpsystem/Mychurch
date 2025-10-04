#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { pool } = require('../../backend/db-postgres');

(async function applySql() {
  const sqlPath = path.resolve(__dirname, 'bible-schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  try {
    console.log('Applying SQL migration...');
    await pool.query(sql);
    console.log('Migration applied successfully');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    await pool.end().catch(()=>{});
    process.exit(1);
  }
})();
