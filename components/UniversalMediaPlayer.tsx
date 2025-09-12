import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { 
  Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, 
  Download, Share2, Heart, Clock, Maximize2, Minimize2,
  MoreHorizontal, List
} from 'lucide-react';
import { WorshipSong, Sermon } from '../types';

interface MediaItem {
  id: number;
  title: { en: string; fa: string };
  artist?: string;
  speaker?: string;
  audioUrl?: string;
  videoUrl?: string;
  duration?: number;
  type: 'song' | 'sermon';
}

interface UniversalMediaPlayerProps {
  item: MediaItem;
  playlist?: MediaItem[];
  currentIndex?: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onPlaylistChange?: (index: number) => void;
  showPlaylist?: boolean;
  mode: 'card' | 'mini' | 'full';
  autoPlay?: boolean;
  showLyrics?: boolean;
  className?: string;
}

const UniversalMediaPlayer: React.FC<UniversalMediaPlayerProps> = ({
  item,
  playlist = [],
  currentIndex = 0,
  onNext,
  onPrevious,
  onPlaylistChange,
  showPlaylist = false,
  mode = 'card',
  autoPlay = false,
  showLyrics = false,
  className = ''
}) => {
  const { lang, t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [showPlaylistPanel, setShowPlaylistPanel] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Media type detection
  const isVideo = Boolean(item.videoUrl);
  const mediaUrl = isVideo ? item.videoUrl : item.audioUrl;
  const mediaRef = isVideo ? videoRef : audioRef;

  useEffect(() => {
    const media = mediaRef.current;
    if (!media || !mediaUrl) return;

    const handleLoadedMetadata = () => {
      setDuration(media.duration);
      setIsBuffering(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(media.currentTime);
      // Save progress for sermons
      if (item.type === 'sermon') {
        localStorage.setItem(`sermon-progress-${item.id}`, String(media.currentTime));
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onNext && playlist.length > 1) {
        onNext();
      }
    };

    const handleLoadStart = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);

    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('ended', handleEnded);
    media.addEventListener('loadstart', handleLoadStart);
    media.addEventListener('canplay', handleCanPlay);
    media.addEventListener('waiting', handleWaiting);
    media.addEventListener('playing', handlePlaying);

    return () => {
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('ended', handleEnded);
      media.removeEventListener('loadstart', handleLoadStart);
      media.removeEventListener('canplay', handleCanPlay);
      media.removeEventListener('waiting', handleWaiting);
      media.removeEventListener('playing', handlePlaying);
    };
  }, [item.id, mediaUrl, onNext, playlist.length]);

  // Load saved progress for sermons
  useEffect(() => {
    if (item.type === 'sermon' && audioRef.current) {
      const savedTime = localStorage.getItem(`sermon-progress-${item.id}`);
      if (savedTime) {
        const time = parseFloat(savedTime);
        if (time > 5 && duration - time > 10) {
          audioRef.current.currentTime = time;
        }
      }
    }
  }, [item.id, duration]);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && mediaRef.current) {
      handlePlay();
    }
  }, [autoPlay, item.id]);

  const handlePlay = async () => {
    const media = mediaRef.current;
    if (!media) return;

    try {
      if (isPlaying) {
        media.pause();
        setIsPlaying(false);
      } else {
        await media.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback failed:', error);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const media = mediaRef.current;
    const progressBar = progressRef.current;
    if (!media || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    media.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (newVolume: number) => {
    const media = mediaRef.current;
    if (!media) return;

    setVolume(newVolume);
    media.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isMuted) {
      media.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      media.volume = 0;
      setIsMuted(true);
    }
  };

  const skip = (seconds: number) => {
    const media = mediaRef.current;
    if (!media) return;

    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    media.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handlePlaybackRate = (rate: number) => {
    const media = mediaRef.current;
    if (!media) return;

    setPlaybackRate(rate);
    media.playbackRate = rate;
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (mediaUrl) {
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = `${item.title[lang]}.${isVideo ? 'mp4' : 'mp3'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: item.title[lang],
        text: `${t('listenTo')} ${item.title[lang]}`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // Could show a toast notification here
    }
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  // Mini mode for global player
  if (mode === 'mini') {
    return (
      <div className={`bg-black-gradient text-white p-3 ${className}`}>
        <div className="flex items-center gap-4">
          <button
            onClick={handlePlay}
            className="flex-shrink-0 w-10 h-10 bg-blue-gradient rounded-full flex items-center justify-center"
            disabled={isBuffering}
          >
            {isBuffering ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : isPlaying ? (
              <Pause size={18} />
            ) : (
              <Play size={18} />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{item.title[lang]}</p>
            <p className="text-xs text-dimWhite truncate">
              {item.artist || item.speaker}
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span>{formatTime(currentTime)}</span>
            <div className="w-20 h-1 bg-gray-600 rounded-full">
              <div 
                className="h-full bg-blue-gradient rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Mobile progress bar */}
        <div className="sm:hidden mt-2">
          <div 
            ref={progressRef}
            className="w-full h-1 bg-gray-600 rounded-full cursor-pointer"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-blue-gradient rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Hidden media elements */}
        {isVideo ? (
          <video ref={videoRef} src={mediaUrl} className="hidden" preload="metadata" />
        ) : (
          <audio ref={audioRef} src={mediaUrl} className="hidden" preload="metadata" />
        )}
      </div>
    );
  }

  // Card mode for inline players
  if (mode === 'card') {
    return (
      <div className={`bg-black-gradient rounded-[20px] p-6 text-white ${className}`}>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Media Info */}
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{item.title[lang]}</h3>
            <p className="text-dimWhite text-sm mb-3">
              {item.artist || item.speaker}
            </p>

            {/* Progress Bar */}
            <div 
              ref={progressRef}
              className="w-full h-2 bg-gray-700 rounded-full cursor-pointer mb-3"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-blue-gradient rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Time Display */}
            <div className="flex justify-between text-xs text-dimWhite mb-4">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2 mb-4">
              {/* Previous */}
              {onPrevious && (
                <button
                  onClick={onPrevious}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <SkipBack size={20} />
                </button>
              )}

              {/* Skip Back */}
              <button
                onClick={() => skip(-10)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title={`${t('skipBack')} 10s`}
              >
                <SkipBack size={16} />
              </button>

              {/* Play/Pause */}
              <button
                onClick={handlePlay}
                className="w-12 h-12 bg-blue-gradient rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                disabled={isBuffering}
              >
                {isBuffering ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : isPlaying ? (
                  <Pause size={24} />
                ) : (
                  <Play size={24} />
                )}
              </button>

              {/* Skip Forward */}
              <button
                onClick={() => skip(10)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title={`${t('skipForward')} 10s`}
              >
                <SkipForward size={16} />
              </button>

              {/* Next */}
              {onNext && (
                <button
                  onClick={onNext}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <SkipForward size={20} />
                </button>
              )}
            </div>

            {/* Secondary Controls */}
            <div className="flex items-center gap-2 justify-center">
              {/* Volume */}
              <div className="relative">
                <button
                  onClick={() => setShowVolume(!showVolume)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                {showVolume && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black-gradient p-2 rounded-lg">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Download */}
              <button
                onClick={handleDownload}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title={t('download')}
              >
                <Download size={16} />
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title={t('share')}
              >
                <Share2 size={16} />
              </button>

              {/* Favorite */}
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-1 rounded transition-colors ${
                  isFavorite ? 'text-red-400 hover:text-red-300' : 'hover:bg-white/10'
                }`}
                title={t('addToFavorites')}
              >
                <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>

        {/* Video Element */}
        {isVideo && mode === 'card' && (
          <div className="mt-4 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={mediaUrl}
              className="w-full h-auto max-h-64 object-cover"
              poster=""
              preload="metadata"
            />
          </div>
        )}

        {/* Hidden audio element for audio-only content */}
        {!isVideo && (
          <audio ref={audioRef} src={mediaUrl} preload="metadata" />
        )}
      </div>
    );
  }

  // Full mode would be similar to the existing LocalMediaPlayer
  return null;
};

export default UniversalMediaPlayer;