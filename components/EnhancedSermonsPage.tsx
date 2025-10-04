import React, { useState, useMemo } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useContent } from '../hooks/useContent';
import { Play, Pause, User, Download, History, Clock, List, Grid, Search } from 'lucide-react';
import BilingualDateDisplay from './BilingualDateDisplay';
import UniversalMediaPlayer from './UniversalMediaPlayer';
import EnhancedMediaPlayer from './EnhancedMediaPlayer';
import { Sermon } from '../types';

type MediaItem = {
  id: number;
  title: { en: string; fa: string };
  speaker?: string;
  audioUrl?: string;
  videoUrl?: string;
  duration?: number;
  type: 'sermon';
  date?: string;
  series?: { en: string; fa: string };
  notesUrl?: string;
};

const EnhancedSermonsPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const { content } = useContent();
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
    type: 'sermon',
    date: sermon.date,
    series: sermon.series,
    notesUrl: sermon.notesUrl
  });

  // Filter sermons
  const filteredSermons = useMemo(() => {
    return content.sermons.filter(sermon => {
      const matchesSearch = sermon.title[lang].toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sermon.speaker.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeries = selectedSeries === 'all' || (sermon.series && sermon.series[lang] === selectedSeries);
      const matchesSpeaker = selectedSpeaker === 'all' || sermon.speaker === selectedSpeaker;
      return matchesSearch && matchesSeries && matchesSpeaker;
    });
  }, [content.sermons, searchTerm, selectedSeries, selectedSpeaker, lang]);

  // Get unique series and speakers
  const series = useMemo(() => {
    const seriesSet = new Set(content.sermons.filter(s => s.series).map(s => s.series![lang]));
    return Array.from(seriesSet).sort();
  }, [content.sermons, lang]);

  const speakers = useMemo(() => {
    const speakerSet = new Set(content.sermons.map(s => s.speaker));
    return Array.from(speakerSet).sort();
  }, [content.sermons]);

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
    
    return (
      <div className="bg-black-gradient p-6 rounded-[20px] text-white hover:scale-[1.02] transition-all duration-300 interactive-card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Sermon Info */}
          <div className="flex-1">
            <div className="mb-4">
              <h3 className="font-semibold text-xl mb-2">{sermon.title[lang]}</h3>
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

            {savedTime && savedTime > 5 && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <History size={16} />
                  <span>
                    {lang === 'fa' 
                      ? `ادامه از دقیقه ${formatTime(savedTime)}`
                      : `Resume from ${formatTime(savedTime)}`
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Inline Player */}
            <UniversalMediaPlayer
              item={convertToMediaItem(sermon)}
              mode="card"
              className="mb-4"
            />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handlePlaySermon(sermon, true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-gradient rounded-lg hover:scale-105 transition-transform text-sm font-medium"
              >
                <Play size={16} />
                <span>{t('play')}</span>
              </button>

              {sermon.notesUrl && (
                <a
                  href={sermon.notesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium"
                >
                  <Download size={16} />
                  <span>{t('downloadNotes')}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SermonListItem: React.FC<{ sermon: Sermon }> = ({ sermon }) => {
    const savedTime = getSavedProgress(sermon.id);
    
    return (
      <div className="bg-black-gradient rounded-[15px] p-4 flex items-center gap-4 text-white hover:scale-[1.01] transition-all duration-300">
        {/* Play Button */}
        <button
          onClick={() => handlePlaySermon(sermon)}
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
          {savedTime && savedTime > 5 && (
            <div className="flex items-center gap-1 mt-1 text-xs text-yellow-400">
              <History size={12} />
              <span>Resume from {formatTime(savedTime)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {sermon.notesUrl && (
            <a
              href={sermon.notesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
            >
              <Download size={16} />
            </a>
          )}
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

          {filteredSermons.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-gradient text-white rounded-[10px] font-medium hover:scale-105 transition-transform"
            >
              <Play size={20} />
              <span>{t('playAll')}</span>
            </button>
          )}
        </div>

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

          {/* Series Filter */}
          <select
            value={selectedSeries}
            onChange={(e) => setSelectedSeries(e.target.value)}
            className="px-4 py-3 bg-black-gradient text-white rounded-[10px] border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">{lang === 'fa' ? 'همه سری‌ها' : 'All Series'}</option>
            {series.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

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
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-6 reveal-on-scroll">
          <p className="text-dimWhite">
            {lang === 'fa' 
              ? `${filteredSermons.length} موعظه یافت شد` 
              : `${filteredSermons.length} sermons found`
            }
          </p>

          <div className="flex bg-black-gradient rounded-[10px] p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-blue-gradient text-primary' : 'text-gray-400 hover:text-white'
              }`}
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-gradient text-primary' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid size={20} />
            </button>
          </div>
        </div>

        {/* Sermons Display */}
        {viewMode === 'grid' ? (
          <div className="space-y-12 max-w-4xl mx-auto">
            {Object.entries(groupedSermons).map(([seriesTitle, sermons], index) => {
              const sermonList = sermons as Sermon[];
              return (
                <section key={seriesTitle} className="reveal-on-scroll" style={{transitionDelay: `${index * 150}ms`}}>
                  <h2 className="text-2xl font-bold text-gradient mb-6 border-b-2 border-secondary/20 pb-2">
                    {seriesTitle}
                  </h2>
                  <div className="grid grid-cols-1 gap-6">
                    {sermonList.map(sermon => (
                      <SermonCard key={sermon.id} sermon={sermon} />
                    ))}
                  </div>
                </section>
              );
            })}
            
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {filteredSermons.map((sermon, index) => (
              <div key={sermon.id} className="reveal-on-scroll" style={{transitionDelay: `${index * 50}ms`}}>
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