import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { useLanguage } from '@/hooks/useLanguage';

interface WordSegment {
  word: string;
  start_time: number;
  end_time: number;
}

interface TranscriptionResponse {
  transcript: string;
  word_segments: WordSegment[];
}

interface WorshipAudioSyncProps {
  audioUrl: string;
  lyrics?: {
    fa?: string;
    en?: string;
  };
  title?: {
    fa?: string;
    en?: string;
  };
  onTimingGenerated?: (wordSegments: WordSegment[]) => void;
}

export const WorshipAudioSync: React.FC<WorshipAudioSyncProps> = ({
  audioUrl,
  lyrics,
  title,
  onTimingGenerated
}) => {
  const { lang } = useLanguage();
  const [wordSegments, setWordSegments] = useState<WordSegment[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Auto-generate timing if lyrics exist but no word segments
  useEffect(() => {
    if (lyrics && wordSegments.length === 0 && !isProcessing) {
      const currentLyrics = lang === 'fa' ? lyrics.fa : lyrics.en;
      if (currentLyrics) {
        generateTimingFromLyrics(currentLyrics);
      }
    }
  }, [lyrics, lang]);

  const generateTimingFromLyrics = async (lyricsText: string) => {
    setIsProcessing(true);
    setError('');

    try {
      // Check if GEMINI_API_KEY is available
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY not configured");
      }

      const ai = new GoogleGenAI({ apiKey });

      // Fetch audio file and convert to base64
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const base64Audio = await blobToBase64(blob);

      const audioPart = {
        inlineData: {
          mimeType: blob.type || 'audio/mpeg',
          data: base64Audio,
        },
      };

      const prompt = `You are an expert audio-to-text synchronization tool. 
      
The audio contains this song with these lyrics:
${lyricsText}

Your task is to:
1. Listen to the audio carefully
2. Generate word-level timestamps for EACH word in the lyrics
3. Match the timing precisely with when each word is sung

Output must be structured JSON with word segments.`;

      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: [
          { parts: [audioPart, { text: prompt }] }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: { type: Type.STRING },
              word_segments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    start_time: { type: Type.NUMBER },
                    end_time: { type: Type.NUMBER },
                  },
                  required: ['word', 'start_time', 'end_time']
                }
              }
            },
            required: ['transcript', 'word_segments']
          }
        }
      });

      const resultJson = result.text;
      const parsedResponse: TranscriptionResponse = JSON.parse(resultJson);

      if (parsedResponse && parsedResponse.word_segments) {
        setWordSegments(parsedResponse.word_segments);
        if (onTimingGenerated) {
          onTimingGenerated(parsedResponse.word_segments);
        }
      } else {
        throw new Error("Failed to generate valid word segments");
      }
    } catch (e) {
      console.error('Timing generation error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(`${lang === 'fa' ? 'خطا در تولید تایمینگ' : 'Timing generation failed'}: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current || wordSegments.length === 0) return;
    const { currentTime } = audioRef.current;

    const newWordIndex = wordSegments.findIndex(segment =>
      currentTime >= segment.start_time && currentTime <= segment.end_time
    );

    if (newWordIndex !== -1 && newWordIndex !== currentWordIndex) {
      setCurrentWordIndex(newWordIndex);
    }
  }, [wordSegments, currentWordIndex]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const currentTitle = lang === 'fa' ? title?.fa : title?.en;
  const currentLyrics = lang === 'fa' ? lyrics?.fa : lyrics?.en;

  return (
    <div className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-md p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold text-white mb-2">
          {currentTitle || (lang === 'fa' ? 'سرود پرستشی' : 'Worship Song')}
        </h2>
        <p className="text-gray-300 text-sm">
          {lang === 'fa' ? '🎵 همخوانی کلمات با موزیک' : '🎵 Synchronized Lyrics'}
        </p>
      </div>

      {/* Audio Player */}
      <div className="p-6 bg-gray-800/50 backdrop-blur-sm border-b border-white/10">
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full"
          controls
        />
      </div>

      {/* Lyrics Display */}
      <div className="p-8 min-h-[400px] overflow-y-auto" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
        {isProcessing && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="animate-spin h-16 w-16 text-purple-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xl">
              {lang === 'fa' ? 'در حال تولید تایمینگ با Gemini AI...' : 'Generating timing with Gemini AI...'}
            </p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
              <p className="text-red-300 mb-4">{error}</p>
              <button 
                onClick={() => currentLyrics && generateTimingFromLyrics(currentLyrics)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
              >
                {lang === 'fa' ? 'تلاش مجدد' : 'Try Again'}
              </button>
            </div>
          </div>
        )}

        {wordSegments.length > 0 && !error && (
          <div className="text-2xl leading-relaxed font-sans">
            {wordSegments.map((segment, index) => (
              <span
                key={index}
                className={`
                  inline-block px-1 py-0.5 rounded transition-all duration-200
                  ${index === currentWordIndex 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-110 shadow-lg' 
                    : 'text-gray-300 hover:text-white'
                  }
                `}
              >
                {segment.word}{' '}
              </span>
            ))}
          </div>
        )}

        {!isProcessing && wordSegments.length === 0 && !error && currentLyrics && (
          <div className="text-xl leading-relaxed text-gray-300 whitespace-pre-line">
            {currentLyrics}
          </div>
        )}

        {!currentLyrics && !isProcessing && (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg">
              {lang === 'fa' ? 'متن سرود موجود نیست' : 'Lyrics not available'}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {currentLyrics && wordSegments.length === 0 && !isProcessing && !error && (
        <div className="p-6 bg-gray-800/50 backdrop-blur-sm border-t border-white/10">
          <button
            onClick={() => generateTimingFromLyrics(currentLyrics)}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-semibold transition-all transform hover:scale-105 shadow-lg"
          >
            {lang === 'fa' ? '🎤 فعال‌سازی حالت Karaoke' : '🎤 Enable Karaoke Mode'}
          </button>
        </div>
      )}
    </div>
  );
};

export default WorshipAudioSync;
