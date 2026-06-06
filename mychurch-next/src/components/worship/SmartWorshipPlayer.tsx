import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, Maximize, Minimize, Globe, Type, SkipBack, SkipForward, X, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TranscriptData, LineSegment, SystemTimingV2 } from '@/types/worship-sync';

interface SmartWorshipPlayerProps {
    timingData: SystemTimingV2 | TranscriptData;
    audioSrc: string;
    backgroundImage?: string;
    title?: string;
    viewOnly?: boolean; // حالت فقط نمایش - بدون کنترل
    externalCurrentTime?: number; // زمان جاری از بیرون (برای سینک)
    externalIsPlaying?: boolean; // وضعیت پخش صوتی از بیرون (برای سینک کارائوکه)
    externalActiveLineIndex?: number; // خط فعال جاری از بیرون (برای ناوبری کیبوردی یا سینک بدون آدیو)
    onTimeUpdate?: (time: number, isPlaying: boolean) => void; // callback برای گزارش زمان به parent
    onClose?: () => void; // اختیاری - برای بستن پلیر از parent
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
    isTransparent?: boolean;
    theme?: 'parchment' | 'darkSlate';
    showPersian?: boolean;
    showFinglish?: boolean;
    showEnglish?: boolean;
}

export const getSafeAudioUrl = (url: string | undefined): string => {
    if (!url) return '';
    
    // If it's already an IONOS HiDrive URL, we must proxy it to avoid 401 Unauthorized
    if (url.includes('webdav.hidrive.ionos.com')) {
        // Prevent double prefixing if it's already proxied
        if (url.includes('/api/worship-audio?url=')) {
            return url;
        }
        return `/api/worship-audio?url=${encodeURIComponent(url)}`;
    }
    
    // Normalize: trim whitespace and strip any spaces/encoded-spaces right before .mp3
    // This acts as a safety net even if the DB still has a trailing space
    let normalized = url.trim().replace(/(?:\s|%20)+\.mp3$/i, '.mp3');
    
    // For local files, simply encode the URI properly
    return encodeURI(decodeURI(normalized));
};

// Normalize any format (flat array, legacy System V2, TranscriptData) into standard SystemTimingV2 format
export function normalizeTimingData(data: any): any {
    if (!data) return null;

    // Case 1: Standard SystemTimingV2 format
    if (data.version && Array.isArray(data.lines)) {
        return data;
    }

    // Case 2: TranscriptData format
    if (Array.isArray(data.lines) && !data.version) {
        return {
            songId: data.songId || 0,
            version: "2.0",
            totalDuration: data.totalDuration || 0,
            lines: data.lines.map((l: any) => ({
                line: l.content || l.line || '',
                start: l.start !== undefined ? l.start : (l.words?.[0]?.start_time || 0),
                end: l.end !== undefined ? l.end : (l.words?.[l.words.length - 1]?.end_time || 0),
                translations: l.translations || {},
                words: (l.words || []).map((w: any) => ({
                    word: w.word || '',
                    start: w.start !== undefined ? w.start : (w.start_time || 0),
                    end: w.end !== undefined ? w.end : (w.end_time || 0),
                    finglish: w.finglish || null,
                    english: w.english || null
                }))
            }))
        };
    }

    // Case 3: Flat array format (e.g. raw timing.json array)
    if (Array.isArray(data)) {
        return {
            songId: 0,
            version: "2.0",
            totalDuration: 0,
            lines: data.map((l: any) => ({
                line: l.content || l.line || '',
                start: l.start !== undefined ? l.start : (l.words?.[0]?.start_time || 0),
                end: l.end !== undefined ? l.end : (l.words?.[l.words.length - 1]?.end_time || 0),
                translations: l.translations || {
                    persian: l.translations?.persian || '',
                    english: l.translations?.english || '',
                    finglish: l.translations?.finglish || ''
                },
                words: (l.words || []).map((w: any) => ({
                    word: w.word || '',
                    start: w.start !== undefined ? w.start : (w.start_time || w.start || 0),
                    end: w.end !== undefined ? w.end : (w.end_time || w.end || 0),
                    finglish: w.finglish || null,
                    english: w.english || null
                }))
            }))
        };
    }

    return null;
}

export const SmartWorshipPlayer: React.FC<SmartWorshipPlayerProps> = ({
    timingData,
    audioSrc,
    backgroundImage = '/images/worship/worship-bg-default.jpg',
    viewOnly = false,
    externalCurrentTime,
    externalIsPlaying,
    externalActiveLineIndex,
    onTimeUpdate,
    onClose,
    translations,
    // Defaults
    backgroundOpacity = 60,
    backgroundBlur = 0,
    textShadow = true,
    objectFit = 'cover',
    isTransparent = false,
    theme = 'darkSlate',
    showPersian: initialShowPersian = true,
    showFinglish: initialShowFinglish = true,
    showEnglish: initialShowEnglish = false
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showPersian, setShowPersian] = useState(initialShowPersian);
    const [showFinglish, setShowFinglish] = useState(initialShowFinglish);
    const [showEnglish, setShowEnglish] = useState(initialShowEnglish);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [audioError, setAudioError] = useState(false);

    // Sync visibility settings if props change
    useEffect(() => {
        if (initialShowPersian !== undefined) setShowPersian(initialShowPersian);
    }, [initialShowPersian]);

    useEffect(() => {
        if (initialShowFinglish !== undefined) setShowFinglish(initialShowFinglish);
    }, [initialShowFinglish]);

    useEffect(() => {
        if (initialShowEnglish !== undefined) setShowEnglish(initialShowEnglish);
    }, [initialShowEnglish]);

    const activeItemRef = useRef<HTMLButtonElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const isParchment = theme === 'parchment' || 
                        backgroundImage?.includes('wavy') || 
                        backgroundImage?.includes('paper') || 
                        backgroundImage?.includes('fffef0');
    
    // For live timing correction - persistent per audio file
    const [syncDelay, setSyncDelay] = useState<number>(() => {
        if (typeof window === 'undefined') return 0;
        try {
            const saved = window.localStorage.getItem(`worship_sync_${encodeURIComponent(audioSrc.slice(-50))}`);
            return saved ? parseFloat(saved) : 0;
        } catch { return 0; }
    });

    useEffect(() => {
        if (typeof window !== 'undefined' && audioSrc) {
            window.localStorage.setItem(`worship_sync_${encodeURIComponent(audioSrc.slice(-50))}`, syncDelay.toString());
        }
    }, [syncDelay, audioSrc]);

    // Scroll to active item on line change
    useEffect(() => {
        if (activeItemRef.current) {
            activeItemRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }
    }, [currentTime]); // Trigger scroll when time changes (which dynamically shifts the active line index)

    // Handle sidebar line click to seek
    const handleLineClick = (index: number) => {
        if (viewOnly) return; 
        const line = lines[index];
        if (!line) return;
        const startTime = line.words[0]?.start_time || 0;
        
        if (audioRef.current) {
            audioRef.current.currentTime = startTime;
            setCurrentTime(startTime);
            if (onTimeUpdate) {
                onTimeUpdate(startTime, true);
            }
            if (!isPlaying) {
                audioRef.current.play();
                setIsPlaying(true);
            }
        }
    };

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

        const normalized = normalizeTimingData(timingData);
        if (normalized && Array.isArray(normalized.lines)) {
            console.log('✅ Normalized timing format, lines count:', normalized.lines.length);
            const converted: LineSegment[] = normalized.lines.map((l: any) => ({
                type: 'lyric',
                content: l.line,
                translations: l.translations,
                words: l.words.map((w: any) => ({
                    word: w.word,
                    start_time: w.start,
                    end_time: w.end,
                    finglish: w.finglish,
                    english: w.english
                }))
            }));
            setLines(converted);
            console.log('✅ Loaded lines:', converted.length);
        } else {
            console.log('⚠️ Failed to normalize timing data');
            setLines([]);
        }
    }, [timingData]);

    // Handle Translation retrieval
    const getTranslationForLine = (index: number, lang: 'finglish' | 'english' | 'persian') => {
        // 1. Check explicit translations prop
        if (translations?.[lang]?.[index]) {
            return translations[lang]![index];
        }

        // 2. Check Line array embedded translation (compatible with both V2 and TranscriptData thanks to normalization)
        const line = lines[index];
        if (line?.translations?.[lang]) {
            return line.translations[lang];
        }

        // 3. Fallback for legacy SystemV2 word-level finglish
        if (lang === 'finglish' && 'version' in timingData && timingData.lines[index]) {
            const words = timingData.lines[index].words;
            const finglishLine = words.map(w => w.finglish).filter(Boolean).join(' ');
            if (finglishLine.trim()) return finglishLine;
        }

        return null;
    };

    // Sync Loop - use externalCurrentTime if in viewOnly mode
    useEffect(() => {
        const timeToSet = viewOnly && externalCurrentTime !== undefined ? externalCurrentTime : (audioRef.current?.currentTime || 0);
        setCurrentTime(timeToSet);

        if (viewOnly) return; 

        const audio = audioRef.current;
        if (!audio) return;

        let animationFrameId: number | undefined;
        const loop = () => {
            const time = audio.currentTime;
            setCurrentTime(time);
            // گزارش زمان به parent برای سینک با Display
            if (onTimeUpdate) {
                onTimeUpdate(time, isPlaying);
            }
            if (!audio.paused && !audio.ended) {
                animationFrameId = requestAnimationFrame(loop);
            }
        };

        if (isPlaying) {
            loop();
        } else {
            if (onTimeUpdate) {
                onTimeUpdate(audio.currentTime, false);
            }
        }

        return () => {
            if (animationFrameId !== undefined) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isPlaying, onTimeUpdate, viewOnly, externalCurrentTime]);

    // Calculate effective time for highlighting
    const effectiveTime = Math.max(0, currentTime - syncDelay);

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
        // If we have an external active line index and we are NOT actively playing audio, use it!
        const isTimeBased = isPlaying || (viewOnly && (externalIsPlaying !== undefined ? externalIsPlaying : (externalCurrentTime !== undefined && externalCurrentTime > 0)));
        if (!isTimeBased && externalActiveLineIndex !== undefined) {
            return Math.min(externalActiveLineIndex, lines.length - 1);
        }

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
    }, [lines, currentTime, isPlaying, viewOnly, externalCurrentTime, externalActiveLineIndex]);

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

    const getFinglishWordsWithTimings = (idx: number, line: LineSegment) => {
        const finglishText = getTranslationForLine(idx, 'finglish');
        if (!finglishText) return [];

        const fingWords = finglishText.trim().split(/\s+/);
        const farsiWords = line.words || [];

        // Case 1: Word-level finglish is already embedded in the words
        const hasEmbeddedFinglish = farsiWords.some(w => w.finglish);
        if (hasEmbeddedFinglish) {
            return farsiWords.map(w => ({
                word: w.finglish || '',
                start_time: w.start_time,
                end_time: w.end_time
            }));
        }

        // Case 2: Word counts match exactly - pair them
        if (fingWords.length === farsiWords.length) {
            return fingWords.map((word, widx) => ({
                word,
                start_time: farsiWords[widx].start_time,
                end_time: farsiWords[widx].end_time
            }));
        }

        // Case 3: Fallback - distribute timing proportionally across the line
        const lineStart = farsiWords[0]?.start_time || 0;
        const lineEnd = farsiWords[farsiWords.length - 1]?.end_time || 0;
        const duration = lineEnd - lineStart;
        const wordDuration = duration / Math.max(1, fingWords.length);

        return fingWords.map((word, widx) => ({
            word,
            start_time: lineStart + widx * wordDuration,
            end_time: lineStart + (widx + 1) * wordDuration
        }));
    };

    const renderStaticLine = (idx: number) => {
        const line = lines[idx];
        if (!line) return null;

        const pText = line.content || line.words.map(w => w.word).join(' ');

        return (
            <div className="font-[Vazirmatn] text-center w-full">
                <p className={`font-bold text-xl lg:text-3xl leading-relaxed ${isParchment ? 'text-[#41290e]/80' : 'text-white/80'}`} dir="rtl">
                    {pText}
                </p>
            </div>
        );
    };

    const renderActiveLine = (idx: number) => {
        const line = lines[idx];
        if (!line) return null;

        const faText = getTranslationForLine(idx, 'persian');
        const fText = getTranslationForLine(idx, 'finglish');
        const eText = getTranslationForLine(idx, 'english');
        const fingWordsWithTimings = getFinglishWordsWithTimings(idx, line);

        return (
            <div className="space-y-3 lg:space-y-5 text-center w-full px-4">
                {/* Original Lyric Line (Head) - word by word */}
                <div className={`font-[Vazirmatn] font-black text-3xl lg:text-5xl drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] leading-relaxed ${isParchment ? 'text-[#41290e]' : 'text-white'}`} dir="rtl">
                    {line.words.map((word, wIdx) => {
                        const isActive = effectiveTime >= word.start_time && effectiveTime <= word.end_time;
                        const isPast = effectiveTime > word.end_time;
                        return (
                            <span
                                key={wIdx}
                                className={`inline-block mx-1 lg:mx-2 transition-all duration-200 ${isActive
                                    ? isParchment
                                        ? 'text-[#c27c13] scale-110 drop-shadow-[0_0_10px_rgba(194,124,19,0.4)] font-black'
                                        : 'text-cyan-300 scale-110 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] font-black'
                                    : isPast
                                        ? isParchment ? 'text-[#41290e]/75' : 'text-white/70'
                                        : isParchment ? 'text-[#41290e]/45' : 'text-white/50'
                                    }`}
                            >
                                {word.word}
                            </span>
                        );
                    })}
                </div>

                {/* Farsi Translation/Prose Meaning Line */}
                {showPersian && faText && faText !== line.content && (
                    <div className="animate-in fade-in slide-in-from-bottom-1 duration-700">
                        <p 
                            className={`font-[Vazirmatn] text-lg lg:text-2xl font-bold leading-relaxed opacity-95 ${isParchment ? 'text-[#5e4021]' : 'text-emerald-300'}`} 
                            dir="rtl"
                            style={{ textShadow: textShadow && !isParchment ? '0 2px 8px rgba(0,0,0,0.95), 0 0 15px rgba(16,185,129,0.3)' : undefined }}
                        >
                            {faText}
                        </p>
                    </div>
                )}

                {/* Finglish Line - word by word */}
                {showFinglish && fText && (
                    <div 
                        className={`font-mono text-xl lg:text-3xl font-black tracking-wider uppercase ${isParchment ? 'text-[#c27c13]' : 'text-teal-400'}`} 
                        dir="ltr"
                        style={{ textShadow: textShadow && !isParchment ? '0 2px 8px rgba(0,0,0,0.95), 0 0 15px rgba(20,184,166,0.4)' : undefined }}
                    >
                        {fingWordsWithTimings.map((wordObj, wIdx) => {
                            const isActive = effectiveTime >= wordObj.start_time && effectiveTime <= wordObj.end_time;
                            const isPast = effectiveTime > wordObj.end_time;
                            return (
                                <span
                                    key={wIdx}
                                    className={`inline-block mx-1 lg:mx-2 transition-all duration-200 ${isActive
                                        ? isParchment
                                            ? 'text-[#8a4d0f] scale-110 font-black'
                                            : 'text-yellow-300 scale-110 drop-shadow-[0_0_12px_rgba(253,224,71,0.7)] font-black'
                                        : isPast
                                            ? isParchment ? 'text-[#c27c13]/70' : 'text-teal-400/60'
                                            : isParchment ? 'text-[#c27c13]/40' : 'text-teal-400/40'
                                        }`}
                                >
                                    {wordObj.word}
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* English Line - line level highlight */}
                {showEnglish && eText && (
                    <div className="animate-in fade-in slide-in-from-bottom-1 duration-700">
                        <p 
                            className={`font-sans text-lg lg:text-2xl font-bold tracking-wide italic opacity-95 ${isParchment ? 'text-[#5e4021]' : 'text-indigo-300'}`} 
                            dir="ltr"
                            style={{ textShadow: textShadow && !isParchment ? '0 2px 8px rgba(0,0,0,0.95), 0 0 15px rgba(99,102,241,0.3)' : undefined }}
                        >
                            {eText}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    const isGradientBg = backgroundImage && (backgroundImage.startsWith('from-') || backgroundImage.includes('gradient') || backgroundImage.includes('via-') || backgroundImage.includes('to-'));

    return (
        <div
            ref={containerRef}
            dir="rtl"
            onContextMenu={(e) => e.preventDefault()}
            className={`relative overflow-hidden text-white font-sans select-none ${isFullscreen ? 'h-screen w-screen' : 'w-full aspect-video rounded-2xl shadow-2xl'} ${isTransparent ? 'bg-transparent' : isParchment ? 'bg-[#fffef0]' : 'bg-black'}`}
            style={{ WebkitUserSelect: "none", MozUserSelect: "none", msUserSelect: "none", userSelect: "none" }}
        >
            {/* Background - with fallback gradient */}
            {!isTransparent && (
                <div className="absolute inset-0 z-0 pointer-events-none">
                    {isParchment ? (
                        <div className="absolute inset-0 overflow-hidden bg-[#fffef0]">
                            {renderWavyPaperFilter('wavyWorshipBg', 12, 2)}
                            <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(0,0,0,0.03)_1px,transparent_1px)] [background-size:4px_4px]" />
                        </div>
                    ) : (
                        <>
                            {isGradientBg ? (
                                <div 
                                    className={`absolute inset-0 bg-gradient-to-br ${backgroundImage}`}
                                    style={{
                                        opacity: backgroundOpacity / 100,
                                        filter: `blur(${backgroundBlur}px)`
                                    }}
                                />
                            ) : (
                                <>
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
                                </>
                            )}
                            {/* Standard overlay for readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60" />
                        </>
                    )}
                </div>
            )}

            {/* Content Layer (Split Layout) */}
            <div 
                className="absolute inset-0 z-10 flex flex-row overflow-hidden"
                style={{ 
                    direction: 'ltr',
                    bottom: viewOnly ? 0 : '140px' 
                }}
            >
                {/* Left Side: Main Active Lyric View (100% width if viewOnly, otherwise 78% width) */}
                <div 
                    className={`${viewOnly ? 'w-full px-8 lg:px-20' : 'w-[78%] p-6 lg:p-12'} h-full flex flex-col items-center justify-center relative overflow-hidden`} 
                    style={{ direction: 'rtl' }}
                >
                    <AnimatePresence mode='wait'>
                        {lines.length > 0 && displayLineIndex < lines.length && (
                            <div className="flex flex-col items-center justify-center gap-6 lg:gap-10 w-full">
                                {/* Previous Line */}
                                {displayLineIndex > 0 ? (
                                    <div className="opacity-25 scale-90 blur-[0.5px] transition-all duration-300 text-center select-none pointer-events-none w-full">
                                        {renderStaticLine(displayLineIndex - 1)}
                                    </div>
                                ) : (
                                    <div className="h-10 opacity-0" />
                                )}

                                {/* Current Line */}
                                <motion.div
                                    key={displayLineIndex}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.35, ease: 'easeOut' }}
                                    className={`w-full text-center ${textShadow ? 'drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)] drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]' : ''}`}
                                >
                                    {renderActiveLine(displayLineIndex)}
                                </motion.div>

                                {/* Next Line */}
                                {displayLineIndex < lines.length - 1 ? (
                                    <div className="opacity-50 scale-95 transition-all duration-300 text-center select-none pointer-events-none w-full">
                                        {renderStaticLine(displayLineIndex + 1)}
                                    </div>
                                ) : (
                                    <div className="h-10 opacity-0" />
                                )}
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Side: Scrollable Sidebar Lyrics List (22% width) - ONLY if not viewOnly */}
                {!viewOnly && (
                    <div 
                        ref={sidebarRef}
                        className={`w-[22%] h-full shrink-0 flex flex-col overflow-hidden border-l relative ${
                            isParchment 
                                ? 'bg-[#8a4d0f]/5 border-[#8a4d0f]/20 bg-[#fffef0]/95 shadow-[inset_0_0_20px_rgba(138,77,15,0.08)]' 
                                : isTransparent
                                    ? 'bg-black/40 border-white/10 backdrop-blur-md'
                                    : 'bg-slate-950/40 border-white/10 backdrop-blur-md'
                        }`} 
                        style={{ 
                            direction: 'rtl',
                            filter: isParchment ? 'url(#wavyWorshipBg)' : 'none'
                        }}
                    >
                        {/* Sidebar Header */}
                        <div className={`p-4 text-right shrink-0 border-b ${isParchment ? 'border-[#8a4d0f]/15' : 'border-white/10'}`} dir="rtl">
                            <h4 className={`font-bold text-[1.2rem] font-[Vazirmatn] ${isParchment ? 'text-[#41290e]' : 'text-indigo-300'}`}>لیست خطوط سرود</h4>
                            <p className={`text-[0.85rem] mt-0.5 font-[Vazirmatn] ${isParchment ? 'text-[#8a4d0f]' : 'text-slate-400'}`}>
                                جهت پخش روی خط کلیک کنید
                            </p>
                        </div>

                    {/* Scrollable Lines List */}
                    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                        {lines.map((line, idx) => {
                            const isActive = displayLineIndex === idx;
                            const pText = getTranslationForLine(idx, 'persian') || line.content || line.words.map(w => w.word).join(' ');
                            const fText = getTranslationForLine(idx, 'finglish');
                            const eText = getTranslationForLine(idx, 'english');
                            
                            return (
                                <button
                                    key={idx}
                                    ref={isActive ? activeItemRef : null}
                                    type="button"
                                    onClick={() => handleLineClick(idx)}
                                    title={viewOnly ? 'خط فعال' : 'کلیک برای پرش به این زمان'}
                                    className={`w-full text-right p-3 transition-all rounded-xl border flex flex-col gap-1 text-right items-stretch ${
                                        isActive 
                                            ? isParchment
                                                ? 'bg-[#8a4d0f]/15 border-amber-600 shadow-[0_0_12px_rgba(217,119,6,0.3)]'
                                                : 'bg-amber-500/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.35)]' 
                                            : isParchment 
                                                ? 'bg-white/60 border-[#8a4d0f]/15 hover:bg-[#8a4d0f]/10 text-[#41290e]' 
                                                : 'bg-slate-900/40 border-slate-800/60 hover:bg-white/5 text-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full gap-2" dir="rtl">
                                        <span className={`font-bold text-sm lg:text-base font-[Vazirmatn] flex items-center gap-1.5 ${
                                            isActive 
                                                ? isParchment ? 'text-amber-700' : 'text-amber-400' 
                                                : isParchment 
                                                    ? 'text-[#41290e]' 
                                                    : 'text-white'
                                        }`}>
                                            {isActive && <span className="w-2 h-2 bg-amber-400 rounded-full shrink-0" />}
                                            <span className="leading-snug text-right w-full">{pText}</span>
                                        </span>
                                    </div>
                                    {fText && (
                                        <div className={`text-[0.75rem] font-mono tracking-wider truncate text-left w-full ${isActive ? (isParchment ? 'text-amber-800' : 'text-teal-300') : isParchment ? 'text-[#8a4d0f]' : 'text-teal-400'}`} dir="ltr">
                                            {fText}
                                        </div>
                                    )}
                                    {eText && (
                                        <div className={`text-[0.72rem] font-sans italic truncate text-left w-full ${isActive ? (isParchment ? 'text-amber-900/80' : 'text-indigo-300') : isParchment ? 'text-[#5e4021]' : 'text-slate-400'}`} dir="ltr">
                                            {eText}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
                )}
            </div>

            {/* Controls Layer - Hidden in viewOnly mode */}
            {!viewOnly && (
                <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 lg:p-6" dir="ltr">
                    {/* Progress Bar */}
                    <div
                        className="w-full h-2 bg-slate-700/60 rounded-full mb-4 cursor-pointer overflow-hidden group shadow-inner"
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const pos = (e.clientX - rect.left) / rect.width;
                            if (audioRef.current && duration) audioRef.current.currentTime = pos * duration;
                        }}
                    >
                        <div
                            className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-500 rounded-full transition-all duration-100 shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                        />
                    </div>

                    <div className="flex flex-col gap-3 p-4 pb-6 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
                        {/* Row 1: Seek Bar */}
                        <div className="flex items-center gap-3 w-full group/seek">
                            <span className="text-[10px] font-mono text-slate-400 w-10 text-left tabular-nums">{formatTime(currentTime)}</span>
                            <div className="relative flex-1 h-1.5 flex items-center">
                                <input
                                    type="range"
                                    min={0}
                                    max={duration || 100}
                                    step={0.1}
                                    value={currentTime}
                                    onChange={(e) => {
                                        const time = parseFloat(e.target.value);
                                        if (audioRef.current) audioRef.current.currentTime = time;
                                        setCurrentTime(time);
                                    }}
                                    className="absolute inset-0 w-full h-full appearance-none bg-white/10 rounded-full cursor-pointer overflow-hidden accent-teal-500 hover:accent-teal-400 group-hover/seek:h-2 transition-all outline-none"
                                    title="تغییر زمان پخش"
                                />
                                <div 
                                    className="absolute left-0 top-0 bottom-0 bg-teal-500 rounded-l-full pointer-events-none group-hover/seek:bg-teal-400"
                                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 w-10 text-right tabular-nums">{formatTime(duration)}</span>
                        </div>

                        {/* Row 2: Controls */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 lg:gap-4">
                                {/* Skip Back */}
                                <button
                                    onClick={() => skip(-10)}
                                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                    title="10 ثانیه عقب"
                                >
                                    <SkipBack className="w-5 h-5" />
                                </button>

                                {/* Play/Pause */}
                                <button
                                    onClick={togglePlay}
                                    className="w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full bg-teal-500 hover:bg-teal-400 text-black transition-transform hover:scale-105 shadow-lg shadow-teal-500/30"
                                    title={isPlaying ? "توقف" : "پخش"}
                                >
                                    {isPlaying ? <Pause className="w-6 h-6 lg:w-7 lg:h-7 fill-current" /> : <Play className="w-6 h-6 lg:w-7 lg:h-7 fill-current ml-1" />}
                                </button>

                                {/* Skip Forward */}
                                <button
                                    onClick={() => skip(10)}
                                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                    title="10 ثانیه جلو"
                                >
                                    <SkipForward className="w-5 h-5" />
                                </button>

                                {/* Sync Offset Controls */}
                                <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 ml-4 font-mono text-xs">
                                    <button onClick={() => setSyncDelay(d => d - 0.1)} className="hover:text-teal-400" title="تأخیر کمتر">-0.1s</button>
                                    <span className={syncDelay !== 0 ? 'text-yellow-400' : 'text-gray-400'}>{syncDelay.toFixed(1)}s</span>
                                    <button onClick={() => setSyncDelay(d => d + 0.1)} className="hover:text-teal-400" title="تأخیر بیشتر">+0.1s</button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 lg:gap-3">
                                {/* Volume Control */}
                                <div className="flex items-center gap-2 mr-4 group/vol">
                                    <button 
                                        onClick={() => setIsMuted(!isMuted)}
                                        className="p-2 text-slate-400 hover:text-white transition-colors"
                                        title={isMuted ? "وصل صدا" : "قطع صدا"}
                                    >
                                        {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                                    </button>
                                    <div className="w-0 group-hover/vol:w-24 overflow-hidden transition-all duration-300 flex items-center h-6">
                                        <input 
                                            type="range"
                                            min={0}
                                            max={1}
                                            step={0.01}
                                            value={isMuted ? 0 : volume}
                                            onChange={(e) => {
                                                const v = parseFloat(e.target.value);
                                                setVolume(v);
                                                if (audioRef.current) audioRef.current.volume = v;
                                                if (v > 0) setIsMuted(false);
                                            }}
                                            className="w-full h-1 appearance-none bg-white/20 rounded-full cursor-pointer accent-teal-500"
                                            title="میزان صدا"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowPersian(!showPersian)}
                                    className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors border font-bold text-sm ${showPersian ? 'bg-teal-500/20 border-teal-500/50 text-teal-300' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/10'}`}
                                    title="نمایش متن اصلی (فارسی)"
                                >
                                    FA
                                </button>

                                <button
                                    onClick={() => setShowFinglish(!showFinglish)}
                                    className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors border font-bold text-sm ${showFinglish ? 'bg-teal-500/20 border-teal-500/50 text-teal-300' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/10'}`}
                                    title="نمایش فینگلیش"
                                >
                                    FN
                                </button>

                                <button
                                    onClick={() => setShowEnglish(!showEnglish)}
                                    className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors border font-bold text-sm ${showEnglish ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/10'}`}
                                    title="نمایش ترجمه انگلیسی"
                                >
                                    EN
                                </button>

                                <div className="w-px h-6 bg-gray-700 mx-1"></div>

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
                </div>
            )}

            <audio
                ref={audioRef}
                src={getSafeAudioUrl(audioSrc)}
                onLoadedMetadata={(e) => {
                    setDuration(e.currentTarget.duration);
                    e.currentTarget.volume = volume;
                }}
                onEnded={() => setIsPlaying(false)}
                onError={() => setAudioError(true)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                muted={isMuted}
            />

            {/* Audio Error Message */}
            {audioError && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                    {onClose && (
                        <button
                            onClick={onClose}
                            title="بستن"
                            className="absolute top-4 right-4 z-[60] p-3 bg-white/10 hover:bg-white/20 hover:text-red-400 text-white rounded-full transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    )}
                    <div className="text-center text-red-400 relative z-[50]">
                        <p className="text-xl mb-2 flex items-center justify-center gap-2">
                            <AlertCircle className="w-6 h-6" /> خطا در بارگذاری فایل صوتی
                        </p>
                        <p className="text-sm opacity-80 mb-4 truncate max-w-sm mx-auto" dir="ltr">{getSafeAudioUrl(audioSrc)}</p>
                        <button
                            onClick={() => setAudioError(false)}
                            className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                        >
                            رد شدن
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const renderWavyPaperFilter = (id: string, scale: number, seed: number) => (
    <svg className="absolute w-0 h-0" aria-hidden="true" focusable="false">
        <filter id={id}>
            <feTurbulence x="0" y="0" baseFrequency="0.02" numOctaves="5" seed={seed} />
            <feDisplacementMap in="SourceGraphic" scale={scale} />
        </filter>
    </svg>
);

export default SmartWorshipPlayer;

function formatTime(seconds: number) {
    if (!seconds) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}
