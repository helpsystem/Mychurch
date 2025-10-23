/**
 * Song Card Component
 * Displays individual song with audio player and word-level highlighting
 */

import React, { useRef, useState } from 'react';
import { Play, Pause, Music2, Video, FileText, Film, Download } from 'lucide-react';
import { useAudioHighlight } from '../hooks/useAudioHighlight';

interface SongItem {
  id: string;
  slug: string;
  title_fa: string;
  title_en: string;
  composer: string;
  artist: string;
  letter: string;
  chord_base: string;
  chord_mode: string;
  chord_view: string;
  ppt: string;
  video: string;
  lyric_audio_link: string;
  audio_download: string;
  audio_stream: string;
  mp3_local: string;
  duration_sec: number;
  lyrics_fa: string;
  lyrics_en: string;
}

interface SongCardProps {
  song: SongItem;
  presentationMode: boolean;
  audioSpeed: number;
  isPlaying: boolean;
  onPlayToggle: () => void;
  lang: string;
}

export default function SongCard({
  song,
  presentationMode,
  audioSpeed,
  isPlaying,
  onPlayToggle,
  lang
}: SongCardProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showLyrics, setShowLyrics] = useState(true);

  // Use audio highlight hook
  const { tokens, currentIndex } = useAudioHighlight({
    audioRef,
    text: song.lyrics_fa || song.title_fa || '',
    duration: song.duration_sec || 0,
    playbackRate: audioSpeed
  });

  // Audio source - prefer mp3_local, fallback to audio_stream or audio_download
  const audioSrc = song.audio_stream || song.audio_download || '';

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
    
    onPlayToggle();
  };

  return (
    <div 
      className={`rounded-2xl shadow-lg transition-all duration-300 overflow-hidden ${
        presentationMode 
          ? 'bg-neutral-900/70 border-2 border-neutral-700 hover:border-emerald-600' 
          : 'bg-white hover:shadow-2xl hover:-translate-y-1'
      } ${isPlaying ? 'ring-4 ring-emerald-500' : ''}`}
    >
      {/* Card Header */}
      <div className="p-5 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className={`font-bold mb-1 truncate ${
              presentationMode ? 'text-2xl' : 'text-xl'
            }`}>
              {song.title_fa || song.title_en || 'Untitled'}
            </h3>
            
            {/* Subtitle */}
            {(song.title_en || song.composer) && (
              <div className={`opacity-70 truncate ${
                presentationMode ? 'text-base' : 'text-sm'
              }`}>
                {[song.title_en, song.composer || song.artist].filter(Boolean).join(' • ')}
              </div>
            )}

            {/* Metadata Chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {song.chord_base && (
                <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                  Key: {song.chord_base}
                </span>
              )}
              {song.chord_mode && (
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                  {song.chord_mode}
                </span>
              )}
              {song.duration_sec > 0 && (
                <span className="px-2 py-1 text-xs rounded-full bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                  {Math.floor(song.duration_sec / 60)}:{String(Math.floor(song.duration_sec % 60)).padStart(2, '0')}
                </span>
              )}
            </div>
          </div>

          {/* Play Button */}
          <button
            onClick={handlePlayPause}
            className={`shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-110 ${
              isPlaying 
                ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </button>
        </div>

        {/* Resource Links */}
        <div className="flex flex-wrap gap-2 mt-4">
          {song.video && (
            <a 
              href={song.video}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors"
            >
              <Video className="w-4 h-4" />
              Video
            </a>
          )}
          {song.ppt && (
            <a 
              href={song.ppt}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 transition-colors"
            >
              <FileText className="w-4 h-4" />
              PPT
            </a>
          )}
          {song.chord_view && (
            <a 
              href={song.chord_view}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 transition-colors"
            >
              <Music2 className="w-4 h-4" />
              Chords
            </a>
          )}
          {song.lyric_audio_link && (
            <a 
              href={song.lyric_audio_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 transition-colors"
            >
              <Film className="w-4 h-4" />
              {lang === 'fa' ? 'صوت + متن' : 'Lyrics + Audio'}
            </a>
          )}
          {song.audio_download && (
            <a 
              href={song.audio_download}
              download
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 transition-colors"
            >
              <Download className="w-4 h-4" />
              {lang === 'fa' ? 'دانلود' : 'Download'}
            </a>
          )}
        </div>
      </div>

      {/* Audio Player */}
      {audioSrc && (
        <div className="px-5 py-3 bg-neutral-50 dark:bg-neutral-800/50">
          <audio
            ref={audioRef}
            src={audioSrc}
            className="w-full"
            controls
            preload="metadata"
            onPlay={() => {
              if (audioRef.current) {
                audioRef.current.playbackRate = audioSpeed;
              }
            }}
          />
        </div>
      )}

      {/* Highlighted Lyrics */}
      {showLyrics && tokens.length > 0 && (
        <div 
          className={`p-5 leading-relaxed ${
            presentationMode ? 'text-xl' : 'text-lg'
          }`}
          dir="rtl"
        >
          {tokens.map((word, index) => (
            <span
              key={index}
              className={`inline-block mx-0.5 px-1 transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-amber-400 text-black rounded scale-110 font-bold shadow-lg' 
                  : ''
              }`}
            >
              {word}
            </span>
          ))}
        </div>
      )}

      {/* No Audio Warning */}
      {!audioSrc && (
        <div className="p-5 text-center text-sm opacity-60">
          <Music2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
          {lang === 'fa' ? 'فایل صوتی موجود نیست' : 'No audio file available'}
        </div>
      )}
    </div>
  );
}
