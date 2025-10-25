import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { Music, Plus, Edit2, Trash2, Save, X, Search, Filter, Download, Upload } from 'lucide-react';
import Spinner from '../Spinner';

interface Song {
  id: number;
  title_fa: string;
  title_en: string;
  artist?: string;
  audioUrl?: string;
  videoUrl?: string;
  lyrics_fa?: string;
  lyrics_en?: string;
  timepoints?: Array<{ time: number; word: string }>;
}

interface SongFormData {
  title_fa: string;
  title_en: string;
  artist?: string;
  audioUrl?: string;
  videoUrl?: string;
  lyrics_fa?: string;
  lyrics_en?: string;
}

const SongsManager: React.FC = () => {
  const { t, lang } = useLanguage();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<SongFormData>({
    title_fa: '',
    title_en: '',
    artist: '',
    audioUrl: '',
    videoUrl: '',
    lyrics_fa: '',
    lyrics_en: ''
  });

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/songs');
      const data = await response.json();
      if (data.success) {
        setSongs(data.songs || []);
      } else {
        console.error('Failed to load songs:', data.message);
      }
    } catch (error) {
      console.error('Error loading songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (song: Song) => {
    setEditing(song.id);
    setForm({
      title_fa: song.title_fa || '',
      title_en: song.title_en || '',
      artist: song.artist || '',
      audioUrl: song.audioUrl || '',
      videoUrl: song.videoUrl || '',
      lyrics_fa: song.lyrics_fa || '',
      lyrics_en: song.lyrics_en || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(lang === 'fa' ? 'آیا مطمئن هستید؟' : 'Are you sure?')) return;
    
    try {
      const response = await fetch(`/api/songs/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await loadSongs();
      }
    } catch (error) {
      console.error('Error deleting song:', error);
    }
  };

  const handleSave = async () => {
    try {
      const url = editing ? `/api/songs/${editing}` : '/api/songs';
      const method = editing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        await loadSongs();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving song:', error);
    }
  };

  const resetForm = () => {
    setForm({
      title_fa: '',
      title_en: '',
      artist: '',
      audioUrl: '',
      videoUrl: '',
      lyrics_fa: '',
      lyrics_en: ''
    });
    setEditing(null);
    setShowForm(false);
  };

  const filteredSongs = songs.filter(song => 
    song.title_fa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.title_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-6" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Music className="text-secondary" size={32} />
          <h2 className="text-3xl font-bold text-white">
            {lang === 'fa' ? 'مدیریت سرودها' : 'Songs Management'}
          </h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          {lang === 'fa' ? 'سرود جدید' : 'New Song'}
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === 'fa' ? 'جستجو در سرودها...' : 'Search songs...'}
            className="w-full bg-primary border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-secondary"
          />
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="mb-6 bg-primary border border-gray-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">
              {editing 
                ? (lang === 'fa' ? 'ویرایش سرود' : 'Edit Song')
                : (lang === 'fa' ? 'سرود جدید' : 'New Song')
              }
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-dimWhite mb-2">
                {lang === 'fa' ? 'عنوان فارسی' : 'Persian Title'}
              </label>
              <input
                type="text"
                value={form.title_fa}
                onChange={(e) => setForm({ ...form, title_fa: e.target.value })}
                className="w-full bg-black-gradient border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-secondary"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-dimWhite mb-2">
                {lang === 'fa' ? 'عنوان انگلیسی' : 'English Title'}
              </label>
              <input
                type="text"
                value={form.title_en}
                onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                className="w-full bg-black-gradient border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="block text-dimWhite mb-2">
                {lang === 'fa' ? 'خواننده / هنرمند' : 'Artist'}
              </label>
              <input
                type="text"
                value={form.artist}
                onChange={(e) => setForm({ ...form, artist: e.target.value })}
                className="w-full bg-black-gradient border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="block text-dimWhite mb-2">
                {lang === 'fa' ? 'آدرس فایل صوتی' : 'Audio URL'}
              </label>
              <input
                type="text"
                value={form.audioUrl}
                onChange={(e) => setForm({ ...form, audioUrl: e.target.value })}
                className="w-full bg-black-gradient border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-secondary"
                placeholder="/audio/song.mp3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-dimWhite mb-2">
                {lang === 'fa' ? 'آدرس ویدیو' : 'Video URL'}
              </label>
              <input
                type="text"
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                className="w-full bg-black-gradient border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-secondary"
                placeholder="https://youtube.com/..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-dimWhite mb-2">
                {lang === 'fa' ? 'متن سرود (فارسی)' : 'Lyrics (Persian)'}
              </label>
              <textarea
                value={form.lyrics_fa}
                onChange={(e) => setForm({ ...form, lyrics_fa: e.target.value })}
                rows={4}
                className="w-full bg-black-gradient border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-secondary"
                dir="rtl"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-dimWhite mb-2">
                {lang === 'fa' ? 'متن سرود (انگلیسی)' : 'Lyrics (English)'}
              </label>
              <textarea
                value={form.lyrics_en}
                onChange={(e) => setForm({ ...form, lyrics_en: e.target.value })}
                rows={4}
                className="w-full bg-black-gradient border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={resetForm}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <X size={18} />
              {lang === 'fa' ? 'لغو' : 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Save size={18} />
              {lang === 'fa' ? 'ذخیره' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Songs List */}
      <div className="space-y-3">
        {filteredSongs.length === 0 ? (
          <div className="text-center py-12 text-dimWhite">
            {lang === 'fa' ? 'هیچ سرودی یافت نشد' : 'No songs found'}
          </div>
        ) : (
          filteredSongs.map((song) => (
            <div
              key={song.id}
              className="bg-primary border border-gray-700 rounded-lg p-4 hover:border-secondary transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {lang === 'fa' ? song.title_fa : song.title_en}
                  </h3>
                  {song.artist && (
                    <p className="text-dimWhite text-sm mb-2">
                      {lang === 'fa' ? 'هنرمند: ' : 'Artist: '}
                      {song.artist}
                    </p>
                  )}
                  <div className="flex gap-4 text-xs text-dimWhite">
                    {song.audioUrl && (
                      <span className="flex items-center gap-1">
                        <Music size={14} />
                        {lang === 'fa' ? 'دارای صوت' : 'Has Audio'}
                      </span>
                    )}
                    {song.videoUrl && (
                      <span className="flex items-center gap-1">
                        📹
                        {lang === 'fa' ? 'دارای ویدیو' : 'Has Video'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(song)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    title={lang === 'fa' ? 'ویرایش' : 'Edit'}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(song.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    title={lang === 'fa' ? 'حذف' : 'Delete'}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats Footer */}
      <div className="mt-6 p-4 bg-primary border border-gray-700 rounded-lg">
        <div className="flex justify-between text-dimWhite">
          <span>
            {lang === 'fa' ? 'تعداد کل سرودها:' : 'Total Songs:'}
          </span>
          <span className="font-bold text-secondary">{songs.length}</span>
        </div>
      </div>
    </div>
  );
};

export default SongsManager;
