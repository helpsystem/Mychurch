/**
 * Test Page for AMLL (Apple Music-like Lyrics) Integration
 * Simple demonstration page to preview AMLL features
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, X, Eye, EyeOff, Sparkles } from 'lucide-react';
import { AmllLyricPlayer } from '../components/AmllLyricPlayer';
import { AmllBackground } from '../components/AmllBackground';
import { convertToAmllFormat, hasFinglishSupport, type OurTimingData } from '../utils/amllConverter';
import { useNavigate } from 'react-router-dom';

const TestAmllPage: React.FC = () => {
    const navigate = useNavigate();
    const audioRef = useRef<HTMLAudioElement>(null);

    // State
    const [timingData, setTimingData] = useState<OurTimingData | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showBackground, setShowBackground] = useState(true);
    const [backgroundIntensity, setBackgroundIntensity] = useState(0.5);
    const [showFinglish, setShowFinglish] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Song info (using song 335 for testing)
    const SONG_ID = 335;
    const SONG_TITLE = "آرامی دلهایی";
    const SONG_ARTIST = "ترنم‌های نیایش";
    const AUDIO_URL = `https://samanabyar.online/worship/audio/335.mp3`;

    // Load timing data
    useEffect(() => {
        const loadTimingData = async () => {
            setLoading(true);
            setError(null);

            try {
                const cacheKey = `timing_cache_${SONG_ID}`;
                const cachedData = localStorage.getItem(cacheKey);

                let data: OurTimingData;

                if (cachedData) {
                    data = JSON.parse(cachedData);
                } else {
                    const response = await fetch(`/worship/data/timings/song_${SONG_ID}_timing.json`);
                    if (!response.ok) {
                        throw new Error(`Failed to load timing data: ${response.statusText}`);
                    }
                    data = await response.json();
                    localStorage.setItem(cacheKey, JSON.stringify(data));
                }

                setTimingData(data);
                setLoading(false);
            } catch (err) {
                console.error('Error loading timing data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load timing data');
                setLoading(false);
            }
        };

        loadTimingData();
    }, []);

    // Audio event handlers
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleDurationChange = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    // Convert to AMLL format
    const amllLines = React.useMemo(() => {
        if (!timingData) return [];
        return convertToAmllFormat(timingData);
    }, [timingData]);

    const hasFinglish = React.useMemo(() => {
        if (!timingData) return false;
        return hasFinglishSupport(timingData);
    }, [timingData]);

    // Playback controls
    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const skip = (seconds: number) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    };

    const seekTo = (time: number) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = time;
    };

    const formatTime = (time: number): string => {
        if (!isFinite(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
                    <p className="text-white text-xl">در حال بارگذاری...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-black flex items-center justify-center">
                <div className="text-center max-w-md bg-red-900/30 border border-red-500/50 rounded-xl p-8">
                    <h2 className="text-2xl font-bold text-red-300 mb-4">خطا در بارگذاری</h2>
                    <p className="text-gray-300 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/worship')}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-colors"
                    >
                        بازگشت به صفحه ترانه‌ها
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black overflow-hidden">
            {/* Hidden audio element */}
            <audio ref={audioRef} src={AUDIO_URL} preload="auto" />

            {/* AMLL Background (if enabled) */}
            {showBackground && (
                <AmllBackground
                    enabled={showBackground}
                    intensity={backgroundIntensity}
                    className="absolute inset-0"
                />
            )}

            {/* Main container */}
            <div className="relative z-10 h-full flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-900/90 via-blue-900/90 to-purple-900/90 backdrop-blur-xl border-b border-purple-500/30 p-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                                    <Sparkles className="text-purple-400" size={32} />
                                    تست AMLL Player
                                </h1>
                                <p className="text-gray-300 text-sm">
                                    نمایش سبک Apple Music برای {SONG_TITLE}
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/worship')}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                            >
                                <X size={24} className="text-white" />
                            </button>
                        </div>

                        {/* Song Info */}
                        <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20">
                            <h2 className="text-2xl font-bold text-white mb-1">{SONG_TITLE}</h2>
                            <p className="text-purple-300">{SONG_ARTIST}</p>
                            {hasFinglish && (
                                <p className="text-sm text-cyan-400 mt-2">✓ پشتیبانی از فینگلیش</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Lyrics Display - Custom Implementation (AMLL-inspired) */}
                <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-black via-purple-900/10 to-black">
                    {/* Show message about AMLL */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg px-4 py-2 text-sm text-yellow-300">
                            📝 نکته: این یک پیش‌نمایش است. AMLL نیاز به پیکربندی بیشتری دارد.
                        </div>
                    </div>

                    {/* Custom Lyrics Display with AMLL-inspired styling */}
                    <div className="h-full flex items-center justify-center px-8">
                        <div className="max-w-4xl w-full space-y-6">
                            {amllLines.slice(0, 10).map((line, index) => {
                                const isActive = index === Math.floor((currentTime / duration) * 10);

                                return (
                                    <div
                                        key={index}
                                        className={`text-center transition-all duration-500 ${isActive
                                            ? 'scale-110 opacity-100'
                                            : index < Math.floor((currentTime / duration) * 10)
                                                ? 'opacity-40 scale-95'
                                                : 'opacity-60 scale-95'
                                            }`}
                                    >
                                        {/* Persian Text */}
                                        <p className={`text-4xl font-bold mb-2 ${isActive ? 'text-white' : 'text-gray-400'
                                            }`} dir="rtl">
                                            {line.words.map(w => w.word).join(' ')}
                                        </p>

                                        {/* Finglish Text (if enabled) */}
                                        {showFinglish && line.romanLyric && (
                                            <p className={`text-2xl font-light ${isActive ? 'text-cyan-300' : 'text-cyan-600'
                                                }`} dir="ltr">
                                                {line.romanLyric}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-gradient-to-t from-slate-900/95 via-purple-900/50 to-slate-900/90 backdrop-blur-xl border-t border-purple-500/30 p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Feature Toggles */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {/* Background Toggle */}
                            <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-300">پس‌زمینه پویا</span>
                                    <button
                                        onClick={() => setShowBackground(!showBackground)}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${showBackground
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-slate-700 text-gray-300'
                                            }`}
                                    >
                                        {showBackground ? '✓ فعال' : 'خاموش'}
                                    </button>
                                </div>
                                {showBackground && (
                                    <div className="mt-3">
                                        <label className="text-xs text-gray-400 mb-1 block">شدت افکت</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={backgroundIntensity * 100}
                                            onChange={(e) => setBackgroundIntensity(parseInt(e.target.value) / 100)}
                                            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Finglish Toggle */}
                            <div className="bg-cyan-900/20 rounded-lg p-4 border border-cyan-500/30">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-300">نمایش فینگلیش</span>
                                    <button
                                        onClick={() => setShowFinglish(!showFinglish)}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${showFinglish
                                            ? 'bg-cyan-600 text-white'
                                            : 'bg-slate-700 text-gray-300'
                                            }`}
                                        disabled={!hasFinglish}
                                    >
                                        {showFinglish ? '✓ فعال' : 'خاموش'}
                                    </button>
                                </div>
                                {!hasFinglish && (
                                    <p className="text-xs text-gray-500 mt-2">این ترانه فینگلیش ندارد</p>
                                )}
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
                                <p className="text-xs text-gray-400 mb-1">وضعیت پلیر</p>
                                <p className="text-sm text-white">
                                    {amllLines.length} خط • {formatTime(duration)} مدت زمان
                                </p>
                                <p className="text-xs text-cyan-400 mt-1">
                                    AMLL v0.2.0 + PixiJS
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar - Equalizer Style */}
                        <div className="mb-6">
                            <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                                {/* Equalizer-style gradient progress */}
                                <div
                                    className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-400 transition-all duration-300"
                                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                >
                                    {/* Animated equalizer bars effect */}
                                    <div className="h-full w-full opacity-50 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
                                </div>

                                {/* Interactive overlay */}
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 1}
                                    value={currentTime}
                                    onChange={(e) => seekTo(parseFloat(e.target.value))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    aria-label="Seek progress"
                                />
                            </div>

                            {/* Time Display - Always LEFT to RIGHT */}
                            <div className="flex justify-between text-sm text-gray-400 mt-2 font-mono">
                                {/* Current Time - Always LEFT */}
                                <span className="bg-slate-800/50 px-3 py-1 rounded">{formatTime(currentTime)}</span>
                                {/* Total Duration - Always RIGHT */}
                                <span className="bg-slate-800/50 px-3 py-1 rounded">{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Play Controls */}
                        <div className="flex items-center justify-center gap-6">
                            <button
                                onClick={() => skip(-10)}
                                className="p-4 rounded-full bg-slate-700 hover:bg-purple-600 transition-all hover:scale-110"
                            >
                                <SkipBack size={24} className="text-white" />
                            </button>

                            <button
                                onClick={togglePlay}
                                className="p-6 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-purple-600 hover:from-purple-500 hover:via-pink-400 hover:to-purple-500 transition-all hover:scale-110 shadow-2xl shadow-purple-500/60"
                            >
                                {isPlaying ? (
                                    <Pause size={32} className="text-white" fill="white" />
                                ) : (
                                    <Play size={32} className="text-white" fill="white" />
                                )}
                            </button>

                            <button
                                onClick={() => skip(10)}
                                className="p-4 rounded-full bg-slate-700 hover:bg-purple-600 transition-all hover:scale-110"
                            >
                                <SkipForward size={24} className="text-white" />
                            </button>
                        </div>

                        {/* Info Message */}
                        <div className="mt-6 text-center">
                            <p className="text-xs text-gray-500">
                                این یک صفحه تست برای نمایش قابلیت‌های AMLL است •
                                اگر دوست داشتید، می‌توانیم این را در پلیر اصلی ادغام کنیم
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestAmllPage;
