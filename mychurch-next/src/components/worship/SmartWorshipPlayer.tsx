import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, Maximize, Minimize, Globe, Type, SkipBack, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TranscriptData, LineSegment, SystemTimingV2 } from '@/types/worship-sync';

interface SmartWorshipPlayerProps {
    timingData: SystemTimingV2 | TranscriptData;
    audioSrc: string;
    backgroundImage?: string;
    title?: string;
    viewOnly?: boolean; // حالت فقط نمایش - بدون کنترل
    externalCurrentTime?: number; // زمان جاری از بیرون (برای سینک)
    onTimeUpdate?: (time: number) => void; // callback برای گزارش زمان به parent
    translations?: {
        finglish?: string[];
        english?: string[];
        persian?: string[];
    };
    // New Style Props
    backgroundOpacity?: number;
    backgroundBlur?: number;
    textShadow?: boolean;
    objectFit?: 'cover' | 'contain' | 'fill';
}

export const SmartWorshipPlayer: React.FC<SmartWorshipPlayerProps> = ({
    timingData,
    audioSrc,
    backgroundImage = '/images/worship/worship-bg-default.jpg',
    viewOnly = false,
    externalCurrentTime,
    onTimeUpdate,
    translations,
    // Defaults
    backgroundOpacity = 60,
    backgroundBlur = 0,
    textShadow = true,
    objectFit = 'cover'
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showFinglish, setShowFinglish] = useState(true);
    const [showPersian, setShowPersian] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [audioError, setAudioError] = useState(false);

    // Normalized data handling
    const [lines, setLines] = useState<LineSegment[]>([]);

    const audioRef = useRef<HTMLAudioElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Normalize input data
    useEffect(() => {
        if (!timingData) {
            console.log('⚠️ No timing data received');
            return;
        }

        console.log('📊 Timing data received:', timingData);

        if ('version' in timingData) {
            // SystemTimingV2
            console.log('✅ Converting SystemV2 format, lines count:', timingData.lines.length);
            const converted: LineSegment[] = timingData.lines.map(l => ({
                type: 'lyric',
                content: l.line,
                words: l.words.map(w => ({
                    word: w.word,
                    start_time: w.start,
                    end_time: w.end,
                }))
            }));
            setLines(converted);
            console.log('✅ Converted lines:', converted.length);
        } else {
            // TranscriptData
            console.log('✅ Using TranscriptData format, lines count:', timingData.lines.length);
            setLines(timingData.lines);
        }
    }, [timingData]);

    // Handle Finglish retrieval
    const getFinglishForLine = (index: number) => {
        // 1. Check explicit translations prop (from Studio)
        if (translations?.finglish?.[index]) {
            return translations.finglish[index];
        }

        // 2. Check SystemV2 embedded finglish
        if ('version' in timingData && timingData.lines[index]) {
            const words = timingData.lines[index].words;
            const finglishLine = words.map(w => w.finglish).filter(Boolean).join(' ');
            if (finglishLine.trim()) return finglishLine;
        }

        return null; // No finglish found
    };

    // Sync Loop - use externalCurrentTime if in viewOnly mode
    useEffect(() => {
        // در حالت viewOnly از زمان خارجی استفاده کن
        if (viewOnly && externalCurrentTime !== undefined) {
            setCurrentTime(externalCurrentTime);
            return;
        }

        const audio = audioRef.current;
        if (!audio) return;

        let animationFrameId: number | undefined;
        const loop = () => {
            const time = audio.currentTime;
            setCurrentTime(time);
            // گزارش زمان به parent برای سینک با Display
            if (onTimeUpdate) {
                onTimeUpdate(time);
            }
            if (!audio.paused && !audio.ended) {
                animationFrameId = requestAnimationFrame(loop);
            }
        };

        if (isPlaying) {
            loop();
        }

        return () => {
            if (animationFrameId !== undefined) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isPlaying, onTimeUpdate, viewOnly, externalCurrentTime]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) audioRef.current.pause();
            else audioRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Find active line index - more precise matching
    const activeLineIndex = useMemo(() => {
        // First, find the exact line being sung
        const exactMatch = lines.findIndex(line => {
            const start = line.words[0]?.start_time || 0;
            const end = line.words[line.words.length - 1]?.end_time || 0;
            return currentTime >= start && currentTime <= end + 0.5;
        });

        if (exactMatch !== -1) return exactMatch;

        // If no exact match, find the upcoming line (within 3 seconds)
        const upcomingMatch = lines.findIndex(line => {
            const start = line.words[0]?.start_time || 0;
            return currentTime >= start - 3 && currentTime < start;
        });

        if (upcomingMatch !== -1) return upcomingMatch;

        // Find the last line that has passed
        for (let i = lines.length - 1; i >= 0; i--) {
            const end = lines[i].words[lines[i].words.length - 1]?.end_time || 0;
            if (currentTime > end) return Math.min(i + 1, lines.length - 1);
        }

        return 0;
    }, [lines, currentTime]);

    // Display line index  
    const displayLineIndex = activeLineIndex;

    // Debug logging
    useEffect(() => {
        if (lines.length > 0) {
            console.log('🎵 Current Time:', currentTime.toFixed(2), '| Active Line:', displayLineIndex, '| Total Lines:', lines.length);
        }
    }, [currentTime, displayLineIndex, lines.length]);

    // Skip to first lyrics (useful when song starts late)
    const skipToLyrics = () => {
        if (audioRef.current && lines.length > 0) {
            const firstStart = lines[0].words[0]?.start_time || 0;
            audioRef.current.currentTime = Math.max(0, firstStart - 2);
        }
    };

    // Skip forward/backward by 10 seconds
    const skip = (seconds: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
        }
    };

    return (
        <div
            ref={containerRef}
            dir="rtl"
            onContextMenu={(e) => e.preventDefault()}
            className={`relative overflow-hidden bg-black text-white font-sans select-none ${isFullscreen ? 'h-screen w-screen' : 'w-full aspect-video rounded-2xl shadow-2xl'}`}
            style={{ WebkitUserSelect: "none", MozUserSelect: "none", msUserSelect: "none", userSelect: "none" }}
        >
            {/* Background - with fallback gradient */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
                {backgroundImage && (
                    <img
                        src={backgroundImage}
                        alt="Background"
                        className="w-full h-full transition-all duration-300 transform scale-105"
                        style={{
                            objectFit: objectFit,
                            opacity: backgroundOpacity / 100,
                            filter: `blur(${backgroundBlur}px)`
                        }}
                        onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                )}
                {/* Gradient Overlay removed or made optional? Keeping standard overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60" />
            </div>

            {/* Content Layer */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 lg:p-16">
                <AnimatePresence mode='wait'>
                    {lines.length > 0 && displayLineIndex < lines.length && (
                        <motion.div
                            key={displayLineIndex}
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                scale: 1,
                            }}
                            exit={{ opacity: 0, y: -30, scale: 0.9 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            className={`text-center w-full px-4 ${textShadow ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]' : ''}`}
                            dir="rtl"
                        >
                            {showPersian && (
                                <div className="font-bold text-4xl lg:text-6xl text-white drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] leading-relaxed">
                                    {lines[displayLineIndex].words.map((word, wIdx) => {
                                        const isActive = currentTime >= word.start_time && currentTime <= word.end_time;
                                        const isPast = currentTime > word.end_time;
                                        return (
                                            <span
                                                key={wIdx}
                                                className={`inline-block mx-1 lg:mx-2 transition-all duration-200 ${isActive
                                                    ? 'text-teal-300 scale-110 drop-shadow-[0_0_15px_rgba(94,234,212,0.8)]'
                                                    : isPast
                                                        ? 'text-white/70'
                                                        : 'text-white/50'
                                                    }`}
                                            >
                                                {word.word}
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            {showFinglish && getFinglishForLine(displayLineIndex) && (
                                <p className="font-mono mt-6 text-xl lg:text-3xl text-teal-200/80 tracking-wider" dir="ltr">
                                    {getFinglishForLine(displayLineIndex)}
                                </p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Show waiting message if before lyrics start */}
                {lines.length > 0 && currentTime < (lines[0]?.words[0]?.start_time || 0) - 3 && (
                    <div className="absolute bottom-32 text-center text-white/50 text-lg">
                        <p>🎵 سرود به زودی شروع می‌شود...</p>
                        <button
                            onClick={skipToLyrics}
                            className="mt-2 px-4 py-2 bg-teal-600/50 hover:bg-teal-500/70 rounded-lg text-sm transition-colors"
                        >
                            پرش به شروع سرود
                        </button>
                    </div>
                )}
            </div>

            {/* Controls Layer - Hidden in viewOnly mode */}
            {!viewOnly && (
                <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 lg:p-6" dir="ltr">

                    {/* Progress Bar */}
                    <div
                        className="w-full h-2 bg-gray-700/50 rounded-full mb-4 cursor-pointer overflow-hidden group"
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const pos = (e.clientX - rect.left) / rect.width;
                            if (audioRef.current && duration) audioRef.current.currentTime = pos * duration;
                        }}
                    >
                        <div
                            className="h-full bg-gradient-to-r from-teal-400 to-indigo-500 rounded-full transition-all duration-100"
                            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 lg:gap-4">
                            {/* Skip Back */}
                            <button
                                onClick={() => skip(-10)}
                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                title="10 ثانیه عقب"
                            >
                                <SkipBack className="w-5 h-5" />
                            </button>

                            {/* Play/Pause */}
                            <button
                                onClick={togglePlay}
                                className="w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full bg-teal-500 hover:bg-teal-400 text-black transition-transform hover:scale-105 shadow-lg shadow-teal-500/30"
                            >
                                {isPlaying ? <Pause className="w-6 h-6 lg:w-7 lg:h-7 fill-current" /> : <Play className="w-6 h-6 lg:w-7 lg:h-7 fill-current ml-1" />}
                            </button>

                            {/* Skip Forward */}
                            <button
                                onClick={() => skip(10)}
                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                title="10 ثانیه جلو"
                            >
                                <SkipForward className="w-5 h-5" />
                            </button>

                            <div className="text-sm font-mono text-gray-300 mr-2">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 lg:gap-3">
                            <button
                                onClick={() => setShowFinglish(!showFinglish)}
                                className={`p-2 rounded-lg transition-colors border ${showFinglish ? 'bg-teal-500/20 border-teal-500/50 text-teal-300' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/10'}`}
                                title="نمایش Finglish"
                            >
                                <Globe className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => setShowPersian(!showPersian)}
                                className={`p-2 rounded-lg transition-colors border ${showPersian ? 'bg-teal-500/20 border-teal-500/50 text-teal-300' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/10'}`}
                                title="نمایش فارسی"
                            >
                                <Type className="w-5 h-5" />
                            </button>

                            <button
                                onClick={toggleFullscreen}
                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                title="تمام صفحه"
                            >
                                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <audio
                ref={audioRef}
                src={audioSrc}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onEnded={() => setIsPlaying(false)}
                onError={() => setAudioError(true)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />

            {/* Audio Error Message */}
            {audioError && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80">
                    <div className="text-center text-red-400">
                        <p className="text-xl mb-2">❌ خطا در بارگذاری فایل صوتی</p>
                        <p className="text-sm text-gray-400">{audioSrc}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

function formatTime(seconds: number) {
    if (!seconds) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}
