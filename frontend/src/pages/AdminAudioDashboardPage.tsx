// AdminAudioDashboardPage.tsx
// ============================================================
// 📊 Admin Dashboard for Bible Audio Management
// ============================================================
// Features:
//   - Display audio inventory statistics (180/1189 files)
//   - List available and missing chapters
//   - Bulk download controls (by book, testament, or all)
//   - Download queue with progress tracking
//   - Error handling and retry mechanism
// ============================================================

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import axios from 'axios';
import { Download, RefreshCw, AlertCircle, CheckCircle, XCircle, Play, Pause, Trash2 } from 'lucide-react';

interface AudioInventory {
  totalFiles: number;
  totalSize: number;
  byBook: {
    [bookCode: string]: {
      chapters: number[];
      totalSize: number;
    };
  };
}

interface DownloadJob {
  id: string;
  book: string;
  chapter: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  startTime?: number;
  endTime?: number;
}

interface BibleBook {
  code: string;
  name_en: string;
  name_fa: string;
  chapters: number;
  testament: 'OT' | 'NT';
}

// Bible structure (66 books)
const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament (39 books)
  { code: 'GEN', name_en: 'Genesis', name_fa: 'پیدایش', chapters: 50, testament: 'OT' },
  { code: 'EXO', name_en: 'Exodus', name_fa: 'خروج', chapters: 40, testament: 'OT' },
  { code: 'LEV', name_en: 'Leviticus', name_fa: 'لاویان', chapters: 27, testament: 'OT' },
  { code: 'NUM', name_en: 'Numbers', name_fa: 'اعداد', chapters: 36, testament: 'OT' },
  { code: 'DEU', name_en: 'Deuteronomy', name_fa: 'تثنیه', chapters: 34, testament: 'OT' },
  { code: 'JOS', name_en: 'Joshua', name_fa: 'یوشع', chapters: 24, testament: 'OT' },
  { code: 'JDG', name_en: 'Judges', name_fa: 'داوران', chapters: 21, testament: 'OT' },
  { code: 'RUT', name_en: 'Ruth', name_fa: 'روت', chapters: 4, testament: 'OT' },
  { code: '1SA', name_en: '1 Samuel', name_fa: 'اول سموئیل', chapters: 31, testament: 'OT' },
  { code: '2SA', name_en: '2 Samuel', name_fa: 'دوم سموئیل', chapters: 24, testament: 'OT' },
  { code: '1KI', name_en: '1 Kings', name_fa: 'اول پادشاهان', chapters: 22, testament: 'OT' },
  { code: '2KI', name_en: '2 Kings', name_fa: 'دوم پادشاهان', chapters: 25, testament: 'OT' },
  { code: '1CH', name_en: '1 Chronicles', name_fa: 'اول تواریخ', chapters: 29, testament: 'OT' },
  { code: '2CH', name_en: '2 Chronicles', name_fa: 'دوم تواریخ', chapters: 36, testament: 'OT' },
  { code: 'EZR', name_en: 'Ezra', name_fa: 'عزرا', chapters: 10, testament: 'OT' },
  { code: 'NEH', name_en: 'Nehemiah', name_fa: 'نحمیا', chapters: 13, testament: 'OT' },
  { code: 'EST', name_en: 'Esther', name_fa: 'استر', chapters: 10, testament: 'OT' },
  { code: 'JOB', name_en: 'Job', name_fa: 'ایوب', chapters: 42, testament: 'OT' },
  { code: 'PSA', name_en: 'Psalms', name_fa: 'مزامیر', chapters: 150, testament: 'OT' },
  { code: 'PRO', name_en: 'Proverbs', name_fa: 'امثال', chapters: 31, testament: 'OT' },
  { code: 'ECC', name_en: 'Ecclesiastes', name_fa: 'جامعه', chapters: 12, testament: 'OT' },
  { code: 'SNG', name_en: 'Song of Solomon', name_fa: 'غزل غزلها', chapters: 8, testament: 'OT' },
  { code: 'ISA', name_en: 'Isaiah', name_fa: 'اشعیا', chapters: 66, testament: 'OT' },
  { code: 'JER', name_en: 'Jeremiah', name_fa: 'ارمیا', chapters: 52, testament: 'OT' },
  { code: 'LAM', name_en: 'Lamentations', name_fa: 'مراثی ارمیا', chapters: 5, testament: 'OT' },
  { code: 'EZK', name_en: 'Ezekiel', name_fa: 'حزقیال', chapters: 48, testament: 'OT' },
  { code: 'DAN', name_en: 'Daniel', name_fa: 'دانیال', chapters: 12, testament: 'OT' },
  { code: 'HOS', name_en: 'Hosea', name_fa: 'هوشع', chapters: 14, testament: 'OT' },
  { code: 'JOL', name_en: 'Joel', name_fa: 'یوئیل', chapters: 3, testament: 'OT' },
  { code: 'AMO', name_en: 'Amos', name_fa: 'عاموس', chapters: 9, testament: 'OT' },
  { code: 'OBA', name_en: 'Obadiah', name_fa: 'عوبدیا', chapters: 1, testament: 'OT' },
  { code: 'JON', name_en: 'Jonah', name_fa: 'یونس', chapters: 4, testament: 'OT' },
  { code: 'MIC', name_en: 'Micah', name_fa: 'میکاه', chapters: 7, testament: 'OT' },
  { code: 'NAM', name_en: 'Nahum', name_fa: 'ناحوم', chapters: 3, testament: 'OT' },
  { code: 'HAB', name_en: 'Habakkuk', name_fa: 'حبقوق', chapters: 3, testament: 'OT' },
  { code: 'ZEP', name_en: 'Zephaniah', name_fa: 'صفنیا', chapters: 3, testament: 'OT' },
  { code: 'HAG', name_en: 'Haggai', name_fa: 'حجی', chapters: 2, testament: 'OT' },
  { code: 'ZEC', name_en: 'Zechariah', name_fa: 'زکریا', chapters: 14, testament: 'OT' },
  { code: 'MAL', name_en: 'Malachi', name_fa: 'ملاکی', chapters: 4, testament: 'OT' },
  // New Testament (27 books)
  { code: 'MAT', name_en: 'Matthew', name_fa: 'متی', chapters: 28, testament: 'NT' },
  { code: 'MRK', name_en: 'Mark', name_fa: 'مرقس', chapters: 16, testament: 'NT' },
  { code: 'LUK', name_en: 'Luke', name_fa: 'لوقا', chapters: 24, testament: 'NT' },
  { code: 'JHN', name_en: 'John', name_fa: 'یوحنا', chapters: 21, testament: 'NT' },
  { code: 'ACT', name_en: 'Acts', name_fa: 'اعمال رسولان', chapters: 28, testament: 'NT' },
  { code: 'ROM', name_en: 'Romans', name_fa: 'رومیان', chapters: 16, testament: 'NT' },
  { code: '1CO', name_en: '1 Corinthians', name_fa: 'اول قرنتیان', chapters: 16, testament: 'NT' },
  { code: '2CO', name_en: '2 Corinthians', name_fa: 'دوم قرنتیان', chapters: 13, testament: 'NT' },
  { code: 'GAL', name_en: 'Galatians', name_fa: 'غلاطیان', chapters: 6, testament: 'NT' },
  { code: 'EPH', name_en: 'Ephesians', name_fa: 'افسسیان', chapters: 6, testament: 'NT' },
  { code: 'PHP', name_en: 'Philippians', name_fa: 'فیلیپیان', chapters: 4, testament: 'NT' },
  { code: 'COL', name_en: 'Colossians', name_fa: 'کولسیان', chapters: 4, testament: 'NT' },
  { code: '1TH', name_en: '1 Thessalonians', name_fa: 'اول تسالونیکیان', chapters: 5, testament: 'NT' },
  { code: '2TH', name_en: '2 Thessalonians', name_fa: 'دوم تسالونیکیان', chapters: 3, testament: 'NT' },
  { code: '1TI', name_en: '1 Timothy', name_fa: 'اول تیموتائوس', chapters: 6, testament: 'NT' },
  { code: '2TI', name_en: '2 Timothy', name_fa: 'دوم تیموتائوس', chapters: 4, testament: 'NT' },
  { code: 'TIT', name_en: 'Titus', name_fa: 'تیطس', chapters: 3, testament: 'NT' },
  { code: 'PHM', name_en: 'Philemon', name_fa: 'فلیمون', chapters: 1, testament: 'NT' },
  { code: 'HEB', name_en: 'Hebrews', name_fa: 'عبرانیان', chapters: 13, testament: 'NT' },
  { code: 'JAS', name_en: 'James', name_fa: 'یعقوب', chapters: 5, testament: 'NT' },
  { code: '1PE', name_en: '1 Peter', name_fa: 'اول پطرس', chapters: 5, testament: 'NT' },
  { code: '2PE', name_en: '2 Peter', name_fa: 'دوم پطرس', chapters: 3, testament: 'NT' },
  { code: '1JN', name_en: '1 John', name_fa: 'اول یوحنا', chapters: 5, testament: 'NT' },
  { code: '2JN', name_en: '2 John', name_fa: 'دوم یوحنا', chapters: 1, testament: 'NT' },
  { code: '3JN', name_en: '3 John', name_fa: 'سوم یوحنا', chapters: 1, testament: 'NT' },
  { code: 'JUD', name_en: 'Jude', name_fa: 'یهودا', chapters: 1, testament: 'NT' },
  { code: 'REV', name_en: 'Revelation', name_fa: 'مکاشفه', chapters: 22, testament: 'NT' },
];

const TOTAL_CHAPTERS = BIBLE_BOOKS.reduce((sum, book) => sum + book.chapters, 0); // 1,189

const AdminAudioDashboardPage: React.FC = () => {
  const { lang } = useLanguage();
  const [inventory, setInventory] = useState<AudioInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadQueue, setDownloadQueue] = useState<DownloadJob[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  // Load inventory on mount
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/audio/inventory');
      setInventory(response.data.inventory);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = inventory ? {
    available: inventory.totalFiles,
    missing: TOTAL_CHAPTERS - inventory.totalFiles,
    percentage: ((inventory.totalFiles / TOTAL_CHAPTERS) * 100).toFixed(1),
    sizeMB: (inventory.totalSize / (1024 * 1024)).toFixed(2),
  } : null;

  // Get missing chapters for a book
  const getMissingChapters = (book: BibleBook): number[] => {
    if (!inventory) return [];
    const available = inventory.byBook[book.code]?.chapters || [];
    const all = Array.from({ length: book.chapters }, (_, i) => i + 1);
    return all.filter(ch => !available.includes(ch));
  };

  // Start download for specific book
  const downloadBook = (book: BibleBook) => {
    const missing = getMissingChapters(book);
    const jobs: DownloadJob[] = missing.map(chapter => ({
      id: `${book.code}_${chapter}`,
      book: book.code,
      chapter,
      status: 'pending',
      progress: 0,
    }));
    setDownloadQueue(prev => [...prev, ...jobs]);
    startDownloadProcess();
  };

  // Start download for entire testament
  const downloadTestament = (testament: 'OT' | 'NT') => {
    const books = BIBLE_BOOKS.filter(b => b.testament === testament);
    const jobs: DownloadJob[] = [];
    books.forEach(book => {
      const missing = getMissingChapters(book);
      missing.forEach(chapter => {
        jobs.push({
          id: `${book.code}_${chapter}`,
          book: book.code,
          chapter,
          status: 'pending',
          progress: 0,
        });
      });
    });
    setDownloadQueue(prev => [...prev, ...jobs]);
    startDownloadProcess();
  };

  // Start download for entire Bible
  const downloadAll = () => {
    const jobs: DownloadJob[] = [];
    BIBLE_BOOKS.forEach(book => {
      const missing = getMissingChapters(book);
      missing.forEach(chapter => {
        jobs.push({
          id: `${book.code}_${chapter}`,
          book: book.code,
          chapter,
          status: 'pending',
          progress: 0,
        });
      });
    });
    setDownloadQueue(prev => [...prev, ...jobs]);
    startDownloadProcess();
  };

  // Process download queue
  const startDownloadProcess = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    await processQueue();
  };

  const processQueue = async () => {
    try {
      // Send batch download request to backend
      const jobs = downloadQueue
        .filter(job => job.status === 'pending')
        .map(job => ({ book: job.book, chapter: job.chapter }));

      if (jobs.length === 0) {
        setIsDownloading(false);
        return;
      }

      const response = await axios.post('/api/downloads/start', { jobs });
      
      if (response.data.success) {
        console.log('Download batch started:', response.data);
        
        // Start polling for status updates
        pollDownloadStatus();
      }
    } catch (error) {
      console.error('Failed to start downloads:', error);
      setIsDownloading(false);
    }
  };

  // Poll download status
  const pollDownloadStatus = async () => {
    try {
      const response = await axios.get('/api/downloads/status');
      
      if (response.data.success) {
        const { status } = response.data;
        
        // Update queue with current status
        setDownloadQueue(prevQueue => {
          return prevQueue.map(job => {
            const serverJob = status.jobs.find((j: any) => j.id === job.id);
            if (serverJob) {
              return {
                ...job,
                status: serverJob.status,
                progress: serverJob.progress || 0,
                error: serverJob.error,
              };
            }
            return job;
          });
        });

        // Check if any downloads are still active
        const hasActive = status.jobs.some((j: any) => 
          j.status === 'downloading' || j.status === 'pending'
        );

        if (hasActive) {
          // Continue polling
          setTimeout(pollDownloadStatus, 2000); // Poll every 2 seconds
        } else {
          // All done
          setIsDownloading(false);
          fetchInventory(); // Refresh inventory
        }
      }
    } catch (error) {
      console.error('Failed to poll download status:', error);
      setIsDownloading(false);
    }
  };

  const clearCompleted = () => {
    setDownloadQueue(prev => prev.filter(job => job.status !== 'completed'));
  };

  const cancelDownload = (id: string) => {
    setDownloadQueue(prev => prev.filter(job => job.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">
            {lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          {lang === 'fa' ? '📊 مدیریت فایل‌های صوتی کتاب مقدس' : '📊 Bible Audio Management Dashboard'}
        </h1>
        <p className="text-gray-600">
          {lang === 'fa' 
            ? 'دانلود و مدیریت فایل‌های صوتی کتاب مقدس از WordProject'
            : 'Download and manage Bible audio files from WordProject'}
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-400 to-green-600 text-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-8 w-8" />
              <span className="text-3xl font-bold">{stats.available}</span>
            </div>
            <p className="text-sm opacity-90">
              {lang === 'fa' ? 'فایل‌های موجود' : 'Available Files'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-400 to-red-600 text-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="h-8 w-8" />
              <span className="text-3xl font-bold">{stats.missing}</span>
            </div>
            <p className="text-sm opacity-90">
              {lang === 'fa' ? 'فایل‌های ناموجود' : 'Missing Files'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Download className="h-8 w-8" />
              <span className="text-3xl font-bold">{stats.percentage}%</span>
            </div>
            <p className="text-sm opacity-90">
              {lang === 'fa' ? 'درصد تکمیل' : 'Completion'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-400 to-purple-600 text-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="h-8 w-8" />
              <span className="text-3xl font-bold">{stats.sizeMB} MB</span>
            </div>
            <p className="text-sm opacity-90">
              {lang === 'fa' ? 'حجم کل' : 'Total Size'}
            </p>
          </div>
        </div>
      )}

      {/* Bulk Download Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {lang === 'fa' ? 'دانلود گروهی' : 'Bulk Download'}
        </h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={downloadAll}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition"
          >
            <Download className="h-5 w-5" />
            {lang === 'fa' ? 'دانلود کل کتاب مقدس' : 'Download Entire Bible'}
            {stats && ` (${stats.missing} ${lang === 'fa' ? 'فایل' : 'files'})`}
          </button>

          <button
            onClick={() => downloadTestament('OT')}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition"
          >
            <Download className="h-5 w-5" />
            {lang === 'fa' ? 'دانلود عهد عتیق' : 'Download Old Testament'}
          </button>

          <button
            onClick={() => downloadTestament('NT')}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
          >
            <Download className="h-5 w-5" />
            {lang === 'fa' ? 'دانلود عهد جدید' : 'Download New Testament'}
          </button>

          <button
            onClick={fetchInventory}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition"
          >
            <RefreshCw className="h-5 w-5" />
            {lang === 'fa' ? 'بروزرسانی' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Download Queue */}
      {downloadQueue.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {lang === 'fa' ? 'صف دانلود' : 'Download Queue'}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({downloadQueue.length} {lang === 'fa' ? 'فایل' : 'files'})
              </span>
            </h2>
            <button
              onClick={clearCompleted}
              className="flex items-center gap-2 text-sm bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
            >
              <Trash2 className="h-4 w-4" />
              {lang === 'fa' ? 'پاک کردن تکمیل شده‌ها' : 'Clear Completed'}
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {downloadQueue.map(job => (
              <div
                key={job.id}
                className="flex items-center gap-4 p-4 border-b border-gray-200 hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">
                    {BIBLE_BOOKS.find(b => b.code === job.book)?.[lang === 'fa' ? 'name_fa' : 'name_en']} {job.chapter}
                  </p>
                  <p className="text-sm text-gray-500">{job.book} Chapter {job.chapter}</p>
                </div>

                <div className="flex items-center gap-2">
                  {job.status === 'pending' && (
                    <span className="text-yellow-600">
                      {lang === 'fa' ? 'در انتظار' : 'Pending'}
                    </span>
                  )}
                  {job.status === 'downloading' && (
                    <span className="text-blue-600 flex items-center gap-1">
                      <RefreshCw className="animate-spin h-4 w-4" />
                      {job.progress}%
                    </span>
                  )}
                  {job.status === 'completed' && (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      {lang === 'fa' ? 'تکمیل شد' : 'Completed'}
                    </span>
                  )}
                  {job.status === 'failed' && (
                    <span className="text-red-600 flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      {lang === 'fa' ? 'خطا' : 'Failed'}
                    </span>
                  )}

                  <button
                    onClick={() => cancelDownload(job.id)}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Books List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {lang === 'fa' ? 'لیست کتاب‌ها' : 'Books List'}
        </h2>

        {/* Old Testament */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-3">
            {lang === 'fa' ? '📖 عهد عتیق (39 کتاب)' : '📖 Old Testament (39 Books)'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BIBLE_BOOKS.filter(b => b.testament === 'OT').map(book => {
              const missing = getMissingChapters(book);
              const available = book.chapters - missing.length;
              const percentage = ((available / book.chapters) * 100).toFixed(0);

              return (
                <div key={book.code} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">
                      {lang === 'fa' ? book.name_fa : book.name_en}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {available}/{book.chapters}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {missing.length > 0 && (
                    <button
                      onClick={() => downloadBook(book)}
                      className="w-full flex items-center justify-center gap-2 text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded transition"
                    >
                      <Download className="h-4 w-4" />
                      {lang === 'fa' ? `دانلود ${missing.length} فصل` : `Download ${missing.length} chapters`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* New Testament */}
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-3">
            {lang === 'fa' ? '📖 عهد جدید (27 کتاب)' : '📖 New Testament (27 Books)'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {BIBLE_BOOKS.filter(b => b.testament === 'NT').map(book => {
              const missing = getMissingChapters(book);
              const available = book.chapters - missing.length;
              const percentage = ((available / book.chapters) * 100).toFixed(0);

              return (
                <div key={book.code} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">
                      {lang === 'fa' ? book.name_fa : book.name_en}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {available}/{book.chapters}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  {missing.length > 0 && (
                    <button
                      onClick={() => downloadBook(book)}
                      className="w-full flex items-center justify-center gap-2 text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded transition"
                    >
                      <Download className="h-4 w-4" />
                      {lang === 'fa' ? `دانلود ${missing.length} فصل` : `Download ${missing.length} chapters`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAudioDashboardPage;
