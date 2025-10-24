/**
 * Worship Songs Archive Page
 * Modern interface with alphabet filter, search, and presentation mode
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Search, Music, Video, FileText, Film, Maximize2, Minimize2 } from 'lucide-react';
import SongCard from '../components/SongCard';
import songsData from '../src/data/songs_index.json';

interface SongItem {
  id: string | number;
  slug: string;
  title_fa: string;
  title_en?: string;
  composer?: string;
  artist?: string;
  letter: string;
  chord_base?: string;
  chord_mode?: string;
  chord_view?: string;
  ppt?: string;
  video?: string;
  lyric_audio_link?: string;
  audio_download?: string;
  audio_stream?: string;
  mp3_local?: string;
  duration_sec?: number;
  lyrics_fa?: string;
  lyrics_en?: string;
  lyrics?: string;
  audio?: string;
  chord?: string;
  file_path?: string;
  source_html?: string;
}

interface IndexData {
  total_songs: number;
  letters: number;
  data: Record<string, SongItem[]>;
}

const PERSIAN_LETTERS = 'اآبپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی'.split('');

export default function WorshipSongsArchive() {
  const { lang } = useLanguage();
  const [data, setData] = useState<IndexData | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string>('ا');
  const [searchQuery, setSearchQuery] = useState('');
  const [presentationMode, setPresentationMode] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load data directly from imported JSON
  useEffect(() => {
    console.log('📊 Loading songs from imported data...');
    console.log('📝 Data keys:', Object.keys(songsData.data || {}));
    console.log('🔤 First letter key:', Object.keys(songsData.data || {})[0]);
    console.log('📚 Total songs:', songsData.total_songs);
    
    setData(songsData as IndexData);
    
    // Set first available letter as selected
    const firstLetter = Object.keys(songsData.data)[0];
    if (firstLetter) {
      setSelectedLetter(firstLetter);
      console.log('✅ Selected first letter:', firstLetter);
    }
  }, []);

  // Filter songs
  const filteredSongs = useMemo(() => {
    if (!data) {
      console.log('⚠️ No data available');
      return [];
    }
    
    console.log('🔍 Filtering - Selected letter:', selectedLetter);
    console.log('🔍 Available letters:', Object.keys(data.data));
    
    let songs: SongItem[] = [];
    
    if (searchQuery) {
      // Search across all letters
      Object.values(data.data).forEach(letterSongs => {
        if (Array.isArray(letterSongs)) {
          songs.push(...letterSongs);
        }
      });
      
      const query = searchQuery.toLowerCase();
      songs = songs.filter(s => 
        s.title_fa?.includes(searchQuery) ||
        s.title_en?.toLowerCase().includes(query) ||
        s.composer?.toLowerCase().includes(query) ||
        s.artist?.toLowerCase().includes(query)
      );
    } else {
      // Show songs for selected letter
      songs = data.data[selectedLetter] || [];
      console.log(`📚 Songs for "${selectedLetter}":`, songs.length);
    }
    
    // Remove duplicates
    const seen = new Set<string | number>();
    const filtered = songs.filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
    
    console.log('✅ Filtered songs:', filtered.length);
    return filtered;
  }, [data, selectedLetter, searchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPresentationMode(false);
      } else if (e.key === 'p' && e.ctrlKey) {
        e.preventDefault();
        setPresentationMode(v => !v);
      } else if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <Music className="w-16 h-16 mx-auto mb-4 animate-pulse text-emerald-600" />
          <div className="text-xl font-semibold text-neutral-800">
            {lang === 'fa' ? 'در حال بارگذاری سرودها...' : 'Loading Songs...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${
        presentationMode 
          ? 'bg-black text-white' 
          : 'bg-gradient-to-br from-neutral-50 to-neutral-100 text-neutral-900'
      }`}
      dir={lang === 'fa' ? 'rtl' : 'ltr'}
    >
      {/* Header Toolbar */}
      <div className={`sticky top-0 z-50 backdrop-blur-lg transition-colors ${
        presentationMode ? 'bg-black/60 border-neutral-700' : 'bg-white/80 border-neutral-200'
      } border-b shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Title & Controls */}
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <Music className="w-6 h-6 text-emerald-600" />
              <h1 className="text-xl md:text-2xl font-bold">
                {lang === 'fa' ? '🎵 آرشیو سرودهای پرستشی' : '🎵 Worship Songs Archive'}
              </h1>
              {data && (
                <span className={`text-sm px-2 py-1 rounded-full ${
                  presentationMode ? 'bg-neutral-800' : 'bg-neutral-200'
                }`}>
                  {data.total_songs} {lang === 'fa' ? 'سرود' : 'songs'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Speed Control */}
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-70">{lang === 'fa' ? 'سرعت' : 'Speed'}</span>
                <select 
                  value={audioSpeed}
                  onChange={e => setAudioSpeed(parseFloat(e.target.value))}
                  className={`px-2 py-1 rounded border text-sm ${
                    presentationMode 
                      ? 'bg-neutral-800 border-neutral-700' 
                      : 'bg-white border-neutral-300'
                  }`}
                >
                  <option value="0.75">0.75x</option>
                  <option value="1">1x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                </select>
              </div>

              {/* Presentation Mode */}
              <button
                onClick={() => setPresentationMode(v => !v)}
                className={`px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  presentationMode
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
                title="Ctrl+P"
              >
                {presentationMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="hidden md:inline">
                  {presentationMode 
                    ? (lang === 'fa' ? 'خروج از نمایش' : 'Exit') 
                    : (lang === 'fa' ? 'حالت نمایش' : 'Present')}
                </span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={lang === 'fa' 
                ? 'جستجو در عنوان، نویسنده، آهنگساز... (کلید /)'
                : 'Search title, author, composer... (press /)'}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${
                presentationMode
                  ? 'bg-neutral-900 border-neutral-700 text-white'
                  : 'bg-white border-neutral-300'
              }`}
            />
          </div>

          {/* Alphabet Filter */}
          <div className="flex flex-wrap gap-2">
            {PERSIAN_LETTERS.map(letter => (
              <button
                key={letter}
                onClick={() => {
                  setSelectedLetter(letter);
                  setSearchQuery('');
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedLetter === letter
                    ? 'bg-emerald-600 text-white shadow-lg scale-110'
                    : presentationMode
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                      : 'bg-white hover:bg-neutral-100 border border-neutral-300'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Songs Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {filteredSongs.length === 0 ? (
          <div className="text-center py-16">
            <Music className="w-24 h-24 mx-auto mb-4 opacity-30" />
            <div className="text-2xl font-semibold opacity-70">
              {searchQuery 
                ? (lang === 'fa' ? 'نتیجه‌ای یافت نشد' : 'No results found')
                : (lang === 'fa' ? 'سرودی موجود نیست' : 'No songs available')}
            </div>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            presentationMode 
              ? 'grid-cols-1 md:grid-cols-2' 
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {filteredSongs.map((song, idx) => (
              <SongCard
                key={song.id || idx}
                song={song}
                presentationMode={presentationMode}
                audioSpeed={audioSpeed}
                isPlaying={playingId === song.id}
                onPlayToggle={() => setPlayingId(prev => prev === song.id ? null : song.id)}
                lang={lang}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`text-center py-8 text-sm opacity-60 ${
        presentationMode ? 'text-neutral-400' : 'text-neutral-600'
      }`}>
        <p>{lang === 'fa' ? 'آرشیو سرودهای پرستشی کلیسای ایرانیان' : 'Iranian Church Worship Songs Archive'}</p>
        <p className="mt-1">
          {lang === 'fa' ? 'منبع: ' : 'Source: '}
          <a href="https://www.kalameh.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-600">
            www.kalameh.com
          </a>
        </p>
      </div>
    </div>
  );
}
