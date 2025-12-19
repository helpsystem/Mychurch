/**
 * AudioBible Component
 * ================================
 * Full-featured audio Bible player with bilingual support (English/Persian)
 * Plays audio chapters from local D:\ drive archives via backend API
 * 
 * Features:
 * - 66 books (Old Testament + New Testament)
 * - Dual audio players (English + Persian side-by-side)
 * - Play/Pause/Next/Previous controls
 * - Chapter navigation
 * - Download audio files
 * - Search books by name
 * - Responsive design (mobile + desktop)
 * - Testament filtering (OT/NT/All)
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Volume2, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Download,
  Search,
  Loader,
  AlertCircle,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import axios from 'axios';

interface BookInfo {
  code: string;
  name_en: string;
  name_fa: string;
  chapters: number;
  hasEnglishAudio: boolean;
  hasPersianAudio: boolean;
}

interface ChapterInfo {
  chapter: number;
  audioUrl_en: string;
  audioUrl_fa: string;
  downloadUrl_en: string;
  downloadUrl_fa: string;
}

type Testament = 'ALL' | 'OT' | 'NT';

const AudioBible = () => {
  const { lang } = useLanguage();
  const [books, setBooks] = useState<BookInfo[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<BookInfo[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookInfo | null>(null);
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [testamentFilter, setTestamentFilter] = useState<Testament>('ALL');

  // Audio player states
  const [isPlayingEn, setIsPlayingEn] = useState(false);
  const [isPlayingFa, setIsPlayingFa] = useState(false);
  const [currentTimeEn, setCurrentTimeEn] = useState(0);
  const [currentTimeFa, setCurrentTimeFa] = useState(0);
  const [durationEn, setDurationEn] = useState(0);
  const [durationFa, setDurationFa] = useState(0);

  const audioRefEn = useRef<HTMLAudioElement>(null);
  const audioRefFa = useRef<HTMLAudioElement>(null);

  // Load books on mount
  useEffect(() => {
    loadBooks();
  }, []);

  // Filter books by search and testament
  useEffect(() => {
    if (!books.length) return;

    let filtered = books;

    // Testament filter
    if (testamentFilter !== 'ALL') {
      const otBooks = ['GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', 
                       '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO', 
                       'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 
                       'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'];
      
      if (testamentFilter === 'OT') {
        filtered = filtered.filter(b => otBooks.includes(b.code));
      } else {
        filtered = filtered.filter(b => !otBooks.includes(b.code));
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.name_en.toLowerCase().includes(query) ||
        b.name_fa.includes(query) ||
        b.code.toLowerCase().includes(query)
      );
    }

    setFilteredBooks(filtered);
  }, [books, searchQuery, testamentFilter]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/wordproject-audio/books');
      
      if (response.data.success) {
        setBooks(response.data.books);
        setFilteredBooks(response.data.books);
      } else {
        throw new Error('Failed to load books');
      }
    } catch (err: any) {
      console.error('Error loading books:', err);
      setError(err.response?.data?.error || 'خطا در بارگذاری کتاب‌ها / Error loading books');
    } finally {
      setLoading(false);
    }
  };

  const selectBook = async (book: BookInfo) => {
    try {
      setSelectedBook(book);
      setSelectedChapter(1);
      setLoading(true);

      const response = await axios.get(`/api/wordproject-audio/book/${book.code}`);
      
      if (response.data.success) {
        setChapters(response.data.book.chapters);
      } else {
        throw new Error('Failed to load chapters');
      }
    } catch (err: any) {
      console.error('Error loading chapters:', err);
      setError(err.response?.data?.error || 'خطا در بارگذاری فصل‌ها / Error loading chapters');
    } finally {
      setLoading(false);
    }
  };

  const playChapter = (chapterNum: number) => {
    setSelectedChapter(chapterNum);
    
    // Stop current playback
    stopAll();

    // Small delay to allow audio src to update
    setTimeout(() => {
      if (audioRefEn.current) {
        audioRefEn.current.play().catch(console.error);
      }
      if (audioRefFa.current) {
        audioRefFa.current.play().catch(console.error);
      }
    }, 100);
  };

  const togglePlayEn = () => {
    if (!audioRefEn.current) return;

    if (isPlayingEn) {
      audioRefEn.current.pause();
    } else {
      audioRefEn.current.play().catch(console.error);
    }
  };

  const togglePlayFa = () => {
    if (!audioRefFa.current) return;

    if (isPlayingFa) {
      audioRefFa.current.pause();
    } else {
      audioRefFa.current.play().catch(console.error);
    }
  };

  const stopAll = () => {
    if (audioRefEn.current) {
      audioRefEn.current.pause();
      audioRefEn.current.currentTime = 0;
    }
    if (audioRefFa.current) {
      audioRefFa.current.pause();
      audioRefFa.current.currentTime = 0;
    }
  };

  const nextChapter = () => {
    if (!selectedBook || !chapters.length) return;
    const nextChap = Math.min(selectedChapter + 1, selectedBook.chapters);
    if (nextChap !== selectedChapter) {
      playChapter(nextChap);
    }
  };

  const prevChapter = () => {
    if (!selectedBook) return;
    const prevChap = Math.max(selectedChapter - 1, 1);
    if (prevChap !== selectedChapter) {
      playChapter(prevChap);
    }
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadAudio = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const currentChapterData = chapters.find(ch => ch.chapter === selectedChapter);

  return (
    <div dir={lang === 'fa' ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <BookOpen className="w-12 h-12" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                {lang === 'fa' ? '🎧 کتاب مقدس صوتی' : '🎧 Audio Bible'}
              </h1>
              <p className="text-blue-100 mt-1">
                {lang === 'fa' 
                  ? 'گوش دهید به کلام خدا به فارسی و انگلیسی'
                  : 'Listen to the Word of God in Persian and English'
                }
              </p>
            </div>
          </div>

          {selectedBook && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
              <h2 className="text-xl font-semibold">
                {lang === 'fa' ? selectedBook.name_fa : selectedBook.name_en}
              </h2>
              <p className="text-sm text-blue-100 mt-1">
                {lang === 'fa' 
                  ? `فصل ${selectedChapter} از ${selectedBook.chapters}`
                  : `Chapter ${selectedChapter} of ${selectedBook.chapters}`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar: Book List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {lang === 'fa' ? 'کتاب‌های کتاب مقدس' : 'Bible Books'}
              </h3>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={lang === 'fa' ? 'جستجوی کتاب...' : 'Search book...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Testament Filter */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setTestamentFilter('ALL')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    testamentFilter === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {lang === 'fa' ? 'همه' : 'All'}
                </button>
                <button
                  onClick={() => setTestamentFilter('OT')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    testamentFilter === 'OT'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {lang === 'fa' ? 'عهد قدیم' : 'OT'}
                </button>
                <button
                  onClick={() => setTestamentFilter('NT')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    testamentFilter === 'NT'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {lang === 'fa' ? 'عهد جدید' : 'NT'}
                </button>
              </div>

              {/* Books List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : filteredBooks.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    {lang === 'fa' ? 'کتابی یافت نشد' : 'No books found'}
                  </p>
                ) : (
                  filteredBooks.map(book => (
                    <button
                      key={book.code}
                      onClick={() => selectBook(book)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedBook?.code === book.code
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">
                            {lang === 'fa' ? book.name_fa : book.name_en}
                          </div>
                          <div className={`text-xs mt-1 ${
                            selectedBook?.code === book.code ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {book.chapters} {lang === 'fa' ? 'فصل' : 'chapters'}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Audio Players */}
          <div className="lg:col-span-2">
            {!selectedBook ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {lang === 'fa' 
                    ? 'یک کتاب انتخاب کنید'
                    : 'Select a Book to Start'
                  }
                </h3>
                <p className="text-gray-500">
                  {lang === 'fa'
                    ? 'از لیست سمت راست یک کتاب انتخاب کنید تا صدای آن را بشنوید'
                    : 'Choose a book from the list to listen to its audio'
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Chapter Selector */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    {lang === 'fa' ? 'انتخاب فصل' : 'Select Chapter'}
                  </h3>
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => (
                      <button
                        key={ch}
                        onClick={() => playChapter(ch)}
                        className={`p-2 rounded-lg font-medium transition-all ${
                          selectedChapter === ch
                            ? 'bg-blue-600 text-white shadow-md scale-105'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                      onClick={prevChapter}
                      disabled={selectedChapter === 1}
                      className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      title={lang === 'fa' ? 'فصل قبل' : 'Previous Chapter'}
                    >
                      <SkipBack className="w-5 h-5" />
                    </button>
                    <span className="text-lg font-semibold text-gray-700 min-w-[100px] text-center">
                      {lang === 'fa' ? `فصل ${selectedChapter}` : `Chapter ${selectedChapter}`}
                    </span>
                    <button
                      onClick={nextChapter}
                      disabled={selectedChapter === selectedBook.chapters}
                      className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      title={lang === 'fa' ? 'فصل بعد' : 'Next Chapter'}
                    >
                      <SkipForward className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Dual Audio Players */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* English Player */}
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center gap-3 mb-4">
                      <Volume2 className="w-6 h-6" />
                      <h4 className="text-lg font-bold">🇬🇧 English Audio</h4>
                    </div>

                    {currentChapterData && (
                      <>
                        <audio
                          ref={audioRefEn}
                          src={currentChapterData.audioUrl_en}
                          onPlay={() => setIsPlayingEn(true)}
                          onPause={() => setIsPlayingEn(false)}
                          onTimeUpdate={(e) => setCurrentTimeEn(e.currentTarget.currentTime)}
                          onLoadedMetadata={(e) => setDurationEn(e.currentTarget.duration)}
                          onEnded={nextChapter}
                        />

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <input
                            type="range"
                            min="0"
                            max={durationEn || 0}
                            value={currentTimeEn}
                            onChange={(e) => {
                              if (audioRefEn.current) {
                                audioRefEn.current.currentTime = parseFloat(e.target.value);
                              }
                            }}
                            className="w-full h-2 bg-blue-300 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs mt-1 text-blue-100">
                            <span>{formatTime(currentTimeEn)}</span>
                            <span>{formatTime(durationEn)}</span>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={togglePlayEn}
                            className="p-4 bg-white text-blue-600 rounded-full hover:bg-blue-50 transition-all shadow-lg"
                          >
                            {isPlayingEn ? (
                              <Pause className="w-6 h-6" />
                            ) : (
                              <Play className="w-6 h-6 ml-1" />
                            )}
                          </button>
                          <button
                            onClick={() => downloadAudio(
                              currentChapterData.downloadUrl_en,
                              `${selectedBook.name_en}_Chapter${selectedChapter}_English.mp3`
                            )}
                            className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all"
                            title="Download"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Persian Player */}
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center gap-3 mb-4">
                      <Volume2 className="w-6 h-6" />
                      <h4 className="text-lg font-bold">🇮🇷 صوت فارسی</h4>
                    </div>

                    {currentChapterData && (
                      <>
                        <audio
                          ref={audioRefFa}
                          src={currentChapterData.audioUrl_fa}
                          onPlay={() => setIsPlayingFa(true)}
                          onPause={() => setIsPlayingFa(false)}
                          onTimeUpdate={(e) => setCurrentTimeFa(e.currentTarget.currentTime)}
                          onLoadedMetadata={(e) => setDurationFa(e.currentTarget.duration)}
                          onEnded={nextChapter}
                        />

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <input
                            type="range"
                            min="0"
                            max={durationFa || 0}
                            value={currentTimeFa}
                            onChange={(e) => {
                              if (audioRefFa.current) {
                                audioRefFa.current.currentTime = parseFloat(e.target.value);
                              }
                            }}
                            className="w-full h-2 bg-purple-300 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs mt-1 text-purple-100">
                            <span>{formatTime(currentTimeFa)}</span>
                            <span>{formatTime(durationFa)}</span>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={togglePlayFa}
                            className="p-4 bg-white text-purple-600 rounded-full hover:bg-purple-50 transition-all shadow-lg"
                          >
                            {isPlayingFa ? (
                              <Pause className="w-6 h-6" />
                            ) : (
                              <Play className="w-6 h-6 ml-1" />
                            )}
                          </button>
                          <button
                            onClick={() => downloadAudio(
                              currentChapterData.downloadUrl_fa,
                              `${selectedBook.name_fa}_فصل${selectedChapter}_فارسی.mp3`
                            )}
                            className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all"
                            title="دانلود"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mt-6 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold mb-1">
                        {lang === 'fa' ? '💡 نکته' : '💡 Tip'}
                      </p>
                      <p>
                        {lang === 'fa'
                          ? 'می‌توانید هر دو زبان را همزمان پخش کنید یا فقط یکی را انتخاب کنید. برای دانلود فایل صوتی، روی دکمه دانلود کلیک کنید.'
                          : 'You can play both languages simultaneously or choose just one. Click the download button to save the audio file.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold">
                {lang === 'fa' ? 'خطا' : 'Error'}
              </h3>
            </div>
            <p className="text-gray-700 mb-4">{error}</p>
            <button
              onClick={() => setError(null)}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {lang === 'fa' ? 'بستن' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioBible;