/**
 * 📖 Bible Books Data - Local Fallback
 * 66 کتاب کتاب مقدس (عهد عتیق + عهد جدید)
 */

export interface BibleBook {
    code: string;
    name_en: string;
    name_fa: string;
    chapters: number;
    testament: 'OT' | 'NT';
}

export const BIBLE_BOOKS: BibleBook[] = [
    { code: '01', name_en: 'Genesis', name_fa: 'پیدایش', chapters: 50, testament: 'OT' },
    { code: '02', name_en: 'Exodus', name_fa: 'خروج', chapters: 40, testament: 'OT' },
    { code: '03', name_en: 'Leviticus', name_fa: 'لاویان', chapters: 27, testament: 'OT' },
    { code: '04', name_en: 'Numbers', name_fa: 'اعداد', chapters: 36, testament: 'OT' },
    { code: '05', name_en: 'Deuteronomy', name_fa: 'تثنیه', chapters: 34, testament: 'OT' },
    { code: '06', name_en: 'Joshua', name_fa: 'یوشع', chapters: 24, testament: 'OT' },
    { code: '07', name_en: 'Judges', name_fa: 'داوران', chapters: 21, testament: 'OT' },
    { code: '08', name_en: 'Ruth', name_fa: 'روت', chapters: 4, testament: 'OT' },
    { code: '09', name_en: '1 Samuel', name_fa: 'اول سموئیل', chapters: 31, testament: 'OT' },
    { code: '10', name_en: '2 Samuel', name_fa: 'دوم سموئیل', chapters: 24, testament: 'OT' },
    { code: '11', name_en: '1 Kings', name_fa: 'اول پادشاهان', chapters: 22, testament: 'OT' },
    { code: '12', name_en: '2 Kings', name_fa: 'دوم پادشاهان', chapters: 25, testament: 'OT' },
    { code: '13', name_en: '1 Chronicles', name_fa: 'اول تواریخ', chapters: 29, testament: 'OT' },
    { code: '14', name_en: '2 Chronicles', name_fa: 'دوم تواریخ', chapters: 36, testament: 'OT' },
    { code: '15', name_en: 'Ezra', name_fa: 'عزرا', chapters: 10, testament: 'OT' },
    { code: '16', name_en: 'Nehemiah', name_fa: 'نحمیا', chapters: 13, testament: 'OT' },
    { code: '17', name_en: 'Esther', name_fa: 'استر', chapters: 10, testament: 'OT' },
    { code: '18', name_en: 'Job', name_fa: 'ایوب', chapters: 42, testament: 'OT' },
    { code: '19', name_en: 'Psalms', name_fa: 'مزامیر', chapters: 150, testament: 'OT' },
    { code: '20', name_en: 'Proverbs', name_fa: 'امثال', chapters: 31, testament: 'OT' },
    { code: '21', name_en: 'Ecclesiastes', name_fa: 'جامعه', chapters: 12, testament: 'OT' },
    { code: '22', name_en: 'Song of Solomon', name_fa: 'غزل غزلها', chapters: 8, testament: 'OT' },
    { code: '23', name_en: 'Isaiah', name_fa: 'اشعیا', chapters: 66, testament: 'OT' },
    { code: '24', name_en: 'Jeremiah', name_fa: 'ارمیا', chapters: 52, testament: 'OT' },
    { code: '25', name_en: 'Lamentations', name_fa: 'مراثی ارمیا', chapters: 5, testament: 'OT' },
    { code: '26', name_en: 'Ezekiel', name_fa: 'حزقیال', chapters: 48, testament: 'OT' },
    { code: '27', name_en: 'Daniel', name_fa: 'دانیال', chapters: 12, testament: 'OT' },
    { code: '28', name_en: 'Hosea', name_fa: 'هوشع', chapters: 14, testament: 'OT' },
    { code: '29', name_en: 'Joel', name_fa: 'یوئیل', chapters: 3, testament: 'OT' },
    { code: '30', name_en: 'Amos', name_fa: 'عاموس', chapters: 9, testament: 'OT' },
    { code: '31', name_en: 'Obadiah', name_fa: 'عوبدیا', chapters: 1, testament: 'OT' },
    { code: '32', name_en: 'Jonah', name_fa: 'یونس', chapters: 4, testament: 'OT' },
    { code: '33', name_en: 'Micah', name_fa: 'میکاه', chapters: 7, testament: 'OT' },
    { code: '34', name_en: 'Nahum', name_fa: 'ناحوم', chapters: 3, testament: 'OT' },
    { code: '35', name_en: 'Habakkuk', name_fa: 'حبقوق', chapters: 3, testament: 'OT' },
    { code: '36', name_en: 'Zephaniah', name_fa: 'صفنیا', chapters: 3, testament: 'OT' },
    { code: '37', name_en: 'Haggai', name_fa: 'حجی', chapters: 2, testament: 'OT' },
    { code: '38', name_en: 'Zechariah', name_fa: 'زکریا', chapters: 14, testament: 'OT' },
    { code: '39', name_en: 'Malachi', name_fa: 'ملاکی', chapters: 4, testament: 'OT' },
    { code: '40', name_en: 'Matthew', name_fa: 'متی', chapters: 28, testament: 'NT' },
    { code: '41', name_en: 'Mark', name_fa: 'مرقس', chapters: 16, testament: 'NT' },
    { code: '42', name_en: 'Luke', name_fa: 'لوقا', chapters: 24, testament: 'NT' },
    { code: '43', name_en: 'John', name_fa: 'یوحنا', chapters: 21, testament: 'NT' },
    { code: '44', name_en: 'Acts', name_fa: 'اعمال رسولان', chapters: 28, testament: 'NT' },
    { code: '45', name_en: 'Romans', name_fa: 'رومیان', chapters: 16, testament: 'NT' },
    { code: '46', name_en: '1 Corinthians', name_fa: 'اول قرنتیان', chapters: 16, testament: 'NT' },
    { code: '47', name_en: '2 Corinthians', name_fa: 'دوم قرنتیان', chapters: 13, testament: 'NT' },
    { code: '48', name_en: 'Galatians', name_fa: 'غلاطیان', chapters: 6, testament: 'NT' },
    { code: '49', name_en: 'Ephesians', name_fa: 'افسسیان', chapters: 6, testament: 'NT' },
    { code: '50', name_en: 'Philippians', name_fa: 'فیلیپیان', chapters: 4, testament: 'NT' },
    { code: '51', name_en: 'Colossians', name_fa: 'کولسیان', chapters: 4, testament: 'NT' },
    { code: '52', name_en: '1 Thessalonians', name_fa: 'اول تسالونیکیان', chapters: 5, testament: 'NT' },
    { code: '53', name_en: '2 Thessalonians', name_fa: 'دوم تسالونیکیان', chapters: 3, testament: 'NT' },
    { code: '54', name_en: '1 Timothy', name_fa: 'اول تیموتائوس', chapters: 6, testament: 'NT' },
    { code: '55', name_en: '2 Timothy', name_fa: 'دوم تیموتائوس', chapters: 4, testament: 'NT' },
    { code: '56', name_en: 'Titus', name_fa: 'تیتوس', chapters: 3, testament: 'NT' },
    { code: '57', name_en: 'Philemon', name_fa: 'فلیمون', chapters: 1, testament: 'NT' },
    { code: '58', name_en: 'Hebrews', name_fa: 'عبرانیان', chapters: 13, testament: 'NT' },
    { code: '59', name_en: 'James', name_fa: 'یعقوب', chapters: 5, testament: 'NT' },
    { code: '60', name_en: '1 Peter', name_fa: 'اول پطرس', chapters: 5, testament: 'NT' },
    { code: '61', name_en: '2 Peter', name_fa: 'دوم پطرس', chapters: 3, testament: 'NT' },
    { code: '62', name_en: '1 John', name_fa: 'اول یوحنا', chapters: 5, testament: 'NT' },
    { code: '63', name_en: '2 John', name_fa: 'دوم یوحنا', chapters: 1, testament: 'NT' },
    { code: '64', name_en: '3 John', name_fa: 'سوم یوحنا', chapters: 1, testament: 'NT' },
    { code: '65', name_en: 'Jude', name_fa: 'یهودا', chapters: 1, testament: 'NT' },
    { code: '66', name_en: 'Revelation', name_fa: 'مکاشفه', chapters: 22, testament: 'NT' }
];

/**
 * Get all Bible books
 */
export function getBibleBooks(): BibleBook[] {
    return BIBLE_BOOKS;
}

/**
 * Get a specific book by code
 */
export function getBibleBook(code: string): BibleBook | undefined {
    return BIBLE_BOOKS.find(b => b.code === code);
}

/**
 * Search books by name (English or Persian)
 */
export function searchBibleBooks(query: string): BibleBook[] {
    const q = query.toLowerCase().trim();
    if (!q) return BIBLE_BOOKS;

    return BIBLE_BOOKS.filter(book =>
        book.name_en.toLowerCase().includes(q) ||
        book.name_fa.includes(q)
    );
}
