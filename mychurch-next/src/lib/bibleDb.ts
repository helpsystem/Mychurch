import path from "path";
import sqlite3 from "sqlite3";
import { promisify } from "util";

const DB_PATH = path.join(process.cwd(), "Bible", "bible_output", "bible_complete.db");

// Create a singleton DB connection for reuse
let _db: sqlite3.Database | null = null;

function getDb(): sqlite3.Database {
  if (!_db) {
    _db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error("[bibleDb] Failed to open database:", err.message);
        _db = null;
      }
    });
  }
  return _db!;
}

export function dbAll<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

export function dbGet<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T | undefined);
    });
  });
}
