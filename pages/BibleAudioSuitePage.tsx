import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { fileToBase64 } from '@/utils/file';
import { WordTimestamp } from '@/types/audioSync';
import PptxGenJS from 'pptxgenjs';
import axios from 'axios';

interface BibleBook {
  key: string;
  name: {
    en: string;
    fa: string;
  };
  chapters: number;
  testament?: string;
}

interface Verse {
  verse_number: number;
  text_fa: string;
  text_en: string;
}

const BibleAudioSuitePage: React.FC = () => {
  const { lang } = useLanguage();
  
  // State
  const [bibleBooks, setBibleBooks] = useState<BibleBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [persianTranscript, setPersianTranscript] = useState<string>('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [synchronizedData, setSynchronizedData] = useState<WordTimestamp[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalChapters, setTotalChapters] = useState<number>(1);
  const [step, setStep] = useState<1 | 2>(1);

  // Fetch Bible books
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get('/api/bible/books');
        const books = response.data.books || [];
        setBibleBooks(books);
        if (books.length > 0) {
          setSelectedBook(books[0].key);
          setTotalChapters(books[0].chapters);
        }
      } catch (err) {
        console.error('Error fetching Bible books:', err);
      }
    };
    fetchBooks();
  }, []);

  // Fetch verses and auto-fill Persian transcript
  useEffect(() => {
    if (!selectedBook) return;
    
    const fetchVerses = async () => {
      try {
        const response = await axios.get(`/api/bible/content/${selectedBook}/${selectedChapter}`);
        
        // Transform response
        const verses: Verse[] = response.data.verses.fa.map((textFa: string, index: number) => ({
          verse_number: index + 1,
          text_fa: textFa,
          text_en: response.data.verses.en?.[index] || textFa
        }));
        
        setVerses(verses);
        
        // Auto-fill Persian transcript
        const transcript = verses
          .map((v: Verse) => `${v.verse_number}. ${v.text_fa}`)
          .join('\n\n');
        setPersianTranscript(transcript);
      } catch (err) {
        console.error('Error fetching verses:', err);
      }
    };
    
    fetchVerses();
  }, [selectedBook, selectedChapter]);

  const handleBookChange = (bookKey: string) => {
    setSelectedBook(bookKey);
    setSelectedChapter(1);
    const book = bibleBooks.find(b => b.key === bookKey);
    if (book) {
      setTotalChapters(book.chapters);
    }
  };

  // Synchronize audio with text
  const handleSynchronize = async () => {
    if (!audioFile || !persianTranscript) {
      alert(lang === 'fa' ? 'لطفاً فایل صوتی و متن فارسی را وارد کنید' : 'Please provide audio file and Persian text');
      return;
    }

    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });

      const audioBase64 = await fileToBase64(audioFile);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: {
          parts: [
            { inlineData: { mimeType: audioFile.type, data: audioBase64 } },
            { text: `Reference text: "${persianTranscript}"` }
          ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              properties: {
                word: { type: Type.STRING },
                startTime: { type: Type.NUMBER },
                endTime: { type: Type.NUMBER }
              }
            }
          }
        }
      });

      const syncData = JSON.parse(response.text);
      setSynchronizedData(syncData);
      setStep(2);
      alert(lang === 'fa' ? '✅ هماهنگ‌سازی با موفقیت انجام شد!' : '✅ Synchronization completed successfully!');
    } catch (error) {
      console.error('Synchronization error:', error);
      alert(lang === 'fa' ? 'خطا در هماهنگ‌سازی' : 'Synchronization error');
    } finally {
      setLoading(false);
    }
  };

  // Generate PowerPoint presentation
  const handleGeneratePresentation = async () => {
    if (verses.length === 0) {
      alert(lang === 'fa' ? 'لطفاً ابتدا آیات را بارگذاری کنید' : 'Please load verses first');
      return;
    }

    setLoading(true);
    try {
      const pres = new PptxGenJS();
      pres.layout = 'LAYOUT_WIDE';

      // Title slide
      const titleSlide = pres.addSlide();
      titleSlide.background = { color: '1a365d' };
      
      const currentBook = bibleBooks.find(b => b.key === selectedBook);
      titleSlide.addText(
        currentBook ? currentBook.name.fa : selectedBook,
        {
          x: '10%',
          y: '35%',
          w: '80%',
          h: '15%',
          fontSize: 48,
          bold: true,
          color: 'FFFFFF',
          align: 'center'
        }
      );
      
      titleSlide.addText(
        `${lang === 'fa' ? 'فصل' : 'Chapter'} ${selectedChapter}`,
        {
          x: '10%',
          y: '50%',
          w: '80%',
          h: '10%',
          fontSize: 36,
          color: 'E2E8F0',
          align: 'center'
        }
      );

      // Verse slides
      verses.forEach((verse) => {
        const slide = pres.addSlide();
        slide.background = { color: '1F2937', transparency: 50 };

        // Verse number
        slide.addText(`${lang === 'fa' ? 'آیه' : 'Verse'} ${verse.verse_number}`, {
          x: '42%',
          y: '5%',
          w: '16%',
          h: '8%',
          fontSize: 24,
          bold: true,
          color: '60A5FA',
          align: 'center'
        });

        // Persian text (right)
        slide.addText(verse.text_fa, {
          x: '52%',
          y: '20%',
          w: '46%',
          h: '70%',
          fontSize: 28,
          color: 'FFFFFF',
          align: 'right',
          valign: 'middle'
        });

        // English text (left)
        slide.addText(verse.text_en, {
          x: '2%',
          y: '20%',
          w: '46%',
          h: '70%',
          fontSize: 24,
          color: 'E2E8F0',
          align: 'left',
          valign: 'middle'
        });
      });

      await pres.writeFile({ fileName: `${selectedBook}_${selectedChapter}_BilingualPresentation.pptx` });
      alert(lang === 'fa' ? '✅ پرزنتیشن با موفقیت ایجاد شد!' : '✅ Presentation created successfully!');
    } catch (error) {
      console.error('Presentation generation error:', error);
      alert(lang === 'fa' ? 'خطا در ایجاد پرزنتیشن' : 'Presentation generation error');
    } finally {
      setLoading(false);
    }
  };

  const currentBookName = bibleBooks.find(b => b.key === selectedBook);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 ${lang === 'fa' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-8 px-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-center">
            {lang === 'fa' ? '🎙️ کتاب مقدس - مجموعه صوتی هوش مصنوعی' : '🎙️ Bible - AI Audio Suite'}
          </h1>
          <p className="text-lg text-center opacity-90">
            {lang === 'fa' 
              ? 'ایجاد پرزنتیشن با هماهنگ‌سازی صوتی و متن'
              : 'Create presentations with audio-text synchronization'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Step 1: Provide Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">1</span>
            {lang === 'fa' ? 'محتوای خود را وارد کنید' : 'Provide Your Content'}
          </h2>

          {/* Book & Chapter Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {lang === 'fa' ? 'انتخاب کتاب' : 'Select Book'}
              </label>
              <select
                value={selectedBook}
                onChange={(e) => handleBookChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {bibleBooks.map((book) => (
                  <option key={book.key} value={book.key}>
                    {lang === 'fa' ? book.name.fa : book.name.en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {lang === 'fa' ? 'انتخاب فصل' : 'Select Chapter'}
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {Array.from({ length: totalChapters }, (_, i) => i + 1).map((ch) => (
                  <option key={ch} value={ch}>{lang === 'fa' ? `فصل ${ch}` : `Chapter ${ch}`}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Audio Upload */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {lang === 'fa' ? '📁 بارگذاری فایل صوتی (اختیاری)' : '📁 Upload Audio File (Optional)'}
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            {audioFile && (
              <p className="mt-2 text-sm text-green-600">
                ✓ {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Persian Transcript */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {lang === 'fa' ? 'متن فارسی (از دیتابیس بارگذاری شده)' : 'Persian Transcript (Auto-loaded from database)'}
            </label>
            <textarea
              value={persianTranscript}
              onChange={(e) => setPersianTranscript(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 min-h-[300px]"
              dir="rtl"
              placeholder={lang === 'fa' ? 'متن فارسی از دیتابیس بارگذاری می‌شود...' : 'Persian text will be loaded from database...'}
            />
          </div>

          {/* Synchronize Button */}
          <button
            onClick={handleSynchronize}
            disabled={!audioFile || !persianTranscript || loading}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 rounded-lg font-bold text-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (lang === 'fa' ? '⏳ در حال هماهنگ‌سازی...' : '⏳ Synchronizing...') : (lang === 'fa' ? '🔗 هماهنگ‌سازی متن و صوت' : '🔗 Synchronize Text')}
          </button>
        </div>

        {/* Step 2: Review & Generate */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">2</span>
              {lang === 'fa' ? 'بررسی و ایجاد' : 'Review & Generate'}
            </h2>

            {/* Synchronized Data Preview */}
            {synchronizedData.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  {lang === 'fa' ? `✅ ${synchronizedData.length} کلمه هماهنگ شده` : `✅ ${synchronizedData.length} words synchronized`}
                </p>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {synchronizedData.slice(0, 50).map((item, idx) => (
                    <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {item.word} ({item.startTime.toFixed(2)}s)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Presentation Button */}
            <button
              onClick={handleGeneratePresentation}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-4 rounded-lg font-bold text-lg hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (lang === 'fa' ? '⏳ در حال ایجاد...' : '⏳ Generating...') : (lang === 'fa' ? '📊 ایجاد پرزنتیشن دوزبانه' : '📊 Generate Dual-Language Presentation')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BibleAudioSuitePage;
