import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { BookOpen, ChevronLeft, ChevronRight, Search, Volume2, Play, Pause, Square } from 'lucide-react';
import { getOldTestamentBooks, getNewTestamentBooks } from '../lib/localBibleData';
import TextToSpeech from './TextToSpeech';
import useBibleTTS from '../hooks/useBibleTTS';

interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: { en: string; fa: string };
}

interface BibleChapter {
  book: string;
  chapter: number;
  verses: BibleVerse[];
}

const BibleReader = () => {
  const { lang } = useLanguage();
  const [selectedBook, setSelectedBook] = useState('Genesis');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [verses, setVerses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentVersePlaying, setCurrentVersePlaying] = useState(null);
  const [showTTSControls, setShowTTSControls] = useState(false);
  
  const {
    isPlaying,
    currentVerse,
    speakVerse,
    speakChapter,
    pauseSpeech,
    resumeSpeech,
    stopSpeech,
    isSupported
  } = useBibleTTS();

  const oldTestamentBooks = getOldTestamentBooks();
  const newTestamentBooks = getNewTestamentBooks();
  const allBooks = [...oldTestamentBooks, ...newTestamentBooks];

  // Sample verses for Genesis 1
  const sampleVerses: BibleVerse[] = [
    {
      book: 'Genesis',
      chapter: 1,
      verse: 1,
      text: {
        en: 'In the beginning God created the heavens and the earth.',
        fa: 'در ابتدا خدا آسمانها و زمین را آفرید.'
      }
    },
    {
      book: 'Genesis',
      chapter: 1,
      verse: 2,
      text: {
        en: 'Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.',
        fa: 'و زمین بی‌صورت و خالی بود و تاریکی بر وجه لجه بود و روح خدا بر سطح آبها حوم می‌کرد.'
      }
    },
    {
      book: 'Genesis',
      chapter: 1,
      verse: 3,
      text: {
        en: 'And God said, "Let there be light," and there was light.',
        fa: 'و خدا گفت: «نور بشود.» و نور شد.'
      }
    },
    {
      book: 'Genesis',
      chapter: 1,
      verse: 4,
      text: {
        en: 'God saw that the light was good, and he separated the light from the darkness.',
        fa: 'و خدا نور را دید که نیکوست. و خدا در میان نور و تاریکی تمیز کرد.'
      }
    },
    {
      book: 'Genesis',
      chapter: 1,
      verse: 5,
      text: {
        en: 'God called the light "day," and the darkness he called "night." And there was evening, and there was morning—the first day.',
        fa: 'و خدا نور را روز نامید و تاریکی را شب نامید. پس شام بود و صبح بود، روز اول.'
      }
    }
  ];

  // Fetch verses from Bible API
  useEffect(() => {
    const fetchBibleContent = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/bible/content/${selectedBook}/${selectedChapter}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch chapter: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.verses) {
          // Transform API response to component format
          const versesData = [];
          const versesEn = data.verses.en || [];
          const versesFa = data.verses.fa || [];
          
          for (let i = 0; i < Math.max(versesEn.length, versesFa.length); i++) {
            versesData.push({
              book: selectedBook,
              chapter: selectedChapter,
              verse: i + 1,
              text: {
                en: versesEn[i] || `Verse ${i + 1} (English translation pending)`,
                fa: versesFa[i] || `آیه ${i + 1} (ترجمه فارسی در حال تکمیل)`
              }
            });
          }
          
          setVerses(versesData);
        } else {
          throw new Error(data.message || 'Failed to load Bible content');
        }
      } catch (err) {
        console.error('Error fetching Bible content:', err);
        setError(err.message);
        // Fallback to sample data for Genesis 1
        if (selectedBook === 'Genesis' && selectedChapter === 1) {
          setVerses(sampleVerses);
        } else {
          setVerses([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBibleContent();
  }, [selectedBook, selectedChapter]);

  const currentBook = allBooks.find(book => book.name.en === selectedBook);
  const maxChapters = currentBook?.chapters || 1;

  const filteredVerses = verses.filter(verse =>
    verse.text[lang].toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navigateChapter = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else if (direction === 'next' && selectedChapter < maxChapters) {
      setSelectedChapter(selectedChapter + 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {lang === 'fa' ? 'کتاب مقدس آنلاین' : 'Online Bible'}
        </h1>
        <p className="text-lg text-gray-600">
          {lang === 'fa' 
            ? 'کتاب مقدس کامل را آنلاین مطالعه کنید' 
            : 'Study the complete Bible online'
          }
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Book Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {lang === 'fa' ? 'کتاب' : 'Book'}
            </label>
            <select
              value={selectedBook}
              onChange={(e) => {
                setSelectedBook(e.target.value);
                setSelectedChapter(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <optgroup label={lang === 'fa' ? 'عهد عتیق' : 'Old Testament'}>
                {oldTestamentBooks.map(book => (
                  <option key={book.id} value={book.name.en}>
                    {book.name[lang]}
                  </option>
                ))}
              </optgroup>
              <optgroup label={lang === 'fa' ? 'عهد جدید' : 'New Testament'}>
                {newTestamentBooks.map(book => (
                  <option key={book.id} value={book.name.en}>
                    {book.name[lang]}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Chapter Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {lang === 'fa' ? 'فصل' : 'Chapter'}
            </label>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateChapter('prev')}
                disabled={selectedChapter <= 1}
                className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(parseInt(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: maxChapters }, (_, i) => i + 1).map(chapter => (
                  <option key={chapter} value={chapter}>
                    {lang === 'fa' ? `فصل ${chapter}` : `Chapter ${chapter}`}
                  </option>
                ))}
              </select>
              <button
                onClick={() => navigateChapter('next')}
                disabled={selectedChapter >= maxChapters}
                className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {lang === 'fa' ? 'جستجو' : 'Search'}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={lang === 'fa' ? 'جستجو در آیات...' : 'Search verses...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
        </div>
      </div>

      {/* Bible Text */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center">
            <BookOpen className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">
              {currentBook?.name[lang]} {lang === 'fa' ? `فصل ${selectedChapter}` : `Chapter ${selectedChapter}`}
            </h2>
          </div>
          
          {/* TTS Controls */}
          {isSupported && verses.length > 0 && (
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <button
                onClick={() => setShowTTSControls(!showTTSControls)}
                className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                title={lang === 'fa' ? 'کنترل‌های صوتی' : 'Audio Controls'}
              >
                <Volume2 className="h-5 w-5" />
              </button>
              
              {!isPlaying ? (
                <button
                  onClick={() => {
                    const chapterText = verses.map(v => v.text[lang]).join(' ');
                    speakChapter(verses.map(v => ({ text: v.text[lang], number: v.verse })), lang);
                  }}
                  className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                  title={lang === 'fa' ? 'خواندن کل فصل' : 'Read Entire Chapter'}
                >
                  <Play className="h-5 w-5" />
                </button>
              ) : (
                <button
                  onClick={pauseSpeech}
                  className="p-2 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
                  title={lang === 'fa' ? 'مکث' : 'Pause'}
                >
                  <Pause className="h-5 w-5" />
                </button>
              )}
              
              <button
                onClick={stopSpeech}
                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                title={lang === 'fa' ? 'توقف' : 'Stop'}
              >
                <Square className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Advanced TTS Controls */}
        {showTTSControls && isSupported && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-3">
              {lang === 'fa' ? 'تنظیمات صوتی' : 'Audio Settings'}
            </h3>
            <TextToSpeech
              text={verses.map(v => v.text[lang]).join(' ')}
              language={lang}
              showControls={true}
              className="mb-4"
            />
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">{lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">
              {lang === 'fa' ? 'خطا در بارگذاری:' : 'Error loading:'} {error}
            </p>
          </div>
        )}

        {/* Verses */}
        {!isLoading && !error && (
          <div className="space-y-4" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            {filteredVerses.map(verse => (
              <div 
                key={`${verse.book}-${verse.chapter}-${verse.verse}`} 
                className={`group ${
                  currentVerse?.number === verse.verse ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                }`}
              >
                <div className="flex items-start space-x-4 rtl:space-x-reverse p-4 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {verse.verse}
                  </span>
                  <div className="flex-1">
                    <p className={`text-gray-800 leading-relaxed text-lg ${
                      currentVerse?.number === verse.verse ? 'font-medium text-yellow-900' : ''
                    }`}>
                      {verse.text[lang]}
                    </p>
                    
                    {/* Individual Verse TTS Controls */}
                    {isSupported && (
                      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => speakVerse(verse.text[lang], verse.verse, lang)}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                          title={lang === 'fa' ? 'خواندن این آیه' : 'Read this verse'}
                        >
                          <Play className="h-3 w-3 inline mr-1" />
                          {lang === 'fa' ? 'خواندن' : 'Read'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredVerses.length === 0 && searchTerm && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {lang === 'fa' ? 'آیه‌ای یافت نشد' : 'No verses found'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={() => navigateChapter('prev')}
          disabled={selectedChapter <= 1}
          className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          {lang === 'fa' ? 'فصل قبل' : 'Previous Chapter'}
        </button>

        <span className="text-sm text-gray-500">
          {lang === 'fa' 
            ? `فصل ${selectedChapter} از ${maxChapters}` 
            : `Chapter ${selectedChapter} of ${maxChapters}`
          }
        </span>

        <button
          onClick={() => navigateChapter('next')}
          disabled={selectedChapter >= maxChapters}
          className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {lang === 'fa' ? 'فصل بعد' : 'Next Chapter'}
          <ChevronRight className="h-5 w-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default BibleReader;