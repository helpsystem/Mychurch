import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { Upload, Music, FileText, Image, Trash2, Save, Plus } from 'lucide-react';
import axios from 'axios';

interface WorshipSong {
  id?: number;
  title: { fa: string; en: string };
  artist: string;
  youtubeId?: string;
  lyrics?: { fa?: string; en?: string };
  audioUrl?: string;
  videoUrl?: string;
  presentationFileUrl?: string;
  pdfFileUrl?: string;
  sheetMusicUrl?: string;
  chords?: string;
  notation?: string;
  notes?: string;
  category?: string;
  tags?: string[];
}

const AdminWorshipManager: React.FC = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [songs, setSongs] = useState<WorshipSong[]>([]);
  const [selectedSong, setSelectedSong] = useState<WorshipSong | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  // بارگذاری لیست سرودها
  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const response = await axios.get('/api/worship-songs');
      setSongs(response.data || []);
    } catch (error) {
      console.error('Error fetching songs:', error);
    }
  };

  // آپلود فایل
  const handleFileUpload = async (file: File, fieldName: string) => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/worship-songs/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setSelectedSong(prev => ({
          ...prev!,
          [fieldName]: response.data.fileUrl
        }));
        setMessage(`✅ فایل ${file.name} با موفقیت آپلود شد`);
      }
    } catch (error: any) {
      setMessage(`❌ خطا در آپلود: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // ذخیره سرود
  const handleSave = async () => {
    if (!selectedSong) return;

    try {
      if (selectedSong.id) {
        // ویرایش
        await axios.put(`/api/worship-songs/${selectedSong.id}`, selectedSong);
        setMessage('✅ سرود با موفقیت ویرایش شد');
      } else {
        // ایجاد جدید
        await axios.post('/api/worship-songs', selectedSong);
        setMessage('✅ سرود جدید با موفقیت اضافه شد');
      }
      
      fetchSongs();
      setIsEditing(false);
      setSelectedSong(null);
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(`❌ خطا: ${error.response?.data?.message || error.message}`);
    }
  };

  // حذف سرود
  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این سرود اطمینان دارید؟')) return;

    try {
      await axios.delete(`/api/worship-songs/${id}`);
      setMessage('✅ سرود با موفقیت حذف شد');
      fetchSongs();
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage(`❌ خطا: ${error.response?.data?.message || error.message}`);
    }
  };

  // سرود جدید
  const handleNewSong = () => {
    setSelectedSong({
      title: { fa: '', en: '' },
      artist: '',
      youtubeId: '',
      lyrics: { fa: '', en: '' },
      category: 'worship',
      tags: []
    });
    setIsEditing(true);
  };

  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-xl">شما دسترسی به این صفحه ندارید</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="bg-black/40 backdrop-blur-lg rounded-2xl p-6 border border-cyan-500/30">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">مدیریت سرودهای پرستشی</h1>
            <button
              onClick={handleNewSong}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              <Plus size={20} />
              سرود جدید
            </button>
          </div>

          {message && (
            <div className="mb-4 p-4 bg-blue-500/20 border border-blue-500 rounded-lg text-white">
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* لیست سرودها */}
            <div className="lg:col-span-1 bg-black/20 rounded-xl p-4 max-h-[600px] overflow-y-auto">
              <h2 className="text-xl font-bold text-white mb-4">لیست سرودها ({songs.length})</h2>
              {songs.map(song => (
                <div
                  key={song.id}
                  className={`p-3 mb-2 rounded-lg cursor-pointer transition ${
                    selectedSong?.id === song.id
                      ? 'bg-cyan-500/30 border border-cyan-500'
                      : 'bg-gray-800/50 hover:bg-gray-700/50'
                  }`}
                  onClick={() => {
                    setSelectedSong(song);
                    setIsEditing(false);
                  }}
                >
                  <div className="text-white font-semibold">{song.title.fa || song.title.en}</div>
                  <div className="text-gray-400 text-sm">{song.artist}</div>
                  <div className="flex gap-1 mt-1">
                    {song.audioUrl && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">🎵 MP3</span>}
                    {song.presentationFileUrl && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">📊 PPT</span>}
                    {song.pdfFileUrl && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">📄 PDF</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* جزئیات / ویرایش سرود */}
            <div className="lg:col-span-2 bg-black/20 rounded-xl p-6">
              {selectedSong ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      {isEditing ? 'ویرایش سرود' : 'جزئیات سرود'}
                    </h2>
                    <div className="flex gap-2">
                      {!isEditing ? (
                        <>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={() => handleDelete(selectedSong.id!)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          >
                            <Trash2 size={16} />
                            حذف
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleSave}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          >
                            <Save size={16} />
                            ذخیره
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              setSelectedSong(null);
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                          >
                            انصراف
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {/* عنوان */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-white block mb-2">عنوان فارسی *</label>
                        <input
                          type="text"
                          value={selectedSong.title.fa}
                          onChange={(e) => setSelectedSong({ ...selectedSong, title: { ...selectedSong.title, fa: e.target.value } })}
                          disabled={!isEditing}
                          className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-600 disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="text-white block mb-2">عنوان انگلیسی</label>
                        <input
                          type="text"
                          value={selectedSong.title.en}
                          onChange={(e) => setSelectedSong({ ...selectedSong, title: { ...selectedSong.title, en: e.target.value } })}
                          disabled={!isEditing}
                          className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-600 disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* خواننده */}
                    <div>
                      <label className="text-white block mb-2">خواننده / آهنگساز *</label>
                      <input
                        type="text"
                        value={selectedSong.artist}
                        onChange={(e) => setSelectedSong({ ...selectedSong, artist: e.target.value })}
                        disabled={!isEditing}
                        className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-600 disabled:opacity-50"
                      />
                    </div>

                    {/* YouTube ID */}
                    <div>
                      <label className="text-white block mb-2">YouTube ID</label>
                      <input
                        type="text"
                        value={selectedSong.youtubeId || ''}
                        onChange={(e) => setSelectedSong({ ...selectedSong, youtubeId: e.target.value })}
                        disabled={!isEditing}
                        placeholder="مثال: dQw4w9WgXcQ"
                        className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-600 disabled:opacity-50"
                      />
                    </div>

                    {/* آپلود فایل‌ها */}
                    {isEditing && (
                      <div className="space-y-3 bg-gray-800/50 p-4 rounded-lg">
                        <h3 className="text-white font-semibold mb-3">آپلود فایل‌ها</h3>
                        
                        {/* فایل صوتی */}
                        <div>
                          <label className="text-white block mb-2">
                            <Music className="inline ml-2" size={16} />
                            فایل صوتی (MP3)
                          </label>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'audioUrl')}
                            disabled={uploading}
                            className="w-full text-white"
                          />
                          {selectedSong.audioUrl && (
                            <div className="text-green-400 text-sm mt-1">✓ {selectedSong.audioUrl}</div>
                          )}
                        </div>

                        {/* PowerPoint */}
                        <div>
                          <label className="text-white block mb-2">
                            <FileText className="inline ml-2" size={16} />
                            فایل PowerPoint (PPTX)
                          </label>
                          <input
                            type="file"
                            accept=".ppt,.pptx"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'presentationFileUrl')}
                            disabled={uploading}
                            className="w-full text-white"
                          />
                          {selectedSong.presentationFileUrl && (
                            <div className="text-green-400 text-sm mt-1">✓ {selectedSong.presentationFileUrl}</div>
                          )}
                        </div>

                        {/* PDF */}
                        <div>
                          <label className="text-white block mb-2">
                            <FileText className="inline ml-2" size={16} />
                            فایل PDF
                          </label>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'pdfFileUrl')}
                            disabled={uploading}
                            className="w-full text-white"
                          />
                          {selectedSong.pdfFileUrl && (
                            <div className="text-green-400 text-sm mt-1">✓ {selectedSong.pdfFileUrl}</div>
                          )}
                        </div>

                        {/* Sheet Music */}
                        <div>
                          <label className="text-white block mb-2">
                            <Image className="inline ml-2" size={16} />
                            نت موسیقی (تصویر)
                          </label>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'sheetMusicUrl')}
                            disabled={uploading}
                            className="w-full text-white"
                          />
                          {selectedSong.sheetMusicUrl && (
                            <div className="text-green-400 text-sm mt-1">✓ {selectedSong.sheetMusicUrl}</div>
                          )}
                        </div>

                        {uploading && (
                          <div className="text-cyan-400 text-center py-2">
                            <Upload className="inline animate-bounce" size={20} />
                            در حال آپلود...
                          </div>
                        )}
                      </div>
                    )}

                    {/* متن سرود */}
                    <div>
                      <label className="text-white block mb-2">متن سرود (فارسی)</label>
                      <textarea
                        value={selectedSong.lyrics?.fa || ''}
                        onChange={(e) => setSelectedSong({ 
                          ...selectedSong, 
                          lyrics: { ...selectedSong.lyrics, fa: e.target.value } 
                        })}
                        disabled={!isEditing}
                        rows={6}
                        className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-600 disabled:opacity-50 font-vazir"
                        dir="rtl"
                      />
                    </div>

                    {/* یادداشت‌ها */}
                    <div>
                      <label className="text-white block mb-2">یادداشت‌ها</label>
                      <textarea
                        value={selectedSong.notes || ''}
                        onChange={(e) => setSelectedSong({ ...selectedSong, notes: e.target.value })}
                        disabled={!isEditing}
                        rows={3}
                        className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-600 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 py-20">
                  <Music size={64} className="mx-auto mb-4 opacity-50" />
                  <p>یک سرود را انتخاب کنید یا سرود جدیدی اضافه کنید</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWorshipManager;
