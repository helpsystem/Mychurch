import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useContent } from '../hooks/useContent';
import WorshipAudioSync from '../components/WorshipAudioSync';
import { Music, Sparkles } from 'lucide-react';

const WorshipSyncTestPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const { content, loading } = useContent();
  const songs = content.worshipSongs || [];

  const [selectedSongIndex, setSelectedSongIndex] = useState(0);

  // فیلتر کردن سرودهایی که فایل صوتی دارند
  const songsWithAudio = songs.filter(song => song.audioUrl);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-xl text-white">
            {lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (songsWithAudio.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Music className="w-24 h-24 mx-auto mb-4 text-gray-500" />
          <h2 className="text-2xl font-bold mb-2">
            {lang === 'fa' ? 'سرود پرستشی یافت نشد' : 'No Worship Songs Found'}
          </h2>
        </div>
      </div>
    );
  }

  const currentSong = songsWithAudio[selectedSongIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              {lang === 'fa' ? 'تست همخوانی صوت و متن' : 'Audio-Text Sync Test'}
            </h1>
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-xl text-gray-300">
            {lang === 'fa'
              ? 'Gemini AI - سیستم کارائوکه هوشمند'
              : 'Gemini AI - Smart Karaoke System'}
          </p>
        </div>

        {/* Song Selector */}
        <div className="mb-8 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
          <label className="block text-white text-lg font-semibold mb-3">
            {lang === 'fa' ? 'انتخاب سرود:' : 'Select Song:'}
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedSongIndex(Math.max(0, selectedSongIndex - 1))}
              disabled={selectedSongIndex === 0}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-lg transition-colors"
            >
              {lang === 'fa' ? '◀ قبلی' : '◀ Previous'}
            </button>

            <select
              value={selectedSongIndex}
              onChange={(e) => setSelectedSongIndex(Number(e.target.value))}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
              dir={lang === 'fa' ? 'rtl' : 'ltr'}
            >
              {songsWithAudio.map((song, index) => (
                <option key={song.id} value={index}>
                  {song.title?.[lang]} - {song.artist}
                </option>
              ))}
            </select>

            <button
              onClick={() => setSelectedSongIndex(Math.min(songsWithAudio.length - 1, selectedSongIndex + 1))}
              disabled={selectedSongIndex === songsWithAudio.length - 1}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-lg transition-colors"
            >
              {lang === 'fa' ? 'بعدی ▶' : 'Next ▶'}
            </button>
          </div>

          <div className="mt-4 text-center text-gray-400 text-sm">
            {lang === 'fa'
              ? `سرود ${selectedSongIndex + 1} از ${songsWithAudio.length}`
              : `Song ${selectedSongIndex + 1} of ${songsWithAudio.length}`}
          </div>
        </div>

        {/* Audio Sync Component */}
        <WorshipAudioSync
          audioUrl={currentSong.audioUrl}
          lyrics={currentSong.lyrics}
          title={currentSong.title}
          onTimingGenerated={(wordSegments) => {
            console.log('✅ Timing generated:', wordSegments);
            // می‌تونیم اینجا تایمینگ رو ذخیره کنیم
          }}
        />

        {/* Instructions */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-white text-lg font-bold mb-3">
            {lang === 'fa' ? '📖 راهنما:' : '📖 Instructions:'}
          </h3>
          <ul className="space-y-2 text-gray-300" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            <li>
              {lang === 'fa'
                ? '1️⃣ دکمه "فعال‌سازی حالت متن زنده" را بزنید'
                : '1️⃣ Click "Enable Live Text Mode" button'}
            </li>
            <li>
              {lang === 'fa'
                ? '2️⃣ Gemini AI صوت را تحلیل کرده و timing تولید می‌کند'
                : '2️⃣ Gemini AI analyzes audio and generates timing'}
            </li>
            <li>
              {lang === 'fa'
                ? '3️⃣ هر کلمه همزمان با صوت Highlight می‌شود'
                : '3️⃣ Each word highlights in sync with audio'}
            </li>
            <li>
              {lang === 'fa'
                ? '⚠️ توجه: هر بار تحلیل ممکن است 30-60 ثانیه طول بکشد'
                : '⚠️ Note: Each analysis may take 30-60 seconds'}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WorshipSyncTestPage;
