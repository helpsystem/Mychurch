import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import {
  CheckCircle, XCircle, AlertCircle, RefreshCw,
  Music, FileText, Clock, Activity, Play, TrendingUp
} from 'lucide-react';

interface HealthStats {
  total: number;
  withAudio: number;
  audioMissingFile?: number; // New field
  withLyrics: number;
  withTiming: number;
  withChords: number;
  fullyComplete: number;
  processingStatus: {
    completed: number;
    queued: number;
    processing: number;
    failed: number;
  };
}

interface Percentages {
  withAudio: string;
  audioMissingFile?: string; // New field
  withLyrics: string;
  withTiming: string;
  withChords: string;
  fullyComplete: string;
  completed: string;
}



const WorshipSongsHealthDashboard: React.FC = () => {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [percentages, setPercentages] = useState<Percentages | null>(null);
  const [health, setHealth] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [incompleteSongs, setIncompleteSongs] = useState<any[]>([]);

  useEffect(() => {
    loadHealthStats();
  }, []);

  const loadHealthStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/worship-songs/health-check');
      setStats(response.data.stats);
      setPercentages(response.data.percentages);
      setHealth(response.data.health);
    } catch (error) {
      console.error('Failed to load health stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIncompleteSongs = async () => {
    try {
      const response = await axios.get('/api/worship-songs/incomplete');
      setIncompleteSongs(response.data.songs);
    } catch (error) {
      console.error('Failed to load incomplete songs:', error);
    }
  };

  const handleProcessAll = async () => {
    if (!confirm(lang === 'fa'
      ? 'آیا مطمئن هستید که می‌خواهید همه سرودهای ناقص را پردازش کنید؟'
      : 'Are you sure you want to process all incomplete songs?')) {
      return;
    }

    try {
      setProcessing(true);
      const response = await axios.post('/api/worship-songs/process-all', {
        generateTiming: true
      });

      alert(lang === 'fa'
        ? `${response.data.queued} سرود در صف پردازش قرار گرفت`
        : `${response.data.queued} songs queued for processing`);

      await loadHealthStats();
    } catch (error: any) {
      alert(lang === 'fa'
        ? `خطا: ${error.response?.data?.message || error.message}`
        : `Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      default: return 'text-red-500';
    }
  };

  const getHealthText = (health: string) => {
    if (lang === 'fa') {
      switch (health) {
        case 'excellent': return 'عالی';
        case 'good': return 'خوب';
        case 'fair': return 'متوسط';
        default: return 'نیاز به توجه';
      }
    } else {
      switch (health) {
        case 'excellent': return 'Excellent';
        case 'good': return 'Good';
        case 'fair': return 'Fair';
        default: return 'Needs Attention';
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {lang === 'fa' ? '🎵 داشبورد سلامت سرودهای پرستشی' : '🎵 Worship Songs Health Dashboard'}
          </h1>
          <p className="text-gray-300">
            {lang === 'fa'
              ? 'بررسی وضعیت و کامل بودن تمام سرودها'
              : 'Monitor status and completeness of all worship songs'}
          </p>
        </div>

        {/* Health Overview */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 mb-6 border border-purple-500/30 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="text-purple-400" />
              {lang === 'fa' ? 'وضعیت کلی' : 'Overall Health'}
            </h2>
            <button
              onClick={loadHealthStats}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
              title={lang === 'fa' ? 'بروزرسانی' : 'Refresh'}
            >
              <RefreshCw size={20} className="text-white" />
            </button>
          </div>

          {stats && percentages && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Total Songs */}
              <div className="bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">{lang === 'fa' ? 'کل سرودها' : 'Total Songs'}</span>
                  <Music className="text-blue-400" size={24} />
                </div>
                <div className="text-3xl font-bold text-white">{stats.total}</div>
              </div>

              {/* Fully Complete */}
              <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-xl p-4 border border-green-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">{lang === 'fa' ? 'کامل شده' : 'Fully Complete'}</span>
                  <CheckCircle className="text-green-400" size={24} />
                </div>
                <div className="text-3xl font-bold text-green-400">
                  {stats.fullyComplete}
                  <span className="text-lg ml-2">({percentages.fullyComplete}%)</span>
                </div>
              </div>

              {/* Health Status */}
              <div className={`bg-gray-700/50 rounded-xl p-4 border ${health === 'excellent' ? 'border-green-500/30' :
                health === 'good' ? 'border-blue-500/30' :
                  health === 'fair' ? 'border-yellow-500/30' :
                    'border-red-500/30'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">{lang === 'fa' ? 'وضعیت سلامت' : 'Health Status'}</span>
                  <TrendingUp className={getHealthColor(health)} size={24} />
                </div>
                <div className={`text-2xl font-bold ${getHealthColor(health)}`}>
                  {getHealthText(health)}
                </div>
              </div>

              <div className="bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">{lang === 'fa' ? 'دارای صدا' : 'With Audio'}</span>
                  <Play className="text-purple-400" size={24} />
                </div>
                <div className="text-2xl font-bold text-white">
                  {stats.withAudio}
                  <span className="text-sm ml-2 text-gray-400">({percentages.withAudio}%)</span>
                </div>
              </div>

              {/* Missing Audio Files Alert */}
              {(stats.audioMissingFile || 0) > 0 && (
                <div className="bg-red-600/20 rounded-xl p-4 border border-red-500/50 animate-pulse">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300">{lang === 'fa' ? 'فایل صوتی گم شده' : 'Missing Audio Files'}</span>
                    <AlertCircle className="text-red-400" size={24} />
                  </div>
                  <div className="text-2xl font-bold text-red-400">
                    {stats.audioMissingFile}
                  </div>
                  <div className="text-xs text-red-300 mt-1">
                    {lang === 'fa'
                      ? 'لینک در دیتابیس هست اما فایل در HiDrive نیست!'
                      : 'Link exists in DB but file missing on HiDrive!'}
                  </div>
                </div>
              )}

              {/* With Lyrics */}
              <div className="bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">{lang === 'fa' ? 'دارای متن' : 'With Lyrics'}</span>
                  <FileText className="text-blue-400" size={24} />
                </div>
                <div className="text-2xl font-bold text-white">
                  {stats.withLyrics}
                  <span className="text-sm ml-2 text-gray-400">({percentages.withLyrics}%)</span>
                </div>
              </div>

              {/* With Timing */}
              <div className="bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">{lang === 'fa' ? 'دارای تایمینگ' : 'With Timing'}</span>
                  <Clock className="text-yellow-400" size={24} />
                </div>
                <div className="text-2xl font-bold text-white">
                  {stats.withTiming}
                  <span className="text-sm ml-2 text-gray-400">({percentages.withTiming}%)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Processing Status */}
        {stats && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 mb-6 border border-purple-500/30 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <RefreshCw className="text-green-400" />
              {lang === 'fa' ? 'وضعیت پردازش' : 'Processing Status'}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-600/20 rounded-xl p-4 border border-green-500/30">
                <div className="text-sm text-gray-300 mb-1">{lang === 'fa' ? 'تکمیل شده' : 'Completed'}</div>
                <div className="text-3xl font-bold text-green-400">{stats.processingStatus.completed}</div>
              </div>

              <div className="bg-yellow-600/20 rounded-xl p-4 border border-yellow-500/30">
                <div className="text-sm text-gray-300 mb-1">{lang === 'fa' ? 'در صف' : 'Queued'}</div>
                <div className="text-3xl font-bold text-yellow-400">{stats.processingStatus.queued}</div>
              </div>

              <div className="bg-blue-600/20 rounded-xl p-4 border border-blue-500/30">
                <div className="text-sm text-gray-300 mb-1">{lang === 'fa' ? 'در حال پردازش' : 'Processing'}</div>
                <div className="text-3xl font-bold text-blue-400">{stats.processingStatus.processing}</div>
              </div>

              <div className="bg-red-600/20 rounded-xl p-4 border border-red-500/30">
                <div className="text-sm text-gray-300 mb-1">{lang === 'fa' ? 'ناموفق' : 'Failed'}</div>
                <div className="text-3xl font-bold text-red-400">{stats.processingStatus.failed}</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-purple-500/30 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4">
            {lang === 'fa' ? 'عملیات' : 'Actions'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleProcessAll}
              disabled={processing}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  {lang === 'fa' ? 'در حال پردازش...' : 'Processing...'}
                </>
              ) : (
                <>
                  <Play size={20} />
                  {lang === 'fa' ? 'پردازش همه سرودها' : 'Process All Songs'}
                </>
              )}
            </button>

            <button
              onClick={loadIncompleteSongs}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <AlertCircle size={20} />
              {lang === 'fa' ? 'نمایش سرودهای ناقص' : 'Show Incomplete Songs'}
            </button>

            <button
              onClick={loadHealthStats}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <RefreshCw size={20} />
              {lang === 'fa' ? 'بروزرسانی آمار' : 'Refresh Stats'}
            </button>
          </div>
        </div>

        {/* Incomplete Songs List */}
        {incompleteSongs.length > 0 && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 mt-6 border border-purple-500/30 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="text-yellow-400" />
              {lang === 'fa' ? `سرودهای ناقص (${incompleteSongs.length})` : `Incomplete Songs (${incompleteSongs.length})`}
            </h2>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {incompleteSongs.map((song) => (
                <div key={song.id} className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold">
                      {song.title[lang] || song.title.fa || song.title.en}
                    </div>
                    <div className="text-sm text-gray-400">{song.artist}</div>
                  </div>
                  <div className="flex gap-2">
                    {song.missing.map((item: string) => (
                      <span key={item} className="bg-red-600/30 text-red-400 px-3 py-1 rounded-full text-xs border border-red-500/30">
                        {lang === 'fa'
                          ? item === 'audio' ? 'بدون لینک صدا'
                            : item === 'audioFile' ? 'فایل صوتی گم شده'
                              : item === 'lyrics' ? 'بدون متن'
                                : 'بدون تایمینگ'
                          : item === 'audioFile' ? 'Missing Audio File'
                            : `No ${item}`
                        }
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorshipSongsHealthDashboard;
