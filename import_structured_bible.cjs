#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

class StructuredBibleImporter {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    // Mapping of Persian book names to English abbreviations
    this.bookAbbreviations = {
      'پیدایش': 'Gen', 'خروج': 'Exod', 'لاویان': 'Lev', 'اعداد': 'Num', 'تثنیه': 'Deut',
      'یوشع': 'Josh', 'داوران': 'Judg', 'روت': 'Ruth', 'اول سموئیل': '1Sam', 'دوم سموئیل': '2Sam',
      'اول پادشاهان': '1Kgs', 'دوم پادشاهان': '2Kgs', 'اول تواریخ': '1Chr', 'دوم تواریخ': '2Chr',
      'عزرا': 'Ezra', 'نحمیا': 'Neh', 'استر': 'Esth', 'ایوب': 'Job', 'مزامیر': 'Ps',
      'امثال': 'Prov', 'جامعه': 'Eccl', 'غزل غزل‌ها': 'Song', 'اشعیا': 'Isa', 'ارمیا': 'Jer',
      'مراثی ارمیا': 'Lam', 'حزقیال': 'Ezek', 'دانیال': 'Dan', 'هوشع': 'Hos', 'یوئیل': 'Joel',
      'عاموس': 'Amos', 'عوبدیا': 'Obad', 'یونس': 'Jonah', 'میکاه': 'Mic', 'ناحوم': 'Nah',
      'حبقوق': 'Hab', 'صفنیا': 'Zeph', 'حجّی': 'Hag', 'زکریا': 'Zech', 'ملاکی': 'Mal',
      'متی': 'Matt', 'مرقس': 'Mark', 'لوقا': 'Luke', 'یوحنا': 'John', 'اعمال رسولان': 'Acts',
      'رومیان': 'Rom', 'اول قرنتیان': '1Cor', 'دوم قرنتیان': '2Cor', 'غلاطیان': 'Gal',
      'افسسیان': 'Eph', 'فیلیپیان': 'Phil', 'کولسیان': 'Col', 'اول تسالونیکیان': '1Thess',
      'دوم تسالونیکیان': '2Thess', 'اول تیموتائوس': '1Tim', 'دوم تیموتائوس': '2Tim',
      'تیطس': 'Titus', 'فیلیمون': 'Phlm', 'عبرانیان': 'Heb', 'یعقوب': 'Jas',
      'اول پطرس': '1Pet', 'دوم پطرس': '2Pet', 'اول یوحنا': '1John', 'دوم یوحنا': '2John',
      'سوم یوحنا': '3John', 'یهودا': 'Jude', 'مکاشفهٔ یوحنا': 'Rev'
    };
  }

  async connect() {
    await this.client.connect();
    console.log('✅ Connected to PostgreSQL');
  }

  async clearExistingData() {
    console.log('🗑️ Clearing existing Bible data...');
    await this.client.query('DELETE FROM bible_verses');
    await this.client.query('DELETE FROM bible_chapters');
    await this.client.query('DELETE FROM bible_books');
    console.log('✅ Existing data cleared');
  }

  parseSqlFile(filePath) {
    console.log(`📖 Reading SQL file: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const books = [];
    const chapters = [];
    const verses = [];
    
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.includes('INSERT INTO books VALUES')) {
        const match = line.match(/VALUES \(([^)]+)\)/);
        if (match) {
          const values = this.parseValues(match[1]);
          if (values.length >= 5) {
            books.push({
              id: parseInt(values[0]),
              code: values[1],
              name_fa: values[2],
              name_en: values[3],
              testament: values[4]
            });
          }
        }
      } else if (line.includes('INSERT INTO chapters VALUES')) {
        const match = line.match(/VALUES \(([^)]+)\)/);
        if (match) {
          const values = this.parseValues(match[1]);
          if (values.length >= 3) {
            chapters.push({
              id: parseInt(values[0]),
              book_id: parseInt(values[1]),
              chapter_number: parseInt(values[2])
            });
          }
        }
      } else if (line.includes('INSERT INTO verses VALUES')) {
        const match = line.match(/VALUES \(([^)]+)\)/);
        if (match) {
          const values = this.parseValues(match[1]);
          if (values.length >= 5) {
            verses.push({
              id: parseInt(values[0]),
              chapter_id: parseInt(values[1]),
              verse_number: parseInt(values[2]),
              text_fa: values[3] === 'NULL' ? null : values[3],
              text_en: values[4] === 'NULL' ? null : values[4]
            });
          }
        }
      }
    }
    
    console.log(`📊 Parsed: ${books.length} books, ${chapters.length} chapters, ${verses.length} verses`);
    return { books, chapters, verses };
  }

  parseValues(valueString) {
    const values = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < valueString.length) {
      const char = valueString[i];
      
      if (char === "'" && !inQuotes) {
        inQuotes = true;
      } else if (char === "'" && inQuotes && valueString[i + 1] !== "'") {
        inQuotes = false;
      } else if (char === "'" && inQuotes && valueString[i + 1] === "'") {
        current += "'";
        i++; // Skip next quote
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else if (!inQuotes && char !== ' ') {
        current += char;
      } else if (inQuotes) {
        current += char;
      }
      i++;
    }
    
    if (current.trim()) {
      values.push(current.trim());
    }
    
    return values;
  }

  async importBooks(books) {
    console.log('📚 Importing books...');
    
    for (const book of books) {
      const abbreviation = this.bookAbbreviations[book.name_fa] || book.code;
      
      await this.client.query(`
        INSERT INTO bible_books (book_number, name_en, name_fa, abbreviation, testament, chapters_count)
        VALUES ($1, $2, $3, $4, $5, 0)
      `, [book.id, book.name_en, book.name_fa, abbreviation, book.testament]);
      
      console.log(`📖 Created book: ${book.name_fa} (${book.name_en}) - ${abbreviation}`);
    }
  }

  async importChapters(chapters) {
    console.log('📑 Importing chapters...');
    
    const bookMapping = await this.client.query('SELECT id, book_number FROM bible_books');
    const bookMap = {};
    for (const row of bookMapping.rows) {
      bookMap[row.book_number] = row.id;
    }
    
    for (const chapter of chapters) {
      const ourBookId = bookMap[chapter.book_id];
      if (!ourBookId) continue;
      
      await this.client.query(`
        INSERT INTO bible_chapters (book_id, chapter_number, verses_count)
        VALUES ($1, $2, 0)
      `, [ourBookId, chapter.chapter_number]);
    }
    
    console.log(`📑 Imported ${chapters.length} chapters`);
  }

  async importVerses(verses) {
    console.log('📝 Importing verses...');
    
    // Build mapping: original_chapter_id -> our_chapter_id
    // We need to map based on book+chapter combination
    const chapterQuery = await this.client.query(`
      SELECT bc.id as our_chapter_id, bb.book_number, bc.chapter_number
      FROM bible_chapters bc
      JOIN bible_books bb ON bc.book_id = bb.id
      ORDER BY bb.book_number, bc.chapter_number
    `);
    
    // Create mapping from source chapters to our chapters
    const chapterMapping = {};
    let chapterIndex = 1; // Source chapters start from ID 1
    
    for (const row of chapterQuery.rows) {
      chapterMapping[chapterIndex] = row.our_chapter_id;
      chapterIndex++;
    }
    
    console.log(`📊 Chapter mapping created: ${Object.keys(chapterMapping).length} chapters`);
    
    let imported = 0;
    let skipped = 0;
    
    for (const verse of verses) {
      const ourChapterId = chapterMapping[verse.chapter_id];
      
      if (!ourChapterId) {
        skipped++;
        continue;
      }
      
      // Clean HTML from English text
      let cleanTextEn = verse.text_en;
      if (cleanTextEn) {
        cleanTextEn = cleanTextEn
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/span class="verse" id="\d+">\d+ <\/span\s*/g, '') // Remove verse markers
          .trim();
      }
      
      await this.client.query(`
        INSERT INTO bible_verses (chapter_id, verse_number, text_en, text_fa)
        VALUES ($1, $2, $3, $4)
      `, [ourChapterId, verse.verse_number, cleanTextEn, verse.text_fa]);
      
      imported++;
      if (imported % 500 === 0) {
        console.log(`📊 Imported ${imported} verses...`);
      }
    }
    
    console.log(`📝 Imported ${imported} verses total (skipped ${skipped})`);
  }

  async updateCounts() {
    console.log('🔢 Updating verse and chapter counts...');
    
    // Update verses_count in chapters
    await this.client.query(`
      UPDATE bible_chapters 
      SET verses_count = (
        SELECT COUNT(*) 
        FROM bible_verses 
        WHERE chapter_id = bible_chapters.id
      )
    `);
    
    // Update chapters_count in books
    await this.client.query(`
      UPDATE bible_books 
      SET chapters_count = (
        SELECT COUNT(*) 
        FROM bible_chapters 
        WHERE book_id = bible_books.id
      )
    `);
    
    console.log('✅ Counts updated');
  }

  async import() {
    try {
      await this.connect();
      await this.clearExistingData();
      
      const filePath = 'attached_assets/bible_fa_en_1758111193552.sql';
      const { books, chapters, verses } = this.parseSqlFile(filePath);
      
      await this.importBooks(books);
      await this.importChapters(chapters);
      await this.importVerses(verses);
      await this.updateCounts();
      
      // Final stats
      const stats = await this.client.query(`
        SELECT 
          (SELECT COUNT(*) FROM bible_books) as books,
          (SELECT COUNT(*) FROM bible_chapters) as chapters,
          (SELECT COUNT(*) FROM bible_verses) as verses
      `);
      
      console.log('📈 Import Complete!');
      console.log(`Books: ${stats.rows[0].books}`);
      console.log(`Chapters: ${stats.rows[0].chapters}`);
      console.log(`Verses: ${stats.rows[0].verses}`);
      
    } catch (error) {
      console.error('❌ Import failed:', error);
    } finally {
      await this.client.end();
    }
  }
}

// Run the import
const importer = new StructuredBibleImporter();
importer.import();