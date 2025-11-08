import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import BibleAudioSync from '../src/components/BibleAudioSync';
import { BookOpen, Sparkles } from 'lucide-react';

// نمونه داده برای تست - داده‌های واقعی از کتاب مقدس
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
      { verse: 6, text: 'و خدا گفت: فلکی در میان آب‌ها بشود و میان آب و آب جدایی اندازد.' },
      { verse: 7, text: 'پس خدا فلک را ساخت و میان آبی که زیر فلک بود و آبی که بالای فلک بود جدایی انداخت و چنین شد.' },
      { verse: 8, text: 'و خدا فلک را آسمان نامید و شام بود و صبح بود روز دوم.' },
      { verse: 9, text: 'و خدا گفت: آب‌هایی که زیر آسمان است در یک‌جا جمع شود تا خشکی ظاهر گردد و چنین شد.' },
      { verse: 10, text: 'و خدا خشکی را زمین نامید و اجتماع آب‌ها را دریاها خواند و خدا دید که نیکو است.' },
    ],
    // فایل صوتی فارسی پیدایش فصل 1 - WordProject Real Narration
    audioUrl: 'http://audio1.wordfree.net/bibles/app/audio/20/1/1.mp3'
  },
  en: {
    bookName: 'Genesis',
    chapter: 1,
    verses: [
      { verse: 1, text: 'In the beginning God created the heaven and the earth.' },
      { verse: 2, text: 'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.' },
      { verse: 3, text: 'And God said, Let there be light: and there was light.' },
      { verse: 4, text: 'And God saw the light, that it was good: and God divided the light from the darkness.' },
      { verse: 5, text: 'And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.' },
      { verse: 6, text: 'And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.' },
      { verse: 7, text: 'And God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament: and it was so.' },
      { verse: 8, text: 'And God called the firmament Heaven. And the evening and the morning were the second day.' },
      { verse: 9, text: 'And God said, Let the waters under the heaven be gathered together unto one place, and let the dry land appear: and it was so.' },
      { verse: 10, text: 'And God called the dry land Earth; and the gathering together of the waters called he Seas: and God saw that it was good.' },
    ],
    // فایل صوتی انگلیسی پیدایش فصل 1 - WordProject Real Narration
    audioUrl: 'http://kjv.wordfree.net/bibles/app/audio/1/1/1.mp3'
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
              🇺🇸 English (Genesis 1)
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
