import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, AlertCircle, Info } from 'lucide-react';

// --- Types ---
export interface MobileVerse {
    verseNumber: number;
    text_fa: string;
    text_en: string;
    timing?: { start: number; end: number; words?: any[] };
}

export interface MobileChapter {
    number: number;
    verses: MobileVerse[];
    audioUrl?: string;
}

export interface AudioNote {
    usingFallback: boolean;
    originalTranslation: string;
    audioTranslation: string;
    message: { en: string; fa: string };
}

interface Props {
    chapter: MobileChapter;
    bookName: string;
    translation: string;
    onNextChapter: () => void;
    onPrevChapter: () => void;
    isPlaying: boolean;
    onPlayPause: () => void;
    onSettingsClick: () => void;
    fontSize?: number;
    viewMode: 'dual' | 'fa' | 'en';
    theme: 'dark' | 'light';
    hasAudio?: boolean;
    hasTiming?: boolean;
    audioNote?: AudioNote; // Info about fallback audio
}

const MobileBibleReader: React.FC<Props> = ({
    chapter,
    bookName,
    translation,
    onNextChapter,
    onPrevChapter,
    isPlaying,
    onPlayPause,
    fontSize = 1.2,
    viewMode,
    theme,
    hasAudio = false,
    hasTiming = false,
    audioNote
}) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const activeVerseRef = useRef<HTMLDivElement>(null);
    const [userScrolled, setUserScrolled] = useState(false);
    const [audioError, setAudioError] = useState(false);
    const [audioLoaded, setAudioLoaded] = useState(false); // 🔧 NEW: Track if audio actually loaded

    // Font size scaling className
    const getTextSizeClass = (size: number) => {
        if (size <= 1) return 'text-lg';
        if (size <= 1.2) return 'text-xl';
        if (size <= 1.4) return 'text-2xl';
        return 'text-3xl';
    };

    // Handle Audio Playback
    useEffect(() => {
        if (!audioRef.current) return;
        if (isPlaying) {
            setAudioError(false);
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Audio play failed", error);
                    // Don't set error immediately for auto-play blocks, but helpful for debugging
                });
            }
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, chapter.audioUrl]);

    // Handle Time Update
    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    // Find Active Verse - Only if hasTiming is true
    const activeVerseIndex = useMemo(() => {
        if (!hasTiming || !chapter.verses) return -1;
        return chapter.verses.findIndex(v =>
            v.timing && currentTime >= v.timing.start && currentTime < v.timing.end
        );
    }, [currentTime, chapter.verses, hasTiming]);

    // Debug Logging for Timeline Issues (reduced frequency)
    useEffect(() => {
        // 🔧 Only log every 5 seconds to reduce console spam
        if (isPlaying && currentTime > 0 && Math.floor(currentTime) % 5 === 0) {
            console.log('🎵 Audio Time:', currentTime.toFixed(2), '| Active Verse:', activeVerseIndex);
        }
    }, [Math.floor(currentTime / 5), activeVerseIndex, isPlaying]);

    // Auto-Scroll to Active Verse
    useEffect(() => {
        if (activeVerseIndex !== -1 && !userScrolled && activeVerseRef.current) {
            activeVerseRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [activeVerseIndex, userScrolled]);

    // Reset scroll lock on chapter change
    useEffect(() => {
        setUserScrolled(false);
        if (containerRef.current) containerRef.current.scrollTop = 0;
    }, [chapter]);

    // Detect user scroll to disable auto-scroll temporarily
    const handleScroll = () => {
        setUserScrolled(true);
    };

    return (
        <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-neutral-950 text-white' : 'bg-gray-50 text-gray-900'}`}>

            {/* Main Content */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto px-4 py-4 pb-72 touch-pan-y" // Increased bottom padding to clear player + nav
                onScroll={handleScroll}
            >
                {/* Chapter Title for Context */}
                <div className="text-center mb-8 opacity-50 text-sm font-serif">
                    {bookName} {chapter.number} • {translation}
                </div>

                <div className="space-y-6">
                    {chapter.verses.map((verse, idx) => {
                        const isActive = idx === activeVerseIndex;
                        return (
                            <div
                                key={verse.verseNumber}
                                ref={isActive ? activeVerseRef : null}
                                className={`
                                    relative pl-2 pr-4 py-4 rounded-2xl transition-all duration-300
                                    ${isActive
                                        ? (theme === 'dark' ? 'bg-yellow-900/20 shadow-lg ring-1 ring-yellow-500/30' : 'bg-yellow-50 shadow-md ring-1 ring-yellow-400')
                                        : ''}
                                `}
                            >
                                {/* Verse Number */}
                                <span className={`
                                    absolute right-2 top-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full
                                    ${isActive
                                        ? 'bg-yellow-500 text-black'
                                        : (theme === 'dark' ? 'bg-neutral-800 text-gray-500' : 'bg-gray-200 text-gray-500')}
                                `}>
                                    {verse.verseNumber}
                                </span>

                                <div className="space-y-3 mt-1">
                                    {/* FARSI TEXT */}
                                    {(viewMode === 'fa' || viewMode === 'dual') && (
                                        <p
                                            className={`
                                                leading-loose font-medium text-justify font-[B_Homa,system-ui]
                                                ${getTextSizeClass(fontSize)}
                                                ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}
                                            `}
                                            style={{ lineHeight: '2.4', direction: 'rtl' }}
                                        >
                                            {verse.text_fa}
                                        </p>
                                    )}

                                    {/* DIVIDER FOR DUAL MODE */}
                                    {viewMode === 'dual' && <div className={`h-px w-full ${theme === 'dark' ? 'bg-white/10' : 'bg-black/5'}`} />}

                                    {/* ENGLISH TEXT */}
                                    {(viewMode === 'en' || viewMode === 'dual') && (
                                        <p
                                            className={`
                                                leading-relaxed font-normal text-left
                                                ${fontSize > 1.2 ? 'text-xl' : 'text-lg'}
                                                ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}
                                            `}
                                            dir="ltr"
                                        >
                                            {verse.text_en}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Audio Element (Hidden) */}
            {chapter.audioUrl && (
                <audio
                    ref={audioRef}
                    src={chapter.audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onCanPlay={() => {
                        console.log('✅ Audio ready to play');
                        setAudioLoaded(true);
                        setAudioError(false);
                    }}
                    onError={(e) => {
                        console.error("❌ Audio error - file may not exist", e);
                        setAudioError(true);
                        setAudioLoaded(false);
                        // 🔧 Stop playing if audio fails
                        if (isPlaying) onPlayPause();
                    }}
                    onEnded={() => {
                        if (isPlaying) onPlayPause();
                    }}
                />
            )}

            {/* Audio Error Toast */}
            {audioError && isPlaying && (
                <div className="fixed bottom-36 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 z-[110] animate-in fade-in slide-in-from-bottom">
                    <AlertCircle size={16} />
                    <span className="text-xs font-bold">Audio unavailable</span>
                </div>
            )}

            {/* Audio Fallback Info Toast - Show when using fallback audio (always visible when audio available) */}
            {audioNote?.usingFallback && hasAudio && !audioError && (
                <div className="fixed bottom-36 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 z-[110] animate-in fade-in slide-in-from-bottom">
                    <Info size={16} />
                    <span className="text-xs font-medium" dir={viewMode === 'fa' ? 'rtl' : 'ltr'}>
                        {viewMode === 'fa' ? audioNote.message.fa : audioNote.message.en}
                    </span>
                </div>
            )}

            {/* Floating Layout Controls - Only show if audio is available AND loaded successfully */}
            {hasAudio && !audioError && (
                <div
                    id="bible-player-container"
                    className={`fixed bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-6 z-[200] pb-safe ${viewMode === 'fa' ? 'flex-row-reverse' : ''}`}
                >
                    {/* Previous Button - LEFT for LTR, RIGHT for RTL */}
                    <button
                        onClick={onPrevChapter}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-neutral-900/80 backdrop-blur border border-white/10 text-white hover:bg-neutral-800 shadow-lg active:scale-95 transition-all"
                        title={viewMode === 'fa' ? 'فصل قبل' : 'Previous Chapter'}
                    >
                        <SkipBack size={20} />
                    </button>

                    {/* Play/Pause Button - Prominent */}
                    <button
                        onClick={onPlayPause}
                        className={`
                        w-20 h-20 flex items-center justify-center rounded-full shadow-2xl
                        ${isPlaying
                                ? 'bg-red-500 text-white ring-4 ring-red-500/30'
                                : (theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white')}
                        active:scale-95 transition-transform hover:scale-105
                    `}
                    >
                        {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
                    </button>

                    {/* Next Button - RIGHT for LTR, LEFT for RTL */}
                    <button
                        onClick={onNextChapter}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-neutral-900/80 backdrop-blur border border-white/10 text-white hover:bg-neutral-800 shadow-lg active:scale-95 transition-all"
                        title={viewMode === 'fa' ? 'فصل بعد' : 'Next Chapter'}
                    >
                        <SkipForward size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default MobileBibleReader;
