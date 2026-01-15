import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Square,
  Volume2,
  ZoomIn,
  ZoomOut,
  Settings,
  Globe,
  Home,
  Book
} from 'lucide-react';
import { api } from '../lib/api';
import { BIBLE_AUDIO_BASE_URL, BIBLE_TIMING_BASE_URL } from '../lib/constants';
import FlipBookBible from './FlipBookBible';
import BibleKaraokeView from './BibleKaraokeView';
import { Mic2 } from 'lucide-react';

interface BibleBook {
  key: string;
  name: { en: string; fa: string };
  chapters: number;
  testament: 'OT' | 'NT';
  hasAudio?: boolean;
}

interface BibleVerse {
  number: number;
  text: { en: string; fa: string };
}

interface Translation {
  id: number;
  code: string;
  name: { en: string; fa: string };
  description: { en: string; fa: string };
  language: string;
  isDefault: boolean;
  sortOrder: number;
  hasAudio?: boolean;
}

const UnifiedBibleReader: React.FC = () => {
  const { lang, setLang } = useLanguage();
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Persian book names mapping
  const persianBookNames: { [key: string]: string } = {
    'GEN': 'پیدایش', 'EXO': 'خروج', 'LEV': 'لاویان', 'NUM': 'اعداد', 'DEU': 'تثنیه',
    'JOS': 'یوشع', 'JDG': 'داوران', 'RUT': 'روت', '1SA': 'اول سموئیل', '2SA': 'دوم سموئیل',
    '1KI': 'اول پادشاهان', '2KI': 'دوم پادشاهان', '1CH': 'اول تواریخ', '2CH': 'دوم تواریخ',
    'EZR': 'عزرا', 'NEH': 'نحمیا', 'EST': 'استر', 'JOB': 'ایوب', 'PSA': 'مزامیر',
    'PRO': 'امثال', 'ECC': 'جامعه', 'SNG': 'غزل غزلها', 'ISA': 'اشعیا', 'JER': 'ارمیا',
    'LAM': 'مراثی ارمیا', 'EZK': 'حزقیال', 'DAN': 'دانیال', 'HOS': 'هوشع', 'JOL': 'یوئیل',
    'AMO': 'عاموس', 'OBA': 'عوبدیا', 'JON': 'یونس', 'MIC': 'میخا', 'NAM': 'ناحوم',
    'HAB': 'حبقوق', 'ZEP': 'صفنیا', 'HAG': 'حجی', 'ZEC': 'زکریا', 'MAL': 'ملاکی',
    'MAT': 'متی', 'MRK': 'مرقس', 'LUK': 'لوقا', 'JHN': 'یوحنا', 'ACT': 'اعمال رسولان',
    'ROM': 'رومیان', '1CO': 'اول قرنتیان', '2CO': 'دوم قرنتیان', 'GAL': 'غلاطیان',
    'EPH': 'افسسیان', 'PHP': 'فیلیپیان', 'COL': 'کولسیان', '1TH': 'اول تسالونیکیان',
    '2TH': 'دوم تسالونیکیان', '1TI': 'اول تیموتاؤس', '2TI': 'دوم تیموتاؤس', 'TIT': 'تیطس',
    'PHM': 'فلیمون', 'HEB': 'عبرانیان', 'JAS': 'یعقوب', '1PE': 'اول پطرس', '2PE': 'دوم پطرس',
    '1JN': 'اول یوحنا', '2JN': 'دوم یوحنا', '3JN': 'سوم یوحنا', 'JUD': 'یهودا', 'REV': 'مکاشفه'
  };

  // Core State
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [selectedTranslation, setSelectedTranslation] = useState<string>('');
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBookKey, setSelectedBookKey] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [chapterAudioUrl, setChapterAudioUrl] = useState<string | null>(null);
  const [chapterTimingUrl, setChapterTimingUrl] = useState<string | null>(null);

  // UI State
  const [isLoading, setIsLoading] = useState(true);  // Start with loading
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'translations' | 'books' | 'chapters' | 'reading'>('translations');

  // Settings
  const [fontSize, setFontSize] = useState(18);
  const [isBilingual, setIsBilingual] = useState(false);
  const [viewMode, setViewMode] = useState<'book' | 'karaoke'>('book');

  // Audio
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVerse, setCurrentVerse] = useState<number | null>(null);


  // Load translations on mount
  useEffect(() => {
    const fetchTranslations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.get<{ translations?: Translation[]; message?: string; success?: boolean }>('/api/bible/translations');
        if (data.translations && Array.isArray(data.translations)) {
          setTranslations(data.translations);
        } else {
          throw new Error(data.message || (lang === 'fa' ? '???? ????????? ???? ???? ?? ????? ????.' : 'Unable to load Bible translations.'));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTranslations();
  }, []);

  // Load books when translation selected
  useEffect(() => {
    if (selectedTranslation) {
      loadBooks();
    }
    // eslint-disable-next-line
  }, [selectedTranslation]);

  // Disable bilingual mode when language is not Persian
  useEffect(() => {
    if (lang !== 'fa' && isBilingual) {
      setIsBilingual(false);
    }
  }, [lang, isBilingual]);

  // Load verses when book/chapter selected
  useEffect(() => {
    if (selectedBookKey && selectedChapter) {
      loadVerses();
    }
  }, [selectedBookKey, selectedChapter]);

  // Translations fetch removed – only FA/EN supported

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching Bible books...');
      const data = await api.get<{ books?: BibleBook[]; message?: string; success?: boolean }>('/api/bible/books');
      if (data.books && Array.isArray(data.books) && data.books.length > 0) {
        setBooks(data.books);
        const defaultBook = data.books[0];
        if (defaultBook?.key) {
          setSelectedBookKey(defaultBook.key);
          setSelectedChapter(1);
        }
        setStep('books');
      } else {
        throw new Error(data.message || (lang === 'fa'
          ? '???????? ???? ???? ???? ???.'
          : 'Unable to load Bible books.'));
      }
    } catch (err: any) {
      const errorMessage = lang === 'fa'
        ? `خطا در بارگذاری کتاب‌ها: ${err.message}`
        : `Failed to fetch books: ${err.message}`;
      setError(errorMessage);
      console.error('Error loading books:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadVerses = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await api.get<{
        success: boolean;
        book?: { key: string; name: { en: string; fa: string } };
        chapter?: number;
        verses?: { fa: string[]; en: string[] };
        translation?: { code: string; name: { en: string; fa: string } };
        message?: string;
        audioUrl?: string;
        timingUrl?: string;
      }>(`/api/bible/content/${selectedBookKey}/${selectedChapter}`);

      console.log('✅ Verses loaded:', data);

      if (data.success && data.verses) {
        const faList: string[] = Array.isArray(data.verses.fa) ? data.verses.fa : [];
        const enList: string[] = Array.isArray(data.verses.en) ? data.verses.en : [];
        const maxLen = Math.max(faList.length, enList.length);

        // Debug: Check if en and fa are swapped or same
        console.log('📊 Sample verse 1 - FA:', faList[0]?.substring(0, 50));
        console.log('📊 Sample verse 1 - EN:', enList[0]?.substring(0, 50));

        const formattedVerses: BibleVerse[] = Array.from({ length: maxLen }, (_, i) => ({
          number: i + 1,
          text: {
            fa: faList[i] || '',
            en: enList[i] || ''
          }
        }));

        console.log(`✅ Loaded ${formattedVerses.length} verses`);
        setVerses(formattedVerses);

        // Store audio/timing URLs from backend if available
        if (data.audioUrl) setChapterAudioUrl(data.audioUrl);
        if (data.timingUrl) setChapterTimingUrl(data.timingUrl);

        setStep('reading');
      } else {
        throw new Error(data.message || 'Invalid API response for verses');
      }

    } catch (err: any) {
      const errorMessage = `خطا در بارگذاری آیات: ${err.message}`;
      setError(errorMessage);
      console.error('❌ Error loading verses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslationSelect = (translationCode: string) => {
    setSelectedTranslation(translationCode);
    setStep('books');
    setSelectedBookKey('');
    setSelectedChapter(1);
    setVerses([]);
    setBooks([]);
    setChapterAudioUrl(null);
    setChapterTimingUrl(null);
    console.log('🔄 ترجمه انتخاب شد:', translationCode);
  };

  const handleBookSelect = (bookKey: string) => {
    setSelectedBookKey(bookKey);
    setSelectedChapter(1);
    setVerses([]);
    setChapterAudioUrl(null);
    setChapterTimingUrl(null);
    console.log('📖 کتاب انتخاب شد:', bookKey);
  };

  const handleChapterChange = (chapter: number) => {
    setSelectedChapter(chapter);
    setVerses([]);
    setChapterAudioUrl(null);
    setChapterTimingUrl(null);
    console.log('📄 فصل انتخاب شد:', chapter);
  };

  // Audio functions - Play from HiDrive
  const speakChapter = () => {
    if (isPlaying) {
      console.log('🛑 Stopping audio...');
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setCurrentVerse(null);
      return;
    }

    // Construct Audio URL
    // Assumption: Audio files are stored as: BASE_URL/lang/BookKey/Chapter.mp3
    // Example: .../bible/audio/en/GEN/1.mp3
    // You may need to adjust this mapping based on your actual file structure on HiDrive
    const audioUrl = `${BIBLE_AUDIO_BASE_URL}/${lang}/${selectedBookKey}/${selectedChapter}.mp3`;

    console.log('▶️ Playing audio from:', audioUrl);

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
    } else {
      audioRef.current.src = audioUrl;
    }

    audioRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch(err => {
      console.error("Error playing audio:", err);
      // Fallback to TTS if audio file fails?
      // For now, just log error.
      alert(lang === 'fa' ? 'فایل صوتی یافت نشد.' : 'Audio file not found.');
      setIsPlaying(false);
    });

    audioRef.current.onended = () => {
      setIsPlaying(false);
      setCurrentVerse(null);
    };

    // Optional: Update current verse based on time (requires timing data)
    // For now, we just play the chapter audio.
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Navigation & Helpers
  const currentBook = books.find(b => b.key === selectedBookKey);
  const currentTranslation = translations.find(t => t.code === selectedTranslation);
  const maxChapters = currentBook?.chapters || 1;
  const hasAudio = Boolean(currentBook?.hasAudio && currentTranslation?.hasAudio);

  const goToNextChapter = () => {
    if (selectedChapter < maxChapters) {
      handleChapterChange(selectedChapter + 1);
    }
  };

  const goToPrevChapter = () => {
    if (selectedChapter > 1) {
      handleChapterChange(selectedChapter - 1);
    }
  };

  const resetToTranslations = () => {
    setStep('translations');
    setSelectedTranslation('');
    setSelectedBookKey('');
    setSelectedChapter(1);
    setVerses([]);
    setBooks([]);
  };

  const backToBooks = () => {
    setStep('books');
    setSelectedBookKey('');
    setSelectedChapter(1);
    setVerses([]);
  };

  // Error Display
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">خطا در بارگذاری</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={resetToTranslations}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  // Modern Loading Display
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-pulse"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <div className="mt-6 space-y-2">
            <p className="text-xl font-semibold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              در حال بارگذاری کتاب مقدس...
            </p>
            <p className="text-gray-600">
              لطفاً صبر کنید
            </p>
          </div>
          <div className="mt-8 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Debug log
  console.log('🔄 UnifiedBibleReader render:', {
    step,
    selectedTranslation,
    books: books.length,
    error,
    isLoading,
    hasAudio
  });

  // Simple fallback for testing
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg shadow-lg">
            <div className="flex items-center">
              <div className="text-red-400 text-2xl ml-3">⚠️</div>
              <div>
                <h3 className="text-lg font-medium text-red-800 mb-2">خطا در بارگذاری</h3>
                <p className="text-red-700">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  تلاش مجدد
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Modern Header */}
      <div className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  {lang === 'fa' ? 'کتاب مقدس' : 'Holy Bible'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {step === 'translations' && 'انتخاب ترجمه'}
                  {step === 'books' && 'انتخاب کتاب'}
                  {step === 'reading' && 'مطالعه'}
                </p>
              </div>
            </div>
            {/* Modern Controls */}
            <div className="flex items-center gap-4">
              {/* Read Aloud Button */}
              {step === 'reading' && verses.length > 0 && hasAudio && (
                <button
                  onClick={speakChapter}
                  className={`
                    p-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg border-2 flex items-center gap-2
                    ${isPlaying
                      ? 'bg-gradient-to-r from-red-100 to-pink-100 border-red-300 text-red-700 hover:from-red-200 hover:to-pink-200'
                      : 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 text-blue-700 hover:from-blue-200 hover:to-indigo-200'}
                  `}
                  title={isPlaying ? 'توقف روخوانی' : 'روخوانی فصل'}
                >
                  {isPlaying ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  <span className="text-sm font-medium">
                    {isPlaying ? 'توقف' : 'روخوانی'}
                  </span>
                </button>
              )}
              {/* Modern Font Size Controls */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-2">
                <button
                  onClick={() => setFontSize(Math.max(fontSize - 2, 14))}
                  className="p-2 bg-white hover:bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
                  title="کوچک‌تر"
                >
                  <ZoomOut className="w-4 h-4 text-gray-600" />
                </button>
                <div className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-lg">
                  <span className="text-sm font-semibold text-gray-700">{fontSize}</span>
                  <span className="text-xs text-gray-500">px</span>
                </div>
                <button
                  onClick={() => setFontSize(Math.min(fontSize + 2, 32))}
                  className="p-2 bg-white hover:bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
                  title="بزرگ‌تر"
                >
                  <ZoomIn className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              {/* Modern Bilingual Toggle */}
              <button
                onClick={() => setIsBilingual(!isBilingual)}
                className={`
                  p-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg border-2
                  ${isBilingual
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300 text-green-700 hover:from-green-200 hover:to-emerald-200'
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 text-gray-600 hover:from-gray-200 hover:to-gray-300'}
                `}
                title="نمایش دو زبانه"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {isBilingual ? 'دوزبانه' : 'تک‌زبانه'}
                  </span>
                </div>
              </button>
              {/* Karaoke Mode Toggle */}
              {step === 'reading' && hasAudio && (
                <button
                  onClick={() => setViewMode(viewMode === 'book' ? 'karaoke' : 'book')}
                  className={`
                    p-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg border-2
                    ${viewMode === 'karaoke'
                      ? 'bg-gradient-to-r from-purple-100 to-fuchsia-100 border-purple-300 text-purple-700 hover:from-purple-200 hover:to-fuchsia-200'
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 text-gray-600 hover:from-gray-200 hover:to-gray-300'}
                  `}
                  title="حالت کارائوکه"
                >
                  <div className="flex items-center gap-2">
                    <Mic2 className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {viewMode === 'karaoke' ? 'کارائوکه' : 'کتاب'}
                    </span>
                  </div>
                </button>
              )}
              {/* Translation Quick Selector */}
              {/* Translation Quick Selector */}
              {translations.length > 0 && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-2">
                  <label htmlFor="header-translation-select" className="text-brown-700 font-semibold text-xs">ترجمه:</label>
                  <select
                    id="header-translation-select"
                    className="border rounded-lg px-2 py-1 text-brown-700 bg-white hover:bg-brown-50 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-brown-300 text-xs"
                    value={selectedTranslation}
                    onChange={e => handleTranslationSelect(e.target.value)}
                  >
                    {translations.map(t => (
                      <option key={t.code} value={t.code}>{lang === 'fa' ? t.name.fa : t.name.en} ({t.language})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          {/* Modern Breadcrumb Navigation */}
          <div className="flex items-center gap-3 mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <button
              onClick={resetToTranslations}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <Home className="w-4 h-4" />
              انتخاب ترجمه
            </button>
            {selectedTranslation && (
              <>
                <ChevronLeft className="w-5 h-5 text-blue-400" />
                <button
                  onClick={backToBooks}
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <Book className="w-4 h-4" />
                  انتخاب کتاب
                </button>
              </>
            )}
            {selectedBookKey && (
              <>
                <ChevronLeft className="w-5 h-5 text-blue-400" />
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-lg border border-green-200">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-semibold">
                    {currentBook && (lang === 'fa' ? persianBookNames[currentBook.key] || currentBook.name.fa : currentBook.name.en)} - فصل {selectedChapter}
                  </span>
                </div>
              </>
            )}
          </div>
        </div >
      </div >
      {/* Main Content */}
      < div className="max-w-6xl mx-auto px-4 py-6" >
        {/* Step 0: Translation Selection */}
        {/* Step 0: Professional Translation Selection */}
        {step === 'translations' && (
          <div className="space-y-12 animate-fadeIn">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mb-4 drop-shadow-sm">
                {lang === 'fa' ? 'انتخاب ترجمه' : 'Select Translation'}
              </h2>
              <p className="text-gray-600 text-xl font-light">
                {lang === 'fa' ? 'لطفاً نسخه مورد نظر خود را انتخاب کنید' : 'Please select your preferred version'}
              </p>
            </div>

            {/* Persian Translations Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-green-100 rounded-2xl shadow-inner">
                  <span className="text-2xl">🇮🇷</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 border-b-2 border-green-200 pb-2 pr-4 pl-12 inline-block">
                  {lang === 'fa' ? 'ترجمه‌های فارسی' : 'Persian Translations'}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {translations.filter(t => t.language === 'fa').map((t) => (
                  <button
                    key={t.code}
                    onClick={() => handleTranslationSelect(t.code)}
                    className={`
                      group relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 text-right
                      ${selectedTranslation === t.code
                        ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-500 shadow-lg scale-105 ring-2 ring-green-200'
                        : 'bg-white/80 backdrop-blur-md border-white/50 hover:border-green-300 hover:shadow-xl hover:-translate-y-1'}
                    `}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-green-500 transform origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-300"></div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                        {t.code}
                      </span>
                      {t.hasAudio && (
                        <span className="bg-blue-100 text-blue-700 p-1 rounded-full" title="دارای فایل صوتی">
                          <Volume2 className="w-3 h-3" />
                        </span>
                      )}
                      {t.isDefault && (
                        <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          ★ {lang === 'fa' ? 'پیش‌فرض' : 'Default'}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-green-700 transition-colors">
                      {lang === 'fa' ? t.name.fa : t.name.en}
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed opacity-90 group-hover:opacity-100">
                      {lang === 'fa' ? t.description.fa : t.description.en}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* English Translations Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-100 rounded-2xl shadow-inner">
                  <span className="text-2xl">🇺🇸</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-200 pb-2 pr-4 pl-12 inline-block">
                  {lang === 'fa' ? 'ترجمه‌های انگلیسی' : 'English Translations'}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {translations.filter(t => t.language === 'en').map((t) => (
                  <button
                    key={t.code}
                    onClick={() => handleTranslationSelect(t.code)}
                    className={`
                      group relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 text-left
                      ${selectedTranslation === t.code
                        ? 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-500 shadow-lg scale-105 ring-2 ring-blue-200'
                        : 'bg-white/80 backdrop-blur-md border-white/50 hover:border-blue-300 hover:shadow-xl hover:-translate-y-1'}
                    `}
                  >
                    <div className="absolute top-0 right-0 w-1 h-full bg-blue-500 transform origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-300"></div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                        {t.code}
                      </span>
                      {t.hasAudio && (
                        <span className="bg-blue-100 text-blue-700 p-1 rounded-full" title="Audio Available">
                          <Volume2 className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">
                      {t.name.en}
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed opacity-90 group-hover:opacity-100">
                      {t.description.en}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Step 1: Modern Book Selection */}
        {
          step === 'books' && (
            <div className="space-y-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100 p-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mb-3">
                    انتخاب کتاب
                  </h2>
                  <p className="text-gray-600 text-lg">
                    {books.length} کتاب در دسترس است
                  </p>
                </div>
                {/* Old Testament */}
                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full"></div>
                    <h3 className="text-2xl font-bold text-gray-800">عهد عتیق</h3>
                    <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">
                      {books.filter(book => book.testament === 'OT').length} کتاب
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {books.filter(book => book.testament === 'OT').map((book) => (
                      <button
                        key={book.key}
                        onClick={() => handleBookSelect(book.key)}
                        className="group relative p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl hover:border-amber-400 hover:shadow-md transition-all duration-300 text-center"
                      >
                        {book.hasAudio && (
                          <div className="absolute top-2 right-2 text-amber-600 opacity-50 group-hover:opacity-100 transition-opacity">
                            <Volume2 size={14} />
                          </div>
                        )}
                        <div className="font-bold text-gray-800 mb-2 group-hover:text-amber-700 transition-colors">
                          {lang === 'fa' ? persianBookNames[book.key] || book.name.fa : book.name.en}
                        </div>
                        <div className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                          {book.chapters} فصل
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                {/* New Testament */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></div>
                    <h3 className="text-2xl font-bold text-gray-800">عهد جدید</h3>
                    <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                      {books.filter(book => book.testament === 'NT').length} کتاب
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {books.filter(book => book.testament === 'NT').map((book) => (
                      <button
                        key={book.key}
                        onClick={() => handleBookSelect(book.key)}
                        className="group relative p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all duration-300 text-center"
                      >
                        {book.hasAudio && (
                          <div className="absolute top-2 right-2 text-blue-600 opacity-50 group-hover:opacity-100 transition-opacity">
                            <Volume2 size={14} />
                          </div>
                        )}
                        <div className="font-bold text-gray-800 mb-2 group-hover:text-blue-700 transition-colors">
                          {lang === 'fa' ? persianBookNames[book.key] || book.name.fa : book.name.en}
                        </div>
                        <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {book.chapters} فصل
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        }
        {/* Step 3: Reading View (Book or Karaoke) */}
        {
          step === 'reading' && (
            viewMode === 'karaoke' ? (
              <BibleKaraokeView
                verses={verses.map(v => {
                  const text = lang === 'fa' ? (v.text.fa || v.text.en) : (v.text.en || v.text.fa);
                  return {
                    number: v.number,
                    text: text,
                    words: text.split(/\s+/).filter(w => w.length > 0)
                  };
                })}
                audioUrl={chapterAudioUrl || `${BIBLE_AUDIO_BASE_URL}/${lang}/${selectedBookKey}/${selectedChapter}.mp3`}
                timingUrl={chapterTimingUrl || `${BIBLE_TIMING_BASE_URL}/${lang}/${selectedBookKey}/${selectedChapter}.json`}
                onPlayStateChange={(playing) => {
                  setIsPlaying(playing);
                  if (playing && audioRef.current) {
                    // Ensure main audio ref is paused if karaoke is playing
                    audioRef.current.pause();
                  }
                }}
                lang={lang}
              />
            ) : (
              <FlipBookBible
                verses={verses}
                currentBook={currentBook}
                selectedChapter={selectedChapter}
                maxChapters={maxChapters}
                isBilingual={isBilingual}
                fontSize={fontSize}
                isPlaying={isPlaying}
                currentVerse={currentVerse}
                onChapterChange={handleChapterChange}
                onBilingualToggle={() => {
                  if (lang === 'fa') {
                    setIsBilingual(!isBilingual)
                  }
                }}
                onFontSizeChange={setFontSize}
                onPlay={speakChapter}
                onStop={() => {
                  // ❌ TTS DISABLED - فقط audio از Hidrive
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                  }
                  setIsPlaying(false);
                  setCurrentVerse(null);
                }}
                onPrevChapter={goToPrevChapter}
                onNextChapter={goToNextChapter}
                onLanguageChange={setLang}
                lang={lang}
                persianBookNames={persianBookNames}
              />
            )
          )
        }
      </div>
    </div>
  );
};

export default UnifiedBibleReader;
