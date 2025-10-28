import React, { useState, useCallback, useRef } from 'react';
import { generateSpeech, VoiceName, decodeBase64, decodeAudioData } from '../services/geminiTTSService';
import { useLanguage } from '../../hooks/useLanguage';

const BibleTTSPage: React.FC = () => {
  const { lang } = useLanguage();
  const [text, setText] = useState<string>("در ابتدا کلمه بود و کلمه نزد خدا بود و کلمه خدا بود.");
  const [voice, setVoice] = useState<VoiceName>(VoiceName.Zephyr);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const playAudio = useCallback(async (base64Audio: string) => {
    try {
      // Stop any existing audio
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }

      // Create or reuse AudioContext
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ 
          sampleRate: 24000 
        });
      }
      const audioContext = audioContextRef.current;

      // Decode base64 to audio data
      const decodedBytes = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(decodedBytes, audioContext, 24000, 1);

      // Create and play audio source
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();

      audioSourceRef.current = source;

      // Handle audio end
      source.onended = () => {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      };

    } catch (e) {
      console.error("Error playing audio:", e);
      setError(lang === 'fa' 
        ? "خطا در پخش صدا" 
        : "Error playing audio"
      );
    }
  }, [lang]);

  const handleGenerateSpeech = useCallback(async () => {
    if (!text.trim()) {
      setError(lang === 'fa' 
        ? "لطفاً متنی وارد کنید" 
        : "Please enter some text"
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const audioData = await generateSpeech(text, voice);
      await playAudio(audioData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(lang === 'fa' 
        ? `خطا در تولید صدا: ${errorMessage}` 
        : `Error generating speech: ${errorMessage}`
      );
    } finally {
      setIsLoading(false);
    }
  }, [text, voice, playAudio, lang]);

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
  }, []);

  const sampleTexts = [
    "در ابتدا کلمه بود و کلمه نزد خدا بود و کلمه خدا بود.",
    "خداوند شبان من است و احتیاجی ندارم",
    "زیرا خدا جهان را چنان محبت نمود که پسر یگانه خود را بخشید",
    "محبت صبور و مهربان است، محبت حسد نمی‌برد"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            {lang === 'fa' ? 'متون مقدس: تجربه صوتی' : 'Bible: Audio Experience'}
          </h1>
          <p className="text-lg text-gray-600">
            {lang === 'fa' 
              ? 'کتاب مقدس و متون را با هوش مصنوعی به کلام گفتاری تبدیل کنید' 
              : 'Convert Bible texts to speech using AI'}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {lang === 'fa' ? 'رایگان - Powered by Gemini 2.5 Flash TTS' : 'Free - Powered by Gemini 2.5 Flash TTS'}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="p-8 md:p-10 space-y-6">
            
            {/* Text Input */}
            <div>
              <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-2">
                {lang === 'fa' ? 'متن را وارد کنید' : 'Enter Text'}
              </label>
              <textarea
                id="text-input"
                rows={6}
                className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-lg"
                placeholder={lang === 'fa' ? 'متن را اینجا وارد کنید...' : 'Enter text here...'}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isLoading}
              />
              <div className="text-sm text-gray-500 mt-2">
                {text.length} {lang === 'fa' ? 'کاراکتر' : 'characters'}
              </div>
            </div>

            {/* Voice Selection */}
            <div>
              <label htmlFor="voice-select" className="block text-sm font-medium text-gray-700 mb-2">
                {lang === 'fa' ? 'انتخاب صدا' : 'Select Voice'}
              </label>
              <select
                id="voice-select"
                className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-lg"
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

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleGenerateSpeech}
                disabled={isLoading || !text.trim()}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {lang === 'fa' ? 'در حال تولید...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {lang === 'fa' ? 'تولید و پخش صدا' : 'Generate & Play'}
                  </>
                )}
              </button>

              <button
                onClick={stopAudio}
                disabled={isLoading}
                className="px-6 py-4 bg-red-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:bg-red-600 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700">
                <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-xl text-green-700">
                <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{lang === 'fa' ? 'پخش با موفقیت انجام شد' : 'Playback completed successfully'}</span>
              </div>
            )}

            {/* Sample Texts */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {lang === 'fa' ? '📝 نمونه متن‌ها' : '📝 Sample Texts'}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {sampleTexts.map((sample, index) => (
                  <button
                    key={index}
                    onClick={() => setText(sample)}
                    className="p-4 text-right bg-gray-50 hover:bg-purple-50 border-2 border-gray-200 hover:border-purple-300 rounded-xl transition-all duration-200 text-gray-700 hover:text-purple-700"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {lang === 'fa' ? 'کاملاً رایگان' : 'Completely Free'}
            </h3>
            <p className="text-gray-600">
              {lang === 'fa' ? 'بدون هیچ هزینه‌ای از Gemini 2.5 Flash TTS استفاده کنید' : 'Use Gemini 2.5 Flash TTS with no cost'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 7H7v6h6V7z" />
                <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {lang === 'fa' ? 'کیفیت بالا' : 'High Quality'}
            </h3>
            <p className="text-gray-600">
              {lang === 'fa' ? 'صدای طبیعی و با کیفیت با فناوری Gemini' : 'Natural, high-quality voice with Gemini technology'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {lang === 'fa' ? 'سرعت بالا' : 'Fast Processing'}
            </h3>
            <p className="text-gray-600">
              {lang === 'fa' ? 'تولید سریع صدا در کمتر از چند ثانیه' : 'Generate speech in seconds'}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BibleTTSPage;
