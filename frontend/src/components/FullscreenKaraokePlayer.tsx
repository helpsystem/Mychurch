/**
 * FullscreenKaraokePlayer
 * 
 * A fullscreen lyrics display component that syncs with the global AudioPlayerContext.
 * This replaces LocalAudioPlayerWithSyncedLyrics for karaoke mode, ensuring:
 * - Audio continues when modal opens (no restart)
 * - Lyrics sync with global player
 * - Fullscreen display without size limits
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, X, Settings, Music, ChevronDown, Layout, Palette, Languages } from 'lucide-react';
import { useAudioPlayer, Song } from '../contexts/AudioPlayerContext';
import { AmllLyricPlayer } from './AmllLyricPlayer';
import { AmllBackground } from './AmllBackground';
import { convertToAmllFormat, hasFinglishSupport, type OurTimingData } from '../utils/amllConverter';
import { CollapsibleSection, AttachmentList } from './CollapsibleSection';

// AMLL Mode type
type LyricsViewMode = 'classic' | 'amll';

// Helper functions for mode persistence
const getStoredViewMode = (): LyricsViewMode => {
    const stored = localStorage.getItem('karaokeViewMode');
    return (stored === 'amll' || stored === 'classic') ? stored : 'classic';
};

const saveViewMode = (mode: LyricsViewMode) => {
    localStorage.setItem('karaokeViewMode', mode);
};
import type { KaraokeLayoutMode } from '../types/karaokeLayouts';
import { getStoredLayoutMode, saveLayoutMode, LAYOUT_MODES } from '../types/karaokeLayouts';

interface LyricLine {
    time: number;
    text: string;
    words?: Array<{ word: string; finglish?: string; start: number; end: number }>;
}

interface Props {
    songId?: number | string;
    lyrics?: string;
    originalLyricsWithChords?: string;
    title?: string;
    artist?: string;
    audioUrl?: string;
    lang?: 'fa' | 'en';
    notes?: string;  // ✅ NEW
    description?: string;  // ✅ NEW
    attachments?: Array<{  // ✅ NEW
        name: string;
        url: string;
        size?: string;
        type?: string;
    }>;
    onClose: () => void;
}

const FullscreenKaraokePlayer: React.FC<Props> = ({
    songId,
    lyrics,
    originalLyricsWithChords,
    title,
    artist,
    audioUrl,
    lang = 'fa',
    notes,
    description,
    attachments,
    onClose
}) => {
    // Global Audio Player
    const {
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        playSong,
        pauseSong,
        resumeSong,
        seekTo,
        setVolume,
        toggleMute,
        playNext,
        playPrevious
    } = useAudioPlayer();

    const lyricsContainerRef = useRef<HTMLDivElement>(null);
    const [fetchedLyricLines, setFetchedLyricLines] = useState<LyricLine[] | null>(null);
    const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [syncAdjustment, setSyncAdjustment] = useState(0);
    const [showSyncControls, setShowSyncControls] = useState(false);
    const [showFinglish, setShowFinglish] = useState(true); // Toggle for Finglish display (default ON)
    const [showChords, setShowChords] = useState(false); // Toggle for chords section
    const [layoutMode, setLayoutMode] = useState<KaraokeLayoutMode>(getStoredLayoutMode());
    const [showLayoutSelector, setShowLayoutSelector] = useState(false);
    
    // 🎨 Appearance Settings (from audio-text-sync v2.1)
    const [showAppearance, setShowAppearance] = useState(false);
    const [wordHighlightColor, setWordHighlightColor] = useState(() => localStorage.getItem('karaoke_wordColor') || '#fde047'); // yellow-300
    const [lineHighlightColor, setLineHighlightColor] = useState(() => localStorage.getItem('karaoke_lineColor') || '#581c87'); // purple-900
    
    // 🌐 Translation State
    const [showTranslation, setShowTranslation] = useState(false);
    const [translatedText, setTranslatedText] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translationLang, setTranslationLang] = useState<'persian' | 'english' | 'finglish'>('english');
    const [showBackground, setShowBackground] = useState(false); // AMLL dynamic background
    const [timingData, setTimingData] = useState<OurTimingData | null>(null);
    const [viewMode, setViewMode] = useState<LyricsViewMode>(getStoredViewMode()); // Classic vs AMLL

    // If no song is playing but we have audioUrl, start playing
    useEffect(() => {
        if (!currentSong && audioUrl && title) {
            playSong({
                id: songId || Date.now(),
                title: title,
                artist: artist,
                audioUrl: audioUrl,
            });
        }
    }, [currentSong, audioUrl, title, artist, songId, playSong]);

    // Load timing data from cache or server
    useEffect(() => {
        if (!songId) return;

        const loadTiming = async () => {
            const cacheKey = `timing_cache_${songId}`;
            const cachedData = localStorage.getItem(cacheKey);

            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    setTimingData(parsed); // Store full timing data for AMLL
                    if (parsed.lines) {
                        const mappedLines = parsed.lines.map((l: any) => ({
                            time: l.start,
                            text: l.line || l.text || l.content,
                            words: l.words
                        }));
                        setFetchedLyricLines(mappedLines);
                        return;
                    }
                } catch (e) {
                    console.error('Error parsing cached timing:', e);
                    localStorage.removeItem(cacheKey);
                }
            }

            // Fetch from server
            try {
                const response = await fetch(`/worship/data/timings/song_${songId}_timing.json`);
                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem(cacheKey, JSON.stringify(data));
                    setTimingData(data); // Store full timing data for AMLL

                    if (data.lines) {
                        const mappedLines = data.lines.map((l: any) => ({
                            time: l.start,
                            text: l.line || l.text || l.content,
                            words: l.words
                        }));
                        setFetchedLyricLines(mappedLines);
                    }
                }
            } catch (error) {
                console.error('Error fetching timing:', error);
            }
        };

        loadTiming();
    }, [songId]);

    // Process lyrics into lines
    const processedLyrics: LyricLine[] = React.useMemo(() => {
        if (fetchedLyricLines && fetchedLyricLines.length > 0) {
            return fetchedLyricLines.filter(line => {
                if (!line.text) return false;
                const trimmed = line.text.trim();
                // Filter out marker lines
                return !/^(V\d+|Chorus\d*|Pre-Chorus\d*|Bridge\d*|Intro|Outro|Verse\s*\d*|Tag|Ending|Coda|Instrumental|Interlude|\[column\]|\[repeat\])(\s*\(x\d+\))?$/i.test(trimmed);
            });
        }

        if (!lyrics) return [];

        // Clean lyrics and split into lines
        let cleanLyrics = lyrics
            .replace(/\[([A-G][#b]?m?\d?[\/]?[A-G]?[#b]?)\]/g, '')
            .replace(/\[(column|repeat|instrumental|interlude|solo|tag|ending|coda)\]/gi, '')
            .replace(/^(V\d+|Chorus\d*|Pre-Chorus\d*|Bridge\d*|Intro|Outro|Verse\s*\d*|Tag|Ending|Coda|Instrumental|Interlude|Music)\s*(\(x\d+\))?$/gim, '');

        const lines = cleanLyrics.split('\n').filter(line => {
            const trimmed = line.trim();
            if (!trimmed) return false;
            if (/^[A-G#bm\/\s\d\[\]]+$/.test(trimmed)) return false;
            return true;
        });

        // Create approximate timing (3 seconds per line)
        return lines.map((line, index) => ({
            time: index * 3 + syncAdjustment,
            text: line.trim()
        }));
    }, [lyrics, fetchedLyricLines, syncAdjustment]);

    // Strip chords from text
    const stripChords = (text: string): string => {
        if (!text) return '';
        return text
            .replace(/\[([A-G][#b]?m?\d?[\/]?[A-G]?[#b]?)\]/g, '')
            .replace(/\[(column|repeat|instrumental|interlude|solo|tag|ending|coda)\]/gi, '')
            .trim();
    };

    // Handle layout mode change
    const changeLayoutMode = (mode: KaraokeLayoutMode) => {
        setLayoutMode(mode);
        saveLayoutMode(mode);
        setShowLayoutSelector(false);
    };

    // Handle view mode change (Classic vs AMLL)
    const changeViewMode = (mode: LyricsViewMode) => {
        setViewMode(mode);
        saveViewMode(mode);
        console.log('🎭 View mode changed to:', mode);
    };

    // 🎨 Save appearance settings to localStorage
    useEffect(() => {
        localStorage.setItem('karaoke_wordColor', wordHighlightColor);
        localStorage.setItem('karaoke_lineColor', lineHighlightColor);
    }, [wordHighlightColor, lineHighlightColor]);

    // 🌐 Translation function using Gemini API
    const handleTranslate = async (target: 'persian' | 'english' | 'finglish') => {
        const fullText = processedLyrics.map(l => l.text).join('\n');
        if (!fullText) return;
        
        setIsTranslating(true);
        setTranslationLang(target);
        setShowTranslation(true);
        
        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: fullText,
                    targetLanguage: target,
                    type: 'lyrics'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                setTranslatedText(data.translation || data.text);
            } else {
                console.error('Translation failed');
                setTranslatedText(null);
            }
        } catch (error) {
            console.error('Translation error:', error);
            setTranslatedText(null);
        } finally {
            setIsTranslating(false);
        }
    };

    // Convert to AMLL format
    const amllLyricLines = useMemo(() => {
        if (!timingData) return [];
        return convertToAmllFormat(timingData);
    }, [timingData]);

    // Check if Finglish is available
    const hasFinglish = useMemo(() => {
        if (!timingData) return false;
        return hasFinglishSupport(timingData);
    }, [timingData]);

    // Track current lyric line
    useEffect(() => {
        if (processedLyrics.length === 0) return;

        let activeIndex = -1;
        for (let i = 0; i < processedLyrics.length; i++) {
            if (processedLyrics[i].time <= currentTime + syncAdjustment) {
                activeIndex = i;
            } else {
                break;
            }
        }

        if (activeIndex !== currentLyricIndex) {
            setCurrentLyricIndex(activeIndex);

            // Auto-scroll to active line
            if (lyricsContainerRef.current && activeIndex >= 0) {
                const activeElement = lyricsContainerRef.current.querySelector(`[data-line="${activeIndex}"]`) as HTMLElement;
                if (activeElement) {
                    activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    }, [currentTime, processedLyrics, currentLyricIndex, syncAdjustment]);

    // Track current word
    useEffect(() => {
        if (processedLyrics.length === 0) return;

        const currentLine = processedLyrics[currentLyricIndex];
        if (!currentLine?.words || currentLine.words.length === 0) {
            setCurrentWordIndex(-1);
            return;
        }

        let activeWordIndex = -1;
        for (let i = 0; i < currentLine.words.length; i++) {
            const word = currentLine.words[i];
            if (currentTime >= word.start + syncAdjustment && currentTime < word.end + syncAdjustment) {
                activeWordIndex = i;
                break;
            }
        }

        setCurrentWordIndex(activeWordIndex);
    }, [currentTime, processedLyrics, currentLyricIndex, syncAdjustment]);

    // Format time display
    const formatTime = (time: number): string => {
        if (!isFinite(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Toggle play/pause
    const togglePlay = () => {
        if (isPlaying) {
            pauseSong();
        } else {
            resumeSong();
        }
    };

    // Skip forward/backward
    const skip = (seconds: number) => {
        const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
        seekTo(newTime);
    };

    // === NEW CODE VERSION 2026-01-18-PORTAL-FIX ===
    console.log('🎤🎤🎤 PORTAL VERSION 2026-01-18 LOADED!');
    console.log('🎤 createPortal to document.body:', !!document.body);

    // IMPORTANT: This renders directly to document.body via Portal
    // to escape the parent component's height restrictions

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-[99999] bg-black flex flex-col"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 99999
            }}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                title={lang === 'fa' ? 'بستن' : 'Close'}
            >
                <X size={24} className="text-white" />
            </button>

            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900/80 via-blue-900/80 to-purple-900/80 p-6 text-center border-b border-purple-500/30">
                {title && (
                    <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                        {title}
                    </h2>
                )}
                {artist && (
                    <p className="text-gray-300 text-lg flex items-center justify-center gap-2">
                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                        {artist}
                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                    </p>
                )}
            </div>

            {/* Lyrics Display */}
            <div
                ref={lyricsContainerRef}
                className="flex-1 overflow-y-auto p-8 bg-gradient-to-b from-black via-purple-900/10 to-black"
            >
                <div className="max-w-6xl mx-auto py-8 space-y-6">
                    {processedLyrics.length === 0 ? (
                        <div className="text-gray-400 text-xl text-center" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                            {lang === 'fa' ? 'متن زنده در دسترس نیست' : 'Live lyrics not available'}
                        </div>
                    ) : showFinglish ? (
                        /* DUAL-COLUMN LAYOUT: Finglish LEFT | Persian RIGHT */
                        processedLyrics.map((line, lineIndex) => {
                            const lineWords = line.words && line.words.length > 0
                                ? line.words.map(w => ({ word: stripChords(w.word), finglish: w.finglish })).filter(w => w.word.trim().length > 0)
                                : stripChords(line.text).split(/\s+/).filter(w => w.trim().length > 0).map(w => ({ word: w, finglish: undefined }));

                            if (lineWords.length === 0) return null;

                            const isActiveLine = lineIndex === currentLyricIndex;

                            return (
                                <div
                                    key={lineIndex}
                                    data-line={lineIndex}
                                    className={`grid grid-cols-2 gap-8 transition-all duration-500 cursor-pointer px-4 py-3 rounded-lg ${lineIndex < currentLyricIndex
                                        ? 'opacity-40 scale-95'
                                        : lineIndex > currentLyricIndex
                                            ? 'opacity-60 scale-95'
                                            : 'scale-100'
                                        }`}
                                    style={{
                                        backgroundColor: isActiveLine ? `${lineHighlightColor}40` : 'transparent',
                                        boxShadow: isActiveLine ? `0 0 30px ${lineHighlightColor}30` : 'none'
                                    }}
                                    onClick={() => seekTo(line.time)}
                                >
                                    {/* LEFT COLUMN: Finglish */}
                                    <div dir="ltr" className="text-left border-r border-purple-500/20 pr-4">
                                        <p className={`text-2xl leading-relaxed font-light tracking-wide ${lineIndex < currentLyricIndex
                                            ? 'text-cyan-600/40'
                                            : lineIndex > currentLyricIndex
                                                ? 'text-cyan-400/60'
                                                : 'text-cyan-300'
                                            }`}>
                                            {lineWords.map((wordObj, wordIndex) => {
                                                const isActiveWord = isActiveLine && line.words && line.words.length > 0 && wordIndex === currentWordIndex;
                                                return (
                                                    <span
                                                        key={`finglish-${lineIndex}-${wordIndex}`}
                                                        className={`inline-block mx-1.5 transition-all duration-300 ${isActiveWord
                                                            ? 'font-extrabold'
                                                            : isActiveLine
                                                                ? 'font-normal'
                                                                : ''
                                                            }`}
                                                        style={{
                                                            color: isActiveWord ? wordHighlightColor : undefined,
                                                            transform: isActiveWord ? 'scale(1.25) translateY(-2px)' : 'scale(1)',
                                                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                            textShadow: isActiveWord ? `0 0 25px ${wordHighlightColor}cc, 0 0 50px ${wordHighlightColor}66` : 'none',
                                                            filter: isActiveWord ? `drop-shadow(0 0 10px ${wordHighlightColor})` : 'none'
                                                        }}
                                                    >
                                                        {wordObj.finglish || wordObj.word}
                                                    </span>
                                                );
                                            })}
                                        </p>
                                    </div>

                                    {/* RIGHT COLUMN: Persian */}
                                    <div dir="rtl" className="text-right pl-4">
                                        <p className={`text-3xl leading-relaxed font-medium ${lineIndex < currentLyricIndex
                                            ? 'text-gray-600'
                                            : lineIndex > currentLyricIndex
                                                ? 'text-gray-400'
                                                : 'text-gray-100'
                                            }`}>
                                            {lineWords.map((wordObj, wordIndex) => {
                                                const isActiveWord = isActiveLine && line.words && line.words.length > 0 && wordIndex === currentWordIndex;
                                                return (
                                                    <span
                                                        key={`persian-${lineIndex}-${wordIndex}`}
                                                        className={`inline-block mx-1.5 transition-all duration-300 ${isActiveWord
                                                            ? 'font-extrabold'
                                                            : isActiveLine
                                                                ? 'text-white font-semibold'
                                                                : ''
                                                            }`}
                                                        style={{
                                                            color: isActiveWord ? wordHighlightColor : undefined,
                                                            transform: isActiveWord ? 'scale(1.5) translateY(-4px)' : 'scale(1)',
                                                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                            textShadow: isActiveWord ? `0 0 30px ${wordHighlightColor}cc, 0 0 60px ${wordHighlightColor}66` : 'none',
                                                            filter: isActiveWord ? `drop-shadow(0 0 15px ${wordHighlightColor})` : 'none'
                                                        }}
                                                    >
                                                        {wordObj.word}
                                                    </span>
                                                );
                                            })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        /* SINGLE-COLUMN LAYOUT: Persian only (when Finglish is OFF) */
                        <div className="text-center space-y-6" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                            {processedLyrics.map((line, lineIndex) => {
                                const lineWords = line.words && line.words.length > 0
                                    ? line.words.map(w => ({ word: stripChords(w.word), finglish: w.finglish })).filter(w => w.word.trim().length > 0)
                                    : stripChords(line.text).split(/\s+/).filter(w => w.trim().length > 0).map(w => ({ word: w, finglish: undefined }));

                                if (lineWords.length === 0) return null;

                                const isActiveLine = lineIndex === currentLyricIndex;

                                return (
                                    <div
                                        key={lineIndex}
                                        data-line={lineIndex}
                                        className={`transition-all duration-500 cursor-pointer px-4 py-3 rounded-lg ${lineIndex < currentLyricIndex
                                            ? 'opacity-40 scale-95'
                                            : lineIndex > currentLyricIndex
                                                ? 'opacity-60 scale-95'
                                                : 'scale-100'
                                            }`}
                                        style={{
                                            backgroundColor: isActiveLine ? `${lineHighlightColor}40` : 'transparent',
                                            boxShadow: isActiveLine ? `0 0 30px ${lineHighlightColor}30` : 'none'
                                        }}
                                        onClick={() => seekTo(line.time)}
                                    >
                                        <p className={`text-3xl leading-relaxed font-medium ${lineIndex < currentLyricIndex
                                            ? 'text-gray-600'
                                            : lineIndex > currentLyricIndex
                                                ? 'text-gray-400'
                                                : 'text-gray-100'
                                            }`}>
                                            {lineWords.map((wordObj, wordIndex) => {
                                                const isActiveWord = lineIndex === currentLyricIndex &&
                                                    line.words && line.words.length > 0 &&
                                                    wordIndex === currentWordIndex;
                                                const isInActiveLine = lineIndex === currentLyricIndex;

                                                return (
                                                    <span
                                                        key={`${lineIndex}-${wordIndex}`}
                                                        className={`inline-block mx-1.5 transition-all duration-300 ${isActiveWord
                                                            ? 'font-extrabold'
                                                            : isInActiveLine
                                                                ? 'text-white font-semibold'
                                                                : ''
                                                            }`}
                                                        style={{
                                                            color: isActiveWord ? wordHighlightColor : undefined,
                                                            transform: isActiveWord ? 'scale(1.5) translateY(-4px)' : 'scale(1)',
                                                            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                            textShadow: isActiveWord ? `0 0 30px ${wordHighlightColor}cc, 0 0 60px ${wordHighlightColor}66` : 'none',
                                                            filter: isActiveWord ? `drop-shadow(0 0 15px ${wordHighlightColor})` : 'none'
                                                        }}
                                                    >
                                                        {wordObj.word}
                                                    </span>
                                                );
                                            })}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Player Controls - Fixed at bottom */}
            <div className="bg-gradient-to-t from-slate-900 via-purple-900/50 to-slate-900/90 backdrop-blur-xl border-t border-purple-500/30 p-6">

                {/* 🎨 Appearance Settings Panel */}
                {showAppearance && (
                    <div className="mb-6 bg-slate-800/80 p-4 rounded-xl border border-purple-500/30 animate-in slide-in-from-top duration-300">
                        <h3 className="text-sm font-semibold text-purple-300 mb-4 flex items-center gap-2">
                            <Palette size={16} /> {lang === 'fa' ? 'تنظیمات ظاهری' : 'Appearance Settings'}
                        </h3>
                        <div className="flex flex-wrap justify-center gap-8">
                            <div className="flex flex-col items-center gap-2">
                                <label className="text-xs text-gray-400 uppercase font-semibold">
                                    {lang === 'fa' ? 'رنگ کلمه فعال' : 'Word Highlight'}
                                </label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="color" 
                                        value={wordHighlightColor} 
                                        onChange={(e) => setWordHighlightColor(e.target.value)} 
                                        className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-2 border-purple-500/30 p-1"
                                    />
                                    <span className="text-sm font-mono text-gray-300 bg-slate-700/50 px-2 py-1 rounded">{wordHighlightColor}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <label className="text-xs text-gray-400 uppercase font-semibold">
                                    {lang === 'fa' ? 'رنگ پس‌زمینه خط' : 'Line Background'}
                                </label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="color" 
                                        value={lineHighlightColor} 
                                        onChange={(e) => setLineHighlightColor(e.target.value)} 
                                        className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-2 border-purple-500/30 p-1"
                                    />
                                    <span className="text-sm font-mono text-gray-300 bg-slate-700/50 px-2 py-1 rounded">{lineHighlightColor}</span>
                                </div>
                            </div>
                            {/* Quick Presets */}
                            <div className="flex flex-col items-center gap-2">
                                <label className="text-xs text-gray-400 uppercase font-semibold">
                                    {lang === 'fa' ? 'پیش‌فرض‌ها' : 'Presets'}
                                </label>
                                <div className="flex gap-2">
                                    <button onClick={() => { setWordHighlightColor('#fde047'); setLineHighlightColor('#581c87'); }} className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-purple-900 border-2 border-white/20" title="Default" />
                                    <button onClick={() => { setWordHighlightColor('#2dd4bf'); setLineHighlightColor('#0f172a'); }} className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-400 to-slate-900 border-2 border-white/20" title="Teal" />
                                    <button onClick={() => { setWordHighlightColor('#f472b6'); setLineHighlightColor('#1e1b4b'); }} className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-indigo-950 border-2 border-white/20" title="Pink" />
                                    <button onClick={() => { setWordHighlightColor('#4ade80'); setLineHighlightColor('#052e16'); }} className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-green-950 border-2 border-white/20" title="Green" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 🌐 Translation Panel */}
                {showTranslation && (
                    <div className="mb-6 bg-slate-800/80 p-4 rounded-xl border border-blue-500/30 animate-in slide-in-from-top duration-300">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-blue-300 flex items-center gap-2">
                                <Languages size={16} /> {lang === 'fa' ? 'ترجمه' : 'Translation'} ({translationLang})
                            </h3>
                            <button onClick={() => setShowTranslation(false)} className="text-gray-400 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                            {isTranslating ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-8 h-8 border-2 border-t-transparent border-blue-400 rounded-full animate-spin"></div>
                                    <span className="ml-3 text-gray-300">{lang === 'fa' ? 'در حال ترجمه...' : 'Translating...'}</span>
                                </div>
                            ) : translatedText ? (
                                <p className={`text-lg leading-relaxed whitespace-pre-wrap text-gray-200 ${translationLang === 'persian' ? 'font-vazir text-right' : 'text-left'}`} dir={translationLang === 'persian' ? 'rtl' : 'ltr'}>
                                    {translatedText}
                                </p>
                            ) : (
                                <p className="text-gray-500 text-center py-4">{lang === 'fa' ? 'ترجمه‌ای موجود نیست' : 'No translation available'}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Quick Actions Bar */}
                <div className="flex justify-center gap-2 mb-4">
                    <button
                        onClick={() => setShowAppearance(!showAppearance)}
                        className={`p-2 rounded-lg transition-all ${showAppearance ? 'bg-purple-600 text-white' : 'bg-slate-700 text-gray-400 hover:text-white hover:bg-slate-600'}`}
                        title={lang === 'fa' ? 'تنظیمات ظاهری' : 'Appearance'}
                    >
                        <Palette size={20} />
                    </button>
                    <button
                        onClick={() => handleTranslate('english')}
                        disabled={isTranslating}
                        className="px-3 py-2 text-sm rounded-lg transition-colors bg-slate-700 text-gray-300 hover:bg-indigo-600 hover:text-white disabled:opacity-50"
                    >
                        {lang === 'fa' ? 'انگلیسی' : 'English'}
                    </button>
                    <button
                        onClick={() => handleTranslate('persian')}
                        disabled={isTranslating}
                        className="px-3 py-2 text-sm rounded-lg transition-colors bg-slate-700 text-gray-300 hover:bg-blue-600 hover:text-white disabled:opacity-50"
                    >
                        {lang === 'fa' ? 'فارسی' : 'Persian'}
                    </button>
                    <button
                        onClick={() => handleTranslate('finglish')}
                        disabled={isTranslating}
                        className="px-3 py-2 text-sm rounded-lg transition-colors bg-slate-700 text-gray-300 hover:bg-purple-600 hover:text-white disabled:opacity-50"
                    >
                        Finglish
                    </button>
                </div>

                {/* Collapsible Chords Section */}
                {originalLyricsWithChords && (
                    <div className="mb-4 border-b border-purple-500/20 pb-4">
                        <button
                            onClick={() => setShowChords(!showChords)}
                            className="w-full text-left flex items-center justify-between text-sm text-gray-300 hover:text-purple-300 transition-colors bg-purple-900/20 rounded-lg px-4 py-2 hover:bg-purple-900/30"
                        >
                            <span className="flex items-center gap-2">
                                <Music size={16} />
                                {lang === 'fa' ? 'آکوردها و متن کامل' : 'Chords & Full Lyrics'}
                            </span>
                            <ChevronDown
                                size={18}
                                className={`transition-transform duration-300 ${showChords ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {showChords && (
                            <div className="mt-3 bg-slate-900/50 rounded-lg p-4 max-h-64 overflow-y-auto animate-slideDown">
                                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                                    {originalLyricsWithChords}
                                </pre>
                            </div>
                        )}
                    </div>
                )}

                {/* Sync Adjustment */}
                <div className="mb-4">
                    <button
                        onClick={() => setShowSyncControls(!showSyncControls)}
                        className="text-xs text-gray-400 hover:text-purple-300 transition-colors flex items-center gap-2"
                    >
                        <Settings size={14} />
                        {showSyncControls ? (lang === 'fa' ? 'پنهان کردن' : 'Hide') : (lang === 'fa' ? 'تنظیم هماهنگی متن' : 'Sync Settings')}
                    </button>

                    {showSyncControls && (
                        <div className="bg-purple-900/20 rounded-xl p-4 mt-2 border border-purple-500/30">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm text-gray-300">
                                    {lang === 'fa' ? 'تاخیر متن:' : 'Text Delay:'}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setSyncAdjustment((prev: number) => prev - 0.5)}
                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium"
                                    >
                                        ← {lang === 'fa' ? 'زودتر' : 'Earlier'}
                                    </button>
                                    <span className="text-white font-mono min-w-[70px] text-center bg-slate-800/50 px-3 py-1 rounded-lg">
                                        {syncAdjustment > 0 ? '+' : ''}{syncAdjustment.toFixed(1)}s
                                    </span>
                                    <button
                                        onClick={() => setSyncAdjustment((prev: number) => prev + 0.5)}
                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium"
                                    >
                                        {lang === 'fa' ? 'دیرتر' : 'Later'} →
                                    </button>
                                </div>
                            </div>
                            {/* Finglish Toggle */}
                            <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-purple-500/20">
                                <span className="text-sm text-gray-300">
                                    {lang === 'fa' ? 'نمایش فینگلیش:' : 'Show Finglish:'}
                                </span>
                                <button
                                    onClick={() => setShowFinglish(!showFinglish)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${showFinglish
                                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                                        : 'bg-slate-700 hover:bg-slate-600 text-gray-300'}`}
                                >
                                    {showFinglish
                                        ? (lang === 'fa' ? '✓ فعال' : '✓ On')
                                        : (lang === 'fa' ? 'خاموش' : 'Off')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <input
                        type="range"
                        min="0"
                        max={duration || 1}
                        value={currentTime}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => seekTo(parseFloat(e.target.value))}
                        className="w-full h-3 rounded-full appearance-none cursor-pointer"
                        aria-label="Seek progress"
                        style={{
                            background: `linear-gradient(to right, 
                #a855f7 0%, 
                #ec4899 ${(currentTime / (duration || 1)) * 100}%, 
                #334155 ${(currentTime / (duration || 1)) * 100}%, 
                #334155 100%)`,
                            boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)'
                        }}
                    />
                    <div className="flex justify-between text-sm text-gray-400 mt-2 font-mono">
                        <span className="bg-slate-800/50 px-2 py-0.5 rounded">{formatTime(currentTime)}</span>
                        <span className="bg-slate-800/50 px-2 py-0.5 rounded">{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Play Controls */}
                <div className="flex items-center justify-center gap-6">
                    <button
                        onClick={() => skip(-10)}
                        className="p-4 rounded-full bg-slate-700 hover:bg-purple-600 transition-all hover:scale-110"
                        title={lang === 'fa' ? '10 ثانیه قبل' : '-10s'}
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
                        title={lang === 'fa' ? '10 ثانیه بعد' : '+10s'}
                    >
                        <SkipForward size={24} className="text-white" />
                    </button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center justify-center gap-3 mt-4">
                    <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors">
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVolume(parseFloat(e.target.value))}
                        className="w-32 h-2 rounded-full appearance-none cursor-pointer bg-slate-700"
                        aria-label="Volume control"
                    />
                </div>

                {/* Collapsible Sections for Notes, Description, and Attachments */}
                <div className="mt-8 space-y-3 max-w-4xl mx-auto px-4 pb-6">
                    {/* متن یا نوت */}
                    <CollapsibleSection
                        title={lang === 'fa' ? 'متن یا نوت' : 'Notes or Sheet Music'}
                        isEmpty={!notes}
                        emptyText={lang === 'fa' ? 'متن یا نوت موجود نیست' : 'No notes available'}
                    >
                        <div className="prose prose-sm max-w-none text-gray-200 whitespace-pre-wrap leading-relaxed">
                            {notes}
                        </div>
                    </CollapsibleSection>

                    {/* توضیحات */}
                    <CollapsibleSection
                        title={lang === 'fa' ? 'توضیحات' : 'Description'}
                        isEmpty={!description}
                        emptyText={lang === 'fa' ? 'توضیحی ثبت نشده است' : 'No description available'}
                    >
                        <div className="prose prose-sm max-w-none text-gray-200 whitespace-pre-wrap leading-relaxed">
                            {description}
                        </div>
                    </CollapsibleSection>

                    {/* فایلهای ضمیمه */}
                    <CollapsibleSection
                        title={lang === 'fa' ? 'فایلهای ضمیمه' : 'Attachments'}
                        isEmpty={!attachments || attachments.length === 0}
                        emptyText={lang === 'fa' ? 'فایلی موجود نیست' : 'No files attached'}
                    >
                        {attachments && attachments.length > 0 && (
                            <AttachmentList attachments={attachments} />
                        )}
                    </CollapsibleSection>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default FullscreenKaraokePlayer;
