/**
 * 🎵 Karaoke Lyrics Display for Broadcast Console
 * نمایش متن سرود با highlight کلمه‌به‌کلمه
 * 
 * اتصال به 364 فایل timing موجود در سایت
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppLanguage } from './types';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';

interface TimingWord {
  word: string;
  finglish?: string;
  start: number;
  end: number;
}

interface TimingLine {
  line: string;
  start: number;
  end: number;
  words: TimingWord[];
}

interface TimingData {
  songId: number;
  generatedAt: string;
  version: string;
  lines: TimingLine[];
}

interface KaraokeLyricsDisplayProps {
  songId: number;
  audioUrl?: string;
  title?: string;
  artist?: string;
  lang: AppLanguage;
  showFinglish?: boolean;
  autoPlay?: boolean;
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
  // For broadcast overlay
  isOverlay?: boolean;
  overlayStyle?: 'full' | 'bottom' | 'split';
}

export const KaraokeLyricsDisplay: React.FC<KaraokeLyricsDisplayProps> = ({
  songId,
  audioUrl,
  title,
  artist,
  lang,
  showFinglish = true,
  autoPlay = false,
  onTimeUpdate,
  onEnded,
  isOverlay = false,
  overlayStyle = 'full'
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [timingData, setTimingData] = useState<TimingData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);

  const isRTL = lang === 'fa';

  // Load timing data
  useEffect(() => {
    const loadTiming = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Try multiple paths
        const paths = [
          `/worship/data/timings/song_${songId}_timing.json`,
          `https://samanabyar.online/worship/data/timings/song_${songId}_timing.json`
        ];
        
        let data: TimingData | null = null;
        
        for (const path of paths) {
          try {
            const response = await fetch(path);
            if (response.ok) {
              data = await response.json();
              break;
            }
          } catch {
            continue;
          }
        }
        
        if (data) {
          setTimingData(data);
        } else {
          setError('فایل تایمینگ یافت نشد');
        }
      } catch (err) {
        setError('خطا در بارگذاری تایمینگ');
        console.error('Timing load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (songId) {
      loadTiming();
    }
  }, [songId]);

  // Audio time update
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
      
      // Find active line
      if (timingData) {
        const lineIndex = timingData.lines.findIndex(
          line => time >= line.start - 0.1 && time < line.end + 0.1
        );
        if (lineIndex !== activeLineIndex) {
          setActiveLineIndex(lineIndex);
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [timingData, activeLineIndex, onTimeUpdate, onEnded]);

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineIndex >= 0 && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const activeLine = container.querySelector(`[data-line-index="${activeLineIndex}"]`);
      if (activeLine) {
        activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLineIndex]);

  // Auto-play
  useEffect(() => {
    if (autoPlay && audioRef.current && audioUrl) {
      audioRef.current.play().catch(() => {});
    }
  }, [autoPlay, audioUrl]);

  // Controls
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const seekToLine = useCallback((lineIndex: number) => {
    if (!timingData || lineIndex < 0 || lineIndex >= timingData.lines.length) return;
    seek(timingData.lines[lineIndex].start);
  }, [timingData, seek]);

  // Check if word is active
  const isWordActive = useCallback((word: TimingWord) => {
    return currentTime >= word.start - 0.15 && currentTime < word.end + 0.15;
  }, [currentTime]);

  // Format time
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent border-teal-400 rounded-full animate-spin mx-auto mb-4" />
          <p className={`text-slate-400 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
            {lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className={`text-red-400 text-lg ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
            {error}
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Song ID: {songId}
          </p>
        </div>
      </div>
    );
  }

  // Overlay mode for broadcast
  if (isOverlay) {
    return (
      <div className={`absolute inset-0 flex items-center justify-center ${
        overlayStyle === 'bottom' ? 'items-end pb-24' : ''
      }`}>
        <div className={`text-center p-8 ${
          overlayStyle === 'full' ? 'bg-black/60 backdrop-blur-md rounded-2xl max-w-4xl' : ''
        }`}>
          {timingData && activeLineIndex >= 0 && (
            <>
              {/* Active Line */}
              <div className="mb-4">
                {timingData.lines[activeLineIndex]?.words.map((word, wi) => (
                  <span
                    key={wi}
                    className={`inline-block mx-1 text-4xl font-bold transition-all duration-150 ${
                      isWordActive(word)
                        ? 'text-emerald-400 scale-110'
                        : 'text-white/70'
                    } ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                    style={{
                      textShadow: isWordActive(word) 
                        ? '0 0 20px #10b981, 0 0 40px #10b981' 
                        : 'none'
                    }}
                  >
                    {word.word}
                  </span>
                ))}
              </div>
              
              {/* Finglish */}
              {showFinglish && (
                <div className="text-xl text-white/40">
                  {timingData.lines[activeLineIndex]?.words.map((word, wi) => (
                    <span
                      key={wi}
                      className={`inline-block mx-1 transition-all ${
                        isWordActive(word) ? 'text-emerald-300/60' : ''
                      }`}
                    >
                      {word.finglish || ''}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Next Line Preview */}
              {activeLineIndex + 1 < timingData.lines.length && (
                <div className={`mt-6 text-lg text-white/30 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {timingData.lines[activeLineIndex + 1].line}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Hidden Audio */}
        {audioUrl && (
          <audio ref={audioRef} src={audioUrl} preload="auto" />
        )}
      </div>
    );
  }

  // Full player mode
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      {(title || artist) && (
        <div className="p-4 border-b border-slate-700 text-center">
          {title && (
            <h2 className={`text-2xl font-bold text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              {title}
            </h2>
          )}
          {artist && (
            <p className={`text-slate-400 mt-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              {artist}
            </p>
          )}
        </div>
      )}

      {/* Lyrics Container */}
      <div 
        ref={lyricsContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-6"
      >
        {timingData?.lines.map((line, lineIndex) => {
          const isActiveLine = lineIndex === activeLineIndex;
          const isPastLine = lineIndex < activeLineIndex;
          
          return (
            <div
              key={lineIndex}
              data-line-index={lineIndex}
              onClick={() => seekToLine(lineIndex)}
              className={`cursor-pointer transition-all duration-300 p-4 rounded-xl ${
                isActiveLine 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 scale-105' 
                  : isPastLine
                    ? 'opacity-40'
                    : 'hover:bg-slate-700/30'
              }`}
            >
              {/* Main Line */}
              <div className="text-center">
                {line.words.map((word, wordIndex) => (
                  <span
                    key={wordIndex}
                    className={`inline-block mx-1 text-2xl font-bold transition-all duration-150 ${
                      isWordActive(word)
                        ? 'text-emerald-400 scale-115'
                        : isActiveLine
                          ? 'text-white'
                          : 'text-white/60'
                    } ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                    style={{
                      textShadow: isWordActive(word) 
                        ? '0 0 15px #10b981, 0 0 30px #10b981' 
                        : 'none',
                      transform: isWordActive(word) ? 'scale(1.15)' : 'scale(1)',
                      background: isWordActive(word) 
                        ? 'rgba(16, 185, 129, 0.15)' 
                        : 'transparent',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    {word.word}
                  </span>
                ))}
              </div>
              
              {/* Finglish Line */}
              {showFinglish && (
                <div className="text-center mt-2">
                  {line.words.map((word, wordIndex) => (
                    <span
                      key={wordIndex}
                      className={`inline-block mx-1 text-sm transition-all ${
                        isWordActive(word)
                          ? 'text-emerald-300/70'
                          : 'text-white/30'
                      }`}
                    >
                      {word.finglish || ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Audio Controls */}
      {audioUrl && (
        <div className="p-4 bg-slate-900/80 backdrop-blur border-t border-slate-700">
          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => seek(Math.max(0, currentTime - 10))}
              className="p-2 text-slate-400 hover:text-white transition"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            
            <button
              onClick={togglePlay}
              className="p-4 bg-emerald-600 hover:bg-emerald-500 rounded-full text-white transition shadow-lg shadow-emerald-500/30"
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
            </button>
            
            <button
              onClick={() => seek(Math.min(duration, currentTime + 10))}
              className="p-2 text-slate-400 hover:text-white transition"
            >
              <SkipForward className="w-6 h-6" />
            </button>
            
            <button
              onClick={toggleMute}
              className="p-2 text-slate-400 hover:text-white transition ml-4"
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
          </div>
          
          {/* Hidden Audio Element */}
          <audio ref={audioRef} src={audioUrl} preload="auto" />
        </div>
      )}
    </div>
  );
};

export default KaraokeLyricsDisplay;
