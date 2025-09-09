// Local Bible Audio Data Management
export interface LocalBibleBook {
  id: number;
  name: { en: string; fa: string };
  abbreviation: string;
  chapters: number;
  localAudioPath: string;
  testament: 'old' | 'new';
}

// Sample local Bible books with local audio files
export const localBibleBooks: LocalBibleBook[] = [
  // Old Testament
  { id: 1, name: { en: 'Genesis', fa: 'پیدایش' }, abbreviation: 'Gen', chapters: 50, localAudioPath: '/assets/audio/bible/genesis.mp3', testament: 'old' },
  { id: 2, name: { en: 'Exodus', fa: 'خروج' }, abbreviation: 'Ex', chapters: 40, localAudioPath: '/assets/audio/bible/exodus.mp3', testament: 'old' },
  { id: 3, name: { en: 'Leviticus', fa: 'احبار' }, abbreviation: 'Lv', chapters: 27, localAudioPath: '/assets/audio/bible/leviticus.mp3', testament: 'old' },
  { id: 4, name: { en: 'Numbers', fa: 'اعداد' }, abbreviation: 'Nm', chapters: 36, localAudioPath: '/assets/audio/bible/numbers.mp3', testament: 'old' },
  { id: 5, name: { en: 'Deuteronomy', fa: 'تثنیه' }, abbreviation: 'Dt', chapters: 34, localAudioPath: '/assets/audio/bible/deuteronomy.mp3', testament: 'old' },
  { id: 6, name: { en: 'Joshua', fa: 'یوشع' }, abbreviation: 'Jos', chapters: 24, localAudioPath: '/assets/audio/bible/joshua.mp3', testament: 'old' },
  { id: 7, name: { en: 'Judges', fa: 'داوران' }, abbreviation: 'Jdg', chapters: 21, localAudioPath: '/assets/audio/bible/judges.mp3', testament: 'old' },
  { id: 8, name: { en: 'Ruth', fa: 'روت' }, abbreviation: 'Rt', chapters: 4, localAudioPath: '/assets/audio/bible/ruth.mp3', testament: 'old' },
  { id: 9, name: { en: '1 Samuel', fa: '۱ سموئیل' }, abbreviation: '1Sm', chapters: 31, localAudioPath: '/assets/audio/bible/1samuel.mp3', testament: 'old' },
  { id: 10, name: { en: '2 Samuel', fa: '۲ سموئیل' }, abbreviation: '2Sm', chapters: 24, localAudioPath: '/assets/audio/bible/2samuel.mp3', testament: 'old' },
  
  // New Testament
  { id: 40, name: { en: 'Matthew', fa: 'متی' }, abbreviation: 'Mt', chapters: 28, localAudioPath: '/assets/audio/bible/matthew.mp3', testament: 'new' },
  { id: 41, name: { en: 'Mark', fa: 'مرقس' }, abbreviation: 'Mk', chapters: 16, localAudioPath: '/assets/audio/bible/mark.mp3', testament: 'new' },
  { id: 42, name: { en: 'Luke', fa: 'لوقا' }, abbreviation: 'Lk', chapters: 24, localAudioPath: '/assets/audio/bible/luke.mp3', testament: 'new' },
  { id: 43, name: { en: 'John', fa: 'یوحنا' }, abbreviation: 'Jn', chapters: 21, localAudioPath: '/assets/audio/bible/john.mp3', testament: 'new' },
  { id: 44, name: { en: 'Acts', fa: 'اعمال' }, abbreviation: 'Acts', chapters: 28, localAudioPath: '/assets/audio/bible/acts.mp3', testament: 'new' },
  { id: 45, name: { en: 'Romans', fa: 'رومیان' }, abbreviation: 'Rom', chapters: 16, localAudioPath: '/assets/audio/bible/romans.mp3', testament: 'new' },
  { id: 46, name: { en: '1 Corinthians', fa: '۱ قرنتیان' }, abbreviation: '1Cor', chapters: 16, localAudioPath: '/assets/audio/bible/1corinthians.mp3', testament: 'new' },
  { id: 47, name: { en: '2 Corinthians', fa: '۲ قرنتیان' }, abbreviation: '2Cor', chapters: 13, localAudioPath: '/assets/audio/bible/2corinthians.mp3', testament: 'new' },
  { id: 48, name: { en: 'Galatians', fa: 'غلاطیان' }, abbreviation: 'Gal', chapters: 6, localAudioPath: '/assets/audio/bible/galatians.mp3', testament: 'new' },
  { id: 49, name: { en: 'Ephesians', fa: 'افسسیان' }, abbreviation: 'Eph', chapters: 6, localAudioPath: '/assets/audio/bible/ephesians.mp3', testament: 'new' }
];

export const getOldTestamentBooks = (): LocalBibleBook[] => {
  return localBibleBooks.filter(book => book.testament === 'old');
};

export const getNewTestamentBooks = (): LocalBibleBook[] => {
  return localBibleBooks.filter(book => book.testament === 'new');
};