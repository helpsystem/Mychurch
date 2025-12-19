import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { Music, Plus, Edit2, Trash2, Search, Download, CheckCircle, AlertCircle } from 'lucide-react';
import Spinner from '../Spinner';
import WorshipSongEditor from './WorshipSongEditor';

interface Song {
  id: number;
  title: { fa: string; en: string };
  artist?: string;
  audioUrl?: string;
  youtubeId?: string;
  lyrics: { fa?: string; en?: string };
  chords?: string;
  category?: string;
  hasTiming?: boolean;
}

interface TimingData {
  metadata: any;
  words: any[];
  lines: any[];
}

const SongsManager: React.FC = () => {
  const { t, lang } = useLanguage();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/worship/data/worship_songs.json');
      const data = await response.json();
      
      const transformedSongs: Song[] = data.map((song: any, index: number) => ({
        id: song.id || index + 1,
        title: {
          fa: song.title?.fa || '',
          en: song.title?.en || ''
        },
        artist: song.artist,
        audioUrl: song.audioUrl,
        youtubeId: song.youtubeId,
        lyrics: {
          fa: song.lyrics?.fa || '',
          en: song.lyrics?.en || ''
        },
        chords: song.chords,
        category: song.category || 'worship',
        hasTiming: song.hasTiming || false
      }));
      
      setSongs(transformedSongs);
    } catch (error) {
      console.error('Error loading songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (song: Song) => {
    setEditingSong(song);
    setShowEditor(true);
  };

  const handleNew = () => {
    setEditingSong(null);
    setShowEditor(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(lang === 'fa' ? 'آیا از حذف این سرود مطمئن هستید؟' : 'Are you sure?')) return;
    
    try {
      const updatedSongs = songs.filter(s => s.id !== id);
      await saveSongsToFile(updatedSongs);
      setSongs(updatedSongs);
    } catch (error) {
      console.error('Error deleting song:', error);
      alert(lang === 'fa' ? 'خطا در حذف سرود' : 'Error deleting song');
    }
  };

  const handleSave = async (songData: any, timingData?: TimingData) => {
    try {
      let updatedSongs: Song[];
      let songId: number;
      
      if (editingSong) {
        updatedSongs = songs.map(s => 
          s.id === editingSong.id 
            ? { ...songData, id: editingSong.id, hasTiming: !!timingData }
            : s
        );
        songId = editingSong.id;
      } else {
        songId = Math.max(...songs.map(s => s.id), 0) + 1;
        updatedSongs = [...songs, { ...songData, id: songId, hasTiming: !!timingData }];
      }
      
      await saveSongsToFile(updatedSongs);
      
      if (timingData) {
        await saveTimingData(songId, timingData);
      }
      
      setSongs(updatedSongs);
      setShowEditor(false);
      setEditingSong(null);
      
      alert(lang === 'fa' ? ' سرود با موفقیت ذخیره شد!' : ' Song saved successfully!');
    } catch (error) {
      console.error('Error saving song:', error);
      alert(lang === 'fa' ? ' خطا در ذخیره سرود' : ' Error saving song');
    }
  };

  const saveSongsToFile = async (songsData: Song[]) => {
    const jsonData = songsData.map(song => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      audioUrl: song.audioUrl,
      youtubeId: song.youtubeId,
      lyrics: song.lyrics,
      chords: song.chords,
      category: song.category,
      hasTiming: song.hasTiming
    }));
    
    const response = await fetch('/api/songs/save-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songs: jsonData })
    });
    
    if (!response.ok) throw new Error('Failed to save songs');
  };

  const saveTimingData = async (songId: number, timingData: TimingData) => {
    const response = await fetch('/api/songs/save-timing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songId, timingData })
    });
    
    if (!response.ok) throw new Error('Failed to save timing data');
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(songs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'worship_songs_backup.json';
    link.click();
  };

  const filteredSongs = songs.filter(song => {
    const searchLower = searchTerm.toLowerCase();
    return (
      song.title.fa?.toLowerCase().includes(searchLower) ||
      song.title.en?.toLowerCase().includes(searchLower) ||
      song.artist?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (showEditor) {
    return (
      <WorshipSongEditor
        song={editingSong || undefined}
        onSave={handleSave}
        onCancel={() => {
          setShowEditor(false);
          setEditingSong(null);
        }}
      />
    );
  };
  return (
    <div className="p-6" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 p-3 rounded-xl">
            <Music className="text-white" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">
              {lang === 'fa' ? 'مدیریت سرودهای پرستشی' : 'Worship Songs Management'}
            </h2>
            <p className="text-gray-400 mt-1">
              {lang === 'fa' ? 'افزودن، ویرایش و ضبط تایمینگ سرودها' : 'Add, edit, and record song timings'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download size={20} />
            {lang === 'fa' ? 'دانلود' : 'Export'}
          </button>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg"
          >
            <Plus size={20} />
            {lang === 'fa' ? 'سرود جدید' : 'New Song'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl p-4 border border-purple-500/30">
          <div className="text-3xl font-bold text-white mb-1">{songs.length}</div>
          <div className="text-gray-400 text-sm">{lang === 'fa' ? 'کل سرودها' : 'Total Songs'}</div>
        </div>
        <div className="bg-gradient-to-br from-green-900/50 to-teal-900/50 rounded-xl p-4 border border-green-500/30">
          <div className="text-3xl font-bold text-white mb-1">{songs.filter(s => s.hasTiming).length}</div>
          <div className="text-gray-400 text-sm">{lang === 'fa' ? 'دارای تایمینگ' : 'With Timing'}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 rounded-xl p-4 border border-blue-500/30">
          <div className="text-3xl font-bold text-white mb-1">{songs.filter(s => s.audioUrl).length}</div>
          <div className="text-gray-400 text-sm">{lang === 'fa' ? 'دارای صوت' : 'With Audio'}</div>
        </div>
        <div className="bg-gradient-to-br from-red-900/50 to-pink-900/50 rounded-xl p-4 border border-red-500/30">
          <div className="text-3xl font-bold text-white mb-1">{songs.filter(s => s.youtubeId).length}</div>
          <div className="text-gray-400 text-sm">{lang === 'fa' ? 'دارای ویدیو' : 'With Video'}</div>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === 'fa' ? ' جستجو در سرودها...' : ' Search songs...'}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSongs.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            <Music size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl">
              {searchTerm ? (lang === 'fa' ? 'سرودی یافت نشد' : 'No songs found') : (lang === 'fa' ? 'هنوز سرودی اضافه نشده است' : 'No songs yet')}
            </p>
          </div>
        ) : (
          filteredSongs.map((song) => (
            <div key={song.id} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 border border-gray-700 hover:border-purple-500 transition-all group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
                    {song.title[lang] || song.title.fa}
                  </h3>
                  {song.artist && <p className="text-gray-400 text-sm"> {song.artist}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(song)} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(song.id)} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {song.hasTiming && (
                  <span className="flex items-center gap-1 bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded-full border border-green-500/30">
                    <CheckCircle size={12} /> {lang === 'fa' ? 'تایمینگ' : 'Timing'}
                  </span>
                )}
                {song.audioUrl && (
                  <span className="flex items-center gap-1 bg-blue-900/30 text-blue-400 text-xs px-2 py-1 rounded-full border border-blue-500/30">
                    <Music size={12} /> {lang === 'fa' ? 'صوت' : 'Audio'}
                  </span>
                )}
                {song.youtubeId && (
                  <span className="flex items-center gap-1 bg-red-900/30 text-red-400 text-xs px-2 py-1 rounded-full border border-red-500/30">
                     {lang === 'fa' ? 'ویدیو' : 'Video'}
                  </span>
                )}
                {!song.hasTiming && !song.audioUrl && !song.youtubeId && (
                  <span className="flex items-center gap-1 bg-yellow-900/30 text-yellow-400 text-xs px-2 py-1 rounded-full border border-yellow-500/30">
                    <AlertCircle size={12} /> {lang === 'fa' ? 'ناقص' : 'Incomplete'}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SongsManager;