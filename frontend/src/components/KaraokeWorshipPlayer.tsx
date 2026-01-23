import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, 
  Download, Youtube, Maximize2, Minimize2, X, Settings,
  Languages, Music, FileText, Edit3, Save, Clock, Palette, 
  MousePointer2, Minus, Plus
} from 'lucide-react';

// Types for timing data
interface WordTiming {
  word: string;
  start: number;
  end: number;
  finglish?: string;
}

interface LineTiming {
  line: string;
  start: number;
  end: number;
  words: WordTiming[];
}

// Support both formats: {lines: [...]} and {words: [...]}
interface TimingDataRaw {
  metadata?: {
    title?: string;
    totalDuration?: number;
    wordCount?: number;
    lineCount?: number;
  };
  songId?: number;
  lines?: LineTiming[];
  words?: WordTiming[];
}

interface TimingData {
  metadata?: {
    title?: string;
    totalDuration?: number;
    wordCount?: number;
    lineCount?: number;
  };
  lines: LineTiming[];
}

interface KaraokeWorshipPlayerProps {
  audioUrl: string;
  songId?: number | string;
  title?: string;
  artist?: string;
  albumArt?: string;
  youtubeId?: string;
  lang?: 'fa' | 'en';
  lyrics?: string; // Fallback lyrics if no timing
  originalLyricsWithChords?: string; // Lyrics with chords
  showChords?: boolean;
  onClose?: () => void;
  showControls?: boolean;
  autoPlay?: boolean;
  className?: string;
}

// Remove chord markers like [Am], [F], [G] from text
const removeChords = (text: string): string => {
  return text.replace(/\[([A-Ga-g][#b]?m?(aj|in|dim|aug|sus|add)?[0-9]*)\]/g, '');
};

// Persian to Finglish transliteration map
const persianToFinglish: Record<string, string> = {
  'ا': 'a', 'آ': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's',
  'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z',
  'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's',
  'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f',
  'ق': 'gh', 'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'و': 'o', 'ه': 'h', 'ی': 'i', 'ئ': 'y', 'ء': '', 
  'ـ': '', '‌': '', // ZWNJ and Kashida
  'ة': 'h', 'ي': 'i', 'ى': 'a', 'أ': 'a', 'إ': 'e', 'ؤ': 'o',
};

// Convert Persian word to Finglish
const toFinglish = (word: string): string => {
  if (!word) return '';
  let result = '';
  for (const char of word) {
    result += persianToFinglish[char] || char;
  }
  return result.toLowerCase();
};

// Convert words array to lines (group words by time gap or fixed interval)
const convertWordsToLines = (words: WordTiming[], wordsPerLine: number = 6): LineTiming[] => {
  if (!words || words.length === 0) return [];
  
  const lines: LineTiming[] = [];
  let currentWords: WordTiming[] = [];
  
  for (let i = 0; i < words.length; i++) {
    currentWords.push(words[i]);
    
    // Check if we should start a new line
    const shouldBreak = 
      currentWords.length >= wordsPerLine ||
      (i < words.length - 1 && words[i + 1].start - words[i].end > 1.5); // Gap > 1.5 seconds
    
    if (shouldBreak || i === words.length - 1) {
      const lineText = currentWords.map(w => w.word).join(' ');
      lines.push({
        line: lineText,
        start: currentWords[0].start,
        end: currentWords[currentWords.length - 1].end,
        words: [...currentWords]
      });
      currentWords = [];
    }
  }
  
  return lines;
};

// Normalize timing data to always have lines
const normalizeTimingData = (raw: TimingDataRaw): TimingData => {
  if (raw.lines && raw.lines.length > 0) {
    return {
      metadata: raw.metadata,
      lines: raw.lines
    };
  }
  
  if (raw.words && raw.words.length > 0) {
    return {
      metadata: raw.metadata,
      lines: convertWordsToLines(raw.words)
    };
  }
  
  return {
    metadata: raw.metadata,
    lines: []
  };
};

/**
 * Karaoke Worship Player - Word-by-word highlighting
 * Based on the proven audio-text-sync pattern
 * Supports Persian (RTL) and Finglish display
 */
const KaraokeWorshipPlayer: React.FC<KaraokeWorshipPlayerProps> = ({
  audioUrl,
  songId,
  title = 'Worship Song',
  artist = '',
  albumArt,
  youtubeId,
  lang = 'fa',
  lyrics,
  originalLyricsWithChords,
  showChords = false,
  onClose,
  showControls = true,
  autoPlay = false,
  className = '',
}) => {
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timingData, setTimingData] = useState<TimingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFinglish, setShowFinglish] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NEW: Sync Delay - تنظیم دستی زمان
  const [syncDelay, setSyncDelay] = useState(0);
  
  // NEW: Editable highlight colors - رنگ‌بندی قابل تنظیم
  const [wordHighlightColor, setWordHighlightColor] = useState('#10b981'); // emerald-500
  const [lineHighlightColor, setLineHighlightColor] = useState('#1e293b'); // slate-800
  const [showAppearance, setShowAppearance] = useState(false);
  
  // NEW: Manual Sync Mode - حالت هماهنگی لمسی
  const [isSyncMode, setIsSyncMode] = useState(false);
  
  // NEW: Edit Mode - حالت ویرایش
  const [isEditing, setIsEditing] = useState(false);
  
  // Effective time with sync delay - زمان موثر با تاخیر
  const effectiveTime = useMemo(() => Math.max(0, currentTime - syncDelay), [currentTime, syncDelay]);

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
      setError(null);
      
      try {
        const response = await fetch(`/worship/data/timings/song_${songId}_timing.json`);
        if (response.ok) {
          const rawData = await response.json() as TimingDataRaw;
          console.log('Loaded raw timing data:', rawData);
          const normalizedData = normalizeTimingData(rawData);
          console.log('Normalized timing data:', normalizedData);
          setTimingData(normalizedData);
        } else {
          setError(`Timing file not found for song ${songId}`);
        }
      } catch (err) {
        console.error('Failed to load timing data:', err);
        setError('Failed to load timing data');
      }
      setIsLoading(false);
    };

    loadTiming();
  }, [songId]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setError('Failed to load audio');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Find active or next upcoming line index
  const getActiveOrNextLineIndex = useCallback(() => {
    if (!timingData?.lines) return -1;
    
    const tolerance = 0.3; // 300ms tolerance for timing
    
    // First try to find actively playing line (using effectiveTime)
    const activeIndex = timingData.lines.findIndex(line => {
      const start = line.words[0]?.start ?? line.start;
      const end = line.words[line.words.length - 1]?.end ?? line.end;
      return effectiveTime >= (start - tolerance) && effectiveTime <= (end + tolerance);
    });
    
    if (activeIndex !== -1) return activeIndex;
    
    // If in a gap, find the next upcoming line
    const nextIndex = timingData.lines.findIndex(line => {
      const start = line.words[0]?.start ?? line.start;
      return effectiveTime < start;
    });
    
    return nextIndex !== -1 ? nextIndex : -1;
  }, [timingData, effectiveTime]);

  // Auto-scroll to active or next line (disabled during edit/sync mode)
  useEffect(() => {
    if (!timingData || !lyricsContainerRef.current || isEditing || isSyncMode) return;
    
    const targetIndex = getActiveOrNextLineIndex();

    if (targetIndex !== -1) {
      const container = lyricsContainerRef.current;
      const targetElement = container.children[targetIndex] as HTMLElement;
      if (targetElement) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = targetElement.getBoundingClientRect();
        if (elementRect.top < containerRect.top + 50 || elementRect.bottom > containerRect.bottom - 50) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [effectiveTime, timingData, getActiveOrNextLineIndex, isEditing, isSyncMode]);

  // Auto-play if enabled
  useEffect(() => {
    if (autoPlay && audioRef.current && !isLoading && timingData) {
      audioRef.current.play().catch(console.error);
    }
  }, [autoPlay, isLoading, timingData]);

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

  // Seek to specific line when clicked
  const seekToLine = useCallback((startTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
      if (!isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [isPlaying]);

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
    } catch (err) {
      console.error('Fullscreen error:', err);
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

  // NEW: Handle line editing - ویرایش خط
  const handleLineChange = useCallback((lineIndex: number, newContent: string) => {
    setTimingData(prev => {
      if (!prev) return null;
      const newLines = [...prev.lines];
      const line = newLines[lineIndex];
      
      const startTime = line.words[0]?.start || 0;
      const endTime = line.words[line.words.length - 1]?.end || 0;
      const duration = Math.max(0.1, endTime - startTime);

      const newWordsStr = newContent.trim().split(/\s+/).filter(w => w.length > 0);
      const wordDuration = newWordsStr.length > 0 ? duration / newWordsStr.length : 0;

      const newWords: WordTiming[] = newWordsStr.map((w, i) => ({
        word: w,
        start: Number((startTime + (i * wordDuration)).toFixed(2)),
        end: Number((startTime + ((i + 1) * wordDuration)).toFixed(2))
      }));

      if (newWords.length === 0) {
        newWords.push({ word: '', start: startTime, end: endTime });
      }

      newLines[lineIndex] = {
        ...line,
        line: newContent,
        words: newWords
      };

      return { ...prev, lines: newLines };
    });
  }, []);

  // NEW: Manual sync - کلیک روی کلمه برای تنظیم زمان
  const handleManualSync = useCallback((lineIndex: number, wordIndex: number) => {
    if (!audioRef.current || !isSyncMode) return;
    
    const time = audioRef.current.currentTime;
    const formattedTime = Number(time.toFixed(2));

    setTimingData(prev => {
      if (!prev) return null;
      const newLines = [...prev.lines];
      
      // Update current word
      const line = {...newLines[lineIndex]};
      const newWords = [...line.words];
      const word = {...newWords[wordIndex]};

      const oldDuration = word.end - word.start;
      word.start = formattedTime;
      word.end = Number((formattedTime + oldDuration).toFixed(2));
      
      newWords[wordIndex] = word;
      line.words = newWords;
      newLines[lineIndex] = line;

      // Close previous word gap (karaoke style)
      let prevLineIndex = lineIndex;
      let prevWordIndex = wordIndex - 1;

      if (prevWordIndex < 0) {
        prevLineIndex = lineIndex - 1;
        while (prevLineIndex >= 0 && newLines[prevLineIndex].words.length === 0) {
          prevLineIndex--;
        }
        if (prevLineIndex >= 0) {
          prevWordIndex = newLines[prevLineIndex].words.length - 1;
        }
      }

      if (prevLineIndex >= 0 && prevWordIndex >= 0) {
        const pLine = newLines[prevLineIndex] === line ? line : {...newLines[prevLineIndex]};
        const pWords = pLine === line ? newWords : [...pLine.words];
        const prevWord = {...pWords[prevWordIndex]};
        
        prevWord.end = formattedTime;
        
        pWords[prevWordIndex] = prevWord;
        pLine.words = pWords;
        newLines[prevLineIndex] = pLine;
      }

      return { ...prev, lines: newLines };
    });
  }, [isSyncMode]);

  // NEW: Download edited timing data - دانلود زمان‌بندی ویرایش‌شده
  const handleDownloadTiming = useCallback(() => {
    if (!timingData) return;
    const dataToSave = {
      metadata: {
        title,
        songId,
        editedAt: new Date().toISOString(),
        syncDelay
      },
      lines: timingData.lines
    };
    const jsonContent = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `song_${songId}_timing_edited.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [timingData, title, songId, syncDelay]);

  // Open YouTube
  const handleOpenYouTube = useCallback(() => {
    if (youtubeId) {
      window.open(`https://www.youtube.com/watch?v=${youtubeId}`, '_blank');
    }
  }, [youtubeId]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isRTL = lang === 'fa';

  // Render lyrics with word-by-word highlighting
  const renderLyrics = () => {
    console.log('renderLyrics called', { timingData, hasLines: timingData?.lines?.length });
    
    if (!timingData || !timingData.lines || timingData.lines.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-white/50">
          <div className="text-center">
            <Music size={48} className="mx-auto opacity-30 mb-4" />
            <p>{lang === 'fa' ? 'متن سرود موجود نیست' : 'No lyrics available'}</p>
            <p className="text-sm mt-2">{lang === 'fa' ? `سرود ${songId}` : `Song ${songId}`}</p>
          </div>
        </div>
      );
    }

    return (
      <div 
        ref={lyricsContainerRef}
        className="space-y-6 p-6 overflow-y-auto"
        style={{ 
          maxHeight: isFullscreen ? 'calc(100vh - 200px)' : '350px',
          direction: isRTL ? 'rtl' : 'ltr',
          fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit',
        }}
      >
        {timingData.lines.map((line, lineIndex) => {
          // Skip V1, V2, Chorus markers or handle them differently
          const cleanLine = removeChords(line.line).trim();
          if (/^(V\d+|Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus)$/i.test(cleanLine)) {
            const isLineActive = currentTime >= line.start && currentTime <= line.end;
            return (
              <div 
                key={lineIndex}
                onClick={() => seekToLine(line.start)}
                className={`text-center py-2 cursor-pointer transition-all duration-300 text-sm font-semibold uppercase tracking-wider ${
                  isLineActive ? 'text-emerald-400' : 'text-white/30'
                }`}
              >
                {cleanLine}
              </div>
            );
          }

          const lineStart = line.words[0]?.start ?? line.start;
          const lineEnd = line.words[line.words.length - 1]?.end ?? line.end;
          const tolerance = 0.5; // 500ms tolerance for better sync
          const isLineActive = effectiveTime >= (lineStart - tolerance) && effectiveTime <= (lineEnd + tolerance);
          
          // Check if this is the next upcoming line (for gap preview)
          const activeOrNextIndex = getActiveOrNextLineIndex();
          const isNextLine = !isLineActive && lineIndex === activeOrNextIndex;
          const isUpcoming = isNextLine && effectiveTime < lineStart;

          // EDIT MODE: Show textarea for editing
          if (isEditing) {
            return (
              <div key={lineIndex} className="mb-4">
                <textarea
                  value={line.line}
                  onChange={(e) => handleLineChange(lineIndex, e.target.value)}
                  className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-600 focus:border-emerald-500 outline-none resize-none min-h-[60px] text-xl"
                  style={{ 
                    fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit',
                    direction: isRTL ? 'rtl' : 'ltr',
                  }}
                  placeholder={lang === 'fa' ? 'متن اصلاح‌شده را وارد کنید...' : 'Type corrected text here...'}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                  <span>{lang === 'fa' ? `خط ${lineIndex + 1}` : `Line ${lineIndex + 1}`}</span>
                  <span>{(lineEnd - lineStart).toFixed(1)}s</span>
                </div>
              </div>
            );
          }

          return (
            <div 
              key={lineIndex}
              onClick={() => !isEditing && !isSyncMode && seekToLine(lineStart)}
              className={`p-4 rounded-xl cursor-pointer transition-all duration-300 text-center`}
              style={{ 
                backgroundColor: isLineActive ? `${lineHighlightColor}cc` : (isUpcoming ? 'rgba(59, 130, 246, 0.1)' : 'transparent'),
                transform: isLineActive ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isLineActive ? `0 4px 20px ${wordHighlightColor}33` : (isUpcoming ? '0 2px 10px rgba(59, 130, 246, 0.15)' : 'none'),
                border: isUpcoming ? '1px dashed rgba(59, 130, 246, 0.4)' : (isSyncMode ? '1px dashed rgba(234, 179, 8, 0.3)' : 'none'),
              }}
            >
              {/* Persian/Main Lyrics */}
              <div className="text-2xl md:text-3xl leading-relaxed mb-2">
                {line.words.map((wordObj, wordIndex) => {
                  const wordTolerance = 0.15; // 150ms for word precision
                  const isWordActive = effectiveTime >= (wordObj.start - wordTolerance) && effectiveTime < (wordObj.end + wordTolerance);
                  const cleanWord = removeChords(wordObj.word);
                  
                  return (
                    <span 
                      key={wordIndex}
                      onClick={() => isSyncMode && handleManualSync(lineIndex, wordIndex)}
                      className={`inline-block mx-1 transition-all duration-150 px-1 rounded ${
                        isWordActive ? 'font-bold' : ''
                      } ${isSyncMode ? 'cursor-pointer hover:bg-yellow-500/30 hover:text-yellow-200 border-b border-dashed border-yellow-600' : ''}`}
                      style={{ 
                        color: isWordActive ? wordHighlightColor : (isLineActive ? 'white' : 'rgba(255,255,255,0.6)'),
                        textShadow: isWordActive ? `0 0 20px ${wordHighlightColor}, 0 0 40px ${wordHighlightColor}` : 'none',
                        transform: isWordActive ? 'scale(1.15)' : 'scale(1)',
                        background: isWordActive ? `${wordHighlightColor}33` : 'transparent',
                      }}
                      title={isSyncMode ? (lang === 'fa' ? 'برای تنظیم زمان کلیک کنید' : 'Click to sync this word') : ''}
                    >
                      {cleanWord}
                    </span>
                  );
                })}
              </div>

              {/* Finglish Line - Auto-generate if not available */}
              {showFinglish && isRTL && (
                <div className="text-lg text-white/40 mt-2 tracking-wide" dir="ltr" style={{ fontFamily: 'system-ui, sans-serif' }}>
                  {line.words.map((wordObj, wordIndex) => {
                    const wordTolerance = 0.15;
                    const isWordActive = effectiveTime >= (wordObj.start - wordTolerance) && effectiveTime < (wordObj.end + wordTolerance);
                    const cleanWord = removeChords(wordObj.word);
                    const finglishWord = wordObj.finglish || toFinglish(cleanWord);
                    return (
                      <span 
                        key={wordIndex}
                        className="inline-block mx-1"
                        style={{ 
                          color: isWordActive ? wordHighlightColor : 'rgba(255,255,255,0.4)',
                          fontWeight: isWordActive ? 600 : 400,
                        }}
                      >
                        {finglishWord}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`karaoke-worship-player ${isFullscreen ? 'fullscreen' : ''} ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: isFullscreen ? '100vh' : 'auto',
        minHeight: '500px',
        backgroundColor: '#0a0a0a',
        borderRadius: isFullscreen ? 0 : '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={processedAudioUrl} preload="metadata" />

      {/* Background Gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: albumArt 
            ? `linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.9) 100%), url(${albumArt}) center/cover`
            : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          zIndex: 0,
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
            direction: isRTL ? 'rtl' : 'ltr',
          }}>
            {title}
          </h2>
          {artist && (
            <p style={{ 
              color: 'rgba(255,255,255,0.7)', 
              fontSize: '0.9rem', 
              margin: '4px 0 0 0',
              fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit',
              direction: isRTL ? 'rtl' : 'ltr',
            }}>
              {artist}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="hover:bg-white/20"
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
            className="hover:bg-white/20"
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
              className="hover:bg-white/20"
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

      {/* Settings Panel - Extended */}
      {showSettings && (
        <div
          style={{
            position: 'absolute',
            top: '70px',
            [isRTL ? 'left' : 'right']: '24px',
            background: 'rgba(0,0,0,0.95)',
            borderRadius: '16px',
            padding: '20px',
            zIndex: 20,
            minWidth: '280px',
            maxWidth: '320px',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          {/* Sync Delay Control - تنظیم زمان */}
          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '12px',
              color: 'white',
              fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit',
            }}>
              <Clock size={16} className="text-teal-400" />
              <span style={{ fontWeight: 600 }}>{lang === 'fa' ? 'تنظیم زمان' : 'Sync Delay'}</span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '12px', 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '12px', 
              padding: '12px' 
            }}>
              <button
                onClick={() => setSyncDelay(d => Math.max(d - 0.1, -5))}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title={lang === 'fa' ? 'متن عقبه' : 'Text behind'}
              >
                <Minus size={14} />
              </button>
              <div style={{ 
                textAlign: 'center', 
                minWidth: '80px',
                fontFamily: 'SF Mono, Monaco, monospace',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: syncDelay !== 0 ? '#fbbf24' : 'rgba(255,255,255,0.5)',
              }}>
                {syncDelay > 0 ? '+' : ''}{syncDelay.toFixed(2)}s
              </div>
              <button
                onClick={() => setSyncDelay(d => Math.min(d + 0.1, 10))}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title={lang === 'fa' ? 'متن جلوئه' : 'Text ahead'}
              >
                <Plus size={14} />
              </button>
            </div>
            <p style={{ 
              textAlign: 'center', 
              fontSize: '0.7rem', 
              color: 'rgba(255,255,255,0.4)', 
              marginTop: '8px',
              fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit',
            }}>
              {syncDelay > 0 
                ? (lang === 'fa' ? 'تاخیر - متن خیلی سریع بود' : 'Delay - text was too fast')
                : syncDelay < 0 
                  ? (lang === 'fa' ? 'جلو بردن - متن خیلی کند بود' : 'Ahead - text was too slow')
                  : (lang === 'fa' ? 'هماهنگی کامل' : 'Perfect sync')}
            </p>
          </div>

          {/* Edit & Sync Mode Buttons */}
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setIsEditing(!isEditing); if(!isEditing) setIsSyncMode(false); }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: isEditing ? 'rgba(234, 179, 8, 0.3)' : 'rgba(255,255,255,0.1)',
                border: isEditing ? '1px solid #eab308' : '1px solid transparent',
                borderRadius: '10px',
                padding: '10px',
                color: isEditing ? '#fbbf24' : 'white',
                cursor: 'pointer',
                fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
              title={lang === 'fa' ? 'ویرایش متن' : 'Edit Text'}
            >
              {isEditing ? <Save size={16} /> : <Edit3 size={16} />}
              {isEditing ? (lang === 'fa' ? 'ذخیره' : 'Save') : (lang === 'fa' ? 'ویرایش' : 'Edit')}
            </button>
            <button
              onClick={() => { setIsSyncMode(!isSyncMode); if(!isSyncMode) setIsEditing(false); }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: isSyncMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)',
                border: isSyncMode ? '1px solid #ef4444' : '1px solid transparent',
                borderRadius: '10px',
                padding: '10px',
                color: isSyncMode ? '#f87171' : 'white',
                cursor: 'pointer',
                fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'all 0.2s',
                animation: isSyncMode ? 'pulse 2s infinite' : 'none',
              }}
              title={lang === 'fa' ? 'هماهنگی لمسی' : 'Touch Sync'}
            >
              <MousePointer2 size={16} />
              {lang === 'fa' ? 'هماهنگی' : 'Sync'}
            </button>
          </div>

          {/* Appearance Settings - رنگ‌بندی */}
          <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setShowAppearance(!showAppearance)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                border: 'none',
                padding: '8px 0',
                color: 'white',
                cursor: 'pointer',
                fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit',
              }}
            >
              <Palette size={16} className="text-purple-400" />
              <span style={{ fontWeight: 600 }}>{lang === 'fa' ? 'رنگ‌بندی' : 'Appearance'}</span>
            </button>
            
            {showAppearance && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Word Highlight Color */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit',
                  }}>
                    {lang === 'fa' ? 'رنگ کلمه' : 'Word Color'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={wordHighlightColor}
                      onChange={(e) => setWordHighlightColor(e.target.value)}
                      style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)' }}>{wordHighlightColor}</span>
                  </div>
                </div>
                {/* Line Highlight Color */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit',
                  }}>
                    {lang === 'fa' ? 'رنگ خط' : 'Line Color'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={lineHighlightColor}
                      onChange={(e) => setLineHighlightColor(e.target.value)}
                      style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)' }}>{lineHighlightColor}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Show Finglish */}
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
                style={{ width: '18px', height: '18px', accentColor: wordHighlightColor }}
              />
              <Languages size={16} />
              {lang === 'fa' ? 'نمایش فینگلیش' : 'Show Finglish'}
            </label>
          </div>

          {/* Download & External Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
            {/* Download Timing JSON */}
            {timingData && (isEditing || syncDelay !== 0) && (
              <button
                onClick={handleDownloadTiming}
                className="hover:bg-teal-600/30"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(20, 184, 166, 0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: '#2dd4bf',
                  cursor: 'pointer',
                  fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit',
                  fontSize: '0.85rem',
                }}
              >
                <Download size={16} />
                {lang === 'fa' ? 'دانلود زمان‌بندی (JSON)' : 'Download Timing (JSON)'}
              </button>
            )}

            {youtubeId && (
              <button
                onClick={handleOpenYouTube}
                className="hover:bg-red-600/30"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,0,0,0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: 'white',
                  cursor: 'pointer',
                  fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit',
                  fontSize: '0.85rem',
                }}
              >
                <Youtube size={16} />
                {lang === 'fa' ? 'یوتیوب' : 'YouTube'}
              </button>
            )}

            <button
              onClick={handleDownload}
              className="hover:bg-white/20"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'white',
                cursor: 'pointer',
                fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit',
                fontSize: '0.85rem',
              }}
            >
              <Download size={16} />
              {lang === 'fa' ? 'دانلود صوت' : 'Download Audio'}
            </button>
          </div>
        </div>
      )}

      {/* Lyrics Area */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          zIndex: 5,
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-white">
            <div className="animate-pulse text-center">
              <Music size={48} className="mx-auto opacity-50" />
              <p className="mt-4" style={{ fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit' }}>
                {lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-400">
            <div className="text-center">
              <Music size={48} className="mx-auto opacity-30 mb-4" />
              <p>{error}</p>
            </div>
          </div>
        ) : (
          renderLyrics()
        )}
      </div>

      {/* Playback Controls */}
      {showControls && (
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            padding: '16px 24px 24px',
            background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
          }}
        >
          {/* Progress Bar */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative', height: '8px' }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '8px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}>
                {/* Progress Fill */}
                <div 
                  style={{
                    height: '100%',
                    width: `${(currentTime / (duration || 1)) * 100}%`,
                    background: `linear-gradient(90deg, ${wordHighlightColor}, #06b6d4)`,
                    borderRadius: '4px',
                    transition: 'width 0.1s linear',
                    boxShadow: isPlaying ? `0 0 12px ${wordHighlightColor}` : 'none',
                  }}
                />
              </div>

              {/* Seek Input */}
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                style={{
                  position: 'absolute',
                  top: '-4px',
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

            {/* Time Labels */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.75rem',
              fontFamily: 'SF Mono, Monaco, monospace',
              marginTop: '8px',
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
              className="hover:bg-white/20"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                transition: 'all 0.2s',
              }}
              title="-10s"
            >
              <SkipBack size={20} />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${wordHighlightColor}, #06b6d4)`,
                border: 'none',
                borderRadius: '50%',
                width: '64px',
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                transition: 'all 0.2s',
                boxShadow: `0 4px 20px ${wordHighlightColor}66`,
              }}
            >
              {isPlaying ? <Pause size={28} /> : <Play size={28} style={{ marginLeft: '4px' }} />}
            </button>

            {/* Skip Forward */}
            <button
              onClick={skipForward}
              className="hover:bg-white/20"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                transition: 'all 0.2s',
              }}
              title="+10s"
            >
              <SkipForward size={20} />
            </button>

            {/* Volume */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
              <button
                onClick={toggleMute}
                className="hover:bg-white/20"
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                }}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                style={{
                  width: '80px',
                  height: '4px',
                  appearance: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '2px',
                  cursor: 'pointer',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* CSS for range inputs and animations */}
      <style>{`
        .karaoke-worship-player input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        .karaoke-worship-player input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default KaraokeWorshipPlayer;
