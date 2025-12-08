// ReadAlongView.tsx
// ✨ Karaoke-style word-by-word Bible read-along component
// Synchronized word highlighting with audio playback

import React, { useEffect, useRef, useState } from "react";
import { Chapter } from "./BilingualBiblePresentation";
import { Play, Pause } from "lucide-react";

interface ReadAlongViewProps {
  chapter: Chapter;
  audioUrl: string | null;
  wordsPerSecond: number;
  onWordsPerSecondChange: (speed: number) => void;
  fontScale: number;
  bookName: string;
  playing: boolean;
  onPlayPause: () => void;
  onStop: () => void; // ✨ NEW: Stop handler
  viewMode: 'both' | 'fa' | 'en'; // ✨ NEW
  highlightColor: string; // ✨ NEW
  audioRef: React.RefObject<HTMLAudioElement>; // ✨ NEW: Shared audio ref
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
  onStop,
  viewMode,
  highlightColor,
  audioRef // Use shared audio ref
}) => {
  // Remove local audioPlayerRef - use shared one
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
    const audio = audioRef.current; // Use shared ref
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
  }, [audioUrl, audioRef]);

  // Auto-play when audio URL changes
  useEffect(() => {
    if (audioUrl && playing && audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.error('Auto-play failed:', err);
      });
    }
  }, [audioUrl, playing, audioRef]);

  // Play/Pause control
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.play().catch((err) => console.error('Play failed:', err));
    } else {
      audio.pause();
    }
  }, [playing, audioRef]);

  // Calculate current word index based on time and speed
  // NOTE: This is a simplified linear approximation. Real karaoke needs precise timestamps.
  const currentWordIndex = Math.floor(currentTime * wordsPerSecond);

  // Scroll current word into view
  useEffect(() => {
    // Only scroll if we are tracking words (Fa mode)
    // If in En mode, we might want to scroll verses instead? 
    // For now, this logic applies primarily to Farsi since our karaoke engine is Fa-based.
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
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audio.currentTime = percentage * duration;
  };;

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
            • همه کتاب‌های عهد جدید (27 کتاب)<br />
            • مزامیر (Psalms)<br />
            • امثال (Proverbs)
          </p>
        </div>
      </div>
    );
  }

  // Determine grid columns based on viewMode
  const gridClass = viewMode === 'both' ? 'grid md:grid-cols-2 gap-8' : 'grid grid-cols-1 max-w-4xl mx-auto';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-50 to-pink-50" dir="rtl">
      {/* Shared Audio Player (hidden) - controlled by parent */}
      <audio ref={audioRef} className="hidden" />

      {/* Header with controls */}
      <div className="bg-white/90 backdrop-blur shadow-md px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="text-lg font-bold text-purple-700">{bookName} - فصل {chapter.chapterNumber}</div>
          {(viewMode === 'fa' || viewMode === 'both') && (
            <div className="text-sm text-neutral-600">
              {allWords.length} کلمه
            </div>
          )}
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
          <span className="text-xs text-neutral-500">ک/ث</span>
        </div>
      </div>

      {/* Verses Container */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className={gridClass}>

          {/* LEFT COLUMN: ENGLISH (only if 'both' or 'en') */}
          {(viewMode === 'both' || viewMode === 'en') && (
            <div className="space-y-6" dir="ltr">
              {chapter.verses.map((verse) => {
                // Estimate active verse based on word index? 
                // Since we track Farsi words, we need to map Farsi Word Index -> Verse Index
                const verseWords = verse.text_fa.split(/\s+/).filter(w => w.length > 0);
                const startWordIndex = allWords.findIndex(w => w.verseNumber === verse.verseNumber);
                const endWordIndex = startWordIndex + verseWords.length;
                const isVerseActive = currentWordIndex >= startWordIndex && currentWordIndex < endWordIndex;

                return (
                  <div key={`en-${verse.verseNumber}`}
                    className={`p-6 rounded-2xl transition-all duration-500 ${isVerseActive ? 'bg-white shadow-lg scale-105 border-l-4' : 'bg-white/40 opacity-80'}`}
                    style={{ borderColor: isVerseActive ? highlightColor : 'transparent' }}
                  >
                    <span className="text-sky-600 font-bold text-xl mr-3">{verse.verseNumber}</span>
                    <span className="text-lg text-neutral-800 leading-relaxed font-serif">
                      {verse.text_en}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* RIGHT COLUMN: FARSI (only if 'both' or 'fa') */}
          {(viewMode === 'both' || viewMode === 'fa') && (
            <div className="space-y-6">
              {chapter.verses.map((verse) => {
                const verseWords = verse.text_fa.split(/\s+/).filter(w => w.length > 0);
                const startWordIndex = allWords.findIndex(w => w.verseNumber === verse.verseNumber);
                const endWordIndex = startWordIndex + verseWords.length;
                const isVerseActive = currentWordIndex >= startWordIndex && currentWordIndex < endWordIndex;

                return (
                  <div key={`fa-${verse.verseNumber}`}
                    className={`p-6 rounded-2xl transition-all duration-500 ${isVerseActive ? 'bg-white shadow-lg scale-105 border-r-4' : 'bg-white/40 opacity-80'}`}
                    style={{ borderColor: isVerseActive ? highlightColor : 'transparent' }}
                  >
                    <span className="text-purple-600 font-bold text-xl ml-3">{verse.verseNumber}</span>
                    <span className="text-lg text-neutral-800 leading-relaxed font-serif">
                      {verseWords.map((word, idx) => {
                        const wordGlobalIndex = startWordIndex + idx;
                        const isWordActive = wordGlobalIndex === currentWordIndex;
                        return (
                          <span
                            key={`word-${wordGlobalIndex}`}
                            id={`word-${wordGlobalIndex}`}
                            className={`transition-all duration-300 ${isWordActive ? 'font-extrabold text-purple-800 scale-105' : ''}`}
                            style={{ backgroundColor: isWordActive ? highlightColor + '40' : 'transparent' }}
                          >
                            {word}{' '}
                          </span>
                        );
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom audio controls */}
      <div className="bg-white/95 backdrop-blur border-t border-neutral-200 px-6 py-4 z-50">
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
            {viewMode !== 'en' && `کلمه ${currentWordIndex + 1} از ${allWords.length}`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadAlongView;
