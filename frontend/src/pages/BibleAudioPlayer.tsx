import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, ChevronDown } from 'lucide-react';

interface Chapter {
  number: number;
  audioUrl: string;
  verses: Array<{ number: number; text_fa: string; text_en: string }>;
}

const BibleAudioPlayer: React.FC = () => {
  const [currentChapter, setCurrentChapter] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showVerses, setShowVerses] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  // فصل‌های افسسیان (فعلاً فقط فصل 1-6 دانلود شده)
  const chapters: Chapter[] = [
    { number: 1, audioUrl: '/audio/bible/farsi/EPH/1.mp3', verses: [] },
    { number: 2, audioUrl: '/audio/bible/farsi/EPH/2.mp3', verses: [] },
    { number: 3, audioUrl: '/audio/bible/farsi/EPH/3.mp3', verses: [] },
    { number: 4, audioUrl: '/audio/bible/farsi/EPH/4.mp3', verses: [] },
    { number: 5, audioUrl: '/audio/bible/farsi/EPH/5.mp3', verses: [] },
    { number: 6, audioUrl: '/audio/bible/farsi/EPH/6.mp3', verses: [] },
  ];

  const currentChapterData = chapters.find(c => c.number === currentChapter);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      // Auto-play next chapter
      if (currentChapter < 6) {
        setCurrentChapter(currentChapter + 1);
        setTimeout(() => {
          audioRef.current?.play();
          setIsPlaying(true);
        }, 500);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentChapter]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentChapter]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const prevChapter = () => {
    if (currentChapter > 1) {
      setCurrentChapter(currentChapter - 1);
    }
  };

  const nextChapter = () => {
    if (currentChapter < 6) {
      setCurrentChapter(currentChapter + 1);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white" dir="rtl">
      {/* Hidden audio element */}
      <audio ref={audioRef}>
        <source src={currentChapterData?.audioUrl} type="audio/mpeg" />
      </audio>

      {/* Header */}
      <div className="bg-black/30 backdrop-blur-md border-b border-white/10 p-6">
        <h1 className="text-4xl font-bold text-center mb-2">📖 افسسیان</h1>
        <p className="text-center text-purple-200">پخش صوتی کتاب مقدس - ترجمه فارسی</p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Chapter Selector */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold mb-4 text-center">فصل {currentChapter}</h2>
          
          {/* Chapter Buttons */}
          <div className="grid grid-cols-6 gap-2 mb-6">
            {chapters.map((chapter) => (
              <button
                key={chapter.number}
                onClick={() => setCurrentChapter(chapter.number)}
                className={`py-3 rounded-xl font-bold transition-all ${
                  currentChapter === chapter.number
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white/80'
                }`}
              >
                {chapter.number}
              </button>
            ))}
          </div>

          {/* Audio Progress */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
            <div className="flex justify-between text-sm text-white/60 mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={prevChapter}
              disabled={currentChapter === 1}
              className="p-4 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <SkipBack className="w-6 h-6" />
            </button>

            <button
              onClick={togglePlay}
              className="p-6 rounded-full bg-purple-600 hover:bg-purple-700 shadow-2xl transition-all transform hover:scale-105"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 mr-1" />
              )}
            </button>

            <button
              onClick={nextChapter}
              disabled={currentChapter === 6}
              className="p-4 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          {/* Volume Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4 text-white/60">
            <Volume2 className="w-5 h-5" />
            <span className="text-sm">از کنترل صدای سیستم استفاده کنید</span>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <button
            onClick={() => setShowVerses(!showVerses)}
            className="w-full flex items-center justify-between mb-4"
          >
            <h3 className="text-xl font-bold">📝 درباره این صوت</h3>
            <ChevronDown className={`w-5 h-5 transition-transform ${showVerses ? 'rotate-180' : ''}`} />
          </button>

          {showVerses && (
            <div className="space-y-3 text-white/80">
              <p>
                🎙️ <strong>منبع:</strong> WordProject.org
              </p>
              <p>
                📚 <strong>ترجمه:</strong> ترجمه فارسی کتاب مقدس
              </p>
              <p>
                ⏱️ <strong>مدت زمان:</strong> {formatTime(duration)}
              </p>
              <p>
                🎵 <strong>فرمت:</strong> MP3 - کیفیت بالا
              </p>
              <p>
                💾 <strong>حالت:</strong> فایل‌های محلی (آفلاین)
              </p>
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mt-4">
                <p className="text-sm">
                  💡 <strong>نکته:</strong> این صوت کل فصل را به صورت پیوسته می‌خواند.
                  فایل‌ها از سایت WordProject دانلود و در سرور محلی ذخیره شده‌اند.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Download Info */}
        <div className="mt-6 text-center text-white/60 text-sm">
          <p>📥 فعلاً فقط فصل‌های 1-6 افسسیان دانلود شده است</p>
          <p className="mt-2">برای دانلود سایر کتاب‌ها، از اسکریپت <code className="bg-black/30 px-2 py-1 rounded">download-to-public.cjs</code> استفاده کنید</p>
        </div>
      </div>
    </div>
  );
};

export default BibleAudioPlayer;
