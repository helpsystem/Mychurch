import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { HIDRIVE_PUBLIC_URL } from '../lib/constants';
import { Play, Pause, Music, Volume2, Captions } from 'lucide-react';
import WorshipKaraokeView from '../components/WorshipKaraokeView';

interface WordTiming {
  word: string;
  start: number;
  end: number;
  index: number;
  isRepeat?: boolean;
}

interface SongData {
  id: number;
  title: string;
  artist: string;
  audioUrl: string;
  lyrics: string;
}

const WorshipSongViewerPage: React.FC = () => {
  const { id } = useParams();
  const [song, setSong] = useState<SongData | null>(null);
  const [timings, setTimings] = useState<WordTiming[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasAudio, setHasAudio] = useState(false);
  const [viewMode, setViewMode] = useState<'lyrics' | 'karaoke'>('lyrics');
  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSong();
    loadTimings();
  }, [id]);

  useEffect(() => {
    if (song?.audioUrl) {
      // Check if it's a valid URL (basic check)
      setHasAudio(song.audioUrl.length > 5 && !song.audioUrl.includes('undefined'));
    }
  }, [song]);

  const loadSong = async () => {
    try {
      // In a real app, fetch song details from API or JSON
      const response = await fetch(`/worship/data/worship_songs.json`);
      if (response.ok) {
        const songs = await response.json();
        const foundSong = songs.find((s: any) => s.id.toString() === id);
        if (foundSong) {
          setSong({
            id: foundSong.id,
            title: foundSong.title_fa,
            artist: foundSong.artist_fa || 'ناشناس',
            audioUrl: foundSong.audio_file ? `/worship/audio/${foundSong.audio_file}` : '',
            lyrics: foundSong.lyrics
          });
          return;
        }
      }

      // Fallback / Mock Data with User's Example
      setSong({
        id: 1,
        title: 'آنقدر مات و مبهوت',
        artist: 'ناشناس',
        audioUrl: '', // Example with no audio to test handling
        lyrics: `V1
آنـ[Dm]ـقدر مـات و مـ[Am]ـبهوت از
عـشقـت مـ[C]ـحبوبم سرمستـ[Bb]ـم
کـه[Dm] از خـود بی‌[Am]خــود شـده
چون بـه آ[C]غـوشـت پـیـوسـ[Bb]ــتـم   [Dm]
Pre-Chorus
مر[F]ا به عمق‌ها[C]ی قلب پرمهر[Bb]ت می‌کشا[Dm]نی
سر[F]ودی تاز[C]ه در وصف فرز[Bb]ند خود می‌خوا[Dm]نی
Chorus
اَبـ[Bb]ــا مـن از آ[C]ن تـو هستــم[F]
[column]
V2
رو[Dm]ح و جانم آر[Am]ام است وقتی آ[C]وایت به گوش آ[Bb]ید
سر[Dm]ودهای رضا[Am]یت که بهر [C]فرزندت می‌خو[Bb]انی  [Dm]
Pre-Chorus
Chorus
Bridge
تنها[Dm] بهر خا[Am]لق در [Bb]ابــتــدا[C] خلق شد[Dm]م
تنها[Dm] در آغو[Am]شش از بی‌[Bb]قراری [C]آزاد شد[Dm]م`
      });
    } catch (error) {
      console.error('Error loading song:', error);
    }
  };

  const loadTimings = async () => {
    try {
      const response = await fetch(`/worship/data/timings/song_${id}_timing.json`);
      if (response.ok) {
        const data = await response.json();
        setTimings(data.words || []);
      }
    } catch (error) {
      // console.log('No timing data available');
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;

    const time = audioRef.current.currentTime;
    setCurrentTime(time);
    setDuration(audioRef.current.duration || 0);

    if (timings.length > 0) {
      const index = timings.findIndex(
        (timing) => time >= timing.start && time < timing.end
      );

      if (index !== -1 && index !== currentWordIndex) {
        setCurrentWordIndex(index);
        scrollToActiveLine(index);
      }
    }
  };

  const scrollToActiveLine = (index: number) => {
    const element = document.getElementById(`word-${index}`);
    if (element && lyricsContainerRef.current) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Helper to parse lyrics line into segments (chord + text)
  const parseLine = (line: string) => {
    // Regex to match chords like [C], [Gm/D], etc.
    const parts = line.split(/(\[[A-G][#b]?m?\d?[\/]?[A-G]?[#b]?\])/g);
    return parts.filter(p => p).map(part => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return { type: 'chord', content: part.slice(1, -1) };
      }
      return { type: 'text', content: part };
    });
  };

  const renderLyricsColumn = (text: string, colIndex: number) => {
    return (
      <div key={colIndex} className="flex-1 min-w-[300px]">
        {text.split('\n').map((line, lineIndex) => {
          // Skip empty lines but keep spacing
          if (!line.trim()) return <div key={lineIndex} className="h-6" />;

          // Check if line is a section header (V1, Chorus, etc.)
          if (/^(V\d+|Chorus|Bridge|Intro|Outro|Pre-Chorus)/i.test(line.trim())) {
            return (
              <div key={lineIndex} className="text-sm font-bold text-blue-400 uppercase tracking-widest mt-6 mb-3 border-b border-blue-500/30 pb-1 w-fit">
                {line}
              </div>
            );
          }

          const segments = parseLine(line);

          return (
            <div key={lineIndex} className="relative leading-[3rem] text-lg md:text-xl font-medium text-gray-200 hover:text-white transition-colors duration-300 flex flex-wrap items-end">
              {segments.map((segment, segIndex) => {
                if (segment.type === 'chord') {
                  return (
                    <span key={segIndex} className="relative mx-0.5 h-full flex flex-col justify-end group">
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-sm font-bold text-yellow-500 opacity-90 group-hover:opacity-100 transition-opacity whitespace-nowrap dir-ltr">
                        {segment.content}
                      </span>
                    </span>
                  );
                } else {
                  return (
                    <span key={segIndex} className="whitespace-pre">
                      {segment.content}
                    </span>
                  );
                }
              })}
            </div>
          );
        })}
      </div>
    );
  };

  if (!song) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white text-xl">در حال بارگذاری سرود...</div>
        </div>
      </div>
    );
  }

  const lyricColumns = song.lyrics.split('[column]');

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white pb-20 font-sans">
      {hasAudio && (
        <audio
          ref={audioRef}
          src={song.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        />
      )}

      {/* Header / Player Section */}
      <div className="sticky top-0 z-50 bg-[#16213e]/95 backdrop-blur-md border-b border-white/10 shadow-2xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center text-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              {song.title}
            </h1>
            <p className="text-base text-gray-400 flex items-center gap-2">
              <Music size={16} />
              {song.artist}
            </p>
          </div>

          {/* View Mode Toggle - Only show if timing data exists */}
          {timings.length > 0 && hasAudio && (
            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={() => setViewMode('lyrics')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${viewMode === 'lyrics'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-[#0f3460] text-gray-400 hover:text-white'
                  }`}
              >
                <Music size={18} />
                نمای متن
              </button>
              <button
                onClick={() => setViewMode('karaoke')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${viewMode === 'karaoke'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-[#0f3460] text-gray-400 hover:text-white'
                  }`}
              >
                <Captions size={18} />
                نمای کارائوکه
              </button>
            </div>
          )}

          {/* Player Controls - LTR Direction */}
          {hasAudio ? (
            <div className="max-w-2xl mx-auto bg-[#0f3460] rounded-xl p-4 shadow-lg border border-white/5" dir="ltr">
              <div className="flex flex-col gap-3">
                {/* Progress Bar */}
                <div className="flex items-center gap-3 text-xs font-mono text-blue-300">
                  <span>{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-1.5 bg-[#1a1a2e] rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                  />
                  <span>{formatTime(duration)}</span>
                </div>

                {/* Buttons */}
                <div className="flex justify-center items-center gap-6">
                  <button
                    className="text-gray-400 hover:text-white transition-colors p-2"
                    onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10; }}
                    title="-10s"
                  >
                    <span className="text-xs">-10s</span>
                  </button>

                  <button
                    onClick={handlePlayPause}
                    className={`
                                  w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg
                                  ${isPlaying
                        ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
                        : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30'}
                              `}
                  >
                    {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" className="ml-1" />}
                  </button>

                  <button
                    className="text-gray-400 hover:text-white transition-colors p-2"
                    onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10; }}
                    title="+10s"
                  >
                    <span className="text-xs">+10s</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg max-w-md mx-auto">
              <p className="text-yellow-200 text-sm flex items-center justify-center gap-2">
                <Volume2 size={16} />
                فایل صوتی برای این سرود موجود نیست
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content Display - Conditional based on view mode */}
      {viewMode === 'karaoke' && timings.length > 0 ? (
        <WorshipKaraokeView
          songId={parseInt(id || '0')}
          currentTime={currentTime}
          isPlaying={isPlaying}
        />
      ) : (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div
            ref={lyricsContainerRef}
            className="flex flex-wrap gap-8 justify-center"
            dir="rtl"
          >
            {lyricColumns.map((colText, index) => renderLyricsColumn(colText, index))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorshipSongViewerPage;
