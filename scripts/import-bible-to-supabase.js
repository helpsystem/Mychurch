import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const SUPABASE_URL = 'https://wxzhzsqicgwfxffxayhy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4emh6c3FpY2d3ZnhmZnhheWh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc2MDcyOSwiZXhwIjoyMDc1MzM2NzI5fQ.el6gYYLZJTclBDfWePjSNUalX8Z8jSAAF6h1rnoqAuM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Bible Books Definition
const bibleBooks = [
  // Old Testament
  { key: 'genesis', name: { en: 'Genesis', fa: 'پیدایش' }, chapters: 50, testament: 'old', bookNumber: 1 },
  { key: 'exodus', name: { en: 'Exodus', fa: 'خروج' }, chapters: 40, testament: 'old', bookNumber: 2 },
  { key: 'leviticus', name: { en: 'Leviticus', fa: 'لاویان' }, chapters: 27, testament: 'old', bookNumber: 3 },
  { key: 'numbers', name: { en: 'Numbers', fa: 'اعداد' }, chapters: 36, testament: 'old', bookNumber: 4 },
  { key: 'deuteronomy', name: { en: 'Deuteronomy', fa: 'تثنیه' }, chapters: 34, testament: 'old', bookNumber: 5 },
  { key: 'joshua', name: { en: 'Joshua', fa: 'یوشع' }, chapters: 24, testament: 'old', bookNumber: 6 },
  { key: 'judges', name: { en: 'Judges', fa: 'داوران' }, chapters: 21, testament: 'old', bookNumber: 7 },
  { key: 'ruth', name: { en: 'Ruth', fa: 'روت' }, chapters: 4, testament: 'old', bookNumber: 8 },
  { key: '1samuel', name: { en: '1 Samuel', fa: 'اول سموئیل' }, chapters: 31, testament: 'old', bookNumber: 9 },
  { key: '2samuel', name: { en: '2 Samuel', fa: 'دوم سموئیل' }, chapters: 24, testament: 'old', bookNumber: 10 },
  { key: '1kings', name: { en: '1 Kings', fa: 'اول پادشاهان' }, chapters: 22, testament: 'old', bookNumber: 11 },
  { key: '2kings', name: { en: '2 Kings', fa: 'دوم پادشاهان' }, chapters: 25, testament: 'old', bookNumber: 12 },
  { key: 'psalms', name: { en: 'Psalms', fa: 'مزامیر' }, chapters: 150, testament: 'old', bookNumber: 19 },
  { key: 'proverbs', name: { en: 'Proverbs', fa: 'امثال' }, chapters: 31, testament: 'old', bookNumber: 20 },
  { key: 'isaiah', name: { en: 'Isaiah', fa: 'اشعیا' }, chapters: 66, testament: 'old', bookNumber: 23 },
  
  // New Testament
  { key: 'matthew', name: { en: 'Matthew', fa: 'متی' }, chapters: 28, testament: 'new', bookNumber: 40 },
  { key: 'mark', name: { en: 'Mark', fa: 'مرقس' }, chapters: 16, testament: 'new', bookNumber: 41 },
  { key: 'luke', name: { en: 'Luke', fa: 'لوقا' }, chapters: 24, testament: 'new', bookNumber: 42 },
  { key: 'john', name: { en: 'John', fa: 'یوحنا' }, chapters: 21, testament: 'new', bookNumber: 43 },
  { key: 'acts', name: { en: 'Acts', fa: 'اعمال رسولان' }, chapters: 28, testament: 'new', bookNumber: 44 },
  { key: 'romans', name: { en: 'Romans', fa: 'رومیان' }, chapters: 16, testament: 'new', bookNumber: 45 },
  { key: '1corinthians', name: { en: '1 Corinthians', fa: 'اول قرنتیان' }, chapters: 16, testament: 'new', bookNumber: 46 },
  { key: '2corinthians', name: { en: '2 Corinthians', fa: 'دوم قرنتیان' }, chapters: 13, testament: 'new', bookNumber: 47 },
  { key: 'galatians', name: { en: 'Galatians', fa: 'غلاطیان' }, chapters: 6, testament: 'new', bookNumber: 48 },
  { key: 'ephesians', name: { en: 'Ephesians', fa: 'افسسیان' }, chapters: 6, testament: 'new', bookNumber: 49 },
  { key: 'philippians', name: { en: 'Philippians', fa: 'فیلیپیان' }, chapters: 4, testament: 'new', bookNumber: 50 },
  { key: 'colossians', name: { en: 'Colossians', fa: 'کولسیان' }, chapters: 4, testament: 'new', bookNumber: 51 },
  { key: '1thessalonians', name: { en: '1 Thessalonians', fa: 'اول تسالونیکیان' }, chapters: 5, testament: 'new', bookNumber: 52 },
  { key: '2thessalonians', name: { en: '2 Thessalonians', fa: 'دوم تسالونیکیان' }, chapters: 3, testament: 'new', bookNumber: 53 },
  { key: 'revelation', name: { en: 'Revelation', fa: 'مکاشفه' }, chapters: 22, testament: 'new', bookNumber: 66 },
];

// Sample verses for Genesis 1 (you can expand this)
const sampleVerses = {
  genesis: {
    1: [
      { en: "In the beginning God created the heaven and the earth.", fa: "در ابتدا خدا آسمان‌ها و زمین را آفرید." },
      { en: "And the earth was without form, and void; and darkness was upon the face of the deep.", fa: "و زمین بی‌شکل و خالی بود و تاریکی بر روی ژرفناها بود." },
      { en: "And God said, Let there be light: and there was light.", fa: "و خدا گفت: «نور باشد.» و نور شد." },
      { en: "And God saw the light, that it was good: and God divided the light from the darkness.", fa: "و خدا نور را دید که نیکو است و خدا نور را از تاریکی جدا کرد." },
      { en: "And God called the light Day, and the darkness he called Night.", fa: "و خدا نور را روز نامید و تاریکی را شب نامید." },
    ]
  },
  matthew: {
    1: [
      { en: "The book of the generation of Jesus Christ, the son of David, the son of Abraham.", fa: "کتاب تبار عیسی مسیح، پسر داوود، پسر ابراهیم." },
      { en: "Abraham begat Isaac; and Isaac begat Jacob; and Jacob begat Judas and his brethren.", fa: "ابراهیم، اسحاق را آورد و اسحاق، یعقوب را و یعقوب، یهودا و برادرانش را آورد." },
      { en: "And Judas begat Phares and Zara of Thamar.", fa: "و یهودا از تامار، فارص و زارح را آورد." },
    ]
  },
  john: {
    1: [
      { en: "In the beginning was the Word, and the Word was with God, and the Word was God.", fa: "در ابتدا کلمه بود و کلمه نزد خدا بود و کلمه خدا بود." },
      { en: "The same was in the beginning with God.", fa: "او در ابتدا نزد خدا بود." },
      { en: "All things were made by him; and without him was not any thing made that was made.", fa: "همه‌چیز به‌وسیله او آفریده شد و بدون او هیچ‌چیز از آنچه آفریده شده است، آفریده نشد." },
      { en: "In him was life; and the life was the light of men.", fa: "در او حیات بود و آن حیات، نور انسان‌ها بود." },
      { en: "And the light shineth in darkness; and the darkness comprehended it not.", fa: "و نور در تاریکی می‌تابد و تاریکی آن را درک نکرد." },
    ]
  }
};

async function importBibleData() {
  console.log('🚀 Starting Bible data import to Supabase...\n');

  try {
    // Step 1: Insert Books
    console.log('📚 Inserting Bible books...');
    for (const book of bibleBooks) {
      const { error } = await supabase
        .from('bible_books')
        .upsert({
          book_number: book.bookNumber,
          name_en: book.name.en,
          name_fa: book.name.fa,
          abbreviation: book.key,
          testament: book.testament,
          chapters_count: book.chapters
        }, {
          onConflict: 'abbreviation'
        });

      if (error) {
        console.error(`❌ Error inserting ${book.name.en}:`, error.message);
      } else {
        console.log(`✅ ${book.name.en} (${book.name.fa})`);
      }
    }

    console.log('\n📖 Inserting sample verses...');
    
    // Step 2: Get book IDs first
    const { data: booksData, error: booksError } = await supabase
      .from('bible_books')
      .select('id, abbreviation');
    
    if (booksError) {
      console.error('❌ Error fetching books:', booksError.message);
      return;
    }

    const bookIdMap = {};
    booksData.forEach(book => {
      bookIdMap[book.abbreviation] = book.id;
    });
    
    // Step 3: Insert Verses
    for (const [bookKey, chapters] of Object.entries(sampleVerses)) {
      const bookId = bookIdMap[bookKey];
      if (!bookId) {
        console.error(`❌ Book ${bookKey} not found in database`);
        continue;
      }

      for (const [chapter, verses] of Object.entries(chapters)) {
        for (let i = 0; i < verses.length; i++) {
          const verse = verses[i];
          const { error } = await supabase
            .from('bible_verses')
            .upsert({
              book_id: bookId,
              chapter: parseInt(chapter),
              verse: i + 1,
              text_en: verse.en,
              text_fa: verse.fa
            }, {
              onConflict: 'book_id,chapter,verse'
            });

          if (error) {
            console.error(`❌ Error inserting ${bookKey} ${chapter}:${i + 1}:`, error.message);
          }
        }
        console.log(`✅ ${bookKey} - Chapter ${chapter}: ${verses.length} verses`);
      }
    }

    console.log('\n✅ Bible data import completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Books imported: ${bibleBooks.length}`);
    console.log(`   - Sample chapters imported: ${Object.keys(sampleVerses).length} books`);
    console.log(`   - Total verses: ${Object.values(sampleVerses).reduce((acc, chapters) => acc + Object.values(chapters).reduce((sum, verses) => sum + verses.length, 0), 0)}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the import
importBibleData();
