import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

interface WordTiming {
  word: string;
  start: number;
  end: number;
  index: number;
  isRepeat?: boolean;
}

const WorshipSongViewerPage: React.FC = () => {
  const { id } = useParams();
  const [song, setSong] = useState<any>(null);
  const [timings, setTimings] = useState<WordTiming[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    loadSong();
    loadTimings();
  }, [id]);

  const loadSong = async () => {
    try {
      // برای تست، یک سرود نمونه
      setSong({
        id: 1,
        title: 'الشدای',
        artist: 'فرشید فتحعلیان',
        audioUrl: '/worship/audio/elshaddai.mp3',
        lyrics: `V1
[C]الشدا[Dm]ی الشدا[G]ی ، ال الـ[C]ـیون ادونا[F]ی
نام تو[Bb] در بین ما[E7] ، هم در عـ[Am]ـالــم[B/G] اعلــی[C#/A]
الشدا[Dm]ی خدای ما[G] ، دوست دار[C]یم نام تو ر[F]ا
ای خالـ[Bb]ـق ابدی[G] ، الشدا[C]ی

V2
الشدا[Dm]ی خدای ما[G] ، می‌خوانـ[C]ـیم نام تو ر[F]ا
نام تو[Bb] چه عظیم ا[E7]ست ، ای خد[Am]ای تـ[B/G]ـازه‌هــا[C#/A]
الشدا[Dm]ی خدای ما[G] ، تو خالـ[C]ـق بی‌همتا[F]
ستایـ[Bb]ـیم نام تو ر[G]ا ، الشدا[C]ی`
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
      console.log('No timing data available');
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current || timings.length === 0) return;
    
    const currentTime = audioRef.current.currentTime;
    const index = timings.findIndex(
      (timing) => currentTime >= timing.start && currentTime < timing.end
    );
    
    setCurrentWordIndex(index);
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

  if (!song) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-2xl">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <audio
        ref={audioRef}
        src={song.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2">{song.title}</h1>
          <p className="text-2xl text-purple-200">{song.artist}</p>
        </div>

        {/* Controls */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handlePlayPause}
            className="bg-white text-purple-900 px-8 py-4 rounded-full text-2xl font-bold hover:scale-110 transition-transform shadow-2xl"
          >
            {isPlaying ? '⏸ توقف' : '▶️ پخش'}
          </button>
        </div>

        {/* Lyrics with synced highlighting */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-4xl mx-auto">
          <div className="text-center leading-relaxed text-2xl">
            {song.lyrics.split('\n').map((line: string, lineIndex: number) => {
              // Remove chord markers and verse labels
              let cleanLine = line.replace(/\[([A-G][#b]?m?\d?[\/]?[A-G]?[#b]?)\]/g, '');
              cleanLine = cleanLine.replace(/^(V\d+|Chorus\d*|Bridge|Intro|Outro)$/g, '');
              
              if (!cleanLine.trim()) return <br key={lineIndex} />;

              const words = cleanLine.trim().split(/\s+/);
              
              return (
                <div key={lineIndex} className="mb-4">
                  {words.map((word, wordIndex) => {
                    const globalIndex = lineIndex * 10 + wordIndex; // Simplified index
                    const isActive = currentWordIndex === globalIndex;
                    
                    return (
                      <span
                        key={wordIndex}
                        className={`inline-block mx-2 transition-all duration-200 ${
                          isActive
                            ? 'text-yellow-300 scale-125 font-bold drop-shadow-lg'
                            : 'text-white/80'
                        }`}
                      >
                        {word}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info */}
        {timings.length === 0 && (
          <div className="text-center mt-8 text-purple-200">
            <p>⚠️ تایمینگ کلمات هنوز ثبت نشده است</p>
            <p className="text-sm mt-2">برای تجربه بهتر، لطفاً تایمینگ را ثبت کنید</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorshipSongViewerPage;
