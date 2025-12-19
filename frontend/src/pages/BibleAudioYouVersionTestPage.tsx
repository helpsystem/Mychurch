import React, { useState, useEffect } from 'react';
import { BibleAudioTextSync } from '../components/BibleAudioTextSync';
import { TranscriptData } from '../hooks/useAudioTextSync';

/**
 * Test page for YouVersion Professional Audio with Word-Level Synchronization
 * Features:
 * - Professional recordings from Elam Ministries
 * - Precise word-level timing and highlighting
 * - Real-time audio-text synchronization
 */
const BibleAudioYouVersionTestPage: React.FC = () => {
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [alignmentFa, setAlignmentFa] = useState<TranscriptData | null>(null);
  const [alignmentEn, setAlignmentEn] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookName] = useState<string>('Matthew');
  const [chapter] = useState<number>(1);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const loadYouVersionData = async () => {
      try {
        setLoading(true);
        setError(null);
        setDebugInfo('Starting to load data...');

        // Load Persian alignment (without leading slash for Vite)
        const alignmentPath = 'data/alignments/youversion/MAT_1_fa_alignment.json';
        setDebugInfo(`Fetching: ${alignmentPath}`);
        
        const responseFa = await fetch(alignmentPath);
        setDebugInfo(`Response status: ${responseFa.status}`);
        
        if (!responseFa.ok) {
          throw new Error(`Failed to load Persian alignment: ${responseFa.status} ${responseFa.statusText}`);
        }
        
        const dataFa = await responseFa.json();
        setDebugInfo(`Loaded ${dataFa.verses?.length || 0} verses`);
        setAlignmentFa(dataFa);

        // Extract audio URL from metadata
        if (dataFa.metadata && dataFa.metadata.audio_url) {
          setAudioUrl(dataFa.metadata.audio_url);
          setDebugInfo(`Audio URL: ${dataFa.metadata.audio_url.substring(0, 50)}...`);
        }

        // Try to load English alignment (optional)
        try {
          const responseEn = await fetch('data/alignments/youversion/MAT_1_en_alignment.json');
          if (responseEn.ok) {
            const dataEn = await responseEn.json();
            setAlignmentEn(dataEn);
          }
        } catch (err) {
          // English alignment optional - use Persian for both
          setAlignmentEn(dataFa);
        }

        setDebugInfo('Data loaded successfully!');
        setLoading(false);
      } catch (err) {
        console.error('Error loading YouVersion data:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to load audio data';
        setError(errorMsg);
        setDebugInfo(`Error: ${errorMsg}`);
        setLoading(false);
      }
    };

    loadYouVersionData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-400 mx-auto mb-8"></div>
          <h2 className="text-3xl font-bold text-white mb-4">
            ⏳ در حال بارگذاری...
          </h2>
          <p className="text-xl text-blue-200 mb-4">
            فایل صوتی حرفه‌ای از Elam Ministries
          </p>
          {debugInfo && (
            <p className="text-sm text-gray-400 mt-4 font-mono">{debugInfo}</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-purple-900 flex items-center justify-center p-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-2xl">
          <h2 className="text-3xl font-bold text-red-300 mb-4">❌ خطا</h2>
          <p className="text-xl text-white mb-6">{error}</p>
          {debugInfo && (
            <div className="text-gray-300 mb-4">
              <p className="mb-2 font-bold">Debug Info:</p>
              <p className="text-sm font-mono bg-black/30 p-3 rounded">{debugInfo}</p>
            </div>
          )}
          <div className="text-gray-300">
            <p className="mb-2">لطفاً مطمئن شوید:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Vite در حال اجرا است (npm run dev)</li>
              <li>فایل‌ها در مسیر صحیح هستند</li>
              <li>Console را برای خطای دقیق‌تر چک کنید (F12)</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!alignmentFa) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-2xl">
          داده‌ای یافت نشد
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-12">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            🎧 صوت حرفه‌ای کتاب مقدس
          </h1>
          <p className="text-xl md:text-2xl text-blue-200 mb-2">
            Elam Ministries • ترجمه هزاره نو
          </p>
          <p className="text-lg text-purple-200">
            متی ۱ • همگام‌سازی دقیق کلمات
          </p>
          {debugInfo && (
            <p className="text-xs text-gray-400 mt-2 font-mono">Debug: {debugInfo}</p>
          )}
        </div>

        {/* Audio Player Component */}
        <div className="mb-12">
          <BibleAudioTextSync
            audioUrl={audioUrl}
            transcriptFa={alignmentFa}
            transcriptEn={alignmentEn || alignmentFa}
            bookName={bookName}
            chapter={chapter}
          />
        </div>

        {/* Information Cards */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            📊 اطلاعات صوت
          </h2>
          <div className="space-y-2 text-white">
            <p>🎙️ <span className="font-semibold">منبع:</span> <span className="text-blue-200">YouVersion API (Elam Ministries)</span></p>
            <p>📖 <span className="font-semibold">ترجمه:</span> <span className="text-blue-200">هزاره نو (نسخه ۱۱۸)</span></p>
            <p>🔊 <span className="font-semibold">کیفیت:</span> <span className="text-green-300">استودیویی حرفه‌ای</span></p>
            <p>📝 <span className="font-semibold">آیات:</span> <span className="text-yellow-200">{alignmentFa.verses?.length || 0}</span></p>
            <p>🔤 <span className="font-semibold">کلمات:</span> <span className="text-yellow-200">{alignmentFa.metadata?.word_count || 0}</span></p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">
            💡 راهنما
          </h3>
          <ul className="space-y-2 text-white">
            <li>▶️ دکمه پخش را بزنید تا صوت حرفه‌ای شروع شود</li>
            <li>👀 کلمات به طور دقیق با صوت هایلایت می‌شوند</li>
            <li>🖱️ روی هر کلمه کلیک کنید تا مستقیماً به آن قسمت بروید</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BibleAudioYouVersionTestPage;
