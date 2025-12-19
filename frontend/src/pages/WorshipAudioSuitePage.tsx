import React, { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { fileToBase64 } from '@/utils/file';
import { WordTimestamp } from '@/types/audioSync';
import PptxGenJS from 'pptxgenjs';

const WorshipAudioSuitePage: React.FC = () => {
  const { lang } = useLanguage();
  
  // State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [finglishLyrics, setFinglishLyrics] = useState<string>('');
  const [persianLyrics, setPersianLyrics] = useState<string>('');
  const [synchronizedData, setSynchronizedData] = useState<WordTimestamp[]>([]);
  const [chords, setChords] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<1 | 2>(1);

  // Transcribe Audio
  const handleTranscribeAudio = async () => {
    if (!audioFile) {
      alert(lang === 'fa' ? 'لطفاً ابتدا فایل صوتی را بارگذاری کنید' : 'Please upload audio file first');
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
            { text: 'Please transcribe this Persian worship song into Finglish (phonetic Persian using English letters). Preserve line breaks and structure.' }
          ]
        }
      });

      setFinglishLyrics(response.text);
      alert(lang === 'fa' ? '✅ رونویسی با موفقیت انجام شد!' : '✅ Transcription completed!');
    } catch (error) {
      console.error('Transcription error:', error);
      alert(lang === 'fa' ? 'خطا در رونویسی' : 'Transcription error');
    } finally {
      setLoading(false);
    }
  };

  // Finglish → Persian Translation
  const handleTranslateToPersian = async () => {
    if (!finglishLyrics) {
      alert(lang === 'fa' ? 'لطفاً ابتدا متن Finglish را وارد کنید' : 'Please enter Finglish text first');
      return;
    }

    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Translate the following Finglish (phonetic Persian) text to proper Persian script. Preserve line breaks and formatting:

${finglishLyrics}`
      });

      setPersianLyrics(response.text);
      alert(lang === 'fa' ? '✅ ترجمه به فارسی انجام شد!' : '✅ Translation to Persian completed!');
    } catch (error) {
      console.error('Translation error:', error);
      alert(lang === 'fa' ? 'خطا در ترجمه' : 'Translation error');
    } finally {
      setLoading(false);
    }
  };

  // Persian → Finglish Transliteration
  const handleTransliterateToFinglish = async () => {
    if (!persianLyrics) {
      alert(lang === 'fa' ? 'لطفاً ابتدا متن فارسی را وارد کنید' : 'Please enter Persian text first');
      return;
    }

    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `You are a professional Persian phonetic transliteration system. Convert Persian text to Finglish (phonetic Persian using English alphabet) suitable for singing worship songs.

Transliteration Rules:
- ا → "a", آ → "aa"
- ب → "b", پ → "p"
- ت → "t", ث → "s"
- ج → "j", چ → "ch"
- ح → "h", خ → "kh"
- د → "d", ذ → "z"
- ر → "r", ز → "z"
- ژ → "zh", س → "s"
- ش → "sh", ص → "s"
- ض → "z", ط → "t"
- ظ → "z", ع → " ' "
- غ → "gh", ف → "f"
- ق → "gh", ک → "k"
- گ → "g", ل → "l"
- م → "m", ن → "n"
- و → "o/v", ه → "h/e"
- ی → "i/y"

Preserve line breaks, rhythm, and syllable structure. Make it easy to sing along.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: persianLyrics,
        config: {
          systemInstruction
        }
      });

      setFinglishLyrics(response.text);
      alert(lang === 'fa' ? '✅ نویسه‌گردانی به Finglish انجام شد!' : '✅ Transliteration to Finglish completed!');
    } catch (error) {
      console.error('Transliteration error:', error);
      alert(lang === 'fa' ? 'خطا در نویسه‌گردانی' : 'Transliteration error');
    } finally {
      setLoading(false);
    }
  };

  // Synchronize Text with Audio
  const handleSynchronize = async () => {
    if (!audioFile || !finglishLyrics) {
      alert(lang === 'fa' ? 'لطفاً فایل صوتی و متن Finglish را وارد کنید' : 'Please provide audio file and Finglish text');
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
            { text: `Reference text: "${finglishLyrics}"` }
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

  // Detect Chords
  const handleDetectChords = async () => {
    if (!finglishLyrics) {
      alert(lang === 'fa' ? 'لطفاً ابتدا متن Finglish را وارد کنید' : 'Please enter Finglish lyrics first');
      return;
    }

    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the following worship song lyrics, provide a simple chord progression suitable for amateur musicians. Use common chords (C, G, Am, F, D, Em, etc.). Place chords in parentheses before the words they align with.

Lyrics:
${finglishLyrics}

Format: (C)word (G)word (Am)word...`
      });

      setChords(response.text);
      alert(lang === 'fa' ? '✅ آکوردها شناسایی شدند!' : '✅ Chords detected!');
    } catch (error) {
      console.error('Chord detection error:', error);
      alert(lang === 'fa' ? 'خطا در شناسایی آکوردها' : 'Chord detection error');
    } finally {
      setLoading(false);
    }
  };

  // Generate Dual-Language Presentation
  const handleGeneratePresentation = async () => {
    if (!finglishLyrics || !persianLyrics) {
      alert(lang === 'fa' ? 'لطفاً متن Finglish و فارسی را وارد کنید' : 'Please provide both Finglish and Persian lyrics');
      return;
    }

    setLoading(true);
    try {
      const pres = new PptxGenJS();
      pres.layout = 'LAYOUT_WIDE';

      // Split lyrics into lines
      const finglishLines = finglishLyrics.split('\n').filter(line => line.trim());
      const persianLines = persianLyrics.split('\n').filter(line => line.trim());

      // Title slide
      const titleSlide = pres.addSlide();
      titleSlide.background = { color: '1a1a2e' };
      
      titleSlide.addText(
        audioFile?.name.replace(/\.(mp3|wav|m4a)$/i, '') || 'Worship Song',
        {
          x: '10%',
          y: '40%',
          w: '80%',
          h: '20%',
          fontSize: 48,
          bold: true,
          color: 'FFFFFF',
          align: 'center'
        }
      );

      // Lyrics slides (paired)
      const maxLines = Math.max(finglishLines.length, persianLines.length);
      for (let i = 0; i < maxLines; i += 4) {
        const slide = pres.addSlide();
        slide.background = { color: '16213e', transparency: 30 };

        const finglishBlock = finglishLines.slice(i, i + 4).join('\n');
        const persianBlock = persianLines.slice(i, i + 4).join('\n');

        // Finglish lyrics (left)
        if (finglishBlock) {
          slide.addText(finglishBlock, {
            x: '2%',
            y: '25%',
            w: '46%',
            h: '60%',
            fontSize: 32,
            color: 'FFFFFF',
            align: 'left',
            valign: 'middle'
          });
        }

        // Persian lyrics (right)
        if (persianBlock) {
          slide.addText(persianBlock, {
            x: '52%',
            y: '25%',
            w: '46%',
            h: '60%',
            fontSize: 32,
            color: 'E2E8F0',
            align: 'right',
            valign: 'middle'
          });
        }

        // Chords (if available) - top center
        if (chords) {
          const chordSegment = chords.split('\n').slice(i, i + 4).join('\n');
          if (chordSegment) {
            slide.addText(chordSegment, {
              x: '10%',
              y: '10%',
              w: '80%',
              h: '10%',
              fontSize: 18,
              color: '60A5FA',
              align: 'center'
            });
          }
        }
      }

      const fileName = audioFile?.name.replace(/\.(mp3|wav|m4a)$/i, '') || 'WorshipSong';
      await pres.writeFile({ fileName: `${fileName}_DualLanguage.pptx` });
      alert(lang === 'fa' ? '✅ پرزنتیشن دوزبانه ایجاد شد!' : '✅ Dual-language presentation created!');
    } catch (error) {
      console.error('Presentation generation error:', error);
      alert(lang === 'fa' ? 'خطا در ایجاد پرزنتیشن' : 'Presentation generation error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 ${lang === 'fa' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white py-8 px-4 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-center">
            {lang === 'fa' ? '🎵 مجموعه هوش مصنوعی سرودهای پرستشی' : '🎵 Worship Songs - AI Content Suite'}
          </h1>
          <p className="text-lg text-center opacity-90">
            {lang === 'fa' 
              ? 'ایجاد پرزنتیشن یا گفتگوی زنده با هوش مصنوعی'
              : 'Create presentations or have a live conversation with AI'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Step 1: Provide Your Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">1</span>
            {lang === 'fa' ? 'محتوای خود را وارد کنید' : 'Provide Your Content'}
          </h2>

          {/* Upload Audio File */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {lang === 'fa' ? '📁 بارگذاری فایل صوتی' : '📁 Upload Audio File'}
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-3 border-2 border-dashed border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 hover:border-indigo-500 transition-colors"
            />
            {audioFile && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-semibold">
                  ✓ {audioFile.name}
                </p>
                <p className="text-xs text-gray-600">
                  {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>

          {/* Audio Transcript (Finglish) */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {lang === 'fa' ? 'متن صوتی (Finglish)' : 'Audio Transcript (Finglish)'}
            </label>
            <textarea
              value={finglishLyrics}
              onChange={(e) => setFinglishLyrics(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[250px] font-mono"
              placeholder="El Shaday El Shaday&#10;El Aliyoon Adonay&#10;Naam-e to dar beyn-e maa&#10;Ham dar 'Aalam-e 'Alaa..."
            />
          </div>

          {/* Persian Transcript */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {lang === 'fa' ? 'متن فارسی' : 'Persian Transcript'}
            </label>
            <textarea
              value={persianLyrics}
              onChange={(e) => setPersianLyrics(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[250px]"
              dir="rtl"
              placeholder="ال شدای ال شدای&#10;ال علیون ادونای&#10;نام تو در بین ما&#10;هم در عالم اعلا..."
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={handleTranscribeAudio}
              disabled={!audioFile || loading}
              className="bg-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {lang === 'fa' ? '🎤 رونویسی صوت' : 'Transcribe Audio'}
            </button>

            <button
              onClick={handleTranslateToPersian}
              disabled={!finglishLyrics || loading}
              className="bg-purple-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {lang === 'fa' ? '➡️ Finglish → فارسی' : 'Finglish → Persian'}
            </button>

            <button
              onClick={handleTransliterateToFinglish}
              disabled={!persianLyrics || loading}
              className="bg-pink-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {lang === 'fa' ? '⬅️ فارسی → Finglish' : 'Persian → Finglish'}
            </button>

            <button
              onClick={handleSynchronize}
              disabled={!audioFile || !finglishLyrics || loading}
              className="bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {lang === 'fa' ? '🔗 هماهنگ‌سازی' : 'Synchronize Text'}
            </button>
          </div>
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
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  {lang === 'fa' 
                    ? `✅ ${synchronizedData.length} کلمه هماهنگ شده با زمان‌بندی`
                    : `✅ ${synchronizedData.length} words synchronized with timing`}
                </p>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {synchronizedData.slice(0, 100).map((item, idx) => (
                    <span 
                      key={idx} 
                      className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded border border-indigo-300"
                    >
                      {item.word} <span className="text-gray-500">({item.startTime.toFixed(2)}s)</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Detect Chords Button */}
            <div className="mb-6">
              <button
                onClick={handleDetectChords}
                disabled={!finglishLyrics || loading}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-4 rounded-lg font-bold text-lg hover:from-yellow-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (lang === 'fa' ? '⏳ در حال شناسایی...' : '⏳ Detecting...') : (lang === 'fa' ? '🎸 شناسایی آکوردها' : 'Detect Chords')}
              </button>
            </div>

            {/* Musical Chords Display */}
            {chords && (
              <div className="mb-6 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {lang === 'fa' ? '🎸 آکوردهای موسیقی (آزمایشی)' : 'Musical Chords (Experimental)'}
                </h3>
                <p className="text-xs text-yellow-800 mb-4">
                  {lang === 'fa' 
                    ? '⚠️ توجه: این آکوردها توسط هوش مصنوعی تولید شده‌اند و ممکن است دقیق نباشند. این فقط یک راهنمای خلاقانه است.'
                    : 'Note: These chords are AI-generated based on lyrics and may not be accurate. They are intended as a creative guide.'}
                </p>
                <pre className="bg-white p-4 rounded border border-yellow-300 overflow-x-auto whitespace-pre-wrap text-sm font-mono">
                  {chords}
                </pre>
              </div>
            )}

            {/* Generate Presentation Button */}
            <button
              onClick={handleGeneratePresentation}
              disabled={!finglishLyrics || !persianLyrics || loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white py-4 rounded-lg font-bold text-lg hover:from-indigo-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {loading ? (lang === 'fa' ? '⏳ در حال ایجاد...' : '⏳ Generating...') : (lang === 'fa' ? '📊 ایجاد پرزنتیشن دوزبانه' : 'Generate Dual-Language Presentation')}
            </button>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mb-4"></div>
              <p className="text-lg font-semibold text-gray-700">
                {lang === 'fa' ? 'در حال پردازش...' : 'Processing...'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorshipAudioSuitePage;
