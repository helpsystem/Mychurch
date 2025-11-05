// components/BibleAudioTextSync.tsx
// Advanced Audio-Text Synchronization Component
// Supports bilingual (English + Persian) word-level highlighting

import React, { useState } from 'react';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, Settings } from 'lucide-react';
import { useAudioTextSync, TranscriptData, SyncMode } from '../hooks/useAudioTextSync';

interface BibleAudioTextSyncProps {
  audioUrl: string;
  transcriptEn: TranscriptData;
  transcriptFa: TranscriptData;
  bookName: string;
  chapter: number;
  className?: string;
}

export const BibleAudioTextSync: React.FC<BibleAudioTextSyncProps> = ({
  audioUrl,
  transcriptEn,
  transcriptFa,
  bookName,
  chapter,
  className = '',
}) => {
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'fa' | 'both'>('both');
  const [syncMode, setSyncMode] = useState<SyncMode>('word');
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);

  // Use the custom hook for audio sync
  const {
    isPlaying,
    isPaused,
    isLoading,
    error,
    currentTime,
    duration,
    progress,
    currentWordIndex,
    currentWord,
    currentVerseNumber,
    play,
    pause,
    stop,
    seek,
    seekToVerse,
    setPlaybackRate: setRate,
    setVolume: setVol,
    audioRef,
  } = useAudioTextSync({
    audioUrl,
    transcript: activeLanguage === 'fa' ? transcriptFa : transcriptEn,
    mode: syncMode,
    onVerseChange: (verseNum) => {
      console.log('Verse changed:', verseNum);
    },
  });

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle playback rate change
  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    setRate(rate);
  };

  // Handle volume change
  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    setVol(vol);
  };

  // Render word with highlighting
  const renderWord = (word: string, wordIndex: number, language: 'en' | 'fa') => {
    const isActive = wordIndex === currentWordIndex;
    const baseClasses = 'inline-block px-1 py-0.5 mx-0.5 transition-all duration-200 rounded';
    const activeClasses = isActive
      ? 'bg-yellow-400 text-gray-900 font-bold shadow-lg scale-110'
      : 'hover:bg-gray-200 dark:hover:bg-gray-700';

    return (
      <span
        key={wordIndex}
        className={`${baseClasses} ${activeClasses}`}
        style={{
          direction: language === 'fa' ? 'rtl' : 'ltr',
        }}
      >
        {word}
      </span>
    );
  };

  // Render verse with word highlighting
  const renderVerse = (verse: any, language: 'en' | 'fa') => {
    const isActiveVerse = verse.verse === currentVerseNumber;
    const verseClasses = isActiveVerse
      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
      : '';

    return (
      <div
        key={verse.verse}
        className={`mb-4 p-4 rounded-lg transition-all ${verseClasses}`}
        dir={language === 'fa' ? 'rtl' : 'ltr'}
      >
        <span className="inline-block w-8 h-8 bg-blue-600 text-white rounded-full text-center leading-8 font-bold mr-2">
          {verse.verse}
        </span>
        <div className="inline text-lg leading-relaxed">
          {verse.words.map((w: any, idx: number) =>
            renderWord(w.word, w.index, language)
          )}
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-700 dark:text-red-300">
        <h3 className="font-bold mb-2">Error Loading Audio</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">
          {bookName} - Chapter {chapter}
        </h2>
        <p className="text-blue-100">Audio-Text Synchronized Bible</p>
      </div>

      {/* Controls */}
      <div className="bg-gray-100 dark:bg-gray-900 p-4">
        {/* Language Selection */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => setActiveLanguage('en')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              activeLanguage === 'en'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setActiveLanguage('both')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              activeLanguage === 'both'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Both
          </button>
          <button
            onClick={() => setActiveLanguage('fa')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              activeLanguage === 'fa'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            فارسی
          </button>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => seekToVerse(Math.max(1, currentVerseNumber - 1))}
            className="p-3 bg-gray-300 dark:bg-gray-700 rounded-full hover:bg-gray-400 dark:hover:bg-gray-600 transition-all"
            disabled={isLoading}
          >
            <SkipBack size={20} />
          </button>

          {!isPlaying ? (
            <button
              onClick={play}
              className="p-4 bg-green-600 hover:bg-green-700 rounded-full transition-all shadow-lg"
              disabled={isLoading}
            >
              <Play size={28} fill="white" />
            </button>
          ) : (
            <button
              onClick={pause}
              className="p-4 bg-yellow-600 hover:bg-yellow-700 rounded-full transition-all shadow-lg"
            >
              <Pause size={28} fill="white" />
            </button>
          )}

          <button
            onClick={stop}
            className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-all"
            disabled={isLoading}
          >
            <Square size={20} fill="white" />
          </button>

          <button
            onClick={() => seekToVerse(Math.min(transcriptEn.verses.length, currentVerseNumber + 1))}
            className="p-3 bg-gray-300 dark:bg-gray-700 rounded-full hover:bg-gray-400 dark:hover:bg-gray-600 transition-all"
            disabled={isLoading}
          >
            <SkipForward size={20} />
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 bg-gray-300 dark:bg-gray-700 rounded-full hover:bg-gray-400 dark:hover:bg-gray-600 transition-all"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>{formatTime(currentTime)}</span>
            <span className="font-semibold">Verse {currentVerseNumber}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div
            className="h-2 bg-gray-300 dark:bg-gray-700 rounded-full cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percentage = x / rect.width;
              seek(percentage * duration);
            }}
          >
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 shadow-lg">
            <h3 className="font-bold mb-3">Playback Settings</h3>
            
            {/* Sync Mode */}
            <div className="mb-3">
              <label className="block text-sm font-semibold mb-2">Sync Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSyncMode('word')}
                  className={`px-3 py-1 rounded ${
                    syncMode === 'word' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  Word
                </button>
                <button
                  onClick={() => setSyncMode('verse')}
                  className={`px-3 py-1 rounded ${
                    syncMode === 'verse' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  Verse
                </button>
                <button
                  onClick={() => setSyncMode('phrase')}
                  className={`px-3 py-1 rounded ${
                    syncMode === 'phrase' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  Phrase
                </button>
              </div>
            </div>

            {/* Playback Speed */}
            <div className="mb-3">
              <label className="block text-sm font-semibold mb-2">
                Speed: {playbackRate.toFixed(2)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={playbackRate}
                onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Volume */}
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                <Volume2 size={16} />
                Volume: {Math.round(volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Text Display */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading audio...</p>
          </div>
        ) : (
          <div className={activeLanguage === 'both' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}>
            {/* English Text */}
            {(activeLanguage === 'en' || activeLanguage === 'both') && (
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-blue-600 mb-4">English (NMV)</h3>
                {transcriptEn.verses.map(verse => renderVerse(verse, 'en'))}
              </div>
            )}

            {/* Persian Text */}
            {(activeLanguage === 'fa' || activeLanguage === 'both') && (
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-purple-600 mb-4" dir="rtl">
                  فارسی (مژده)
                </h3>
                {transcriptFa.verses.map(verse => renderVerse(verse, 'fa'))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
    </div>
  );
};

export default BibleAudioTextSync;
