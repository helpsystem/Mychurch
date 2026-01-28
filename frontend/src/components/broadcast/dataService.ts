/**
 * 🎬 Broadcast Console - Data Service
 * سرویس دسترسی به داده‌های سایت
 * 
 * این سرویس داده‌های سرودها و آیات کتاب مقدس را از API سایت دریافت می‌کند
 */

import { WorshipSong, BibleBook, ScripturePage } from './types';
import { INITIAL_BIBLE_BOOKS, INITIAL_BIBLE_CONTENT } from '../../lib/bibleData';

// =============== WORSHIP SONGS SERVICE ===============

/**
 * دریافت لیست همه سرودها
 */
export async function fetchWorshipSongs(): Promise<WorshipSong[]> {
  try {
    // اول سعی کن از API بگیری
    const response = await fetch('/api/worship-songs');
    if (response.ok) {
      return await response.json();
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
  
  const q = query.toLowerCase();
  return songs.filter(song => 
    song.title.fa.toLowerCase().includes(q) ||
    song.title.en?.toLowerCase().includes(q) ||
    song.artist?.toLowerCase().includes(q)
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

/**
 * دریافت لیست کتاب‌های کتاب مقدس
 */
export function getBibleBooks(): BibleBook[] {
  return INITIAL_BIBLE_BOOKS;
}

/**
 * جستجوی کتاب با نام
 */
export function searchBibleBooks(query: string): BibleBook[] {
  if (!query.trim()) return INITIAL_BIBLE_BOOKS;
  
  const q = query.toLowerCase();
  return INITIAL_BIBLE_BOOKS.filter(book =>
    book.key.toLowerCase().includes(q) ||
    book.name.en.toLowerCase().includes(q) ||
    book.name.fa.includes(q)
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
  translation: string = 'mojdeh'
): Promise<ScripturePage | null> {
  try {
    // اول سعی کن از API بگیری
    const response = await fetch(`/api/bible/${bookKey}/${chapter}?translation=${translation}`);
    if (response.ok) {
      const data = await response.json();
      const book = INITIAL_BIBLE_BOOKS.find(b => b.key === bookKey);
      
      // Parse verse range
      const [startVerse, endVerse] = verses.includes('-') 
        ? verses.split('-').map(Number)
        : [parseInt(verses), parseInt(verses)];
      
      // Extract verses
      const verseTexts = data.verses
        ?.filter((_: any, i: number) => i + 1 >= startVerse && i + 1 <= endVerse)
        ?.map((v: any) => v.text)
        ?.join(' ') || '';
      
      return {
        id: crypto.randomUUID(),
        book: bookKey,
        bookName: book?.name || { fa: bookKey, en: bookKey },
        chapter,
        verses,
        textPrimary: verseTexts,
        textSecondary: '',
        translation
      };
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
    
    const faVerses = localContent.fa
      ?.slice(startVerse - 1, endVerse)
      ?.join(' ') || '';
    const enVerses = localContent.en
      ?.slice(startVerse - 1, endVerse)
      ?.join(' ') || '';
    
    return {
      id: crypto.randomUUID(),
      book: bookKey,
      bookName: book?.name || { fa: bookKey, en: bookKey },
      chapter,
      verses,
      textPrimary: faVerses,
      textSecondary: enVerses,
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
  const s = search.toLowerCase();
  
  // نقشه نام‌های فارسی به کلید انگلیسی
  const persianNames: Record<string, string> = {
    'یوحنا': 'John',
    'متی': 'Matthew',
    'مرقس': 'Mark',
    'لوقا': 'Luke',
    'اعمال': 'Acts',
    'رومیان': 'Romans',
    'مزامیر': 'Psalms',
    'مزمور': 'Psalms',
    'تکوین': 'Genesis',
    'خروج': 'Exodus',
    'پیدایش': 'Genesis',
    'اشعیا': 'Isaiah',
    'ارمیا': 'Jeremiah',
    'امثال': 'Proverbs',
    'جامعه': 'Ecclesiastes',
    'مکاشفه': 'Revelation',
    'افسسیان': 'Ephesians',
    'فیلیپیان': 'Philippians',
    'کولسیان': 'Colossians',
    'عبرانیان': 'Hebrews',
    'یعقوب': 'James'
  };
  
  // اول چک کن نام فارسی هست
  if (persianNames[search]) {
    return INITIAL_BIBLE_BOOKS.find(b => b.key === persianNames[search]);
  }
  
  // بعد جستجو در لیست کتاب‌ها
  return INITIAL_BIBLE_BOOKS.find(book =>
    book.key.toLowerCase() === s ||
    book.name.en.toLowerCase() === s ||
    book.name.fa === search
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
