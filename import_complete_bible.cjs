#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { pool } = require('./backend/db-postgres');

// Book mapping for Old Testament (Genesis is book 1)
const BOOK_MAPPING = {
  1: { name_en: 'Genesis', name_fa: 'پیدایش', abbreviation: 'Gen', testament: 'OT' },
  2: { name_en: 'Exodus', name_fa: 'خروج', abbreviation: 'Exod', testament: 'OT' },
  3: { name_en: 'Leviticus', name_fa: 'لاویان', abbreviation: 'Lev', testament: 'OT' },
  4: { name_en: 'Numbers', name_fa: 'اعداد', abbreviation: 'Num', testament: 'OT' },
  5: { name_en: 'Deuteronomy', name_fa: 'تثنیه', abbreviation: 'Deut', testament: 'OT' },
  6: { name_en: 'Joshua', name_fa: 'یوشع', abbreviation: 'Josh', testament: 'OT' },
  7: { name_en: 'Judges', name_fa: 'داوران', abbreviation: 'Judg', testament: 'OT' },
  8: { name_en: 'Ruth', name_fa: 'روت', abbreviation: 'Ruth', testament: 'OT' },
  9: { name_en: '1 Samuel', name_fa: '۱ سموئیل', abbreviation: '1Sam', testament: 'OT' },
  10: { name_en: '2 Samuel', name_fa: '۲ سموئیل', abbreviation: '2Sam', testament: 'OT' },
  11: { name_en: '1 Kings', name_fa: '۱ پادشاهان', abbreviation: '1Kgs', testament: 'OT' },
  12: { name_en: '2 Kings', name_fa: '۲ پادشاهان', abbreviation: '2Kgs', testament: 'OT' },
  13: { name_en: '1 Chronicles', name_fa: '۱ تواریخ', abbreviation: '1Chr', testament: 'OT' },
  14: { name_en: '2 Chronicles', name_fa: '۲ تواریخ', abbreviation: '2Chr', testament: 'OT' },
  15: { name_en: 'Ezra', name_fa: 'عزرا', abbreviation: 'Ezra', testament: 'OT' },
  16: { name_en: 'Nehemiah', name_fa: 'نحمیا', abbreviation: 'Neh', testament: 'OT' },
  17: { name_en: 'Esther', name_fa: 'استر', abbreviation: 'Esth', testament: 'OT' },
  18: { name_en: 'Job', name_fa: 'ایوب', abbreviation: 'Job', testament: 'OT' },
  19: { name_en: 'Psalms', name_fa: 'مزامیر', abbreviation: 'Ps', testament: 'OT' },
  20: { name_en: 'Proverbs', name_fa: 'امثال', abbreviation: 'Prov', testament: 'OT' },
  21: { name_en: 'Ecclesiastes', name_fa: 'جامعه', abbreviation: 'Eccl', testament: 'OT' },
  22: { name_en: 'Song of Songs', name_fa: 'غزل غزلها', abbreviation: 'Song', testament: 'OT' },
  23: { name_en: 'Isaiah', name_fa: 'اشعیا', abbreviation: 'Isa', testament: 'OT' },
  24: { name_en: 'Jeremiah', name_fa: 'ارمیا', abbreviation: 'Jer', testament: 'OT' },
  25: { name_en: 'Lamentations', name_fa: 'مراثی', abbreviation: 'Lam', testament: 'OT' },
  26: { name_en: 'Ezekiel', name_fa: 'حزقیال', abbreviation: 'Ezek', testament: 'OT' },
  27: { name_en: 'Daniel', name_fa: 'دانیال', abbreviation: 'Dan', testament: 'OT' },
  // ... more books as needed
};

class CompleteBibleImporter {
  constructor() {
    this.stats = {
      processed: 0,
      imported: 0,
      errors: 0,
      books: new Set(),
      chapters: new Set()
    };
  }

  async clearExistingData() {
    console.log('🗑️ Clearing existing Bible data...');
    
    await pool.query('DELETE FROM bible_verses');
    await pool.query('DELETE FROM bible_chapters');
    await pool.query('DELETE FROM bible_books WHERE book_number <= 39'); // OT books
    
    console.log('✅ Existing data cleared');
  }

  async ensureBook(bookNumber) {
    if (!BOOK_MAPPING[bookNumber]) {
      console.warn(`⚠️ Unknown book number: ${bookNumber}`);
      return null;
    }

    const bookInfo = BOOK_MAPPING[bookNumber];
    
    // Check if book exists
    const existingBook = await pool.query(
      'SELECT id FROM bible_books WHERE book_number = $1',
      [bookNumber]
    );

    if (existingBook.rows.length > 0) {
      return existingBook.rows[0].id;
    }

    // Insert book
    const result = await pool.query(`
      INSERT INTO bible_books (book_number, name_en, name_fa, abbreviation, testament, chapters_count)
      VALUES ($1, $2, $3, $4, $5, 0)
      RETURNING id
    `, [bookNumber, bookInfo.name_en, bookInfo.name_fa, bookInfo.abbreviation, bookInfo.testament]);

    this.stats.books.add(bookNumber);
    console.log(`📖 Created book: ${bookInfo.name_en} (${bookInfo.name_fa})`);
    
    return result.rows[0].id;
  }

  async ensureChapter(bookId, chapterNumber) {
    const chapterKey = `${bookId}-${chapterNumber}`;
    
    if (this.stats.chapters.has(chapterKey)) {
      const existing = await pool.query(
        'SELECT id FROM bible_chapters WHERE book_id = $1 AND chapter_number = $2',
        [bookId, chapterNumber]
      );
      return existing.rows[0].id;
    }

    const result = await pool.query(`
      INSERT INTO bible_chapters (book_id, chapter_number, verses_count)
      VALUES ($1, $2, 0)
      RETURNING id
    `, [bookId, chapterNumber]);

    this.stats.chapters.add(chapterKey);
    console.log(`📑 Created chapter: Book ${bookId}, Chapter ${chapterNumber}`);
    
    return result.rows[0].id;
  }

  parseOldFormatLine(line, expectedVersion) {
    // Extract tuple values using regex that handles quotes correctly
    const match = line.match(/\((.*)\)/);
    if (!match) return null;
    
    // Split by commas that are not inside single quotes
    const parts = match[1].split(/,(?=(?:[^']*'[^']*')*[^']*$)/).map(s => s.trim());
    if (parts.length < 6) return null;

    // Helper function to unquote and handle SQL escaping
    const unquote = (value) => {
      if (value === 'NULL') return null;
      return value.replace(/^'/, '').replace(/'$/, '').replace(/''/g, "'");
    };

    const version = unquote(parts[0]);
    if (version !== expectedVersion) return null; // Skip if not our target version

    const chapter = parseInt(unquote(parts[2]), 10);
    const verse = parseInt(unquote(parts[3]), 10);
    const textFa = unquote(parts[4]);
    const textEn = unquote(parts[5]);

    if (!Number.isFinite(chapter) || !Number.isFinite(verse)) return null;

    return {
      version,
      chapter,
      verse,
      textFa,
      textEn
    };
  }

  async importFromFile(filePath, version, startBookNumber = 1) {
    console.log(`\n📥 Importing ${version} from ${filePath}...`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let currentBookId = null;
    let currentChapterId = null;
    let currentBookNumber = startBookNumber;
    let currentChapter = 1;

    for (const line of lines) {
      // Process only tuple lines that start with our version
      if (!line.includes(`('${version}'`)) continue;

      try {
        const parsed = this.parseOldFormatLine(line, version);
        if (!parsed) continue;

        this.stats.processed++;

        // Ensure book exists
        if (!currentBookId) {
          currentBookId = await this.ensureBook(currentBookNumber);
          if (!currentBookId) continue;
        }

        // Check if we need to move to next chapter
        if (parsed.chapter !== currentChapter) {
          currentChapter = parsed.chapter;
          currentChapterId = null;
        }

        // Ensure chapter exists
        if (!currentChapterId) {
          currentChapterId = await this.ensureChapter(currentBookId, currentChapter);
        }

        // Insert verse
        await pool.query(`
          INSERT INTO bible_verses (chapter_id, verse_number, text_fa, text_en)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (chapter_id, verse_number) DO UPDATE SET
            text_fa = COALESCE(EXCLUDED.text_fa, bible_verses.text_fa),
            text_en = COALESCE(EXCLUDED.text_en, bible_verses.text_en)
        `, [currentChapterId, parsed.verse, parsed.textFa, parsed.textEn]);

        this.stats.imported++;

        if (this.stats.processed % 100 === 0) {
          console.log(`📊 Processed: ${this.stats.processed}, Imported: ${this.stats.imported}`);
        }

      } catch (error) {
        this.stats.errors++;
        console.error(`❌ Error processing line: ${error.message}`);
        if (this.stats.errors > 50) {
          console.error('Too many errors, stopping import');
          break;
        }
      }
    }

    console.log(`✅ Completed ${version}: ${this.stats.imported} verses imported`);
  }

  async updateChapterCounts() {
    console.log('🔢 Updating chapter and verse counts...');
    
    // Update verse counts
    await pool.query(`
      UPDATE bible_chapters 
      SET verses_count = (
        SELECT COUNT(*) FROM bible_verses 
        WHERE bible_verses.chapter_id = bible_chapters.id
      )
    `);

    // Update chapter counts
    await pool.query(`
      UPDATE bible_books 
      SET chapters_count = (
        SELECT COUNT(*) FROM bible_chapters 
        WHERE bible_chapters.book_id = bible_books.id
      )
    `);

    console.log('✅ Counts updated');
  }

  async run() {
    try {
      console.log('🚀 Starting Complete Bible Import...\n');

      // Clear existing data
      await this.clearExistingData();

      // Import from each file
      const files = [
        { path: 'attached_assets/verses_mojdeh_1757861410662.sql', version: 'mojdeh', startBook: 1 },
        { path: 'attached_assets/verses_qadim_1757861410663.sql', version: 'qadim', startBook: 1 },
        { path: 'attached_assets/verses_tafsiri_ot_1757861410663.sql', version: 'tafsiri_ot', startBook: 1 }
      ];

      for (const file of files) {
        await this.importFromFile(file.path, file.version, file.startBook);
      }

      // Update counts
      await this.updateChapterCounts();

      // Final statistics
      console.log('\n📈 Import Complete!');
      console.log(`Books created: ${this.stats.books.size}`);
      console.log(`Chapters created: ${this.stats.chapters.size}`);
      console.log(`Total verses: ${this.stats.imported}`);
      console.log(`Errors: ${this.stats.errors}`);

    } catch (error) {
      console.error('💥 Import failed:', error);
      process.exit(1);
    } finally {
      await pool.end();
    }
  }
}

// Run the importer
if (require.main === module) {
  const importer = new CompleteBibleImporter();
  importer.run();
}

module.exports = CompleteBibleImporter;