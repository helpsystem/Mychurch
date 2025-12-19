import React, { useState, useEffect, useRef } from 'react';

// Types
interface TimingWord {
  word: string;
  start: number;
  end: number;
}

interface TimingLine {
  line: string;
  start: number;
  end: number;
  words?: TimingWord[];
}

interface TimingData {
  metadata?: {
    title?: string;
    artist?: string;
    totalDuration?: number;
    wordCount?: number;
  };
  words?: TimingWord[];
  lines: TimingLine[];
}

interface UniversalAudioPlayerProps {
  audioUrl: string;
  lyrics?: string;
  timingPath?: string; // e.g., "/worship/data/timings/song_1_timing.json"
  title?: string;
  artist?: string;
  lang?: 'fa' | 'en';
  autoLoadTiming?: boolean; // default: true
  enableManualSync?: boolean; // default: true
  showTimingControls?: boolean; // default: true
}

/**
 * 🎵 Universal Audio Player با سه حالت:
 * 1. Auto-sync: timing file موجود باشد
 * 2. Manual-sync: کاربر خودش timing تنظیم کنه
 * 3. Static: فقط متن ساده
 */
const UniversalAudioPlayer: React.FC<UniversalAudioPlayerProps> = ({
  audioUrl,
  lyrics = '',
  timingPath,
  title,
  artist,
  lang = 'fa',
  autoLoadTiming = true,
  enableManualSync = true,
  showTimingControls = true
}) => {
  const [timingData, setTimingData] = useState<TimingData | null>(null);
  const [timingMode, setTimingMode] = useState<'auto' | 'manual' | 'static'>('static');
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [manualOffset, setManualOffset] = useState(0); // For manual sync adjustment
  const [loadingTiming, setLoadingTiming] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // Parse lyrics into lines
  const lyricsLines = lyrics.split('\n').filter(line => line.trim());

  // Load timing data automatically
  useEffect(() => {
    if (autoLoadTiming && timingPath) {
      loadTimingData();
    }
  }, [timingPath, autoLoadTiming]);

  const loadTimingData = async () => {
    if (!timingPath) return;
    
    setLoadingTiming(true);
    try {
      const response = await fetch(timingPath);
      if (response.ok) {
        const data: TimingData = await response.json();
        setTimingData(data);
        setTimingMode('auto');
        console.log('✅ Timing loaded:', data.lines?.length, 'lines');
      } else {
        console.log('⚠️ No timing file found, using static mode');
        setTimingMode('static');
      }
    } catch (error) {
      console.log('⚠️ Failed to load timing:', error);
      setTimingMode('static');
    } finally {
      setLoadingTiming(false);
    }
  };

  // Sync lyrics with audio (auto mode)
  useEffect(() => {
    if (timingMode !== 'auto' || !timingData) return;

    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime + manualOffset;
      setCurrentTime(time);

      // Find active line
      let activeIndex = -1;
      for (let i = 0; i < timingData.lines.length; i++) {
        const line = timingData.lines[i];
        const nextLine = timingData.lines[i + 1];
        
        if (time >= line.start && (!nextLine || time < nextLine.start)) {
          activeIndex = i;
          break;
        }
      }

      if (activeIndex !== currentLineIndex) {
        setCurrentLineIndex(activeIndex);
        
        // Auto-scroll to active line
        if (activeIndex >= 0 && lyricsContainerRef.current) {
          const activeElement = lyricsContainerRef.current.querySelector(
            `[data-line-index="${activeIndex}"]`
          );
          if (activeElement) {
            activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [timingMode, timingData, currentLineIndex, manualOffset]);

  // Manual sync mode
  const handleManualLineClick = (index: number) => {
    if (timingMode === 'manual' && audioRef.current) {
      setCurrentLineIndex(index);
      // Simple manual sync: assume equal spacing
      const lineTime = (audioRef.current.duration / lyricsLines.length) * index;
      audioRef.current.currentTime = lineTime;
    }
  };

  // Toggle manual sync mode
  const enableManualSyncMode = () => {
    setTimingMode('manual');
    setCurrentLineIndex(0);
  };

  // Audio controls
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentLineIndex(-1);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get lines to display (from timing or from plain lyrics)
  const displayLines = timingData?.lines || lyricsLines.map((line, idx) => ({
    line,
    start: 0,
    end: 0
  }));

  return (
    <div className={`universal-audio-player ${lang === 'fa' ? 'rtl' : 'ltr'}`} dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      {/* Header */}
      {(title || artist) && (
        <div className="player-header" style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.2))',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {title && <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#fff' }}>{title}</h3>}
          {artist && <p style={{ margin: 0, color: '#d1d5db', fontSize: '16px' }}>{artist}</p>}
        </div>
      )}

      {/* Timing Mode Indicator */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        padding: '12px',
        background: '#1e293b',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {loadingTiming && <span>⏳ در حال بارگذاری timing...</span>}
          {timingMode === 'auto' && <span style={{ color: '#4ade80' }}>✅ Auto-Sync فعال</span>}
          {timingMode === 'manual' && <span style={{ color: '#fbbf24' }}>🎯 Manual-Sync فعال</span>}
          {timingMode === 'static' && <span style={{ color: '#9ca3af' }}>📝 حالت متن ساده</span>}
        </div>

        {/* Timing Controls */}
        {showTimingControls && timingMode === 'static' && enableManualSync && (
          <button
            onClick={enableManualSyncMode}
            style={{
              padding: '8px 16px',
              background: '#fbbf24',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🎯 فعال‌سازی Manual Sync
          </button>
        )}

        {showTimingControls && timingMode === 'auto' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#9ca3af' }}>تنظیم دقیق:</span>
            <button
              onClick={() => setManualOffset(prev => prev - 0.5)}
              style={{
                padding: '4px 12px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              -0.5s
            </button>
            <span style={{ fontSize: '14px', minWidth: '60px', textAlign: 'center' }}>
              {manualOffset.toFixed(1)}s
            </span>
            <button
              onClick={() => setManualOffset(prev => prev + 0.5)}
              style={{
                padding: '4px 12px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              +0.5s
            </button>
          </div>
        )}
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Custom Controls */}
      <div style={{
        background: '#1e293b',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px'
      }}>
        {/* Play/Pause Button */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <button
            onClick={handlePlayPause}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              border: 'none',
              color: '#fff',
              fontSize: '28px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(168, 85, 247, 0.5)'
            }}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
        </div>

        {/* Progress Bar */}
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={(e) => {
            const time = parseFloat(e.target.value);
            if (audioRef.current) {
              audioRef.current.currentTime = time;
              setCurrentTime(time);
            }
          }}
          style={{
            width: '100%',
            marginBottom: '12px',
            accentColor: '#a855f7'
          }}
        />

        {/* Time Display */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '14px',
          color: '#9ca3af'
        }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Lyrics Display */}
      <div
        ref={lyricsContainerRef}
        style={{
          background: '#1e293b',
          padding: '24px',
          borderRadius: '12px',
          maxHeight: '400px',
          overflowY: 'auto',
          textAlign: lang === 'fa' ? 'right' : 'left'
        }}
      >
        {displayLines.map((line, index) => (
          <div
            key={index}
            data-line-index={index}
            onClick={() => timingMode === 'manual' && handleManualLineClick(index)}
            style={{
              padding: '12px 16px',
              margin: '8px 0',
              borderRadius: '8px',
              fontSize: '18px',
              lineHeight: '1.8',
              transition: 'all 0.3s ease',
              cursor: timingMode === 'manual' ? 'pointer' : 'default',
              background: currentLineIndex === index 
                ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' 
                : 'transparent',
              color: currentLineIndex === index ? '#000' : '#fff',
              fontWeight: currentLineIndex === index ? 'bold' : 'normal',
              transform: currentLineIndex === index ? 'scale(1.02)' : 'scale(1)',
              boxShadow: currentLineIndex === index 
                ? '0 4px 12px rgba(251, 191, 36, 0.5)' 
                : 'none'
            }}
          >
            {typeof line === 'string' ? line : line.line}
          </div>
        ))}
      </div>

      {/* Manual Sync Instructions */}
      {timingMode === 'manual' && (
        <div style={{
          marginTop: '16px',
          padding: '16px',
          background: '#fef3c7',
          color: '#92400e',
          borderRadius: '8px',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          💡 <strong>راهنما:</strong> روی هر خط کلیک کنید تا به آن قسمت از آهنگ برود
        </div>
      )}
    </div>
  );
};

export default UniversalAudioPlayer;
