import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Settings, Volume2, VolumeX } from 'lucide-react';

interface KaraokeWord {
  text: string;
  start: number;
  end: number;
}

interface KaraokeTimingData {
  metadata: {
    title: string;
    totalDuration: number;
    wordCount: number;
  };
  words: KaraokeWord[];
  lines?: {
    text: string;
    start: number;
    end: number;
    words: KaraokeWord[];
  }[];
}

interface KaraokeSong {
  id: number;
  title: { fa: string; en: string };
  artist?: string;
  audioUrl: string;
  lyrics?: { fa?: string; en?: string };
}

interface AdvancedKaraokeModeProps {
  isOpen: boolean;
  onClose: () => void;
  song: KaraokeSong;
  timingData?: KaraokeTimingData;
  lang?: 'fa' | 'en';
}

const AdvancedKaraokeMode: React.FC<AdvancedKaraokeModeProps> = ({
  isOpen,
  onClose,
  song,
  timingData,
  lang = 'fa'
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // Extract data from song
  const songTitle = song.title;
  const audioUrl = song.audioUrl;
  const lyrics = song.lyrics?.[lang] || song.lyrics?.fa || '';

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [syncOffset, setSyncOffset] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(2); // em

  // Parse lyrics into words if no timing data
  const words: KaraokeWord[] = timingData?.words || [];
  const hasTimingData = words.length > 0;

  // Strip chord notations from lyrics
  const cleanLyrics = lyrics
    ?.replace(/\[[A-Ga-g][#b]?[a-zA-Z0-9\/]*\]/g, '')
    .replace(/\b[Vv]\d+\b/g, '')
    .replace(/\b(Chorus|Bridge|Pre-Chorus|Outro|Intro|Verse)\s*(\(\d+\)|\(\d*x\d*\))?/gi, '')
    .replace(/\([x×]\d+\)/gi, '')
    .replace(/\[column\]/gi, '')
    .trim() || '';

  // Split lyrics into words for display (fallback)
  const displayWords = cleanLyrics.split(/\s+/).filter(w => w.length > 0);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime + syncOffset;
      setCurrentTime(time);

      if (hasTimingData) {
        // Find current word based on timing
        const index = words.findIndex(
          (word, i) => time >= word.start && time < word.end
        );
        setCurrentWordIndex(index);
      } else {
        // Estimate word position based on duration
        const progress = time / duration;
        const estimatedIndex = Math.floor(progress * displayWords.length);
        setCurrentWordIndex(estimatedIndex);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentWordIndex(-1);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [hasTimingData, words, duration, displayWords.length, syncOffset]);

  // Scroll to active word
  useEffect(() => {
    if (currentWordIndex >= 0 && lyricsContainerRef.current) {
      const activeElement = lyricsContainerRef.current.querySelector('.word.active');
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [currentWordIndex]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setCurrentWordIndex(-1);
    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const changeSpeed = useCallback(() => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  }, [playbackSpeed]);

  const adjustSync = useCallback((delta: number) => {
    setSyncOffset(prev => prev + delta);
  }, []);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          adjustSync(-0.1);
          break;
        case 'ArrowRight':
          adjustSync(0.1);
          break;
        case 'r':
        case 'R':
          restart();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, togglePlay, onClose, adjustSync, restart]);

  if (!isOpen) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="text-white">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              🎤 حالت کاراوکه
            </h2>
            <p className="text-white/80 mt-1">{songTitle[lang] || songTitle.fa}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Audio Element */}
      <audio ref={audioRef} src={audioUrl} preload="auto" />

      {/* Progress Bar */}
      <div className="bg-gray-900 px-6 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Lyrics Display */}
      <div
        ref={lyricsContainerRef}
        className="flex-1 overflow-y-auto px-6 py-8"
        dir={lang === 'fa' ? 'rtl' : 'ltr'}
      >
        <div
          className="max-w-4xl mx-auto text-center leading-relaxed"
          style={{ fontSize: `${fontSize}em`, lineHeight: 2.5 }}
        >
          {hasTimingData ? (
            // Word-by-word with timing
            words.map((word, idx) => {
              const isPast = currentTime >= word.end;
              const isActive = idx === currentWordIndex;
              const isUpcoming = currentTime < word.start;

              return (
                <span
                  key={idx}
                  className={`
                    inline-block mx-1 px-2 py-1 rounded-lg transition-all duration-200
                    ${isActive ? 'word active bg-gradient-to-r from-pink-500 to-purple-500 text-white scale-125 shadow-lg shadow-pink-500/50' : ''}
                    ${isPast ? 'past text-gray-500' : ''}
                    ${isUpcoming ? 'text-white/70' : ''}
                  `}
                >
                  {word.text}
                </span>
              );
            })
          ) : (
            // Fallback: estimate timing
            displayWords.map((word, idx) => {
              const isPast = idx < currentWordIndex;
              const isActive = idx === currentWordIndex;

              return (
                <span
                  key={idx}
                  className={`
                    inline-block mx-1 px-2 py-1 rounded-lg transition-all duration-200
                    ${isActive ? 'word active bg-gradient-to-r from-pink-500 to-purple-500 text-white scale-125 shadow-lg shadow-pink-500/50' : ''}
                    ${isPast ? 'text-gray-500' : ''}
                    ${!isPast && !isActive ? 'text-white/70' : ''}
                  `}
                >
                  {word}
                </span>
              );
            })
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 border-t border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4 flex-wrap">
          {/* Restart */}
          <button
            onClick={restart}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition-colors"
          >
            <RotateCcw size={18} />
            <span className="hidden sm:inline">از اول</span>
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/30 transition-all hover:scale-105"
          >
            {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
          </button>

          {/* Speed */}
          <button
            onClick={changeSpeed}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition-colors"
          >
            ⏱️ {playbackSpeed}x
          </button>

          {/* Mute */}
          <button
            onClick={toggleMute}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full transition-colors"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
              showSettings ? 'bg-purple-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'
            }`}
          >
            <Settings size={18} />
            <span className="hidden sm:inline">تنظیمات</span>
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="max-w-4xl mx-auto mt-4 p-4 bg-gray-800 rounded-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sync Offset */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  تنظیم همگام‌سازی: {syncOffset.toFixed(1)}s
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustSync(-0.1)}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded"
                  >
                    -0.1s
                  </button>
                  <button
                    onClick={() => setSyncOffset(0)}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => adjustSync(0.1)}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded"
                  >
                    +0.1s
                  </button>
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  اندازه متن: {fontSize}em
                </label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.25"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-gray-500 text-sm text-center">
                ⌨️ میانبرها: Space = پخش/توقف | ← → = تنظیم همگام | R = از اول | Esc = خروج
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default AdvancedKaraokeMode;
