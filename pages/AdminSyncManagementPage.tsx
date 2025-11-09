// pages/AdminSyncManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { 
  Music, 
  BookOpen, 
  RefreshCw, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertCircle,
  Download,
  Play,
  Pause
} from 'lucide-react';
import api from '../lib/axios';

interface WorshipSong {
  id: number;
  title: { fa: string; en: string };
  audioUrl: string;
  lyrics: { fa: string; en: string };
  hasTiming: boolean;
  lastSynced?: string;
}

interface BibleChapter {
  book: string;
  bookName: { fa: string; en: string };
  chapter: number;
  audioUrl: string;
  translation: string;
  hasTiming: boolean;
  lastSynced?: string;
}

interface ProcessingStatus {
  type: 'worship' | 'bible';
  id: number | string;
  status: 'processing' | 'success' | 'error';
  progress?: number;
  message?: string;
}

const AdminSyncManagementPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'worship' | 'bible'>('worship');
  
  // Worship Songs State
  const [worshipSongs, setWorshipSongs] = useState<WorshipSong[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Set<number>>(new Set());
  
  // Bible Chapters State
  const [bibleChapters, setBibleChapters] = useState<BibleChapter[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  
  // Processing State
  const [processing, setProcessing] = useState<Map<string, ProcessingStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Audio Upload State
  const [uploadMode, setUploadMode] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMetadata, setUploadMetadata] = useState({
    titleFa: '',
    titleEn: '',
    lyricsFa: '',
    lyricsEn: '',
    autoProcess: true
  });

  // Check if user is admin
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';

  useEffect(() => {
    if (isAdmin) {
      loadWorshipSongs();
      loadBibleChapters();
    }
  }, [isAdmin]);

  const loadWorshipSongs = async () => {
    try {
      const response = await api.get('/api/worship-songs');
      
      // Check if response is valid JSON
      if (!response.data || typeof response.data === 'string') {
        console.error('Invalid response from API:', response.data);
        setError(lang === 'fa' ? 'خطا در دریافت اطلاعات سرودها' : 'Error loading worship songs');
        return;
      }

      const songs = response.data.map((song: any) => ({
        ...song,
        hasTiming: song.hasTiming || false,
        lastSynced: song.timingUpdatedAt || null
      }));
      setWorshipSongs(songs);
    } catch (err: any) {
      console.error('Error loading worship songs:', err);
      
      // Better error handling
      if (err.response?.status === 401) {
        setError(lang === 'fa' ? 'لطفاً ابتدا وارد شوید' : 'Please login first');
      } else if (err.response?.status === 403) {
        setError(lang === 'fa' ? 'دسترسی غیرمجاز' : 'Access denied');
      } else {
        setError(lang === 'fa' ? 'خطا در بارگذاری سرودها' : 'Error loading songs');
      }
    }
  };

  const loadBibleChapters = async () => {
    try {
      // TODO: Implement API to get Bible chapters with audio
      // For now, mock data
      const mockChapters: BibleChapter[] = [
        {
          book: 'GEN',
          bookName: { fa: 'پیدایش', en: 'Genesis' },
          chapter: 1,
          audioUrl: 'https://samanabyar.online/audio/bible/GEN_1_fa.mp3',
          translation: 'fa',
          hasTiming: false
        }
      ];
      setBibleChapters(mockChapters);
    } catch (err) {
      console.error('Error loading Bible chapters:', err);
    }
  };

  const handleWorshipSongSelect = (songId: number) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(songId)) {
      newSelected.delete(songId);
    } else {
      newSelected.add(songId);
    }
    setSelectedSongs(newSelected);
  };

  const handleSelectAllSongs = () => {
    if (selectedSongs.size === worshipSongs.length) {
      setSelectedSongs(new Set());
    } else {
      setSelectedSongs(new Set(worshipSongs.map(s => s.id)));
    }
  };

  const handleProcessWorshipSong = async (songId: number) => {
    const song = worshipSongs.find(s => s.id === songId);
    if (!song) return;

    const key = `worship-${songId}`;
    setProcessing(prev => new Map(prev).set(key, {
      type: 'worship',
      id: songId,
      status: 'processing',
      progress: 0,
      message: lang === 'fa' ? 'در حال پردازش...' : 'Processing...'
    }));

    try {
      // Fetch audio file
      const audioResponse = await fetch(song.audioUrl);
      const audioBlob = await audioResponse.blob();
      
      // Create FormData
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.mp3');
      formData.append('finglishText', song.lyrics.en);
      formData.append('persianText', song.lyrics.fa);
      formData.append('worshipSongId', songId.toString());

      // Process with backend
      const response = await api.post('/api/audio-sync/process-worship', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProcessing(prev => new Map(prev).set(key, {
              type: 'worship',
              id: songId,
              status: 'processing',
              progress,
              message: `${lang === 'fa' ? 'آپلود' : 'Uploading'}: ${progress}%`
            }));
          }
        }
      });

      if (response.data.success) {
        // Timing data is already saved to database by backend
        // No need to save again

        setProcessing(prev => new Map(prev).set(key, {
          type: 'worship',
          id: songId,
          status: 'success',
          progress: 100,
          message: lang === 'fa' ? '✅ همگام‌سازی موفق' : '✅ Sync successful'
        }));

        // Update song status
        setWorshipSongs(prev => prev.map(s => 
          s.id === songId 
            ? { ...s, hasTiming: true, lastSynced: new Date().toISOString() }
            : s
        ));
      }
    } catch (err: any) {
      console.error('Error processing worship song:', err);
      setProcessing(prev => new Map(prev).set(key, {
        type: 'worship',
        id: songId,
        status: 'error',
        message: err.response?.data?.error || err.message || 'Processing failed'
      }));
    }
  };

  const handleProcessBibleChapter = async (book: string, chapter: number, translation: string) => {
    const chapterKey = `${book}_${chapter}_${translation}`;
    const bibleChapter = bibleChapters.find(
      c => c.book === book && c.chapter === chapter && c.translation === translation
    );
    
    if (!bibleChapter) return;

    const key = `bible-${chapterKey}`;
    setProcessing(prev => new Map(prev).set(key, {
      type: 'bible',
      id: chapterKey,
      status: 'processing',
      progress: 0,
      message: lang === 'fa' ? 'در حال پردازش کتاب مقدس...' : 'Processing Bible...'
    }));

    try {
      // Get verses from database
      const versesResponse = await api.get(`/api/bible/verses`, {
        params: { book, chapter, translation }
      });

      const response = await api.post('/api/audio-sync/process-bible', {
        audioUrl: bibleChapter.audioUrl,
        bookName: bibleChapter.bookName.en,
        bookCode: book,
        chapter,
        verses: versesResponse.data,
        translation
      });

      if (response.data.success) {
        // Timing data is already saved to database by backend
        // No need to save again

        setProcessing(prev => new Map(prev).set(key, {
          type: 'bible',
          id: chapterKey,
          status: 'success',
          progress: 100,
          message: lang === 'fa' ? '✅ همگام‌سازی موفق' : '✅ Sync successful'
        }));

        // Update chapter status
        setBibleChapters(prev => prev.map(c => 
          c.book === book && c.chapter === chapter && c.translation === translation
            ? { ...c, hasTiming: true, lastSynced: new Date().toISOString() }
            : c
        ));
      }
    } catch (err: any) {
      console.error('Error processing Bible chapter:', err);
      setProcessing(prev => new Map(prev).set(key, {
        type: 'bible',
        id: chapterKey,
        status: 'error',
        message: err.response?.data?.error || err.message || 'Processing failed'
      }));
    }
  };

  const handleBatchProcess = async () => {
    if (activeTab === 'worship') {
      for (const songId of selectedSongs) {
        await handleProcessWorshipSong(songId);
      }
    } else {
      for (const chapterKey of selectedChapters) {
        const [book, chapter, translation] = chapterKey.split('_');
        await handleProcessBibleChapter(book, parseInt(chapter), translation);
      }
    }
  };

  const handleUploadNewSong = async () => {
    if (!uploadFile || !uploadMetadata.titleFa || !uploadMetadata.lyricsEn) {
      setError(lang === 'fa' ? 'لطفاً همه فیلدها را پر کنید' : 'Please fill all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', uploadFile);
      formData.append('finglishText', uploadMetadata.lyricsEn);
      formData.append('persianText', uploadMetadata.lyricsFa);
      formData.append('titleFa', uploadMetadata.titleFa);
      formData.append('titleEn', uploadMetadata.titleEn);

      // Upload and optionally process
      const uploadResponse = await api.post('/api/worship-songs/upload', formData);
      
      if (uploadMetadata.autoProcess) {
        await handleProcessWorshipSong(uploadResponse.data.id);
      }

      // Reload songs
      await loadWorshipSongs();
      
      // Reset form
      setUploadMode(false);
      setUploadFile(null);
      setUploadMetadata({
        titleFa: '',
        titleEn: '',
        lyricsFa: '',
        lyricsEn: '',
        autoProcess: true
      });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">
            {lang === 'fa' ? 'دسترسی محدود' : 'Access Denied'}
          </h1>
          <p className="text-gray-400">
            {lang === 'fa' 
              ? 'فقط مدیران سایت به این بخش دسترسی دارند' 
              : 'Only site administrators can access this section'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {lang === 'fa' ? '⚡ مدیریت همگام‌سازی صوتی' : '⚡ Audio Sync Management'}
          </h1>
          <p className="text-gray-400">
            {lang === 'fa' 
              ? 'پردازش خودکار فایل‌های صوتی با هوش مصنوعی' 
              : 'Automated audio processing with AI'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('worship')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'worship'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Music className="w-5 h-5" />
            {lang === 'fa' ? 'سرودهای پرستشی' : 'Worship Songs'}
          </button>
          <button
            onClick={() => setActiveTab('bible')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'bible'
                ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            {lang === 'fa' ? 'کتاب مقدس صوتی' : 'Bible Audio'}
          </button>
        </div>

        {/* Worship Songs Tab */}
        {activeTab === 'worship' && (
          <div>
            {/* Actions */}
            <div className="flex flex-wrap gap-4 mb-6">
              <button
                onClick={() => setUploadMode(!uploadMode)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg hover:opacity-90 transition"
              >
                <Upload className="w-4 h-4" />
                {lang === 'fa' ? 'آپلود سرود جدید' : 'Upload New Song'}
              </button>
              
              {selectedSongs.size > 0 && (
                <button
                  onClick={handleBatchProcess}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {lang === 'fa' 
                    ? `پردازش دسته‌ای (${selectedSongs.size})` 
                    : `Batch Process (${selectedSongs.size})`}
                </button>
              )}

              <button
                onClick={handleSelectAllSongs}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
              >
                {selectedSongs.size === worshipSongs.length 
                  ? (lang === 'fa' ? 'لغو انتخاب همه' : 'Deselect All')
                  : (lang === 'fa' ? 'انتخاب همه' : 'Select All')}
              </button>
            </div>

            {/* Upload Form */}
            {uploadMode && (
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-4">
                  {lang === 'fa' ? '📤 آپلود سرود جدید' : '📤 Upload New Song'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2">
                      {lang === 'fa' ? 'فایل صوتی' : 'Audio File'}
                    </label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2">
                        {lang === 'fa' ? 'عنوان فارسی' : 'Persian Title'}
                      </label>
                      <input
                        type="text"
                        value={uploadMetadata.titleFa}
                        onChange={(e) => setUploadMetadata(prev => ({ ...prev, titleFa: e.target.value }))}
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg text-right"
                        dir="rtl"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2">
                        {lang === 'fa' ? 'عنوان انگلیسی' : 'English Title'}
                      </label>
                      <input
                        type="text"
                        value={uploadMetadata.titleEn}
                        onChange={(e) => setUploadMetadata(prev => ({ ...prev, titleEn: e.target.value }))}
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2">
                        {lang === 'fa' ? 'متن فارسی' : 'Persian Lyrics'}
                      </label>
                      <textarea
                        value={uploadMetadata.lyricsFa}
                        onChange={(e) => setUploadMetadata(prev => ({ ...prev, lyricsFa: e.target.value }))}
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg h-32 text-right font-['Tahoma']"
                        dir="rtl"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2">
                        {lang === 'fa' ? 'متن انگلیسی (Finglish)' : 'English Lyrics (Finglish)'}
                      </label>
                      <textarea
                        value={uploadMetadata.lyricsEn}
                        onChange={(e) => setUploadMetadata(prev => ({ ...prev, lyricsEn: e.target.value }))}
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg h-32"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoProcess"
                      checked={uploadMetadata.autoProcess}
                      onChange={(e) => setUploadMetadata(prev => ({ ...prev, autoProcess: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <label htmlFor="autoProcess" className="text-sm">
                      {lang === 'fa' 
                        ? 'پردازش خودکار پس از آپلود' 
                        : 'Auto-process after upload'}
                    </label>
                  </div>

                  {error && (
                    <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-300">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={handleUploadNewSong}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {lang === 'fa' ? 'آپلود و پردازش' : 'Upload & Process'}
                    </button>

                    <button
                      onClick={() => setUploadMode(false)}
                      className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                    >
                      {lang === 'fa' ? 'انصراف' : 'Cancel'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Songs List */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedSongs.size === worshipSongs.length}
                          onChange={handleSelectAllSongs}
                          className="w-4 h-4"
                        />
                      </th>
                      <th className="px-4 py-3 text-left">
                        {lang === 'fa' ? 'عنوان' : 'Title'}
                      </th>
                      <th className="px-4 py-3 text-center">
                        {lang === 'fa' ? 'وضعیت' : 'Status'}
                      </th>
                      <th className="px-4 py-3 text-center">
                        {lang === 'fa' ? 'آخرین همگام‌سازی' : 'Last Synced'}
                      </th>
                      <th className="px-4 py-3 text-center">
                        {lang === 'fa' ? 'عملیات' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {worshipSongs.map((song) => {
                      const key = `worship-${song.id}`;
                      const status = processing.get(key);
                      
                      return (
                        <tr key={song.id} className="border-t border-gray-700 hover:bg-gray-750">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedSongs.has(song.id)}
                              onChange={() => handleWorshipSongSelect(song.id)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold">
                              {lang === 'fa' ? song.title.fa : song.title.en}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {status?.status === 'processing' ? (
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                                <span className="text-sm text-blue-400">{status.progress}%</span>
                              </div>
                            ) : status?.status === 'success' ? (
                              <CheckCircle className="w-5 h-5 mx-auto text-green-500" />
                            ) : status?.status === 'error' ? (
                              <XCircle className="w-5 h-5 mx-auto text-red-500" />
                            ) : song.hasTiming ? (
                              <CheckCircle className="w-5 h-5 mx-auto text-green-500" />
                            ) : (
                              <span className="text-gray-500 text-sm">
                                {lang === 'fa' ? 'نیاز به پردازش' : 'Not processed'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-400">
                            {song.lastSynced 
                              ? new Date(song.lastSynced).toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US')
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleProcessWorshipSong(song.id)}
                              disabled={status?.status === 'processing'}
                              className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              {status?.status === 'processing' ? (
                                <Loader2 className="w-4 h-4 animate-spin inline" />
                              ) : (
                                <RefreshCw className="w-4 h-4 inline" />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Bible Chapters Tab */}
        {activeTab === 'bible' && (
          <div>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-center text-gray-400">
                {lang === 'fa' 
                  ? 'بخش پردازش کتاب مقدس به زودی فعال می‌شود...' 
                  : 'Bible processing section coming soon...'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSyncManagementPage;
