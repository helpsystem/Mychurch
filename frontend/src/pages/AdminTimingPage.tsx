import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import AdvancedAudioSync from '../components/AdvancedAudioSync';
import axios from 'axios';

interface Song {
  id: number;
  title: { fa: string; en: string };
  artist: string;
  audioUrl?: string;
}

/**
 * 🎛️ Admin Panel for Advanced Audio Timing Generation
 * 
 * Features:
 * - List all worship songs
 * - Check timing status
 * - Generate AI timing with Gemini
 * - Download timing files
 * - Batch processing
 */
const AdminTimingPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [timingStatus, setTimingStatus] = useState<Record<number, boolean>>({});
  const [filter, setFilter] = useState<'all' | 'with-timing' | 'without-timing'>('all');

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/worship-songs');
      const songsData = response.data;
      setSongs(songsData);

      // Check timing status for each song
      const statusChecks = await Promise.all(
        songsData.map(async (song: Song) => {
          try {
            const res = await axios.get(`/api/timing/check/${song.id}`);
            return { id: song.id, exists: res.data.exists };
          } catch {
            return { id: song.id, exists: false };
          }
        })
      );

      const statusMap: Record<number, boolean> = {};
      statusChecks.forEach(({ id, exists }) => {
        statusMap[id] = exists;
      });
      setTimingStatus(statusMap);
    } catch (error) {
      console.error('Failed to load songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSongs = songs.filter(song => {
    if (filter === 'with-timing') return timingStatus[song.id];
    if (filter === 'without-timing') return !timingStatus[song.id];
    return true;
  });

  const handleTimingGenerated = async (songId: number) => {
    // Refresh timing status
    try {
      const res = await axios.get(`/api/timing/check/${songId}`);
      setTimingStatus(prev => ({ ...prev, [songId]: res.data.exists }));
    } catch (error) {
      console.error('Failed to refresh timing status:', error);
    }
    
    setSelectedSong(null);
  };

  const handleDeleteTiming = async (songId: number) => {
    if (!confirm('آیا مطمئنید که می‌خواهید timing این سرود را حذف کنید?')) return;

    try {
      await axios.delete(`/api/timing/${songId}`);
      setTimingStatus(prev => ({ ...prev, [songId]: false }));
      alert('✅ Timing حذف شد');
    } catch (error) {
      alert('❌ خطا در حذف timing');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent border-teal-400 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xl text-gray-300">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (selectedSong) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => setSelectedSong(null)}
            className="mb-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            ← بازگشت به لیست
          </button>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">
              {selectedSong.title[lang]}
            </h2>
            <p className="text-gray-400 text-lg">{selectedSong.artist}</p>
          </div>

          <AdvancedAudioSync
            songId={selectedSong.id}
            songTitle={selectedSong.title[lang]}
            songArtist={selectedSong.artist}
            audioUrl={selectedSong.audioUrl}
            onTimingGenerated={() => handleTimingGenerated(selectedSong.id)}
            lang={lang}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500 mb-4">
            🎛️ مدیریت Timing سرودها
          </h1>
          <p className="text-gray-400 text-lg">
            تولید خودکار timing با هوش مصنوعی Gemini
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="text-4xl font-bold text-teal-400">{songs.length}</div>
            <div className="text-gray-400 mt-2">کل سرودها</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-green-700/50">
            <div className="text-4xl font-bold text-green-400">
              {Object.values(timingStatus).filter(Boolean).length}
            </div>
            <div className="text-gray-400 mt-2">دارای Timing</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-yellow-700/50">
            <div className="text-4xl font-bold text-yellow-400">
              {Object.values(timingStatus).filter(v => !v).length}
            </div>
            <div className="text-gray-400 mt-2">بدون Timing</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-3 justify-center">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-bold transition-colors ${
              filter === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            همه ({songs.length})
          </button>
          <button
            onClick={() => setFilter('with-timing')}
            className={`px-6 py-2 rounded-lg font-bold transition-colors ${
              filter === 'with-timing'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            با Timing ({Object.values(timingStatus).filter(Boolean).length})
          </button>
          <button
            onClick={() => setFilter('without-timing')}
            className={`px-6 py-2 rounded-lg font-bold transition-colors ${
              filter === 'without-timing'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            بدون Timing ({Object.values(timingStatus).filter(v => !v).length})
          </button>
        </div>

        {/* Songs List */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-400">#</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-400">عنوان</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-400">خواننده</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-400">وضعیت</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-400">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredSongs.map((song, index) => (
                  <tr
                    key={song.id}
                    className="border-t border-gray-700 hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                    <td className="px-6 py-4 text-white font-medium">{song.title[lang]}</td>
                    <td className="px-6 py-4 text-gray-400">{song.artist}</td>
                    <td className="px-6 py-4 text-center">
                      {timingStatus[song.id] ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-900/50 text-green-300">
                          ✅ دارد
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-yellow-900/50 text-yellow-300">
                          ⚠️ ندارد
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setSelectedSong(song)}
                          className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                          {timingStatus[song.id] ? '🔄 بروزرسانی' : '✨ تولید'}
                        </button>
                        {timingStatus[song.id] && (
                          <button
                            onClick={() => handleDeleteTiming(song.id)}
                            className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredSongs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            هیچ سرودی یافت نشد
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTimingPage;
