import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createBibleTables() {
  try {
    console.log('🔄 Creating Bible tables in Supabase...');
    
    // Create all tables in one SQL transaction
    const { error: createError } = await supabase
      .from('_sql')
      .select()
      .execute(`
        BEGIN;
        
        -- Create bible_books table
        CREATE TABLE IF NOT EXISTS bible_books (
          id SERIAL PRIMARY KEY,
          book_number INTEGER UNIQUE NOT NULL,
          name_en VARCHAR(255) NOT NULL,
          name_fa VARCHAR(255) NOT NULL,
          abbreviation VARCHAR(10) UNIQUE NOT NULL,
          testament VARCHAR(10) CHECK (testament IN ('old', 'new')) NOT NULL,
          chapters_count INTEGER NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_bible_books_abbreviation ON bible_books(abbreviation);

        -- Create bible_chapters table
        CREATE TABLE IF NOT EXISTS bible_chapters (
          id SERIAL PRIMARY KEY,
          book_id INTEGER REFERENCES bible_books(id),
          chapter_number INTEGER NOT NULL,
          verses_count INTEGER NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(book_id, chapter_number)
        );
        CREATE INDEX IF NOT EXISTS idx_bible_chapters_book ON bible_chapters(book_id);

        -- Create bible_verses table
        CREATE TABLE IF NOT EXISTS bible_verses (
          id SERIAL PRIMARY KEY,
          chapter_id INTEGER REFERENCES bible_chapters(id),
          verse_number INTEGER NOT NULL,
          text_en TEXT,
          text_fa TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(chapter_id, verse_number)
        );
        CREATE INDEX IF NOT EXISTS idx_bible_verses_chapter ON bible_verses(chapter_id);
        CREATE INDEX IF NOT EXISTS idx_bible_verses_text ON bible_verses USING gin(to_tsvector('english', text_en || ' ' || COALESCE(text_fa, '')));

        COMMIT;
        `
    });

    if (createError) {
        console.error('Error creating tables:', createError);
        throw createError;
    }
    console.log('✅ Bible tables and indexes created');

    // Setup RLS policies
    const { error: rlsError } = await supabase
      .from('_sql')
      .select()
      .execute(`
        BEGIN;
        
        -- Enable RLS and set up policies
        ALTER TABLE bible_books ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow public read access" ON bible_books;
        CREATE POLICY "Allow public read access" ON bible_books FOR SELECT USING (true);
        
        ALTER TABLE bible_chapters ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow public read access" ON bible_chapters;
        CREATE POLICY "Allow public read access" ON bible_chapters FOR SELECT USING (true);
        
        ALTER TABLE bible_verses ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow public read access" ON bible_verses;
        CREATE POLICY "Allow public read access" ON bible_verses FOR SELECT USING (true);

        -- Admin write access policies
        DROP POLICY IF EXISTS "Allow admin write access" ON bible_books;
        CREATE POLICY "Allow admin write access" ON bible_books 
          FOR ALL USING (auth.role() = 'authenticated');
        
        DROP POLICY IF EXISTS "Allow admin write access" ON bible_chapters;
        CREATE POLICY "Allow admin write access" ON bible_chapters 
          FOR ALL USING (auth.role() = 'authenticated');
        
        DROP POLICY IF EXISTS "Allow admin write access" ON bible_verses;
        CREATE POLICY "Allow admin write access" ON bible_verses 
          FOR ALL USING (auth.role() = 'authenticated');

        COMMIT;
        `
      });

    if (rlsError) {
        console.error('Error setting up RLS:', rlsError);
        throw rlsError;
    }
    console.log('✅ RLS policies created');

    console.log('✅ All Bible tables and policies created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

createBibleTables();