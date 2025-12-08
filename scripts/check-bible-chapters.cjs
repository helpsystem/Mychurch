const db = require('../backend/db-postgres');

async function checkChapters() {
  try {
    // تعداد کل فصل‌های موجود
    const result = await db.query(`
      SELECT book_key, COUNT(DISTINCT chapter_number) as chapters
      FROM bible_verses
      GROUP BY book_key
      ORDER BY book_key
    `);
    
    console.log('\n📊 Bible Chapters in Database:\n');
    
    let totalChapters = 0;
    result.rows.forEach(row => {
      console.log(`  ${row.book_key}: ${row.chapters} chapters`);
      totalChapters += parseInt(row.chapters);
    });
    
    console.log(`\n✅ Total: ${result.rowCount} books, ${totalChapters} chapters`);
    
    // چک کنیم کدوم کتاب‌ها ناقص هستن
    const expectedChapters = {
      'GEN': 50, 'EXO': 40, 'LEV': 27, 'NUM': 36, 'DEU': 34,
      'JOS': 24, 'JDG': 21, 'RUT': 4, '1SA': 31, '2SA': 24,
      '1KI': 22, '2KI': 25, '1CH': 29, '2CH': 36, 'EZR': 10,
      'NEH': 13, 'EST': 10, 'JOB': 42, 'PSA': 150, 'PRO': 31,
      'ECC': 12, 'SNG': 8, 'ISA': 66, 'JER': 52, 'LAM': 5,
      'EZK': 48, 'DAN': 12, 'HOS': 14, 'JOL': 3, 'AMO': 9,
      'OBA': 1, 'JON': 4, 'MIC': 7, 'NAM': 3, 'HAB': 3,
      'ZEP': 3, 'HAG': 2, 'ZEC': 14, 'MAL': 4,
      'MAT': 28, 'MRK': 16, 'LUK': 24, 'JHN': 21, 'ACT': 28,
      'ROM': 16, '1CO': 16, '2CO': 13, 'GAL': 6, 'EPH': 6,
      'PHP': 4, 'COL': 4, '1TH': 5, '2TH': 3, '1TI': 6,
      '2TI': 4, 'TIT': 3, 'PHM': 1, 'HEB': 13, 'JAS': 5,
      '1PE': 5, '2PE': 3, '1JN': 5, '2JN': 1, '3JN': 1,
      'JUD': 1, 'REV': 22
    };
    
    console.log('\n⚠️  Missing Chapters:\n');
    
    let totalMissing = 0;
    for (const [book, expected] of Object.entries(expectedChapters)) {
      const found = result.rows.find(r => r.book_key === book);
      const actual = found ? parseInt(found.chapters) : 0;
      
      if (actual < expected) {
        console.log(`  ${book}: ${actual}/${expected} (missing ${expected - actual})`);
        totalMissing += (expected - actual);
      } else if (actual === 0) {
        console.log(`  ${book}: ❌ Not in database`);
      }
    }
    
    console.log(`\n📉 Total Missing: ${totalMissing} chapters\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkChapters();
