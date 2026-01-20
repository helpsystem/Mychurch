import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { LyricPlayer, type LyricPlayerRef } from '@applemusic-like-lyrics/react';
import { BackgroundRender, MeshGradientRenderer } from '@applemusic-like-lyrics/react';
import type { LyricLine, LyricWord } from '@applemusic-like-lyrics/core';
import '@applemusic-like-lyrics/core/style.css';
import { 
  Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, 
  Download, Youtube, Maximize2, Minimize2, X, Settings,
  Languages, Music, FileText
} from 'lucide-react';
import { downloadPPTX } from '../utils/pptxGenerator';
import { type OurTimingData } from '../utils/amllConverter';

// Convert our timing format to AMLL format with all required fields
function convertToAmllLyricLines(timingData: OurTimingData): LyricLine[] {
  if (!timingData || !timingData.lines || timingData.lines.length === 0) {
    return [];
  }

  return timingData.lines.map((line) => {
    // Build Finglish string for the line
    const finglishWords = line.words
      .map((word) => word.finglish || '')
      .filter((f) => f.trim() !== '');
    const romanLyric = finglishWords.length > 0 ? finglishWords.join(' ') : '';

    // Convert each word to AMLL format with all required fields
    const amllWords: LyricWord[] = line.words.map((word, idx) => ({
      word: word.word,
      startTime: word.start * 1000, // Convert seconds to milliseconds
      endTime: word.end * 1000,
      obscene: false,
      romanWord: line.words[idx]?.finglish || '', // Finglish for each word
    }));

    return {
      words: amllWords,
      startTime: line.start * 1000,
      endTime: line.end * 1000,
      translatedLyric: '',
      romanLyric: romanLyric,
      isBG: false,
      isDuet: false,
    };
  });
}

interface AMLLWorshipPlayerProps {
  audioUrl: string;
  songId?: number | string;
  title?: string;
  artist?: string;
  albumArt?: string;
  youtubeId?: string;
  lang?: 'fa' | 'en';
  lyrics?: string;
  originalLyricsWithChords?: string;
  onClose?: () => void;
  showControls?: boolean;
  autoPlay?: boolean;
  className?: string;
}

/**
 * Apple Music-Like Lyrics Worship Player
 * A beautiful karaoke-style player with word-by-word sync
 * Supports Persian (RTL) and English worship songs
 */
const AMLLWorshipPlayer: React.FC<AMLLWorshipPlayerProps> = ({
  audioUrl,
  songId,
  title = 'Worship Song',
  artist = '',
  albumArt,
  youtubeId,
  lang = 'fa',
  lyrics,
  originalLyricsWithChords,
  onClose,
  showControls = true,
  autoPlay = false,
  className = '',
}) => {
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricPlayerRef = useRef<LyricPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lyricLines, setLyricLines] = useState<LyricLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFinglish, setShowFinglish] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [rawTimingData, setRawTimingData] = useState<OurTimingData | null>(null);

  // Process audio URL for Persian filenames
  const processedAudioUrl = useMemo(() => {
    if (!audioUrl) return '';
    if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
      try {
        const url = new URL(audioUrl);
        const encodedPath = url.pathname.split('/').map(segment =>
          encodeURIComponent(decodeURIComponent(segment))
        ).join('/');
        return `${url.origin}${encodedPath}${url.search}`;
      } catch {
        return audioUrl;
      }
    }
    if (audioUrl.startsWith('/')) {
      const segments = audioUrl.split('/');
      return segments.map(segment =>
        segment ? encodeURIComponent(decodeURIComponent(segment)) : segment
      ).join('/');
    }
    return audioUrl;
  }, [audioUrl]);

  // Fetch timing data
  useEffect(() => {
    if (!songId) {
      setIsLoading(false);
      return;
    }

    const loadTiming = async () => {
      setIsLoading(true);
      const cacheKey = `amll_timing_cache_${songId}`;
      
      try {
        // Check localStorage cache first
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          const parsed = JSON.parse(cachedData) as OurTimingData;
          setRawTimingData(parsed);
          const amllLines = convertToAmllLyricLines(parsed);
          setLyricLines(amllLines);
          setIsLoading(false);
          return;
        }

        // Fetch from server
        const response = await fetch(`/worship/data/timings/song_${songId}_timing.json`);
        if (response.ok) {
          const data = await response.json() as OurTimingData;
          localStorage.setItem(cacheKey, JSON.stringify(data));
          setRawTimingData(data);
          const amllLines = convertToAmllLyricLines(data);
          setLyricLines(amllLines);
        }
      } catch (error) {
        console.error('Failed to load timing data:', error);
      }
      setIsLoading(false);
    };

    loadTiming();
  }, [songId]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Auto-play if enabled
  useEffect(() => {
    if (autoPlay && audioRef.current && !isLoading) {
      audioRef.current.play().catch(console.error);
    }
  }, [autoPlay, isLoading]);

  // Playback controls
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const skipForward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
    }
  }, [duration]);

  const skipBackward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
    }
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Download audio
  const handleDownload = useCallback(() => {
    if (!processedAudioUrl) return;
    const link = document.createElement('a');
    link.href = processedAudioUrl;
    link.download = `${title || 'worship-song'}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [processedAudioUrl, title]);

  // Open YouTube
  const handleOpenYouTube = useCallback(() => {
    if (youtubeId) {
      window.open(`https://www.youtube.com/watch?v=${youtubeId}`, '_blank');
    }
  }, [youtubeId]);

  // Export PowerPoint
  const handleExportPPTX = useCallback(async () => {
    const lyricsToExport = originalLyricsWithChords || lyrics || '';
    if (!lyricsToExport) return;

    try {
      await downloadPPTX({
        title: title || 'Untitled Song',
        artist: artist,
        lyrics: lyricsToExport,
        showChords: false,
        lang: lang,
      });
    } catch (error) {
      console.error('Error exporting PowerPoint:', error);
    }
  }, [originalLyricsWithChords, lyrics, title, artist, lang]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Process lyric lines with/without Finglish based on toggle
  const displayLyricLines = useMemo(() => {
    if (!showFinglish) {
      return lyricLines.map(line => ({
        ...line,
        romanLyric: '', // Hide Finglish
      }));
    }
    return lyricLines;
  }, [lyricLines, showFinglish]);

  const isRTL = lang === 'fa';

  return (
    <div
      ref={containerRef}
      className={`amll-worship-player ${isFullscreen ? 'fullscreen' : ''} ${className}`}
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        position: 'relative',
        width: '100%',
        height: isFullscreen ? '100vh' : '600px',
        minHeight: '400px',
        backgroundColor: '#0a0a0a',
        borderRadius: isFullscreen ? 0 : '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={processedAudioUrl} preload="metadata" />

      {/* Background Effect */}
      <BackgroundRender
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
        }}
        album={albumArt || '/images/worship-default.jpg'}
        renderer={MeshGradientRenderer}
        fps={30}
        playing={isPlaying}
      />

      {/* Dark Overlay for better text visibility */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.8) 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Header with Title and Controls */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
        }}
      >
        <div style={{ flex: 1 }}>
          <h2 style={{ 
            color: 'white', 
            fontSize: '1.5rem', 
            fontWeight: 600, 
            margin: 0,
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit',
          }}>
            {title}
          </h2>
          {artist && (
            <p style={{ 
              color: 'rgba(255,255,255,0.7)', 
              fontSize: '0.9rem', 
              margin: '4px 0 0 0',
              fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit',
            }}>
              {artist}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: showSettings ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              transition: 'all 0.2s',
            }}
            title={lang === 'fa' ? 'تنظیمات' : 'Settings'}
          >
            <Settings size={20} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              transition: 'all 0.2s',
            }}
            title={lang === 'fa' ? 'تمام صفحه' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                transition: 'all 0.2s',
              }}
              title={lang === 'fa' ? 'بستن' : 'Close'}
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div
          style={{
            position: 'absolute',
            top: '70px',
            [isRTL ? 'left' : 'right']: '24px',
            background: 'rgba(0,0,0,0.9)',
            borderRadius: '12px',
            padding: '16px',
            zIndex: 20,
            minWidth: '200px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: 'white',
              cursor: 'pointer',
              fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit',
            }}>
              <input
                type="checkbox"
                checked={showFinglish}
                onChange={(e) => setShowFinglish(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <Languages size={16} />
              {lang === 'fa' ? 'نمایش فینگلیش' : 'Show Finglish'}
            </label>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {youtubeId && (
              <button
                onClick={handleOpenYouTube}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,0,0,0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: 'white',
                  cursor: 'pointer',
                  fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit',
                }}
              >
                <Youtube size={16} />
                {lang === 'fa' ? 'یوتیوب' : 'YouTube'}
              </button>
            )}

            <button
              onClick={handleDownload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'white',
                cursor: 'pointer',
                fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit',
              }}
            >
              <Download size={16} />
              {lang === 'fa' ? 'دانلود صوت' : 'Download Audio'}
            </button>

            {(lyrics || originalLyricsWithChords) && (
              <button
                onClick={handleExportPPTX}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: 'white',
                  cursor: 'pointer',
                  fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit',
                }}
              >
                <FileText size={16} />
                {lang === 'fa' ? 'ساخت پاورپوینت' : 'Export PowerPoint'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* AMLL Lyric Player */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          zIndex: 5,
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'white',
            fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit',
          }}>
            <div className="animate-pulse">
              <Music size={48} style={{ opacity: 0.5 }} />
              <p style={{ marginTop: '16px' }}>
                {lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}
              </p>
            </div>
          </div>
        ) : lyricLines.length > 0 ? (
          <LyricPlayer
            ref={lyricPlayerRef}
            lyricLines={displayLyricLines}
            currentTime={currentTime * 1000} // Convert to milliseconds
            playing={isPlaying}
            alignAnchor="center"
            alignPosition={0.4}
            enableSpring={true}
            enableBlur={true}
            style={{
              width: '100%',
              height: '100%',
              mixBlendMode: 'plus-lighter',
              fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'SF Pro Display, system-ui, sans-serif',
              direction: isRTL ? 'rtl' : 'ltr',
              '--amll-lyric-player-font-size': '2rem',
              '--amll-lyric-player-highlight-color': '#ffffff',
              '--amll-lyric-player-unhighlight-color': 'rgba(255,255,255,0.4)',
            } as React.CSSProperties}
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'rgba(255,255,255,0.5)',
            fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit',
            textAlign: 'center',
            padding: '20px',
          }}>
            <div>
              <Music size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p>{lang === 'fa' ? 'زمان‌بندی کلمات موجود نیست' : 'No word timing available'}</p>
              <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
                {lang === 'fa' 
                  ? 'این آهنگ هنوز زمان‌بندی دقیق ندارد' 
                  : 'This song does not have precise word timing yet'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Playback Controls */}
      {showControls && (
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            padding: '16px 24px 24px',
            background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
          }}
        >
          {/* Progress Bar - Equalizer Style */}
          <div style={{ marginBottom: '16px', direction: 'ltr' }}>
            {/* Equalizer Bars Container */}
            <div style={{ position: 'relative', height: '24px', marginBottom: '8px' }}>
              {/* Background Track */}
              <div style={{
                position: 'absolute',
                bottom: '8px',
                left: 0,
                right: 0,
                height: '8px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
                {/* Progress Fill with Pulse Animation */}
                <div 
                  className="amll-progress-fill"
                  style={{
                    height: '100%',
                    width: `${(currentTime / (duration || 1)) * 100}%`,
                    background: 'linear-gradient(90deg, #8b5cf6, #ec4899, #8b5cf6)',
                    backgroundSize: '200% 100%',
                    borderRadius: '4px',
                    transition: 'width 0.1s linear',
                    boxShadow: isPlaying ? '0 0 12px rgba(139, 92, 246, 0.6)' : 'none',
                  }}
                />
              </div>
              
              {/* Equalizer Bars (visual effect) */}
              {isPlaying && (
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: `${Math.min((currentTime / (duration || 1)) * 100, 98)}%`,
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '2px',
                  height: '20px',
                  transform: 'translateX(-50%)',
                }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`amll-eq-bar amll-eq-bar-${i}`}
                      style={{
                        width: '3px',
                        background: 'linear-gradient(to top, #ec4899, #8b5cf6)',
                        borderRadius: '2px',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Seek Input (invisible but interactive) */}
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  left: 0,
                  width: '100%',
                  height: '16px',
                  appearance: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  zIndex: 10,
                }}
              />
            </div>

            {/* Time Labels - Always LTR: current time left, total time right */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.75rem',
              fontFamily: 'SF Mono, Monaco, monospace',
              direction: 'ltr',
            }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '16px',
          }}>
            {/* Skip Backward */}
            <button
              onClick={skipBackward}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              <SkipBack size={24} />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              style={{
                background: 'white',
                border: 'none',
                color: '#0a0a0a',
                cursor: 'pointer',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              {isPlaying ? <Pause size={28} /> : <Play size={28} style={{ marginLeft: '3px' }} />}
            </button>

            {/* Skip Forward */}
            <button
              onClick={skipForward}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              <SkipForward size={24} />
            </button>

            {/* Volume Control */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginLeft: isRTL ? 0 : '16px',
              marginRight: isRTL ? '16px' : 0,
            }}>
              <button
                onClick={toggleMute}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                style={{
                  width: '80px',
                  height: '4px',
                  borderRadius: '2px',
                  background: `linear-gradient(to right, #fff ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) ${(isMuted ? 0 : volume) * 100}%)`,
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Custom styles */}
      <style>{`
        .amll-worship-player input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
          transition: transform 0.2s ease;
        }
        
        .amll-worship-player input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        
        .amll-worship-player input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
        }
        
        .amll-worship-player button:hover {
          opacity: 0.8;
          transform: scale(1.05);
        }
        
        .amll-worship-player.fullscreen {
          border-radius: 0 !important;
        }

        /* Progress Bar Pulse Animation */
        .amll-progress-fill {
          animation: amll-pulse 2s ease-in-out infinite, amll-gradient-shift 3s linear infinite;
        }
        
        @keyframes amll-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        
        @keyframes amll-gradient-shift {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        /* Equalizer Bars Animation */
        .amll-eq-bar {
          animation: amll-eq-bounce 0.4s ease-in-out infinite alternate;
        }
        
        .amll-eq-bar-0 { height: 8px; animation-delay: 0ms; }
        .amll-eq-bar-1 { height: 14px; animation-delay: 80ms; }
        .amll-eq-bar-2 { height: 18px; animation-delay: 160ms; }
        .amll-eq-bar-3 { height: 12px; animation-delay: 240ms; }
        .amll-eq-bar-4 { height: 6px; animation-delay: 320ms; }
        
        @keyframes amll-eq-bounce {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1); }
        }

        /* AMLL Custom Styles */
        .amll-worship-player .amll-lyric-player {
          font-size: 1.8rem !important;
        }

        .amll-worship-player .amll-lyric-player-line {
          transition: all 0.3s ease;
        }

        .amll-worship-player .amll-lyric-player-line-active {
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .amll-worship-player .amll-lyric-player {
            font-size: 1.2rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AMLLWorshipPlayer;
