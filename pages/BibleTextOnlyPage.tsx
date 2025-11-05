import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import axios from 'axios';

interface BibleBook {
  key: string;
  name: {
    en: string;
    fa: string;
  };
  chapters: number;
  testament?: string;
}

interface Verse {
  verse_number: number;
  text_fa: string;
  text_en: string;
}

const BibleTextOnlyPage: React.FC = () => {
  const { lang } = useLanguage();
  
  // State
  const [bibleBooks, setBibleBooks] = useState<BibleBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [totalChapters, setTotalChapters] = useState<number>(1);

  // Fetch Bible books on mount
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get('/api/bible/books');
        // API returns {success: true, books: [...]}
        const books = response.data.books || [];
        setBibleBooks(books);
        if (books.length > 0) {
          setSelectedBook(books[0].key);
          setTotalChapters(books[0].chapters);
        }
      } catch (err) {
        console.error('Error fetching Bible books:', err);
        setError('Failed to load Bible books');
      }
    };
    fetchBooks();
  }, []);

  // Fetch verses when book or chapter changes
  useEffect(() => {
    if (!selectedBook) return;
    
    const fetchVerses = async () => {
      setLoading(true);
      setError('');
      try {
        // Use /api/bible/content/:book/:chapter endpoint
        const response = await axios.get(`/api/bible/content/${selectedBook}/${selectedChapter}`);
        
        // Transform response to match our Verse interface
        const verses: Verse[] = response.data.verses.fa.map((textFa: string, index: number) => ({
          verse_number: index + 1,
          text_fa: textFa,
          text_en: response.data.verses.en?.[index] || textFa
        }));
        
        setVerses(verses);
      } catch (err) {
        console.error('Error fetching verses:', err);
        setError('Failed to load verses');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVerses();
  }, [selectedBook, selectedChapter]);

  // Handle book change
  const handleBookChange = (bookKey: string) => {
    setSelectedBook(bookKey);
    setSelectedChapter(1);
    const book = bibleBooks.find(b => b.key === bookKey);
    if (book) {
      setTotalChapters(book.chapters);
    }
  };

  const currentBookName = bibleBooks.find(b => b.key === selectedBook);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ${lang === 'fa' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 px-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-center">
            {lang === 'fa' ? '📖 کتاب مقدس - متن فارسی' : '📖 Bible - Text Only'}
          </h1>
          <p className="text-lg text-center opacity-90">
            {lang === 'fa' 
              ? 'ترجمه‌های بدون فایل صوتی - مطالعه متن دوزبانه'
              : 'Translations without audio - Bilingual reading'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Book Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {lang === 'fa' ? 'انتخاب کتاب' : 'Select Book'}
              </label>
              <select
                value={selectedBook}
                onChange={(e) => handleBookChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {bibleBooks.map((book) => (
                  <option key={book.key} value={book.key}>
                    {lang === 'fa' ? book.name.fa : book.name.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {lang === 'fa' ? 'انتخاب فصل' : 'Select Chapter'}
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: totalChapters }, (_, i) => i + 1).map((ch) => (
                  <option key={ch} value={ch}>
                    {lang === 'fa' ? `فصل ${ch}` : `Chapter ${ch}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Current Selection */}
          {currentBookName && (
            <div className="mt-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {lang === 'fa' 
                  ? `${currentBookName.name.fa} - فصل ${selectedChapter}`
                  : `${currentBookName.name.en} - Chapter ${selectedChapter}`}
              </h2>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">
              {lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}
            </p>
          </div>
        )}

        {/* Verses Display */}
        {!loading && verses.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="space-y-6">
              {verses.map((verse) => (
                <div 
                  key={verse.verse_number}
                  className="border-b border-gray-200 pb-6 last:border-b-0"
                >
                  {/* Verse Number */}
                  <div className="flex items-center justify-center mb-4">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                      {lang === 'fa' ? `آیه ${verse.verse_number}` : `Verse ${verse.verse_number}`}
                    </span>
                  </div>

                  {/* Bilingual Text - Two Columns */}
                  {verse.text_en && verse.text_en.trim() ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Persian Text - Light Blue Background */}
                      <div className="text-right bg-blue-50 p-6 rounded-lg">
                        <p className="text-xl leading-relaxed text-gray-800" style={{ fontFamily: 'Vazir, sans-serif' }}>
                          {verse.text_fa}
                        </p>
                        <p className="text-sm text-blue-600 mt-2 font-semibold">
                          {lang === 'fa' ? 'فارسی' : 'Persian'}
                        </p>
                      </div>

                      {/* English Text - Light Green Background */}
                      <div className="text-left bg-green-50 p-6 rounded-lg">
                        <p className="text-xl leading-relaxed text-gray-800">
                          {verse.text_en}
                        </p>
                        <p className="text-sm text-green-600 mt-2 font-semibold">
                          {lang === 'fa' ? 'انگلیسی' : 'English'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Persian Only - Single Column with Gray Background */
                    <div className="text-right bg-gray-50 p-6 rounded-lg">
                      <p className="text-xl leading-relaxed text-gray-800" style={{ fontFamily: 'Vazir, sans-serif' }}>
                        {verse.text_fa}
                      </p>
                      <p className="text-sm text-gray-600 mt-2 font-semibold">
                        {lang === 'fa' ? 'فارسی (فقط متن فارسی موجود است)' : 'Persian (Only Persian text available)'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Verses */}
        {!loading && verses.length === 0 && !error && (
          <div className="text-center py-12 text-gray-500">
            {lang === 'fa' 
              ? 'آیه‌ای یافت نشد. لطفاً کتاب و فصل دیگری انتخاب کنید.'
              : 'No verses found. Please select a different book and chapter.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default BibleTextOnlyPage;
