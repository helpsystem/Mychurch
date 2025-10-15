import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Play, 
  Pause, 
  Square,
  Globe, 
  Highlighter, 
  BookmarkPlus, 
  Bookmark, 
  StickyNote, 
  X, 
  Save, 
  ChevronDown, 
  ChevronUp, 
  Menu,
  Settings,
  User,
  LogIn,
  Palette,
  Type,
  Volume2,
  Eye,
  Heart,
  Star,
  Filter,
  Download,
  Share2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { api } from '../lib/api';

// Flipbook integration placeholder
// import '../lib/dearflip-flipbook';

interface BibleVerse {
  number: number;
  text: { en: string; fa: string };
  highlight?: {
    color: string;
    type: 'background' | 'underline' | 'border';
    selectionStart?: number;
    selectionEnd?: number;
  };
  note?: {
    id: string;
    title: string;
    content: string;
    type: 'personal' | 'study' | 'prayer' | 'question';
    tags: string[];
  };
  bookmarked?: boolean;
}

interface BibleBook {
  key: string;
  name: { en: string; fa: string };
  chapters: number;
  testament: 'old' | 'new';
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

interface ReadingProgress {
  book: string;
  chapter: number;
  verse?: number;
  percentage: number;
  timeSpent: number;
}

interface UserPreferences {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  theme: 'light' | 'dark' | 'sepia';
  readingMode: 'paginated' | 'scroll' | 'flipbook';
  highlightOpacity: number;
  autoScroll: boolean;
  showVerseNumbers: boolean;
  showChapterHeaders: boolean;
  audioSpeed: number;
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-200', border: 'border-yellow-400' },
  { name: 'Blue', value: 'blue', bg: 'bg-blue-200', border: 'border-blue-400' },
  { name: 'Green', value: 'green', bg: 'bg-green-200', border: 'border-green-400' },
  { name: 'Pink', value: 'pink', bg: 'bg-pink-200', border: 'border-pink-400' },
  { name: 'Orange', value: 'orange', bg: 'bg-orange-200', border: 'border-orange-400' },
  { name: 'Purple', value: 'purple', bg: 'bg-purple-200', border: 'border-purple-400' },
];

const FONT_FAMILIES = [
  'Noto Sans',
  'Iran Sans',
  'Vazir',
  'Tahoma',
  'Arial',
  'Georgia',
  'Times New Roman',
];

const ModernBibleReader: React.FC = () => {
  const { lang, t } = useLanguage();
  // const { user, isAuthenticated, login, logout } = useAuth();
  
  // Mock auth for now - replace with real auth hook
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  
  // Core state
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [selectedTranslation, setSelectedTranslation] = useState<string>('');
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBookKey, setSelectedBookKey] = useState<string>('GEN');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'translation' | 'book' | 'chapter' | 'reading'>('translation');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showHighlightToolbar, setShowHighlightToolbar] = useState(false);
  
  // Reading state
  const [selectedVerseText, setSelectedVerseText] = useState<string>('');
  const [selectedVerseNumber, setSelectedVerseNumber] = useState<number | null>(null);
  const [highlightColor, setHighlightColor] = useState<string>('yellow');
  const [readingProgress, setReadingProgress] = useState<ReadingProgress | null>(null);
  
  // User preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    fontFamily: 'Noto Sans',
    fontSize: 18,
    lineHeight: 1.6,
    theme: 'light',
    readingMode: 'scroll', // Changed to scroll for now
    highlightOpacity: 0.3,
    autoScroll: false,
    showVerseNumbers: true,
    showChapterHeaders: true,
    audioSpeed: 1.0,
  });
  
  // Refs
  const readerRef = useRef<HTMLDivElement>(null);
  const flipbookRef = useRef<any>(null);
  const selectionRef = useRef<Selection | null>(null);
  
  // TTS State - simplified version
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVerse, setCurrentVerse] = useState<number | null>(null);

  // Load translations and default selection
  useEffect(() => {
    // For now, set a default translation
    setSelectedTranslation('fa_pcb'); // Persian Contemporary Bible
    loadBooks();
  }, []);

  // Load verses when book/chapter/translation changes
  useEffect(() => {
    if (selectedBookKey && selectedChapter && selectedTranslation) {
      loadVerses();
      setCurrentStep('reading');
    }
  }, [selectedBookKey, selectedChapter, selectedTranslation]);

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/bible/books?translation=${selectedTranslation || 'fa_pcb'}`) as any;
      if (response?.success && response.books && response.books.length > 0) {
        console.log('📚 First book sample:', response.books[0]);
        console.log('📊 Total books:', response.books.length);
        setBooks(response.books);
        setCurrentStep('book');
        // Auto-select first book if none selected
        if (!selectedBookKey || selectedBookKey === '') {
          const firstBook = response.books[0];
          setSelectedBookKey(firstBook.key);
        }
      }
    } catch (err) {
      setError('Failed to load books');
      toast.error('خطا در بارگذاری فهرست کتاب‌ها');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVerses = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/bible/content/${selectedBookKey}/${selectedChapter}?translation=${selectedTranslation}`) as any;
      
      if (response?.success) {
        const versesData: BibleVerse[] = response.verses.fa.map((faText: string, index: number) => ({
          number: index + 1,
          text: {
            fa: faText,
            en: response.verses.en[index] || ''
          }
        }));
        
        setVerses(versesData);
        
        // Load user annotations if authenticated
        if (isAuthenticated && user) {
          await loadUserAnnotations(versesData);
        }
      }
    } catch (err) {
      setError('Failed to load chapter content');
      toast.error('خطا در بارگذاری محتوای فصل');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserAnnotations = async (versesList: BibleVerse[]) => {
    try {
      // Load highlights and notes from API
      // For now, return unchanged verses
      setVerses(versesList);
    } catch (err) {
      console.error('Failed to load user annotations:', err);
    }
  };

  const handleVerseSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedVerseText(selection.toString().trim());
      
      // Find which verse this selection belongs to
      const range = selection.getRangeAt(0);
      const verseElement = range.startContainer.parentElement?.closest('[data-verse-number]');
      if (verseElement) {
        const verseNumber = parseInt(verseElement.getAttribute('data-verse-number') || '0');
        setSelectedVerseNumber(verseNumber);
        setShowHighlightToolbar(true);
      }
      
      selectionRef.current = selection;
    }
  };

  const handleHighlight = async (color: string, type: 'background' | 'underline' | 'border' = 'background') => {
    if (!selectedVerseText || !selectedVerseNumber || !isAuthenticated) {
      if (!isAuthenticated) {
        toast.error('برای ذخیره هایلایت ابتدا وارد شوید');
        return;
      }
      return;
    }

    try {
      // Save highlight to API
      toast.success('آیه هایلایت شد');
      setShowHighlightToolbar(false);
    } catch (err) {
      toast.error('خطا در ذخیره هایلایت');
    }
  };

  const handleAddNote = async (noteContent: string, noteTitle: string = '', noteType: string = 'personal') => {
    if (!selectedVerseNumber || !noteContent.trim()) return;

    if (!isAuthenticated) {
      toast.error('برای ذخیره یادداشت ابتدا وارد شوید');
      return;
    }

    try {
      // Save note to API
      toast.success('یادداشت ذخیره شد');
    } catch (err) {
      toast.error('خطا در ذخیره یادداشت');
    }
  };

  // Navigation functions
  const currentBook = books.find(b => b.key === selectedBookKey);
  const maxChapters = currentBook?.chapters || 1;
  
  const goToNextChapter = () => {
    if (selectedChapter < maxChapters) {
      setSelectedChapter(selectedChapter + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const goToPrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Font size controls
  const increaseFontSize = () => setPreferences(prev => ({ 
    ...prev, 
    fontSize: Math.min(prev.fontSize + 2, 32) 
  }));
  
  const decreaseFontSize = () => setPreferences(prev => ({ 
    ...prev, 
    fontSize: Math.max(prev.fontSize - 2, 14) 
  }));

  // Audio controls (simplified)
  const speakChapter = () => {
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        const text = verses.map(v => `${v.number}. ${v.text[lang]}`).join(' ');
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'fa' ? 'fa-IR' : 'en-US';
        utterance.rate = preferences.audioSpeed;
        utterance.onend = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    }
  };

  const renderVerse = (verse: BibleVerse, index: number) => {
    const isCurrentVerse = currentVerse === verse.number;
    const hasHighlight = verse.highlight;
    const hasNote = verse.note;
    
    const verseClasses = `
      verse-container relative p-3 mb-2 rounded-lg transition-all duration-200 group
      ${isCurrentVerse ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
      ${hasHighlight ? `bg-${hasHighlight.color}-200` : ''}
      hover:bg-gray-50 dark:hover:bg-gray-800
      cursor-pointer select-text
    `;

    return (
      <div
        key={verse.number}
        className={verseClasses}
        data-verse-number={verse.number}
        onClick={() => setSelectedVerseNumber(verse.number)}
        onMouseUp={handleVerseSelection}
      >
        <div className="flex items-start gap-3">
          {preferences.showVerseNumbers && (
            <span className="verse-number text-sm text-gray-500 dark:text-gray-400 font-bold min-w-[2rem] flex-shrink-0">
              {verse.number}
            </span>
          )}
          
          <div className="flex-1">
            <p 
              className="verse-text leading-relaxed"
              style={{
                fontFamily: preferences.fontFamily,
                fontSize: `${preferences.fontSize}px`,
                lineHeight: preferences.lineHeight,
              }}
            >
              {verse.text[lang]}
            </p>
            
            {hasNote && (
              <div className="note-preview mt-2 p-2 bg-amber-50 dark:bg-amber-900/30 rounded border-l-4 border-amber-400">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <StickyNote className="inline w-4 h-4 mr-1" />
                  {verse.note.title && <strong>{verse.note.title}: </strong>}
                  {verse.note.content.substring(0, 100)}
                  {verse.note.content.length > 100 && '...'}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isPlaying && isCurrentVerse && (
              <Volume2 className="w-4 h-4 text-blue-500 animate-pulse" />
            )}
            
            {hasHighlight && (
              <Highlighter className={`w-4 h-4 text-${hasHighlight.color}-500`} />
            )}
            
            {hasNote && (
              <StickyNote className="w-4 h-4 text-amber-500" />
            )}
            
            {verse.bookmarked && (
              <Bookmark className="w-4 h-4 text-red-500" />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`modern-bible-reader min-h-screen ${preferences.theme} transition-colors duration-300`}>
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Sidebar */}
        <div className={`sidebar w-full lg:w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-4">
            <h3 className="font-bold text-lg mb-4">Navigation</h3>
            
            {/* Book Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">کتاب</label>
              <select 
                value={selectedBookKey}
                onChange={(e) => {
                  setSelectedBookKey(e.target.value);
                  setSelectedChapter(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                <optgroup label="عهد عتیق">
                  {books.filter(b => b.testament === 'old').map(book => (
                    <option key={book.key} value={book.key}>
                      {book.name[lang]}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="عهد جدید">
                  {books.filter(b => b.testament === 'new').map(book => (
                    <option key={book.key} value={book.key}>
                      {book.name[lang]}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            
            {/* Chapter Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">فصل</label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                {Array.from({ length: maxChapters }, (_, i) => i + 1).map(ch => (
                  <option key={ch} value={ch}>
                    {lang === 'fa' ? `فصل ${ch}` : `Chapter ${ch}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="header bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {lang === 'fa' ? 'کتاب مقدس مدرن' : 'Modern Bible'}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Font controls */}
                <button
                  onClick={decreaseFontSize}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  title="کوچک‌تر"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                
                <span className="text-sm px-2">{preferences.fontSize}</span>
                
                <button
                  onClick={increaseFontSize}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  title="بزرگ‌تر"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>

                {/* Login button */}
                <button 
                  onClick={() => setIsAuthenticated(!isAuthenticated)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{lang === 'fa' ? 'ورود / ثبت نام' : 'Login / Register'}</span>
                </button>

                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          {/* Bible Content */}
          <main className="flex-1 overflow-auto">
            <div 
              ref={readerRef}
              className="bible-content h-full p-6"
              style={{
                fontFamily: preferences.fontFamily,
                fontSize: `${preferences.fontSize}px`,
                lineHeight: preferences.lineHeight,
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="ml-3">در حال بارگذاری...</span>
                </div>
              ) : verses.length > 0 ? (
                <div className="verses-container max-w-4xl mx-auto">
                  {preferences.showChapterHeaders && (
                    <h2 className="chapter-header text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
                      {books.find(b => b.key === selectedBookKey)?.name[lang]} - {lang === 'fa' ? `فصل ${selectedChapter}` : `Chapter ${selectedChapter}`}
                    </h2>
                  )}
                  
                  <div className="verses-list space-y-1">
                    {verses.map((verse, index) => renderVerse(verse, index))}
                  </div>
                  
                  {/* Navigation */}
                  <div className="bible-navigation mt-8 flex items-center justify-between">
                    <button
                      onClick={goToPrevChapter}
                      disabled={selectedChapter <= 1}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                      فصل قبل
                    </button>
                    
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      فصل {selectedChapter} از {maxChapters}
                    </span>
                    
                    <button
                      onClick={goToNextChapter}
                      disabled={selectedChapter >= maxChapters}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      فصل بعد
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>{lang === 'fa' ? 'محتوای فصل در دسترس نیست' : 'Chapter content not available'}</p>
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* Audio Controls */}
          {verses.length > 0 && (
            <div className="audio-controls bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex items-center gap-4">
                  <button
                    onClick={speakChapter}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  
                  <button
                    onClick={() => {
                      window.speechSynthesis.cancel();
                      setIsPlaying(false);
                    }}
                    className="p-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
                  >
                    <Square className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">سرعت:</span>
                  <select
                    value={preferences.audioSpeed}
                    onChange={(e) => {
                      const speed = parseFloat(e.target.value);
                      setPreferences(prev => ({ ...prev, audioSpeed: speed }));
                    }}
                    className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
                  >
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1">1x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Highlight Toolbar */}
      {showHighlightToolbar && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">هایلایت:</span>
            {HIGHLIGHT_COLORS.map(color => (
              <button
                key={color.value}
                onClick={() => handleHighlight(color.value)}
                className={`w-6 h-6 rounded-full ${color.bg} ${color.border} border-2 hover:scale-110 transition-transform`}
                title={color.name}
              />
            ))}
            <button
              onClick={() => setShowHighlightToolbar(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernBibleReader;
