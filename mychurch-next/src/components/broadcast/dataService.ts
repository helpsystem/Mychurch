/**
 * 🎬 Broadcast Console - Data Service
 * سرویس دسترسی به داده‌های سایت
 * 
 * این سرویس داده‌های سرودها و آیات کتاب مقدس را از API سایت دریافت می‌کند
 */

import { WorshipSong, BibleBook, ScripturePage } from '@/types/broadcast';
import { INITIAL_BIBLE_BOOKS, INITIAL_BIBLE_CONTENT } from '@/lib/bibleData';

/**
 * نرمال‌سازی حروف فارسی برای مقایسه دقیق‌تر
 */
export function normalizeFarsi(str: string): string {
  if (!str) return '';
  return str
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/‌/g, ' ') // replace ZWNJ with space
    .toLowerCase()
    .trim();
}

// =============== WORSHIP SONGS SERVICE ===============

/**
 * دریافت لیست همه سرودها
 */
export async function fetchWorshipSongs(): Promise<WorshipSong[]> {
  try {
    // اول سعی کن از API بگیری
    const response = await fetch('/api/worship-songs');
    if (response.ok) {
      const dbSongs = await response.json();
      
      // Map DB schema to UI Legacy schema
      return dbSongs.map((s: any) => ({
        id: s.id,
        title: { fa: s.title_fa || '', en: s.title_en || '' },
        artist: { fa: s.artist || '', en: s.artist || '' },
        lyrics: { fa: s.lyrics_fa || '', en: s.lyrics_en || '', finglish: s.lyrics_finglish || '' },
        chord: s.chords,
        youtubeId: s.youtube_id,
        audioUrl: s.audio_url,
        hasTiming: !!(s.timing_data || (s.timepoints && Array.isArray(s.timepoints) && s.timepoints.length > 0)),
        timing_data: s.timing_data,
        timepoints: s.timepoints,
        lyrics_finglish: s.lyrics_finglish || '',
        category: s.category
      }));
    }
  } catch (error) {
    console.log('API unavailable, using local JSON');
  }

  // اگر API کار نکرد، از فایل JSON استفاده کن
  try {
    const response = await fetch('/worship/data/worship_songs.json');
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch worship songs:', error);
  }

  return [];
}

/**
 * جستجوی سرود با عنوان
 */
export function searchSongs(songs: WorshipSong[], query: string): WorshipSong[] {
  if (!query.trim()) return songs.slice(0, 20); // نمایش 20 تای اول

  const q = normalizeFarsi(query);
  return songs.filter(song =>
    normalizeFarsi(song.title?.fa || '').includes(q) ||
    song.title?.en?.toLowerCase().includes(q) ||
    (typeof song.artist === 'string' 
      ? (song.artist as string).toLowerCase().includes(q) 
      : normalizeFarsi(song.artist?.fa || '').includes(q))
  ).slice(0, 20);
}

/**
 * دریافت سرود با ID
 */
export function getSongById(songs: WorshipSong[], id: number): WorshipSong | undefined {
  return songs.find(s => s.id === id);
}

/**
 * تبدیل متن lyrics به خطوط با تشخیص بند و کروس
 */
export function parseLyrics(lyricsText: string): { text: string; isChorus: boolean; isVerse: boolean }[] {
  const lines = lyricsText.split('\n');
  const result: { text: string; isChorus: boolean; isVerse: boolean }[] = [];

  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // تشخیص نوع بخش
    if (/^(V\d+|Verse|بند)/i.test(trimmed)) {
      currentSection = 'verse';
      continue;
    }
    if (/^(Chorus|Bridge|ریفرین|کروس|پل)/i.test(trimmed)) {
      currentSection = 'chorus';
      continue;
    }
    if (/^\[column\]$/i.test(trimmed)) {
      continue; // نادیده بگیر
    }

    result.push({
      text: trimmed,
      isChorus: currentSection === 'chorus',
      isVerse: currentSection === 'verse' || currentSection === ''
    });
  }

  return result;
}

// =============== BIBLE SERVICE ===============

// Map USFM codes (from SQLite) back to the key format used in the app
const USFM_TO_KEY: Record<string, string> = {
  GEN:"Genesis",EXO:"Exodus",LEV:"Leviticus",NUM:"Numbers",DEU:"Deuteronomy",
  JOS:"Joshua",JDG:"Judges",RUT:"Ruth","1SA":"1Samuel","2SA":"2Samuel",
  "1KI":"1Kings","2KI":"2Kings","1CH":"1Chronicles","2CH":"2Chronicles",
  EZR:"Ezra",NEH:"Nehemiah",EST:"Esther",JOB:"Job",PSA:"Psalms",
  PRO:"Proverbs",ECC:"Ecclesiastes",SNG:"SongOfSongs",ISA:"Isaiah",
  JER:"Jeremiah",LAM:"Lamentations",EZK:"Ezekiel",DAN:"Daniel",
  HOS:"Hosea",JOL:"Joel",AMO:"Amos",OBA:"Obadiah",JON:"Jonah",
  MIC:"Micah",NAM:"Nahum",HAB:"Habakkuk",ZEP:"Zephaniah",HAG:"Haggai",
  ZEC:"Zechariah",MAL:"Malachi",MAT:"Matthew",MRK:"Mark",LUK:"Luke",
  JHN:"John",ACT:"Acts",ROM:"Romans","1CO":"1Corinthians","2CO":"2Corinthians",
  GAL:"Galatians",EPH:"Ephesians",PHP:"Philippians",COL:"Colossians",
  "1TH":"1Thessalonians","2TH":"2Thessalonians","1TI":"1Timothy","2TI":"2Timothy",
  TIT:"Titus",PHM:"Philemon",HEB:"Hebrews",JAS:"James","1PE":"1Peter",
  "2PE":"2Peter","1JN":"1John","2JN":"2John","3JN":"3John",JUD:"Jude",REV:"Revelation",
};

function alignVerseRange(verses: string[], startVerse: number, endVerse: number) {
  const aligned = Array.from({ length: Math.max(endVerse - startVerse + 1, 0) }, (_, index) => {
    const verseNum = startVerse + index;
    const value = verses[verseNum - 1] ?? '';
    return {
      verseNum,
      value,
      missing: !String(value || '').trim(),
    };
  });

  return {
    values: aligned.map((item) => item.value),
    missingVerseNumbers: aligned.filter((item) => item.missing).map((item) => item.verseNum),
  };
}

// In-memory cache for live Bible books (refreshed every 24h)
let _bibleBookCache: Record<string, { data: BibleBook[], expiry: number }> = {};

/**
 * دریافت لیست کتاب‌های کتاب مقدس از همان API که صفحه Bible استفاده می‌کند
 * با fallback به INITIAL_BIBLE_BOOKS اگر API در دسترس نباشد
 */
export async function fetchBibleBooksFromDB(version: string = 'BSB'): Promise<BibleBook[]> {
  // Return cache if still fresh
  const cacheHit = _bibleBookCache[version];
  if (cacheHit && Date.now() < cacheHit.expiry) {
    return cacheHit.data;
  }

  try {
    const res = await fetch(`/api/bible/books?version=${version}&t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.books && Array.isArray(data.books)) {
        const mapped: BibleBook[] = data.books.map((b: {
          book_id: string;
          book_name_en: string;
          book_name_fa: string;
          chapter_count: number;
          testament: string;
        }) => ({
          key: USFM_TO_KEY[b.book_id] || b.book_id,
          name: { en: b.book_name_en, fa: b.book_name_fa },
          chapters: b.chapter_count,
        }));
        _bibleBookCache[version] = { data: mapped, expiry: Date.now() + 24 * 3600 * 1000 };
        return mapped;
      }
    }
  } catch (e) {
    console.warn(`[dataService] Bible books API unavailable for ${version}, using fallback`);
  }

  // Fallback to hardcoded list
  return INITIAL_BIBLE_BOOKS;
}

/**
 * دریافت لیست کتاب‌های کتاب مقدس — sync version با fallback (برای backward compat)
 */
export function getBibleBooks(version: string = 'BSB'): BibleBook[] {
  // Return cached live data if available, otherwise hardcoded fallback
  return _bibleBookCache[version]?.data || INITIAL_BIBLE_BOOKS;
}

/**
 * جستجوی کتاب با نام
 */
export function searchBibleBooks(query: string): BibleBook[] {
  // Use BSB cache if available, otherwise fall back to hardcoded list
  const books: BibleBook[] = _bibleBookCache['BSB']?.data || INITIAL_BIBLE_BOOKS;
  if (!query.trim()) return books;

  const q = normalizeFarsi(query);
  return books.filter((book: BibleBook) =>
    book.key.toLowerCase().includes(q) ||
    book.name.en.toLowerCase().includes(q) ||
    normalizeFarsi(book.name.fa || '').includes(q)
  );
}

/**
 * دریافت آیه از کتاب مقدس
 * @param bookKey کلید کتاب مثل "John"
 * @param chapter شماره باب
 * @param verses محدوده آیات مثل "16" یا "1-3"
 * @param translation ترجمه: mojdeh, qadim, nvd, etc.
 */
export async function fetchBibleVerse(
  bookKey: string,
  chapter: number,
  verses: string,
  translation: string = 'bilingual'
): Promise<ScripturePage | null> {
  try {
    // استفاده از API endpoint صحیح برای داده‌های دوزبانه
    const response = await fetch(`/api/bible/content/${bookKey}/${chapter}`);
    if (response.ok) {
      const data = await response.json();

      if (data.success && data.verses) {
        const book = INITIAL_BIBLE_BOOKS.find(b => b.key === bookKey);

        // Parse verse range
        const [startVerse, endVerse] = verses.includes('-')
          ? verses.split('-').map(Number)
          : [parseInt(verses), parseInt(verses)];

        const faAligned = alignVerseRange(data.verses.fa || [], startVerse, endVerse);
        const enAligned = alignVerseRange(data.verses.en || [], startVerse, endVerse);

        // Create verse numbers array
        const verseNumbers = Array.from(
          { length: endVerse - startVerse + 1 },
          (_, i) => startVerse + i
        );

        return {
          id: crypto.randomUUID(),
          book: bookKey,
          bookName: book?.name || { fa: bookKey, en: bookKey },
          chapter,
          verses,
          verseNumbers,
          textPrimary: faAligned.values,
          textSecondary: enAligned.values,
          missingPrimaryVerses: faAligned.missingVerseNumbers,
          missingSecondaryVerses: enAligned.missingVerseNumbers,
          translation
        };
      }
    }
  } catch (error) {
    console.log('API unavailable, using local data');
  }

  // استفاده از داده‌های لوکال
  const localContent = INITIAL_BIBLE_CONTENT[bookKey]?.[chapter.toString()];
  if (localContent) {
    const book = INITIAL_BIBLE_BOOKS.find(b => b.key === bookKey);
    const [startVerse, endVerse] = verses.includes('-')
      ? verses.split('-').map(Number)
      : [parseInt(verses), parseInt(verses)];

    const faAligned = alignVerseRange(localContent.fa || [], startVerse, endVerse);
    const enAligned = alignVerseRange(localContent.en || [], startVerse, endVerse);
    
    // Create verse numbers array
    const verseNumbers = Array.from(
      { length: endVerse - startVerse + 1 },
      (_, i) => startVerse + i
    );

    return {
      id: crypto.randomUUID(),
      book: bookKey,
      bookName: book?.name || { fa: bookKey, en: bookKey },
      chapter,
      verses,
      verseNumbers,
      textPrimary: faAligned.values,
      textSecondary: enAligned.values,
      missingPrimaryVerses: faAligned.missingVerseNumbers,
      missingSecondaryVerses: enAligned.missingVerseNumbers,
      translation: 'local'
    };
  }

  return null;
}

/**
 * جستجوی آیه با متن آزاد (مثل "یوحنا 3:16")
 */
export async function searchScripture(query: string): Promise<ScripturePage | null> {
  // الگوی تشخیص: "کتاب باب:آیه" یا "Book chapter:verse"
  const patterns = [
    // فارسی: "یوحنا ۳:۱۶" یا "یوحنا 3:16"
    /^(.+?)\s*(\d+)[:\u060C](\d+(?:-\d+)?)/,
    // انگلیسی: "John 3:16" یا "John 3:16-17"
    /^(\d?\s*\w+)\s+(\d+):(\d+(?:-\d+)?)/i
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) {
      const [, bookSearch, chapter, verses] = match;

      // پیدا کردن کتاب
      const book = findBibleBook(bookSearch.trim());
      if (book) {
        return await fetchBibleVerse(book.key, parseInt(chapter), verses);
      }
    }
  }

  return null;
}

/**
 * پیدا کردن کتاب با نام فارسی یا انگلیسی
 */
function findBibleBook(search: string): BibleBook | undefined {
  const s = normalizeFarsi(search);

  // نقشه نام‌های فارسی به کلید انگلیسی
  const persianNames: Record<string, string> = {
    'یوحنا': 'john',
    'متی': 'matthew',
    'مرقس': 'mark',
    'لوقا': 'luke',
    'اعمال': 'acts',
    'رومیان': 'romans',
    'مزامیر': 'psalms',
    'مزمور': 'psalms',
    'تکوین': 'genesis',
    'خروج': 'exodus',
    'پیدایش': 'genesis',
    'اشعیا': 'isaiah',
    'ارمیا': 'jeremiah',
    'امثال': 'proverbs',
    'جامعه': 'ecclesiastes',
    'مکاشفه': 'revelation',
    'افسسیان': 'ephesians',
    'فیلیپیان': 'philippians',
    'کولسیان': 'colossians',
    'عبرانیان': 'hebrews',
    'یعقوب': 'james'
  };

  // اول چک کن نام فارسی هست
  if (persianNames[s]) {
    return INITIAL_BIBLE_BOOKS.find(b => b.key.toLowerCase() === persianNames[s]);
  }

  // بعد جستجو در لیست کتاب‌ها
  return INITIAL_BIBLE_BOOKS.find(book =>
    book.key.toLowerCase() === s ||
    book.name.en.toLowerCase() === s ||
    normalizeFarsi(book.name.fa || '') === s
  );
}

// =============== TRANSLATIONS DICTIONARY ===============

export const BROADCAST_TRANSLATIONS = {
  en: {
    // General
    live: 'LIVE',
    synced: 'Devices Synced',
    startRec: 'Start REC',
    stopRec: 'Stop REC',
    settings: 'Settings',
    cancel: 'Cancel',
    add: 'Add',
    remove: 'Remove',
    save: 'Save',
    preview: 'Preview',
    close: 'Close',

    // Builder
    smartBuilder: 'Smart Builder',
    aiAssistant: 'AI Assistant',
    aiPlaceholder: "e.g., Sermon outline on 'Hope'...",
    generate: 'Generate Slide',
    thinking: 'Thinking...',
    addScripture: 'Scripture',
    addLyrics: 'Worship Song',
    addMedia: 'Media',
    addAnnouncement: 'Announcement',
    noSlides: 'No slides yet. Add one above.',

    // Scripture
    book: 'Book',
    chapter: 'Chapter',
    verse: 'Verses',
    translation: 'Translation',
    searchScripture: 'Search (e.g. John 3:16)',
    fetch: 'Fetch',
    fetching: 'Fetching...',

    // Lyrics
    songTitle: 'Song Title',
    selectSong: 'Select from Library',
    searchSongs: 'Search songs...',
    lyricsLabel: 'Lyrics',
    chordsLabel: 'Chords (Leaders Only)',
    audioLabel: 'Audio Track',

    // Media
    mediaType: 'Media Type',
    image: 'Image',
    video: 'Video',
    audio: 'Audio',
    uploadFile: 'Upload File',
    fileUrl: 'File URL',
    loop: 'Loop',
    autoplay: 'Auto Play',

    // Console
    presenterNotes: 'Presenter Notes',
    noNotes: 'No notes for this slide.',
    prev: 'Previous',
    next: 'Next',

    // Broadcast Settings
    layout: 'Broadcast Layout',
    fullCam: 'Full Camera',
    pip: 'Picture in Picture',
    split: 'Split Screen',
    slidesOnly: 'Slides Only',
    uploadLogo: 'Upload Logo',
    showLogo: 'Show Logo',

    // Lower Thirds
    infoOverlay: 'Lower Thirds',
    addItem: 'Add New Item',
    title: 'Title',
    subtitle: 'Subtitle',
    autoTranslate: 'Auto Translate',
    rotation: 'Auto Rotation',
    interval: 'Interval (sec)',
    size: 'Size',

    // Prayer Wall
    prayerWall: 'Prayer Wall',
    showPrayerWall: 'Show Prayer Ticker',
    addRequest: 'Add Request',
    requestNamePlaceholder: 'Name',
    requestContentPlaceholder: 'Prayer request...',

    // Donations
    donations: 'Donations & QR',
    donationTitle: 'Title',
    donationDesc: 'Description',
    donationUrl: 'Payment URL',
    donationDuration: 'Display Time (sec)',
    addDonation: 'Add QR Code',
    show: 'Show',
    showing: 'Showing...'
  },
  fa: {
    // General
    live: 'زنده',
    synced: 'دستگاه متصل',
    startRec: 'شروع ضبط',
    stopRec: 'توقف ضبط',
    settings: 'تنظیمات',
    cancel: 'لغو',
    add: 'افزودن',
    remove: 'حذف',
    save: 'ذخیره',
    preview: 'پیش‌نمایش',
    close: 'بستن',

    // Builder
    smartBuilder: '🎬 اسلایدساز هوشمند',
    aiAssistant: 'دستیار هوش مصنوعی',
    aiPlaceholder: 'مثال: طرح خطبه درباره «امید»...',
    generate: 'تولید اسلاید',
    thinking: 'در حال فکر...',
    addScripture: '📖 آیه کتاب مقدس',
    addLyrics: '🎵 سرود پرستشی',
    addMedia: '🖼️ رسانه',
    addAnnouncement: '📢 اعلان',
    noSlides: 'هنوز اسلایدی نیست. از بالا اضافه کنید.',

    // Scripture
    book: 'کتاب',
    chapter: 'باب',
    verse: 'آیات',
    translation: 'ترجمه',
    searchScripture: 'جستجو (مثلا یوحنا ۳:۱۶)',
    fetch: 'دریافت',
    fetching: 'در حال دریافت...',

    // Lyrics
    songTitle: 'عنوان سرود',
    selectSong: 'انتخاب از کتابخانه',
    searchSongs: 'جستجوی سرود...',
    lyricsLabel: 'متن سرود',
    chordsLabel: 'آکوردها (فقط رهبران)',
    audioLabel: 'فایل صوتی',

    // Media
    mediaType: 'نوع رسانه',
    image: 'تصویر',
    video: 'ویدیو',
    audio: 'صدا',
    uploadFile: 'آپلود فایل',
    fileUrl: 'لینک فایل',
    loop: 'تکرار',
    autoplay: 'پخش خودکار',

    // Console
    presenterNotes: 'یادداشت‌های ارائه‌دهنده',
    noNotes: 'یادداشتی وجود ندارد.',
    prev: 'قبلی',
    next: 'بعدی',

    // Broadcast Settings
    layout: 'چیدمان پخش',
    fullCam: 'تمام صفحه',
    pip: 'تصویر در تصویر',
    split: 'دو بخشی',
    slidesOnly: 'فقط اسلاید',
    uploadLogo: 'بارگذاری لوگو',
    showLogo: 'نمایش لوگو',

    // Lower Thirds
    infoOverlay: 'زیرنویس اطلاعات',
    addItem: 'افزودن مورد جدید',
    title: 'عنوان',
    subtitle: 'زیرعنوان',
    autoTranslate: 'ترجمه خودکار',
    rotation: 'چرخش خودکار',
    interval: 'فاصله زمانی (ثانیه)',
    size: 'اندازه',

    // Prayer Wall
    prayerWall: 'دیوار دعا',
    showPrayerWall: 'نمایش لیست دعا',
    addRequest: 'ثبت درخواست',
    requestNamePlaceholder: 'نام',
    requestContentPlaceholder: 'متن درخواست دعا...',

    // Donations
    donations: 'هدایا و بارکد',
    donationTitle: 'عنوان',
    donationDesc: 'توضیحات',
    donationUrl: 'لینک پرداخت',
    donationDuration: 'زمان نمایش (ثانیه)',
    addDonation: 'افزودن بارکد',
    show: 'نمایش',
    showing: 'در حال نمایش...'
  }
};
