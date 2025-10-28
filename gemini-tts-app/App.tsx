
import React, { useState, useCallback, useRef } from 'react';
import { generateSpeech } from './services/geminiService';
import { VoiceName } from './types';
import { decode, decodeAudioData } from './utils/audio';
import { BookOpenIcon, SoundWaveIcon, AlertTriangleIcon, SpinnerIcon } from './components/icons';

const App: React.FC = () => {
  const [text, setText] = useState<string>("در ابتدا کلمه بود و کلمه نزد خدا بود و کلمه خدا بود.");
  const [voice, setVoice] = useState<VoiceName>(VoiceName.Zephyr);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const playAudio = useCallback(async (base64Audio: string) => {
    try {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
      
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioContext = audioContextRef.current;
      
      const decodedBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(decodedBytes, audioContext, 24000, 1);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
      
      audioSourceRef.current = source;
    } catch (e) {
      console.error("Error playing audio:", e);
      setError("پخش صدای تولید شده امکان‌پذیر نبود.");
    }
  }, []);

  const handleGenerateSpeech = useCallback(async () => {
    if (!text.trim()) {
      setError("لطفاً برای تولید گفتار، متنی را وارد کنید.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedAudio(null);

    try {
      const audioData = await generateSpeech(text, voice);
      setGeneratedAudio(audioData);
      await playAudio(audioData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`تولید گفتار با خطا مواجه شد: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [text, voice, playAudio]);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans flex items-center justify-center p-4">
      <main className="w-full max-w-2xl mx-auto">
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-stone-200">
          <header className="p-6 md:p-8 border-b border-stone-200 bg-stone-100">
            <div className="flex items-center space-x-4 space-x-reverse">
              <BookOpenIcon className="w-10 h-10 text-amber-700" />
              <div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
                  متون مقدس: تجربه صوتی
                </h1>
                <p className="text-stone-600 mt-1">
                  کتاب مقدس و متون را با هوش مصنوعی به کلام گفتاری تبدیل کنید.
                </p>
              </div>
            </div>
          </header>

          <div className="p-6 md:p-8 space-y-6">
            <div>
              <label htmlFor="text-input" className="block text-sm font-medium text-stone-700 mb-2">
                متن را وارد کنید
              </label>
              <textarea
                id="text-input"
                rows={6}
                className="w-full p-4 border border-stone-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
                placeholder="متن را اینجا وارد کنید..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="voice-select" className="block text-sm font-medium text-stone-700 mb-2">
                انتخاب صدا
              </label>
              <select
                id="voice-select"
                className="w-full p-4 border border-stone-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200 bg-white"
                value={voice}
                onChange={(e) => setVoice(e.target.value as VoiceName)}
                disabled={isLoading}
              >
                {Object.values(VoiceName).map((voiceName) => (
                  <option key={voiceName} value={voiceName}>
                    {voiceName}
                  </option>
                ))}
              </select>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-start space-x-3 space-x-reverse">
                <AlertTriangleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold">خطا</h3>
                    <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleGenerateSpeech}
                disabled={isLoading}
                className="w-full flex-1 inline-flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-stone-400 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <SpinnerIcon className="animate-spin -mr-1 ml-3 h-5 w-5 text-white" />
                    در حال ساخت...
                  </>
                ) : (
                  <>
                    <SoundWaveIcon className="-mr-1 ml-2 h-5 w-5" />
                    تولید گفتار
                  </>
                )}
              </button>
              {generatedAudio && !isLoading && (
                  <button
                    onClick={() => playAudio(generatedAudio)}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 border border-stone-300 text-base font-medium rounded-lg shadow-sm text-stone-700 bg-white hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200"
                  >
                    دوباره گوش دهید
                  </button>
              )}
            </div>

          </div>
        </div>
        <footer className="text-center mt-6 text-sm text-stone-500">
          <p>طراحی شده توسط Google Gemini. طراحی UI/UX توسط مهندس ارشد فرانت‌اند در سطح جهانی.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
