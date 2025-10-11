/**
 * API.Bible Service
 * Official API for Bible content
 * Documentation: https://scripture.api.bible/
 */

const https = require('https');

// Bible IDs from API.Bible
const BIBLE_VERSIONS = {
  // Persian translations
  PERSIAN_CONTEMPORARY: '7cd100148df29c08-01', // Biblica® Open Persian Contemporary Bible
  
  // English translations
  KJV: 'de4e12af7f28f599-02', // King James Version
  NIV: '71c6eab17ae5b667-01', // New International Version
  ESV: '01b29f4b342acc35-01', // English Standard Version
  NLT: '1fd37e4b3f074e7e-01', // New Living Translation
};

/**
 * Make authenticated request to API.Bible
 */
function makeApiRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.scripture.api.bible',
      path: `/v1${endpoint}`,
      method: 'GET',
      headers: {
        'api-key': process.env.BIBLE_API_KEY
      }
    };

    https.get(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve(parsed.data);
          } else {
            reject(new Error(parsed.message || 'API request failed'));
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Get available Bibles
 */
async function getBibles() {
  return await makeApiRequest('/bibles');
}

/**
 * Get books for a specific Bible version
 */
async function getBooks(bibleId = BIBLE_VERSIONS.PERSIAN_CONTEMPORARY) {
  return await makeApiRequest(`/bibles/${bibleId}/books`);
}

/**
 * Get chapters for a book
 */
async function getChapters(bibleId, bookId) {
  return await makeApiRequest(`/bibles/${bibleId}/books/${bookId}/chapters`);
}

/**
 * Get chapter content with verses (using content-type=json for structured data)
 */
async function getChapterContent(bibleId, chapterId) {
  return await makeApiRequest(
    `/bibles/${bibleId}/chapters/${chapterId}?content-type=json&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`
  );
}

/**
 * Get verses list for a chapter (metadata only)
 */
async function getVerses(bibleId, chapterId) {
  return await makeApiRequest(`/bibles/${bibleId}/chapters/${chapterId}/verses`);
}

/**
 * Get a specific verse
 */
async function getVerse(bibleId, verseId) {
  return await makeApiRequest(`/bibles/${bibleId}/verses/${verseId}`);
}

/**
 * Search verses
 */
async function searchVerses(bibleId, query, options = {}) {
  const params = new URLSearchParams({
    query,
    ...options
  });
  return await makeApiRequest(`/bibles/${bibleId}/search?${params}`);
}

/**
 * Map our book codes to API.Bible book IDs
 */
const BOOK_ID_MAP = {
  // Old Testament
  GEN: 'GEN', EXO: 'EXO', LEV: 'LEV', NUM: 'NUM', DEU: 'DEU',
  JOS: 'JOS', JDG: 'JDG', RUT: 'RUT', '1SA': '1SA', '2SA': '2SA',
  '1KI': '1KI', '2KI': '2KI', '1CH': '1CH', '2CH': '2CH', EZR: 'EZR',
  NEH: 'NEH', EST: 'EST', JOB: 'JOB', PSA: 'PSA', PRO: 'PRO',
  ECC: 'ECC', SNG: 'SNG', ISA: 'ISA', JER: 'JER', LAM: 'LAM',
  EZK: 'EZK', DAN: 'DAN', HOS: 'HOS', JOL: 'JOL', AMO: 'AMO',
  OBA: 'OBA', JON: 'JON', MIC: 'MIC', NAM: 'NAM', HAB: 'HAB',
  ZEP: 'ZEP', HAG: 'HAG', ZEC: 'ZEC', MAL: 'MAL',
  
  // New Testament
  MAT: 'MAT', MRK: 'MRK', LUK: 'LUK', JHN: 'JHN', ACT: 'ACT',
  ROM: 'ROM', '1CO': '1CO', '2CO': '2CO', GAL: 'GAL', EPH: 'EPH',
  PHP: 'PHP', COL: 'COL', '1TH': '1TH', '2TH': '2TH', '1TI': '1TI',
  '2TI': '2TI', TIT: 'TIT', PHM: 'PHM', HEB: 'HEB', JAS: 'JAS',
  '1PE': '1PE', '2PE': '2PE', '1JN': '1JN', '2JN': '2JN', '3JN': '3JN',
  JUD: 'JUD', REV: 'REV'
};

/**
 * Parse JSON content from API.Bible to extract verses
 */
function parseJsonContent(content) {
  const verses = [];
  
  if (!Array.isArray(content)) {
    return verses;
  }
  
  let currentVerse = null;
  let currentText = '';
  
  function extractText(items) {
    if (!Array.isArray(items)) return '';
    
    let text = '';
    for (const item of items) {
      if (item.type === 'text' && item.text) {
        text += item.text;
      }
      if (item.items) {
        text += extractText(item.items);
      }
    }
    return text;
  }
  
  function processItems(items) {
    if (!Array.isArray(items)) return;
    
    for (const item of items) {
      // Check if this is a verse marker
      if (item.name === 'verse' && item.attrs && item.attrs.number) {
        // Save previous verse if exists
        if (currentVerse !== null && currentText.trim()) {
          verses[currentVerse - 1] = currentText.trim();
        }
        
        // Start new verse
        currentVerse = parseInt(item.attrs.number);
        currentText = '';
      }
      // Collect text
      else if (item.type === 'text' && item.text) {
        // Skip verse numbers themselves
        if (currentVerse !== null && item.text.trim() !== currentVerse.toString()) {
          currentText += item.text;
        }
      }
      // Check for verse text attribute
      else if (item.attrs && item.attrs.verseId && item.text) {
        currentText += item.text;
      }
      
      // Recursively process nested items
      if (item.items) {
        processItems(item.items);
      }
    }
  }
  
  processItems(content);
  
  // Save last verse
  if (currentVerse !== null && currentText.trim()) {
    verses[currentVerse - 1] = currentText.trim();
  }
  
  return verses;
}

/**
 * Fetch chapter content in both Persian and English
 */
async function fetchChapterContent(bookCode, chapterNumber) {
  try {
    const bookId = BOOK_ID_MAP[bookCode];
    if (!bookId) {
      throw new Error(`Unknown book code: ${bookCode}`);
    }

    const chapterId = `${bookId}.${chapterNumber}`;

    // Fetch Persian with JSON content
    let persianVerses = [];
    try {
      const persianData = await getChapterContent(BIBLE_VERSIONS.PERSIAN_CONTEMPORARY, chapterId);
      if (persianData && persianData.content) {
        persianVerses = parseJsonContent(persianData.content);
      }
    } catch (error) {
      console.warn(`Persian verses not available for ${chapterId}:`, error.message);
    }

    // Fetch English (KJV) with JSON content
    let englishVerses = [];
    try {
      const englishData = await getChapterContent(BIBLE_VERSIONS.KJV, chapterId);
      if (englishData && englishData.content) {
        englishVerses = parseJsonContent(englishData.content);
      }
    } catch (error) {
      console.warn(`English verses not available for ${chapterId}:`, error.message);
    }

    // Process and combine verses
    const verses = {
      fa: [],
      en: []
    };

    // Helper to clean text
    const cleanText = (text) => {
      if (!text) return '';
      return text
        .replace(/\s+/g, ' ')     // Normalize whitespace
        .trim();
    };

    // Fill verses arrays
    const maxVerses = Math.max(persianVerses.length, englishVerses.length);
    for (let i = 0; i < maxVerses; i++) {
      verses.fa[i] = persianVerses[i] 
        ? cleanText(persianVerses[i]) 
        : `آیه ${i + 1} (ترجمه فارسی در دسترس نیست)`;
      
      verses.en[i] = englishVerses[i] 
        ? cleanText(englishVerses[i]) 
        : `Verse ${i + 1} (English translation not available)`;
    }

    return verses;

  } catch (error) {
    console.error('Error fetching chapter content:', error);
    throw error;
  }
}

/**
 * Import a chapter into database
 */
async function importChapterToDatabase(pool, bookId, chapterNumber) {
  try {
    // Get book code
    const bookResult = await pool.query(
      'SELECT code FROM bible_books WHERE id = $1',
      [bookId]
    );
    
    if (bookResult.rows.length === 0) {
      throw new Error(`Book not found: ${bookId}`);
    }
    
    const bookCode = bookResult.rows[0].code;
    
    // Fetch content from API
    console.log(`   📥 Fetching ${bookCode} chapter ${chapterNumber}...`);
    const verses = await fetchChapterContent(bookCode, chapterNumber);
    
    // Get chapter ID
    const chapterResult = await pool.query(
      'SELECT id FROM bible_chapters WHERE book_id = $1 AND chapter_number = $2',
      [bookId, chapterNumber]
    );
    
    if (chapterResult.rows.length === 0) {
      throw new Error(`Chapter not found: ${bookCode} ${chapterNumber}`);
    }
    
    const chapterId = chapterResult.rows[0].id;
    
    // Insert verses
    let imported = 0;
    for (let i = 0; i < verses.fa.length; i++) {
      const verseNumber = i + 1;
      const textFa = verses.fa[i];
      const textEn = verses.en[i];
      
      await pool.query(`
        INSERT INTO bible_verses (chapter_id, verse_number, text_fa, text_en)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (chapter_id, verse_number)
        DO UPDATE SET text_fa = EXCLUDED.text_fa, text_en = EXCLUDED.text_en
      `, [chapterId, verseNumber, textFa, textEn]);
      
      imported++;
    }
    
    // Update chapter verses count
    await pool.query(
      'UPDATE bible_chapters SET verses_count = $1 WHERE id = $2',
      [imported, chapterId]
    );
    
    console.log(`   ✅ Imported ${imported} verses`);
    return imported;
    
  } catch (error) {
    console.error(`   ❌ Error importing chapter:`, error.message);
    throw error;
  }
}

/**
 * Import entire book
 */
async function importBook(pool, bookCode) {
  try {
    // Get book info
    const bookResult = await pool.query(
      'SELECT id, name_en, chapters_count FROM bible_books WHERE code = $1',
      [bookCode]
    );
    
    if (bookResult.rows.length === 0) {
      throw new Error(`Book not found: ${bookCode}`);
    }
    
    const book = bookResult.rows[0];
    console.log(`\n📖 Importing ${book.name_en} (${book.chapters_count} chapters)...`);
    
    let totalVerses = 0;
    for (let chapter = 1; chapter <= book.chapters_count; chapter++) {
      const verses = await importChapterToDatabase(pool, book.id, chapter);
      totalVerses += verses;
      
      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`✅ ${book.name_en}: ${totalVerses} verses imported\n`);
    return totalVerses;
    
  } catch (error) {
    console.error(`❌ Error importing book ${bookCode}:`, error);
    throw error;
  }
}

module.exports = {
  BIBLE_VERSIONS,
  getBibles,
  getBooks,
  getChapters,
  getChapterContent,
  getVerses,
  getVerse,
  searchVerses,
  fetchChapterContent,
  importChapterToDatabase,
  importBook
};
