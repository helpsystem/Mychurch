// PresentationAudioPlayer.tsx
// ============================================================
// Compact audio player for Presentation Mode
// ============================================================
// Integrates with BilingualBiblePresentation
// Uses Smart Audio System (local → CDN fallback)
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Volume2, Play, Pause, RotateCcw, Settings } from 'lucide-react';

interface PresentationAudioPlayerProps {
  bookCode: string;
  chapter: number;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  autoPlay?: boolean;
  compact?: boolean; // Ultra-compact mode for presentation
}

interface AudioSource {
  source: string;
  type: string;
  priority: number;
  exists: boolean | string;
}

const PresentationAudioPlayer: React.FC<PresentationAudioPlayerProps> = ({
  bookCode,
  chapter,
  onPlay,
  onPause,
  onEnded,
  autoPlay = false,
  compact = true,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioSource, setAudioSource] = useState<AudioSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
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
    if (audioSource && autoPlay && audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error('Auto-play failed:', err);
      });
    }
  }, [audioSource, autoPlay]);

  const fetchAudioSource = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/audio/source/${bookCode}/${chapter}`, {
        params: { lang: 'fa' },
      });

      if (response.data.success && response.data.primary) {
        setAudioSource(response.data.primary);
      } else {
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

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      onPause?.();
    } else {
      audioRef.current.play().then(() => {
        setPlaying(true);
        onPlay?.();
      }).catch(err => {
        console.error('Play error:', err);
        setError('خطا در پخش صوت');
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setPlaying(false);
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
      setPlaying(true);
    }
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSourceTypeLabel = (type: string): string => {
    switch (type) {
      case 'local-edge-tts':
        return '🟢 محلی (Edge TTS)';
      case 'local-wordproject':
        return '🟢 محلی (WordProject)';
      case 'cdn-wordproject':
        return '🌐 آنلاین (WordProject)';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-white/60 text-sm px-4 py-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
        <span>در حال بارگذاری صوت...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-400 text-sm px-4 py-2">
        <span>⚠️ {error}</span>
        <button
          onClick={fetchAudioSource}
          className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded transition"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  if (!audioSource) {
    return (
      <div className="text-white/60 text-sm px-4 py-2">
        صوت موجود نیست
      </div>
    );
  }

  // Compact mode for presentation
  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-neutral-800/80 backdrop-blur rounded-2xl px-4 py-2 shadow-lg">
        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={audioSource.source}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={() => setError('خطا در بارگذاری فایل صوتی')}
        />

        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full transition"
        >
          {playing ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
        </button>

        {/* Progress Bar */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-neutral-600 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #525252 ${(currentTime / duration) * 100}%, #525252 100%)`
            }}
          />
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Restart Button */}
        <button
          onClick={restart}
          className="w-8 h-8 flex items-center justify-center bg-neutral-700 hover:bg-neutral-600 rounded-full transition"
          title="شروع از ابتدا"
        >
          <RotateCcw className="w-4 h-4 text-white" />
        </button>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-white/70" />
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

        {/* Settings Button */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-8 h-8 flex items-center justify-center bg-neutral-700 hover:bg-neutral-600 rounded-full transition"
            title="تنظیمات"
          >
            <Settings className="w-4 h-4 text-white" />
          </button>

          {/* Settings Dropdown */}
          {showSettings && (
            <div className="absolute bottom-12 right-0 bg-neutral-800 rounded-lg shadow-xl p-3 space-y-2 min-w-[180px]">
              <div className="text-white/90 text-sm font-semibold mb-2">سرعت پخش</div>
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                <button
                  key={rate}
                  onClick={() => handlePlaybackRateChange(rate)}
                  className={`w-full text-left px-3 py-2 rounded transition ${
                    playbackRate === rate
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-700 text-white/80 hover:bg-neutral-600'
                  }`}
                >
                  {rate}x {rate === 1 && '(عادی)'}
                </button>
              ))}
              
              <div className="mt-3 pt-2 border-t border-neutral-700 text-xs text-white/60">
                {getSourceTypeLabel(audioSource.type)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full mode (not used in presentation, but available)
  return (
    <div className="bg-neutral-800 rounded-lg p-4 space-y-4">
      <audio
        ref={audioRef}
        src={audioSource.source}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={() => setError('خطا در بارگذاری فایل صوتی')}
      />

      {/* Full player controls... */}
      <div className="text-white">Full player mode (not implemented)</div>
    </div>
  );
};

export default PresentationAudioPlayer;
