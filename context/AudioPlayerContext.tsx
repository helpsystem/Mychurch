

import React, { createContext, useState, useRef, ReactNode, useEffect, useCallback, useContext } from 'react';
import { Sermon, AudioPlayerContextType } from '../types';

export const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState<Sermon | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);
    const saveIntervalRef = useRef<number | null>(null);

    const onTimeUpdate = () => {
        if (audioRef.current) {
            setProgress(audioRef.current.currentTime);
        }
    };

    const onLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const onEnded = useCallback(() => {
        setIsPlaying(false);
         if (currentTrack) {
            localStorage.removeItem(`sermon-progress-${currentTrack.id}`);
        }
    }, [currentTrack]);

    const saveProgress = useCallback(() => {
        if (audioRef.current && currentTrack && isPlaying) {
             // Don't save if very close to the end
            if (audioRef.current.duration - audioRef.current.currentTime > 10) {
                localStorage.setItem(`sermon-progress-${currentTrack.id}`, String(audioRef.current.currentTime));
            } else {
                 localStorage.removeItem(`sermon-progress-${currentTrack.id}`);
            }
        }
    }, [currentTrack, isPlaying]);

    useEffect(() => {
        if (isPlaying && currentTrack) {
            saveIntervalRef.current = window.setInterval(saveProgress, 5000);
        } else {
            if (saveIntervalRef.current) {
                clearInterval(saveIntervalRef.current);
            }
        }
        return () => {
            if (saveIntervalRef.current) {
                clearInterval(saveIntervalRef.current);
            }
        };
    }, [isPlaying, currentTrack, saveProgress]);
    
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.addEventListener('timeupdate', onTimeUpdate);
            audio.addEventListener('loadedmetadata', onLoadedMetadata);
            audio.addEventListener('ended', onEnded);
            
            if (isPlaying) {
                audio.play().catch(e => console.error("Audio play failed:", e));
            } else {
                audio.pause();
            }

            return () => {
                audio.removeEventListener('timeupdate', onTimeUpdate);
                audio.removeEventListener('loadedmetadata', onLoadedMetadata);
                audio.removeEventListener('ended', onEnded);
            };
        }
    }, [isPlaying, onEnded]);
    
    const playTrack = (track: Sermon) => {
        if (currentTrack?.id !== track.id) {
            // Save progress of the old track before switching
            if (audioRef.current && currentTrack) {
                saveProgress();
            }
            
            setCurrentTrack(track);
            setIsPlaying(true);
            if(audioRef.current) {
                audioRef.current.src = track.audioUrl;
                audioRef.current.load();
                
                const handleCanPlay = () => {
                    const savedTime = localStorage.getItem(`sermon-progress-${track.id}`);
                    if (savedTime && audioRef.current) {
                        const parsedTime = parseFloat(savedTime);
                        if (audioRef.current.duration - parsedTime > 10) { // Check if not at the end
                           audioRef.current.currentTime = parsedTime;
                        }
                    }
                    audioRef.current?.play().catch(e => console.error("Audio play failed on canplay:", e));
                };
                
                audioRef.current.addEventListener('canplay', handleCanPlay, { once: true });
            }
        } else {
            togglePlayPause();
        }
    };

    const togglePlayPause = () => {
        if (!currentTrack) return;
        setIsPlaying(!isPlaying);
    };
    
    const seek = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setProgress(time);
        }
    };
    
    const closePlayer = () => {
        if (audioRef.current) {
            saveProgress(); // Save final progress on close
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        setCurrentTrack(null);
        setIsPlaying(false);
        setProgress(0);
        setDuration(0);
    };

    return (
        <AudioPlayerContext.Provider value={{ currentTrack, isPlaying, progress, duration, playTrack, togglePlayPause, seek, closePlayer }}>
            {children}
            <audio ref={audioRef} />
        </AudioPlayerContext.Provider>
    );
};

export const useAudioPlayer = (): AudioPlayerContextType => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};