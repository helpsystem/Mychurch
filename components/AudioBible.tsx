import React, { useState } from 'react';
import { ExternalLink, Volume2, BookOpen } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import LocalMediaPlayer from './LocalMediaPlayer';
import { getOldTestamentBooks, getNewTestamentBooks, LocalBibleBook } from '../lib/localBibleData';

type Props = {
  bookKey?: string;
  chapter?: number;
  version?: string; // bible.com translation code (e.g. NMV)
};

const BOOK_CODE_MAP: Record<string, string> = {
  Genesis: 'GEN', Exodus: 'EXO', Leviticus: 'LEV', Numbers: 'NUM', Deuteronomy: 'DEU',
  Joshua: 'JOS', Judges: 'JDG', Ruth: 'RUT', '1Samuel': '1SA', '2Samuel': '2SA',
  '1Kings': '1KI', '2Kings': '2KI', '1Chronicles': '1CH', '2Chronicles': '2CH',
  Ezra: 'EZR', Nehemiah: 'NEH', Esther: 'EST', Job: 'JOB', Psalms: 'PSA',
  Proverbs: 'PRO', Ecclesiastes: 'ECC', SongOfSongs: 'SOS', Isaiah: 'ISA', Jeremiah: 'JER',
  Lamentations: 'LAM', Ezekiel: 'EZE', Daniel: 'DAN', Hosea: 'HOS', Joel: 'JOL',
  Amos: 'AMO', Obadiah: 'OBD', Jonah: 'JON', Micah: 'MIC', Nahum: 'NAM',
  Habakkuk: 'HAB', Zephaniah: 'ZEP', Haggai: 'HAG', Zechariah: 'ZEC', Malachi: 'MAL',

  Matthew: 'MAT', Mark: 'MRK', Luke: 'LUK', John: 'JHN', Acts: 'ACT', Romans: 'ROM',
  '1Corinthians': '1CO', '2Corinthians': '2CO', Galatians: 'GAL', Ephesians: 'EPH',
  Philippians: 'PHP', Colossians: 'COL', '1Thessalonians': '1TH', '2Thessalonians': '2TH',
  '1Timothy': '1TI', '2Timothy': '2TI', Titus: 'TIT', Philemon: 'PHM', Hebrews: 'HEB',
  James: 'JAM', '1Peter': '1PE', '2Peter': '2PE', '1John': '1JN', '2John': '2JN', '3John': '3JN',
  Jude: 'JUD', Revelation: 'REV'
};

const AudioBible: React.FC<Props> = ({ bookKey, chapter = 1, version = 'NMV' }) => {
  // If bookKey is provided, render a compact button that opens bible.com audio for that book/chapter
  if (bookKey) {
    const bookCode = BOOK_CODE_MAP[bookKey] || bookKey.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
    const audioPageUrl = bookCode ? `https://www.bible.com/audio-bible/118/${bookCode}.${chapter}.${version}` : '';

    const handleOpen = () => {
      if (!audioPageUrl) return;
      window.open(audioPageUrl, '_blank', 'noopener');
    };

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleOpen}
          title="Open audio on bible.com"
          className="inline-flex items-center gap-2 py-2 px-3 bg-secondary text-primary rounded-lg font-semibold hover:opacity-90"
        >
          <Volume2 size={16} />
          <span className="text-sm">{`Audio ${chapter}`}</span>
          <ExternalLink size={14} className="opacity-80" />
        </button>
      </div>
    );
  }

  // Otherwise render the full local-audio page (used by /audio-bible route)
  const { lang } = useLanguage();
  const [playerOpen, setPlayerOpen] = useState(false);
  const [currentBook, setCurrentBook] = useState<LocalBibleBook | null>(null);

  const oldTestamentBooks = getOldTestamentBooks();
  const newTestamentBooks = getNewTestamentBooks();

  const handlePlayAudio = (book: LocalBibleBook) => {
    setCurrentBook(book);
    setPlayerOpen(true);
  };

  const handleReadOnline = () => {
    window.open('/#/bible-reader', '_blank');
  };

  const BibleBookCard: React.FC<{ book: LocalBibleBook }> = ({ book }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-lg">{book.name[lang]}</h4>
          <div className="flex items-center text-sm text-gray-600 mt-1">
            <span className="bg-gray-100 px-2 py-1 rounded text-xs mr-2 rtl:ml-2 rtl:mr-0">{book.abbreviation}</span>
            <span>{book.chapters} {lang === 'fa' ? 'فصل' : 'chapters'}</span>
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
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{lang === 'fa' ? 'کتاب مقدس صوتی محلی' : 'Local Audio Bible'}</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
          {lang === 'fa'
            ? 'کتاب مقدس کامل را به زبان فارسی گوش دهید. تمام کتاب‌های عهد عتیق و جدید با کیفیت صوتی بالا در سرور محلی ما ذخیره شده است.'
            : 'Listen to the complete Bible in Persian. All Old and New Testament books are stored locally on our server with high-quality audio.'}
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button onClick={handleReadOnline} className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <BookOpen className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
            {lang === 'fa' ? 'مطالعه آنلاین' : 'Read Online'}
          </button>
        </div>
      </div>

      <div className="mb-12">
        <div className="flex items-center mb-6">
          <BookOpen className="h-6 w-6 text-amber-600 mr-3 rtl:ml-3 rtl:mr-0" />
          <h2 className="text-2xl font-bold text-gray-900">{lang === 'fa' ? 'عهد عتیق' : 'Old Testament'}</h2>
          <span className="ml-4 rtl:mr-4 rtl:ml-0 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">{oldTestamentBooks.length} {lang === 'fa' ? 'کتاب' : 'books'}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {oldTestamentBooks.map(book => <div key={book.id}><BibleBookCard book={book} /></div>)}
        </div>
      </div>

      <div>
        <div className="flex items-center mb-6">
          <BookOpen className="h-6 w-6 text-blue-600 mr-3 rtl:ml-3 rtl:mr-0" />
          <h2 className="text-2xl font-bold text-gray-900">{lang === 'fa' ? 'عهد جدید' : 'New Testament'}</h2>
          <span className="ml-4 rtl:mr-4 rtl:ml-0 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">{newTestamentBooks.length} {lang === 'fa' ? 'کتاب' : 'books'}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {newTestamentBooks.map(book => <div key={book.id}><BibleBookCard book={book} /></div>)}
        </div>
      </div>

      <div className="text-center mt-12 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-500">{lang === 'fa' ? 'تمام فایل‌های صوتی در سرور محلی ما ذخیره شده و نیازی به اتصال به اینترنت ندارید' : 'All audio files are stored locally on our server, no internet connection required'}</p>
      </div>

      {currentBook && (
        <LocalMediaPlayer
          isOpen={playerOpen}
          onClose={() => setPlayerOpen(false)}
          title={currentBook.name[lang]}
          artist={lang === 'fa' ? 'کتاب مقدس صوتی' : 'Audio Bible'}
          audioUrl={currentBook.localAudioPath}
          type="audio"
        />
      )}
    </div>
  );
};

export default AudioBible;