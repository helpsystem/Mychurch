import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Conversation as AudioSyncConversation } from '@/components/AudioSync/AudioSyncConversation';

const BibleAudioSyncPage: React.FC = () => {
  const { lang, t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
          <h1 className="text-4xl font-bold text-white mb-4">
            {lang === 'fa' ? '🎵 همگام‌سازی صدا و متن' : '🎵 Audio-Text Synchronization'}
          </h1>
          <p className="text-blue-200 text-lg max-w-3xl mx-auto">
            {lang === 'fa' 
              ? 'یک فایل صوتی آپلود کنید تا با استفاده از هوش مصنوعی Gemini، متن آن را با زمان‌بندی دقیق کلمه به کلمه استخراج کنیم.'
              : 'Upload an audio file and let Gemini AI extract the transcript with precise word-level timing synchronization.'}
          </p>
        </div>

        {/* Instructions Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-8 max-w-3xl mx-auto" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
          <h2 className="text-xl font-semibold text-blue-300 mb-4">
            {lang === 'fa' ? '📋 راهنمای استفاده:' : '📋 How to Use:'}
          </h2>
          <ul className="space-y-2 text-blue-100">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">1.</span>
              <span>
                {lang === 'fa' 
                  ? 'روی دکمه "Upload Audio" کلیک کنید و فایل MP3، WAV یا M4A خود را انتخاب کنید'
                  : 'Click "Upload Audio" and select your MP3, WAV, or M4A file'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">2.</span>
              <span>
                {lang === 'fa' 
                  ? 'صبر کنید تا Gemini AI متن را با زمان‌بندی دقیق استخراج کند (ممکن است 30-60 ثانیه طول بکشد)'
                  : 'Wait for Gemini AI to extract the transcript with precise timing (may take 30-60 seconds)'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">3.</span>
              <span>
                {lang === 'fa' 
                  ? 'روی دکمه Play کلیک کنید و تماشا کنید که چطور کلمات به صورت زنده هایلایت می‌شوند!'
                  : 'Click Play and watch the words highlight in real-time!'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">4.</span>
              <span>
                {lang === 'fa' 
                  ? 'می‌توانید JSON خروجی را دانلود کنید و برای استفاده در سایت ذخیره کنید'
                  : 'You can download the JSON output and save it for use in the website'}
              </span>
            </li>
          </ul>
        </div>

        {/* Use Cases Card */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 backdrop-blur-md rounded-lg p-6 mb-8 max-w-3xl mx-auto" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
          <h2 className="text-xl font-semibold text-purple-300 mb-4">
            {lang === 'fa' ? '🎯 کاربردها در سایت:' : '🎯 Use Cases:'}
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-3xl mb-2">📖</div>
              <h3 className="text-purple-200 font-semibold mb-1">
                {lang === 'fa' ? 'صوت کتاب مقدس' : 'Bible Audio'}
              </h3>
              <p className="text-sm text-purple-100/70">
                {lang === 'fa' 
                  ? '9,690 فایل MP3 با هایلایت کلمه به کلمه'
                  : '9,690 MP3 files with word-by-word highlighting'}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-3xl mb-2">🎵</div>
              <h3 className="text-purple-200 font-semibold mb-1">
                {lang === 'fa' ? 'سرودهای عبادت' : 'Worship Songs'}
              </h3>
              <p className="text-sm text-purple-100/70">
                {lang === 'fa' 
                  ? '364 سرود با متن و موسیقی همگام'
                  : '364 songs with synced lyrics'}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-3xl mb-2">🎤</div>
              <h3 className="text-purple-200 font-semibold mb-1">
                {lang === 'fa' ? 'موعظه‌ها' : 'Sermons'}
              </h3>
              <p className="text-sm text-purple-100/70">
                {lang === 'fa' 
                  ? 'زیرنویس خودکار با زمان‌بندی دقیق'
                  : 'Auto-subtitles with precise timing'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Component */}
        <div className="max-w-4xl mx-auto">
          <AudioSyncConversation />
        </div>

        {/* Technical Info */}
        <div className="mt-8 text-center text-blue-300/60 text-sm">
          <p>Powered by Google Gemini AI 2.5 Flash • {lang === 'fa' ? 'دقت بالا و سرعت استثنایی' : 'High accuracy and exceptional speed'}</p>
        </div>
      </div>
    </div>
  );
};

export default BibleAudioSyncPage;
