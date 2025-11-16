import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Settings } from 'lucide-react';

interface TimingWord {
  word: string;
  start: number;
  end: number;
  lineIndex?: number;
}

interface TimingLine {
  line: string;
  start: number;
  end: number;
  words: TimingWord[];
}

interface TimingData {
  metadata: {
    title: string;
    book: string;
    chapter: number;
    totalDuration: number;
    wordCount: number;
  };
  words: TimingWord[];
  lines: TimingLine[];
}

interface Props {
  audioUrl: string;
  verses: Array<{ number: number; text: string }>; // آیات
  timingPath?: string; // مسیر فایل timing (اختیاری)
  lang?: 'fa' | 'en';
  bookName: string;
  chapter: number;
  onChapterChange?: (direction: 'prev' | 'next') => void;
  autoLoadTiming?: boolean;
}

const BibleAudioPlayerWithSync: React.FC<Props> = ({
  audioUrl,
  verses,
  timingPath,
  lang = 'fa',
  bookName,
  chapter,
  onChapterChange,
  autoLoadTiming = true
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const versesContainerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  
  const [timingData, setTimingData] = useState<TimingData | null>(null);
  const [loadingTiming, setLoadingTiming] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(-1);
  
  const [syncAdjustment, setSyncAdjustment] = useState(0);

  // بارگذاری فایل timing
  useEffect(() => {
    if (!autoLoadTiming || !timingPath) return;
    
    console.log('🔍 Loading timing for Bible chapter:', { bookName, chapter, timingPath });
    
    setLoadingTiming(true);
    fetch(timingPath)
      .then(res => {
        if (!res.ok) throw new Error('Timing file not found');
        return res.json();
      })
      .then((data: TimingData) => {
        console.log('✅ Bible timing loaded:', {
          wordCount: data.words?.length,
          lineCount: data.lines?.length,
          metadata: data.metadata
        });
        setTimingData(data);
      })
      .catch(err => {
        console.log('⚠️ No timing file for this chapter:', err.message);
        setTimingData(null);
      })
      .finally(() => {
        setLoadingTiming(false);
      });
  }, [timingPath, autoLoadTiming, bookName, chapter]);

  // تبدیل آیات به خطوط برای نمایش
  const processedVerses = React.useMemo(() => {
    if (timingData && timingData.lines && timingData.lines.length > 0) {
      // اگر timing دقیق داریم، از آن استفاده کن
      return timingData.lines.map((line, idx) => ({
        number: verses[idx]?.number || idx + 1,
        text: line.line,
        words: line.words,
        start: line.start + syncAdjustment,
        end: line.end + syncAdjustment
      }));
    }
    
    // در غیر این صورت، فقط متن آیات را نمایش بده
    return verses.map((verse, idx) => ({
      number: verse.number,
      text: verse.text,
      words: [],
      start: idx * 5 + syncAdjustment, // تخمین: هر آیه 5 ثانیه
      end: (idx + 1) * 5 + syncAdjustment
    }));
  }, [verses, timingData, syncAdjustment]);

  // تبدیل کلمات به لیست با زمان‌بندی
  const wordsWithTiming = React.useMemo(() => {
    const allWords: Array<{ word: string; start: number; end: number; verseIndex: number }> = [];
    
    processedVerses.forEach((verse, verseIndex) => {
      if (verse.words && verse.words.length > 0) {
        // استفاده از timing دقیق
        verse.words.forEach(wordData => {
          allWords.push({
            word: wordData.word,
            start: wordData.start,
            end: wordData.end,
            verseIndex
          });
        });
      } else {
        // محاسبه تقریبی
        const words = verse.text.split(/\s+/).filter(w => w.trim().length > 0);
        const wordDuration = (verse.end - verse.start) / words.length;
        
        words.forEach((word, wordIndex) => {
          allWords.push({
            word: word.trim(),
            start: verse.start + (wordIndex * wordDuration),
            end: verse.start + ((wordIndex + 1) * wordDuration),
            verseIndex
          });
        });
      }
    });
    
    return allWords;
  }, [processedVerses]);

  // به‌روزرسانی زمان فعلی
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // تشخیص آیه فعلی
  useEffect(() => {
    if (processedVerses.length === 0) return;

    let activeIndex = -1;
    for (let i = 0; i < processedVerses.length; i++) {
      if (processedVerses[i].start <= currentTime) {
        activeIndex = i;
      } else {
        break;
      }
    }

    if (activeIndex !== currentVerseIndex) {
      setCurrentVerseIndex(activeIndex);
      
      // اسکرول خودکار
      if (versesContainerRef.current && activeIndex >= 0) {
        const container = versesContainerRef.current;
        const activeElement = container.querySelector(`[data-verse="${activeIndex}"]`) as HTMLElement;
        if (activeElement) {
          activeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }
  }, [currentTime, processedVerses, currentVerseIndex]);

  // تشخیص کلمه فعلی
  useEffect(() => {
    if (wordsWithTiming.length === 0) return;

    let activeWordIndex = -1;
    for (let i = 0; i < wordsWithTiming.length; i++) {
      if (currentTime >= wordsWithTiming[i].start && currentTime < wordsWithTiming[i].end) {
        activeWordIndex = i;
        break;
      }
    }

    if (activeWordIndex !== currentWordIndex) {
      setCurrentWordIndex(activeWordIndex);
      
      if (activeWordIndex >= 0) {
        const activeWord = wordsWithTiming[activeWordIndex];
        console.log(`🎯 Active word: "${activeWord.word}" at ${currentTime.toFixed(2)}s (verse ${activeWord.verseIndex + 1})`);
      }
    }
  }, [currentTime, wordsWithTiming, currentWordIndex]);

  // کنترل پخش
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const formatTime = (time: number): string => {
    if (!isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-blue-500/30">
      {/* Audio Element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Header */}
      <div className="relative bg-gradient-to-r from-blue-600/40 via-purple-600/40 to-blue-600/40 backdrop-blur-xl p-6 text-center border-b border-blue-500/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent animate-pulse"></div>
        
        <div className="relative z-10">
          <h3 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-blue-300">
            📖 {bookName}
          </h3>
          <p className="text-gray-200 text-lg flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
            {lang === 'fa' ? `فصل ${chapter}` : `Chapter ${chapter}`}
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
          </p>
          {timingData && (
            <p className="text-blue-300 text-sm mt-1">
              ✨ {lang === 'fa' ? 'همگام‌سازی فعال' : 'Sync Enabled'} • {timingData.metadata.wordCount} {lang === 'fa' ? 'کلمه' : 'words'}
            </p>
          )}
        </div>
      </div>

      {/* Verses Display with Sync */}
      <div 
        ref={versesContainerRef}
        className="min-h-[500px] max-h-[600px] overflow-y-auto p-8 bg-gradient-to-b from-black/60 via-blue-900/10 to-black/60 backdrop-blur-md scrollbar-thin scrollbar-thumb-blue-500/50 scrollbar-track-transparent"
        dir={lang === 'fa' ? 'rtl' : 'ltr'}
      >
        <div className="space-y-6">
          {processedVerses.map((verse, verseIndex) => {
            const isActive = verseIndex === currentVerseIndex;
            const words = verse.words && verse.words.length > 0
              ? verse.words.map(w => w.word)
              : verse.text.split(/\s+/).filter(w => w.trim().length > 0);
            
            return (
              <div
                key={verseIndex}
                data-verse={verseIndex}
                className={`transition-all duration-500 cursor-pointer p-4 rounded-lg ${
                  verseIndex < currentVerseIndex
                    ? 'text-gray-500 opacity-50 scale-95'
                    : verseIndex > currentVerseIndex
                    ? 'text-gray-400 opacity-70 scale-95'
                    : 'text-gray-100 scale-100 bg-blue-500/10 border border-blue-500/30'
                }`}
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = verse.start;
                    setCurrentTime(verse.start);
                  }
                }}
              >
                <span className={`inline-block font-bold text-sm px-3 py-1 rounded-full mr-2 ${
                  isActive ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
                }`}>
                  {verse.number}
                </span>
                
                <span className="text-2xl leading-relaxed">
                  {words.map((word, wordIndex) => {
                    // پیدا کردن index کلمه در لیست کامل
                    let globalWordIndex = -1;
                    
                    if (verse.words && verse.words.length > 0) {
                      let wordsBeforeVerse = 0;
                      for (let i = 0; i < verseIndex; i++) {
                        if (processedVerses[i].words && processedVerses[i].words.length > 0) {
                          wordsBeforeVerse += processedVerses[i].words.length;
                        }
                      }
                      globalWordIndex = wordsBeforeVerse + wordIndex;
                    } else {
                      globalWordIndex = wordsWithTiming.findIndex(
                        w => w.verseIndex === verseIndex && w.word === word
                      );
                    }
                    
                    const isActiveWord = globalWordIndex === currentWordIndex && globalWordIndex >= 0;
                    
                    return (
                      <span
                        key={`${verseIndex}-${wordIndex}`}
                        className={`inline-block mx-1 transition-all duration-300 ${
                          isActiveWord && isActive
                            ? 'text-yellow-300 font-extrabold scale-125 drop-shadow-[0_0_15px_rgba(253,224,71,1)]'
                            : isActive
                            ? 'text-white font-semibold'
                            : ''
                        }`}
                        style={{
                          transform: isActiveWord && isActive ? 'scale(1.25) translateY(-2px)' : 'scale(1)',
                          textShadow: isActiveWord && isActive ? '0 0 20px rgba(253, 224, 71, 0.8)' : 'none'
                        }}
                      >
                        {word}
                      </span>
                    );
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-gradient-to-t from-slate-900 via-blue-900/20 to-transparent backdrop-blur-xl border-t border-blue-500/30">
        {/* Sync Adjustment */}
        {timingData && (
          <div className="mb-4">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs text-gray-400 hover:text-blue-300 transition-colors mb-2"
            >
              ⚙️ {showSettings ? (lang === 'fa' ? 'پنهان کردن تنظیمات' : 'Hide Settings') : (lang === 'fa' ? 'تنظیمات همگام‌سازی' : 'Sync Settings')}
            </button>
            
            {showSettings && (
              <div className="bg-blue-900/20 backdrop-blur-md rounded-xl p-4 border border-blue-500/30">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <span className="text-sm text-gray-300">{lang === 'fa' ? 'تاخیر متن:' : 'Text Delay:'}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSyncAdjustment(prev => prev - 0.5)}
                      className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-lg text-sm font-medium"
                    >
                      ← {lang === 'fa' ? 'زودتر' : 'Earlier'}
                    </button>
                    <span className="text-white font-mono min-w-[70px] text-center bg-slate-800/50 px-3 py-1 rounded-lg">
                      {syncAdjustment > 0 ? '+' : ''}{syncAdjustment.toFixed(1)}s
                    </span>
                    <button
                      onClick={() => setSyncAdjustment(prev => prev + 0.5)}
                      className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-lg text-sm font-medium"
                    >
                      {lang === 'fa' ? 'دیرتر' : 'Later'} →
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-300">{lang === 'fa' ? 'سرعت پخش:' : 'Playback Speed:'}</span>
                  <div className="flex gap-2">
                    {[0.75, 1, 1.25, 1.5].map(rate => (
                      <button
                        key={rate}
                        onClick={() => handlePlaybackRateChange(rate)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          playbackRate === rate
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-6">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-3 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, 
                #3b82f6 0%, 
                #8b5cf6 ${(currentTime / duration) * 100}%, 
                #334155 ${(currentTime / duration) * 100}%, 
                #334155 100%)`
            }}
          />
          <div className="flex justify-between text-sm text-gray-400 mt-2 font-mono">
            <span className="bg-slate-800/50 px-2 py-0.5 rounded">{formatTime(currentTime)}</span>
            <span className="bg-slate-800/50 px-2 py-0.5 rounded">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Play Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => onChapterChange?.('prev')}
            className="p-4 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 hover:from-blue-600 hover:to-blue-500 transition-all transform hover:scale-110"
            title={lang === 'fa' ? 'فصل قبل' : 'Previous Chapter'}
          >
            <SkipBack size={24} className="text-white" />
          </button>

          <button
            onClick={togglePlay}
            className="p-6 rounded-full bg-gradient-to-br from-blue-600 via-purple-500 to-blue-600 hover:from-blue-500 hover:via-purple-400 hover:to-blue-500 transition-all transform hover:scale-110 shadow-2xl shadow-blue-500/60"
            title={isPlaying ? (lang === 'fa' ? 'توقف' : 'Pause') : (lang === 'fa' ? 'پخش' : 'Play')}
          >
            {isPlaying ? (
              <Pause size={32} className="text-white" />
            ) : (
              <Play size={32} className="text-white" />
            )}
          </button>

          <button
            onClick={() => onChapterChange?.('next')}
            className="p-4 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 hover:from-blue-600 hover:to-blue-500 transition-all transform hover:scale-110"
            title={lang === 'fa' ? 'فصل بعد' : 'Next Chapter'}
          >
            <SkipForward size={24} className="text-white" />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-4 bg-slate-800/30 rounded-xl p-3 backdrop-blur-sm border border-slate-700/50">
          <button
            onClick={toggleMute}
            className="p-2 rounded-lg hover:bg-blue-600/30 transition-all"
          >
            {isMuted ? (
              <VolumeX size={22} className="text-gray-400" />
            ) : (
              <Volume2 size={22} className="text-blue-400" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, 
                #3b82f6 0%, 
                #3b82f6 ${(isMuted ? 0 : volume) * 100}%, 
                #475569 ${(isMuted ? 0 : volume) * 100}%, 
                #475569 100%)`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default BibleAudioPlayerWithSync;
