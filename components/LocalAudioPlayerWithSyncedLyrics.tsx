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
      firstLineWords: processedLyrics[0]?.words?.length || 0
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
      console.log('📝 First word:', allWords[0]);
      console.log('📝 Last word:', allWords[allWords.length - 1]);
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
        console.log('🎯 Active word INDEX:', activeWordIndex, '→', wordsWithTiming[activeWordIndex].word, 'at', currentTime.toFixed(2));
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
    <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
      {/* Audio Element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Header */}
      {(title || artist) && (
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-6 text-center border-b border-gray-800">
          {title && <h3 className="text-2xl font-bold text-white mb-1">{title}</h3>}
          {artist && <p className="text-gray-300 text-sm">{artist}</p>}
        </div>
      )}

      {/* Lyrics Display with Word-by-Word Sync - Centered */}
      {processedLyrics.length > 0 && (
        <div 
          ref={lyricsContainerRef}
          className="min-h-[300px] max-h-[400px] overflow-y-auto p-8 bg-black/40 backdrop-blur-sm scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent flex items-center justify-center"
          dir={lang === 'fa' ? 'rtl' : 'ltr'}
        >
          <div className="w-full text-center space-y-4">
            {processedLyrics.map((line, lineIndex) => {
              // اگر این خط words دقیق دارد، از آن استفاده کن
              const hasWordTiming = line.words && line.words.length > 0;
              const lineWords = hasWordTiming
                ? line.words.map(w => w.word)
                : line.text.split(/\s+/).filter(w => w.trim().length > 0);
              
              return (
                <p
                  key={lineIndex}
                  className={`text-2xl leading-relaxed transition-all duration-300 cursor-pointer ${
                    lineIndex < currentLyricIndex
                      ? 'text-gray-600 opacity-50'
                      : lineIndex > currentLyricIndex
                      ? 'text-gray-300 opacity-70'
                      : 'text-gray-200'
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
                      const wordData = line.words[wordIndex];
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
                        
                        // فقط یکبار log کن در اولین کلمه
                        if (lineIndex === 0 && wordIndex === 0) {
                          console.log(`🔍 First word mapping: "${word}" at line ${lineIndex}, word ${wordIndex} → global index: ${globalWordIndex}`);
                        }
                      }
                    } else {
                      // fallback به روش قبلی
                      globalWordIndex = wordsWithTiming.findIndex(
                        w => w.lineIndex === lineIndex && w.word === word
                      );
                    }
                    
                    const isActiveWord = globalWordIndex === currentWordIndex;
                    const isInActiveLine = lineIndex === currentLyricIndex;
                    
                    return (
                      <span
                        key={`${lineIndex}-${wordIndex}`}
                        className={`inline-block mx-1 transition-all duration-200 ${
                          isActiveWord && isInActiveLine
                            ? 'text-yellow-400 font-bold scale-125 drop-shadow-[0_0_15px_rgba(250,204,21,1)] animate-pulse'
                            : isInActiveLine
                            ? 'text-white'
                            : ''
                        }`}
                        style={{
                          transform: isActiveWord && isInActiveLine ? 'scale(1.25)' : 'scale(1)',
                          transition: 'all 0.2s ease-in-out'
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

      {/* Controls */}
      <div className="p-6 bg-gradient-to-t from-gray-900 to-gray-800">
        {/* Sync Adjustment Controls */}
        <div className="mb-4">
          <button
            onClick={() => setShowSyncControls(!showSyncControls)}
            className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-2 mb-2"
          >
            ⚙️ {showSyncControls ? 'پنهان کردن' : 'تنظیم هماهنگی متن'}
          </button>
          
          {showSyncControls && (
            <div className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-700">
              <div className="flex items-center justify-between gap-4 mb-3">
                <span className="text-sm text-gray-300">تاخیر متن:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSyncAdjustment(prev => prev - 0.5)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm"
                  >
                    ← زودتر
                  </button>
                  <span className="text-white font-mono min-w-[60px] text-center">
                    {syncAdjustment > 0 ? '+' : ''}{syncAdjustment.toFixed(1)}s
                  </span>
                  <button
                    onClick={() => setSyncAdjustment(prev => prev + 0.5)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm"
                  >
                    دیرتر →
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSyncAdjustment(0)}
                className="w-full px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300"
              >
                بازنشانی
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`
            }}
          />
          <div className="flex justify-between text-sm text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Play Controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => skip(-10)}
            className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
            title="10s قبل"
          >
            <SkipBack size={20} className="text-white" />
          </button>

          <button
            onClick={togglePlay}
            className="p-4 rounded-full bg-blue-600 hover:bg-blue-500 transition-all transform hover:scale-110 shadow-lg shadow-blue-500/50"
            title={isPlaying ? 'توقف' : 'پخش'}
          >
            {isPlaying ? (
              <Pause size={28} className="text-white" />
            ) : (
              <Play size={28} className="text-white" />
            )}
          </button>

          <button
            onClick={() => skip(10)}
            className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
            title="10s بعد"
          >
            <SkipForward size={20} className="text-white" />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            {isMuted ? (
              <VolumeX size={20} className="text-gray-400" />
            ) : (
              <Volume2 size={20} className="text-gray-400" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default LocalAudioPlayerWithSyncedLyrics;
