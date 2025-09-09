import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { BookOpen, Play, Pause, Volume2, ExternalLink } from 'lucide-react';
import MediaPlayer from './MediaPlayer';

interface BibleBook {
  id: number;
  name: { en: string; fa: string };
  abbreviation: string;
  chapters: number;
  audioUrl: string;
}

const AudioBible = () => {
  const { t, lang } = useLanguage();
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [currentBook, setCurrentBook] = useState<BibleBook | null>(null);

  // List of Bible books with WordProject audio links
  const oldTestamentBooks: BibleBook[] = [
    { id: 1, name: { en: 'Genesis', fa: 'پیدایش' }, abbreviation: 'Gen', chapters: 50, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b01.htm' },
    { id: 2, name: { en: 'Exodus', fa: 'خروج' }, abbreviation: 'Ex', chapters: 40, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b02.htm' },
    { id: 3, name: { en: 'Leviticus', fa: 'لاویان' }, abbreviation: 'Lv', chapters: 27, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b03.htm' },
    { id: 4, name: { en: 'Numbers', fa: 'اعداد' }, abbreviation: 'Nm', chapters: 36, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b04.htm' },
    { id: 5, name: { en: 'Deuteronomy', fa: 'تثنیه' }, abbreviation: 'Dt', chapters: 34, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b05.htm' },
    { id: 6, name: { en: 'Joshua', fa: 'یوشع' }, abbreviation: 'Jos', chapters: 24, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b06.htm' },
    { id: 7, name: { en: 'Judges', fa: 'داوران' }, abbreviation: 'Jdg', chapters: 21, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b07.htm' },
    { id: 8, name: { en: 'Ruth', fa: 'روت' }, abbreviation: 'Rt', chapters: 4, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b08.htm' },
    { id: 9, name: { en: '1 Samuel', fa: 'اول سموئیل' }, abbreviation: '1Sm', chapters: 31, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b09.htm' },
    { id: 10, name: { en: '2 Samuel', fa: 'دوم سموئیل' }, abbreviation: '2Sm', chapters: 24, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b10.htm' },
    { id: 11, name: { en: '1 Kings', fa: 'اول پادشاهان' }, abbreviation: '1Kn', chapters: 22, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b11.htm' },
    { id: 12, name: { en: '2 Kings', fa: 'دوم پادشاهان' }, abbreviation: '2Kn', chapters: 25, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b12.htm' },
    { id: 13, name: { en: '1 Chronicles', fa: 'اول تواریخ' }, abbreviation: '1Ch', chapters: 29, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b13.htm' },
    { id: 14, name: { en: '2 Chronicles', fa: 'دوم تواریخ' }, abbreviation: '2Ch', chapters: 36, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b14.htm' },
    { id: 15, name: { en: 'Ezra', fa: 'عزرا' }, abbreviation: 'Ez', chapters: 10, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b15.htm' },
    { id: 16, name: { en: 'Nehemiah', fa: 'نحمیا' }, abbreviation: 'Nh', chapters: 13, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b16.htm' },
    { id: 17, name: { en: 'Esther', fa: 'استر' }, abbreviation: 'Es', chapters: 10, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b17.htm' },
    { id: 18, name: { en: 'Job', fa: 'ایوب' }, abbreviation: 'Jb', chapters: 42, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b18.htm' },
    { id: 19, name: { en: 'Psalms', fa: 'مزامیر' }, abbreviation: 'Ps', chapters: 150, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b19.htm' },
    { id: 20, name: { en: 'Proverbs', fa: 'امثال سلیمان' }, abbreviation: 'Pr', chapters: 31, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b20.htm' },
    { id: 21, name: { en: 'Ecclesiastes', fa: 'جامعه' }, abbreviation: 'Ec', chapters: 12, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b21.htm' },
    { id: 22, name: { en: 'Song of Solomon', fa: 'غزل غزلهای سلیمان' }, abbreviation: 'Sn', chapters: 8, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b22.htm' },
    { id: 23, name: { en: 'Isaiah', fa: 'اشعیا' }, abbreviation: 'Is', chapters: 66, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b23.htm' },
    { id: 24, name: { en: 'Jeremiah', fa: 'ارمیا' }, abbreviation: 'Jr', chapters: 52, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b24.htm' },
    { id: 25, name: { en: 'Lamentations', fa: 'مراثی ارمیا' }, abbreviation: 'Lm', chapters: 5, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b25.htm' },
    { id: 26, name: { en: 'Ezekiel', fa: 'حزقیال' }, abbreviation: 'Ek', chapters: 48, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b26.htm' },
    { id: 27, name: { en: 'Daniel', fa: 'دانیال' }, abbreviation: 'Dn', chapters: 12, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b27.htm' },
    { id: 28, name: { en: 'Hosea', fa: 'هوشع' }, abbreviation: 'Hs', chapters: 14, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b28.htm' },
    { id: 29, name: { en: 'Joel', fa: 'یوئیل' }, abbreviation: 'Jl', chapters: 3, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b29.htm' },
    { id: 30, name: { en: 'Amos', fa: 'عاموس' }, abbreviation: 'Am', chapters: 9, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b30.htm' },
    { id: 31, name: { en: 'Obadiah', fa: 'عوبدیا' }, abbreviation: 'Ob', chapters: 1, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b31.htm' },
    { id: 32, name: { en: 'Jonah', fa: 'یونس' }, abbreviation: 'Jn', chapters: 4, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b32.htm' },
    { id: 33, name: { en: 'Micah', fa: 'میکاه' }, abbreviation: 'Mc', chapters: 7, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b33.htm' },
    { id: 34, name: { en: 'Nahum', fa: 'ناحوم' }, abbreviation: 'Na', chapters: 3, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b34.htm' },
    { id: 35, name: { en: 'Habakkuk', fa: 'حبقوق' }, abbreviation: 'Hk', chapters: 3, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b35.htm' },
    { id: 36, name: { en: 'Zephaniah', fa: 'صفنیا' }, abbreviation: 'Zp', chapters: 3, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b36.htm' },
    { id: 37, name: { en: 'Haggai', fa: 'حجی' }, abbreviation: 'Hg', chapters: 2, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b37.htm' },
    { id: 38, name: { en: 'Zechariah', fa: 'زکریا' }, abbreviation: 'Zc', chapters: 14, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b38.htm' },
    { id: 39, name: { en: 'Malachi', fa: 'ملاکی' }, abbreviation: 'Ml', chapters: 4, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b39.htm' }
  ];

  const newTestamentBooks: BibleBook[] = [
    { id: 40, name: { en: 'Matthew', fa: 'متی' }, abbreviation: 'Mt', chapters: 28, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b40.htm' },
    { id: 41, name: { en: 'Mark', fa: 'مرقس' }, abbreviation: 'Mr', chapters: 16, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b41.htm' },
    { id: 42, name: { en: 'Luke', fa: 'لوقا' }, abbreviation: 'Lk', chapters: 24, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b42.htm' },
    { id: 43, name: { en: 'John', fa: 'یوحنا' }, abbreviation: 'Jh', chapters: 21, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b43.htm' },
    { id: 44, name: { en: 'Acts', fa: 'اعمال رسولان' }, abbreviation: 'Ac', chapters: 28, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b44.htm' },
    { id: 45, name: { en: 'Romans', fa: 'رومیان' }, abbreviation: 'Rm', chapters: 16, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b45.htm' },
    { id: 46, name: { en: '1 Corinthians', fa: 'اول قرنتیان' }, abbreviation: '1Cr', chapters: 16, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b46.htm' },
    { id: 47, name: { en: '2 Corinthians', fa: 'دوم قرنتیان' }, abbreviation: '2Cr', chapters: 13, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b47.htm' },
    { id: 48, name: { en: 'Galatians', fa: 'غلاطیان' }, abbreviation: 'Gl', chapters: 6, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b48.htm' },
    { id: 49, name: { en: 'Ephesians', fa: 'افسسیان' }, abbreviation: 'Ep', chapters: 6, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b49.htm' },
    { id: 50, name: { en: 'Philippians', fa: 'فیلیپیان' }, abbreviation: 'Ph', chapters: 4, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b50.htm' },
    { id: 51, name: { en: 'Colossians', fa: 'کولسیان' }, abbreviation: 'Cl', chapters: 4, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b51.htm' },
    { id: 52, name: { en: '1 Thessalonians', fa: 'اول تسالونیکیان' }, abbreviation: '1Th', chapters: 5, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b52.htm' },
    { id: 53, name: { en: '2 Thessalonians', fa: 'دوم تسالونیکیان' }, abbreviation: '2Th', chapters: 3, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b53.htm' },
    { id: 54, name: { en: '1 Timothy', fa: 'اول تیموتائوس' }, abbreviation: '1Tm', chapters: 6, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b54.htm' },
    { id: 55, name: { en: '2 Timothy', fa: 'دوم تیموتائوس' }, abbreviation: '2Tm', chapters: 4, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b55.htm' },
    { id: 56, name: { en: 'Titus', fa: 'تیطس' }, abbreviation: 'Tt', chapters: 3, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b56.htm' },
    { id: 57, name: { en: 'Philemon', fa: 'فیلیمون' }, abbreviation: 'Pl', chapters: 1, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b57.htm' },
    { id: 58, name: { en: 'Hebrews', fa: 'عبرانیان' }, abbreviation: 'Hb', chapters: 13, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b58.htm' },
    { id: 59, name: { en: 'James', fa: 'یعقوب' }, abbreviation: 'Jm', chapters: 5, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b59.htm' },
    { id: 60, name: { en: '1 Peter', fa: 'اول پطرس' }, abbreviation: '1Pt', chapters: 5, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b60.htm' },
    { id: 61, name: { en: '2 Peter', fa: 'دوم پطرس' }, abbreviation: '2Pt', chapters: 3, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b61.htm' },
    { id: 62, name: { en: '1 John', fa: 'اول یوحنا' }, abbreviation: '1Jh', chapters: 5, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b62.htm' },
    { id: 63, name: { en: '2 John', fa: 'دوم یوحنا' }, abbreviation: '2Jh', chapters: 1, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b63.htm' },
    { id: 64, name: { en: '3 John', fa: 'سوم یوحنا' }, abbreviation: '3Jh', chapters: 1, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b64.htm' },
    { id: 65, name: { en: 'Jude', fa: 'یهودا' }, abbreviation: 'Jd', chapters: 1, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b65.htm' },
    { id: 66, name: { en: 'Revelation', fa: 'مکاشفه یوحنا' }, abbreviation: 'Rv', chapters: 22, audioUrl: 'https://www.wordproject.org/bibles/audio/20_farsi/b66.htm' }
  ];

  const handleOpenAudio = (book: BibleBook) => {
    // For now, we'll open in new tab since WordProject doesn't provide direct audio files
    // In a real implementation, you would need to extract actual audio file URLs
    window.open(book.audioUrl, '_blank');
  };

  const handlePlayAudio = (book: BibleBook) => {
    setCurrentBook(book);
    setPlayerOpen(true);
  };

  const handleReadOnline = () => {
    window.open('https://www.bible.com/bible/118/GEN.1.NMV', '_blank');
  };

  const BibleBookCard = ({ book }: { book: BibleBook }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-medium text-gray-900">
              {book.name[lang]}
            </h3>
            <p className="text-sm text-gray-500">
              {lang === 'fa' ? `${book.chapters} فصل` : `${book.chapters} chapters`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex space-x-2 rtl:space-x-reverse">
        <button
          onClick={() => handlePlayAudio(book)}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
        >
          <Volume2 className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
          {lang === 'fa' ? 'گوش دادن' : 'Listen'}
        </button>
        <button
          onClick={() => handleOpenAudio(book)}
          className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
          title={lang === 'fa' ? 'باز کردن در صفحه جدید' : 'Open in new tab'}
        >
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {lang === 'fa' ? 'کتاب مقدس صوتی' : 'Audio Bible'}
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
          {lang === 'fa' 
            ? 'کتاب مقدس کامل را به زبان فارسی گوش دهید. تمام کتاب‌های عهد عتیق و جدید با کیفیت صوتی بالا در دسترس شما است.' 
            : 'Listen to the complete Bible in Persian. All Old and New Testament books are available with high-quality audio.'
          }
        </p>

        {/* Quick Actions */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={handleReadOnline}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <BookOpen className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
            {lang === 'fa' ? 'مطالعه آنلاین' : 'Read Online'}
          </button>
          <a
            href="https://play.google.com/store/apps/details?id=com.WordProject.HolyBible&hl=en"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
            {lang === 'fa' ? 'دانلود اپلیکیشن' : 'Download App'}
          </a>
        </div>
      </div>

      {/* Old Testament */}
      <div className="mb-12">
        <div className="flex items-center mb-6">
          <BookOpen className="h-6 w-6 text-amber-600 mr-3 rtl:ml-3 rtl:mr-0" />
          <h2 className="text-2xl font-bold text-gray-900">
            {lang === 'fa' ? 'عهد عتیق' : 'Old Testament'}
          </h2>
          <span className="ml-4 rtl:mr-4 rtl:ml-0 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
            {oldTestamentBooks.length} {lang === 'fa' ? 'کتاب' : 'books'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {oldTestamentBooks.map(book => (
            <BibleBookCard key={book.id} book={book} />
          ))}
        </div>
      </div>

      {/* New Testament */}
      <div>
        <div className="flex items-center mb-6">
          <BookOpen className="h-6 w-6 text-blue-600 mr-3 rtl:ml-3 rtl:mr-0" />
          <h2 className="text-2xl font-bold text-gray-900">
            {lang === 'fa' ? 'عهد جدید' : 'New Testament'}
          </h2>
          <span className="ml-4 rtl:mr-4 rtl:ml-0 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            {newTestamentBooks.length} {lang === 'fa' ? 'کتاب' : 'books'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {newTestamentBooks.map(book => (
            <BibleBookCard key={book.id} book={book} />
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600 mb-2">
          {lang === 'fa' 
            ? 'محتوای صوتی از WordProject ارائه شده است' 
            : 'Audio content provided by WordProject'
          }
        </p>
        <p className="text-sm text-gray-500">
          {lang === 'fa' 
            ? 'برای تجربه بهتر، اپلیکیشن موبایل WordProject را دانلود کنید' 
            : 'For the best experience, download the WordProject mobile app'
          }
        </p>
      </div>

      {/* Audio Player for Bible books */}
      {currentBook && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                {currentBook.name[lang]}
              </h3>
              <button 
                onClick={() => setPlayerOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ExternalLink className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 text-center space-y-4">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-12 w-12 text-blue-600" />
              </div>
              
              <h4 className="text-xl font-semibold text-gray-900">
                {currentBook.name[lang]}
              </h4>
              
              <p className="text-gray-600">
                {currentBook.chapters} {lang === 'fa' ? 'فصل' : 'chapters'}
              </p>
              
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                {lang === 'fa' 
                  ? 'برای گوش دادن به این کتاب، روی دکمه زیر کلیک کنید تا به صفحه WordProject منتقل شوید.' 
                  : 'To listen to this book, click the button below to be redirected to WordProject.'
                }
              </p>
              
              <div className="flex justify-center space-x-4 rtl:space-x-reverse mt-6">
                <button
                  onClick={() => handleOpenAudio(currentBook)}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Volume2 className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
                  {lang === 'fa' ? 'گوش دادن' : 'Listen'}
                </button>
                
                <button
                  onClick={() => setPlayerOpen(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {lang === 'fa' ? 'بستن' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioBible;