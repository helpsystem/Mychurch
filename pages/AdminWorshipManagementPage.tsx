import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface WorshipSong {
  id: number;
  title: string;
  artist: string;
  category: string;
  lyrics?: string;
  audioFile?: string;
  hasTimingData?: boolean;
}

const AdminWorshipManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [songs, setSongs] = useState<WorshipSong[]>([]);
  const [selectedSong, setSelectedSong] = useState<WorshipSong | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTimingRecorder, setShowTimingRecorder] = useState(false);

  // فرم آپلود سرود جدید
  const [newSong, setNewSong] = useState({
    title: '',
    artist: '',
    category: 'Worship',
    lyrics: '',
    audioFile: null as File | null,
  });

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      // بارگذاری لیست سرودها
      const response = await fetch('/api/worship/songs');
      const data = await response.json();
      setSongs(data);
    } catch (error) {
      console.error('خطا در بارگذاری سرودها:', error);
    }
  };

  const handleUploadSong = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', newSong.title);
    formData.append('artist', newSong.artist);
    formData.append('category', newSong.category);
    formData.append('lyrics', newSong.lyrics);
    if (newSong.audioFile) {
      formData.append('audioFile', newSong.audioFile);
    }

    try {
      const response = await fetch('/api/worship/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('✅ سرود با موفقیت آپلود شد!');
        setShowUploadModal(false);
        loadSongs();
        setNewSong({ title: '', artist: '', category: 'Worship', lyrics: '', audioFile: null });
      }
    } catch (error) {
      console.error('خطا در آپلود:', error);
      alert('❌ خطا در آپلود سرود');
    }
  };

  const openTimingRecorder = (song: WorshipSong) => {
    setSelectedSong(song);
    // باز کردن صفحه timing recorder در تب جدید
    const url = `/timing-recorder.html?songId=${song.id}&title=${encodeURIComponent(song.title)}`;
    window.open(url, '_blank', 'width=1200,height=800');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                🎵 مدیریت سرودهای پرستشی
              </h1>
              <p className="text-gray-600">
                آپلود سرود، ثبت متن، و ضبط تایمینگ کلمات
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
            >
              ➕ افزودن سرود جدید
            </button>
          </div>
        </div>

        {/* آمار */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">کل سرودها</p>
                <p className="text-3xl font-bold text-purple-600">{songs.length}</p>
              </div>
              <div className="text-5xl">🎵</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">دارای تایمینگ</p>
                <p className="text-3xl font-bold text-green-600">
                  {songs.filter(s => s.hasTimingData).length}
                </p>
              </div>
              <div className="text-5xl">✅</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">نیاز به تایمینگ</p>
                <p className="text-3xl font-bold text-orange-600">
                  {songs.filter(s => !s.hasTimingData).length}
                </p>
              </div>
              <div className="text-5xl">⏱️</div>
            </div>
          </div>
        </div>

        {/* لیست سرودها */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 لیست سرودها</h2>
          
          <div className="space-y-4">
            {songs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎵</div>
                <p className="text-gray-500 text-lg">هنوز سرودی اضافه نشده است</p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="mt-4 text-purple-600 hover:text-purple-700 font-bold"
                >
                  اولین سرود را اضافه کنید
                </button>
              </div>
            ) : (
              songs.map((song) => (
                <div
                  key={song.id}
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">
                        {song.title}
                      </h3>
                      <p className="text-gray-600 mb-2">{song.artist}</p>
                      <div className="flex gap-2">
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                          {song.category}
                        </span>
                        {song.hasTimingData && (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                            ✅ تایمینگ ثبت شده
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => openTimingRecorder(song)}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-all"
                      >
                        ⏱️ ضبط تایمینگ
                      </button>
                      <button
                        onClick={() => setSelectedSong(song)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all"
                      >
                        ✏️ ویرایش
                      </button>
                      <button
                        onClick={() => {
                          // پخش نمونه
                          navigate(`/worship/${song.id}`);
                        }}
                        className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-all"
                      >
                        ▶️ مشاهده
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* مودال آپلود سرود جدید */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">➕ افزودن سرود جدید</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUploadSong} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-bold mb-2">
                    🎵 نام سرود
                  </label>
                  <input
                    type="text"
                    value={newSong.title}
                    onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500"
                    placeholder="مثال: الشدای"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-2">
                    🎤 خواننده / گروه
                  </label>
                  <input
                    type="text"
                    value={newSong.artist}
                    onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500"
                    placeholder="مثال: فرشید فتحعلیان"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-2">
                    📁 دسته‌بندی
                  </label>
                  <select
                    value={newSong.category}
                    onChange={(e) => setNewSong({ ...newSong, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Worship">پرستش</option>
                    <option value="Praise">ستایش</option>
                    <option value="Prayer">دعا</option>
                    <option value="Christmas">کریسمس</option>
                    <option value="Easter">عید پاک</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-2">
                    📝 متن سرود
                  </label>
                  <textarea
                    value={newSong.lyrics}
                    onChange={(e) => setNewSong({ ...newSong, lyrics: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 font-mono"
                    rows={12}
                    placeholder="متن سرود را وارد کنید...&#10;&#10;V1&#10;[C]الشدا[Dm]ی الشدا[G]ی&#10;..."
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    💡 می‌توانید کوردها را با [] مشخص کنید، مثل: [C] [Dm] [G]
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-2">
                    🎧 فایل صوتی
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setNewSong({ ...newSong, audioFile: e.target.files?.[0] || null })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    فرمت‌های مجاز: MP3, WAV, M4A
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                  >
                    ✅ ذخیره سرود
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-6 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWorshipManagementPage;
