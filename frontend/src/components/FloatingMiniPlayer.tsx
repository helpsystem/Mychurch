/**
 * Floating Mini Player
 * Sticky bottom player showing current song and controls
 */

import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, Shuffle, List, ChevronUp, ChevronDown } from 'lucide-react';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

interface TimingWord {
    word: string;
    start: number;
    end: number;
}

interface TimingLine {
    line: string;
    start: number;
    end: number;
    words: TimingWord[];
}

interface TimingData {
    lines: TimingLine[];
}

const FloatingMiniPlayer: React.FC = () => {
    const {
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isPlayAllMode,
        isShuffled,
        playlist,
        currentIndex,
        pauseSong,
        resumeSong,
        stopSong,
        playNext,
        playPrevious,
        seekTo,
        setVolume,
        toggleMute,
        toggleShuffle,
    } = useAudioPlayer();

    const [isExpanded, setIsExpanded] = useState(false);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [timingData, setTimingData] = useState<TimingData | null>(null);
    const [currentLineIdx, setCurrentLineIdx] = useState(-1);
    const [currentWordIdx, setCurrentWordIdx] = useState(-1);

    // Load timing data when song changes
    useEffect(() => {
        if (!currentSong?.id) {
            setTimingData(null);
            return;
        }

        const loadTiming = async () => {
            try {
                const response = await fetch(`/worship/data/timings/song_${currentSong.id}_timing.json`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.lines) {
                        setTimingData(data);
                        console.log('✅ Loaded timing for song:', currentSong.id);
                    }
                } else {
                    console.log('📭 No timing file for song:', currentSong.id);
                    setTimingData(null);
                }
            } catch (err) {
                console.log('⚠️ Error loading timing:', err);
                setTimingData(null);
            }
        };

        loadTiming();
    }, [currentSong?.id]);

    // Update current line and word based on currentTime
    useEffect(() => {
        if (!timingData?.lines) return;

        // Find current line
        let lineIdx = -1;
        for (let i = 0; i < timingData.lines.length; i++) {
            if (currentTime >= timingData.lines[i].start && currentTime < timingData.lines[i].end) {
                lineIdx = i;
                break;
            }
        }

        // Find current word within line
        let wordIdx = -1;
        if (lineIdx >= 0 && timingData.lines[lineIdx].words) {
            const words = timingData.lines[lineIdx].words;
            for (let i = 0; i < words.length; i++) {
                if (currentTime >= words[i].start && currentTime < words[i].end) {
                    wordIdx = i;
                    break;
                }
            }
        }

        setCurrentLineIdx(lineIdx);
        setCurrentWordIdx(wordIdx);
    }, [currentTime, timingData]);

    // Don't render if no song is playing
    if (!currentSong) return null;

    // Format time mm:ss
    const formatTime = (time: number): string => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Strip chord notations and verse markers from lyrics for clean display
    const stripChords = (text: string): string => {
        if (!text) return '';
        return text
            // Remove chord patterns like [Am], [Dm7], [Bb], [G#m], etc.
            .replace(/\[[A-Ga-g][#b]?[a-zA-Z0-9]*\]/g, '')
            // Remove verse markers like V1, V2, V3, Verse 1, etc.
            .replace(/\b[Vv]\d+\b/g, '')
            .replace(/\bVerse\s*\d*\b/gi, '')
            // Remove Chorus, Bridge, Pre-Chorus, Outro, Intro markers
            .replace(/\b(Chorus|Bridge|Pre-Chorus|Outro|Intro|Verse)\s*(\(\d+\)|\(\d*x\d*\))?/gi, '')
            // Remove (x2) style repeat markers
            .replace(/\([x×]\d+\)/gi, '')
            .replace(/\(\d+x\)/gi, '')
            // Clean up extra whitespace
            .replace(/\s+/g, ' ')
            .trim();
    };

    // Parse lyrics into lines for karaoke display
    const getLyricsLines = (lyrics: string): string[] => {
        if (!lyrics) return [];
        const cleaned = stripChords(lyrics);
        // Split by newlines and filter empty lines
        return cleaned.split(/\n+/).filter(line => line.trim().length > 0);
    };

    // Get current line index based on playback time (simple linear distribution)
    const getCurrentLineIndex = (lines: string[], time: number, dur: number): number => {
        if (lines.length === 0 || dur === 0) return 0;
        const progress = time / dur;
        const lineIndex = Math.floor(progress * lines.length);
        return Math.min(lineIndex, lines.length - 1);
    };

    // Get word progress within current line
    const getWordHighlightProgress = (time: number, dur: number, linesCount: number): number => {
        if (linesCount === 0 || dur === 0) return 0;
        const lineTime = dur / linesCount;
        const timeIntoCurrentLine = time % lineTime;
        return timeIntoCurrentLine / lineTime;
    };

    // Current karaoke data
    const lyricsLines = currentSong.lyrics ? getLyricsLines(currentSong.lyrics) : [];
    const currentLineIndex = getCurrentLineIndex(lyricsLines, currentTime, duration);
    const currentLine = lyricsLines[currentLineIndex] || '';
    const wordProgress = getWordHighlightProgress(currentTime, duration, lyricsLines.length);

    // Progress percentage
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    // Handle progress bar click
    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * duration;
        seekTo(newTime);
    };

    return (
        <>
            {/* Backdrop for playlist */}
            {showPlaylist && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setShowPlaylist(false)}
                />
            )}

            {/* Main Player */}
            <div
                className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${isExpanded ? 'h-auto' : 'h-20'
                    }`}
            >
                {/* Expanded content */}
                {isExpanded && (
                    <div className="bg-gradient-to-b from-purple-900/95 to-slate-900/95 backdrop-blur-xl border-t border-purple-500/30 p-6">
                        {/* Song Info */}
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-white mb-1">{currentSong.title}</h3>
                            {currentSong.artist && (
                                <p className="text-purple-300 text-sm">{currentSong.artist}</p>
                            )}
                        </div>

                        {/* Extended Progress Bar */}
                        <div className="mb-4">
                            <div
                                className="h-2 bg-slate-700 rounded-full cursor-pointer overflow-hidden"
                                onClick={handleProgressClick}
                            >
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Volume Control - RTL layout: icon on right, high volume on left */}
                        <div className="flex items-center justify-center gap-3 mb-4" dir="rtl">
                            <button onClick={toggleMute} className="text-gray-300 hover:text-white" title="قطع/وصل صدا">
                                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={isMuted ? 0 : volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="w-24 accent-purple-500"
                                title="تنظیم صدا"
                                dir="ltr"
                            />
                        </div>

                        {/* Lyrics Display - Simple inline marquee style */}
                        {currentSong.lyrics && (
                            <div
                                className="mt-3 text-purple-200 text-sm text-center max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/30"
                                dir="rtl"
                            >
                                {stripChords(currentSong.lyrics)}
                            </div>
                        )}
                    </div>
                )}

                {/* Compact Player Bar */}
                <div className="bg-gradient-to-r from-slate-900 via-purple-900/90 to-slate-900 backdrop-blur-xl border-t border-purple-500/30 px-4 py-2">
                    {/* Mini Progress Bar */}
                    <div
                        className="absolute top-0 left-0 right-0 h-1 bg-slate-700 cursor-pointer"
                        onClick={handleProgressClick}
                    >
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Karaoke Lyrics Line - shows current line with word highlighting */}
                    {timingData && currentLineIdx >= 0 && timingData.lines[currentLineIdx] && (
                        <div className="mb-2 overflow-hidden" dir="rtl">
                            <div className="text-center text-sm font-medium py-1">
                                {timingData.lines[currentLineIdx].words.map((wordData, idx) => {
                                    const isActive = idx === currentWordIdx;
                                    const isPassed = idx < currentWordIdx;
                                    return (
                                        <span
                                            key={idx}
                                            className={`transition-all duration-150 inline-block mx-0.5 ${isActive
                                                ? 'text-yellow-300 font-bold scale-110'
                                                : isPassed
                                                    ? 'text-yellow-300/70'
                                                    : 'text-purple-200/80'
                                                }`}
                                        >
                                            {stripChords(wordData.word)}{' '}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Fallback: Simple lyrics display when no timing data but lyrics exist */}
                    {!timingData && currentSong.lyrics && lyricsLines.length > 0 && (
                        <div className="mb-2 overflow-hidden" dir="rtl">
                            <div className="text-center text-base font-medium py-2 text-purple-100 animate-pulse">
                                {currentLine || lyricsLines[0]}
                            </div>
                        </div>
                    )}

                    {/* Always show song title as lyrics if no lyrics available */}
                    {!timingData && !currentSong.lyrics && (
                        <div className="mb-2 overflow-hidden" dir="rtl">
                            <div className="text-center text-base font-semibold py-2 text-purple-200">
                                {currentSong.title}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        {/* Thumbnail / Icon */}
                        <div className="w-12 h-12 bg-purple-600/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            {currentSong.thumbnail ? (
                                <img
                                    src={currentSong.thumbnail}
                                    alt={currentSong.title}
                                    className="w-full h-full object-cover rounded-lg"
                                />
                            ) : (
                                <span className="text-2xl">🎵</span>
                            )}
                        </div>

                        {/* Song Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate text-sm">{currentSong.title}</p>
                            {currentSong.artist && (
                                <p className="text-gray-400 text-xs truncate">{currentSong.artist}</p>
                            )}
                            {isPlayAllMode && playlist.length > 0 && (
                                <p className="text-purple-400 text-xs">
                                    {currentIndex + 1} / {playlist.length}
                                </p>
                            )}
                        </div>

                        {/* Controls - RTL layout for Persian: Previous on right, Next on left */}
                        <div className="flex items-center gap-2" dir="rtl">
                            {/* Shuffle */}
                            {isPlayAllMode && (
                                <button
                                    onClick={toggleShuffle}
                                    className={`p-2 rounded-full transition-colors ${isShuffled
                                        ? 'text-purple-400 bg-purple-500/20'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                    title="تصادفی"
                                >
                                    <Shuffle size={18} />
                                </button>
                            )}

                            {/* Next (on right side for RTL) */}
                            {isPlayAllMode && (
                                <button
                                    onClick={playNext}
                                    className="p-2 text-gray-300 hover:text-white transition-colors"
                                    title="بعدی"
                                >
                                    <SkipForward size={20} />
                                </button>
                            )}

                            {/* Play/Pause */}
                            <button
                                onClick={isPlaying ? pauseSong : resumeSong}
                                className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/30 transition-all hover:scale-105"
                            >
                                {isPlaying ? <Pause size={24} /> : <Play size={24} className="mr-1" />}
                            </button>

                            {/* Previous (on left side for RTL) */}
                            {isPlayAllMode && (
                                <button
                                    onClick={playPrevious}
                                    className="p-2 text-gray-300 hover:text-white transition-colors"
                                    title="قبلی"
                                >
                                    <SkipBack size={20} />
                                </button>
                            )}

                            {/* Playlist */}
                            {isPlayAllMode && playlist.length > 0 && (
                                <button
                                    onClick={() => setShowPlaylist(!showPlaylist)}
                                    className="p-2 text-gray-400 hover:text-white transition-colors"
                                    title="لیست پخش"
                                >
                                    <List size={18} />
                                </button>
                            )}

                            {/* Volume Control - Compact */}
                            <div className="flex items-center gap-1 group">
                                <button
                                    onClick={toggleMute}
                                    className="p-2 text-gray-400 hover:text-white transition-colors"
                                    title={isMuted ? 'فعال کردن صدا' : 'بی‌صدا'}
                                >
                                    {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={isMuted ? 0 : volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                    className="w-16 h-1 accent-purple-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block"
                                    title="تنظیم صدا"
                                />
                            </div>

                            {/* Expand/Collapse */}
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="p-2 text-gray-400 hover:text-white transition-colors"
                            >
                                {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                            </button>

                            {/* Close */}
                            <button
                                onClick={stopSong}
                                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                title="بستن"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Playlist Sidebar */}
            {showPlaylist && (
                <div className="fixed bottom-20 right-4 w-80 max-h-96 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-purple-500/30 shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-purple-500/20">
                        <h4 className="text-white font-semibold flex items-center gap-2">
                            <List size={18} />
                            لیست پخش ({playlist.length})
                        </h4>
                    </div>
                    <div className="overflow-y-auto max-h-72">
                        {playlist.map((song, index) => (
                            <div
                                key={song.id}
                                className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${index === currentIndex
                                    ? 'bg-purple-600/30 border-l-2 border-purple-500'
                                    : 'hover:bg-slate-800'
                                    }`}
                            >
                                <span className="text-xs text-gray-500 w-5">{index + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm truncate ${index === currentIndex ? 'text-white font-medium' : 'text-gray-300'}`}>
                                        {song.title}
                                    </p>
                                    {song.artist && (
                                        <p className="text-xs text-gray-500 truncate">{song.artist}</p>
                                    )}
                                </div>
                                {index === currentIndex && isPlaying && (
                                    <div className="flex gap-0.5">
                                        <div className="w-1 h-3 bg-purple-500 animate-pulse rounded-full" />
                                        <div className="w-1 h-4 bg-purple-400 animate-pulse rounded-full" style={{ animationDelay: '0.1s' }} />
                                        <div className="w-1 h-2 bg-purple-500 animate-pulse rounded-full" style={{ animationDelay: '0.2s' }} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

export default FloatingMiniPlayer;
