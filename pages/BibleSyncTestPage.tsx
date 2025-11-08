import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import BibleAudioSync from '../src/components/BibleAudioSync';
import { BookOpen, Sparkles } from 'lucide-react';

// نمونه داده برای تست
const testBibleData = {
  fa: {
    bookName: 'پیدایش',
    chapter: 1,
    verses: [
      { verse: 1, text: 'در ابتدا خدا آسمان‌ها و زمین را آفرید.' },
      { verse: 2, text: 'و زمین بی‌شکل و خالی بود و تاریکی بر روی ژرفناها بود و روح خدا بر روی آب‌ها در حرکت بود.' },
      { verse: 3, text: 'و خدا گفت: روشنایی بشود و روشنایی شد.' },
      { verse: 4, text: 'و خدا روشنایی را دید که نیکو است و خدا در میان روشنایی و تاریکی جدایی انداخت.' },
      { verse: 5, text: 'و خدا روشنایی را روز نامید و تاریکی را شب نامید و شام بود و صبح بود روز اول.' },
    ],
    audioUrl: 'https://samanabyar.online/audio/bible/fa/Genesis_1.mp3'
  },
  en: {
    bookName: 'Exodus',
    chapter: 1,
    verses: [
      { verse: 1, text: 'Now these are the names of the children of Israel, which came into Egypt; every man and his household came with Jacob.' },
      { verse: 2, text: 'Reuben, Simeon, Levi, and Judah,' },
      { verse: 3, text: 'Issachar, Zebulun, and Benjamin,' },
      { verse: 4, text: 'Dan, and Naphtali, Gad, and Asher.' },
      { verse: 5, text: 'And all the souls that came out of the loins of Jacob were seventy souls: for Joseph was in Egypt already.' },
    ],
    audioUrl: 'https://samanabyar.online/audio/bible/auto-generated/EXO_1_en.mp3'
  }
};

const BibleSyncTestPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const [language, setLanguage] = useState<'fa' | 'en'>('fa');

  const currentData = testBibleData[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-4" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              {lang === 'fa' ? 'تست خواندن همزمان کتاب مقدس' : 'Bible Synchronized Reading Test'}
            </h1>
            <Sparkles className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-xl text-gray-300">
            {lang === 'fa' 
              ? 'Gemini AI - خواندن با Highlight متن' 
              : 'Gemini AI - Text Highlighting While Reading'}
          </p>
        </div>

        {/* Language Selector */}
        <div className="mb-8 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
          <label className="block text-white text-lg font-semibold mb-3">
            {lang === 'fa' ? 'انتخاب زبان:' : 'Select Language:'}
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setLanguage('fa')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                language === 'fa'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              🇮🇷 فارسی (پیدایش ۱)
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                language === 'en'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              🇺🇸 English (Exodus 1)
            </button>
          </div>
        </div>

        {/* Bible Audio Sync Component */}
        <BibleAudioSync
          audioUrl={currentData.audioUrl}
          bookName={currentData.bookName}
          chapter={currentData.chapter}
          verses={currentData.verses}
          language={language}
          onTimingGenerated={(verseSegments) => {
            console.log('✅ Bible timing generated:', verseSegments);
            // می‌تونیم اینجا تایمینگ رو ذخیره کنیم
          }}
        />

        {/* Instructions */}
        <div className="mt-8 bg-green-500/10 border border-green-500/30 rounded-xl p-6">
          <h3 className="text-white text-lg font-bold mb-3">
            {lang === 'fa' ? '📖 راهنما:' : '📖 Instructions:'}
          </h3>
          <ul className="space-y-2 text-gray-300" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            <li>
              {lang === 'fa' 
                ? '1️⃣ دکمه "فعال‌سازی خواندن همزمان" را بزنید'
                : '1️⃣ Click "Enable Synchronized Reading" button'}
            </li>
            <li>
              {lang === 'fa' 
                ? '2️⃣ Gemini AI صوت کتاب مقدس را تحلیل می‌کند'
                : '2️⃣ Gemini AI analyzes Bible audio'}
            </li>
            <li>
              {lang === 'fa' 
                ? '3️⃣ هر آیه و هر کلمه همزمان با خواندن Highlight می‌شود'
                : '3️⃣ Each verse and word highlights while being read'}
            </li>
            <li>
              {lang === 'fa' 
                ? '4️⃣ می‌توانید بین زبان فارسی و انگلیسی جابجا شوید'
                : '4️⃣ You can switch between Persian and English'}
            </li>
            <li>
              {lang === 'fa' 
                ? '⚠️ توجه: تحلیل ممکن است 1-2 دقیقه طول بکشد'
                : '⚠️ Note: Analysis may take 1-2 minutes'}
            </li>
          </ul>
        </div>

        {/* API Info */}
        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
          <h3 className="text-white text-lg font-bold mb-3">
            {lang === 'fa' ? '🔑 اطلاعات API:' : '🔑 API Information:'}
          </h3>
          <ul className="space-y-2 text-gray-300 text-sm" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            <li>
              <strong>Model:</strong> gemini-2.0-flash-exp
            </li>
            <li>
              <strong>{lang === 'fa' ? 'فایل صوتی فارسی:' : 'Persian Audio:'}</strong> {testBibleData.fa.audioUrl}
            </li>
            <li>
              <strong>{lang === 'fa' ? 'فایل صوتی انگلیسی:' : 'English Audio:'}</strong> {testBibleData.en.audioUrl}
            </li>
            <li>
              <strong>{lang === 'fa' ? 'قابلیت:' : 'Feature:'}</strong> Word-level & Verse-level synchronization
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BibleSyncTestPage;
