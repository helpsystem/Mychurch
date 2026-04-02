import path from "path";
import Database from "better-sqlite3";
import type { Database as BetterSqlite3Database } from "better-sqlite3";

const DB_PATH = path.join(process.cwd(), "Bible", "bible_output", "bible_complete.db");

// Create a singleton DB connection for reuse
let _db: BetterSqlite3Database | null = null;

function getDb(): BetterSqlite3Database {
  if (_db) return _db;
  
  try {
    _db = new Database(DB_PATH, { readonly: true });
    return _db;
  } catch (err: any) {
    console.error("[bibleDb] Failed to open database using better-sqlite3:", err.message);
    throw err;
  }
}

export async function dbAll<T = Record<string, unknown>>(sqlRaw: string, params: unknown[] = []): Promise<T[]> {
  const db = getDb();
  const stmt = db.prepare(sqlRaw);
  return stmt.all(params) as T[];
}

export async function dbGet<T = Record<string, unknown>>(sqlRaw: string, params: unknown[] = []): Promise<T | undefined> {
  const db = getDb();
  const stmt = db.prepare(sqlRaw);
  return stmt.get(params) as T | undefined;
}
