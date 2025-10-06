#!/usr/bin/env node
import { Pool } from 'pg';
import 'dotenv/config';

const direct = process.env.DIRECT_DATABASE_URL;
const url = process.env.DATABASE_URL || direct;
if(!url){
  console.error('❌ DATABASE_URL (or DIRECT_DATABASE_URL) not set');
  process.exit(2);
}

const pool = new Pool({ connectionString: url, ssl:{ rejectUnauthorized:false } });

(async () => {
  const result = { ok:false, steps:[] };
  try {
    const t0 = Date.now();
    const { rows } = await pool.query('SELECT 1 as ping');
    result.steps.push({ step:'ping', duration:Date.now()-t0, rows });
    // Optional table existence
    const tableCheck = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name like 'bible_%' ORDER BY table_name");
    result.steps.push({ step:'tables', count: tableCheck.rowCount, tables: tableCheck.rows.map(r=>r.table_name) });
    if (tableCheck.rows.some(r=>r.table_name==='bible_books')) {
      const books = await pool.query('SELECT COUNT(*)::int AS c FROM bible_books');
      result.steps.push({ step:'bible_books_count', count: books.rows[0].c });
    }
    if (tableCheck.rows.some(r=>r.table_name==='bible_verses')) {
      const verses = await pool.query('SELECT COUNT(*)::int AS c FROM bible_verses');
      result.steps.push({ step:'bible_verses_count', count: verses.rows[0].c });
    }
    result.ok = true;
    console.log(JSON.stringify(result,null,2));
    process.exit(0);
  } catch (e) {
    result.error = e.message;
    console.error(JSON.stringify(result,null,2));
    process.exit(1);
  } finally {
    await pool.end().catch(()=>{});
  }
})();
