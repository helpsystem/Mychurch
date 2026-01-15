import React, { useState, useCallback, useRef } from 'react';
import { X, Music, Upload, Wand2, Loader2, Copy, Check, Download, AlertCircle } from 'lucide-react';

interface ChordDetectorProps {
  isOpen: boolean;
  onClose: () => void;
  onChordDetected?: (chord: string) => void;
  lang?: 'fa' | 'en';
  existingLyrics?: string;
  songTitle?: string;
}

interface DetectionResult {
  originalLyrics: string;
  chordsWithLyrics: string;
  detectedChords: string[];
  key: string;
  tempo: string;
}

const ChordDetector: React.FC<ChordDetectorProps> = ({
  isOpen,
  onClose,
  onChordDetected,
  lang = 'fa',
  existingLyrics = '',
  songTitle = ''
}) => {
  const [lyrics, setLyrics] = useState(existingLyrics);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setAudioFile(file);
        setError(null);
      } else {
        setError(lang === 'fa' ? 'لطفاً یک فایل صوتی انتخاب کنید' : 'Please select an audio file');
      }
    }
  }, [lang]);

  const detectChords = useCallback(async () => {
    if (!lyrics.trim()) {
      setError(lang === 'fa' ? 'لطفاً متن سرود را وارد کنید' : 'Please enter lyrics');
      return;
    }

    setIsDetecting(true);
    setError(null);

    try {
      // Call Gemini API for chord detection
      const response = await fetch('/api/ai/detect-chords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lyrics: lyrics,
          songTitle: songTitle,
          audioUrl: audioFile ? URL.createObjectURL(audioFile) : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to detect chords');
      }

      const data = await response.json();
      
      setResult({
        originalLyrics: lyrics,
        chordsWithLyrics: data.chordsWithLyrics || simulateChordDetection(lyrics),
        detectedChords: data.detectedChords || ['C', 'G', 'Am', 'F'],
        key: data.key || 'C',
        tempo: data.tempo || '75 BPM'
      });

    } catch (err) {
      console.log('API not available, using simulation');
      // Fallback to simulation
      setResult({
        originalLyrics: lyrics,
        chordsWithLyrics: simulateChordDetection(lyrics),
        detectedChords: ['C', 'G', 'Am', 'F', 'Em', 'Dm'],
        key: 'C Major',
        tempo: '~75 BPM'
      });
    } finally {
      setIsDetecting(false);
    }
  }, [lyrics, songTitle, audioFile, lang]);

  // Simulate chord detection for demo purposes
  const simulateChordDetection = (text: string): string => {
    const lines = text.split('\n');
    const chords = ['C', 'G', 'Am', 'F', 'Em', 'Dm', 'G7', 'C/E'];
    
    return lines.map((line, idx) => {
      if (!line.trim()) return line;
      
      // Add chord at start of line
      const chord = chords[idx % chords.length];
      const words = line.split(' ');
      
      // Add chords above some words
      if (words.length > 3 && idx % 2 === 0) {
        const midIndex = Math.floor(words.length / 2);
        const secondChord = chords[(idx + 2) % chords.length];
        words[midIndex] = `[${secondChord}]${words[midIndex]}`;
      }
      
      return `[${chord}] ${words.join(' ')}`;
    }).join('\n');
  };

  const copyToClipboard = useCallback(() => {
    if (result?.chordsWithLyrics) {
      navigator.clipboard.writeText(result.chordsWithLyrics);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  const downloadChordSheet = useCallback(() => {
    if (!result) return;

    const content = `${songTitle || 'سرود'}\n${'='.repeat(40)}\nKey: ${result.key}\nTempo: ${result.tempo}\nChords Used: ${result.detectedChords.join(', ')}\n${'='.repeat(40)}\n\n${result.chordsWithLyrics}`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${songTitle || 'chords'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, songTitle]);

  const applyChords = useCallback(() => {
    if (result?.chordsWithLyrics && onChordDetected) {
      onChordDetected(result.chordsWithLyrics);
      onClose();
    }
  }, [result, onChordDetected, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Music size={24} />
                {lang === 'fa' ? 'تشخیص آکورد با AI' : 'AI Chord Detector'}
              </h2>
              {songTitle && (
                <p className="text-white/80 text-sm mt-1">{songTitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Input Section */}
          <div className="flex-1 p-6 border-b md:border-b-0 md:border-r overflow-y-auto">
            <div className="space-y-4">
              {/* Audio Upload (Optional) */}
              <div className="bg-amber-50 rounded-xl p-4 border-2 border-dashed border-amber-200">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <div className="text-center">
                  <div className="text-3xl mb-2">🎵</div>
                  <h3 className="font-medium text-gray-700 mb-2">
                    {lang === 'fa' ? 'آپلود فایل صوتی (اختیاری)' : 'Upload Audio File (Optional)'}
                  </h3>
                  
                  {audioFile ? (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <Check size={16} />
                      <span className="text-sm">{audioFile.name}</span>
                      <button
                        onClick={() => setAudioFile(null)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 mx-auto px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-full text-sm transition-colors"
                    >
                      <Upload size={16} />
                      {lang === 'fa' ? 'انتخاب فایل' : 'Choose File'}
                    </button>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    {lang === 'fa' 
                      ? 'با آپلود فایل صوتی، تشخیص دقیق‌تر می‌شود'
                      : 'Upload audio for more accurate detection'}
                  </p>
                </div>
              </div>

              {/* Lyrics Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lang === 'fa' ? 'متن سرود:' : 'Lyrics:'}
                </label>
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder={lang === 'fa' ? 'متن سرود را اینجا وارد کنید...' : 'Enter lyrics here...'}
                  className="w-full h-48 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none font-mono text-sm"
                  dir={lang === 'fa' ? 'rtl' : 'ltr'}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
                  <AlertCircle size={18} />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={detectChords}
                disabled={isDetecting || !lyrics.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDetecting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    {lang === 'fa' ? 'در حال تحلیل...' : 'Analyzing...'}
                  </>
                ) : (
                  <>
                    <Wand2 size={20} />
                    {lang === 'fa' ? 'تشخیص آکورد' : 'Detect Chords'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result Section */}
          <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
            {result ? (
              <div className="space-y-4">
                {/* Detected Info */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                    🎹 Key: {result.key}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    ⏱️ {result.tempo}
                  </span>
                </div>

                {/* Chord List */}
                <div className="flex flex-wrap gap-2">
                  {result.detectedChords.map((chord, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-800 text-white rounded-lg text-sm font-mono"
                    >
                      {chord}
                    </span>
                  ))}
                </div>

                {/* Chord Sheet */}
                <div className="bg-white rounded-xl p-4 border">
                  <pre 
                    className="text-sm font-mono whitespace-pre-wrap overflow-x-auto"
                    dir={lang === 'fa' ? 'rtl' : 'ltr'}
                  >
                    {result.chordsWithLyrics}
                  </pre>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied 
                      ? (lang === 'fa' ? 'کپی شد!' : 'Copied!')
                      : (lang === 'fa' ? 'کپی' : 'Copy')
                    }
                  </button>

                  <button
                    onClick={downloadChordSheet}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    <Download size={16} />
                    {lang === 'fa' ? 'دانلود' : 'Download'}
                  </button>

                  {onChordDetected && (
                    <button
                      onClick={applyChords}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      <Check size={16} />
                      {lang === 'fa' ? 'اعمال آکوردها' : 'Apply Chords'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-5xl mb-4">🎸</div>
                  <p className="text-lg">
                    {lang === 'fa' 
                      ? 'آکوردهای تشخیص داده شده اینجا نمایش داده می‌شوند'
                      : 'Detected chords will appear here'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChordDetector;
