/**
 * Supabase Client for Bible Data
 * Uses HTTPS instead of PostgreSQL port 5432 (blocked by firewall)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SUPABASE_URL or SUPABASE_KEY not found in environment');
  module.exports = null;
} else {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('✅ Supabase JS Client initialized (HTTPS - bypasses port 5432 block)');
  
  module.exports = {
    supabase,
    
    // Get all bible books
    async getBibleBooks() {
      const { data, error } = await supabase
        .from('bible_books')
        .select('*')
        .order('book_number');
      
      if (error) throw error;
      return data;
    },
    
    // Get bible translations
    async getBibleTranslations() {
      const { data, error } = await supabase
        .from('bible_translations')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data;
    },
    
    // Get chapters for a book
    async getChapters(bookISO) {
      const { data, error } = await supabase
        .from('bible_chapters')
        .select('*')
        .eq('book_iso', bookISO)
        .order('chapter_number');
      
      if (error) throw error;
      return data;
    },
    
    // Get verses for a chapter
    async getVerses(bookISO, chapterNum, translationId = 1) { // ✅ Changed from 2 to 1
      // Strategy: Query verses directly by joining with chapter info
      // bible_verses has: chapter_id, verse_number, text_fa, text_en, translation_id
      // bible_chapters has: id, book_iso, chapter_number
      
      // First, find all chapter IDs for this book and chapter number
      const { data: chapters, error: chapterError } = await supabase
        .from('bible_chapters')
        .select('id')
        .eq('book_iso', bookISO)
        .eq('chapter_number', chapterNum);
      
      if (chapterError) {
        console.error('Chapter lookup error:', chapterError);
        throw chapterError;
      }
      
      if (!chapters || chapters.length === 0) {
        console.log(`No chapters found for ${bookISO} chapter ${chapterNum}`);
        return [];
      }
      
      // Get the first chapter_id (usually there's only one per book/chapter combination)
      const chapterId = chapters[0].id;
      
      // Then get verses for this chapter and translation
      const { data, error } = await supabase
        .from('bible_verses')
        .select('*')
        .eq('chapter_id', chapterId)
        .eq('translation_id', translationId)
        .order('verse_number');
      
      if (error) {
        console.error('Verses lookup error:', error);
        throw error;
      }
      
      return data || [];
    }
  };
}
