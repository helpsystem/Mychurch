import React, { useState, useEffect } from 'react';
import { Book, ChevronRight, Search, Volume2, VolumeX } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api/wordproject';

interface WordprojectBook {
  book_number: number;
  book_name_fa: string;
  book_name_en: string;
  testament: string;
  chapters_count: number;
}

interface WordprojectVerse {
  verse: number;
  text_fa: string;
  audio_url: string;
}

const WordprojectBibleReader: React.FC = () => {
  const [books, setBooks] = useState<WordprojectBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<WordprojectBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [verses, setVerses] = useState<WordprojectVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  // ✅ بارگذاری لیست کتاب‌ها
  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/books`);
      const data = await response.json();
      setBooks(data.books || []);
      
      // انتخاب اولین کتاب به صورت پیش‌فرض
      if (data.books && data.books.length > 0) {
        setSelectedBook(data.books[0]);
      }
    } catch (error) {
      console.error('خطا در بارگذاری کتاب‌ها:', error);
    }
  };

  // ✅ بارگذاری آیات
  useEffect(() => {
    if (selectedBook && selectedChapter) {
      loadVerses();
    }
  }, [selectedBook, selectedChapter]);

  const loadVerses = async () => {
    if (!selectedBook) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/books/${selectedBook.book_number}/chapters/${selectedChapter}`
      );
      const data = await response.json();
      setVerses(data.verses || []);
    } catch (error) {
      console.error('خطا در بارگذاری آیات:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ پخش صدا
  const playAudio = (audioUrl: string) => {
    // متوقف کردن صدای قبلی
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const audio = new Audio(audioUrl);
    audio.play();
    setAudioPlaying(true);
    setCurrentAudio(audio);

    audio.onended = () => {
      setAudioPlaying(false);
      setCurrentAudio(null);
    };

    audio.onerror = () => {
      console.error('خطا در پخش صدا');
      setAudioPlaying(false);
      setCurrentAudio(null);
    };
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setAudioPlaying(false);
      setCurrentAudio(null);
    }
  };

  // ✅ فیلتر کتاب‌ها
  const filteredBooks = books.filter(book =>
    book.book_name_fa.includes(searchTerm) ||
    book.book_name_en.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ گروه‌بندی کتاب‌ها به عهد عتیق و جدید
  const oldTestament = filteredBooks.filter(b => b.testament === 'old');
  const newTestament = filteredBooks.filter(b => b.testament === 'new');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Book className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              کتاب مقدس (Wordproject)
            </h1>
          </div>
          
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="جستجوی کتاب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Book List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sticky top-4">
              {/* عهد عتیق */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-amber-600 dark:text-amber-400 mb-3 pr-2 border-r-4 border-amber-600">
                  عهد عتیق ({oldTestament.length})
                </h3>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {oldTestament.map((book) => (
                    <button
                      key={book.book_number}
                      onClick={() => {
                        setSelectedBook(book);
                        setSelectedChapter(1);
                      }}
                      className={`w-full text-right px-3 py-2 rounded transition-colors ${
                        selectedBook?.book_number === book.book_number
                          ? 'bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-semibold'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {book.chapters_count} باب
                        </span>
                        <span>{book.book_name_fa}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* عهد جدید */}
              <div>
                <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-3 pr-2 border-r-4 border-blue-600">
                  عهد جدید ({newTestament.length})
                </h3>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {newTestament.map((book) => (
                    <button
                      key={book.book_number}
                      onClick={() => {
                        setSelectedBook(book);
                        setSelectedChapter(1);
                      }}
                      className={`w-full text-right px-3 py-2 rounded transition-colors ${
                        selectedBook?.book_number === book.book_number
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-semibold'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {book.chapters_count} باب
                        </span>
                        <span>{book.book_name_fa}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Verses */}
          <div className="lg:col-span-3">
            {selectedBook && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                {/* Book Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {selectedBook.book_name_fa}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedBook.book_name_en} • باب {selectedChapter}
                    </p>
                  </div>
                  
                  {/* Audio Control */}
                  {verses.length > 0 && verses[0]?.audio_url && (
                    <button
                      onClick={() => audioPlaying ? stopAudio() : playAudio(verses[0].audio_url)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                               text-white rounded-lg transition-colors"
                    >
                      {audioPlaying ? (
                        <>
                          <VolumeX className="w-5 h-5" />
                          <span>توقف</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-5 h-5" />
                          <span>پخش صوتی</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Chapter Navigation */}
                {selectedBook.chapters_count > 1 && (
                  <div className="mb-6">
                    <div className="grid grid-cols-8 gap-2">
                      {Array.from({ length: selectedBook.chapters_count }, (_, i) => i + 1).map((ch) => (
                        <button
                          key={ch}
                          onClick={() => setSelectedChapter(ch)}
                          className={`px-3 py-2 rounded transition-colors ${
                            selectedChapter === ch
                              ? 'bg-blue-600 text-white font-semibold'
                              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verses */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
                  </div>
                ) : verses.length > 0 ? (
                  <div className="space-y-4">
                    {verses.map((verse) => (
                      <div
                        key={verse.verse}
                        className="flex gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 
                                 transition-colors group"
                      >
                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center 
                                       bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 
                                       rounded-full font-semibold text-sm">
                          {verse.verse}
                        </span>
                        <p className="flex-1 text-gray-800 dark:text-gray-200 leading-relaxed text-lg" 
                           dir="rtl">
                          {verse.text_fa}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">
                      هیچ آیه‌ای برای این باب یافت نشد
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordprojectBibleReader;
