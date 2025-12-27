import React, { useState, useMemo } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useContent } from '../hooks/useContent';
import { Music, Search, Filter, Play, ExternalLink, List, Grid, Download, FileText, Presentation, Music2, Mic, PlayCircle, Shuffle } from 'lucide-react';
import UniversalMediaPlayer from './UniversalMediaPlayer';
import EnhancedMediaPlayer from './EnhancedMediaPlayer';
import LocalAudioPlayerWithSyncedLyrics from './LocalAudioPlayerWithSyncedLyrics';
import { WorshipSong } from '../types';
import { useAudioPlayer, Song } from '../contexts/AudioPlayerContext';

// Helper function to strip chord notations and verse markers from lyrics
const stripChords = (text: string): string => {
  if (!text) return '';
  return text
    // Remove chord patterns like [Am], [Dm7], [Bb], [G#m], etc.
    .replace(/\[[A-Ga-g][#b]?[a-zA-Z0-9\/]*\]/g, '')
    // Remove verse markers like V1, V2, V3, Verse 1, etc.
    .replace(/\b[Vv]\d+\b/g, '')
    .replace(/\bVerse\s*\d*\b/gi, '')
    // Remove Chorus, Bridge, Pre-Chorus, Outro, Intro markers
    .replace(/\b(Chorus|Bridge|Pre-Chorus|Outro|Intro|Verse)\s*(\(\d+\)|\(\d*x\d*\))?/gi, '')
    // Remove (x2) style repeat markers
    .replace(/\([x×]\d+\)/gi, '')
    .replace(/\(\d+x\)/gi, '')
    // Remove [column] markers
    .replace(/\[column\]/gi, '')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

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

  // Global Audio Player Context
  const {
    playSong: playGlobalSong,
    playAll: playAllGlobal,
    currentSong: globalCurrentSong,
    isPlaying: globalIsPlaying
  } = useAudioPlayer();

  // Karaoke Mode State
  const [showKaraokeMode, setShowKaraokeMode] = useState(false);
  const [karaokeSong, setKaraokeSong] = useState<WorshipSong | null>(null);

  // Alphabetical Filter State
  const [activeLetterFilter, setActiveLetterFilter] = useState<string | null>(null);

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

  // 🔤 Sort songs alphabetically
  const sortedSongs = useMemo(() => {
    return [...content.worshipSongs].sort((a, b) => {
      const titleA = (a.title?.[lang] || a.title?.fa || a.title?.en || '').trim();
      const titleB = (b.title?.[lang] || b.title?.fa || b.title?.en || '').trim();
      return titleA.localeCompare(titleB, lang === 'fa' ? 'fa' : 'en');
    });
  }, [content.worshipSongs, lang]);

  // 🔤 Extract first letters of songs
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    sortedSongs.forEach(song => {
      const title = (song.title?.[lang] || song.title?.fa || song.title?.en || '').trim();
      if (title) {
        letters.add(title[0].toUpperCase());
      }
    });
    return Array.from(letters).sort((a, b) => a.localeCompare(b, lang === 'fa' ? 'fa' : 'en'));
  }, [sortedSongs, lang]);

  // 🆕 Newest songs (last 5)
  const newestSongs = useMemo(() => {
    return sortedSongs.slice(-5).reverse();
  }, [sortedSongs]);

  // Filter songs based on search, artist, and letter selection
  const filteredSongs = useMemo(() => {
    return sortedSongs.filter(song => {
      const matchesSearch = song.title[lang].toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesArtist = selectedArtist === 'all' || song.artist === selectedArtist;
      const title = (song.title?.[lang] || song.title?.fa || song.title?.en || '').trim();
      const matchesLetter = !activeLetterFilter || title[0]?.toUpperCase() === activeLetterFilter;
      return matchesSearch && matchesArtist && matchesLetter;
    });
  }, [sortedSongs, searchTerm, selectedArtist, lang, activeLetterFilter]);

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
      // Use global audio player for Play All
      const songsForPlayer: Song[] = filteredSongs
        .filter(s => s.audioUrl)
        .map(song => ({
          id: song.id,
          title: song.title[lang] || song.title.fa,
          artist: song.artist,
          audioUrl: song.audioUrl!,
          thumbnail: song.youtubeId ? `https://img.youtube.com/vi/${song.youtubeId}/default.jpg` : undefined,
          lyrics: song.lyrics?.[lang] || song.lyrics?.fa,
          youtubeId: (song as any).youtubeId,
        }));

      if (songsForPlayer.length > 0) {
        playAllGlobal(songsForPlayer, false);
      }
    }
  };

  // Quick play from card - uses global player
  const handleQuickPlay = (song: WorshipSong) => {
    if (!song.audioUrl) return;

    const songForPlayer: Song = {
      id: song.id,
      title: song.title[lang] || song.title.fa,
      artist: song.artist,
      audioUrl: song.audioUrl,
      thumbnail: song.youtubeId ? `https://img.youtube.com/vi/${song.youtubeId}/default.jpg` : undefined,
      lyrics: song.lyrics?.[lang] || song.lyrics?.fa,
      youtubeId: (song as any).youtubeId,
    };

    playGlobalSong(songForPlayer);
  };

  // Play All with Shuffle
  const handlePlayAllShuffle = () => {
    if (filteredSongs.length > 0) {
      const songsForPlayer: Song[] = filteredSongs
        .filter(s => s.audioUrl)
        .map(song => ({
          id: song.id,
          title: song.title[lang] || song.title.fa,
          artist: song.artist,
          audioUrl: song.audioUrl!,
          thumbnail: song.youtubeId ? `https://img.youtube.com/vi/${song.youtubeId}/default.jpg` : undefined,
          lyrics: song.lyrics?.[lang] || song.lyrics?.fa,
          youtubeId: (song as any).youtubeId,
        }));

      if (songsForPlayer.length > 0) {
        playAllGlobal(songsForPlayer, true); // true = shuffle
      }
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

  // Open Karaoke Mode with word-by-word highlighting
  const openKaraoke = (song: WorshipSong) => {
    setKaraokeSong(song);
    setShowKaraokeMode(true);
  };

  const handleKalamehArchive = () => {
    window.open('https://www.kalameh.com/song-archive', '_blank');
  };

  const SongCard: React.FC<{ song: WorshipSong }> = ({ song }) => {
    // Check if this song is currently playing
    const isCurrentlyPlaying = globalCurrentSong?.id === song.id && globalIsPlaying;
    const isCurrentSong = globalCurrentSong?.id === song.id;

    return (
      <div className={`bg-black-gradient rounded-[20px] p-6 text-white hover:scale-105 transition-all duration-300 interactive-card relative ${isCurrentSong ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-900' : ''}`}>
        {/* Now Playing Indicator */}
        {isCurrentlyPlaying && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg animate-pulse">
            <div className="flex items-center gap-0.5">
              <div className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>در حال پخش</span>
          </div>
        )}

        {/* Paused indicator */}
        {isCurrentSong && !globalIsPlaying && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-gray-600 px-3 py-1.5 rounded-full text-xs font-semibold">
            <span>⏸️</span>
            <span>متوقف</span>
          </div>
        )}

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
              <div className={`absolute inset-0 flex items-center justify-center ${isCurrentlyPlaying ? 'bg-purple-600/60' : 'bg-black/40'}`}>
                {isCurrentlyPlaying ? (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-8 bg-white rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                    <div className="w-1.5 h-5 bg-white rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                    <div className="w-1.5 h-7 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <Play size={24} className="text-white opacity-80" />
                )}
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

            {/* Karaoke Mode Button */}
            {song.audioUrl && (
              <button
                onClick={() => openKaraoke(song)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg transition-all text-sm font-medium shadow-lg shadow-purple-500/30"
                title={lang === 'fa' ? 'حالت متن زنده' : 'Live Text Mode'}
              >
                <Mic size={16} />
                <span>{lang === 'fa' ? 'متن زنده' : 'Live Text'}</span>
              </button>
            )}
          </div>

          {/* Download Files Section */}
          {((song as any).presentationFileUrl || (song as any).pdfFileUrl || (song as any).sheetMusicUrl) && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-xs text-dimWhite mb-2">{lang === 'fa' ? 'فایل‌های قابل دانلود:' : 'Downloadable Files:'}</p>
              <div className="flex gap-2 flex-wrap">
                {(song as any).presentationFileUrl && (
                  <a
                    href={(song as any).presentationFileUrl}
                    download
                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors text-xs"
                  >
                    <Presentation size={14} />
                    <span>PowerPoint</span>
                  </a>
                )}

                {(song as any).pdfFileUrl && (
                  <a
                    href={(song as any).pdfFileUrl}
                    download
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-xs"
                  >
                    <FileText size={14} />
                    <span>PDF</span>
                  </a>
                )}

                {(song as any).sheetMusicUrl && (
                  <a
                    href={(song as any).sheetMusicUrl}
                    download
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-xs"
                  >
                    <Music2 size={14} />
                    <span>{lang === 'fa' ? 'نت موسیقی' : 'Sheet Music'}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Lyrics Preview */}
          {song.lyrics && song.lyrics[lang] && (
            <div className="mt-3 p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-dimWhite leading-relaxed line-clamp-3">
                {stripChords(song.lyrics[lang]).slice(0, 120)}...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

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

        {/* Karaoke Button */}
        {song.audioUrl && (
          <button
            onClick={() => openKaraoke(song)}
            className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full transition-all shadow-lg shadow-purple-500/30"
            title={lang === 'fa' ? 'حالت متن زنده' : 'Live Text Mode'}
          >
            <Mic size={16} />
          </button>
        )}

        {song.youtubeId && (
          <button
            onClick={() => window.open(`https://www.youtube.com/watch?v=${song.youtubeId}`, '_blank')}
            className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
          >
            <ExternalLink size={16} />
          </button>
        )}

        {/* Download Files Dropdown */}
        {((song as any).presentationFileUrl || (song as any).pdfFileUrl || (song as any).sheetMusicUrl) && (
          <div className="relative group">
            <button className="p-2 bg-green-600 hover:bg-green-700 rounded-full transition-colors">
              <Download size={16} />
            </button>
            <div className="absolute left-0 top-full mt-2 bg-black-gradient border border-white/10 rounded-lg shadow-lg hidden group-hover:block z-10 min-w-[150px]">
              {(song as any).presentationFileUrl && (
                <a
                  href={(song as any).presentationFileUrl}
                  download
                  className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-sm whitespace-nowrap"
                >
                  <Presentation size={14} />
                  <span>PowerPoint</span>
                </a>
              )}
              {(song as any).pdfFileUrl && (
                <a
                  href={(song as any).pdfFileUrl}
                  download
                  className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-sm whitespace-nowrap"
                >
                  <FileText size={14} />
                  <span>PDF</span>
                </a>
              )}
              {(song as any).sheetMusicUrl && (
                <a
                  href={(song as any).sheetMusicUrl}
                  download
                  className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-sm whitespace-nowrap"
                >
                  <Music2 size={14} />
                  <span>{lang === 'fa' ? 'نت' : 'Sheet'}</span>
                </a>
              )}
            </div>
          </div>
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

        {/* 🔤 Horizontal Alphabet Navigator */}
        {availableLetters.length > 0 && (
          <div className="sticky top-0 z-40 bg-gradient-to-b from-primary via-primary/95 to-transparent backdrop-blur-lg py-4 px-4 mb-8 border-b border-purple-500/30 shadow-xl rounded-xl">
            <div className="max-w-7xl mx-auto">
              {/* عنوان */}
              <div className="text-center text-xs font-bold text-gray-400 mb-3 tracking-widest">
                {lang === 'fa' ? '🔤 فهرست الفبایی سرودها' : '🔤 ALPHABETICAL INDEX'}
              </div>

              {/* لیست حروف */}
              <div className="flex flex-wrap justify-center items-center gap-2">
                {/* دکمه # برای جدیدترین */}
                <button
                  onClick={() => setActiveLetterFilter(activeLetterFilter === '#' ? null : '#')}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${activeLetterFilter === '#'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/40 scale-110'
                      : 'bg-black-gradient text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  title={lang === 'fa' ? 'جدیدترین سرودها' : 'Newest Songs'}
                >
                  #
                </button>

                {/* حروف الفبا */}
                {availableLetters.map(letter => (
                  <button
                    key={letter}
                    onClick={() => setActiveLetterFilter(activeLetterFilter === letter ? null : letter)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${activeLetterFilter === letter
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/40 scale-110'
                        : 'bg-black-gradient text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                  >
                    {letter}
                  </button>
                ))}

                {/* دکمه پاک کردن فیلتر */}
                {activeLetterFilter && (
                  <button
                    onClick={() => setActiveLetterFilter(null)}
                    className="px-4 py-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium"
                  >
                    {lang === 'fa' ? '✕ حذف فیلتر' : '✕ Clear'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Newest Songs Section (when # is selected) */}
        {activeLetterFilter === '#' && newestSongs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-green-400">🆕</span>
              {lang === 'fa' ? 'جدیدترین سرودها' : 'Newest Songs'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {newestSongs.map((song, index) => (
                <div key={song.id} className="reveal-on-scroll" style={{ transitionDelay: `${index * 100}ms` }}>
                  <SongCard song={song} />
                </div>
              ))}
            </div>
          </div>
        )}

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
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-gradient text-primary' : 'text-gray-400 hover:text-white'
                }`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-gradient text-primary' : 'text-gray-400 hover:text-white'
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
              <div key={song.id} className="reveal-on-scroll" style={{ transitionDelay: `${index * 100}ms` }}>
                <SongCard song={song} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSongs.map((song, index) => (
              <div key={song.id} className="reveal-on-scroll" style={{ transitionDelay: `${index * 50}ms` }}>
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

      {/* Fullscreen Karaoke Mode Modal */}
      {showKaraokeMode && karaokeSong && (
        <div className="fixed inset-0 z-50 bg-black/95 overflow-auto">
          {/* Close Button */}
          <button
            onClick={() => setShowKaraokeMode(false)}
            className="fixed top-4 right-4 z-60 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
            title={lang === 'fa' ? 'بستن' : 'Close'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Karaoke Player */}
          <div className="flex items-center justify-center min-h-screen p-4">
            <LocalAudioPlayerWithSyncedLyrics
              audioUrl={karaokeSong.audioUrl || ''}
              lyrics={karaokeSong.lyrics?.[lang] || karaokeSong.lyrics?.fa || ''}
              originalLyricsWithChords={karaokeSong.lyrics?.fa || karaokeSong.lyrics?.[lang] || ''}
              title={karaokeSong.title[lang]}
              artist={karaokeSong.artist}
              lang={lang}
              songId={karaokeSong.id}
              showChords={true}
              youtubeId={(karaokeSong as any).youtubeId}
              onClose={() => setShowKaraokeMode(false)}
            />
          </div>
        </div>
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