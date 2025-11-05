// ReadAlongView.tsx
// ✨ Karaoke-style word-by-word Bible read-along component
// Synchronized word highlighting with audio playback

import React, { useEffect, useRef, useState } from "react";
import { Chapter } from "./BilingualBiblePresentation";

interface ReadAlongViewProps {
  chapter: Chapter;
  audioUrl: string | null;
  wordsPerSecond: number;
  onWordsPerSecondChange: (speed: number) => void;
  fontScale: number;
  bookName: string;
  playing: boolean;
  onPlayPause: () => void;
}

const ReadAlongView: React.FC<ReadAlongViewProps> = ({
  chapter,
  audioUrl,
  wordsPerSecond,
  onWordsPerSecondChange,
  fontScale,
  bookName,
  playing,
  onPlayPause,
}) => {
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [allWords, setAllWords] = useState<Array<{ word: string; verseNumber: number; wordIndex: number }>>([]);

  // Extract all words from verses
  useEffect(() => {
    const words: Array<{ word: string; verseNumber: number; wordIndex: number }> = [];
    let wordIndex = 0;
    
    chapter.verses.forEach((verse) => {
      const verseWords = verse.text_fa.split(/\s+/).filter(w => w.length > 0);
      verseWords.forEach((word) => {
        words.push({ word, verseNumber: verse.verseNumber, wordIndex: wordIndex++ });
      });
    });
    
    setAllWords(words);
  }, [chapter]);

  // Setup audio player
  useEffect(() => {
    const audio = audioPlayerRef.current;
    if (!audio || !audioUrl) return;

    audio.src = audioUrl;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleLoadedMetadata = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [audioUrl]);

  // Auto-play when audio URL changes
  useEffect(() => {
    if (audioUrl && playing && audioPlayerRef.current) {
      audioPlayerRef.current.play().catch((err) => {
        console.error('Auto-play failed:', err);
      });
    }
  }, [audioUrl, playing]);

  // Play/Pause control
  useEffect(() => {
    const audio = audioPlayerRef.current;
    if (!audio) return;

    if (playing) {
      audio.play().catch((err) => console.error('Play failed:', err));
    } else {
      audio.pause();
    }
  }, [playing]);

  // Calculate current word index based on time and speed
  const currentWordIndex = Math.floor(currentTime * wordsPerSecond);

  // Scroll current word into view
  useEffect(() => {
    const currentWordEl = document.getElementById(`word-${currentWordIndex}`);
    if (currentWordEl) {
      currentWordEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentWordIndex]);

  // Format time
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Seek handler
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioPlayerRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audio.currentTime = percentage * duration;
  };

  if (!audioUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-neutral-100" dir="rtl">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="text-2xl font-bold text-neutral-800 mb-2">صدا در دسترس نیست</h3>
          <p className="text-neutral-600">
            این فصل فایل صوتی ندارد. لطفاً یکی از کتاب‌های زیر را انتخاب کنید:
          </p>
          <p className="text-sm text-neutral-500 mt-4">
            • همه کتاب‌های عهد جدید (27 کتاب)<br/>
            • مزامیر (Psalms)<br/>
            • امثال (Proverbs)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-50 to-pink-50" dir="rtl">
      {/* Audio Player (hidden) */}
      <audio ref={audioPlayerRef} className="hidden" />

      {/* Header with controls */}
      <div className="bg-white/90 backdrop-blur shadow-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-lg font-bold text-purple-700">{bookName} - فصل {chapter.chapterNumber}</div>
          <div className="text-sm text-neutral-600">
            {allWords.length} کلمه
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-sm text-neutral-700">سرعت:</label>
          <input
            type="range"
            min="1"
            max="5"
            step="0.1"
            value={wordsPerSecond}
            onChange={(e) => onWordsPerSecondChange(parseFloat(e.target.value))}
            className="w-24"
          />
          <span className="text-sm font-mono bg-purple-100 px-2 py-1 rounded">
            {wordsPerSecond.toFixed(1)}
          </span>
          <span className="text-xs text-neutral-500">کلمه/ثانیه</span>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-purple-100 text-purple-800 text-center py-2 text-sm">
        <span className="font-semibold">💡 نکته:</span> سرعت بهینه برای فارسی: 1.5 تا 1.7 کلمه در ثانیه
      </div>

      {/* Verses with word-by-word highlighting */}
      <div className="flex-1 overflow-y-auto p-8">
        {chapter.verses.map((verse) => {
          const verseWords = verse.text_fa.split(/\s+/).filter(w => w.length > 0);
          const startWordIndex = allWords.findIndex(w => w.verseNumber === verse.verseNumber);

          return (
            <div key={verse.verseNumber} className="mb-6 bg-white rounded-2xl p-6 shadow-sm">
              <span className="inline-block text-purple-600 font-bold text-3xl ml-3 align-top">
                {verse.verseNumber}
              </span>
              <div className="inline" style={{ fontSize: `${fontScale * 1.2}rem`, lineHeight: 2 }}>
                {verseWords.map((word, idx) => {
                  const globalWordIndex = startWordIndex + idx;
                  const isActive = globalWordIndex === currentWordIndex;
                  const isCompleted = globalWordIndex < currentWordIndex;

                  return (
                    <span
                      key={idx}
                      id={`word-${globalWordIndex}`}
                      className={`inline-block mx-1 px-2 py-1 rounded-lg transition-all duration-300 ${
                        isActive
                          ? 'bg-yellow-300 text-black font-bold scale-110 shadow-lg'
                          : isCompleted
                          ? 'bg-purple-100 text-purple-800'
                          : 'text-neutral-700'
                      }`}
                      style={{ fontFamily: '"B Homa", ui-sans-serif, system-ui' }}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom audio controls */}
      <div className="bg-white/95 backdrop-blur border-t border-neutral-200 px-6 py-4">
        {/* Progress bar */}
        <div
          className="w-full h-3 bg-neutral-200 rounded-full cursor-pointer mb-3 overflow-hidden"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        {/* Time and controls */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-mono text-neutral-600">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          <button
            onClick={onPlayPause}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
          >
            {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </button>

          <div className="text-sm text-neutral-500">
            کلمه {currentWordIndex + 1} از {allWords.length}
          </div>
        </div>
      </div>
    </div>
  );
};

// Import Play and Pause icons
import { Play, Pause } from "lucide-react";

export default ReadAlongView;
