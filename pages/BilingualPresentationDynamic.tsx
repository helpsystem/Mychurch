// BilingualPresentationDynamic.tsx
// ------------------------------------------------------------
// Dynamic Bible Presentation with Translation, Book & Chapter Selection
// ------------------------------------------------------------

import React, { useState, useEffect } from "react";
import { ChevronDown } from 'lucide-react';
import BilingualBiblePresentation, { BiblePayload } from "@/components/BilingualBiblePresentation";

interface BibleBook {
  key: string;
  name: { en: string; fa: string };
  chapters: number;
  testament: 'OT' | 'NT';
}

interface BibleVerse {
  verse_number: number;
  text_mojdeh?: string;
  text_qadim?: string;
  text_tafsiri?: string;
  text_en?: string;
}

const BilingualPresentationDynamic: React.FC = () => {
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedTranslation, setSelectedTranslation] = useState<'mojdeh' | 'qadim' | 'tafsiri'>('mojdeh');
  const [loading, setLoading] = useState(false);
  const [presentationData, setPresentationData] = useState<BiblePayload | null>(null);
  const [showControls, setShowControls] = useState(true);

  // Fetch Bible books on mount
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        // Try JSON API first (fallback when database unavailable)
        const response = await fetch('/api/bible-json/books');
        const data = await response.json();
        if (data.success && data.books) {
          // Transform to match BibleBook interface
          const transformedBooks: BibleBook[] = data.books.map((b: any) => ({
            key: b.code,
            name: { en: b.name_en, fa: b.name_fa },
            chapters: b.chapters || 0,
            testament: b.testament || 'OT'
          }));
          
          setBooks(transformedBooks);
          if (transformedBooks.length > 0) {
            setSelectedBook(transformedBooks[0].key);
          }
          console.log(`✅ Loaded ${transformedBooks.length} books from JSON`);
        }
      } catch (error) {
        console.error('Failed to fetch Bible books:', error);
        alert('خطا در بارگذاری فهرست کتاب‌ها');
      }
    };
    fetchBooks();
  }, []);

  const currentBook = books.find(b => b.key === selectedBook);

  const translationNames = {
    mojdeh: { fa: 'مژده', en: 'Mojdeh' },
    qadim: { fa: 'قدیم', en: 'Qadim' },
    tafsiri: { fa: 'تفسیری', en: 'Tafsiri' }
  };

  const loadChapterData = async () => {
    if (!selectedBook || !selectedChapter) return;

    setLoading(true);
    try {
      console.log(`📖 Loading: ${selectedBook} chapter ${selectedChapter}`);
      
      // Try JSON API first (fallback when database is unavailable)
      let response = await fetch(`/api/bible-json/content/${selectedBook}/${selectedChapter}`);
      let data = await response.json();
      
      console.log('📦 API Response (JSON fallback):', data);
      
      if (data.success && data.verses && data.verses.en && data.verses.fa) {
        // API returns verses as { en: [], fa: [] }
        const versesEn = data.verses.en;
        const versesFa = data.verses.fa;
        console.log(`✅ Verses loaded: EN=${versesEn.length}, FA=${versesFa.length}`);
        
        // Check if empty
        if (versesEn.length === 0 && versesFa.length === 0) {
          alert(`این فصل در حال حاضر موجود نیست.\n\nBook: ${selectedBook}\nChapter: ${selectedChapter}`);
          setLoading(false);
          return;
        }
        
        const payload: BiblePayload = {
          book_en: data.book?.name_en || currentBook?.name.en || selectedBook,
          book_fa: data.book?.name_fa || currentBook?.name.fa || selectedBook,
          translation_name: data.translation?.name || translationNames[selectedTranslation],
          chapters: [{
            chapterNumber: selectedChapter,
            verses: versesEn.map((textEn: string, index: number) => ({
              verseNumber: index + 1,
              text_en: textEn || '',
              text_fa: versesFa[index] || ''
            })).filter((v: any) => v.text_en !== null && v.text_fa !== null) // Filter out null verses (index 0)
          }]
        };
        
        setPresentationData(payload);
        setShowControls(false); // Hide controls when presentation starts
        console.log('✅ Presentation started with payload:', payload);
      } else {
        console.error('❌ Invalid API response:', data);
        alert('فرمت پاسخ API صحیح نیست');
      }
    } catch (error) {
      console.error('Failed to load chapter:', error);
      alert('خطا در بارگذاری فصل');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSelection = () => {
    setPresentationData(null);
    setShowControls(true);
  };

  if (!showControls && presentationData) {
    console.log('🎬 Rendering presentation with data:', {
      book_en: presentationData.book_en,
      book_fa: presentationData.book_fa,
      chapters: presentationData.chapters.length,
      firstChapter: presentationData.chapters[0]?.chapterNumber,
      verseCount: presentationData.chapters[0]?.verses.length
    });
    
    // ✅ Create unique key to force component remount when book/chapter changes
    const uniqueKey = `${presentationData.book_en}-${presentationData.chapters[0]?.chapterNumber}`;
    console.log('🔑 Unique key:', uniqueKey);
    
    return (
      <div className="relative">
        <button
          onClick={handleBackToSelection}
          className="absolute top-4 left-4 z-50 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg shadow-lg transition-all"
        >
          ← بازگشت به انتخاب
        </button>
        <BilingualBiblePresentation 
          key={uniqueKey} 
          data={presentationData} 
          autoStart={true}
          bookCode={selectedBook}
          enableAudio={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-black-gradient-2 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full bg-black-gradient rounded-3xl shadow-2xl p-8 border border-primary/20">
        <h1 className="text-4xl font-bold text-white text-center mb-2">
          📖 ارائه کتاب مقدس
        </h1>
        <p className="text-dimWhite text-center mb-8">
          ترجمه، کتاب و فصل مورد نظر خود را انتخاب کنید
        </p>

        <div className="space-y-6">
          {/* Translation Selection */}
          <div>
            <label className="block text-white font-semibold mb-2">
              انتخاب ترجمه:
            </label>
            <div className="relative">
              <select
                value={selectedTranslation}
                onChange={(e) => setSelectedTranslation(e.target.value as any)}
                className="w-full p-4 bg-primary border-2 border-primary-light rounded-xl text-white text-lg appearance-none cursor-pointer hover:border-secondary transition-all focus:outline-none focus:ring-2 focus:ring-secondary"
                dir="rtl"
              >
                <option value="mojdeh">مژده (Mojdeh)</option>
                <option value="qadim">قدیم (Qadim)</option>
                <option value="tafsiri">تفسیری (Tafsiri)</option>
              </select>
              <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-white pointer-events-none" size={24} />
            </div>
          </div>

          {/* Book Selection */}
          <div>
            <label className="block text-white font-semibold mb-2">
              انتخاب کتاب:
            </label>
            <div className="relative">
              <select
                value={selectedBook}
                onChange={(e) => {
                  setSelectedBook(e.target.value);
                  setSelectedChapter(1);
                }}
                disabled={books.length === 0}
                className="w-full p-4 bg-primary border-2 border-primary-light rounded-xl text-white text-lg appearance-none cursor-pointer hover:border-secondary transition-all focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50"
                dir="rtl"
              >
                {books.length === 0 ? (
                  <option>در حال بارگذاری...</option>
                ) : (
                  books.map(book => (
                    <option key={book.key} value={book.key}>
                      {book.name.fa} ({book.name.en})
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-white pointer-events-none" size={24} />
            </div>
          </div>

          {/* Chapter Selection */}
          <div>
            <label className="block text-white font-semibold mb-2">
              انتخاب فصل:
            </label>
            <div className="relative">
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(Number(e.target.value))}
                disabled={!currentBook}
                className="w-full p-4 bg-primary border-2 border-primary-light rounded-xl text-white text-lg appearance-none cursor-pointer hover:border-secondary transition-all focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50"
                dir="rtl"
              >
                {currentBook ? (
                  Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map(chap => (
                    <option key={chap} value={chap}>
                      فصل {chap}
                    </option>
                  ))
                ) : (
                  <option>ابتدا کتاب را انتخاب کنید</option>
                )}
              </select>
              <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-white pointer-events-none" size={24} />
            </div>
          </div>

          {/* Start Presentation Button */}
          <button
            onClick={loadChapterData}
            disabled={!selectedBook || !selectedChapter || loading || books.length === 0}
            className="w-full py-4 bg-gradient-to-r from-secondary to-secondary-dark text-black font-bold text-xl rounded-xl shadow-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                در حال بارگذاری...
              </span>
            ) : (
              '▶ شروع ارائه'
            )}
          </button>

          {/* Info */}
          <div className="bg-primary/30 border border-primary-light rounded-xl p-4 text-center">
            <p className="text-dimWhite text-sm">
              💡 پس از شروع، ارائه به صورت تمام صفحه نمایش داده می‌شود
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BilingualPresentationDynamic;
