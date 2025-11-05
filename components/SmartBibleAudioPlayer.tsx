/**
 * Smart Bible Audio Player
 * 
 * Intelligent audio player that automatically resolves best audio source
 * - Supports local files (Edge TTS, WordProject downloads)
 * - Falls back to WordProject CDN streaming
 * - Shows source information
 * - Progress bar, volume control, playback speed
 */

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface AudioSource {
  type: string;
  source: string;
  isLocal: boolean;
  url: string;
  fileSize?: number;
  fileSizeMB?: string;
  priority?: number;
  note?: string;
}

interface AudioSourceResult {
  success: boolean;
  bookCode: string;
  chapter: number;
  language: string;
  sources: AudioSource[];
  primary: AudioSource | null;
  metadata: {
    sourceType: string;
    isLocal: boolean;
    url: string;
    fileSize: string | number;
  };
}

interface SmartBibleAudioPlayerProps {
  bookCode: string;
  chapter: number;
  language?: 'fa' | 'en';
  autoPlay?: boolean;
  className?: string;
}

const SmartBibleAudioPlayer: React.FC<SmartBibleAudioPlayerProps> = ({
  bookCode,
  chapter,
  language = 'fa',
  autoPlay = false,
  className = ''
}) => {
  const [audioSource, setAudioSource] = useState<AudioSourceResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch audio source
  useEffect(() => {
    const fetchAudioSource = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get<AudioSourceResult>(
          `/api/audio/source/${bookCode}/${chapter}`,
          { params: { lang: language } }
        );

        if (response.data.success && response.data.primary) {
          setAudioSource(response.data);
          console.log('🎵 Audio source resolved:', response.data);
        } else {
          setError('No audio source available for this chapter');
        }
      } catch (err) {
        console.error('❌ Error fetching audio source:', err);
        setError('Failed to load audio');
      } finally {
        setLoading(false);
      }
    };

    if (bookCode && chapter) {
      fetchAudioSource();
    }
  }, [bookCode, chapter, language]);

  // Update audio element when source changes
  useEffect(() => {
    if (audioRef.current && audioSource?.primary) {
      audioRef.current.src = audioSource.primary.url;
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate;

      if (autoPlay) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [audioSource, autoPlay, volume, playbackRate]);

  // Play/Pause toggle
  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Update current time
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Update duration
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Playback speed change
  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Format time (seconds to mm:ss)
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get source badge color
  const getSourceBadgeColor = (sourceType: string) => {
    switch (sourceType) {
      case 'auto-generated': return 'bg-green-100 text-green-800';
      case 'wordproject-local': return 'bg-blue-100 text-blue-800';
      case 'wordproject-cdn': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-3 space-x-reverse">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">در حال بارگذاری صوت...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !audioSource?.primary) {
    return (
      <div className={`bg-red-50 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3 space-x-reverse text-red-800">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error || 'صدای این فصل موجود نیست'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 shadow-sm ${className}`} dir="rtl">
      {/* Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onError={() => setError('خطا در پخش صوت')}
      />

      {/* Source Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSourceBadgeColor(audioSource.metadata.sourceType)}`}>
            {audioSource.metadata.isLocal ? '🟢 محلی' : '🌐 آنلاین'}
          </span>
          <span className="text-sm text-gray-600">
            {audioSource.primary.source}
          </span>
        </div>
        {audioSource.primary.fileSizeMB && (
          <span className="text-xs text-gray-500">
            {audioSource.primary.fileSizeMB} MB
          </span>
        )}
      </div>

      {/* Play/Pause Button */}
      <div className="flex items-center space-x-4 space-x-reverse mb-4">
        <button
          onClick={togglePlayPause}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={isPlaying ? 'توقف' : 'پخش'}
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Progress Bar */}
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Volume */}
        <div className="flex items-center space-x-2 space-x-reverse">
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            aria-label="صدا"
          />
        </div>

        {/* Playback Speed */}
        <div className="flex items-center space-x-2">
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
            <button
              key={rate}
              onClick={() => handlePlaybackRateChange(rate)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                playbackRate === rate
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Alternative Sources (if available) */}
      {audioSource.sources.length > 1 && (
        <details className="mt-4">
          <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
            منابع جایگزین ({audioSource.sources.length - 1})
          </summary>
          <ul className="mt-2 space-y-1">
            {audioSource.sources.slice(1).map((source, index) => (
              <li key={index} className="text-xs text-gray-500">
                • {source.source} {source.isLocal ? '(محلی)' : '(آنلاین)'}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
};

export default SmartBibleAudioPlayer;
