import React, { useState, useRef, useCallback } from 'react';
// import { GoogleGenAI, Type } from '@google/genai'; // No longer needed - using backend API

interface WordSegment {
  word: string;
  start_time: number;
  end_time: number;
}

interface VerseSegment {
  verse_number: number;
  text: string;
  start_time: number;
  end_time: number;
  word_segments: WordSegment[];
}

interface BibleTranscriptionResponse {
  chapter: number;
  verses: VerseSegment[];
}

interface BibleAudioSyncProps {
  audioUrl: string;
  bookName: string;
  chapter: number;
  verses: Array<{
    verse: number;
    text: string;
  }>;
  language: 'fa' | 'en';
  onTimingGenerated?: (verseSegments: VerseSegment[]) => void;
}

export const BibleAudioSync: React.FC<BibleAudioSyncProps> = ({
  audioUrl,
  bookName,
  chapter,
  verses,
  language,
  onTimingGenerated
}) => {
  const [verseSegments, setVerseSegments] = useState<VerseSegment[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentVerseIndex, setCurrentVerseIndex] = useState<number>(-1);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  const generateBibleTiming = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // Use backend API instead of direct Gemini call
      const response = await fetch('/api/gemini-timing/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioUrl,
          bookName,
          chapter,
          verses,
          language
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate timing');
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('Invalid response from timing service');
      }

      const timingData: BibleTranscriptionResponse = result.data;

      // OLD CODE - Direct Gemini call (commented out for reference)
      /*
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY not configured");
      }

      const ai = new GoogleGenAI({ apiKey });

      // Fetch audio file
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const base64Audio = await blobToBase64(blob);

      const audioPart = {
        inlineData: {
          mimeType: blob.type || 'audio/mpeg',
          data: base64Audio,
        },
      };

      const versesText = verses.map(v => `${v.verse}. ${v.text}`).join('\n');

      const prompt = `...`;

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
              chapter: { type: Type.NUMBER },
              verses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    verse_number: { type: Type.NUMBER },
                    text: { type: Type.STRING },
                    start_time: { type: Type.NUMBER },
                    end_time: { type: Type.NUMBER },
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
                  required: ['verse_number', 'text', 'start_time', 'end_time', 'word_segments']
                }
              }
            },
            required: ['chapter', 'verses']
          }
        }
      });

      const resultJson = result.text;
      const parsedResponse: BibleTranscriptionResponse = JSON.parse(resultJson);

      if (parsedResponse && parsedResponse.verses) {
        setVerseSegments(parsedResponse.verses);
        if (onTimingGenerated) {
          onTimingGenerated(parsedResponse.verses);
        }
      } else {
        throw new Error("Failed to generate valid verse segments");
      }
      */

      // Process the timing data from backend
      if (timingData && timingData.verses) {
        setVerseSegments(timingData.verses);
        if (onTimingGenerated) {
          onTimingGenerated(timingData.verses);
        }
      } else {
        throw new Error("Failed to generate valid verse segments");
      }
    } catch (e) {
      console.error('Bible timing generation error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(`${language === 'fa' ? 'خطا در تولید تایمینگ' : 'Timing generation failed'}: ${errorMessage}`);
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
    if (!audioRef.current || verseSegments.length === 0) return;
    const { currentTime } = audioRef.current;

    // Find current verse
    const newVerseIndex = verseSegments.findIndex(verse =>
      currentTime >= verse.start_time && currentTime <= verse.end_time
    );

    if (newVerseIndex !== -1) {
      if (newVerseIndex !== currentVerseIndex) {
        setCurrentVerseIndex(newVerseIndex);
      }

      // Find current word within verse
      const currentVerse = verseSegments[newVerseIndex];
      const newWordIndex = currentVerse.word_segments.findIndex(word =>
        currentTime >= word.start_time && currentTime <= word.end_time
      );

      if (newWordIndex !== -1 && newWordIndex !== currentWordIndex) {
        setCurrentWordIndex(newWordIndex);
      }
    } else {
      setCurrentVerseIndex(-1);
      setCurrentWordIndex(-1);
    }
  }, [verseSegments, currentVerseIndex, currentWordIndex]);

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/30 to-cyan-600/30 backdrop-blur-md p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold text-white mb-2" dir={language === 'fa' ? 'rtl' : 'ltr'}>
          {bookName} {language === 'fa' ? 'فصل' : 'Chapter'} {chapter}
        </h2>
        <p className="text-gray-300 text-sm">
          {language === 'fa' ? '📖 خواندن با همخوانی متن' : '📖 Synchronized Reading'}
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

      {/* Verses Display */}
      <div className="p-8 min-h-[500px] max-h-[600px] overflow-y-auto" dir={language === 'fa' ? 'rtl' : 'ltr'}>
        {isProcessing && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="animate-spin h-16 w-16 text-blue-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xl">
              {language === 'fa' ? 'در حال تولید تایمینگ با Gemini AI...' : 'Generating timing with Gemini AI...'}
            </p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
              <p className="text-red-300 mb-4">{error}</p>
              <button 
                onClick={generateBibleTiming}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
              >
                {language === 'fa' ? 'تلاش مجدد' : 'Try Again'}
              </button>
            </div>
          </div>
        )}

        {verseSegments.length > 0 && !error && (
          <div className="space-y-6">
            {verseSegments.map((verse, verseIdx) => (
              <div
                key={verse.verse_number}
                className={`
                  p-6 rounded-xl transition-all duration-300
                  ${verseIdx === currentVerseIndex
                    ? 'bg-blue-500/20 border-2 border-blue-400 shadow-lg shadow-blue-500/50 scale-105'
                    : 'bg-gray-800/30 border border-gray-700'
                  }
                `}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className={`
                    text-2xl font-bold px-3 py-1 rounded-lg
                    ${verseIdx === currentVerseIndex
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300'
                    }
                  `}>
                    {verse.verse_number}
                  </span>
                </div>
                <div className="text-xl leading-relaxed">
                  {verse.word_segments.map((word, wordIdx) => (
                    <span
                      key={wordIdx}
                      className={`
                        inline-block px-1 py-0.5 rounded transition-all duration-200
                        ${verseIdx === currentVerseIndex && wordIdx === currentWordIndex
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white scale-110 shadow-lg'
                          : verseIdx === currentVerseIndex
                          ? 'text-white'
                          : 'text-gray-400'
                        }
                      `}
                    >
                      {word.word}{' '}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isProcessing && verseSegments.length === 0 && !error && (
          <div className="space-y-4">
            {verses.map((verse) => (
              <div key={verse.verse} className="p-6 bg-gray-800/30 border border-gray-700 rounded-xl">
                <div className="flex items-start gap-4">
                  <span className="text-xl font-bold text-gray-400 bg-gray-700 px-3 py-1 rounded-lg">
                    {verse.verse}
                  </span>
                  <p className="text-lg text-gray-300 leading-relaxed flex-1">
                    {verse.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Button */}
      {verseSegments.length === 0 && !isProcessing && !error && (
        <div className="p-6 bg-gray-800/50 backdrop-blur-sm border-t border-white/10">
          <button
            onClick={generateBibleTiming}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg text-white font-semibold transition-all transform hover:scale-105 shadow-lg"
          >
            {language === 'fa' ? '🎤 فعال‌سازی خواندن همزمان' : '🎤 Enable Synchronized Reading'}
          </button>
        </div>
      )}
    </div>
  );
};

export default BibleAudioSync;
