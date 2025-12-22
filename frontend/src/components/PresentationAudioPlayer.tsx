// PresentationAudioPlayer.tsx
// ============================================================
// Ultra-Premium Floating Audio Player for Presentation Mode
// ============================================================
// Integrates with BilingualBiblePresentation
// Uses Bible Local API (previously failed with generic audio API)
// Style adapted from "BibleReader.tsx" (Reference Project)
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Volume2, Play, Pause, RotateCcw, Settings, SkipBack, SkipForward, Loader2 } from 'lucide-react';

interface PresentationAudioPlayerProps {
  bookCode: string;
  chapter: number;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  autoPlay?: boolean;
  compact?: boolean;
  isPlaying?: boolean; // ✨ External play control
  onPlayingChange?: (playing: boolean) => void; // ✨ Notify parent of play state changes
}

const PresentationAudioPlayer: React.FC<PresentationAudioPlayerProps> = ({
  bookCode,
  chapter,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onDurationChange,
  autoPlay = false,
  compact = true,
  isPlaying = false, // ✨ External control
  onPlayingChange,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // ❌ REMOVED: const [playing, setPlaying] = useState(false); - now using prop isPlaying
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch audio source when book/chapter changes
  useEffect(() => {
    fetchAudioSource();
  }, [bookCode, chapter]);

  // Auto-play if enabled
  useEffect(() => {
    if (audioUrl && autoPlay && audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error('Auto-play failed:', err);
      });
    }
  }, [audioUrl, autoPlay]);

  // ✨ Sync isPlaying prop with audio element
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;

    const audio = audioRef.current;

    if (isPlaying && audio.paused) {
      // Prop says play, but audio is paused → play it
      audio.play().catch(err => {
        console.error('Sync play failed:', err);
        onPlayingChange?.(false); // Notify parent that play failed
      });
    } else if (!isPlaying && !audio.paused) {
      // Prop says pause, but audio is playing → pause it
      audio.pause();
    }
  }, [isPlaying, audioUrl, onPlayingChange]);

  const fetchAudioSource = async () => {
    try {
      setLoading(true);
      setError(null);
      setAudioUrl(null);

      // Use the verify-to-work 'bible-local' endpoint
      // Try TPV (Persian) first
      const response = await axios.get(`/api/bible-local/content/TPV/${bookCode}/${chapter}`);

      if (response.data.success && response.data.audioUrl) {
        setAudioUrl(response.data.audioUrl);
      } else {
        // If local TPV fails, try fetching metadata from the 'backend' general route if it exists,
        // or fallback to just showing error.
        setError('فایل صوتی یافت نشد');
      }

    } catch (err) {
      console.error('Failed to fetch audio source:', err);
      setError('خطا در بارگذاری فایل صوتی');
    } finally {
      setLoading(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      onPlayingChange?.(false); // ✨ Notify parent
      onPause?.();
    } else {
      audioRef.current.play().then(() => {
        onPlayingChange?.(true); // ✨ Notify parent
        onPlay?.();
      }).catch(err => {
        console.error('Play error:', err);
        setError('خطا در پخش صوت');
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      setDuration(dur);
      onDurationChange?.(dur);
    }
  };

  const handleEnded = () => {
    onPlayingChange?.(false);
    onEnded?.();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const time = parseFloat(e.target.value);
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    setShowSettings(false);
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      onPlayingChange?.(true);
    }
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 bg-neutral-900/80 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 shadow-lg text-white/60 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>در حال بارگذاری صوت...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 bg-red-900/80 backdrop-blur-md rounded-full px-4 py-2 border border-red-500/30 shadow-lg text-red-200 text-sm">
        <span>⚠️ {error}</span>
        <button
          onClick={fetchAudioSource}
          className="text-xs bg-red-600 hover:bg-red-500 px-2 py-1 rounded-full transition-colors"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  if (!audioUrl) {
    return null;
  }

  // Ultra-Premium Floating Player Design (Adapted from Reference Code)
  return (
    <div
      className="flex items-center gap-3 sm:gap-4 rounded-[2.5rem] bg-neutral-800/90 p-2 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/10 min-w-[320px]"
      dir="ltr"
    >
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={() => setError('خطا در بارگذاری فایل صوتی')}
      />

      {/* Play Controls */}
      <div className="flex items-center gap-2 pr-2 border-r border-white/10">
        <button
          onClick={togglePlayPause}
          className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 hover:scale-105 active:scale-95 text-white transition-all flex items-center justify-center shadow-lg shadow-blue-500/30"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
        </button>

        <button
          onClick={restart}
          className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Progress & Time */}
      <div className="flex-1 flex flex-col gap-1 min-w-[120px]">
        <div className="flex items-center justify-between text-[10px] text-white/50 font-mono px-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="relative group h-2 flex items-center">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-neutral-600 rounded-full appearance-none cursor-pointer hover:h-1.5 transition-all focus:outline-none"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #404040 ${(currentTime / duration) * 100}%, #404040 100%)`
            }}
          />
        </div>
      </div>

      {/* Volume & Settings */}
      <div className="flex items-center gap-2 pl-2">
        <div className="hidden sm:flex items-center gap-2 group">
          <Volume2 size={16} className="text-white/50 group-hover:text-white transition-colors" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-neutral-600 rounded-full appearance-none cursor-pointer"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${showSettings ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/70'}`}
          >
            <Settings size={18} />
          </button>

          {/* Speed Popup */}
          {showSettings && (
            <div className="absolute bottom-14 right-0 bg-neutral-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 w-32 animate-in fade-in slide-in-from-bottom-2 z-50">
              <div className="text-[10px] text-center text-white/40 mb-2 uppercase tracking-widest font-bold">Speed</div>
              <div className="space-y-1">
                {[0.75, 1, 1.25, 1.5, 2].map(rate => (
                  <button
                    key={rate}
                    onClick={() => handlePlaybackRateChange(rate)}
                    className={`w-full text-center py-1.5 rounded-lg text-xs font-medium transition-colors ${playbackRate === rate ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-white/5'
                      }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PresentationAudioPlayer;
