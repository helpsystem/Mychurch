import React, { useState, useEffect, useMemo } from 'react';
import { Search, Music, Video, FileText, Download } from 'lucide-react';
import { SongPlayer } from './SongPlayer';

interface Song {
  id: number;
  slug: string;
  letter: string;
  title_fa: string;
  title_en?: string;
  artist_fa?: string;
  artist_en?: string;
  audio_url?: string;
  video_url?: string;
  ppt_url?: string;
  chord_url?: string;
  duration?: number;
  thumbnail_url?: string;
}

const PERSIAN_LETTERS = [
  'آ', 'ا', 'ب', 'پ', 'ت', 'ث', 'ج', 'چ', 'ح', 'خ',
  'د', 'ذ', 'ر', 'ز', 'ژ', 'س', 'ش', 'ص', 'ض', 'ط',
  'ظ', 'ع', 'غ', 'ف', 'ق', 'ک', 'گ', 'ل', 'م', 'ن',
  'و', 'ه', 'ی'
];

export const SongLibrary: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load songs from API
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await fetch('/api/songs');
        const data = await response.json();
        setSongs(data.songs || []);
      } catch (error) {
        console.error('Error loading songs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  // Filter songs based on selected letter and search query
  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      const matchesLetter = !selectedLetter || song.letter === selectedLetter;
      const matchesSearch = !searchQuery || 
        song.title_fa.includes(searchQuery) ||
        song.title_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist_fa?.includes(searchQuery) ||
        song.artist_en?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesLetter && matchesSearch;
    });
  }, [songs, selectedLetter, searchQuery]);

  // Group songs by letter
  const songsByLetter = useMemo(() => {
    const grouped: Record<string, Song[]> = {};
    filteredSongs.forEach((song) => {
      if (!grouped[song.letter]) {
        grouped[song.letter] = [];
      }
      grouped[song.letter].push(song);
    });
    return grouped;
  }, [filteredSongs]);

  // Count songs per letter
  const songsCountByLetter = useMemo(() => {
    const counts: Record<string, number> = {};
    songs.forEach((song) => {
      counts[song.letter] = (counts[song.letter] || 0) + 1;
    });
    return counts;
  }, [songs]);

  const handleSongSelect = (song: Song) => {
    setSelectedSong(song);
    // Increment play count
    fetch(`/api/songs/${song.slug}/play`, { method: 'POST' }).catch(console.error);
  };

  const handleNextSong = () => {
    if (!selectedSong) return;
    const currentIndex = filteredSongs.findIndex((s) => s.id === selectedSong.id);
    if (currentIndex < filteredSongs.length - 1) {
      setSelectedSong(filteredSongs[currentIndex + 1]);
    }
  };

  const handlePreviousSong = () => {
    if (!selectedSong) return;
    const currentIndex = filteredSongs.findIndex((s) => s.id === selectedSong.id);
    if (currentIndex > 0) {
      setSelectedSong(filteredSongs[currentIndex - 1]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-center">
            🎵 کتابخانه سرودها
          </h1>
          <p className="text-center text-lg opacity-90">
            Persian Christian Songs Archive
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="sticky top-0 z-20 bg-white shadow-md py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="جستجو در سرودها... (نام سرود، خواننده)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl 
                       focus:border-blue-500 focus:outline-none text-lg"
              dir="rtl"
            />
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              {filteredSongs.length} سرود
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}
              >
                شبکه
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}
              >
                لیست
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alphabet Navigation */}
      <div className="sticky top-24 z-10 bg-white border-b-2 border-gray-200 py-3 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center" dir="rtl">
            <button
              onClick={() => setSelectedLetter(null)}
              className={`px-4 py-2 rounded-lg font-bold transition ${
                !selectedLetter
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              همه
            </button>
            {PERSIAN_LETTERS.map((letter) => (
              <button
                key={letter}
                onClick={() => setSelectedLetter(letter)}
                className={`px-4 py-2 rounded-lg font-bold transition relative ${
                  selectedLetter === letter
                    ? 'bg-blue-600 text-white shadow-lg'
                    : songsCountByLetter[letter]
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                }`}
                disabled={!songsCountByLetter[letter]}
              >
                {letter}
                {songsCountByLetter[letter] && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs 
                                 rounded-full w-5 h-5 flex items-center justify-center">
                    {songsCountByLetter[letter]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Songs Grid/List */}
      <div className="max-w-7xl mx-auto py-8 px-4">
        {selectedSong ? (
          <div className="mb-8">
            <button
              onClick={() => setSelectedSong(null)}
              className="mb-4 px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
            >
              ← بازگشت به لیست
            </button>
            <SongPlayer
              song={selectedSong}
              autoPlay={true}
              showLyrics={true}
              enableHighlight={true}
              onNext={handleNextSong}
              onPrevious={handlePreviousSong}
            />
          </div>
        ) : (
          <>
            {Object.keys(songsByLetter).length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Music size={64} className="mx-auto mb-4 opacity-50" />
                <p className="text-xl">هیچ سرودی یافت نشد</p>
              </div>
            ) : (
              Object.entries(songsByLetter).map(([letter, letterSongs]) => {
                const songs = letterSongs as Song[];
                return (
                <div key={letter} className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <span className="bg-blue-600 text-white w-12 h-12 rounded-full 
                                   flex items-center justify-center">
                      {letter}
                    </span>
                    <span>{songs.length} سرود</span>
                  </h2>

                  <div className={viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                  }>
                    {songs.map((song) => (
                      <div
                        key={song.id}
                        onClick={() => handleSongSelect(song)}
                        className={`
                          bg-white rounded-xl shadow-md hover:shadow-2xl 
                          transition-all duration-300 cursor-pointer
                          transform hover:scale-105 hover:-translate-y-1
                          ${viewMode === 'list' ? 'flex items-center p-4' : 'p-6'}
                        `}
                      >
                        {song.thumbnail_url && viewMode === 'grid' && (
                          <img
                            src={song.thumbnail_url}
                            alt={song.title_fa}
                            className="w-full h-48 object-cover rounded-lg mb-4"
                          />
                        )}
                        
                        <div className={viewMode === 'list' ? 'flex-1' : ''}>
                          <h3 className="text-xl font-bold text-gray-800 mb-2" dir="rtl">
                            {song.title_fa}
                          </h3>
                          {song.title_en && (
                            <p className="text-sm text-gray-600 mb-2">
                              {song.title_en}
                            </p>
                          )}
                          {song.artist_fa && (
                            <p className="text-sm text-blue-600 mb-3" dir="rtl">
                              🎤 {song.artist_fa}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            {song.audio_url && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 
                                             bg-green-100 text-green-700 rounded-full text-xs">
                                <Music size={14} /> صوت
                              </span>
                            )}
                            {song.video_url && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 
                                             bg-red-100 text-red-700 rounded-full text-xs">
                                <Video size={14} /> ویدیو
                              </span>
                            )}
                            {song.ppt_url && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 
                                             bg-orange-100 text-orange-700 rounded-full text-xs">
                                <FileText size={14} /> پاورپوینت
                              </span>
                            )}
                            {song.chord_url && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 
                                             bg-purple-100 text-purple-700 rounded-full text-xs">
                                🎵 آکورد
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )})
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SongLibrary;
