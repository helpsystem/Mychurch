import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';

interface LyricLine {
  time: number; // زمان شروع خط (به ثانیه)
  text: string;
  words?: Array<{word: string; start: number; end: number}>; // کلمات با timing دقیق
}

interface WordWithTime {
  word: string;
  startTime: number;
  endTime: number;
  lineIndex: number;
}

interface Props {
  audioUrl: string;
  lyrics?: string; // متن کامل آهنگ (فقط متن، بدون آکورد)
  chords?: string; // آکوردها جداگانه
  notation?: string; // نوت‌های موسیقی جداگانه
  lyricLines?: LyricLine[]; // اگر زمان‌بندی دقیق دارید (با یا بدون words)
  lang?: string;
  title?: string;
  artist?: string;
  showChords?: boolean; // نمایش آکوردها
  lineDelay?: number; // تاخیر اول موزیک قبل از شروع خواندن (ثانیه)
  lineDuration?: number; // مدت زمان هر خط (ثانیه) - پیش‌فرض: 3
  wordDurationRatio?: number; // نسبت سرعت کلمات (0.5 = نصف سرعت، 2 = دو برابر) - پیش‌فرض: 1
}

const LocalAudioPlayerWithSyncedLyrics: React.FC<Props> = ({
  audioUrl,
  lyrics,
  chords,
  notation,
  lyricLines,
  lang = 'fa',
  title,
  artist,
  showChords = false,
  lineDelay = 0,
  lineDuration = 3,
  wordDurationRatio = 1
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [syncAdjustment, setSyncAdjustment] = useState(0); // تنظیم تاخیر (+ یا -)
  const [showSyncControls, setShowSyncControls] = useState(false);

  // پردازش متن و تبدیل به خطوط با زمان‌بندی تقریبی
  const processedLyrics: LyricLine[] = React.useMemo(() => {
    if (lyricLines && lyricLines.length > 0) {
      console.log('🎵 Using precise timing with lyricLines:', {
        lineCount: lyricLines.length,
        firstLine: lyricLines[0],
        hasWords: lyricLines[0]?.words?.length || 0
      });
      return lyricLines;
    }
    
    if (!lyrics) {
      return [];
    }
    
    // حذف آکوردهای درون‌خطی مثل [Em], [G], [F], [C#/A]
    let cleanLyrics = lyrics.replace(/\[([A-G][#b]?m?\d?[\/]?[A-G]?[#b]?)\]/g, '');
    
    // حذف برچسب‌های V1, V2, Chorus و ...
    cleanLyrics = cleanLyrics.replace(/^(V\d+|Chorus\d*|Bridge|Intro|Outro|Verse\s*\d*)$/gm, '');
    
    // تقسیم متن به خطوط
    const lines = cleanLyrics.split('\n');
    
    // فیلتر خطوط خالی و خطوط فقط آکورد
    const cleanedLines = lines.filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return false; // خطوط خالی را حذف کن
      
      // اگر خط فقط شامل حروف انگلیسی، #, b, m, /, فاصله و اعداد است (بدون متن فارسی/انگلیسی)
      const isChordOnlyLine = /^[A-G#bm\/\s\d\[\]]+$/.test(trimmed);
      if (isChordOnlyLine) return false;
      
      return true; // همه خطوط دیگر را نگه دار
    });
    
    // زمان‌بندی تقریبی (با lineDelay و lineDuration قابل تنظیم)
    return cleanedLines.map((line, index) => ({
      time: lineDelay + (index * lineDuration) + syncAdjustment,
      text: line.trim()
    }));
  }, [lyrics, lyricLines, lineDelay, lineDuration, syncAdjustment]);

  // تبدیل خطوط به کلمات با زمان‌بندی
  const wordsWithTiming: WordWithTime[] = React.useMemo(() => {
    const allWords: WordWithTime[] = [];
    
    // اگر lyricLines شامل words با timing دقیق بود، از آن استفاده کن
    const hasWordTiming = processedLyrics.some(line => line.words && line.words.length > 0);
    
    console.log('🔍 Word timing check:', {
      hasWordTiming,
      processedLyricsCount: processedLyrics.length,
      firstLineWords: processedLyrics[0]?.words?.length || 0,
      allLines: processedLyrics.map((l, i) => ({
        index: i,
        time: l.time,
        text: l.text?.substring(0, 30),
        wordCount: l.words?.length || 0
      }))
    });
    
    if (hasWordTiming) {
      console.log('✅ Using PRECISE word timing from JSON file');
      // استفاده از timing دقیق از فایل
      processedLyrics.forEach((line, lineIndex) => {
        if (line.words && line.words.length > 0) {
          line.words.forEach(wordData => {
            allWords.push({
              word: wordData.word,
              startTime: wordData.start,
              endTime: wordData.end,
              lineIndex
            });
          });
        }
      });
      console.log('📊 Total words loaded:', allWords.length);
      console.log('📝 First 5 words:', allWords.slice(0, 5));
      console.log('📝 Last 5 words:', allWords.slice(-5));
    } else {
      console.log('⚠️ Using CALCULATED timing (no precise timing available)');
      // محاسبه تقریبی timing برای کلمات
      processedLyrics.forEach((line, lineIndex) => {
        const words = line.text.split(/\s+/).filter(w => w.trim().length > 0);
        const lineStartTime = line.time;
        const actualLineDuration = lineDuration; // مدت زمان خط
        const wordDuration = words.length > 0 ? (actualLineDuration / words.length) * wordDurationRatio : 0.4;
        
        words.forEach((word, wordIndex) => {
          const startTime = lineStartTime + (wordIndex * wordDuration);
          const endTime = startTime + wordDuration;
          
          allWords.push({
            word: word.trim(),
            startTime,
            endTime,
            lineIndex
          });
        });
      });
    }
    
    return allWords;
  }, [processedLyrics, lineDuration, wordDurationRatio]);

  // به‌روزرسانی زمان فعلی
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handleSeeked = () => {
      // وقتی کاربر seek میکند (جلو/عقب میبرد)، فوراً زمان را به‌روزرسانی کن
      setCurrentTime(audio.currentTime);
      console.log('⏩ Seeked to:', audio.currentTime.toFixed(2));
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('seeked', handleSeeked);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('seeked', handleSeeked);
    };
  }, []);

  // تشخیص خط فعلی بر اساس زمان
  useEffect(() => {
    if (processedLyrics.length === 0) return;

    // پیدا کردن آخرین خطی که زمانش کمتر از زمان فعلی است
    let activeIndex = -1;
    for (let i = 0; i < processedLyrics.length; i++) {
      if (processedLyrics[i].time <= currentTime) {
        activeIndex = i;
      } else {
        break;
      }
    }

    if (activeIndex !== currentLyricIndex) {
      setCurrentLyricIndex(activeIndex);
      
      // اسکرول خودکار به خط فعلی
      if (lyricsContainerRef.current && activeIndex >= 0) {
        const container = lyricsContainerRef.current;
        const activeElement = container.querySelector(`p:nth-child(${activeIndex + 1})`) as HTMLElement;
        if (activeElement) {
          activeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }
  }, [currentTime, processedLyrics, currentLyricIndex]);

  // تشخیص کلمه فعلی بر اساس زمان
  useEffect(() => {
    if (wordsWithTiming.length === 0) {
      console.log('⚠️ No words with timing available');
      return;
    }

    // پیدا کردن کلمه‌ای که زمان فعلی در بازه‌ی آن قرار دارد
    let activeWordIndex = -1;
    for (let i = 0; i < wordsWithTiming.length; i++) {
      if (currentTime >= wordsWithTiming[i].startTime && currentTime < wordsWithTiming[i].endTime) {
        activeWordIndex = i;
        break;
      }
    }

    if (activeWordIndex !== currentWordIndex) {
      if (activeWordIndex >= 0) {
        const activeWord = wordsWithTiming[activeWordIndex];
        console.log(`🎯 Active word INDEX: ${activeWordIndex} → "${activeWord.word}" at time ${currentTime.toFixed(2)}s (line ${activeWord.lineIndex})`);
      } else {
        console.log(`⏸️ No active word at time ${currentTime.toFixed(2)}s`);
      }
      setCurrentWordIndex(activeWordIndex);
    }
  }, [currentTime, wordsWithTiming, currentWordIndex]);

  // کنترل پخش/توقف
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

  // تغییر زمان
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // تغییر صدا
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // قطع/وصل صدا
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

  // جلو/عقب بردن
  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  // فرمت زمان
  const formatTime = (time: number): string => {
    if (!isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-purple-500/30">
      {/* Audio Element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Header - طراحی مدرن و زیبا */}
      {(title || artist) && (
        <div className="relative bg-gradient-to-r from-purple-600/40 via-blue-600/40 to-purple-600/40 backdrop-blur-xl p-8 text-center border-b border-purple-500/30 overflow-hidden">
          {/* افکت نور پس‌زمینه */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent animate-pulse"></div>
          
          <div className="relative z-10">
            {title && (
              <h3 className="text-4xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                {title}
              </h3>
            )}
            {artist && (
              <p className="text-gray-200 text-lg font-medium flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                {artist}
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Lyrics Display with Word-by-Word Sync - Centered */}
      {processedLyrics.length > 0 && (
        <div 
          ref={lyricsContainerRef}
          className="min-h-[400px] max-h-[600px] overflow-y-auto p-10 bg-gradient-to-b from-black/60 via-purple-900/10 to-black/60 backdrop-blur-md scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent flex items-start justify-center"
          dir={lang === 'fa' ? 'rtl' : 'ltr'}
        >
          <div className="w-full text-center space-y-6 py-8">
            {processedLyrics.map((line, lineIndex) => {
              // اگر این خط words دقیق دارد، از آن استفاده کن
              const hasWordTiming = line.words && line.words.length > 0;
              const lineWords = hasWordTiming
                ? line.words.map(w => w.word)
                : line.text.split(/\s+/).filter(w => w.trim().length > 0);
              
              return (
                <p
                  key={lineIndex}
                  className={`text-3xl leading-relaxed transition-all duration-500 cursor-pointer font-medium ${
                    lineIndex < currentLyricIndex
                      ? 'text-gray-600 opacity-40 scale-95'
                      : lineIndex > currentLyricIndex
                      ? 'text-gray-400 opacity-60 scale-95'
                      : 'text-gray-100 scale-100'
                  }`}
                  onClick={() => {
                    if (audioRef.current) {
                      console.log('🎯 Seeking to line', lineIndex, 'at time:', line.time.toFixed(2));
                      audioRef.current.currentTime = line.time;
                      setCurrentTime(line.time);
                    }
                  }}
                >
                  {lineWords.map((word, wordIndex) => {
                    // پیدا کردن index این کلمه در لیست کامل کلمات
                    let globalWordIndex = -1;
                    
                    if (hasWordTiming) {
                      // اگر timing دقیق داریم - پیدا کردن با lineIndex و wordIndex
                      const wordData = line.words?.[wordIndex];
                      if (wordData) {
                        // شمارش کلمات قبل از این خط
                        let wordsBeforeLine = 0;
                        for (let i = 0; i < lineIndex; i++) {
                          if (processedLyrics[i].words && processedLyrics[i].words.length > 0) {
                            wordsBeforeLine += processedLyrics[i].words.length;
                          }
                        }
                        // index نهایی = کلمات قبلی + index در خط فعلی
                        globalWordIndex = wordsBeforeLine + wordIndex;
                        
                        // Debug: لاگ برای چند کلمه اول
                        if (lineIndex === 0 && wordIndex < 2) {
                          console.log(`🔍 Word mapping [L${lineIndex}W${wordIndex}]: "${word}" → global index: ${globalWordIndex}, currentWordIndex: ${currentWordIndex}`);
                        }
                      }
                    } else {
                      // fallback به روش قبلی
                      globalWordIndex = wordsWithTiming.findIndex(
                        w => w.lineIndex === lineIndex && w.word === word
                      );
                    }
                    
                    const isActiveWord = globalWordIndex === currentWordIndex && globalWordIndex >= 0;
                    const isInActiveLine = lineIndex === currentLyricIndex;
                    
                    // Debug هایلایت
                    if (isActiveWord && isInActiveLine && lineIndex === 0 && wordIndex === 0) {
                      console.log(`✨ HIGHLIGHTING: "${word}" (global: ${globalWordIndex}, current: ${currentWordIndex})`);
                    }
                    
                    return (
                      <span
                        key={`${lineIndex}-${wordIndex}`}
                        className={`inline-block mx-1.5 transition-all duration-300 ${
                          isActiveWord && isInActiveLine
                            ? 'text-yellow-300 font-extrabold scale-150 drop-shadow-[0_0_25px_rgba(253,224,71,1)] animate-pulse'
                            : isInActiveLine
                            ? 'text-white font-semibold'
                            : ''
                        }`}
                        style={{
                          transform: isActiveWord && isInActiveLine ? 'scale(1.5) translateY(-4px)' : 'scale(1)',
                          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          textShadow: isActiveWord && isInActiveLine ? '0 0 30px rgba(253, 224, 71, 0.8), 0 0 15px rgba(253, 224, 71, 0.6)' : 'none'
                        }}
                      >
                        {word}
                      </span>
                    );
                  })}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls - طراحی مدرن */}
      <div className="p-8 bg-gradient-to-t from-slate-900 via-purple-900/20 to-transparent backdrop-blur-xl border-t border-purple-500/30">
        {/* Sync Adjustment Controls */}
        <div className="mb-4">
          <button
            onClick={() => setShowSyncControls(!showSyncControls)}
            className="text-xs text-gray-400 hover:text-purple-300 transition-colors flex items-center gap-2 mb-2"
          >
            ⚙️ {showSyncControls ? 'پنهان کردن' : 'تنظیم هماهنگی متن'}
          </button>
          
          {showSyncControls && (
            <div className="bg-purple-900/20 backdrop-blur-md rounded-xl p-4 mb-4 border border-purple-500/30 shadow-lg shadow-purple-500/10">
              <div className="flex items-center justify-between gap-4 mb-3">
                <span className="text-sm text-gray-300">تاخیر متن:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSyncAdjustment(prev => prev - 0.5)}
                    className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-lg text-sm font-medium shadow-lg shadow-red-500/30 transition-all"
                  >
                    ← زودتر
                  </button>
                  <span className="text-white font-mono min-w-[70px] text-center bg-slate-800/50 px-3 py-1 rounded-lg">
                    {syncAdjustment > 0 ? '+' : ''}{syncAdjustment.toFixed(1)}s
                  </span>
                  <button
                    onClick={() => setSyncAdjustment(prev => prev + 0.5)}
                    className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-lg text-sm font-medium shadow-lg shadow-green-500/30 transition-all"
                  >
                    دیرتر →
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSyncAdjustment(0)}
                className="w-full px-3 py-1.5 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 rounded-lg text-sm text-gray-200 font-medium transition-all"
              >
                بازنشانی
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar - طراحی گلو */}
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
                #a855f7 0%, 
                #ec4899 ${(currentTime / duration) * 100}%, 
                #334155 ${(currentTime / duration) * 100}%, 
                #334155 100%)`,
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)'
            }}
          />
          <div className="flex justify-between text-sm text-gray-400 mt-2 font-mono">
            <span className="bg-slate-800/50 px-2 py-0.5 rounded">{formatTime(currentTime)}</span>
            <span className="bg-slate-800/50 px-2 py-0.5 rounded">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Play Controls - دکمه‌های بزرگتر و زیباتر */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <button
            onClick={() => skip(-10)}
            className="p-4 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 hover:from-purple-600 hover:to-purple-500 transition-all transform hover:scale-110 shadow-lg hover:shadow-purple-500/50"
            title="10 ثانیه قبل"
          >
            <SkipBack size={24} className="text-white" />
          </button>

          <button
            onClick={togglePlay}
            className="p-6 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-purple-600 hover:from-purple-500 hover:via-pink-400 hover:to-purple-500 transition-all transform hover:scale-110 shadow-2xl shadow-purple-500/60 relative overflow-hidden group"
            title={isPlaying ? 'توقف' : 'پخش'}
          >
            {/* افکت نور در هاور */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            
            {isPlaying ? (
              <Pause size={32} className="text-white relative z-10" />
            ) : (
              <Play size={32} className="text-white relative z-10" />
            )}
          </button>

          <button
            onClick={() => skip(10)}
            className="p-4 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 hover:from-purple-600 hover:to-purple-500 transition-all transform hover:scale-110 shadow-lg hover:shadow-purple-500/50"
            title="10 ثانیه بعد"
          >
            <SkipForward size={24} className="text-white" />
          </button>
        </div>

        {/* Volume Control - طراحی بهتر */}
        <div className="flex items-center gap-4 bg-slate-800/30 rounded-xl p-3 backdrop-blur-sm border border-slate-700/50">
          <button
            onClick={toggleMute}
            className="p-2 rounded-lg hover:bg-purple-600/30 transition-all"
          >
            {isMuted ? (
              <VolumeX size={22} className="text-gray-400" />
            ) : (
              <Volume2 size={22} className="text-purple-400" />
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
                #a855f7 0%, 
                #a855f7 ${(isMuted ? 0 : volume) * 100}%, 
                #475569 ${(isMuted ? 0 : volume) * 100}%, 
                #475569 100%)`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LocalAudioPlayerWithSyncedLyrics;
