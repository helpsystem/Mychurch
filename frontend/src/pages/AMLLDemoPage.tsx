import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import AMLLWorshipPlayer from '../components/AMLLWorshipPlayer';
import { ArrowLeft, Music, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Song {
  id: number;
  title: { fa: string; en: string };
  artist?: { fa?: string; en?: string };
  audioUrl?: string;
  youtubeId?: string;
  albumArt?: string;
  lyrics?: { fa?: string; en?: string };
}

/**
 * Demo page to showcase the Apple Music-Like Lyrics player
 * Access via: /#/amll-demo
 */
const AMLLDemoPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch worship songs list
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch('/worship/data/worship_songs.json');
        if (response.ok) {
          const data = await response.json();
          // Filter songs that have audio URLs
          const songsWithAudio = data.filter((song: Song) => song.audioUrl);
          setSongs(songsWithAudio.slice(0, 20)); // Limit to first 20 songs for demo
        }
      } catch (error) {
        console.error('Failed to fetch songs:', error);
      }
      setIsLoading(false);
    };
    fetchSongs();
  }, []);

  const isRTL = lang === 'fa';

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-indigo-900"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            to="/"
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>{lang === 'fa' ? 'بازگشت' : 'Back'}</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Sparkles className="text-purple-400" size={24} />
            <h1 className="text-xl font-bold text-white">
              {lang === 'fa' ? 'پخش‌کننده کاریوکه AMLL' : 'AMLL Karaoke Player'}
            </h1>
          </div>

          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {selectedSong ? (
          /* Player View */
          <div className="space-y-6">
            {/* Back to song list */}
            <button
              onClick={() => setSelectedSong(null)}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft size={18} />
              <span>{lang === 'fa' ? 'بازگشت به لیست' : 'Back to list'}</span>
            </button>

            {/* AMLL Player */}
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <AMLLWorshipPlayer
                audioUrl={selectedSong.audioUrl || ''}
                songId={selectedSong.id}
                title={selectedSong.title[lang as 'fa' | 'en'] || selectedSong.title.fa}
                artist={selectedSong.artist?.[lang as 'fa' | 'en'] || selectedSong.artist?.fa || ''}
                albumArt={selectedSong.albumArt}
                youtubeId={selectedSong.youtubeId}
                lang={lang as 'fa' | 'en'}
                lyrics={selectedSong.lyrics?.[lang as 'fa' | 'en'] || selectedSong.lyrics?.fa}
                onClose={() => setSelectedSong(null)}
                showControls={true}
                className="w-full"
              />
            </div>

            {/* Song Info */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-2">
                {selectedSong.title[lang as 'fa' | 'en'] || selectedSong.title.fa}
              </h2>
              {selectedSong.artist && (
                <p className="text-white/60">
                  {selectedSong.artist[lang as 'fa' | 'en'] || selectedSong.artist.fa}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                  {lang === 'fa' ? 'سینک کلمه به کلمه' : 'Word-by-word sync'}
                </span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                  {lang === 'fa' ? 'انیمیشن اپل میوزیک' : 'Apple Music animation'}
                </span>
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                  {lang === 'fa' ? 'پشتیبانی فارسی' : 'Persian RTL support'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Song List View */
          <div className="space-y-8">
            {/* Introduction */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                <Sparkles className="text-white" size={40} />
              </div>
              <h1 className="text-4xl font-bold text-white">
                {lang === 'fa' ? 'پخش‌کننده کاریوکه AMLL' : 'Apple Music-Like Lyrics'}
              </h1>
              <p className="text-xl text-white/60 max-w-2xl mx-auto">
                {lang === 'fa' 
                  ? 'تجربه پخش آهنگ‌های پرستشی با سینک کلمه به کلمه و انیمیشن زیبای اپل میوزیک'
                  : 'Experience worship songs with word-by-word sync and beautiful Apple Music-style animations'}
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                  <Music className="text-purple-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {lang === 'fa' ? 'سینک دقیق' : 'Precise Sync'}
                </h3>
                <p className="text-white/60 text-sm">
                  {lang === 'fa' 
                    ? 'هر کلمه دقیقاً با صدا همگام می‌شود'
                    : 'Each word syncs precisely with the audio'}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-4">
                  <Sparkles className="text-pink-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {lang === 'fa' ? 'انیمیشن فیزیکی' : 'Physics Animation'}
                </h3>
                <p className="text-white/60 text-sm">
                  {lang === 'fa' 
                    ? 'حرکت روان با الگوریتم فنری'
                    : 'Smooth spring-based scrolling animation'}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                  <span className="text-blue-400 font-bold text-lg">ف</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {lang === 'fa' ? 'فینگلیش' : 'Finglish'}
                </h3>
                <p className="text-white/60 text-sm">
                  {lang === 'fa' 
                    ? 'نمایش تلفظ فارسی با حروف لاتین'
                    : 'Persian pronunciation in Latin letters'}
                </p>
              </div>
            </div>

            {/* Song Grid */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                {lang === 'fa' ? 'یک آهنگ انتخاب کنید' : 'Select a Song'}
              </h2>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                </div>
              ) : songs.length === 0 ? (
                <div className="text-center py-20 text-white/60">
                  <Music size={48} className="mx-auto mb-4 opacity-50" />
                  <p>{lang === 'fa' ? 'آهنگی یافت نشد' : 'No songs found'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {songs.map((song) => (
                    <button
                      key={song.id}
                      onClick={() => setSelectedSong(song)}
                      className="group bg-white/5 hover:bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/10 hover:border-purple-500/50 transition-all text-left"
                    >
                      <div className="aspect-square rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 mb-4 flex items-center justify-center overflow-hidden">
                        {song.albumArt ? (
                          <img 
                            src={song.albumArt} 
                            alt={song.title.fa}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Music className="text-white/50" size={48} />
                        )}
                      </div>
                      <h3 className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                        {song.title[lang as 'fa' | 'en'] || song.title.fa}
                      </h3>
                      {song.artist && (
                        <p className="text-sm text-white/50 truncate">
                          {song.artist[lang as 'fa' | 'en'] || song.artist.fa}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-1">
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                          #{song.id}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-white/40 text-sm">
        <p>
          {lang === 'fa' 
            ? 'ساخته شده با ❤️ برای کلیسای ایرانیان واشنگتن'
            : 'Built with ❤️ for Iranian Christian Church DC'}
        </p>
        <p className="mt-1">
          Powered by{' '}
          <a 
            href="https://github.com/amll-dev/applemusic-like-lyrics" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300"
          >
            AMLL
          </a>
        </p>
      </footer>
    </div>
  );
};

export default AMLLDemoPage;
