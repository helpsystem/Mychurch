// mychurch-next/src/lib/bibleUsfm.ts

export interface BookInfo {
  usfm: string;
  nameEn: string;
  nameFa: string;
  chapters: number;
  order: number;
  testament: 'OT' | 'NT';
}

export const CANONICAL_BOOKS: BookInfo[] = [
  // Old Testament (1-39)
  { usfm: 'GEN', nameEn: 'Genesis', nameFa: 'پیدایش', chapters: 50, order: 1, testament: 'OT' },
  { usfm: 'EXO', nameEn: 'Exodus', nameFa: 'خروج', chapters: 40, order: 2, testament: 'OT' },
  { usfm: 'LEV', nameEn: 'Leviticus', nameFa: 'لاویان', chapters: 27, order: 3, testament: 'OT' },
  { usfm: 'NUM', nameEn: 'Numbers', nameFa: 'اعداد', chapters: 36, order: 4, testament: 'OT' },
  { usfm: 'DEU', nameEn: 'Deuteronomy', nameFa: 'تثنیه', chapters: 34, order: 5, testament: 'OT' },
  { usfm: 'JOS', nameEn: 'Joshua', nameFa: 'یوشع', chapters: 24, order: 6, testament: 'OT' },
  { usfm: 'JDG', nameEn: 'Judges', nameFa: 'داوران', chapters: 21, order: 7, testament: 'OT' },
  { usfm: 'RUT', nameEn: 'Ruth', nameFa: 'روت', chapters: 4, order: 8, testament: 'OT' },
  { usfm: '1SA', nameEn: '1 Samuel', nameFa: 'اول سموئیل', chapters: 31, order: 9, testament: 'OT' },
  { usfm: '2SA', nameEn: '2 Samuel', nameFa: 'دوم سموئیل', chapters: 24, order: 10, testament: 'OT' },
  { usfm: '1KI', nameEn: '1 Kings', nameFa: 'اول پادشاهان', chapters: 22, order: 11, testament: 'OT' },
  { usfm: '2KI', nameEn: '2 Kings', nameFa: 'دوم پادشاهان', chapters: 25, order: 12, testament: 'OT' },
  { usfm: '1CH', nameEn: '1 Chronicles', nameFa: 'اول تواریخ', chapters: 29, order: 13, testament: 'OT' },
  { usfm: '2CH', nameEn: '2 Chronicles', nameFa: 'دوم تواریخ', chapters: 36, order: 14, testament: 'OT' },
  { usfm: 'EZR', nameEn: 'Ezra', nameFa: 'عزرا', chapters: 10, order: 15, testament: 'OT' },
  { usfm: 'NEH', nameEn: 'Nehemiah', nameFa: 'نحمیا', chapters: 13, order: 16, testament: 'OT' },
  { usfm: 'EST', nameEn: 'Esther', nameFa: 'استر', chapters: 10, order: 17, testament: 'OT' },
  { usfm: 'JOB', nameEn: 'Job', nameFa: 'ایوب', chapters: 42, order: 18, testament: 'OT' },
  { usfm: 'PSA', nameEn: 'Psalms', nameFa: 'مزامیر', chapters: 150, order: 19, testament: 'OT' },
  { usfm: 'PRO', nameEn: 'Proverbs', nameFa: 'امثال', chapters: 31, order: 20, testament: 'OT' },
  { usfm: 'ECC', nameEn: 'Ecclesiastes', nameFa: 'جامعه', chapters: 12, order: 21, testament: 'OT' },
  { usfm: 'SNG', nameEn: 'Song of Songs', nameFa: 'غزل غزلها', chapters: 8, order: 22, testament: 'OT' },
  { usfm: 'ISA', nameEn: 'Isaiah', nameFa: 'اشعیا', chapters: 66, order: 23, testament: 'OT' },
  { usfm: 'JER', nameEn: 'Jeremiah', nameFa: 'ارمیا', chapters: 52, order: 24, testament: 'OT' },
  { usfm: 'LAM', nameEn: 'Lamentations', nameFa: 'مراثی ارمیا', chapters: 5, order: 25, testament: 'OT' },
  { usfm: 'EZK', nameEn: 'Ezekiel', nameFa: 'حزقیال', chapters: 48, order: 26, testament: 'OT' },
  { usfm: 'DAN', nameEn: 'Daniel', nameFa: 'دانیال', chapters: 12, order: 27, testament: 'OT' },
  { usfm: 'HOS', nameEn: 'Hosea', nameFa: 'هوشع', chapters: 14, order: 28, testament: 'OT' },
  { usfm: 'JOL', nameEn: 'Joel', nameFa: 'یوئیل', chapters: 3, order: 29, testament: 'OT' },
  { usfm: 'AMO', nameEn: 'Amos', nameFa: 'عاموس', chapters: 9, order: 30, testament: 'OT' },
  { usfm: 'OBA', nameEn: 'Obadiah', nameFa: 'عوبدیا', chapters: 1, order: 31, testament: 'OT' },
  { usfm: 'JON', nameEn: 'Jonah', nameFa: 'یونس', chapters: 4, order: 32, testament: 'OT' },
  { usfm: 'MIC', nameEn: 'Micah', nameFa: 'میکاه', chapters: 7, order: 33, testament: 'OT' },
  { usfm: 'NAM', nameEn: 'Nahum', nameFa: 'ناحوم', chapters: 3, order: 34, testament: 'OT' },
  { usfm: 'HAB', nameEn: 'Habakkuk', nameFa: 'حبقوق', chapters: 3, order: 35, testament: 'OT' },
  { usfm: 'ZEP', nameEn: 'Zephaniah', nameFa: 'صفنیا', chapters: 3, order: 36, testament: 'OT' },
  { usfm: 'HAG', nameEn: 'Haggai', nameFa: 'حجی', chapters: 2, order: 37, testament: 'OT' },
  { usfm: 'ZEC', nameEn: 'Zechariah', nameFa: 'زکریا', chapters: 14, order: 38, testament: 'OT' },
  { usfm: 'MAL', nameEn: 'Malachi', nameFa: 'ملاکی', chapters: 4, order: 39, testament: 'OT' },

  // New Testament (40-66)
  { usfm: 'MAT', nameEn: 'Matthew', nameFa: 'متی', chapters: 28, order: 40, testament: 'NT' },
  { usfm: 'MRK', nameEn: 'Mark', nameFa: 'مرقس', chapters: 16, order: 41, testament: 'NT' },
  { usfm: 'LUK', nameEn: 'Luke', nameFa: 'لوقا', chapters: 24, order: 42, testament: 'NT' },
  { usfm: 'JHN', nameEn: 'John', nameFa: 'یوحنا', chapters: 21, order: 43, testament: 'NT' },
  { usfm: 'ACT', nameEn: 'Acts', nameFa: 'اعمال رسولان', chapters: 28, order: 44, testament: 'NT' },
  { usfm: 'ROM', nameEn: 'Romans', nameFa: 'رومیان', chapters: 16, order: 45, testament: 'NT' },
  { usfm: '1CO', nameEn: '1 Corinthians', nameFa: 'اول قرنتیان', chapters: 16, order: 46, testament: 'NT' },
  { usfm: '2CO', nameEn: '2 Corinthians', nameFa: 'دوم قرنتیان', chapters: 13, order: 47, testament: 'NT' },
  { usfm: 'GAL', nameEn: 'Galatians', nameFa: 'غلاطیان', chapters: 6, order: 48, testament: 'NT' },
  { usfm: 'EPH', nameEn: 'Ephesians', nameFa: 'افسسیان', chapters: 6, order: 49, testament: 'NT' },
  { usfm: 'PHP', nameEn: 'Philippians', nameFa: 'فیلیپیان', chapters: 4, order: 50, testament: 'NT' },
  { usfm: 'COL', nameEn: 'Colossians', nameFa: 'کولسیان', chapters: 4, order: 51, testament: 'NT' },
  { usfm: '1TH', nameEn: '1 Thessalonians', nameFa: 'اول تسالونیکیان', chapters: 5, order: 52, testament: 'NT' },
  { usfm: '2TH', nameEn: '2 Thessalonians', nameFa: 'دوم تسالونیکیان', chapters: 3, order: 53, testament: 'NT' },
  { usfm: '1TI', nameEn: '1 Timothy', nameFa: 'اول تیموتائوس', chapters: 6, order: 54, testament: 'NT' },
  { usfm: '2TI', nameEn: '2 Timothy', nameFa: 'دوم تیموتائوس', chapters: 4, order: 55, testament: 'NT' },
  { usfm: 'TIT', nameEn: 'Titus', nameFa: 'تیتوس', chapters: 3, order: 56, testament: 'NT' },
  { usfm: 'PHM', nameEn: 'Philemon', nameFa: 'فلیمون', chapters: 1, order: 57, testament: 'NT' },
  { usfm: 'HEB', nameEn: 'Hebrews', nameFa: 'عبرانیان', chapters: 13, order: 58, testament: 'NT' },
  { usfm: 'JAS', nameEn: 'James', nameFa: 'یعقوب', chapters: 5, order: 59, testament: 'NT' },
  { usfm: '1PE', nameEn: '1 Peter', nameFa: 'اول پطرس', chapters: 5, order: 60, testament: 'NT' },
  { usfm: '2PE', nameEn: '2 Peter', nameFa: 'دوم پطرس', chapters: 3, order: 61, testament: 'NT' },
  { usfm: '1JN', nameEn: '1 John', nameFa: 'اول یوحنا', chapters: 5, order: 62, testament: 'NT' },
  { usfm: '2JN', nameEn: '2 John', nameFa: 'دوم یوحنا', chapters: 1, order: 63, testament: 'NT' },
  { usfm: '3JN', nameEn: '3 John', nameFa: 'سوم یوحنا', chapters: 1, order: 64, testament: 'NT' },
  { usfm: 'JUD', nameEn: 'Jude', nameFa: 'یهودا', chapters: 1, order: 65, testament: 'NT' },
  { usfm: 'REV', nameEn: 'Revelation', nameFa: 'مکاشفه', chapters: 22, order: 66, testament: 'NT' },
];

const ALIASES: Record<string, string> = {
  // Genesis
  genesis: 'GEN', gen: 'GEN', تکوین: 'GEN', پیدایش: 'GEN',
  // Exodus
  exodus: 'EXO', exo: 'EXO', خروج: 'EXO',
  // Leviticus
  leviticus: 'LEV', lev: 'LEV', لاویان: 'LEV',
  // Numbers
  numbers: 'NUM', num: 'NUM', اعداد: 'NUM',
  // Deuteronomy
  deuteronomy: 'DEU', deu: 'DEU', تثنیه: 'DEU',
  // Joshua
  joshua: 'JOS', jos: 'JOS', یوشع: 'JOS',
  // Judges
  judges: 'JDG', jdg: 'JDG', داوران: 'JDG',
  // Ruth
  ruth: 'RUT', rut: 'RUT', روت: 'RUT',
  // Samuel
  '1samuel': '1SA', '1sa': '1SA', samuel1: '1SA', 'اول سموئیل': '1SA', '۱ سموئیل': '1SA',
  '2samuel': '2SA', '2sa': '2SA', samuel2: '2SA', 'دوم سموئیل': '2SA', '۲ سموئیل': '2SA',
  // Kings
  '1kings': '1KI', '1ki': '1KI', kings1: '1KI', 'اول پادشاهان': '1KI', '۱ پادشاهان': '1KI',
  '2kings': '2KI', '2ki': '2KI', kings2: '2KI', 'دوم پادشاهان': '2KI', '۲ پادشاهان': '2KI',
  // Chronicles
  '1chronicles': '1CH', '1ch': '1CH', chronicles1: '1CH', 'اول تواریخ': '1CH', '۱ تواریخ': '1CH',
  '2chronicles': '2CH', '2ch': '2CH', chronicles2: '2CH', 'دوم تواریخ': '2CH', '۲ تواریخ': '2CH',
  // Ezra, Nehemiah, Esther, Job
  ezra: 'EZR', ezr: 'EZR', عزرا: 'EZR',
  nehemiah: 'NEH', neh: 'NEH', نحمیا: 'NEH',
  esther: 'EST', est: 'EST', استر: 'EST',
  job: 'JOB', ایوب: 'JOB',
  // Psalms
  psalms: 'PSA', psalm: 'PSA', psa: 'PSA', مزامیر: 'PSA', زبور: 'PSA',
  // Proverbs, Ecclesiastes, Song
  proverbs: 'PRO', pro: 'PRO', امثال: 'PRO',
  ecclesiastes: 'ECC', ecc: 'ECC', جامعه: 'ECC',
  songofsongs: 'SNG', song: 'SNG', sng: 'SNG', 'غزل غزلها': 'SNG', 'غزل غزل‌ها': 'SNG',
  // Prophets
  isaiah: 'ISA', isa: 'ISA', اشعیا: 'ISA', اشعیاء: 'ISA',
  jeremiah: 'JER', jer: 'JER', ارمیا: 'JER',
  lamentations: 'LAM', lam: 'LAM', مراثی: 'LAM', 'مراثی ارمیا': 'LAM',
  ezekiel: 'EZK', ezk: 'EZK', حزقیال: 'EZK',
  daniel: 'DAN', dan: 'DAN', دانیال: 'DAN',
  hosea: 'HOS', hos: 'HOS', هوشع: 'HOS',
  joel: 'JOL', jol: 'JOL', یوئیل: 'JOL',
  amos: 'AMO', amo: 'AMO', عاموس: 'AMO',
  obadiah: 'OBA', oba: 'OBA', عوبدیا: 'OBA',
  jonah: 'JON', jon: 'JON', یونس: 'JON',
  micah: 'MIC', mic: 'MIC', میکاه: 'MIC',
  nahum: 'NAM', nam: 'NAM', ناحوم: 'NAM',
  habakkuk: 'HAB', hab: 'HAB', حبقوق: 'HAB',
  zephaniah: 'ZEP', zep: 'ZEP', صفنیا: 'ZEP',
  haggai: 'HAG', hag: 'HAG', حجی: 'HAG',
  zechariah: 'ZEC', zec: 'ZEC', زکریا: 'ZEC',
  malachi: 'MAL', mal: 'MAL', ملاکی: 'MAL',

  // Gospels & Acts
  matthew: 'MAT', mat: 'MAT', متی: 'MAT',
  mark: 'MRK', mrk: 'MRK', markos: 'MRK', مرقس: 'MRK',
  luke: 'LUK', luk: 'LUK', لوقا: 'LUK',
  john: 'JHN', jhn: 'JHN', yohanna: 'JHN', یوحنا: 'JHN',
  acts: 'ACT', act: 'ACT', اعمال: 'ACT', 'اعمال رسولان': 'ACT',

  // Epistles
  romans: 'ROM', rom: 'ROM', رومیان: 'ROM',
  '1corinthians': '1CO', '1co': '1CO', 'اول قرنتیان': '1CO', 'اول قورنتیان': '1CO', '۱ قرنتیان': '1CO',
  '2corinthians': '2CO', '2co': '2CO', 'دوم قرنتیان': '2CO', 'دوم قورنتیان': '2CO', '۲ قرنتیان': '2CO',
  galatians: 'GAL', gal: 'GAL', غلاطیان: 'GAL',
  ephesians: 'EPH', eph: 'EPH', افسسیان: 'EPH',
  philippians: 'PHP', php: 'PHP', فیلیپیان: 'PHP',
  colossians: 'COL', col: 'COL', کولسیان: 'COL',
  '1thessalonians': '1TH', '1th': '1TH', 'اول تسالونیکیان': '1TH', '۱ تسالونیکیان': '1TH',
  '2thessalonians': '2TH', '2th': '2TH', 'دوم تسالونیکیان': '2TH', '۲ تسالونیکیان': '2TH',
  '1timothy': '1TI', '1ti': '1TI', 'اول تیموتائوس': '1TI', 'اول تیموتاؤس': '1TI', '۱ تیموتائوس': '1TI',
  '2timothy': '2TI', '2ti': '2TI', 'دوم تیموتائوس': '2TI', 'دوم تیموتاؤس': '2TI', '۲ تیموتائوس': '2TI',
  titus: 'TIT', tit: 'TIT', تیتوس: 'TIT', تیطس: 'TIT',
  philemon: 'PHM', phm: 'PHM', فلیمون: 'PHM',
  hebrews: 'HEB', heb: 'HEB', عبرانیان: 'HEB',
  james: 'JAS', jas: 'JAS', یعقوب: 'JAS',
  '1peter': '1PE', '1pe': '1PE', 'اول پطرس': '1PE', '۱ پطرس': '1PE',
  '2peter': '2PE', '2pe': '2PE', 'دوم پطرس': '2PE', '۲ پطرس': '2PE',
  '1john': '1JN', '1jn': '1JN', 'اول یوحنا': '1JN', '۱ یوحنا': '1JN',
  '2john': '2JN', '2jn': '2JN', 'دوم یوحنا': '2JN', '۲ یوحنا': '2JN',
  '3john': '3JN', '3jn': '3JN', 'سوم یوحنا': '3JN', '۳ یوحنا': '3JN',
  jude: 'JUD', jud: 'JUD', یهودا: 'JUD',
  revelation: 'REV', rev: 'REV', مکاشفه: 'REV',
};

export function normalizeToUsfm(input: string): string {
  if (!input) return 'GEN';
  const raw = input.trim();
  const normalizedKey = raw.toLowerCase().replace(/[\s\-_]+/g, '');
  if (ALIASES[normalizedKey]) return ALIASES[normalizedKey];

  // Try direct uppercase match
  const upper = raw.toUpperCase();
  const found = CANONICAL_BOOKS.find(b => b.usfm === upper);
  if (found) return found.usfm;

  // Direct match by English name
  const byName = CANONICAL_BOOKS.find(b => b.nameEn.toLowerCase() === raw.toLowerCase());
  if (byName) return byName.usfm;

  // Direct match by Farsi name
  const byFa = CANONICAL_BOOKS.find(b => b.nameFa === raw);
  if (byFa) return byFa.usfm;

  // If 3 letters
  if (/^[1-3]?[A-Z]{2,3}$/.test(upper)) return upper;

  return 'GEN';
}

export function getBookInfo(input: string): BookInfo {
  const usfm = normalizeToUsfm(input);
  return CANONICAL_BOOKS.find(b => b.usfm === usfm) || CANONICAL_BOOKS[0];
}
