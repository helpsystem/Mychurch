import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';

interface WordSegment {
  word: string;
  start: number;
  end: number;
}

interface TimingLine {
  line: string;
  start: number;
  end: number;
  words: WordSegment[];
}

interface TimingData {
  metadata: {
    title: string;
    artist?: string;
    totalDuration: number;
    wordCount: number;
    chords?: string | null;
  };
  lines: TimingLine[];
}

type Status = 'idle' | 'uploading' | 'transcribing' | 'detecting_chords' | 'exporting' | 'done' | 'error';

const STATUS_MESSAGES: Record<Status, string> = {
  idle: 'فایل صوتی را اینجا بکشید یا کلیک کنید',
  uploading: 'در حال آپلود فایل...',
  transcribing: 'در حال تبدیل صدا به متن با AI...',
  detecting_chords: 'تشخیص آکوردهای موسیقی...',
  exporting: 'در حال ساخت PowerPoint...',
  done: 'پردازش کامل شد ✅',
  error: 'خطا رخ داد ❌'
};

interface AdvancedAudioSyncProps {
  songId?: number;
  songTitle?: string;
  songArtist?: string;
  audioUrl?: string; // If already uploaded
  onTimingGenerated?: (timingData: TimingData) => void;
  lang?: 'fa' | 'en';
}

/**
 * 🎵 Advanced Audio Sync Component
 * Based on: https://github.com/helpsystem/Audio-Text-Sync-Highlight
 * 
 * Features:
 * - Upload audio file
 * - AI transcription with word-level timestamps (Gemini 2.5 Flash)
 * - Chord detection
 * - Real-time sync highlighting
 * - PowerPoint export (.ppsx)
 * - Download transcript
 */
const AdvancedAudioSync: React.FC<AdvancedAudioSyncProps> = ({
  songId,
  songTitle,
  songArtist,
  audioUrl: initialAudioUrl,
  onTimingGenerated,
  lang = 'fa'
}) => {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null);
  const [timingData, setTimingData] = useState<TimingData | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [chords, setChords] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  const resetState = useCallback(() => {
    setStatus('idle');
    setError(null);
    setFile(null);
    if (audioUrl && !initialAudioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(initialAudioUrl || null);
    setTimingData(null);
    setTranscript('');
    setChords(null);
    setCurrentTime(0);
    setUploadProgress(0);
  }, [audioUrl, initialAudioUrl]);

  const processAudioFile = async (audioFile: File) => {
    try {
      setStatus('uploading');
      setError(null);

      const formData = new FormData();
      formData.append('audio', audioFile);
      if (songId) formData.append('songId', songId.toString());
      if (songTitle) formData.append('title', songTitle);
      if (songArtist) formData.append('artist', songArtist);

      setStatus('transcribing');

      const response = await axios.post('/api/audio-sync-advanced/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(percentCompleted);
        }
      });

      if (response.data.success) {
        const { timingData: timing, transcript: trans, chords: detectedChords } = response.data.data;
        
        setTimingData(timing);
        setTranscript(trans);
        setChords(detectedChords);
        setStatus('done');

        if (onTimingGenerated) {
          onTimingGenerated(timing);
        }

        console.log('✅ Timing generated successfully');
      } else {
        throw new Error(response.data.error || 'Failed to process audio');
      }

    } catch (err: any) {
      console.error('❌ Audio processing error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      setError(`خطا در پردازش فایل: ${errorMessage}`);
      setStatus('error');
    }
  };

  const handleFile = useCallback(async (selectedFile: File) => {
    if (!selectedFile.type.startsWith('audio/')) {
      setError('لطفاً فقط فایل صوتی آپلود کنید');
      setStatus('error');
      return;
    }

    resetState();
    setFile(selectedFile);
    setAudioUrl(URL.createObjectURL(selectedFile));
    
    await processAudioFile(selectedFile);
  }, [resetState]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-teal-400');
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('border-teal-400');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-teal-400');
  };

  const handleDownloadTranscript = () => {
    if (!transcript) return;
    
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${songTitle || file?.name.split('.')[0] || 'transcript'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTiming = () => {
    if (!timingData) return;
    
    const blob = new Blob([JSON.stringify(timingData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `song_${songId || 'timing'}_timing.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Sync audio time with transcript highlighting
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const timeUpdate = () => setCurrentTime(audio.currentTime);
    audio.addEventListener('timeupdate', timeUpdate);
    
    return () => audio.removeEventListener('timeupdate', timeUpdate);
  }, [audioUrl, status]);

  // Auto-scroll to active word
  useEffect(() => {
    if (!timingData || !transcriptContainerRef.current) return;

    // Find active line
    const activeLineIndex = timingData.lines.findIndex(
      line => currentTime >= line.start && currentTime < line.end
    );

    if (activeLineIndex !== -1) {
      const container = transcriptContainerRef.current;
      const activeLineElement = container.querySelector(
        `[data-line-index="${activeLineIndex}"]`
      ) as HTMLElement;

      if (activeLineElement) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = activeLineElement.getBoundingClientRect();

        if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
          activeLineElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }
  }, [currentTime, timingData]);

  const renderTranscript = () => {
    if (!timingData) return null;

    return (
      <div className="space-y-2">
        {timingData.lines.map((line, lineIndex) => {
          const isActiveLine = currentTime >= line.start && currentTime < line.end;
          
          return (
            <div
              key={lineIndex}
              data-line-index={lineIndex}
              className={`p-3 rounded-lg transition-all duration-200 ${
                isActiveLine ? 'bg-teal-900/50 scale-105' : 'bg-transparent'
              }`}
            >
              <p className="text-lg leading-relaxed" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                {line.words.map((word, wordIndex) => {
                  const isActiveWord = currentTime >= word.start && currentTime < word.end;
                  
                  return (
                    <span
                      key={wordIndex}
                      className={`transition-colors duration-150 ${
                        isActiveWord 
                          ? 'text-teal-300 font-bold text-xl' 
                          : 'text-gray-300'
                      }`}
                    >
                      {word.word}{' '}
                    </span>
                  );
                })}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  const renderContent = () => {
    if (status === 'idle' || (status === 'error' && !file)) {
      return (
        <div
          className="relative border-2 border-dashed border-gray-600 rounded-lg p-12 text-center cursor-pointer transition-colors hover:border-teal-500 bg-gray-800/50"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
        >
          <input
            type="file"
            ref={inputRef}
            onChange={handleFileChange}
            accept="audio/*"
            className="hidden"
          />
          <div className="text-6xl mb-4">🎵</div>
          <p className="text-gray-400 text-lg">{STATUS_MESSAGES['idle']}</p>
          {error && <p className="mt-4 text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</p>}
        </div>
      );
    }

    if (status !== 'done' && status !== 'error') {
      return (
        <div className="text-center p-12">
          <div className="w-16 h-16 border-4 border-t-transparent border-teal-400 rounded-full animate-spin mx-auto"></div>
          <p className="mt-6 text-xl text-gray-300">{STATUS_MESSAGES[status]}</p>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-4 w-full max-w-xs mx-auto">
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-teal-400 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="mt-2 text-sm text-gray-400">{uploadProgress}%</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        {error && (
          <div className="mb-4 text-center text-red-400 bg-red-900/50 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-3 justify-center">
          <button
            onClick={resetState}
            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            🔄 فایل جدید
          </button>
          <button
            onClick={handleDownloadTranscript}
            disabled={!transcript}
            className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            📥 دانلود متن
          </button>
          <button
            onClick={handleDownloadTiming}
            disabled={!timingData}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            💾 دانلود Timing
          </button>
        </div>

        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            controls
            className="w-full mb-6 rounded-lg"
            style={{ height: '54px' }}
          />
        )}

        <div
          ref={transcriptContainerRef}
          className="p-6 bg-gray-900/70 rounded-lg max-h-96 overflow-y-auto mb-6"
          dir={lang === 'fa' ? 'rtl' : 'ltr'}
        >
          {renderTranscript()}
        </div>

        {chords && (
          <div className="p-6 bg-gray-900/70 rounded-lg">
            <h3 className="font-bold text-teal-400 text-xl mb-3">
              🎸 آکوردهای تشخیص داده شده
            </h3>
            <p className="text-gray-300 whitespace-pre-wrap font-mono text-lg">
              {chords}
            </p>
          </div>
        )}

        {timingData && (
          <div className="mt-6 p-6 bg-blue-900/30 rounded-lg border border-blue-500/50">
            <h3 className="font-bold text-blue-300 text-lg mb-2">📊 اطلاعات Timing</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">تعداد کلمات:</span>
                <span className="text-white font-bold ml-2">{timingData.metadata.wordCount}</span>
              </div>
              <div>
                <span className="text-gray-400">تعداد خطوط:</span>
                <span className="text-white font-bold ml-2">{timingData.lines.length}</span>
              </div>
              <div>
                <span className="text-gray-400">مدت زمان:</span>
                <span className="text-white font-bold ml-2">{timingData.metadata.totalDuration}s</span>
              </div>
              <div>
                <span className="text-gray-400">روش تولید:</span>
                <span className="text-white font-bold ml-2">AI (Gemini)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl p-8 shadow-2xl">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
          🎵 Audio Sync با هوش مصنوعی
        </h2>
        <p className="mt-2 text-gray-400">
          تولید خودکار timing دقیق با Gemini AI
        </p>
      </div>

      {renderContent()}
    </div>
  );
};

export default AdvancedAudioSync;
