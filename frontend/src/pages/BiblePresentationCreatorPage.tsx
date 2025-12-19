import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import PptxGenJS from 'pptxgenjs';
import axios from 'axios';

interface BibleVerse {
  verse: number;
  text_fa: string;
  text_en: string;
  audio_url?: string;
}

const BiblePresentationCreatorPage: React.FC = () => {
  const { lang } = useLanguage();
  
  const [selectedBook, setSelectedBook] = useState('GEN');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verseStart, setVerseStart] = useState(1);
  const [verseEnd, setVerseEnd] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const books = [
    { code: 'GEN', name_fa: 'پیدایش', name_en: 'Genesis' },
    { code: 'EXO', name_fa: 'خروج', name_en: 'Exodus' },
    { code: 'MAT', name_fa: 'متی', name_en: 'Matthew' },
    { code: 'JHN', name_fa: 'یوحنا', name_en: 'John' },
    { code: 'ROM', name_fa: 'رومیان', name_en: 'Romans' },
    { code: 'REV', name_fa: 'مکاشفه', name_en: 'Revelation' }
  ];

  const handleGeneratePresentation = useCallback(async () => {
    if (verseStart > verseEnd) {
      setError(lang === 'fa' ? 'آیه شروع نمی‌تواند بزرگتر از آیه پایان باشد' : 'Start verse cannot be greater than end verse');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress(lang === 'fa' ? 'در حال دریافت آیات...' : 'Fetching verses...');

    try {
      // 1. Fetch Bible verses
      const response = await axios.get(`/api/bible/content/${selectedBook}/${selectedChapter}`);
      const allVerses = response.data.verses;
      
      const selectedVerses: BibleVerse[] = [];
      for (let i = verseStart; i <= verseEnd; i++) {
        if (allVerses.fa[i - 1] && allVerses.en[i - 1]) {
          selectedVerses.push({
            verse: i,
            text_fa: allVerses.fa[i - 1],
            text_en: allVerses.en[i - 1]
          });
        }
      }

      if (selectedVerses.length === 0) {
        throw new Error(lang === 'fa' ? 'هیچ آیه‌ای یافت نشد' : 'No verses found');
      }

      setProgress(lang === 'fa' ? `${selectedVerses.length} آیه دریافت شد. در حال ساخت ارائه...` : `${selectedVerses.length} verses fetched. Creating presentation...`);

      // 2. Create PowerPoint
      const pres = new PptxGenJS();
      pres.layout = 'LAYOUT_WIDE';
      pres.author = 'Iranian Christian Church DC';
      pres.title = `${response.data.book.name.en} ${selectedChapter}:${verseStart}-${verseEnd}`;

      // 3. Title Slide
      const titleSlide = pres.addSlide();
      titleSlide.background = { color: '1a1a2e' };
      
      titleSlide.addText(
        lang === 'fa' ? 'کتاب مقدس' : 'Holy Bible',
        {
          x: 0.5, y: 1.5, w: '90%', h: 1,
          align: 'center', fontSize: 48, color: 'FFFFFF', bold: true,
          fontFace: 'Arial'
        }
      );

      titleSlide.addText(
        `${response.data.book.name.fa} ${selectedChapter}:${verseStart}-${verseEnd}\n${response.data.book.name.en} ${selectedChapter}:${verseStart}-${verseEnd}`,
        {
          x: 0.5, y: 3, w: '90%', h: 1.5,
          align: 'center', fontSize: 32, color: 'FFD700',
          fontFace: 'Arial'
        }
      );

      titleSlide.addText(
        'Iranian Christian Church of DC',
        {
          x: 0.5, y: 5, w: '90%', h: 0.5,
          align: 'center', fontSize: 18, color: 'CCCCCC',
          fontFace: 'Arial'
        }
      );

      // 4. Verse Slides
      for (let i = 0; i < selectedVerses.length; i++) {
        const verse = selectedVerses[i];
        setProgress(lang === 'fa' 
          ? `در حال ساخت اسلاید ${i + 1} از ${selectedVerses.length}...` 
          : `Creating slide ${i + 1} of ${selectedVerses.length}...`
        );

        const slide = pres.addSlide();
        
        // Background gradient
        slide.background = { color: '16213e' };

        // Verse reference (top)
        slide.addText(
          `${response.data.book.name.fa} ${selectedChapter}:${verse.verse}`,
          {
            x: 0.5, y: 0.5, w: '40%', h: 0.6,
            align: 'right', fontSize: 24, color: 'FFD700', bold: true,
            fontFace: 'Arial'
          }
        );

        slide.addText(
          `${response.data.book.name.en} ${selectedChapter}:${verse.verse}`,
          {
            x: 5.5, y: 0.5, w: '40%', h: 0.6,
            align: 'left', fontSize: 24, color: 'FFD700', bold: true,
            fontFace: 'Arial'
          }
        );

        // Persian text (right side)
        slide.addText(
          verse.text_fa,
          {
            x: 0.5, y: 2, w: '45%', h: 3,
            align: 'right', fontSize: 22, color: 'FFFFFF',
            fontFace: 'Arial', valign: 'middle',
            lineSpacing: 40
          }
        );

        // English text (left side)
        slide.addText(
          verse.text_en,
          {
            x: 5, y: 2, w: '45%', h: 3,
            align: 'left', fontSize: 22, color: 'E8E8E8',
            fontFace: 'Arial', valign: 'middle',
            lineSpacing: 40
          }
        );

        // Footer
        slide.addText(
          'Iranian Christian Church of DC',
          {
            x: 0.5, y: 5.3, w: '90%', h: 0.4,
            align: 'center', fontSize: 14, color: '888888',
            fontFace: 'Arial'
          }
        );
      }

      // 5. Save PowerPoint
      setProgress(lang === 'fa' ? 'در حال ذخیره فایل...' : 'Saving file...');
      
      const fileName = `${selectedBook}_${selectedChapter}_${verseStart}-${verseEnd}_${Date.now()}.pptx`;
      await pres.writeFile({ fileName });

      setProgress(lang === 'fa' ? '✅ ارائه با موفقیت ساخته شد!' : '✅ Presentation created successfully!');
      setIsGenerating(false);

    } catch (err) {
      console.error('Error generating presentation:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsGenerating(false);
    }
  }, [selectedBook, selectedChapter, verseStart, verseEnd, lang]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
          <h1 className="text-4xl font-bold text-white mb-4">
            {lang === 'fa' ? '📊 ساخت ارائه کتاب مقدس' : '📊 Bible Presentation Creator'}
          </h1>
          <p className="text-blue-200 text-lg max-w-3xl mx-auto">
            {lang === 'fa'
              ? 'ارائه PowerPoint حرفه‌ای با متن دوزبانه و صدای Edge TTS برای موعظه‌ها'
              : 'Professional PowerPoint presentations with bilingual text and Edge TTS audio for sermons'}
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Panel - Controls */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            <h2 className="text-2xl font-bold text-white mb-6">
              {lang === 'fa' ? '⚙️ تنظیمات' : '⚙️ Settings'}
            </h2>

            {/* Book Selection */}
            <div className="mb-6">
              <label className="block text-blue-300 mb-2 font-semibold">
                {lang === 'fa' ? 'کتاب:' : 'Book:'}
              </label>
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                {books.map((book) => (
                  <option key={book.code} value={book.code}>
                    {lang === 'fa' ? book.name_fa : book.name_en} ({book.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter Selection */}
            <div className="mb-6">
              <label className="block text-blue-300 mb-2 font-semibold">
                {lang === 'fa' ? 'فصل:' : 'Chapter:'}
              </label>
              <input
                type="number"
                min="1"
                max="150"
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(parseInt(e.target.value) || 1)}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Verse Range */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-blue-300 mb-2 font-semibold">
                  {lang === 'fa' ? 'از آیه:' : 'From Verse:'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={verseStart}
                  onChange={(e) => setVerseStart(parseInt(e.target.value) || 1)}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-blue-300 mb-2 font-semibold">
                  {lang === 'fa' ? 'تا آیه:' : 'To Verse:'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={verseEnd}
                  onChange={(e) => setVerseEnd(parseInt(e.target.value) || 1)}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGeneratePresentation}
              disabled={isGenerating}
              className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
                isGenerating
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
              }`}
            >
              {isGenerating
                ? lang === 'fa'
                  ? '⏳ در حال ساخت...'
                  : '⏳ Generating...'
                : lang === 'fa'
                ? '🚀 ساخت ارائه PowerPoint'
                : '🚀 Generate PowerPoint'}
            </button>

            {/* Progress */}
            {progress && (
              <div className="mt-4 p-4 bg-blue-900/50 rounded-lg">
                <p className="text-blue-200 text-center">{progress}</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 p-4 bg-red-900/50 rounded-lg border border-red-600">
                <p className="text-red-200 text-center">{error}</p>
              </div>
            )}
          </div>

          {/* Right Panel - Info */}
          <div className="space-y-6" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            {/* Features Card */}
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-md rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                {lang === 'fa' ? '✨ قابلیت‌ها' : '✨ Features'}
              </h2>
              <ul className="space-y-3 text-purple-100">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">📄</span>
                  <span>
                    {lang === 'fa'
                      ? 'اسلایدهای حرفه‌ای با طراحی مدرن'
                      : 'Professional slides with modern design'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">🌐</span>
                  <span>
                    {lang === 'fa'
                      ? 'متن دوزبانه (فارسی + انگلیسی)'
                      : 'Bilingual text (Persian + English)'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">🎨</span>
                  <span>
                    {lang === 'fa'
                      ? 'پس‌زمینه گرادیانت و رنگ‌های زیبا'
                      : 'Gradient backgrounds and beautiful colors'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">📱</span>
                  <span>
                    {lang === 'fa'
                      ? 'مناسب برای پروژکتور و تلویزیون'
                      : 'Perfect for projector and TV display'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">⚡</span>
                  <span>
                    {lang === 'fa'
                      ? 'ساخت سریع در کمتر از 10 ثانیه'
                      : 'Fast generation in under 10 seconds'}
                  </span>
                </li>
              </ul>
            </div>

            {/* Usage Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                {lang === 'fa' ? '💡 نحوه استفاده' : '💡 How to Use'}
              </h2>
              <ol className="space-y-3 text-blue-100">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">1.</span>
                  <span>
                    {lang === 'fa'
                      ? 'کتاب، فصل و محدوده آیات را انتخاب کنید'
                      : 'Select book, chapter, and verse range'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">2.</span>
                  <span>
                    {lang === 'fa'
                      ? 'روی دکمه "ساخت ارائه" کلیک کنید'
                      : 'Click "Generate Presentation" button'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">3.</span>
                  <span>
                    {lang === 'fa'
                      ? 'فایل PPTX به صورت خودکار دانلود می‌شود'
                      : 'PPTX file will download automatically'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">4.</span>
                  <span>
                    {lang === 'fa'
                      ? 'فایل را با PowerPoint یا Google Slides باز کنید'
                      : 'Open with PowerPoint or Google Slides'}
                  </span>
                </li>
              </ol>
            </div>

            {/* Tips Card */}
            <div className="bg-green-900/30 backdrop-blur-md rounded-lg p-6 border border-green-600/50">
              <h2 className="text-xl font-bold text-green-300 mb-3">
                {lang === 'fa' ? '💡 نکات' : '💡 Tips'}
              </h2>
              <ul className="space-y-2 text-green-100 text-sm">
                <li>• {lang === 'fa' ? 'برای موعظه‌ها: 5-10 آیه مناسب است' : 'For sermons: 5-10 verses is ideal'}</li>
                <li>• {lang === 'fa' ? 'برای عبادت: 2-3 آیه کافی است' : 'For worship: 2-3 verses is enough'}</li>
                <li>• {lang === 'fa' ? 'می‌توانید اسلایدها را ویرایش کنید' : 'You can edit slides after generation'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiblePresentationCreatorPage;
