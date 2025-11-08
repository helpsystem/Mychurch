import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { useLanguage } from '../hooks/useLanguage';
import { Music, Upload, FileText, Globe, Zap, Download, Loader2 } from 'lucide-react';

interface WordTimestamp {
  word: string;
  startTime: number;
  endTime: number;
}

const PresentationCreatorPage: React.FC = () => {
  const { lang, t } = useLanguage();
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [persianText, setPersianText] = useState('');
  const [timedText, setTimedText] = useState<WordTimestamp[]>([]);
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
          
          <button
            onClick={handleTranslateToPersian}
            disabled={!!isLoading || !inputText}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full transition-opacity mb-4 flex items-center gap-2"
          >
            {isLoading === 'Translating to Persian...' ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {isLoading}</>
            ) : (
              <><Globe className="w-5 h-5" /> {lang === 'fa' ? 'ترجمه' : 'Translate'}</>
            )}
          </button>

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
            <div className="p-4 bg-gray-900/50 rounded-lg max-h-60 overflow-y-auto text-lg leading-relaxed">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default PresentationCreatorPage;
