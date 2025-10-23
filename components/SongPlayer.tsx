import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Repeat, Download, Maximize2 } from 'lucide-react';

interface Song {
  id: number;
  slug: string;
  letter: string;
  title_fa: string;
  title_en?: string;
  artist_fa?: string;
  artist_en?: string;
  lyrics_fa?: string;
  lyrics_en?: string;
  audio_url?: string;
  video_url?: string;
  ppt_url?: string;
  chord_url?: string;
  duration?: number;
  thumbnail_url?: string;
}

interface WordTiming {
  word: string;
  start: number;
  end: number;
}

interface TTSSync {
  song_slug: string;
  language: string;
  total_duration: number;
  word_count: number;
  timings: WordTiming[];
}

interface SongPlayerProps {
  song: Song;
  autoPlay?: boolean;
  showLyrics?: boolean;
  enableHighlight?: boolean;
  presentationMode?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
}

export const SongPlayer: React.FC<SongPlayerProps> = ({
  song,
  autoPlay = false,
  showLyrics = true,
  enableHighlight = true,
  presentationMode = false,
  onNext,
  onPrevious,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [ttsSync, setTtsSync] = useState<TTSSync | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);

  // Load TTS sync data if available
  useEffect(() => {
    if (enableHighlight && song.slug) {
      fetch(`/tts_sync/${song.slug}.json`)
        .then(res => res.json())
        .then(data => setTtsSync(data))
        .catch(() => console.log('No TTS sync data available'));
    }
  }, [song.slug, enableHighlight]);

  // Auto-play when song changes
  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [song.slug, autoPlay]);

  // Update current word based on time
  useEffect(() => {
    if (ttsSync && currentTime > 0) {
      const wordIndex = ttsSync.timings.findIndex(
        (timing) => currentTime >= timing.start && currentTime <= timing.end
      );
      setCurrentWordIndex(wordIndex);
    }
  }, [currentTime, ttsSync]);

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  }, []);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  }, [isMuted, volume]);

  const toggleLoop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.loop = !isLooping;
      setIsLooping(!isLooping);
    }
  }, [isLooping]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderLyricsWithHighlight = () => {
    if (!song.lyrics_fa || !ttsSync) {
      return <div className="whitespace-pre-wrap">{song.lyrics_fa}</div>;
    }

    return (
      <div className="leading-loose text-lg">
        {ttsSync.timings.map((timing, index) => (
          <span
            key={index}
            className={`
              inline-block mx-1 px-1 transition-all duration-200
              ${index === currentWordIndex 
                ? 'bg-yellow-300 text-gray-900 font-bold scale-110 shadow-lg' 
                : 'text-gray-700'
              }
            `}
          >
            {timing.word}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className={`song-player ${presentationMode ? 'presentation-mode' : ''}`}>
      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={song.audio_url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          if (onNext && !isLooping) onNext();
        }}
      />

      {/* Main Player Container */}
      <div className={`
        bg-gradient-to-br from-slate-50 to-slate-100 
        rounded-2xl shadow-2xl overflow-hidden
        ${presentationMode ? 'min-h-screen' : 'max-w-4xl mx-auto'}
      `}>
        
        {/* Header - Song Info */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className={`font-bold mb-2 ${presentationMode ? 'text-5xl' : 'text-3xl'}`}>
                {song.title_fa}
              </h1>
              {song.title_en && (
                <h2 className={`opacity-90 ${presentationMode ? 'text-3xl' : 'text-xl'}`}>
                  {song.title_en}
                </h2>
              )}
              {song.artist_fa && (
                <p className={`mt-3 opacity-80 ${presentationMode ? 'text-2xl' : 'text-lg'}`}>
                  🎤 {song.artist_fa}
                </p>
              )}
            </div>
            
            {song.thumbnail_url && (
              <img 
                src={song.thumbnail_url} 
                alt={song.title_fa}
                className="w-24 h-24 rounded-lg object-cover shadow-lg"
              />
            )}
          </div>
        </div>

        {/* Lyrics Display */}
        {showLyrics && song.lyrics_fa && (
          <div className={`
            p-8 bg-white border-b-2 border-slate-200
            ${presentationMode ? 'text-center text-4xl leading-relaxed py-16' : ''}
          `}>
            <div className="max-w-3xl mx-auto" dir="rtl">
              {enableHighlight && ttsSync ? renderLyricsWithHighlight() : (
                <div className="whitespace-pre-wrap leading-loose">
                  {song.lyrics_fa}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Player Controls */}
        <div className="bg-slate-50 p-6">
          
          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer
                       slider-thumb:bg-blue-600 slider-thumb:w-4 slider-thumb:h-4 slider-thumb:rounded-full"
            />
            <div className="flex justify-between text-sm text-slate-600 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            
            {/* Previous */}
            {onPrevious && (
              <button
                onClick={onPrevious}
                className="p-3 rounded-full hover:bg-slate-200 transition"
                title="Previous Song"
              >
                <SkipBack size={24} />
              </button>
            )}

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-5 rounded-full bg-blue-600 text-white hover:bg-blue-700 
                       transition shadow-lg hover:shadow-xl transform hover:scale-105"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </button>

            {/* Next */}
            {onNext && (
              <button
                onClick={onNext}
                className="p-3 rounded-full hover:bg-slate-200 transition"
                title="Next Song"
              >
                <SkipForward size={24} />
              </button>
            )}

            {/* Loop */}
            <button
              onClick={toggleLoop}
              className={`p-3 rounded-full transition ${
                isLooping ? 'bg-blue-600 text-white' : 'hover:bg-slate-200'
              }`}
              title="Loop"
            >
              <Repeat size={24} />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-3 rounded-full hover:bg-slate-200 transition"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-24 h-2 bg-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Additional Controls */}
          <div className="flex items-center justify-center gap-3 mt-4">
            {song.ppt_url && (
              <a
                href={song.ppt_url}
                download
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                         transition flex items-center gap-2"
              >
                <Download size={18} />
                PowerPoint
              </a>
            )}
            
            {song.chord_url && (
              <a
                href={song.chord_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 
                         transition flex items-center gap-2"
              >
                🎵 Chords
              </a>
            )}
            
            {song.video_url && (
              <a
                href={song.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 
                         transition flex items-center gap-2"
              >
                📽️ Video
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongPlayer;
