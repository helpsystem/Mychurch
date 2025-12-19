import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Settings, Download, Share2, BookOpen, Clock
} from 'lucide-react';
import { bibleComService, PERSIAN_VERSIONS } from '../services/bibleComApi';

interface BibleAudioPlayerProps {
  book: string;
  chapter: number;
  bookName: { en: string; fa: string };
  language?: 'fa' | 'en';
  onChapterChange?: (direction: 'prev' | 'next') => void;
}

const BibleAudioPlayer: React.FC<BibleAudioPlayerProps> = ({
  book,
  chapter,
  bookName,
  language = 'fa',
  onChapterChange
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Use Web Speech API for Persian text-to-speech (since Bible.com audio might not be available)
  const [useTextToSpeech, setUseTextToSpeech] = useState(true);
  const [verses, setVerses] = useState<string[]>([]);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);

  useEffect(() => {
    // In production, fetch verses from your API
    // For now, we'll use TTS
    setUseTextToSpeech(true);
  }, [book, chapter]);

  const togglePlay = () => {
    if (!audioRef.current && useTextToSpeech) {
      startTextToSpeech();
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const startTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      // This would read the chapter using TTS
      // In production, you'd fetch actual verses and read them
      setIsPlaying(true);
      
      const utterance = new SpeechSynthesisUtterance(
        `خواندن ${bookName.fa} فصل ${chapter}`
      );
      utterance.lang = language === 'fa' ? 'fa-IR' : 'en-US';
      utterance.rate = playbackRate;
      utterance.volume = volume;
      
      utterance.onend = () => {
        setIsPlaying(false);
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const skipBackward = () => {
    if (onChapterChange) {
      onChapterChange('prev');
    }
  };

  const skipForward = () => {
    if (onChapterChange) {
      onChapterChange('next');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const shareChapter = () => {
    const shareLink = bibleComService.getShareLink(book, chapter, undefined, PERSIAN_VERSIONS.NMV);
    if (navigator.share) {
      navigator.share({
        title: `${bookName[language]} ${chapter}`,
        url: shareLink
      });
    } else {
      navigator.clipboard.writeText(shareLink);
      alert(language === 'fa' ? 'لینک کپی شد!' : 'Link copied!');
    }
  };

  return (
    <div className="bible-audio-player">
      <style>{`
        .bible-audio-player {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 1.5rem;
          color: white;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          margin: 1.5rem 0;
        }

        .player-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .player-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .player-info {
          flex: 1;
        }

        .player-info h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .player-info p {
          margin: 0.25rem 0 0 0;
          opacity: 0.9;
          font-size: 0.9rem;
        }

        .player-controls {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .progress-bar {
          width: 100%;
        }

        .progress-track {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.3);
          outline: none;
          cursor: pointer;
        }

        .progress-track::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .progress-track::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
        }

        .time-display {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          margin-top: 0.5rem;
          opacity: 0.9;
        }

        .main-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .control-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
          color: white;
        }

        .control-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }

        .control-btn.play {
          width: 64px;
          height: 64px;
          background: white;
          color: #667eea;
        }

        .control-btn.play:hover {
          background: rgba(255, 255, 255, 0.95);
          transform: scale(1.1);
        }

        .secondary-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-top: 1rem;
        }

        .volume-control {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
        }

        .volume-slider {
          -webkit-appearance: none;
          appearance: none;
          flex: 1;
          max-width: 100px;
          height: 4px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.3);
          outline: none;
        }

        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          border-radius: 8px;
          padding: 0.5rem;
          cursor: pointer;
          transition: all 0.3s;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .settings-panel {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          padding: 1rem;
          margin-top: 1rem;
        }

        .settings-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .settings-row:last-child {
          margin-bottom: 0;
        }

        .speed-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .speed-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 6px;
          padding: 0.4rem 0.8rem;
          color: white;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.3s;
        }

        .speed-btn.active {
          background: white;
          color: #667eea;
        }

        .speed-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .speed-btn.active:hover {
          background: rgba(255, 255, 255, 0.95);
        }

        @media (max-width: 640px) {
          .bible-audio-player {
            padding: 1rem;
          }
          
          .secondary-controls {
            flex-direction: column;
            align-items: stretch;
          }
          
          .volume-control {
            max-width: none;
          }
        }
      `}</style>

      {/* Header */}
      <div className="player-header">
        <div className="player-icon">
          <BookOpen size={24} />
        </div>
        <div className="player-info">
          <h3>{bookName[language]}</h3>
          <p>{language === 'fa' ? `فصل ${chapter}` : `Chapter ${chapter}`}</p>
        </div>
      </div>

      {/* Main Controls */}
      <div className="player-controls">
        {/* Progress Bar */}
        <div className="progress-bar">
          <input
            type="range"
            className="progress-track"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
          />
          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Play/Pause Controls */}
        <div className="main-controls">
          <button className="control-btn" onClick={skipBackward} title={language === 'fa' ? 'فصل قبل' : 'Previous Chapter'}>
            <SkipBack size={24} />
          </button>
          
          <button className="control-btn play" onClick={togglePlay}>
            {isPlaying ? <Pause size={32} /> : <Play size={32} />}
          </button>
          
          <button className="control-btn" onClick={skipForward} title={language === 'fa' ? 'فصل بعد' : 'Next Chapter'}>
            <SkipForward size={24} />
          </button>
        </div>

        {/* Secondary Controls */}
        <div className="secondary-controls">
          <div className="volume-control">
            <button className="action-btn" onClick={toggleMute}>
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input
              type="range"
              className="volume-slider"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
            />
          </div>

          <div className="action-buttons">
            <button 
              className="action-btn" 
              onClick={() => setShowSettings(!showSettings)}
              title={language === 'fa' ? 'تنظیمات' : 'Settings'}
            >
              <Settings size={20} />
            </button>
            <button 
              className="action-btn" 
              onClick={shareChapter}
              title={language === 'fa' ? 'اشتراک‌گذاری' : 'Share'}
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="settings-panel">
            <div className="settings-row">
              <span>{language === 'fa' ? 'سرعت پخش:' : 'Playback Speed:'}</span>
              <div className="speed-buttons">
                {[0.75, 1, 1.25, 1.5, 2].map(rate => (
                  <button
                    key={rate}
                    className={`speed-btn ${playbackRate === rate ? 'active' : ''}`}
                    onClick={() => handlePlaybackRateChange(rate)}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default BibleAudioPlayer;
