import React, { useState } from 'react';
import { Play, Pause, Volume2, Download, CheckCircle, XCircle, Loader } from 'lucide-react';
import { speakPersian, isPersianTTSAvailable, getPersianVoicesInfo } from '../lib/persianTTS';

const TTSDemo: React.FC = () => {
  const [text, setText] = useState('سلام! این یک تست صدای فارسی است. خداوند شما را برکت دهد.');
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<any[]>([]);
  const [ttsAvailable, setTtsAvailable] = useState<boolean | null>(null);

  React.useEffect(() => {
    // بررسی وجود صدای فارسی
    setTimeout(() => {
      const available = isPersianTTSAvailable();
      setTtsAvailable(available);
      
      if (available) {
        const voicesList = getPersianVoicesInfo();
        setVoices(voicesList);
      }
    }, 500);
  }, []);

  const handleSpeak = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speakPersian(text, {
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false)
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-6 border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-2">🎤 تست صدای فارسی</h1>
          <p className="text-purple-200">سیستم Text-to-Speech با کیفیت بالا برای زبان فارسی</p>
        </div>

        {/* Status Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Volume2 className="w-6 h-6" />
            وضعیت سرویس
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Web Speech API */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                {ttsAvailable ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : ttsAvailable === false ? (
                  <XCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <Loader className="w-5 h-5 text-yellow-400 animate-spin" />
                )}
                <span className="font-bold text-white">Web Speech API</span>
              </div>
              <p className="text-sm text-purple-200">
                {ttsAvailable ? '✅ فعال' : ttsAvailable === false ? '❌ غیرفعال' : '⏳ در حال بررسی...'}
              </p>
            </div>

            {/* Audio Files */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-bold text-white">فایل‌های صوتی</span>
              </div>
              <p className="text-sm text-purple-200">✅ 6 فصل افسسیان</p>
            </div>

            {/* TTS Server */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-yellow-400" />
                <span className="font-bold text-white">Coqui TTS Server</span>
              </div>
              <p className="text-sm text-purple-200">⚠️ نیاز به نصب دارد</p>
            </div>
          </div>

          {/* Voices Info */}
          {voices.length > 0 && (
            <div className="mt-4 p-4 bg-green-500/20 rounded-xl border border-green-500/30">
              <h3 className="font-bold text-white mb-2">صداهای فارسی موجود:</h3>
              <ul className="text-sm text-white space-y-1">
                {voices.map((voice, idx) => (
                  <li key={idx}>
                    • {voice.name} ({voice.lang}) {voice.local && '- محلی'}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ttsAvailable === false && (
            <div className="mt-4 p-4 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
              <h3 className="font-bold text-white mb-2">⚠️ صدای فارسی یافت نشد</h3>
              <p className="text-sm text-purple-200 mb-2">
                برای کیفیت بهتر، صدای فارسی را در سیستم خود نصب کنید:
              </p>
              <ul className="text-sm text-white space-y-1">
                <li>• <strong>Windows:</strong> Settings → Language → Persian → Options → Download TTS</li>
                <li>• <strong>macOS:</strong> System Preferences → Accessibility → Speech → System Voice</li>
                <li>• <strong>Android:</strong> Settings → Language & Input → Text-to-speech → Persian</li>
              </ul>
            </div>
          )}
        </div>

        {/* TTS Test */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">🎙️ تست صدا</h2>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-32 p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
            placeholder="متن خود را اینجا بنویسید..."
            dir="rtl"
          />

          <button
            onClick={handleSpeak}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg"
          >
            {isPlaying ? (
              <>
                <Pause className="w-6 h-6" />
                توقف پخش
              </>
            ) : (
              <>
                <Play className="w-6 h-6" />
                پخش صدا
              </>
            )}
          </button>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/#/bible-audio-player"
            className="bg-blue-600/80 hover:bg-blue-700/80 rounded-xl p-6 text-center transition-all block"
          >
            <h3 className="text-xl font-bold text-white mb-2">🎵 Audio Player</h3>
            <p className="text-blue-100 text-sm">فایل‌های صوتی کتاب مقدس</p>
          </a>

          <a
            href="/#/bible-presentation-sample"
            className="bg-green-600/80 hover:bg-green-700/80 rounded-xl p-6 text-center transition-all block"
          >
            <h3 className="text-xl font-bold text-white mb-2">📖 Bible Presentation</h3>
            <p className="text-green-100 text-sm">نمایش دو زبانه با TTS</p>
          </a>

          <a
            href="/test-audio.html"
            target="_blank"
            className="bg-purple-600/80 hover:bg-purple-700/80 rounded-xl p-6 text-center transition-all block"
          >
            <h3 className="text-xl font-bold text-white mb-2">🧪 Audio Test</h3>
            <p className="text-purple-100 text-sm">تست فایل‌های صوتی</p>
          </a>
        </div>

        {/* Documentation Link */}
        <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-3">📚 مستندات</h3>
          <div className="space-y-2 text-purple-200">
            <p>• <strong>TTS_SERVER_SETUP.md</strong> - راهنمای نصب Coqui TTS Server</p>
            <p>• <strong>PERSIAN_TTS_INTEGRATION.md</strong> - راهنمای استفاده از TTS فارسی</p>
            <p>• <strong>WORSHIP_TIMING_SYSTEM.md</strong> - سیستم timing برای آهنگ‌های پرستش</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TTSDemo;
