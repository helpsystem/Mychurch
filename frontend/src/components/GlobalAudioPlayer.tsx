
import React from 'react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useLanguage } from '../hooks/useLanguage';
import { Play, Pause, X } from 'lucide-react';

const GlobalAudioPlayer: React.FC = () => {
    const { currentTrack, isPlaying, progress, duration, togglePlayPause, seek, closePlayer } = useAudioPlayer();
    const { lang } = useLanguage();
    
    if (!currentTrack) {
        return null;
    }

    const formatTime = (time: number) => {
        if (isNaN(time) || time === 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };
    
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        seek(Number(e.target.value));
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black-gradient p-3 border-t border-gray-800 backdrop-blur-md animate-slide-up-fast">
            <div className="max-w-7xl mx-auto flex items-center gap-4 text-white">
                <button onClick={togglePlayPause} className="p-2 bg-blue-gradient text-primary rounded-full flex-shrink-0">
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>

                <div className="flex-grow min-w-0">
                    <p className="font-bold truncate">{currentTrack.title[lang]}</p>
                    <p className="text-sm text-dimWhite truncate">{currentTrack.speaker}</p>
                </div>
                
                <div className="hidden md:flex items-center gap-2 w-1/3">
                    <span className="text-xs w-10 text-right">{formatTime(progress)}</span>
                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={progress}
                        onChange={handleSeek}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer range-sm"
                        aria-label="Seek slider"
                    />
                    <span className="text-xs w-10">{formatTime(duration)}</span>
                </div>
                
                <button onClick={closePlayer} className="p-2 text-gray-400 hover:text-white flex-shrink-0">
                    <X size={24} />
                </button>
            </div>
            <div className="md:hidden mt-2 px-4">
                 <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={progress}
                    onChange={handleSeek}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer range-sm"
                    aria-label="Seek slider"
                />
                 <div className="flex justify-between text-xs text-dimWhite mt-1">
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(duration)}</span>
                 </div>
            </div>
        </div>
    );
};

export default GlobalAudioPlayer;
