import React, { useState, useEffect } from 'react';
import KaraokeWorshipPlayer from '../components/KaraokeWorshipPlayer';
import { useLanguage } from '../hooks/useLanguage';
import { ArrowLeft, Music, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SongData {
  id: number;
  title: {
    fa: string;
    en?: string;
  };
  artist?: {
    fa?: string;
    en?: string;
  };
  audioUrl?: string;
  youtubeId?: string;
}

const KaraokeTestPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [songs, setSongs] = useState<SongData[]>([]);
  const [selectedSong, setSelectedSong] = useState<SongData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load songs from the worship songs JSON
    const loadSongs = async () => {
      try {
        const response = await fetch('/worship/data/worship_songs.json');
        if (response.ok) {
          const data = await response.json();
          setSongs(data);
          // Default to song 2 for testing (has good timing data)
          const defaultSong = data.find((s: SongData) => s.id === 2);
          if (defaultSong) {
            setSelectedSong(defaultSong);
          }
        }
      } catch (error) {
        console.error('Failed to load songs:', error);
      }
      setLoading(false);
    };
    loadSongs();
  }, []);

  const isRTL = lang === 'fa';

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: isRTL ? 'Vazirmatn, IRANSans, Tahoma, sans-serif' : 'inherit' }}
    >
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Music className="text-emerald-400" />
              {lang === 'fa' ? 'پخش کننده کارائوکه سرودها' : 'Karaoke Worship Player'}
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Song List */}
          <div className="lg:col-span-1 bg-black/30 rounded-2xl p-4 backdrop-blur-md border border-white/10 max-h-[600px] overflow-y-auto">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Music size={18} className="text-emerald-400" />
              {lang === 'fa' ? 'لیست سرودها' : 'Song List'}
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-2">
                {songs.slice(0, 50).map((song) => (
                  <button
                    key={song.id}
                    onClick={() => setSelectedSong(song)}
                    className={`w-full text-${isRTL ? 'right' : 'left'} p-3 rounded-lg transition-all ${
                      selectedSong?.id === song.id
                        ? 'bg-emerald-500/30 border border-emerald-400/50'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full text-sm text-white/70">
                        {song.id}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-white font-medium truncate ${selectedSong?.id === song.id ? 'text-emerald-300' : ''}`}>
                          {song.title?.fa || song.title?.en || `Song ${song.id}`}
                        </p>
                        {song.artist && (
                          <p className="text-white/50 text-sm truncate">
                            {song.artist?.fa || song.artist?.en}
                          </p>
                        )}
                      </div>
                      {selectedSong?.id === song.id && (
                        <Play size={16} className="text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Player */}
          <div className="lg:col-span-2">
            {selectedSong ? (
              <KaraokeWorshipPlayer
                audioUrl={selectedSong.audioUrl || `/worship/audio/${selectedSong.id}.mp3`}
                songId={selectedSong.id}
                title={selectedSong.title?.fa || selectedSong.title?.en || `Song ${selectedSong.id}`}
                artist={selectedSong.artist?.fa || selectedSong.artist?.en}
                youtubeId={selectedSong.youtubeId}
                lang={lang}
                className="shadow-2xl"
              />
            ) : (
              <div className="bg-black/30 rounded-2xl p-8 backdrop-blur-md border border-white/10 min-h-[500px] flex items-center justify-center">
                <div className="text-center text-white/50">
                  <Music size={64} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg">
                    {lang === 'fa' ? 'یک سرود انتخاب کنید' : 'Select a song to play'}
                  </p>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="mt-6 bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-4">
              <h3 className="text-emerald-400 font-semibold mb-2">
                {lang === 'fa' ? '📝 راهنما' : '📝 Instructions'}
              </h3>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• {lang === 'fa' ? 'روی هر خط کلیک کنید تا به آن قسمت برود' : 'Click on any line to jump to that part'}</li>
                <li>• {lang === 'fa' ? 'کلمه‌ای که در حال پخش است با رنگ سبز مشخص می‌شود' : 'The word being sung is highlighted in green'}</li>
                <li>• {lang === 'fa' ? 'از تنظیمات می‌توانید فینگلیش را روشن/خاموش کنید' : 'Use settings to toggle Finglish on/off'}</li>
                <li>• {lang === 'fa' ? 'برای حالت تمام صفحه روی آیکون کلیک کنید' : 'Click the fullscreen icon for immersive mode'}</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default KaraokeTestPage;
