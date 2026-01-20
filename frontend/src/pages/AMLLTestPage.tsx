import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import AMLLWorshipPlayer from '../components/AMLLWorshipPlayer';
import { ArrowLeft } from 'lucide-react';

/**
 * صفحه تست AMLL با آهنگ "کلمه جسم گردید"
 * این آهنگ دارای timing کامل و دقیق است
 * 
 * دسترسی: /#/amll-test
 */
const AMLLTestPage: React.FC = () => {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isRTL = lang === 'fa';

  // اطلاعات آهنگ تست - "کلمه جسم گردید" (ID: 10)
  const testSong = {
    id: 10,
    title: 'کلمه جسم گردید',
    artist: 'سینا مسیحا',
    audioUrl: '/worship/audio/kalameh/کلمه جسم گردید.mp3',
    youtubeId: 'eV-1Or6qfOw',
    albumArt: undefined, // AMLL will use gradient background
    lyrics: `V1
کلمه جسم گردید
در آن آخوری پست
نور جهان مولود گشت
آن ستاره ظاهر گشت
Chorus (x2)
عمانوئیل مولود گشت
خدا با ما ، در ما گشت
او آمد ، او آمد
او بهر ما فدیه گشت
V2
پدر سرمدی آمد
او از یک باکره آمد
اسم او عجیب و مهیب
خدای عظیم و قدیر
Chorus (x2)`,
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-indigo-900 via-black to-purple-900"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>{lang === 'fa' ? 'بازگشت' : 'Back'}</span>
          </button>
          
          <h1 className="text-xl font-bold text-white flex-1 text-center">
            {lang === 'fa' ? '🎤 تست AMLL - کلمه جسم گردید' : '🎤 AMLL Test - Kalame Jesm Gardid'}
          </h1>

          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Info Box */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-3">
            {lang === 'fa' ? '📋 اطلاعات تست' : '📋 Test Information'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="text-white/70">
                <span className="text-white font-medium">
                  {lang === 'fa' ? 'آهنگ: ' : 'Song: '}
                </span>
                {testSong.title}
              </p>
              <p className="text-white/70">
                <span className="text-white font-medium">
                  {lang === 'fa' ? 'خواننده: ' : 'Artist: '}
                </span>
                {testSong.artist}
              </p>
              <p className="text-white/70">
                <span className="text-white font-medium">ID: </span>
                {testSong.id}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-green-400">
                ✅ {lang === 'fa' ? 'Timing کامل با Finglish' : 'Full timing with Finglish'}
              </p>
              <p className="text-green-400">
                ✅ {lang === 'fa' ? 'فایل صوتی موجود' : 'Audio file available'}
              </p>
              <p className="text-green-400">
                ✅ {lang === 'fa' ? 'زمان‌بندی کلمه به کلمه' : 'Word-by-word sync'}
              </p>
            </div>
          </div>
        </div>

        {/* AMLL Player */}
        <div className="rounded-2xl overflow-hidden shadow-2xl">
          <AMLLWorshipPlayer
            audioUrl={testSong.audioUrl}
            songId={testSong.id}
            title={testSong.title}
            artist={testSong.artist}
            albumArt={testSong.albumArt}
            youtubeId={testSong.youtubeId}
            lang="fa"
            lyrics={testSong.lyrics}
            showControls={true}
            autoPlay={false}
          />
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">
            {lang === 'fa' ? '🎯 نحوه تست' : '🎯 How to Test'}
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-white/80">
            <li>
              {lang === 'fa' 
                ? 'دکمه پخش را بزنید تا آهنگ شروع شود'
                : 'Press play to start the song'}
            </li>
            <li>
              {lang === 'fa' 
                ? 'هر کلمه باید همزمان با صدا هایلایت شود'
                : 'Each word should highlight in sync with audio'}
            </li>
            <li>
              {lang === 'fa' 
                ? 'دکمه تنظیمات (⚙️) را بزنید و "نمایش فینگلیش" را فعال/غیرفعال کنید'
                : 'Click settings (⚙️) to toggle Finglish display'}
            </li>
            <li>
              {lang === 'fa' 
                ? 'حالت تمام صفحه را تست کنید'
                : 'Test fullscreen mode'}
            </li>
            <li>
              {lang === 'fa' 
                ? 'نوار پیشرفت را بکشید تا seek تست شود'
                : 'Drag progress bar to test seeking'}
            </li>
          </ol>
        </div>

        {/* Expected Behavior */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-500/10 backdrop-blur-lg rounded-xl p-4 border border-green-500/20">
            <h4 className="text-green-400 font-semibold mb-2">
              ✅ {lang === 'fa' ? 'رفتار مورد انتظار' : 'Expected Behavior'}
            </h4>
            <ul className="text-sm text-white/70 space-y-1">
              <li>• {lang === 'fa' ? 'متن فارسی از راست به چپ (RTL)' : 'Persian text RTL'}</li>
              <li>• {lang === 'fa' ? 'هایلایت روان کلمه به کلمه' : 'Smooth word-by-word highlight'}</li>
              <li>• {lang === 'fa' ? 'اسکرول نرم بین خطوط' : 'Smooth scroll between lines'}</li>
              <li>• {lang === 'fa' ? 'انیمیشن فنری (Spring)' : 'Spring animation'}</li>
              <li>• {lang === 'fa' ? 'پس‌زمینه گرادیان متحرک' : 'Animated gradient background'}</li>
            </ul>
          </div>
          <div className="bg-red-500/10 backdrop-blur-lg rounded-xl p-4 border border-red-500/20">
            <h4 className="text-red-400 font-semibold mb-2">
              ❌ {lang === 'fa' ? 'مشکلات احتمالی' : 'Potential Issues'}
            </h4>
            <ul className="text-sm text-white/70 space-y-1">
              <li>• {lang === 'fa' ? 'تاخیر زیاد بین صدا و متن' : 'Significant audio-text delay'}</li>
              <li>• {lang === 'fa' ? 'کلمات اشتباه هایلایت شوند' : 'Wrong words highlighted'}</li>
              <li>• {lang === 'fa' ? 'متن LTR نمایش داده شود' : 'Text displays LTR'}</li>
              <li>• {lang === 'fa' ? 'فونت فارسی درست لود نشود' : 'Persian font not loading'}</li>
              <li>• {lang === 'fa' ? 'خطا در کنسول مرورگر' : 'Console errors'}</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-white/40 text-sm">
        <p>
          {lang === 'fa' 
            ? 'این صفحه برای تست عملکرد AMLL است'
            : 'This page is for testing AMLL functionality'}
        </p>
      </footer>
    </div>
  );
};

export default AMLLTestPage;
