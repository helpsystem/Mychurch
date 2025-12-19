import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import PptxGenJS from 'pptxgenjs';
import { useLanguage } from '../hooks/useLanguage';
import { Music, Upload, FileText, Globe, Zap, Download, Loader2, Guitar, Image as ImageIcon } from 'lucide-react';

interface WordTimestamp {
  word: string;
  startTime: number;
  endTime: number;
}

interface SlideContent {
  title: string;
  content: string[];
  startTime: number;
}

const PresentationCreatorPage: React.FC = () => {
  const { lang, t } = useLanguage();
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [persianText, setPersianText] = useState('');
  const [timedText, setTimedText] = useState<WordTimestamp[]>([]);
  const [chords, setChords] = useState<string | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  const getAi = useCallback(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
    return new GoogleGenAI({ apiKey });
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setTimedText([]);
      setCurrentWordIndex(-1);
      setInputText('');
      setPersianText('');
      setChords(null);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current || timedText.length === 0) return;
    const currentTime = audioRef.current.currentTime;
    const activeIndex = timedText.findIndex(
      (word) => currentTime >= word.startTime && currentTime <= word.endTime
    );
    setCurrentWordIndex(activeIndex);
  };

  const handleTranscribe = useCallback(async () => {
    if (!audioFile) {
      setError('Please upload an audio file first.');
      return;
    }
    setIsLoading('Transcribing audio...');
    setError(null);

    try {
      const ai = getAi();
      const audioBase64 = await fileToBase64(audioFile);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: {
          parts: [
            { inlineData: { mimeType: audioFile.type, data: audioBase64 } },
            { text: "Transcribe this Persian/Farsi worship song audio. Respond only with the transcribed text in Finglish (Persian written in Latin script)." },
          ],
        },
      });
      
      setInputText(response.text);

    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Transcription failed');
    } finally {
      setIsLoading(null);
    }
  }, [audioFile, getAi]);

  const handleTranslateToPersian = useCallback(async () => {
    if (!inputText) {
      setError('Please provide Finglish text first.');
      return;
    }
    setIsLoading('Translating to Persian...');
    setError(null);
    
    try {
      const ai = getAi();
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: `Translate the following Finglish (Persian in Latin script) to Persian script. Maintain line breaks. Only provide the translation:\n\n${inputText}`,
      });
      setPersianText(response.text);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Translation failed');
    } finally {
      setIsLoading(null);
    }
  }, [inputText, getAi]);

  const handleTransliterateToFinglish = useCallback(async () => {
    if (!persianText) {
      setError('Please provide Persian text first.');
      return;
    }
    setIsLoading('Transliterating to Finglish...');
    setError(null);
    
    try {
      const ai = getAi();
      const systemInstruction = `You are a professional Persian phonetic transliteration system specialized in converting Farsi (Persian) text into accurate **Finglish** (Latin script Persian).
Your goal is to take any Persian worship lyrics and produce a readable phonetic version that matches how Persian words are pronounced.

Rules:
1. Preserve capitalization for divine names (e.g., "Khoda", "Masiih")
2. Use long vowels: ا→"a", آ→"aa", ای/ی→"i", او/و→"oo", اُ→"o", اِ→"e"
3. Consonants: ق/غ→"gh", خ→"kh", چ→"ch", ژ→"zh", ش→"sh"
4. Maintain word spacing and punctuation
5. Keep rhythm natural for singing

Your entire response should consist ONLY of the Finglish transliteration. Maintain the same number of lines as the input.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: persianText,
        config: {
          systemInstruction: systemInstruction,
        },
      });
      setInputText(response.text);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Transliteration failed');
    } finally {
      setIsLoading(null);
    }
  }, [persianText, getAi]);

  const handleDetectChords = useCallback(async () => {
    if (!inputText) {
      setError('Please provide text to detect chords from.');
      return;
    }
    setIsLoading('Detecting chords...');
    setError(null);
    
    try {
      const ai = getAi();
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: `Based on the following worship song lyrics, provide a simple chord progression for an amateur musician. Output the chords with their placement above the lyrics:\n\n${inputText}`,
        config: {
          systemInstruction: "You are a helpful music assistant. Generate simple chord progressions for worship songs. Use common chords like C, G, Am, F, D, Em, etc."
        }
      });
      
      setChords(response.text);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Chord detection failed');
    } finally {
      setIsLoading(null);
    }
  }, [inputText, getAi]);

  const handleSynchronize = useCallback(async () => {
    if (!audioFile || !inputText) {
      setError('Please provide both audio file and text.');
      return;
    }
    setIsLoading('Synchronizing audio with text...');
    setError(null);

    try {
      const ai = getAi();
      const audioBase64 = await fileToBase64(audioFile);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: {
          parts: [
            { inlineData: { mimeType: audioFile.type, data: audioBase64 } },
            { text: `Reference text: "${inputText}"\n\nGenerate precise word-level timestamps matching the audio to this text.` },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                startTime: { type: Type.NUMBER },
                endTime: { type: Type.NUMBER },
              },
              required: ['word', 'startTime', 'endTime'],
            },
          },
        }
      });

      const parsedText = JSON.parse(response.text);
      setTimedText(parsedText);

    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Synchronization failed');
    } finally {
      setIsLoading(null);
    }
  }, [audioFile, inputText, getAi]);

  const handleGeneratePresentation = useCallback(async () => {
    if (timedText.length === 0 || !audioRef.current || !persianText || !inputText) {
      setError('Please provide Finglish & Persian text and synchronize first.');
      return;
    }
    setIsLoading('Generating presentation...');
    setError(null);

    try {
      const ai = getAi();
      
      // 1. Generate slide structure
      const structureResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: `Based on this worship song transcript with word-level timestamps: ${JSON.stringify(timedText)}\n\nCreate a presentation structure with slides. Each slide should have 2-4 lines of lyrics.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              slides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.ARRAY, items: { type: Type.STRING } },
                    startTime: { type: Type.NUMBER },
                  },
                  required: ['title', 'content', 'startTime'],
                },
              },
            },
            required: ['slides'],
          },
        },
      });

      const presentationContent: { slides: SlideContent[] } = JSON.parse(structureResponse.text);
      const slidesWithTiming = presentationContent.slides;
      const totalDuration = audioRef.current.duration;
      
      const allFinglishLines = inputText.split('\n');
      const allPersianLines = persianText.split('\n');

      // 2. Generate images for each slide
      setIsLoading(`Generating images for ${slidesWithTiming.length} slides...`);
      const imagePromises = slidesWithTiming.map((slideData, index) => {
        const imagePrompt = `An inspiring worship background image for a church presentation. Theme: ${slideData.title}. Style: Peaceful, spiritual, uplifting. No text or words in the image.`;
        return ai.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: { parts: [{ text: imagePrompt }] },
          config: { responseModalities: [Modality.IMAGE] },
        });
      });

      const imageResponses = await Promise.all(imagePromises);
      const slideImagesBase64 = imageResponses.map(response => {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return part.inlineData.data;
          }
        }
        return undefined;
      });

      // 3. Create PowerPoint
      setIsLoading('Creating PowerPoint file...');
      const pres = new PptxGenJS();
      pres.layout = 'LAYOUT_WIDE';
      pres.author = 'Iranian Christian Church DC';
      pres.title = 'Worship Presentation';

      // 4. Create slides
      slidesWithTiming.forEach((slideData, index) => {
        const slide = pres.addSlide();
        const imageBase64 = slideImagesBase64[index];

        // Background
        if (imageBase64) {
          slide.background = { data: `data:image/png;base64,${imageBase64}` };
        } else {
          slide.background = { color: '1F2937' };
        }
        
        // Semi-transparent overlay
        slide.addShape('rect', {
          x: 0, y: 0, w: '100%', h: '100%',
          fill: { color: '000000', transparency: 50 },
        });

        // Title
        slide.addText(slideData.title, {
          x: 0.5, y: 0.5, w: '90%', h: 1,
          align: 'center', fontSize: 36, color: 'FFFFFF', bold: true,
          fontFace: 'Calibri',
          shadow: { type: 'outer', color: '000000', blur: 3, offset: 2, angle: 45, opacity: 0.8 },
        });

        // Match Persian content
        const persianContentForSlide: string[] = [];
        slideData.content.forEach(finglishLine => {
          const lineIndex = allFinglishLines.findIndex(line => line.trim() === finglishLine.trim());
          if (lineIndex !== -1 && lineIndex < allPersianLines.length) {
            persianContentForSlide.push(allPersianLines[lineIndex]);
          }
        });

        // Finglish text (Left)
        slide.addText(slideData.content.join('\n'), {
          x: 0.5, y: 2, w: '44%', h: 4.5,
          align: 'left', fontSize: 24, color: 'E5E7EB',
          fontFace: 'Calibri', valign: 'middle',
          shadow: { type: 'outer', color: '000000', blur: 2, offset: 1, angle: 45, opacity: 0.7 },
        });

        // Persian text (Right)
        slide.addText(persianContentForSlide.join('\n'), {
          x: 5.1, y: 2, w: '44%', h: 4.5,
          align: 'right', rtlMode: true, fontSize: 24, color: 'E5E7EB',
          fontFace: 'Tahoma', valign: 'middle',
          shadow: { type: 'outer', color: '000000', blur: 2, offset: 1, angle: 45, opacity: 0.7 },
        });
        
        // Auto-transition timing
        const nextSlideStartTime = (index + 1 < slidesWithTiming.length) 
          ? slidesWithTiming[index + 1].startTime 
          : totalDuration;
        const durationInSeconds = nextSlideStartTime - slideData.startTime;

        if (durationInSeconds > 0) {
          // Add transition timing (PptxGenJS v3.x format)
          (slide as any).transition = {
            type: 'fade',
            advTm: Math.round(durationInSeconds * 1000)
          };
        }
      });

      // 5. Save presentation
      await pres.writeFile({ fileName: 'worship-presentation.pptx' });
      
      setIsLoading(null);
      alert(lang === 'fa' 
        ? 'پرزنتیشن با موفقیت ساخته شد و دانلود می‌شود!' 
        : 'Presentation created successfully and downloading!');

    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Presentation generation failed');
    } finally {
      setIsLoading(null);
    }
  }, [timedText, audioFile, inputText, persianText, getAi, lang]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Music className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              {lang === 'fa' ? 'ساخت پرزنتیشن' : 'Presentation Creator'}
            </h1>
            <Music className="w-10 h-10 text-purple-400" />
          </div>
          <p className="text-xl text-gray-300">
            {lang === 'fa' 
              ? 'تبدیل صوت به پرزنتیشن دو زبانه با AI'
              : 'Convert Audio to Bilingual Presentations with AI'}
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-6 py-4 rounded-xl mb-6">
            <strong className="font-bold">{lang === 'fa' ? 'خطا:' : 'Error:'} </strong>
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Upload Audio */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 mb-6">
          <h2 className="text-2xl font-semibold text-purple-300 mb-4 flex items-center gap-2">
            <Upload className="w-6 h-6" />
            {lang === 'fa' ? '۱. بارگذاری فایل صوتی' : '1. Upload Audio File'}
          </h2>
          
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 transition-colors cursor-pointer"
          />
          
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              className="w-full mt-4 rounded-lg"
              onTimeUpdate={handleTimeUpdate}
            />
          )}
        </div>

        {/* Step 2: Transcribe */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 mb-6">
          <h2 className="text-2xl font-semibold text-purple-300 mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            {lang === 'fa' ? '۲. تبدیل صدا به متن' : '2. Transcribe Audio'}
          </h2>
          
          <button
            onClick={handleTranscribe}
            disabled={!!isLoading || !audioFile}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full transition-opacity mb-4 flex items-center gap-2"
          >
            {isLoading === 'Transcribing audio...' ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {isLoading}</>
            ) : (
              <><Zap className="w-5 h-5" /> {lang === 'fa' ? 'تبدیل به متن' : 'Transcribe'}</>
            )}
          </button>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={6}
            placeholder={lang === 'fa' ? 'متن Finglish اینجا نمایش داده می‌شود...' : 'Finglish text will appear here...'}
            className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
          />
        </div>

        {/* Step 3: Translate to Persian */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 mb-6">
          <h2 className="text-2xl font-semibold text-purple-300 mb-4 flex items-center gap-2">
            <Globe className="w-6 h-6" />
            {lang === 'fa' ? '۳. ترجمه به فارسی' : '3. Translate to Persian'}
          </h2>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={handleTranslateToPersian}
              disabled={!!isLoading || !inputText}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full transition-opacity flex items-center gap-2"
            >
              {isLoading === 'Translating to Persian...' ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {isLoading}</>
              ) : (
                <><Globe className="w-5 h-5" /> {lang === 'fa' ? 'Finglish → فارسی' : 'Finglish → Persian'}</>
              )}
            </button>

            <button
              onClick={handleTransliterateToFinglish}
              disabled={!!isLoading || !persianText}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full transition-opacity flex items-center gap-2"
            >
              {isLoading === 'Transliterating to Finglish...' ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {isLoading}</>
              ) : (
                <><Globe className="w-5 h-5" /> {lang === 'fa' ? 'فارسی → Finglish' : 'Persian → Finglish'}</>
              )}
            </button>
          </div>

          <textarea
            value={persianText}
            onChange={(e) => setPersianText(e.target.value)}
            rows={6}
            placeholder={lang === 'fa' ? 'متن فارسی اینجا نمایش داده می‌شود...' : 'Persian text will appear here...'}
            className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 font-['Tahoma']"
            style={{ direction: 'rtl' }}
          />
        </div>

        {/* Step 4: Synchronize */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
          <h2 className="text-2xl font-semibold text-purple-300 mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6" />
            {lang === 'fa' ? '۴. هماهنگ‌سازی' : '4. Synchronize'}
          </h2>
          
          <button
            onClick={handleSynchronize}
            disabled={!!isLoading || !audioFile || !inputText}
            className="bg-gradient-to-r from-green-500 to-teal-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full transition-opacity mb-4 flex items-center gap-2"
          >
            {isLoading === 'Synchronizing audio with text...' ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {isLoading}</>
            ) : (
              <><Zap className="w-5 h-5" /> {lang === 'fa' ? 'هماهنگ‌سازی' : 'Synchronize'}</>
            )}
          </button>

          {timedText.length > 0 && (
            <>
              <div className="p-4 bg-gray-900/50 rounded-lg max-h-60 overflow-y-auto text-lg leading-relaxed mb-4">
                {timedText.map((word, index) => (
                  <span
                    key={index}
                    className={`transition-all duration-150 ${
                      index === currentWordIndex
                        ? 'bg-yellow-400 text-gray-900 rounded px-1 font-bold scale-110 inline-block'
                        : 'text-white'
                    }`}
                  >
                    {word.word}{' '}
                  </span>
                ))}
              </div>

              {/* Additional Actions */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleDetectChords}
                  disabled={!!isLoading}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full transition-opacity flex items-center gap-2"
                >
                  {isLoading === 'Detecting chords...' ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> {isLoading}</>
                  ) : (
                    <><Guitar className="w-5 h-5" /> {lang === 'fa' ? 'تشخیص آکوردها' : 'Detect Chords'}</>
                  )}
                </button>

                <button
                  onClick={handleGeneratePresentation}
                  disabled={!!isLoading || !persianText}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full transition-opacity flex items-center gap-2"
                >
                  {(isLoading && isLoading.includes('presentation')) || (isLoading && isLoading.includes('image')) ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> {isLoading}</>
                  ) : (
                    <><Download className="w-5 h-5" /> {lang === 'fa' ? 'ساخت پرزنتیشن' : 'Generate Presentation'}</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Chords Display */}
        {chords && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/30 mt-6">
            <h2 className="text-2xl font-semibold text-yellow-300 mb-4 flex items-center gap-2">
              <Guitar className="w-6 h-6" />
              {lang === 'fa' ? 'آکوردهای موسیقی' : 'Musical Chords'}
            </h2>
            <p className="text-sm text-gray-400 mb-3">
              {lang === 'fa' 
                ? 'توجه: این آکوردها توسط AI تولید شده‌اند و ممکن است دقیق نباشند.'
                : 'Note: These chords are AI-generated and may not be accurate.'}
            </p>
            <pre className="p-4 bg-gray-900/50 rounded-lg max-h-80 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap font-mono text-white">
              {chords}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default PresentationCreatorPage;
