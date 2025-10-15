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
  Globe
} from 'lucide-react';
import { api } from '../lib/api';

interface BibleBook {
  key: string;
  name: { en: string; fa: string };
  chapters: number;
  testament: 'OT' | 'NT';
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
}

const UnifiedBibleReader: React.FC = () => {
  const { lang } = useLanguage();
  
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
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);  // Start with loading
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'translations' | 'books' | 'chapters' | 'reading'>('translations');
  
  // Settings
  const [fontSize, setFontSize] = useState(18);
  const [isBilingual, setIsBilingual] = useState(false);
  
  // Audio
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVerse, setCurrentVerse] = useState<number | null>(null);

  // Load translations on mount
  useEffect(() => {
    loadTranslations();
  }, []);

  // Load books when translation selected
  useEffect(() => {
    if (selectedTranslation) {
      loadBooks();
    }
  }, [selectedTranslation]);

  // Load verses when book/chapter selected
  useEffect(() => {
    if (selectedBookKey && selectedChapter && selectedTranslation) {
      loadVerses();
    }
  }, [selectedBookKey, selectedChapter, selectedTranslation]);

  const loadTranslations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Fetching translations...');
      const response = await fetch('/api/bible/translations');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Translations loaded:', data);
      
      if (data.success && data.translations) {
        setTranslations(data.translations);
        setStep('translations');
      } else {
        throw new Error('Invalid API response');
      }
      
    } catch (err: any) {
      const errorMessage = `خطا در بارگذاری ترجمه‌ها: ${err.message}`;
      setError(errorMessage);
      console.error('❌ Error loading translations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Fetching books for translation:', selectedTranslation);
      const response = await fetch('/api/bible/books');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Books loaded:', data);
      
      if (data.success && data.books) {
        setBooks(data.books);
        setStep('books');
      } else {
        throw new Error('Invalid API response for books');
      }
      
    } catch (err: any) {
      const errorMessage = `خطا در بارگذاری کتاب‌ها: ${err.message}`;
      setError(errorMessage);
      console.error('❌ Error loading books:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadVerses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/bible/content/${selectedBookKey}/${selectedChapter}?translation=${selectedTranslation}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Verses loaded:', data);
      
      if (data.success && data.verses) {
        const formattedVerses: BibleVerse[] = data.verses.fa.map((text: string, index: number) => ({
          number: index + 1,
          text: {
            fa: text,
            en: data.verses.en?.[index] || text
          }
        }));
        
        setVerses(formattedVerses);
        setStep('reading');
      } else {
        throw new Error('Invalid API response for verses');
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
    setSelectedBookKey('');
    setSelectedChapter(1);
    setVerses([]);
    console.log('🔄 ترجمه انتخاب شد:', translationCode);
  };

  const handleBookSelect = (bookKey: string) => {
    setSelectedBookKey(bookKey);
    setSelectedChapter(1);
    setVerses([]);
    console.log('📖 کتاب انتخاب شد:', bookKey);
  };

  const handleChapterChange = (chapter: number) => {
    setSelectedChapter(chapter);
    setVerses([]);
    console.log('📄 فصل انتخاب شد:', chapter);
  };

  // Audio functions
  const speakChapter = () => {
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setCurrentVerse(null);
      } else {
        const text = verses.map(v => `${v.number}. ${v.text[lang]}`).join(' ');
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'fa' ? 'fa-IR' : 'en-US';
        utterance.rate = 0.9;
        utterance.onend = () => {
          setIsPlaying(false);
          setCurrentVerse(null);
        };
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    }
  };

  // Navigation
  const currentBook = books.find(b => b.key === selectedBookKey);
  const maxChapters = currentBook?.chapters || 1;
  
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

  // Loading Display
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Debug log
  console.log('🔄 UnifiedBibleReader render:', { 
    step, 
    translations: translations.length, 
    books: books.length, 
    error, 
    isLoading 
  });

  // Simple fallback for testing
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
          خطا: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Debug info */}
      <div className="bg-yellow-100 p-2 text-xs">
        Debug: Step={step}, Translations={translations.length}, Books={books.length}, Error={error}, Loading={isLoading}
      </div>
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                {lang === 'fa' ? 'کتاب مقدس' : 'Holy Bible'}
              </h1>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Font Size Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFontSize(Math.max(fontSize - 2, 14))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="کوچک‌تر"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-sm px-2">{fontSize}</span>
                <button
                  onClick={() => setFontSize(Math.min(fontSize + 2, 32))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="بزرگ‌تر"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>

              {/* Bilingual Toggle */}
              <button
                onClick={() => setIsBilingual(!isBilingual)}
                className={`p-2 rounded-lg ${isBilingual ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                title="نمایش دو زبانه"
              >
                <Globe className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
            <button 
              onClick={resetToTranslations}
              className="hover:text-blue-600"
            >
              انتخاب ترجمه
            </button>
            {selectedTranslation && (
              <>
                <ChevronLeft className="w-4 h-4" />
                <button 
                  onClick={backToBooks}
                  className="hover:text-blue-600"
                >
                  انتخاب کتاب
                </button>
              </>
            )}
            {selectedBookKey && (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>
                  {currentBook && (lang === 'fa' ? persianBookNames[currentBook.key] || currentBook.name.fa : currentBook.name.en)} - فصل {selectedChapter}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Step 1: Translation Selection */}
        {step === 'translations' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">انتخاب ترجمه</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {translations.map((translation) => (
                <button
                  key={translation.code}
                  onClick={() => handleTranslationSelect(translation.code)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left"
                >
                  <div className="font-semibold text-gray-900">
                    {translation.name[lang]}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    زبان: {translation.language}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Book Selection */}
        {step === 'books' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">انتخاب کتاب</h2>
            
            {/* Old Testament */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">عهد عتیق</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {books.filter(book => book.testament === 'OT').map((book) => (
                  <button
                    key={book.key}
                    onClick={() => handleBookSelect(book.key)}
                    className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-sm"
                  >
                    <div className="font-medium">
                      {lang === 'fa' ? persianBookNames[book.key] || book.name.fa : book.name.en}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {book.chapters} فصل
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* New Testament */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-700">عهد جدید</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {books.filter(book => book.testament === 'NT').map((book) => (
                  <button
                    key={book.key}
                    onClick={() => handleBookSelect(book.key)}
                    className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-sm"
                  >
                    <div className="font-medium">
                      {lang === 'fa' ? persianBookNames[book.key] || book.name.fa : book.name.en}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {book.chapters} فصل
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Chapter Navigation & Reading */}
        {step === 'reading' && (
          <div className="space-y-6">
            
            {/* Chapter Navigation */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold">
                    {currentBook && (lang === 'fa' ? persianBookNames[currentBook.key] || currentBook.name.fa : currentBook.name.en)}
                  </h2>
                  <select
                    value={selectedChapter}
                    onChange={(e) => handleChapterChange(Number(e.target.value))}
                    className="px-3 py-1 border border-gray-300 rounded-lg"
                  >
                    {Array.from({ length: maxChapters }, (_, i) => i + 1).map(ch => (
                      <option key={ch} value={ch}>
                        فصل {ch}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Audio Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={speakChapter}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlaying ? 'متوقف' : 'پخش'}
                  </button>
                  
                  {isPlaying && (
                    <button
                      onClick={() => {
                        window.speechSynthesis.cancel();
                        setIsPlaying(false);
                        setCurrentVerse(null);
                      }}
                      className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Chapter Navigation Arrows */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <button
                  onClick={goToPrevChapter}
                  disabled={selectedChapter <= 1}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                  فصل قبل
                </button>
                
                <span className="text-sm text-gray-600">
                  فصل {selectedChapter} از {maxChapters}
                </span>
                
                <button
                  onClick={goToNextChapter}
                  disabled={selectedChapter >= maxChapters}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  فصل بعد
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Verses Display */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-4" style={{ fontSize: `${fontSize}px` }}>
                {verses.map((verse) => (
                  <div
                    key={verse.number}
                    className={`
                      p-4 rounded-lg transition-colors
                      ${currentVerse === verse.number ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}
                    `}
                  >
                    {isBilingual ? (
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <span className="text-blue-600 font-bold min-w-[2rem]">
                            {verse.number}
                          </span>
                          <p className="text-gray-800 leading-relaxed" dir="rtl">
                            {verse.text.fa}
                          </p>
                        </div>
                        <div className="flex items-start gap-3 pl-8">
                          <p className="text-gray-600 leading-relaxed text-sm" dir="ltr">
                            {verse.text.en}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <span className="text-blue-600 font-bold min-w-[2rem]">
                          {verse.number}
                        </span>
                        <p 
                          className="text-gray-800 leading-relaxed" 
                          dir={lang === 'fa' ? 'rtl' : 'ltr'}
                        >
                          {verse.text[lang]}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedBibleReader;