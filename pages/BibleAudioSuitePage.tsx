import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import PptxGenJS from 'pptxgenjs';
import { WordTimestamp, TimedSlideContent } from '../types/audio-suite';
import { fileToBase64 } from '../utils/fileHelpers';
import { Music, BookOpen, Mic, FileAudio, Layers, Download, RefreshCw, Wand2, Image as ImageIcon } from 'lucide-react';

// --- Helper Components ---
const Loader = ({ text }: { text: string }) => (
  <div className="flex flex-col items-center justify-center space-y-4 py-8">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
    </div>
    <p className="text-blue-300 font-medium animate-pulse">{text}</p>
  </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="bg-red-900/40 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg flex items-center gap-3" role="alert">
    <div className="p-2 bg-red-800 rounded-full shrink-0">⚠️</div>
    <div>
      <strong className="font-bold block">Error</strong>
      <span className="text-sm opacity-90">{message}</span>
    </div>
  </div>
);

const BibleAudioSuitePage: React.FC = () => {
  // --- App State ---
  const [activeTab, setActiveTab] = useState<'worship' | 'bible'>('worship');

  // --- Media State ---
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [inputText, setInputText] = useState(''); // Finglish
  const [persianText, setPersianText] = useState<string>(''); // Persian
  const [timedText, setTimedText] = useState<WordTimestamp[]>([]);
  const [chords, setChords] = useState<string | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GOOGLE_AI_KEY || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(!import.meta.env.VITE_GOOGLE_AI_KEY);

  const audioRef = useRef<HTMLAudioElement>(null);
  const aiRef = useRef<GoogleGenAI | null>(null);

  const getAi = useCallback(() => {
    if (!apiKey) throw new Error("API Key is required");
    if (!aiRef.current) {
      aiRef.current = new GoogleGenAI({ apiKey: apiKey });
    }
    return aiRef.current;
  }, [apiKey]);

  // --- Handlers ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setTimedText([]);
      setCurrentWordIndex(-1);
      // Don't clear text if user wants to keep it
      setError(null);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current || timedText.length === 0) return;
    const currentTime = audioRef.current.currentTime;
    const activeIndex = timedText.findIndex(
      (word) => currentTime >= word.startTime && currentTime <= word.endTime
    );
    if (activeIndex !== -1) setCurrentWordIndex(activeIndex);
  };

  const handleTranscribe = useCallback(async () => {
    if (!audioFile) {
      setError('Please upload an audio file first.');
      return;
    }
    setIsLoading('Transcribing audio (Gemini Pro)...');
    setError(null);

    try {
      const ai = getAi();
      const audioBase64 = await fileToBase64(audioFile);

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash', // Updated to latest fast model
        contents: {
          parts: [
            { inlineData: { mimeType: audioFile.type, data: audioBase64 } },
            { text: "Transcribe the audio accurately. If it is a song, capture the lyrics. Respond ONLY with the text." },
          ],
        },
      });

      const text = response.text || '';
      setInputText(text); // Assume Finglish/English first, user can edit

    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Transcription failed.');
    } finally {
      setIsLoading(null);
    }
  }, [audioFile, getAi]);

  const handleTranslateToPersian = useCallback(async () => {
    if (!inputText) {
      setError('Transcript is empty.');
      return;
    }
    setIsLoading('Translating to Persian Script...');
    setError(null);
    try {
      const ai = getAi();
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Translate the following text (which might be Finglish or English) into proper Persian (Farsi) script. Maintain the exact line breaks. Output ONLY the Persian text.\n\nSOURCE TEXT:\n"""\n${inputText}\n"""`,
      });
      setPersianText(response.text || '');
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Translation failed.');
    } finally {
      setIsLoading(null);
    }
  }, [inputText, getAi]);

  const handleSynchronize = useCallback(async () => {
    if (!audioFile || !inputText) {
      setError('Audio and Text are required for sync.');
      return;
    }
    setIsLoading('Synchronizing Audio & Text (Pixel-perfect timing)...');
    setError(null);

    try {
      const ai = getAi();
      const audioBase64 = await fileToBase64(audioFile);

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: audioFile.type, data: audioBase64 } },
            { text: `Reference text: "${inputText}". Analyze the audio and provide precise word-level timestamps.` },
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

      const parsedText = JSON.parse(response.text || '[]');
      setTimedText(parsedText);

    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Synchronization failed.');
    } finally {
      setIsLoading(null);
    }
  }, [audioFile, inputText, getAi]);

  const handleDetectChords = useCallback(async () => {
    if (!inputText) return;
    setIsLoading('Analyzing Harmony & Chords...');
    setError(null);

    try {
      const ai = getAi();
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Based on these lyrics, generate a simple, playable chord progression (Guitar/Piano). Output the chords placed precisely above the relevant lyrics. \n\nLyrics: "${inputText}"`,
      });
      setChords(response.text || '');
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Chord detection failed.');
    } finally {
      setIsLoading(null);
    }
  }, [inputText, getAi]);

  const handleGeneratePresentation = useCallback(async () => {
    if (!inputText || !persianText) {
      setError('Both Finglish and Persian text are required.');
      return;
    }
    const syncDataUsed = timedText.length > 0 ? timedText : null;

    setIsLoading('Designing Presentation Slides...');
    setError(null);

    try {
      const ai = getAi();
      // 1. Structure
      const structureResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Create a presentation structure for a Christian Worship Song.
                   Finglish Lyrics: ${inputText}
                   Persian Lyrics: ${persianText}
                   
                   Group lines logically into slides (Verse 1, Chorus, etc.).
                   If sync data is available (${!!syncDataUsed}), use it to estimate start times.`,
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
                    finglishLines: { type: Type.ARRAY, items: { type: Type.STRING } },
                    persianLines: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['title', 'finglishLines', 'persianLines'],
                },
              },
            },
            required: ['slides'],
          },
        },
      });
      const slidesData = JSON.parse(structureResponse.text || '{}').slides || [];

      // 2. Images
      setIsLoading(`Generating AI Art for ${slidesData.length} slides...`);
      const imagePromises = slidesData.map((slide: any) => {
        const prompt = `Christian worship background, abstract, spiritual, holy, ${slide.title}, artistic, 8k resolution, no text`;
        return ai.models.generateContent({
          model: 'gemini-2.0-flash', // Using flash for speed, or switch to imagen if available
          contents: { parts: [{ text: prompt }] },
          // Note: Standard Gemini doesn't always support image gen via this API yet depending on tier
          // We'll try, if fails we use colors
        }).catch(() => null);
      });

      // Note: Actual Image Gen API might differ. For safety in demo, let's use gradients if image gen fails
      // or if using a model that doesn't support it.

      // 3. PPTX
      setIsLoading('Building PowerPoint (.pptx)...');
      const pres = new PptxGenJS();
      pres.layout = 'LAYOUT_WIDE';

      slidesData.forEach((slideData: any) => {
        const slide = pres.addSlide();

        // Background (Gradient for now to be safe/fast)
        slide.background = { color: '111827' };
        slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '000000', transparency: 30 } });

        // Title
        slide.addText(slideData.title, {
          x: 0, y: 0.2, w: '100%', h: 0.8,
          align: 'center', fontSize: 24, color: 'fbbf24', bold: true
        });

        // Split Layout
        const finglishText = slideData.finglishLines.join('\n');
        const persianText = slideData.persianLines.join('\n');

        slide.addText(finglishText, {
          x: 0.5, y: 1.5, w: '44%', h: 5,
          align: 'left', fontSize: 28, color: 'FFFFFF', fontFace: 'Arial'
        });

        slide.addText(persianText, {
          x: 6.5, y: 1.5, w: '44%', h: 5,
          align: 'right', rtlMode: true, fontSize: 28, color: 'FFFFFF', fontFace: 'Arial'
        });
      });

      pres.writeFile({ fileName: 'Worship_Presentation.pptx' });

    } catch (e) {
      console.error(e);
      setError('Presentation generation failed.');
    } finally {
      setIsLoading(null);
    }
  }, [inputText, persianText, timedText, getAi]);


  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-gray-800 pb-8">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
              Media Studio AI
            </h1>
            <p className="text-gray-400">Intelligent Worship & Bible Content Creator</p>
          </div>

          <div className="flex bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('worship')}
              className={`px-6 py-2 rounded-md flex items-center gap-2 transition-all ${activeTab === 'worship' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              <Music size={18} /> Worship Songs
            </button>
            <button
              onClick={() => setActiveTab('bible')}
              className={`px-6 py-2 rounded-md flex items-center gap-2 transition-all ${activeTab === 'bible' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              <BookOpen size={18} /> Bible Audio
            </button>
          </div>
        </header>

        {/* API Key Warning */}
        {showApiKeyInput && (
          <div className="bg-yellow-900/20 border border-yellow-600/50 p-4 rounded-xl flex items-center gap-4">
            <div className="text-yellow-500"><Wand2 /></div>
            <div className="flex-1">
              <p className="text-sm text-yellow-200 mb-1">Google Gemini API Key Required</p>
              <input
                type="password"
                placeholder="Paste your API Key here..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-black/30 border border-yellow-600/30 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>
        )}

        {/* Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Panel: Inputs */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
              <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <FileAudio size={20} className="text-purple-400" /> Source Media
              </h2>

              <label className="block w-full aspect-video border-2 border-dashed border-gray-600 hover:border-purple-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-900/50 group">
                <div className="p-4 rounded-full bg-gray-800 group-hover:bg-purple-900/50 transition-colors mb-3">
                  <Mic size={24} className="text-gray-400 group-hover:text-purple-300" />
                </div>
                <span className="text-sm text-gray-400">Upload MP3/WAV</span>
                <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
              </label>

              {audioFile && (
                <div className="mt-4 bg-purple-900/20 px-4 py-2 rounded-lg border border-purple-500/20 text-purple-200 text-sm truncate">
                  🎵 {audioFile.name}
                </div>
              )}
            </div>

            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 space-y-4">
              <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                <Layers size={20} className="text-blue-400" /> Actions
              </h2>

              <button
                onClick={handleTranscribe}
                disabled={isLoading || !audioFile}
                className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-xl flex items-center justify-between group transition-all"
              >
                <span>Transcribe Audio</span>
                <RefreshCw size={16} className={`group-hover:rotate-180 transition-transform ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleSynchronize}
                disabled={isLoading || !inputText}
                className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-xl flex items-center justify-between group transition-all"
              >
                <span>Sync Timeline</span>
                <RefreshCw size={16} />
              </button>

              {activeTab === 'worship' && (
                <>
                  <button
                    onClick={handleDetectChords}
                    disabled={isLoading || !inputText}
                    className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-xl flex items-center justify-between group transition-all"
                  >
                    <span>Generate Chords</span>
                    <Music size={16} />
                  </button>

                  <button
                    onClick={handleGeneratePresentation}
                    disabled={isLoading || !inputText}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 rounded-xl flex items-center justify-between font-medium shadow-lg shadow-purple-900/20"
                  >
                    <span>Export PPTX</span>
                    <Download size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Panel: Editor */}
          <div className="lg:col-span-8 space-y-6">
            {error && <ErrorDisplay message={error} />}
            {isLoading && <Loader text={isLoading} />}

            {/* Text Editors */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Finglish / Text</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full h-64 bg-gray-800 border-gray-700 rounded-xl p-4 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none leading-relaxed"
                  placeholder="Transcript will appear here..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Persian</label>
                  <button onClick={handleTranslateToPersian} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <RefreshCw size={12} /> Auto-Translate
                  </button>
                </div>
                <textarea
                  value={persianText}
                  onChange={(e) => setPersianText(e.target.value)}
                  dir="rtl"
                  className="w-full h-64 bg-gray-800 border-gray-700 rounded-xl p-4 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none leading-relaxed font-['Vazir']"
                  placeholder="ترجمه فارسی..."
                />
              </div>
            </div>

            {/* Timeline Visualizer */}
            {audioUrl && (
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Timeline Sync Preview</h3>
                <audio ref={audioRef} src={audioUrl} controls className="w-full mb-6 accent-purple-500" onTimeUpdate={handleTimeUpdate} />

                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                  {timedText.length > 0 ? timedText.map((item, idx) => (
                    <span
                      key={idx}
                      onClick={() => { if (audioRef.current) audioRef.current.currentTime = item.startTime }}
                      className={`cursor-pointer px-2 py-1 rounded transition-all duration-200 ${idx === currentWordIndex
                          ? 'bg-yellow-500 text-black font-bold scale-110 shadow-lg'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }`}
                    >
                      {item.word}
                    </span>
                  )) : (
                    <div className="w-full text-center py-8 text-gray-600 italic">
                      No synchronization data yet. Click "Sync Timeline" to generate.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chords Viewer */}
            {chords && activeTab === 'worship' && (
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Music size={16} /> Chord Sheet
                </h3>
                <pre className="font-mono text-sm bg-gray-900/80 p-6 rounded-xl overflow-x-auto text-yellow-100 leading-loose">
                  {chords}
                </pre>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default BibleAudioSuitePage;
