/**
 * Bible Karaoke - Audio Player Component
 * 
 * Full-featured audio player with word-by-word highlighting,
 * verse synchronization, and playback controls.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import VerseLine from './VerseLine';
import type { ChapterData } from '@/lib/bibleKaraokeTypes';

interface BibleKaraokePlayerProps {
  data: ChapterData;
  lang: 'en' | 'fa';
  showVerseNumbers?: boolean;
  autoScroll?: boolean;
}

const BibleKaraokePlayer: React.FC<BibleKaraokePlayerProps> = ({
  data,
  lang,
  showVerseNumbers = true,
  autoScroll = true,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const verseRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentVerse, setCurrentVerse] = useState<number | null>(null);

  const L = data[lang];
  const verses = L?.verses ?? [];
  const audioUrl = L?.audioUrl;
  const isRTL = lang === 'fa';

  // Update current time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);

      // Find current verse
      const activeVerse = verses.find(
        (v) => v.start !== undefined && v.end !== undefined && time >= v.start && time < v.end
      );
      
      if (activeVerse && activeVerse.verse !== currentVerse) {
        setCurrentVerse(activeVerse.verse);
      }
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [verses, currentVerse]);

  // Auto-scroll to current verse
  useEffect(() => {
    if (!autoScroll || currentVerse === null) return;

    const verseElement = verseRefs.current[currentVerse];
    if (verseElement && containerRef.current) {
      verseElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentVerse, autoScroll]);

  // Playback controls
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }, [isPlaying]);

  const skipBackward = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.max(0, audio.currentTime - 5);
    }
  }, []);

  const skipForward = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.min(duration, audio.currentTime + 5);
    }
  }, [duration]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = newVolume;
      setVolume(newVolume);
      if (newVolume > 0 && isMuted) {
        audio.muted = false;
        setIsMuted(false);
      }
    }
  }, [isMuted]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (audio) {
      const newTime = parseFloat(e.target.value);
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  const handleRateChange = useCallback((newRate: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = newRate;
      setPlaybackRate(newRate);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  if (!L || !audioUrl) {
    return (
      <div className="p-4 text-center text-gray-500">
        {lang === 'fa' ? 'داده‌ای موجود نیست' : 'No data available'}
      </div>
    );
  }

  return (
    <div 
      className={`bible-karaoke-player ${isRTL ? 'rtl' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Audio Element (hidden) */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Controls Panel */}
      <div className="controls-panel bg-white rounded-lg shadow-lg p-4 mb-4 sticky top-4 z-10">
        {/* Progress Bar */}
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <button
            onClick={skipBackward}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            title="Back 5s"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlay}
            className="p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full transition"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>

          <button
            onClick={skipForward}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            title="Forward 5s"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Volume and Speed Controls */}
        <div className="flex items-center justify-between gap-4">
          {/* Volume */}
          <div className="flex items-center gap-2 flex-1">
            <button onClick={toggleMute} className="p-1 hover:bg-gray-100 rounded">
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Speed */}
          <div className="flex gap-1">
            {[0.75, 1, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => handleRateChange(rate)}
                className={`
                  px-2 py-1 text-xs rounded transition
                  ${playbackRate === rate 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                  }
                `}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Current Verse Indicator */}
        {currentVerse && (
          <div className="mt-2 text-center text-sm text-gray-600">
            {lang === 'fa' ? 'آیه' : 'Verse'} {currentVerse}
          </div>
        )}
      </div>

      {/* Verses Display */}
      <div 
        ref={containerRef}
        className="verses-container max-h-[60vh] overflow-y-auto bg-white rounded-lg shadow p-6"
        style={{ fontFamily: isRTL ? 'B Homa, Vazirmatn, Tahoma' : 'inherit' }}
      >
        {verses.length > 0 ? (
          verses.map((verse) => (
            <div
              key={verse.verse}
              ref={(el) => (verseRefs.current[verse.verse] = el)}
            >
              <VerseLine
                verse={verse}
                currentTime={currentTime}
                isActive={currentVerse === verse.verse}
                lang={lang}
              />
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            {lang === 'fa' ? 'متن آیات موجود نیست' : 'No verses available'}
          </div>
        )}
      </div>
    </div>
  );
};

export default BibleKaraokePlayer;
