import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { 
  X, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, 
  Download, Maximize, Minimize, Share2, Heart, Settings,
  List, Shuffle, Repeat, MoreHorizontal
} from 'lucide-react';

interface MediaItem {
  id: number;
  title: { en: string; fa: string };
  artist?: string;
  speaker?: string;
  audioUrl?: string;
  videoUrl?: string;
  duration?: number;
  type: 'song' | 'sermon';
  lyrics?: { en: string; fa: string };
}

interface EnhancedMediaPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  currentItem: MediaItem;
  playlist?: MediaItem[];
  currentIndex?: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onPlaylistItemClick?: (index: number) => void;
  showLyrics?: boolean;
}

const EnhancedMediaPlayer: React.FC<EnhancedMediaPlayerProps> = ({
  isOpen,
  onClose,
  currentItem,
  playlist = [],
  currentIndex = 0,
  onNext,
  onPrevious,
  onPlaylistItemClick,
  showLyrics = false
}) => {
  const { lang, t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [shuffleMode, setShuffle] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const isVideo = Boolean(currentItem.videoUrl);
  const mediaUrl = isVideo ? currentItem.videoUrl : currentItem.audioUrl;
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
      if (currentItem.type === 'sermon') {
        localStorage.setItem(`sermon-progress-${currentItem.id}`, String(media.currentTime));
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (repeatMode === 'one') {
        media.currentTime = 0;
        media.play();
        setIsPlaying(true);
      } else if ((repeatMode === 'all' || repeatMode === 'none') && onNext) {
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

    // Load saved progress for sermons
    if (currentItem.type === 'sermon') {
      const savedTime = localStorage.getItem(`sermon-progress-${currentItem.id}`);
      if (savedTime) {
        const time = parseFloat(savedTime);
        if (time > 5 && duration && duration - time > 10) {
          media.currentTime = time;
        }
      }
    }

    return () => {
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('ended', handleEnded);
      media.removeEventListener('loadstart', handleLoadStart);
      media.removeEventListener('canplay', handleCanPlay);
      media.removeEventListener('waiting', handleWaiting);
      media.removeEventListener('playing', handlePlaying);
    };
  }, [currentItem.id, mediaUrl, onNext, repeatMode, duration]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          skip(-10);
          break;
        case 'ArrowRight':
          skip(10);
          break;
        case 'ArrowUp':
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'KeyF':
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false);
          } else {
            onClose();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, isPlaying, volume, isFullscreen]);

  const handlePlayPause = async () => {
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const media = mediaRef.current;
    const time = parseFloat(e.target.value);
    if (media) {
      media.currentTime = time;
      setCurrentTime(time);
    }
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

  const handlePlaybackRateChange = (rate: number) => {
    const media = mediaRef.current;
    if (!media) return;

    setPlaybackRate(rate);
    media.playbackRate = rate;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
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
      link.download = `${currentItem.title[lang]}.${isVideo ? 'mp4' : 'mp3'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: currentItem.title[lang],
        text: `${t('listenTo')} ${currentItem.title[lang]}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'one':
        return <Repeat size={20} className="text-blue-400" />;
      case 'all':
        return <Repeat size={20} className="text-blue-400" />;
      default:
        return <Repeat size={20} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={playerRef}
      className={`fixed inset-0 bg-black z-50 flex flex-col ${
        isFullscreen ? 'bg-black' : 'bg-black/90'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black-gradient text-white">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
          <div>
            <h2 className="font-semibold text-lg">{currentItem.title[lang]}</h2>
            <p className="text-sm text-dimWhite">
              {currentItem.artist || currentItem.speaker}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Playlist Toggle */}
          {playlist.length > 0 && (
            <button
              onClick={() => setShowPlaylist(!showPlaylist)}
              className={`p-2 rounded-full transition-colors ${
                showPlaylist ? 'bg-blue-500' : 'hover:bg-white/10'
              }`}
            >
              <List size={20} />
            </button>
          )}

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Settings size={20} />
          </button>

          {/* Fullscreen */}
          {isVideo && (
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Media Display */}
        <div className={`flex-1 flex flex-col ${showPlaylist ? 'w-2/3' : 'w-full'}`}>
          {isVideo ? (
            <div className="flex-1 flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                src={mediaUrl}
                className="max-w-full max-h-full"
                controls={false}
                preload="metadata"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-white p-8">
              {/* Album Art */}
              <div className="w-64 h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-8 flex items-center justify-center shadow-2xl">
                <Volume2 size={80} className="opacity-60" />
              </div>

              {/* Track Info */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{currentItem.title[lang]}</h3>
                <p className="text-lg text-dimWhite">
                  {currentItem.artist || currentItem.speaker}
                </p>
              </div>

              {/* Lyrics */}
              {showLyrics && currentItem.lyrics && (
                <div className="max-w-2xl mx-auto text-center">
                  <div className="bg-white/5 rounded-lg p-6 max-h-64 overflow-y-auto">
                    <p className="text-sm leading-relaxed">
                      {currentItem.lyrics[lang]}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="bg-black-gradient text-white p-6">
            {/* Progress Bar */}
            <div className="mb-6">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${
                    (currentTime / duration) * 100
                  }%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-dimWhite mt-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-center gap-4 mb-4">
              {/* Shuffle */}
              <button
                onClick={() => setShuffle(!shuffleMode)}
                className={`p-2 rounded transition-colors ${
                  shuffleMode ? 'text-blue-400' : 'hover:bg-white/10'
                }`}
              >
                <Shuffle size={20} />
              </button>

              {/* Previous */}
              {onPrevious && (
                <button
                  onClick={onPrevious}
                  className="p-3 hover:bg-white/10 rounded-full transition-colors"
                >
                  <SkipBack size={24} />
                </button>
              )}

              {/* Skip Back */}
              <button
                onClick={() => skip(-10)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <SkipBack size={20} />
              </button>

              {/* Play/Pause */}
              <button
                onClick={handlePlayPause}
                className="w-16 h-16 bg-blue-gradient rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                disabled={isBuffering}
              >
                {isBuffering ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                ) : isPlaying ? (
                  <Pause size={32} />
                ) : (
                  <Play size={32} />
                )}
              </button>

              {/* Skip Forward */}
              <button
                onClick={() => skip(10)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <SkipForward size={20} />
              </button>

              {/* Next */}
              {onNext && (
                <button
                  onClick={onNext}
                  className="p-3 hover:bg-white/10 rounded-full transition-colors"
                >
                  <SkipForward size={24} />
                </button>
              )}

              {/* Repeat */}
              <button
                onClick={() => {
                  const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
                  const currentIndex = modes.indexOf(repeatMode);
                  setRepeatMode(modes[(currentIndex + 1) % modes.length]);
                }}
                className="p-2 rounded transition-colors hover:bg-white/10"
              >
                {getRepeatIcon()}
              </button>
            </div>

            {/* Secondary Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Volume */}
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="p-1">
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Playback Rate */}
                <select
                  value={playbackRate}
                  onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {/* Favorite */}
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`p-2 rounded transition-colors ${
                    isFavorite ? 'text-red-400' : 'hover:bg-white/10'
                  }`}
                >
                  <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>

                {/* Share */}
                <button onClick={handleShare} className="p-2 hover:bg-white/10 rounded transition-colors">
                  <Share2 size={20} />
                </button>

                {/* Download */}
                <button onClick={handleDownload} className="p-2 hover:bg-white/10 rounded transition-colors">
                  <Download size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Hidden audio element */}
          {!isVideo && (
            <audio ref={audioRef} src={mediaUrl} preload="metadata" />
          )}
        </div>

        {/* Playlist Sidebar */}
        {showPlaylist && playlist.length > 0 && (
          <div className="w-1/3 bg-black-gradient border-l border-gray-700 text-white">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold">{t('playlist')}</h3>
              <p className="text-sm text-dimWhite">{playlist.length} {t('items')}</p>
            </div>
            <div className="overflow-y-auto max-h-96">
              {playlist.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => onPlaylistItemClick?.(index)}
                  className={`p-3 border-b border-gray-800 cursor-pointer hover:bg-white/5 transition-colors ${
                    index === currentIndex ? 'bg-blue-500/20' : ''
                  }`}
                >
                  <p className="font-medium text-sm truncate">{item.title[lang]}</p>
                  <p className="text-xs text-dimWhite truncate">
                    {item.artist || item.speaker}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMediaPlayer;