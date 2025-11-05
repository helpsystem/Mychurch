// BibleStudyPage.tsx
// ------------------------------------------------------------
// صفحه کامل مطالعه کتاب مقدس با قابلیت‌های زیر:
// - انتخاب کتاب، فصل، آیه از منو
// - چند ترجمه (مژده، قدیم، تفسیری + انگلیسی)
// - نمایش متن در دو زبان (side by side)
// - پخش صوت با هایلایت (کارائوکه)
// - نمایش responsive برای موبایل و دسکتاپ
// ------------------------------------------------------------

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import axios from 'axios';

// ---------- Types ----------
interface BibleBook {
  key: string;
  name: { en: string; fa: string };
  chapters: number;
  testament: 'OT' | 'NT';
}

interface BibleContent {
  book: {
    key: string;
    name: { en: string; fa: string };
  };
  chapter: number;
  verses: {
    fa: string[];  
    en: string[];  
  };
  translation: string;
  note?: string;
}

const TRANSLATIONS_FA = [
  { key: 'mojdeh', name: 'مژده (هزارۀ نو)' },
  { key: 'qadim', name: 'قدیم' },
  { key: 'tafsiri', name: 'تفسیری' }
];

const TRANSLATIONS_EN = [
  { key: 'nmv', name: 'NMV' }
];

// Books with available audio
const BOOKS_WITH_AUDIO = ['GEN']; // Will expand as more books are generated

const BibleStudyPage: React.FC = () => {
  const { lang } = useLanguage();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // State
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>('GEN');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedVerse, setSelectedVerse] = useState<number>(1);
  const [selectedTranslationFa, setSelectedTranslationFa] = useState<string>('mojdeh');
  const [selectedTranslationEn, setSelectedTranslationEn] = useState<string>('nmv');
  const [content, setContent] = useState<BibleContent | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showTranslations, setShowTranslations] = useState<boolean>(false);
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playingVerse, setPlayingVerse] = useState<number | null>(null);
  const [autoPlayChapter, setAutoPlayChapter] = useState<boolean>(false);
  const audioAvailable = BOOKS_WITH_AUDIO.includes(selectedBook);

  // Load books
  useEffect(() => {
    loadBooks();
  }, []);

  // Load content
  useEffect(() => {
    if (selectedBook && selectedChapter) {
      loadContent();
    }
  }, [selectedBook, selectedChapter]);

  const loadBooks = async () => {
    try {
      const response = await axios.get('/api/bible/books');
      if (response.data.success) {
        setBooks(response.data.books);
      }
    } catch (err) {
      console.error('Error loading books:', err);
    }
  };

  const loadContent = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`/api/bible/content/${selectedBook}/${selectedChapter}`);
      setContent(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading content:', err);
      setError(lang === 'fa' ? 'خطا در بارگذاری محتوا' : 'Error loading content');
      setLoading(false);
    }
  };

  const getAudioUrl = (book: string, chapter: number, verse: number) => {
    return `/public/audio/bible/edge-tts/${book}/${chapter}/${verse}.mp3`;
  };

  const playVerse = (verseNum: number) => {
    if (!audioRef.current) return;
    
    const audioUrl = getAudioUrl(selectedBook, selectedChapter, verseNum);
    audioRef.current.src = audioUrl;
    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
        setPlayingVerse(verseNum);
        setSelectedVerse(verseNum);
      })
      .catch(err => {
        console.error('Error playing audio:', err);
      });
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setPlayingVerse(null);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    
    if (autoPlayChapter && content) {
      if (selectedVerse < content.verses.fa.length) {
        setTimeout(() => {
          playVerse(selectedVerse + 1);
        }, 500);
      } else {
        setAutoPlayChapter(false);
        setPlayingVerse(null);
      }
    } else {
      setPlayingVerse(null);
    }
  };

  const playFullChapter = () => {
    setAutoPlayChapter(true);
    playVerse(1);
  };

  const getChapterOptions = () => {
    const book = books.find(b => b.key === selectedBook);
    if (!book) return [];
    return Array.from({ length: book.chapters }, (_, i) => i + 1);
  };

  const currentBook = books.find(b => b.key === selectedBook);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-2xl">
          <h1 className="text-4xl font-bold text-white text-center mb-2">
            {lang === 'fa' ? '📖 مطالعه کتاب مقدس' : '📖 Bible Study'}
          </h1>
          <p className="text-white/80 text-center">
            {lang === 'fa' 
              ? 'خواندن، گوش دادن و مطالعه کلام خدا' 
              : 'Read, Listen and Study the Word of God'}
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-2xl">
          
          {/* Book, Chapter, Verse Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            
            {/* Book */}
            <div>
              <label className="block text-white font-semibold mb-2">
                📚 {lang === 'fa' ? 'کتاب' : 'Book'}
              </label>
              <select
                value={selectedBook}
                onChange={(e) => {
                  setSelectedBook(e.target.value);
                  setSelectedChapter(1);
                  setSelectedVerse(1);
                  stopAudio();
                }}
                className="w-full px-4 py-3 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                style={{ direction: lang === 'fa' ? 'rtl' : 'ltr' }}
              >
                <optgroup label={lang === 'fa' ? 'عهد عتیق' : 'Old Testament'}>
                  {books.filter(b => b.testament === 'OT').map(book => (
                    <option key={book.key} value={book.key}>
                      {lang === 'fa' ? book.name.fa : book.name.en}
                      {BOOKS_WITH_AUDIO.includes(book.key) && ' 🎵'}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={lang === 'fa' ? 'عهد جدید' : 'New Testament'}>
                  {books.filter(b => b.testament === 'NT').map(book => (
                    <option key={book.key} value={book.key}>
                      {lang === 'fa' ? book.name.fa : book.name.en}
                      {BOOKS_WITH_AUDIO.includes(book.key) && ' 🎵'}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Chapter */}
            <div>
              <label className="block text-white font-semibold mb-2">
                📄 {lang === 'fa' ? 'فصل' : 'Chapter'}
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => {
                  setSelectedChapter(parseInt(e.target.value));
                  setSelectedVerse(1);
                  stopAudio();
                }}
                className="w-full px-4 py-3 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {getChapterOptions().map(ch => (
                  <option key={ch} value={ch}>
                    {lang === 'fa' ? `فصل ${ch}` : `Chapter ${ch}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Verse */}
            <div>
              <label className="block text-white font-semibold mb-2">
                📝 {lang === 'fa' ? 'آیه فعال' : 'Current Verse'}
              </label>
              <div className="text-white text-2xl font-bold text-center bg-white/10 rounded-lg py-2">
                {selectedVerse}
              </div>
            </div>
          </div>

          {/* Translation Toggle */}
          <button
            onClick={() => setShowTranslations(!showTranslations)}
            className="w-full px-4 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all flex items-center justify-center gap-2"
          >
            <span>{showTranslations ? '▲' : '▼'}</span>
            <span>{lang === 'fa' ? 'انتخاب ترجمه' : 'Select Translation'}</span>
          </button>
          
          {showTranslations && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-semibold mb-2">
                  🇮🇷 {lang === 'fa' ? 'ترجمه فارسی' : 'Persian'}
                </label>
                <select
                  value={selectedTranslationFa}
                  onChange={(e) => setSelectedTranslationFa(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 text-white border border-white/30"
                  style={{ direction: 'rtl' }}
                >
                  {TRANSLATIONS_FA.map(tr => (
                    <option key={tr.key} value={tr.key}>{tr.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">
                  🇺🇸 {lang === 'fa' ? 'ترجمه انگلیسی' : 'English'}
                </label>
                <select
                  value={selectedTranslationEn}
                  onChange={(e) => setSelectedTranslationEn(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 text-white border border-white/30"
                >
                  {TRANSLATIONS_EN.map(tr => (
                    <option key={tr.key} value={tr.key}>{tr.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Audio Controls */}
          {audioAvailable && (
            <div className="mt-4 bg-green-500/20 border-2 border-green-500 rounded-xl p-4">
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => playVerse(selectedVerse)}
                  disabled={isPlaying}
                  className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold"
                >
                  ▶️ {lang === 'fa' ? 'پخش آیه' : 'Play Verse'}
                </button>
                
                <button
                  onClick={playFullChapter}
                  disabled={autoPlayChapter}
                  className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold"
                >
                  📖 {lang === 'fa' ? 'پخش کل فصل' : 'Play Chapter'}
                </button>
                
                <button
                  onClick={() => {
                    setAutoPlayChapter(false);
                    stopAudio();
                  }}
                  disabled={!isPlaying}
                  className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold"
                >
                  ⏹️ {lang === 'fa' ? 'توقف' : 'Stop'}
                </button>
              </div>

              {autoPlayChapter && content && (
                <div className="mt-4 bg-white/10 rounded-lg p-3">
                  <div className="flex justify-between text-white text-sm mb-2">
                    <span>{lang === 'fa' ? 'پیشرفت' : 'Progress'}</span>
                    <span>{selectedVerse} / {content.verses.fa.length}</span>
                  </div>
                  <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-green-500 h-full transition-all"
                      style={{ width: `${(selectedVerse / content.verses.fa.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {loading && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/30 border-t-white mx-auto mb-4" />
            <p className="text-white text-xl">{lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 rounded-2xl p-6 text-center border-2 border-red-500">
            <p className="text-white text-xl">❌ {error}</p>
          </div>
        )}

        {!loading && !error && content && (
          <>
            {/* Book Title */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-center mb-6">
              <h2 className="text-3xl font-bold text-white">
                {lang === 'fa' ? content.book.name.fa : content.book.name.en} - 
                {lang === 'fa' ? ` فصل ${content.chapter}` : ` Chapter ${content.chapter}`}
              </h2>
            </div>

            {/* Bilingual Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              
              {/* Persian */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8" dir="rtl">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/30">
                  <h3 className="text-2xl font-bold text-white">🇮🇷 فارسی</h3>
                  <span className="text-white/70 text-sm">
                    {TRANSLATIONS_FA.find(t => t.key === selectedTranslationFa)?.name}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {content.verses.fa.map((verse, i) => {
                    const verseNum = i + 1;
                    const isCurrentlyPlaying = playingVerse === verseNum;
                    const isSelected = selectedVerse === verseNum;
                    
                    return (
                      <div
                        key={i}
                        onClick={() => audioAvailable && playVerse(verseNum)}
                        className={`p-4 rounded-lg transition-all ${
                          audioAvailable ? 'cursor-pointer' : ''
                        } ${
                          isCurrentlyPlaying
                            ? 'bg-yellow-300/40 border-2 border-yellow-400 shadow-xl animate-pulse'
                            : isSelected
                            ? 'bg-purple-300/30 border-2 border-purple-400'
                            : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`font-bold text-xl ${isCurrentlyPlaying ? 'text-yellow-300' : 'text-purple-300'}`}>
                            {isCurrentlyPlaying && '🔊 '}{verseNum}
                          </span>
                          <p className="text-white text-lg leading-relaxed">{verse}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* English */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8" dir="ltr">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/30">
                  <h3 className="text-2xl font-bold text-white">🇺🇸 English</h3>
                  <span className="text-white/70 text-sm">
                    {TRANSLATIONS_EN.find(t => t.key === selectedTranslationEn)?.name}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {content.verses.en.map((verse, i) => {
                    const verseNum = i + 1;
                    const isCurrentlyPlaying = playingVerse === verseNum;
                    const isSelected = selectedVerse === verseNum;
                    
                    return (
                      <div
                        key={i}
                        onClick={() => audioAvailable && playVerse(verseNum)}
                        className={`p-4 rounded-lg transition-all ${
                          audioAvailable ? 'cursor-pointer' : ''
                        } ${
                          isCurrentlyPlaying
                            ? 'bg-yellow-300/40 border-2 border-yellow-400 shadow-xl animate-pulse'
                            : isSelected
                            ? 'bg-purple-300/30 border-2 border-purple-400'
                            : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`font-bold text-xl ${isCurrentlyPlaying ? 'text-yellow-300' : 'text-purple-300'}`}>
                            {isCurrentlyPlaying && '🔊 '}{verseNum}
                          </span>
                          <p className="text-white text-lg leading-relaxed">{verse}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Navigation */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (selectedChapter > 1) {
                    setSelectedChapter(prev => prev - 1);
                    stopAudio();
                  }
                }}
                disabled={selectedChapter === 1}
                className="flex-1 px-6 py-4 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold"
              >
                ⏮️ {lang === 'fa' ? 'فصل قبلی' : 'Previous'}
              </button>
              
              <button
                onClick={() => {
                  if (selectedChapter < (currentBook?.chapters || 50)) {
                    setSelectedChapter(prev => prev + 1);
                    stopAudio();
                  }
                }}
                disabled={selectedChapter === (currentBook?.chapters || 50)}
                className="flex-1 px-6 py-4 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold"
              >
                {lang === 'fa' ? 'فصل بعدی' : 'Next'} ⏭️
              </button>
            </div>
          </>
        )}

        <audio ref={audioRef} onEnded={handleAudioEnded} style={{ display: 'none' }} />

      </div>
    </div>
  );
};

export default BibleStudyPage;
