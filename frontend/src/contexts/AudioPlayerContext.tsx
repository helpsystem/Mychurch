/**
 * Global Audio Player Context
 * Manages audio playback across the entire app
 * - Single audio instance (auto-stop previous when new plays)
 * - Playlist/queue for "Play All" feature
 * - Exposes playback controls
 */

import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from 'react';

export interface Song {
    id: number | string;
    title: string;
    artist?: string;
    audioUrl: string;
    thumbnail?: string;
    lyrics?: string;
    youtubeId?: string;
}

interface AudioPlayerContextType {
    // Current State
    currentSong: Song | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;

    // Playlist
    playlist: Song[];
    currentIndex: number;
    isPlayAllMode: boolean;
    isShuffled: boolean;

    // Controls
    playSong: (song: Song) => void;
    pauseSong: () => void;
    resumeSong: () => void;
    stopSong: () => void;
    playNext: () => void;
    playPrevious: () => void;
    seekTo: (time: number) => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;

    // Playlist Controls
    setPlaylist: (songs: Song[], startIndex?: number) => void;
    playAll: (songs: Song[], shuffle?: boolean) => void;
    clearPlaylist: () => void;
    toggleShuffle: () => void;

    // Audio element ref for advanced use
    audioRef: React.RefObject<HTMLAudioElement>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export const useAudioPlayer = () => {
    const context = useContext(AudioPlayerContext);
    if (!context) {
        throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
    }
    return context;
};

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    // State
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolumeState] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    // Playlist state
    const [playlist, setPlaylistState] = useState<Song[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isPlayAllMode, setIsPlayAllMode] = useState(false);
    const [isShuffled, setIsShuffled] = useState(false);
    const [originalPlaylist, setOriginalPlaylist] = useState<Song[]>([]);

    // Process audio URL for Persian filenames
    const processAudioUrl = useCallback((url: string): string => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) {
            try {
                const urlObj = new URL(url);
                const encodedPath = urlObj.pathname.split('/').map(segment =>
                    encodeURIComponent(decodeURIComponent(segment))
                ).join('/');
                return `${urlObj.origin}${encodedPath}${urlObj.search}`;
            } catch {
                return url;
            }
        }
        if (url.startsWith('/')) {
            const segments = url.split('/');
            return segments.map(segment =>
                segment ? encodeURIComponent(decodeURIComponent(segment)) : segment
            ).join('/');
        }
        return url;
    }, []);

    // Play a specific song
    const playSong = useCallback((song: Song) => {
        const audio = audioRef.current;
        if (!audio) return;

        // Stop any currently playing audio
        audio.pause();

        // Set the new song
        setCurrentSong(song);
        audio.src = processAudioUrl(song.audioUrl);
        audio.load();

        // Play when ready
        const playPromise = audio.play();
        if (playPromise) {
            playPromise
                .then(() => setIsPlaying(true))
                .catch(err => console.error('Play error:', err));
        }

        // Update playlist index if in playlist
        if (isPlayAllMode) {
            const index = playlist.findIndex(s => s.id === song.id);
            if (index !== -1) {
                setCurrentIndex(index);
            }
        }
    }, [processAudioUrl, isPlayAllMode, playlist]);

    // Pause
    const pauseSong = useCallback(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            setIsPlaying(false);
        }
    }, []);

    // Resume
    const resumeSong = useCallback(() => {
        const audio = audioRef.current;
        if (audio && currentSong) {
            audio.play()
                .then(() => setIsPlaying(true))
                .catch(err => console.error('Resume error:', err));
        }
    }, [currentSong]);

    // Stop
    const stopSong = useCallback(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            setIsPlaying(false);
            setCurrentSong(null);
            setCurrentTime(0);
        }
    }, []);

    // Play next in playlist
    const playNext = useCallback(() => {
        if (!isPlayAllMode || playlist.length === 0) return;

        let nextIndex = currentIndex + 1;
        if (nextIndex >= playlist.length) {
            nextIndex = 0; // Loop back to start
        }

        setCurrentIndex(nextIndex);
        playSong(playlist[nextIndex]);
    }, [isPlayAllMode, playlist, currentIndex, playSong]);

    // Play previous
    const playPrevious = useCallback(() => {
        if (!isPlayAllMode || playlist.length === 0) return;

        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
            prevIndex = playlist.length - 1;
        }

        setCurrentIndex(prevIndex);
        playSong(playlist[prevIndex]);
    }, [isPlayAllMode, playlist, currentIndex, playSong]);

    // Seek
    const seekTo = useCallback((time: number) => {
        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    // Volume
    const setVolume = useCallback((vol: number) => {
        const audio = audioRef.current;
        if (audio) {
            audio.volume = vol;
            setVolumeState(vol);
            if (vol > 0 && isMuted) {
                setIsMuted(false);
            }
        }
    }, [isMuted]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.muted = !audio.muted;
            setIsMuted(!isMuted);
        }
    }, [isMuted]);

    // Set playlist
    const setPlaylist = useCallback((songs: Song[], startIndex: number = 0) => {
        setPlaylistState(songs);
        setOriginalPlaylist(songs);
        setCurrentIndex(startIndex);
        setIsPlayAllMode(true);
    }, []);

    // Play All
    const playAll = useCallback((songs: Song[], shuffle: boolean = false) => {
        if (songs.length === 0) return;

        let playlistToUse = songs;
        if (shuffle) {
            playlistToUse = shuffleArray(songs);
            setIsShuffled(true);
        } else {
            setIsShuffled(false);
        }

        setOriginalPlaylist(songs);
        setPlaylistState(playlistToUse);
        setCurrentIndex(0);
        setIsPlayAllMode(true);
        playSong(playlistToUse[0]);
    }, [playSong]);

    // Clear playlist
    const clearPlaylist = useCallback(() => {
        setPlaylistState([]);
        setOriginalPlaylist([]);
        setCurrentIndex(-1);
        setIsPlayAllMode(false);
        setIsShuffled(false);
    }, []);

    // Toggle shuffle
    const toggleShuffle = useCallback(() => {
        if (isShuffled) {
            // Restore original order
            setPlaylistState(originalPlaylist);
            const currentSongId = currentSong?.id;
            if (currentSongId) {
                const newIndex = originalPlaylist.findIndex(s => s.id === currentSongId);
                setCurrentIndex(newIndex !== -1 ? newIndex : 0);
            }
        } else {
            // Shuffle
            const shuffled = shuffleArray(playlist);
            setPlaylistState(shuffled);
            const currentSongId = currentSong?.id;
            if (currentSongId) {
                const newIndex = shuffled.findIndex(s => s.id === currentSongId);
                setCurrentIndex(newIndex !== -1 ? newIndex : 0);
            }
        }
        setIsShuffled(!isShuffled);
    }, [isShuffled, originalPlaylist, playlist, currentSong]);

    // Audio event handlers
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleDurationChange = () => setDuration(audio.duration || 0);
        const handleEnded = () => {
            if (isPlayAllMode && playlist.length > 0) {
                playNext();
            } else {
                setIsPlaying(false);
            }
        };
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
        };
    }, [isPlayAllMode, playlist, playNext]);

    const value = useMemo(() => ({
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        playlist,
        currentIndex,
        isPlayAllMode,
        isShuffled,
        playSong,
        pauseSong,
        resumeSong,
        stopSong,
        playNext,
        playPrevious,
        seekTo,
        setVolume,
        toggleMute,
        setPlaylist,
        playAll,
        clearPlaylist,
        toggleShuffle,
        audioRef,
    }), [
        currentSong, isPlaying, currentTime, duration, volume, isMuted,
        playlist, currentIndex, isPlayAllMode, isShuffled,
        playSong, pauseSong, resumeSong, stopSong, playNext, playPrevious,
        seekTo, setVolume, toggleMute, setPlaylist, playAll, clearPlaylist, toggleShuffle
    ]);

    return (
        <AudioPlayerContext.Provider value={value}>
            {/* Hidden audio element */}
            <audio ref={audioRef} preload="metadata" />
            {children}
        </AudioPlayerContext.Provider>
    );
};

export default AudioPlayerContext;
