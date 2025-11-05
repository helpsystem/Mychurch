// BibleKaraokeReader.tsx
// ------------------------------------------------------------
// Complete Bible Reader with Word-by-Word Karaoke Mode
// Uses local audio files and timing data
// ------------------------------------------------------------

import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Play, Pause, Volume2, Zap } from 'lucide-react';

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
  }>>>;
}

interface TimingWord {
  word: string;
  verse: string;
  start: number;
  end: number;
}

interface TimingData {
  words: TimingWord[];
}

interface Verse {
  verseNumber: number;
  text: string;
  words: string[];
}

// Books that have audio files locally
const BOOKS_WITH_AUDIO = [
  { code: 'EPH', name_fa: 'افسسیان', name_en: 'Ephesians', chapters: 6 }
];

const BibleKaraokeReader: React.FC = () => {
  const [bibleData, setBibleData] = useState<BibleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState('EPH');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [timingData, setTimingData] = useState<TimingData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [audioProgress, setAudioProgress] = useState(0);
  const [speed, setSpeed] = useState(1.6);

  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>();

  // Load Bible data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/bible_data.json');
        const data = await response.json();
        setBibleData(data);
      } catch (error) {
        console.error('Error loading Bible data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load chapter
  const loadChapter = async () => {
    if (!bibleData) return;

    try {
      // Load text from bible_data.json
      const chapterData = bibleData.bible_text['118']?.[selectedBook]?.[selectedChapter.toString()];
      if (!chapterData || !chapterData.fa) {
        alert('این فصل موجود نیست');
        return;
      }

      // Convert to verses array
      const versesArray: Verse[] = Object.keys(chapterData.fa).map(verseNum => {
        const text = chapterData.fa[verseNum];
        const words = text.split(/\s+/).filter(w => w.length > 0);
        return {
          verseNumber: parseInt(verseNum),
          text,
          words
        };
      });

      setVerses(versesArray);

      // Load audio
      const audioPath = `/audio/bible/farsi/${selectedBook}/${selectedChapter}.mp3`;
      if (audioRef.current) {
        audioRef.current.src = audioPath;
        audioRef.current.load();
      }

      // Try to load timing data
      try {
        const timingPath = `/bible-timings/bible_${selectedBook}_${selectedChapter}_timing.json`;
        const timingResponse = await fetch(timingPath);
        if (timingResponse.ok) {
          const timing = await timingResponse.json();
          setTimingData(timing);
          console.log('✅ Timing data loaded:', timing.words.length, 'words');
        } else {
          setTimingData(null);
          console.log('⚠️ No timing data for this chapter - using speed-based highlighting');
        }
      } catch (error) {
        setTimingData(null);
        console.log('⚠️ No timing data available');
      }

      setCurrentWordIndex(-1);
      setAudioProgress(0);

    } catch (error) {
      console.error('Error loading chapter:', error);
      alert('خطا در بارگذاری فصل');
    }
  };

  // Handle audio playback with word highlighting
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateHighlight = () => {
      if (!isPlaying) return;

      const currentTime = audio.currentTime;
      setAudioProgress((currentTime / audio.duration) * 100 || 0);

      if (timingData) {
        // Use exact timing data
        const currentWord = timingData.words.findIndex(
          w => currentTime >= w.start && currentTime <= w.end
        );
        if (currentWord !== -1 && currentWord !== currentWordIndex) {
          setCurrentWordIndex(currentWord);
          
          // Scroll to current word
          const wordElement = document.getElementById(`word-${currentWord}`);
          if (wordElement) {
            wordElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      } else {
        // Use speed-based highlighting
        const totalWords = verses.reduce((sum, v) => sum + v.words.length, 0);
        const wordsPerSecond = speed;
        const estimatedWordIndex = Math.floor(currentTime * wordsPerSecond);
        
        if (estimatedWordIndex !== currentWordIndex && estimatedWordIndex < totalWords) {
          setCurrentWordIndex(estimatedWordIndex);
        }
      }

      animationRef.current = requestAnimationFrame(updateHighlight);
    };

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateHighlight);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, timingData, currentWordIndex, verses, speed]);

  // Audio event handlers
  const handlePlay = () => {
    audioRef.current?.play();
    setIsPlaying(true);
  };

  const handlePause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  };

  // Format time
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  let wordCounter = 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-center flex items-center justify-center gap-3 mb-4">
            <BookOpen className="text-blue-400" size={32} />
            کتاب مقدس - حالت روخوانی
          </h1>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Book Selection */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">📚 کتاب</label>
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                dir="rtl"
              >
                {BOOKS_WITH_AUDIO.map(book => (
                  <option key={book.code} value={book.code}>
                    🎵 {book.name_fa} ({book.name_en})
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter Selection */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">📖 فصل</label>
              <input
                type="number"
                min="1"
                max={BOOKS_WITH_AUDIO.find(b => b.code === selectedBook)?.chapters || 1}
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(parseInt(e.target.value) || 1)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
            </div>

            {/* Speed Control */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                <Zap size={14} className="inline" /> سرعت: {speed} کلمه/ثانیه
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full"
                disabled={!!timingData}
              />
              {timingData && (
                <p className="text-xs text-green-400 mt-1">✅ Timing دقیق فعال</p>
              )}
            </div>

            {/* Load Button */}
            <div className="flex items-end">
              <button
                onClick={loadChapter}
                className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
              >
                🔄 بارگذاری
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Player */}
      {verses.length > 0 && (
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button
                onClick={isPlaying ? handlePause : handlePlay}
                className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>

              {/* Progress Bar */}
              <div className="flex-1">
                <div
                  className="h-2 bg-gray-700 rounded-full cursor-pointer"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
                  <span>{formatTime(audioRef.current?.duration || 0)}</span>
                </div>
              </div>

              <Volume2 className="text-gray-400" size={20} />
            </div>
          </div>
        </div>
      )}

      {/* Verses Display */}
      <div className="max-w-6xl mx-auto p-6">
        {verses.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p>کتاب و فصل را انتخاب کرده و روی بارگذاری کلیک کنید</p>
          </div>
        ) : (
          <div className="space-y-6" dir="rtl">
            {verses.map((verse) => {
              const verseWords = verse.words.map((word, idx) => {
                const globalIndex = wordCounter++;
                const isActive = globalIndex === currentWordIndex;
                const isPast = globalIndex < currentWordIndex;

                return (
                  <span
                    key={idx}
                    id={`word-${globalIndex}`}
                    className={`inline-block px-1 py-0.5 mx-0.5 rounded transition-all duration-200 ${
                      isActive
                        ? 'bg-yellow-500 text-black font-bold scale-110'
                        : isPast
                        ? 'bg-purple-900 text-purple-200'
                        : 'text-gray-300'
                    }`}
                  >
                    {word}
                  </span>
                );
              });

              // Reset counter for next verse
              wordCounter -= verse.words.length;
              wordCounter += verse.words.length;

              return (
                <div key={verse.verseNumber} className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {verse.verseNumber}
                  </span>
                  <p className="flex-1 text-lg leading-loose">
                    {verseWords}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Info Box */}
      {verses.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 max-w-xs shadow-xl">
          <p className="text-sm text-gray-300">
            <strong className="text-white">💡 راهنما:</strong><br />
            کلمات فعلی <span className="bg-yellow-500 text-black px-2 py-0.5 rounded">زرد</span><br />
            کلمات خوانده شده <span className="bg-purple-900 text-purple-200 px-2 py-0.5 rounded">بنفش</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default BibleKaraokeReader;
