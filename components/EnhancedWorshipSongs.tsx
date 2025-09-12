import React, { useState, useMemo } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useContent } from '../hooks/useContent';
import { Music, Search, Filter, Play, ExternalLink, List, Grid } from 'lucide-react';
import UniversalMediaPlayer from './UniversalMediaPlayer';
import EnhancedMediaPlayer from './EnhancedMediaPlayer';
import { WorshipSong } from '../types';

type MediaItem = {
  id: number;
  title: { en: string; fa: string };
  artist?: string;
  audioUrl?: string;
  videoUrl?: string;
  duration?: number;
  type: 'song';
  lyrics?: { en: string; fa: string };
};

const EnhancedWorshipSongs: React.FC = () => {
  const { t, lang } = useLanguage();
  const { content } = useContent();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArtist, setSelectedArtist] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [currentSong, setCurrentSong] = useState<MediaItem | null>(null);
  const [currentPlaylist, setCurrentPlaylist] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Convert WorshipSong to MediaItem
  const convertToMediaItem = (song: WorshipSong): MediaItem => ({
    id: song.id,
    title: song.title,
    artist: song.artist,
    audioUrl: song.audioUrl,
    videoUrl: song.videoUrl,
    type: 'song',
    lyrics: song.lyrics
  });

  // Filter songs based on search and artist selection
  const filteredSongs = useMemo(() => {
    return content.worshipSongs.filter(song => {
      const matchesSearch = song.title[lang].toLowerCase().includes(searchTerm.toLowerCase()) ||
                           song.artist.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesArtist = selectedArtist === 'all' || song.artist === selectedArtist;
      return matchesSearch && matchesArtist;
    });
  }, [content.worshipSongs, searchTerm, selectedArtist, lang]);

  // Get unique artists for filter
  const artists = useMemo(() => {
    const artistSet = new Set(content.worshipSongs.map(song => song.artist));
    return Array.from(artistSet).sort();
  }, [content.worshipSongs]);

  const handlePlaySong = (song: WorshipSong, showFull = false) => {
    const mediaItem = convertToMediaItem(song);
    const playlist = filteredSongs.map(convertToMediaItem);
    const index = playlist.findIndex(item => item.id === song.id);

    setCurrentSong(mediaItem);
    setCurrentPlaylist(playlist);
    setCurrentIndex(index);
    
    if (showFull) {
      setShowFullPlayer(true);
    }
  };

  const handlePlayAll = () => {
    if (filteredSongs.length > 0) {
      const playlist = filteredSongs.map(convertToMediaItem);
      setCurrentSong(playlist[0]);
      setCurrentPlaylist(playlist);
      setCurrentIndex(0);
      setShowFullPlayer(true);
    }
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % currentPlaylist.length;
    setCurrentIndex(nextIndex);
    setCurrentSong(currentPlaylist[nextIndex]);
  };

  const handlePrevious = () => {
    const prevIndex = currentIndex === 0 ? currentPlaylist.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setCurrentSong(currentPlaylist[prevIndex]);
  };

  const handlePlaylistItemClick = (index: number) => {
    setCurrentIndex(index);
    setCurrentSong(currentPlaylist[index]);
  };

  const handleKalamehArchive = () => {
    window.open('https://www.kalameh.com/song-archive', '_blank');
  };

  const SongCard: React.FC<{ song: WorshipSong }> = ({ song }) => (
    <div className="bg-black-gradient rounded-[20px] p-6 text-white hover:scale-105 transition-all duration-300 interactive-card">
      <div className="mb-4">
        <h3 className="font-semibold text-lg mb-2 leading-tight">{song.title[lang]}</h3>
        <p className="text-dimWhite text-sm mb-2">{song.artist}</p>
        
        {/* YouTube preview if available */}
        {song.youtubeId && (
          <div className="relative mb-3 rounded-lg overflow-hidden">
            <img
              src={`https://img.youtube.com/vi/${song.youtubeId}/mqdefault.jpg`}
              alt={song.title[lang]}
              className="w-full h-32 object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Play size={24} className="text-white opacity-80" />
            </div>
          </div>
        )}
      </div>

      {/* Quick Play Controls */}
      <div className="space-y-3">
        {song.audioUrl && (
          <UniversalMediaPlayer
            item={convertToMediaItem(song)}
            mode="card"
            className="mb-3"
          />
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {(song.audioUrl || song.videoUrl) && (
            <button
              onClick={() => handlePlaySong(song, true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-gradient rounded-lg hover:scale-105 transition-transform text-sm"
            >
              <Play size={16} />
              <span>{t('play')}</span>
            </button>
          )}

          {song.youtubeId && (
            <button
              onClick={() => window.open(`https://www.youtube.com/watch?v=${song.youtubeId}`, '_blank')}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
            >
              <ExternalLink size={16} />
              <span>YouTube</span>
            </button>
          )}
        </div>

        {/* Lyrics Preview */}
        {song.lyrics && song.lyrics[lang] && (
          <div className="mt-3 p-3 bg-white/5 rounded-lg">
            <p className="text-xs text-dimWhite leading-relaxed line-clamp-3">
              {song.lyrics[lang].slice(0, 120)}...
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const SongListItem: React.FC<{ song: WorshipSong }> = ({ song }) => (
    <div className="bg-black-gradient rounded-[15px] p-4 flex items-center gap-4 text-white hover:scale-[1.02] transition-all duration-300">
      {/* Thumbnail */}
      <div className="flex-shrink-0">
        {song.youtubeId ? (
          <img
            src={`https://img.youtube.com/vi/${song.youtubeId}/default.jpg`}
            alt={song.title[lang]}
            className="w-16 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Music size={20} className="opacity-60" />
          </div>
        )}
      </div>

      {/* Song Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-lg truncate mb-1">{song.title[lang]}</h4>
        <p className="text-sm text-dimWhite truncate">{song.artist}</p>
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 flex items-center gap-2">
        <button
          onClick={() => handlePlaySong(song)}
          className="p-3 bg-blue-gradient rounded-full hover:scale-110 transition-transform"
        >
          <Play size={20} />
        </button>
        
        {song.youtubeId && (
          <button
            onClick={() => window.open(`https://www.youtube.com/watch?v=${song.youtubeId}`, '_blank')}
            className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
          >
            <ExternalLink size={16} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-primary">
      <div className="sm:px-16 px-6 sm:py-12 py-4">
        {/* Header */}
        <div className="text-center mb-12 reveal-on-scroll">
          <h1 className="font-semibold text-4xl md:text-5xl text-white mb-4 leading-tight">
            {lang === 'fa' ? 'آرشیو سرودهای مسیحی' : 'Christian Worship Songs'}
          </h1>
          <p className="font-normal text-dimWhite text-lg max-w-3xl mx-auto mb-6">
            {lang === 'fa' 
              ? 'مجموعه کاملی از سرودهای مسیحی فارسی شامل فایل‌های صوتی، ویدیویی و متن سرودها' 
              : 'A complete collection of Persian Christian worship songs including audio, video files and lyrics'
            }
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <button
              onClick={handleKalamehArchive}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-gradient text-primary rounded-[10px] font-medium hover:scale-105 transition-transform"
            >
              <ExternalLink size={20} />
              <span>{lang === 'fa' ? 'مشاهده آرشیو کامل در کلمه' : 'View Full Archive on Kalameh'}</span>
            </button>

            {filteredSongs.length > 0 && (
              <button
                onClick={handlePlayAll}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-gradient text-white rounded-[10px] font-medium hover:scale-105 transition-transform"
              >
                <Play size={20} />
                <span>{t('playAll')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Controls and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8 reveal-on-scroll">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={lang === 'fa' ? 'جستجو سرود یا خواننده...' : 'Search songs or artists...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 rtl:pl-4 rtl:pr-12 pr-4 py-3 bg-black-gradient text-white rounded-[10px] border border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-400"
            />
          </div>

          {/* Artist Filter */}
          <div className="relative">
            <Filter className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedArtist}
              onChange={(e) => setSelectedArtist(e.target.value)}
              className="pl-12 rtl:pl-4 rtl:pr-12 pr-4 py-3 bg-black-gradient text-white rounded-[10px] border border-gray-600 focus:border-blue-500 focus:outline-none min-w-[200px] appearance-none"
            >
              <option value="all">{lang === 'fa' ? 'همه خوانندگان' : 'All Artists'}</option>
              {artists.map(artist => (
                <option key={artist} value={artist}>{artist}</option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-black-gradient rounded-[10px] p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-gradient text-primary' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-blue-gradient text-primary' : 'text-gray-400 hover:text-white'
              }`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 reveal-on-scroll">
          <p className="text-dimWhite">
            {lang === 'fa' 
              ? `${filteredSongs.length} سرود یافت شد` 
              : `${filteredSongs.length} songs found`
            }
          </p>
        </div>

        {/* Songs Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSongs.map((song, index) => (
              <div key={song.id} className="reveal-on-scroll" style={{transitionDelay: `${index * 100}ms`}}>
                <SongCard song={song} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSongs.map((song, index) => (
              <div key={song.id} className="reveal-on-scroll" style={{transitionDelay: `${index * 50}ms`}}>
                <SongListItem song={song} />
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {filteredSongs.length === 0 && (
          <div className="text-center py-12 reveal-on-scroll">
            <Music className="h-24 w-24 text-gray-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-white mb-2">
              {lang === 'fa' ? 'سرودی یافت نشد' : 'No songs found'}
            </h3>
            <p className="text-dimWhite">
              {lang === 'fa' 
                ? 'لطفاً کلمات جستجو یا فیلترها را تغییر دهید' 
                : 'Try adjusting your search terms or filters'
              }
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 bg-black-gradient rounded-[20px] p-8 text-center reveal-on-scroll">
          <div className="max-w-2xl mx-auto text-white">
            <h3 className="text-xl font-semibold mb-4">
              {lang === 'fa' ? 'درباره مجموعه سرودها' : 'About Our Song Collection'}
            </h3>
            <p className="text-dimWhite mb-6 leading-relaxed">
              {lang === 'fa' 
                ? 'این مجموعه شامل سرودهای مسیحی فارسی است که با دقت انتخاب شده‌اند. محتوا از وب‌سایت کلمه ارائه شده و برای استفاده در خدمات و عبادت شخصی در دسترس قرار گرفته است.' 
                : 'This collection features carefully selected Persian Christian worship songs. Content is provided by Kalameh.com and made available for use in services and personal worship.'
              }
            </p>
            <div className="flex justify-center space-x-6 rtl:space-x-reverse text-sm">
              <a 
                href="https://www.kalameh.com/song-archive" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                {lang === 'fa' ? 'آرشیو کامل' : 'Full Archive'}
              </a>
              <span className="text-gray-500">•</span>
              <a 
                href="https://www.kalameh.com/shop" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                {lang === 'fa' ? 'فروشگاه' : 'Shop'}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Media Player */}
      {currentSong && (
        <EnhancedMediaPlayer
          isOpen={showFullPlayer}
          onClose={() => setShowFullPlayer(false)}
          currentItem={currentSong}
          playlist={currentPlaylist}
          currentIndex={currentIndex}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onPlaylistItemClick={handlePlaylistItemClick}
          showLyrics={Boolean(currentSong.lyrics)}
        />
      )}

      {/* Mini Player */}
      {currentSong && !showFullPlayer && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <UniversalMediaPlayer
            item={currentSong}
            playlist={currentPlaylist}
            currentIndex={currentIndex}
            onNext={currentPlaylist.length > 1 ? handleNext : undefined}
            onPrevious={currentPlaylist.length > 1 ? handlePrevious : undefined}
            mode="mini"
            className="shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default EnhancedWorshipSongs;