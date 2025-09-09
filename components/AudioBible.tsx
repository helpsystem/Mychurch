import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { BookOpen, Volume2, ExternalLink } from 'lucide-react';
import LocalMediaPlayer from './LocalMediaPlayer';
import { getOldTestamentBooks, getNewTestamentBooks, LocalBibleBook } from '../lib/localBibleData';

const AudioBible = () => {
  const { lang } = useLanguage();
  const [playerOpen, setPlayerOpen] = useState(false);
  const [currentBook, setCurrentBook] = useState<LocalBibleBook | null>(null);

  // Using local Bible books data
  const oldTestamentBooks = getOldTestamentBooks();
  const newTestamentBooks = getNewTestamentBooks();

  const handlePlayAudio = (book: LocalBibleBook) => {
    setCurrentBook(book);
    setPlayerOpen(true);
  };

  const handleReadOnline = () => {
    window.open('https://www.bible.com/bible/118/GEN.1.NMV', '_blank');
  };

  const BibleBookCard = ({ book }: { book: LocalBibleBook }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-lg">{book.name[lang]}</h4>
          <div className="flex items-center text-sm text-gray-600 mt-1">
            <span className="bg-gray-100 px-2 py-1 rounded text-xs mr-2 rtl:ml-2 rtl:mr-0">
              {book.abbreviation}
            </span>
            <span>
              {book.chapters} {lang === 'fa' ? 'فصل' : 'chapters'}
            </span>
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
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {lang === 'fa' ? 'کتاب مقدس صوتی محلی' : 'Local Audio Bible'}
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
          {lang === 'fa' 
            ? 'کتاب مقدس کامل را به زبان فارسی گوش دهید. تمام کتاب‌های عهد عتیق و جدید با کیفیت صوتی بالا در سرور محلی ما ذخیره شده است.' 
            : 'Listen to the complete Bible in Persian. All Old and New Testament books are stored locally on our server with high-quality audio.'
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

      {/* Footer note */}
      <div className="text-center mt-12 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          {lang === 'fa' 
            ? 'تمام فایل‌های صوتی در سرور محلی ما ذخیره شده و نیازی به اتصال به اینترنت ندارید' 
            : 'All audio files are stored locally on our server, no internet connection required'
          }
        </p>
      </div>

      {/* Local Audio Player for Bible books */}
      {currentBook && (
        <LocalMediaPlayer
          isOpen={playerOpen}
          onClose={() => setPlayerOpen(false)}
          title={currentBook.name[lang]}
          artist="کتاب مقدس صوتی"
          audioUrl={currentBook.localAudioPath}
          type="audio"
        />
      )}
    </div>
  );
};

export default AudioBible;