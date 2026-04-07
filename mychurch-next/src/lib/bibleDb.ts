import path from "path";
import Database from "better-sqlite3";
import type { Database as BetterSqlite3Database } from "better-sqlite3";

const DB_PATH = path.join(process.cwd(), "Bible", "bible_output", "bible_complete.db");

// Create a singleton DB connection for reuse
let _db: BetterSqlite3Database | null = null;
const _stmtCache = new Map<string, ReturnType<BetterSqlite3Database["prepare"]>>();

function getDb(): BetterSqlite3Database {
  if (_db) return _db;
  
  try {
    _db = new Database(DB_PATH, { readonly: true });
    // Read-mostly workload: keep memory temp store and avoid fsync overhead.
    _db.pragma("temp_store = MEMORY");
    _db.pragma("synchronous = OFF");
    return _db;
  } catch (err: any) {
    console.error("[bibleDb] Failed to open database using better-sqlite3:", err.message);
    throw err;
  }
}

function getStatement(sqlRaw: string) {
  const cached = _stmtCache.get(sqlRaw);
  if (cached) return cached;

  const stmt = getDb().prepare(sqlRaw);
  _stmtCache.set(sqlRaw, stmt);
  return stmt;
}

export async function dbAll<T = Record<string, unknown>>(sqlRaw: string, params: unknown[] = []): Promise<T[]> {
  const stmt = getStatement(sqlRaw);
  return stmt.all(params) as T[];
}

export async function dbGet<T = Record<string, unknown>>(sqlRaw: string, params: unknown[] = []): Promise<T | undefined> {
  const stmt = getStatement(sqlRaw);
  return stmt.get(params) as T | undefined;
}
