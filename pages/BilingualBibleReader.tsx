// BilingualBibleReader.tsx
// ------------------------------------------------------------
// Advanced Bible reader with multiple translations support
// Supports: Ghadim (قدیم), Mojdeh (مژده), Tafsiri (تفسیری), English
// Audio available for: OT (Old Testament), NT with Mojdeh, NT all translations
// ------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { BookOpen, Volume2, Languages, ChevronDown } from 'lucide-react';
import BilingualBiblePresentation, { BiblePayload, Chapter, Verse } from '@/components/BilingualBiblePresentation';

interface Translation {
  id: string;
  name_fa: string;
  name_en: string;
  code: string; // 'ghadim', 'mojdeh', 'tafsiri_ot', 'tafsiri_nt', 'english'
  hasAudio: boolean;
  audioCondition?: string; // 'OT', 'NT', 'ALL'
}

interface BibleData {
  versions: Record<string, any>;
  books_info: Record<string, {
    en: string;
    fa: string;
    chapters: number;
    testament: 'OT' | 'NT';
  }>;
  bible_text: Record<string, Record<string, Record<string, {
    fa: Record<string, string>;
    en?: Record<string, string>;
  }>>>;
  audio_files?: Record<string, Record<string, Record<string, any[]>>>;
}

const TRANSLATIONS: Translation[] = [
  {
    id: 'ghadim',
    name_fa: 'ترجمۀ قدیم',
    name_en: 'Old Translation',
    code: 'ghadim',
    hasAudio: true,
    audioCondition: 'OT' // فقط عهد قدیم
  },
  {
    id: 'mojdeh',
    name_fa: 'ترجمۀ مژده',
    name_en: 'Mojdeh Translation',
    code: 'mojdeh',
    hasAudio: true,
    audioCondition: 'ALL' // عهد قدیم و جدید
  },
  {
    id: 'tafsiri',
    name_fa: 'ترجمۀ تفسیری',
    name_en: 'Interpretive Translation',
    code: 'tafsiri_ot',
    hasAudio: false,
    audioCondition: undefined
  },
  {
    id: 'english',
    name_fa: 'ترجمۀ انگلیسی',
    name_en: 'English Translation (NMV)',
    code: 'english',
    hasAudio: true,
    audioCondition: 'NT' // فقط عهد جدید
  }
];

const BilingualBibleReader: React.FC = () => {
  const [bibleData, setBibleData] = useState<BibleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedTranslation, setSelectedTranslation] = useState<Translation>(TRANSLATIONS[1]); // مژده به عنوان پیش‌فرض
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [showPresentation, setShowPresentation] = useState(false);
  
  const [presentationData, setPresentationData] = useState<BiblePayload | null>(null);

  // Load bible_data.json
  useEffect(() => {
    const loadBibleData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/bible_data.json?v=' + Date.now());
        if (!response.ok) throw new Error('Failed to load Bible data');
        
        const data = await response.json();
        console.log('📖 Bible data loaded:', data);
        setBibleData(data);
        
        // انتخاب اولین کتاب به عنوان پیش‌فرض
        const firstBook = Object.keys(data.books_info)[0];
        setSelectedBook(firstBook);
        
      } catch (err) {
        console.error('❌ Error loading Bible data:', err);
        setError('خطا در بارگذاری داده‌های کتاب مقدس');
      } finally {
        setLoading(false);
      }
    };

    loadBibleData();
  }, []);

  // Get books for selected translation
  const getAvailableBooks = () => {
    if (!bibleData) return [];
    
    const testament = selectedTranslation.audioCondition;
    
    return Object.entries(bibleData.books_info)
      .filter(([_, bookInfo]) => {
        const info = bookInfo as { en: string; fa: string; chapters: number; testament: 'OT' | 'NT' };
        if (testament === 'OT') return info.testament === 'OT';
        if (testament === 'NT') return info.testament === 'NT';
        return true; // ALL
      })
      .map(([code, bookInfo]) => {
        const info = bookInfo as { en: string; fa: string; chapters: number; testament: 'OT' | 'NT' };
        return {
          code,
          name_en: info.en,
          name_fa: info.fa,
          chapters: info.chapters,
          testament: info.testament,
          hasAudio: selectedTranslation.hasAudio && (
            selectedTranslation.audioCondition === 'ALL' ||
            (selectedTranslation.audioCondition === 'OT' && info.testament === 'OT') ||
            (selectedTranslation.audioCondition === 'NT' && info.testament === 'NT')
          )
        };
      });
  };

  // Load chapter data
  const loadChapter = () => {
    if (!bibleData || !selectedBook) return;

    try {
      const bookInfo = bibleData.books_info[selectedBook];
      
      // Map translation code to data structure key
      let translationKey = selectedTranslation.code;
      if (selectedTranslation.code === 'tafsiri') {
        translationKey = bookInfo.testament === 'OT' ? 'tafsiri_ot' : 'tafsiri_nt';
      }
      
      // Get chapter data
      const chapterData = bibleData.bible_text[translationKey]?.[selectedBook]?.[selectedChapter.toString()];
      
      if (!chapterData || !chapterData.fa) {
        alert('این فصل در ترجمۀ انتخاب شده موجود نیست');
        return;
      }

      // Convert to verses array
      const verses: Verse[] = Object.keys(chapterData.fa).map(verseNum => ({
        verseNumber: parseInt(verseNum),
        text_fa: chapterData.fa[verseNum] || '',
        text_en: chapterData.en?.[verseNum] || chapterData.fa[verseNum] // اگر انگلیسی نباشد، فارسی نمایش بده
      }));

      // Get audio URL if available
      let audioUrl: string | undefined = undefined;
      const hasAudio = selectedTranslation.hasAudio && (
        selectedTranslation.audioCondition === 'ALL' ||
        (selectedTranslation.audioCondition === 'OT' && bookInfo.testament === 'OT') ||
        (selectedTranslation.audioCondition === 'NT' && bookInfo.testament === 'NT')
      );

      if (hasAudio && bibleData.audio_files) {
        const audioInfo = bibleData.audio_files['118']?.[selectedBook]?.[selectedChapter.toString()];
        if (audioInfo && audioInfo.length > 0) {
          // Find appropriate audio based on translation
          let audioTrack;
          if (selectedTranslation.code === 'english') {
            audioTrack = audioInfo.find(a => a.title?.includes('New') || a.title?.includes('Millenium'));
          } else {
            audioTrack = audioInfo.find(a => a.title?.includes('ترجمۀ') || a.title?.includes('هزارۀ'));
          }
          
          if (audioTrack?.download_urls?.format_mp3_32k) {
            audioUrl = 'https:' + audioTrack.download_urls.format_mp3_32k;
          }
        }
      }

      const payload: BiblePayload = {
        book_en: bookInfo.en,
        book_fa: bookInfo.fa,
        translation_name: {
          en: selectedTranslation.name_en,
          fa: selectedTranslation.name_fa
        },
        chapters: [{
          chapterNumber: selectedChapter,
          verses: verses
        }]
      };

      console.log('📚 Presentation payload:', payload);
      setPresentationData(payload);
      setShowPresentation(true);

    } catch (err) {
      console.error('❌ Error loading chapter:', err);
      alert('خطا در بارگذاری فصل');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center text-red-400">
          <p className="text-xl font-bold mb-2">❌ خطا</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (showPresentation && presentationData) {
    return (
      <div className="relative bg-black">
        <button
          onClick={() => setShowPresentation(false)}
          className="absolute top-4 right-4 z-50 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg border border-gray-600"
        >
          🔙 بازگشت
        </button>
        <BilingualBiblePresentation 
          data={presentationData} 
          autoStart={false}
        />
      </div>
    );
  }

  const availableBooks = getAvailableBooks();

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <BookOpen className="text-blue-400" size={36} />
            کتاب مقدس
          </h1>
          <p className="text-gray-400">Bible Reader - Multiple Translations</p>
        </div>

        {/* Selection Panel */}
        <div className="bg-gray-800 rounded-lg shadow-2xl p-6 mb-6">
          <div className="space-y-5">
            {/* Translation Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <Languages size={18} className="text-purple-400" />
                انتخاب ترجمه / Select Translation
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TRANSLATIONS.map(trans => (
                  <button
                    key={trans.id}
                    onClick={() => {
                      setSelectedTranslation(trans);
                      setSelectedBook('');
                      setSelectedChapter(1);
                    }}
                    className={`p-3 rounded-lg font-semibold transition-all ${
                      selectedTranslation.id === trans.id
                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-sm">{trans.name_fa}</p>
                      {trans.hasAudio && (
                        <div className="flex items-center justify-center gap-1 mt-1 text-green-400 text-xs">
                          <Volume2 size={12} />
                          <span>
                            {trans.audioCondition === 'ALL' && 'همه'}
                            {trans.audioCondition === 'OT' && 'عهد قدیم'}
                            {trans.audioCondition === 'NT' && 'عهد جدید'}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Book Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                📚 انتخاب کتاب / Select Book
              </label>
              <select
                value={selectedBook}
                onChange={(e) => {
                  setSelectedBook(e.target.value);
                  setSelectedChapter(1);
                }}
                className="w-full p-3 bg-gray-700 text-white border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                dir="rtl"
              >
                <option value="">-- انتخاب کنید --</option>
                {availableBooks.map(book => (
                  <option key={book.code} value={book.code}>
                    {book.name_fa} / {book.name_en} 
                    {book.hasAudio && ' 🎵'}
                    {' (' + book.chapters + ' فصل)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter Selection */}
            {selectedBook && (
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  📖 شماره فصل / Chapter Number
                </label>
                <input
                  type="number"
                  min="1"
                  max={bibleData?.books_info[selectedBook]?.chapters || 1}
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(parseInt(e.target.value) || 1)}
                  className="w-full p-3 bg-gray-700 text-white border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}

            {/* Load Button */}
            <button
              onClick={loadChapter}
              disabled={!selectedBook}
              className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${
                selectedBook
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              🔄 بارگذاری و نمایش
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-5">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <Volume2 size={20} className="text-blue-400" />
            اطلاعات فایل‌های صوتی
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>✅ <strong className="text-white">ترجمۀ قدیم:</strong> فقط عهد قدیم دارای صدا</li>
            <li>✅ <strong className="text-white">ترجمۀ مژده:</strong> عهد قدیم و جدید دارای صدا</li>
            <li>❌ <strong className="text-white">ترجمۀ تفسیری:</strong> بدون صدا (فقط متن)</li>
            <li>✅ <strong className="text-white">ترجمۀ انگلیسی:</strong> فقط عهد جدید دارای صدا</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BilingualBibleReader;
