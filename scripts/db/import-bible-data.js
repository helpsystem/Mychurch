import sqlite3 from 'sqlite3';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const { verbose } = sqlite3;
const db = verbose();

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// SQLite file path
const SQLITE_PATH = './attached_assets/bible_fa_en_1758111193552.sqlite';

async function importBibleData() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(SQLITE_PATH, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error('❌ Error opening SQLite database:', err);
        reject(err);
        return;
      }
      console.log('✅ Connected to SQLite database');
    });

    const importBooks = async () => {
      console.log('📚 Importing books...');
      return new Promise((resolve, reject) => {
        db.all(`
              SELECT 
                id,
                code,
                name_en,
                name_fa,
                testament
              FROM books
              ORDER BY id
            `, async (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          try {
            // Map and insert books in chunks
            const mapped = rows.map(r => ({
              source_id: r.id,
              book_number: Number(r.code),
              name_en: r.name_en,
              name_fa: r.name_fa,
              testament: (r.testament || '').toUpperCase() === 'OT' ? 'old' : 'new',
              abbreviation: (r.name_en || '').substring(0,10).replace(/\s+/g,'').toUpperCase() || String(r.code),
              chapters_count: 0
            }));

            const chunkSize = 50;
            for (let i = 0; i < mapped.length; i += chunkSize) {
              const chunk = mapped.slice(i, i + chunkSize);
              const { error } = await supabase
                .from('bible_books')
                .upsert(chunk, { onConflict: 'source_id' });

              if (error) throw error;
            }
            console.log(`✅ Imported ${rows.length} books`);
            resolve(rows);
          } catch (error) {
            reject(error);
          }
        });
      });
    };

    // No separate chapters table will be created; verses will be written
    // directly into the existing `bible_verses` table which stores
    // (book_id, chapter, verse, text_en, text_fa).
    const importChapters = async () => {
      console.log('📖 Loading chapters from SQLite (no-op for DB schema)');
      return;
    };

    const importVerses = async () => {
      console.log('📝 Importing verses...');
      return new Promise((resolve, reject) => {
        db.each(`
          SELECT 
            v.id as source_id,
            v.chapter_id,
            v.verse_number,
            v.text_en,
            v.text_fa
          FROM verses v
          ORDER BY v.chapter_id, v.verse_number
        `, async (err, verse) => {
          if (err) {
            reject(err);
            return;
          }

          try {
            // Resolve chapter info from the SQLite chapters table
            const chap = await new Promise((res, rej) => {
              db.get(`SELECT id, book_id, chapter_number FROM chapters WHERE id = ?`, [verse.chapter_id], (e, row) => {
                if (e) return rej(e);
                res(row);
              });
            });

            if (!chap) {
              console.warn(`⚠️ Source chapter not found: ${verse.chapter_id}`);
              return;
            }

            // Resolve Supabase book id from bible_books.source_id
            const { data: bookData } = await supabase
              .from('bible_books')
              .select('id')
              .eq('source_id', chap.book_id)
              .single();

            if (!bookData) {
              console.warn(`⚠️ Book not found for source_id ${chap.book_id}`);
              return;
            }

            // Upsert into existing bible_verses table (book_id, chapter, verse)
            const { error } = await supabase
              .from('bible_verses')
              .upsert({
                book_id: bookData.id,
                chapter: chap.chapter_number,
                verse: verse.verse_number,
                text_en: verse.text_en,
                text_fa: verse.text_fa,
                source_id: verse.source_id
              }, {
                onConflict: 'source_id'
              });

            if (error) {
              console.error('❌ Error inserting verse:', error);
              throw error;
            }
          } catch (error) {
            reject(error);
          }
        }, (err, count) => {
          if (err) {
            reject(err);
          } else {
            console.log(`✅ Imported ${count} verses`);
            resolve();
          }
        });
      });
    };

    // Run the import process
    importBooks()
      .then(books => importChapters(books))
      .then(() => importVerses())
      .then(() => {
        console.log('✅ All Bible data imported successfully');
        db.close();
        resolve();
      })
      .catch(error => {
        console.error('❌ Import failed:', error);
        db.close();
        reject(error);
      });
  });
}

importBibleData();