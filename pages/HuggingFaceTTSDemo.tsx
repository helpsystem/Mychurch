/**
 * Hugging Face TTS Demo Page
 * Test page for Kamtera's Persian TTS models
 */

import React, { useState, useEffect } from 'react';
import { useHuggingFaceTTS } from '../hooks/useHuggingFaceTTS';

const HuggingFaceTTSDemo: React.FC = () => {
  const [text, setText] = useState('سلام! این یک تست صدای فارسی با کیفیت بالا است.');
  const [voice, setVoice] = useState<'female' | 'male'>('female');
  const [models, setModels] = useState<any[]>([]);
  const [cacheStats, setCacheStats] = useState<any>(null);

  const {
    isLoading,
    isPlaying,
    error,
    currentAudio,
    speak,
    synthesize,
    stop,
    pause,
    resume,
    getModels,
    getCacheStats,
    cleanCache
  } = useHuggingFaceTTS();

  useEffect(() => {
    // Load models on mount
    loadModels();
    loadCacheStats();
  }, []);

  const loadModels = async () => {
    const result = await getModels();
    if (result.success) {
      setModels(result.models || []);
    }
  };

  const loadCacheStats = async () => {
    const stats = await getCacheStats();
    if (stats.success !== false) {
      setCacheStats(stats);
    }
  };

  const handleSpeak = async () => {
    try {
      await speak(text, { voice });
    } catch (err) {
      console.error('Speech error:', err);
    }
  };

  const handleSynthesize = async () => {
    try {
      const result = await synthesize(text, { voice });
      alert(`✅ Audio generated!\nURL: ${result.audioUrl}\nCached: ${result.cached}`);
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  const handleCleanCache = async () => {
    if (confirm('آیا مطمئن هستید که می‌خواهید cache قدیمی را پاک کنید؟')) {
      const result = await cleanCache(7);
      if (result.success) {
        alert(`✅ ${result.deletedCount} فایل حذف شد`);
        loadCacheStats();
      }
    }
  };

  const sampleTexts = [
    'سلام! این یک تست صدای فارسی با کیفیت بالا است.',
    'خداوند شما را برکت دهد و نگاه دارد.',
    'در ابتدا خدا آسمان‌ها و زمین را آفرید.',
    'محبت صبور است، محبت مهربان است.',
    'زندگی فقط یک بار است؛ از آن به خوبی استفاده کن.'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            🎤 Hugging Face Persian TTS
          </h1>
          <p className="text-lg text-gray-600">
            تست صدای فارسی با مدل‌های Kamtera (بهترین کیفیت)
          </p>
          <div className="mt-4 inline-flex gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              ✅ Female Model
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              ✅ Male Model
            </span>
          </div>
        </div>

        {/* Available Models */}
        {models.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4" dir="rtl">
              📚 مدل‌های موجود
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {models.map((model, idx) => (
                <div key={idx} className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                  <div className="font-bold text-gray-800">{model.description}</div>
                  <div className="text-sm text-gray-600 mt-1">{model.name}</div>
                  <div className="text-xs text-gray-500 mt-2">ID: {model.id}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main TTS Interface */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          {/* Voice Selection */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-3" dir="rtl">
              انتخاب صدا:
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setVoice('female')}
                className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all ${
                  voice === 'female'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                👩 صدای زن
              </button>
              <button
                onClick={() => setVoice('male')}
                className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all ${
                  voice === 'male'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                👨 صدای مرد
              </button>
            </div>
          </div>

          {/* Text Input */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-3" dir="rtl">
              متن فارسی:
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              rows={4}
              dir="rtl"
              placeholder="متن فارسی خود را وارد کنید..."
              maxLength={1000}
            />
            <div className="text-sm text-gray-500 mt-2 text-right" dir="rtl">
              {text.length} / 1000 کاراکتر
            </div>
          </div>

          {/* Sample Texts */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-3" dir="rtl">
              متن‌های نمونه:
            </label>
            <div className="grid gap-2">
              {sampleTexts.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setText(sample)}
                  className="text-right px-4 py-2 bg-gray-50 hover:bg-purple-50 rounded-lg text-sm text-gray-700 hover:text-purple-700 transition-all"
                  dir="rtl"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={handleSpeak}
              disabled={isLoading || !text.trim()}
              className="py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? '⏳ در حال تولید...' : '▶️ پخش'}
            </button>

            <button
              onClick={isPlaying ? pause : resume}
              disabled={!currentAudio || isLoading}
              className="py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isPlaying ? '⏸️ توقف' : '▶️ ادامه'}
            </button>

            <button
              onClick={stop}
              disabled={!currentAudio || isLoading}
              className="py-3 px-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ⏹️ قطع
            </button>

            <button
              onClick={handleSynthesize}
              disabled={isLoading || !text.trim()}
              className="py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              💾 ذخیره
            </button>
          </div>

          {/* Status */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-700 font-bold" dir="rtl">❌ خطا:</div>
              <div className="text-red-600 mt-1" dir="rtl">{error}</div>
            </div>
          )}

          {isPlaying && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-green-700 font-bold" dir="rtl">
                ▶️ در حال پخش...
              </div>
            </div>
          )}

          {currentAudio && !isPlaying && !isLoading && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-blue-700 font-bold" dir="rtl">
                ✅ صدا آماده است
              </div>
              <div className="text-sm text-blue-600 mt-1 break-all">
                {currentAudio}
              </div>
            </div>
          )}
        </div>

        {/* Cache Statistics */}
        {cacheStats && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800" dir="rtl">
                📊 آمار Cache
              </h2>
              <button
                onClick={handleCleanCache}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-all"
              >
                🧹 پاک کردن
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{cacheStats.fileCount}</div>
                <div className="text-sm text-gray-600" dir="rtl">فایل‌های ذخیره شده</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{cacheStats.totalSizeMB} MB</div>
                <div className="text-sm text-gray-600" dir="rtl">حجم کل</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg">
                <div className="text-xs text-gray-600 break-all" dir="ltr">
                  {cacheStats.cacheDir}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3" dir="rtl">
            ℹ️ اطلاعات مهم:
          </h3>
          <ul className="space-y-2 text-gray-700" dir="rtl">
            <li>✅ از مدل‌های Kamtera استفاده می‌کند (بهترین کیفیت)</li>
            <li>✅ Cache خودکار برای سرعت بیشتر</li>
            <li>✅ بدون نیاز به نصب Python</li>
            <li>⚠️ اولین بار ممکن است کمی طول بکشد (بارگذاری مدل)</li>
            <li>💡 حداکثر طول متن: ۱۰۰۰ کاراکتر</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HuggingFaceTTSDemo;
