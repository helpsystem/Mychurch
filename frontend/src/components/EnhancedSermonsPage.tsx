import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Play, User, Download, History, Grid, List, Search } from 'lucide-react';
import BilingualDateDisplay from './BilingualDateDisplay';
import UniversalMediaPlayer from './UniversalMediaPlayer';
import EnhancedMediaPlayer from './EnhancedMediaPlayer';
import { Sermon } from '../types';

import { supabase } from '../lib/supabaseClient';

type MediaItem = {
  id: number;
  title: { en: string; fa: string };
  speaker?: string;
  audioUrl?: string;
  videoUrl?: string; // We'll use this for YouTube
  duration?: number;
  type: 'sermon';
  date?: string;
  series?: { en: string; fa: string };
  notesUrl?: string;
};

const EnhancedSermonsPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const [dbSermons, setDbSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch from Supabase
  useEffect(() => {
    const fetchSermons = async () => {
      const { data, error } = await supabase
        .from('sermons')
        .select('*')
        .eq('is_live', false) // Only archives
        .order('date', { ascending: false });

      if (data) {
        // Map DB format to Sermon type
        const mapped: Sermon[] = data.map((s: any) => ({
          id: s.id,
          title: { en: s.title, fa: s.title }, // DB currently has one title, duplicatin for now
          speaker: s.preacher || 'Unknown',
          date: s.date,
          series: undefined, // Fix: null -> undefined to match type definition
          audioUrl: '', // Not strictly using audioUrl for youtube items?
          videoUrl: `https://www.youtube.com/watch?v=${s.youtube_id}`,
          description: { en: s.description || '', fa: s.description || '' },
          duration: 0,
          youtubeId: s.youtube_id
        }));
        setDbSermons(mapped);
      }
      setLoading(false);
    };
    fetchSermons();
  }, []);


  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeries, setSelectedSeries] = useState('all');
  const [selectedSpeaker, setSelectedSpeaker] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [currentSermon, setCurrentSermon] = useState<MediaItem | null>(null);
  const [currentPlaylist, setCurrentPlaylist] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Convert Sermon to MediaItem
  const convertToMediaItem = (sermon: Sermon): MediaItem => ({
    id: sermon.id,
    title: sermon.title,
    speaker: sermon.speaker,
    audioUrl: sermon.audioUrl,
    videoUrl: (sermon as any).videoUrl, // Cast because videoUrl isn't in original Sermon type maybe?
    type: 'sermon',
    date: sermon.date,
    series: sermon.series,
    notesUrl: sermon.notesUrl
  });

  // Filter sermons
  const filteredSermons = useMemo(() => {
    return dbSermons.filter(sermon => {
      const matchesSearch = sermon.title[lang].toLowerCase().includes(searchTerm.toLowerCase()) ||
        sermon.speaker.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeries = selectedSeries === 'all' || (sermon.series && sermon.series[lang] === selectedSeries);
      const matchesSpeaker = selectedSpeaker === 'all' || sermon.speaker === selectedSpeaker;
      return matchesSearch && matchesSeries && matchesSpeaker;
    });
  }, [dbSermons, searchTerm, selectedSeries, selectedSpeaker, lang]);

  // Get unique series and speakers
  const series = useMemo(() => {
    const seriesSet = new Set(dbSermons.filter(s => s.series).map(s => s.series![lang]));
    return Array.from(seriesSet).sort();
  }, [dbSermons, lang]);

  const speakers = useMemo(() => {
    const speakerSet = new Set(dbSermons.map(s => s.speaker));
    return Array.from(speakerSet).sort();
  }, [dbSermons]);

  // Group sermons by series
  const groupedSermons = useMemo(() => {
    return filteredSermons.reduce((acc, sermon) => {
      const seriesTitle = sermon.series ? sermon.series[lang] : t('standaloneSermons') || 'Standalone Sermons';
      if (!acc[seriesTitle]) {
        acc[seriesTitle] = [];
      }
      acc[seriesTitle].push(sermon);
      return acc;
    }, {} as Record<string, Sermon[]>);
  }, [filteredSermons, lang, t]);

  const handlePlaySermon = (sermon: Sermon, showFull = false) => {
    const mediaItem = convertToMediaItem(sermon);
    const playlist = filteredSermons.map(convertToMediaItem);
    const index = playlist.findIndex(item => item.id === sermon.id);

    setCurrentSermon(mediaItem);
    setCurrentPlaylist(playlist);
    setCurrentIndex(index);

    if (showFull) {
      setShowFullPlayer(true);
    }
  };

  const handlePlayAll = () => {
    if (filteredSermons.length > 0) {
      const playlist = filteredSermons.map(convertToMediaItem);
      setCurrentSermon(playlist[0]);
      setCurrentPlaylist(playlist);
      setCurrentIndex(0);
      setShowFullPlayer(true);
    }
  };

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % currentPlaylist.length;
    setCurrentIndex(nextIndex);
    setCurrentSermon(currentPlaylist[nextIndex]);
  };

  const handlePrevious = () => {
    const prevIndex = currentIndex === 0 ? currentPlaylist.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setCurrentSermon(currentPlaylist[prevIndex]);
  };

  const handlePlaylistItemClick = (index: number) => {
    setCurrentIndex(index);
    setCurrentSermon(currentPlaylist[index]);
  };

  const getSavedProgress = (sermonId: number): number | null => {
    const savedTime = localStorage.getItem(`sermon-progress-${sermonId}`);
    return savedTime ? parseFloat(savedTime) : null;
  };

  const formatTime = (time: number): string => {
    if (isNaN(time) || time === 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const SermonCard: React.FC<{ sermon: Sermon }> = ({ sermon }) => {
    const savedTime = getSavedProgress(sermon.id);
    const youtubeId = (sermon as any).youtubeId;

    return (
      <div className="bg-black-gradient p-6 rounded-[20px] text-white hover:scale-[1.02] transition-all duration-300 interactive-card">
        <div className="flex flex-col gap-4">
          {/* Thumbnail */}
          {youtubeId && (
            <div className="aspect-video w-full rounded-xl overflow-hidden relative group">
              <img
                src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                alt={sermon.title[lang]}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={() => handlePlaySermon(sermon, true)} className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                  <Play size={32} fill="white" />
                </button>
              </div>
            </div>
          )}

          {/* Sermon Info */}
          <div className="flex-1">
            <div className="mb-4">
              <h3 className="font-semibold text-xl mb-2 line-clamp-2">{sermon.title[lang]}</h3>
              <div className="flex items-center gap-4 text-sm text-dimWhite mb-2">
                <span className="flex items-center gap-2">
                  <User size={14} />
                  {sermon.speaker}
                </span>
                <BilingualDateDisplay dateStr={sermon.date} />
              </div>

              {sermon.series && (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                  <span>{sermon.series[lang]}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => handlePlaySermon(sermon, true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-gradient rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                <Play size={16} />
                <span>{t('play')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SermonListItem: React.FC<{ sermon: Sermon }> = ({ sermon }) => {
    const convertSermon = convertToMediaItem(sermon);
    // Helper because UniversalMediaPlayer expects item
    return (
      <div className="bg-black-gradient rounded-[15px] p-4 flex items-center gap-4 text-white hover:scale-[1.01] transition-all duration-300">
        {/* Play Button */}
        <button
          onClick={() => handlePlaySermon(sermon, true)}
          className="flex-shrink-0 w-12 h-12 bg-blue-gradient rounded-full flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Play size={20} />
        </button>

        {/* Sermon Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-lg truncate mb-1">{sermon.title[lang]}</h4>
          <div className="flex items-center gap-4 text-sm text-dimWhite">
            <span className="flex items-center gap-1">
              <User size={12} />
              {sermon.speaker}
            </span>
            <BilingualDateDisplay dateStr={sermon.date} />
            {sermon.series && (
              <span className="text-blue-400">{sermon.series[lang]}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-primary">
      <div className="sm:px-16 px-6 sm:py-12 py-4">
        {/* Header */}
        <div className="text-center mb-12 reveal-on-scroll">
          <h1 className="font-semibold text-4xl md:text-5xl text-white mb-4 leading-tight">
            {t('sermonsTitle')}
          </h1>
          <p className="font-normal text-dimWhite text-lg max-w-3xl mx-auto mb-6">
            {t('sermonsDescription')}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-white">Loading sermons...</div>
        ) : (
          <>
            {/* Controls and Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8 reveal-on-scroll">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder={lang === 'fa' ? 'جستجو موعظه یا سخنران...' : 'Search sermons or speakers...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 rtl:pl-4 rtl:pr-12 pr-4 py-3 bg-black-gradient text-white rounded-[10px] border border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-400"
                />
              </div>

              {/* Speaker Filter */}
              <select
                value={selectedSpeaker}
                onChange={(e) => setSelectedSpeaker(e.target.value)}
                className="px-4 py-3 bg-black-gradient text-white rounded-[10px] border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">{lang === 'fa' ? 'همه سخنرانان' : 'All Speakers'}</option>
                {speakers.map(speaker => (
                  <option key={speaker} value={speaker}>{speaker}</option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex bg-black-gradient rounded-[10px] p-1 h-[50px] items-center">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 h-full rounded-lg transition-colors flex items-center justify-center ${viewMode === 'list' ? 'bg-blue-gradient text-primary' : 'text-gray-400 hover:text-white'
                    }`}
                >
                  <List size={20} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 h-full rounded-lg transition-colors flex items-center justify-center ${viewMode === 'grid' ? 'bg-blue-gradient text-primary' : 'text-gray-400 hover:text-white'
                    }`}
                >
                  <Grid size={20} />
                </button>
              </div>
            </div>

            {/* Sermons Display */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSermons.map(sermon => (
                  <SermonCard key={sermon.id} sermon={sermon} />
                ))}
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl mx-auto">
                {filteredSermons.map((sermon, index) => (
                  <div key={sermon.id} className="reveal-on-scroll" style={{ transitionDelay: `${index * 50}ms` }}>
                    <SermonListItem sermon={sermon} />
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {filteredSermons.length === 0 && (
              <div className="text-center py-12 reveal-on-scroll">
                <User className="h-24 w-24 text-gray-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-white mb-2">
                  {lang === 'fa' ? 'موعظه‌ای یافت نشد' : 'No sermons found'}
                </h3>
                <p className="text-dimWhite">
                  {lang === 'fa'
                    ? 'لطفاً کلمات جستجو یا فیلترها را تغییر دهید'
                    : 'Try adjusting your search terms or filters'
                  }
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Full Screen Media Player */}
      {currentSermon && (
        <EnhancedMediaPlayer
          isOpen={showFullPlayer}
          onClose={() => setShowFullPlayer(false)}
          currentItem={currentSermon}
          playlist={currentPlaylist}
          currentIndex={currentIndex}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onPlaylistItemClick={handlePlaylistItemClick}
          showLyrics={false}
        />
      )}

      {/* Mini Player */}
      {currentSermon && !showFullPlayer && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <UniversalMediaPlayer
            item={currentSermon}
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

export default EnhancedSermonsPage;