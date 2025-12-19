import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import BibleAudioPlayerWithSync from '../components/BibleAudioPlayerWithSync';

/**
 * صفحه تست برای سیستم Bible Audio با Simple Timing
 * 
 * این صفحه برای تست کردن کامپوننت BibleAudioPlayerWithSync است
 * که از سیستم Simple Timing استفاده می‌کند
 */
const BibleAudioSyncTestPage: React.FC = () => {
  const { lang } = useLanguage();
  
  // نمونه: افسسیان فصل 1
  const [bookKey] = useState('EPH');
  const [chapter] = useState(1);
  const [verses, setVerses] = useState<Array<{ number: number; text: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timingGenerated, setTimingGenerated] = useState(false);

  // بارگذاری آیات
  useEffect(() => {
    loadVerses();
  }, [bookKey, chapter]);

  const loadVerses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // بارگذاری از API
      const response = await fetch(`/api/bible/content/${bookKey}/${chapter}`);
      const data = await response.json();
      
      if (data.success && data.verses) {
        // تبدیل به فرمت مورد نیاز
        const versesArray = data.verses.fa.map((text: string, index: number) => ({
          number: index + 1,
          text: text
        }));
        
        setVerses(versesArray);
        console.log(`✅ Loaded ${versesArray.length} verses for ${bookKey} ${chapter}`);
      } else {
        throw new Error('Failed to load verses');
      }
      
    } catch (err) {
      console.error('Error loading verses:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // تولید فایل timing
  const generateTiming = async () => {
    try {
      console.log(`📖 Generating timing for ${bookKey} ${chapter}...`);
      
      const response = await fetch(`/api/bible-timing/generate/${bookKey}/${chapter}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          verses: verses,
          audioDuration: null // خودکار محاسبه می‌شود
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Timing generated:', data.data);
        alert(`✅ فایل Timing ساخته شد!\n\nفایل: ${data.data.filename}\nکلمات: ${data.data.metadata.wordCount}\nآیات: ${data.data.metadata.verseCount}`);
        setTimingGenerated(true);
      } else {
        throw new Error(data.error || 'Failed to generate timing');
      }
      
    } catch (err) {
      console.error('Error generating timing:', err);
      alert(`❌ خطا در ساخت Timing:\n${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // بررسی وجود timing
  const checkTiming = async () => {
    try {
      const response = await fetch(`/api/bible-timing/check/${bookKey}/${chapter}`);
      const data = await response.json();
      
      if (data.exists) {
        console.log('✅ Timing exists:', data.data);
        setTimingGenerated(true);
        return true;
      } else {
        console.log('⚠️ Timing not found');
        setTimingGenerated(false);
        return false;
      }
    } catch (err) {
      console.error('Error checking timing:', err);
      return false;
    }
  };

  // بررسی وجود timing در هنگام بارگذاری
  useEffect(() => {
    if (verses.length > 0) {
      checkTiming();
    }
  }, [verses]);

  const handleChapterChange = (direction: 'prev' | 'next') => {
    // فعلاً چیزی نمی‌کنیم - می‌توانید بعداً اضافه کنید
    console.log(`Chapter change: ${direction}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">
          ⏳ {lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center p-6">
        <div className="bg-red-500/20 border border-red-500 rounded-xl p-8 max-w-2xl">
          <h2 className="text-2xl font-bold text-red-300 mb-4">
            ❌ {lang === 'fa' ? 'خطا' : 'Error'}
          </h2>
          <p className="text-red-200">{error}</p>
          <button
            onClick={loadVerses}
            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            {lang === 'fa' ? 'تلاش مجدد' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-8 px-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-blue-600/40 to-purple-600/40 backdrop-blur-xl rounded-2xl p-8 border border-blue-500/30">
          <h1 className="text-4xl font-bold text-white mb-3 text-center">
            🧪 {lang === 'fa' ? 'تست سیستم Bible Audio با Simple Timing' : 'Bible Audio with Simple Timing Test'}
          </h1>
          <p className="text-gray-200 text-center mb-6">
            {lang === 'fa' 
              ? 'این صفحه برای تست کردن سیستم همگام‌سازی کلمه‌به‌کلمه برای کتاب مقدس است'
              : 'Test page for Bible word-by-word synchronization system'
            }
          </p>
          
          {/* Timing Status */}
          <div className="bg-black/30 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-gray-300 mb-1">
                  📖 {lang === 'fa' ? 'کتاب' : 'Book'}: <strong className="text-blue-300">افسسیان (Ephesians)</strong>
                </p>
                <p className="text-gray-300 mb-1">
                  📝 {lang === 'fa' ? 'فصل' : 'Chapter'}: <strong className="text-blue-300">{chapter}</strong>
                </p>
                <p className="text-gray-300">
                  📊 {lang === 'fa' ? 'آیات' : 'Verses'}: <strong className="text-blue-300">{verses.length}</strong>
                </p>
              </div>
              
              <div className="flex flex-col gap-2">
                {timingGenerated ? (
                  <div className="bg-green-500/20 border border-green-500 rounded-lg px-4 py-2 text-green-300 text-sm">
                    ✅ {lang === 'fa' ? 'Timing موجود است' : 'Timing Available'}
                  </div>
                ) : (
                  <button
                    onClick={generateTiming}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all"
                  >
                    🎵 {lang === 'fa' ? 'ساخت Timing' : 'Generate Timing'}
                  </button>
                )}
                
                <button
                  onClick={checkTiming}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg text-sm"
                >
                  🔍 {lang === 'fa' ? 'بررسی Timing' : 'Check Timing'}
                </button>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
            <p className="text-yellow-200 text-sm leading-relaxed">
              {lang === 'fa' ? (
                <>
                  💡 <strong>نکته:</strong> این سیستم از الگوریتم Simple Timing استفاده می‌کند که زمان را به صورت یکنواخت بین کلمات تقسیم می‌کند.
                  برای استفاده، ابتدا روی دکمه "ساخت Timing" کلیک کنید تا فایل تولید شود.
                </>
              ) : (
                <>
                  💡 <strong>Note:</strong> This system uses Simple Timing algorithm that divides time equally between words.
                  Click "Generate Timing" button to create the timing file.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Audio Player */}
      <BibleAudioPlayerWithSync
        audioUrl="/bible/audio/farsi/EPH/1.mp3"
        verses={verses}
        timingPath={`/bible/data/timings/${bookKey}_${chapter}_timing.json`}
        lang={lang as 'fa' | 'en'}
        bookName={lang === 'fa' ? 'افسسیان' : 'Ephesians'}
        chapter={chapter}
        onChapterChange={handleChapterChange}
        autoLoadTiming={true}
      />

      {/* Instructions */}
      <div className="max-w-6xl mx-auto mt-8">
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
          <h3 className="text-2xl font-bold text-white mb-4">
            📋 {lang === 'fa' ? 'راهنمای استفاده' : 'Instructions'}
          </h3>
          
          <ol className="space-y-3 text-gray-200">
            {lang === 'fa' ? (
              <>
                <li>1️⃣ ابتدا روی دکمه "ساخت Timing" کلیک کنید تا فایل تولید شود</li>
                <li>2️⃣ روی دکمه پخش (▶️) کلیک کنید تا صوت شروع شود</li>
                <li>3️⃣ کلمات به صورت خودکار هایلایت می‌شوند</li>
                <li>4️⃣ می‌توانید روی هر آیه کلیک کنید تا به آن بخش بروید</li>
                <li>5️⃣ در صورت نیاز، از تنظیمات "تاخیر متن" برای هماهنگ‌سازی استفاده کنید</li>
              </>
            ) : (
              <>
                <li>1️⃣ First, click "Generate Timing" to create the timing file</li>
                <li>2️⃣ Click the play button (▶️) to start the audio</li>
                <li>3️⃣ Words will be automatically highlighted</li>
                <li>4️⃣ You can click on any verse to jump to that section</li>
                <li>5️⃣ Use "Text Delay" settings to fine-tune synchronization if needed</li>
              </>
            )}
          </ol>

          <div className="mt-6 bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
            <p className="text-blue-200 text-sm">
              {lang === 'fa' ? (
                <>
                  🚀 <strong>بعد از تست موفق:</strong> می‌توانید این سیستم را برای همه 66 کتاب و 1189 فصل کتاب مقدس اجرا کنید!
                  از اسکریپت <code className="bg-black/30 px-2 py-1 rounded">generate-bible-timing.cjs</code> استفاده کنید.
                </>
              ) : (
                <>
                  🚀 <strong>After successful test:</strong> You can run this system for all 66 books and 1189 chapters!
                  Use the <code className="bg-black/30 px-2 py-1 rounded">generate-bible-timing.cjs</code> script.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BibleAudioSyncTestPage;
