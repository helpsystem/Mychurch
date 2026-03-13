import path from "path";
import fs from "fs";
import initSqlJs from "sql.js";
import type { Database } from "sql.js";

const DB_PATH = path.join(process.cwd(), "Bible", "bible_output", "bible_complete.db");

// Create a singleton DB connection for reuse
let _db: Database | null = null;
let _initPromise: Promise<Database> | null = null;

async function getDbAsync(): Promise<Database> {
  if (_db) return _db;
  
  if (!_initPromise) {
    _initPromise = (async () => {
      try {
        const SQL = await initSqlJs({
          locateFile: file => path.join(process.cwd(), "public", "wasm", file)
        });
        const fileBuffer = fs.readFileSync(DB_PATH);
        _db = new SQL.Database(fileBuffer);
        return _db;
      } catch (err: any) {
        console.error("[bibleDb] Failed to open database using sql.js:", err.message);
        throw err;
      }
    })();
  }
  
  return _initPromise;
}

export async function dbAll<T = Record<string, unknown>>(sqlRaw: string, params: unknown[] = []): Promise<T[]> {
  const db = await getDbAsync();
  
  // sql.js uses ?1, ?2 instead of standard ? for prepared statements, but also supports arrays passed to exec/prepare
  const stmt = db.prepare(sqlRaw);
  stmt.bind(params as any[]);
  
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return results;
}

export async function dbGet<T = Record<string, unknown>>(sqlRaw: string, params: unknown[] = []): Promise<T | undefined> {
  const db = await getDbAsync();
  const stmt = db.prepare(sqlRaw);
  stmt.bind(params as any[]);
  
  let result: T | undefined = undefined;
  if (stmt.step()) {
    result = stmt.getAsObject() as unknown as T;
  }
  stmt.free();
  return result;
}
