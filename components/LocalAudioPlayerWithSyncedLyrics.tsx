import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';

interface LyricLine {
  time: number; // زمان شروع خط (به ثانیه)
  text: string;
}

interface Props {
  audioUrl: string;
  lyrics?: string; // متن کامل آهنگ (فقط متن، بدون آکورد)
  chords?: string; // آکوردها جداگانه
  notation?: string; // نوت‌های موسیقی جداگانه
  lyricLines?: LyricLine[]; // اگر زمان‌بندی دقیق دارید
  lang?: string;
  title?: string;
  artist?: string;
  showChords?: boolean; // نمایش آکوردها
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
  showChords = false
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);

  // پردازش متن و تبدیل به خطوط با زمان‌بندی تقریبی
  const processedLyrics: LyricLine[] = React.useMemo(() => {
    if (lyricLines && lyricLines.length > 0) {
      return lyricLines;
    }
    
    if (!lyrics) return [];
    
    // حذف آکوردها از متن اگر درون متن باشند
    let cleanLyrics = lyrics;
    
    // تشخیص و حذف خطوط آکورد (خطوطی که فقط شامل حروف انگلیسی، #, b, m هستند)
    const lines = lyrics.split('\n');
    const cleanedLines = lines.filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return true; // خطوط خالی را نگه دار
      
      // اگر خط فقط آکورد است (حروف انگلیسی + # و b و m)
      const isChordLine = /^[A-G#bm\/\s\d]+$/.test(trimmed) && trimmed.length < 80;
      return !isChordLine; // خطوط آکورد را حذف کن
    });
    
    cleanLyrics = cleanedLines.join('\n');
    
    // تقسیم متن به خطوط
    const finalLines = cleanLyrics.split('\n').filter(line => line.trim());
    
    // زمان‌بندی تقریبی (فرض: هر خط 4 ثانیه)
    return finalLines.map((line, index) => ({
      time: index * 4,
      text: line.trim()
    }));
  }, [lyrics, lyricLines]);

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
        const activeElement = lyricsContainerRef.current.children[activeIndex] as HTMLElement;
        if (activeElement) {
          activeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }
  }, [currentTime, processedLyrics, currentLyricIndex]);

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

      {/* Lyrics Display with Sync */}
      {processedLyrics.length > 0 && (
        <div 
          ref={lyricsContainerRef}
          className="h-64 overflow-y-auto p-6 bg-black/40 backdrop-blur-sm scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
          dir={lang === 'fa' ? 'rtl' : 'ltr'}
        >
          {processedLyrics.map((line, index) => (
            <p
              key={index}
              className={`text-lg leading-relaxed mb-3 transition-all duration-300 cursor-pointer hover:scale-105 ${
                index === currentLyricIndex
                  ? 'text-yellow-400 font-bold scale-110 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]'
                  : index < currentLyricIndex
                  ? 'text-gray-500'
                  : 'text-gray-300'
              }`}
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = line.time;
                }
              }}
            >
              {line.text}
            </p>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="p-6 bg-gradient-to-t from-gray-900 to-gray-800">
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
