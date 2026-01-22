import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import {
  Upload, Music, BookOpen, FileText, Languages, Palette, Download,
  Presentation, Mic, Play, Pause, RotateCcw, Loader2, Volume2,
  ChevronDown, ChevronUp, Music2, Settings
} from 'lucide-react';

// Types
type WordSegment = {
  word: string;
  start_time: number;
  end_time: number;
};

type LineType = 'book_title' | 'chapter_title' | 'verse' | 'text' | 'lyric';

type LineSegment = {
  type: LineType;
  label?: string;
  content: string;
  words: WordSegment[];
};

type TranscriptData = {
  lines: LineSegment[];
  fullTranscript: string;
};

type Status = 'idle' | 'reading' | 'transcribing' | 'detecting_chords' | 'exporting' | 'done' | 'error';
type Mode = 'speech' | 'song';
type TranslationTarget = 'persian' | 'english' | 'finglish';

const STATUS_MESSAGES: Record<Status, { fa: string; en: string }> = {
  idle: { fa: 'فایل صوتی را بکشید و رها کنید یا کلیک کنید', en: 'Drop an audio file or click to upload' },
  reading: { fa: 'در حال خواندن فایل...', en: 'Reading file...' },
  transcribing: { fa: 'در حال استخراج متن و ساختار صوتی...', en: 'Transcribing and structuring audio...' },
  detecting_chords: { fa: 'در حال تشخیص آکوردهای موسیقی...', en: 'Analyzing for musical chords...' },
  exporting: { fa: 'در حال ساخت ارائه (اسلاید + تصاویر)...', en: 'Generating presentation (Slides + Images)...' },
  done: { fa: 'پردازش کامل شد.', en: 'Processing complete.' },
  error: { fa: 'خطایی رخ داد.', en: 'An error occurred.' },
};

const AdminAudioProcessorPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const isRtl = lang === 'fa';

  // Core state
  const [status, setStatus] = useState<Status>('idle');
  const [mode, setMode] = useState<Mode>('song');
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
  const [chords, setChords] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);

  // Translation state
  const [translations, setTranslations] = useState<{
    persian: string[] | null;
    english: string[] | null;
    finglish: string[] | null;
  }>({ persian: null, english: null, finglish: null });
  const [activeTab, setActiveTab] = useState<TranslationTarget>('persian');
  const [isTranslating, setIsTranslating] = useState(false);

  // TTS state
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<string | false>(false);
  const [generatedAudioUrls, setGeneratedAudioUrls] = useState<{
    original: string | null;
    persian: string | null;
    english: string | null;
    finglish: string | null;
  }>({ original: null, persian: null, english: null, finglish: null });

  // Appearance state
  const [showAppearance, setShowAppearance] = useState(false);
  const [wordHighlightColor, setWordHighlightColor] = useState('#2dd4bf');
  const [lineHighlightColor, setLineHighlightColor] = useState('#1e293b');

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const translationContainerRef = useRef<HTMLDivElement>(null);

  // Reset state
  const resetState = useCallback(() => {
    setStatus('idle');
    setError(null);
    setFile(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setTranscriptData(null);
    setChords(null);
    setCurrentTime(0);
    setExportProgress(0);
    setTotalSlides(0);
    setTranslations({ persian: null, english: null, finglish: null });
    setIsTranslating(false);
    setIsGeneratingAudio(false);
    Object.values(generatedAudioUrls).forEach(url => {
      if (typeof url === 'string') URL.revokeObjectURL(url);
    });
    setGeneratedAudioUrls({ original: null, persian: null, english: null, finglish: null });
  }, [audioUrl, generatedAudioUrls]);

  // Transcribe audio via API
  const transcribeAudio = async (audioFile: File, selectedMode: Mode) => {
    try {
      setStatus('transcribing');

      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('mode', selectedMode);

      const response = await fetch('/api/audio-processor/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      const fullTranscript = data.lines.map((l: LineSegment) => l.content).join('\n');
      const finalData: TranscriptData = {
        lines: data.lines,
        fullTranscript,
      };

      setTranscriptData(finalData);
      return finalData;
    } catch (err) {
      console.error('Transcription error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`خطا در استخراج متن: ${errorMessage}`);
      setStatus('error');
      return null;
    }
  };

  // Detect chords
  const detectChords = async (audioFile: File, transcript: string) => {
    try {
      setStatus('detecting_chords');

      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('transcript', transcript);

      const response = await fetch('/api/audio-processor/detect-chords', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.chords && data.chords.toLowerCase() !== 'none') {
          setChords(data.chords);
        }
      }
    } catch (err) {
      console.error('Chord detection error:', err);
    }
  };

  // Handle file
  const handleFile = useCallback(async (selectedFile: File) => {
    if (!selectedFile.type.startsWith('audio/')) {
      setError(lang === 'fa' ? 'فرمت فایل نامعتبر است. لطفاً یک فایل صوتی آپلود کنید.' : 'Invalid file type. Please upload an audio file.');
      setStatus('error');
      return;
    }

    setStatus('reading');
    setFile(selectedFile);
    setAudioUrl(URL.createObjectURL(selectedFile));

    const transcription = await transcribeAudio(selectedFile, mode);

    if (transcription) {
      if (mode === 'song') {
        await detectChords(selectedFile, transcription.fullTranscript);
      }
      setStatus('done');
    }
  }, [mode, lang]);

  // Handlers
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

  // Download functions
  const handleDownloadTranscript = () => {
    if (!transcriptData) return;
    const blob = new Blob([transcriptData.fullTranscript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.split('.')[0]}_transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadProjectJSON = () => {
    if (!transcriptData) return;

    const mergedLines = transcriptData.lines.map((line, index) => ({
      ...line,
      translations: {
        persian: translations.persian?.[index] || null,
        english: translations.english?.[index] || null,
        finglish: translations.finglish?.[index] || null
      }
    }));

    const dataToSave = {
      metadata: {
        filename: file?.name,
        generated_at: new Date().toISOString(),
        mode: mode,
        type: 'project_full'
      },
      structure: mergedLines
    };

    const jsonContent = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.split('.')[0]}_full_project.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSpecificJSON = (target: 'original' | 'persian' | 'english' | 'finglish') => {
    if (!transcriptData) return;

    let linesToSave = [];

    if (target === 'original') {
      linesToSave = transcriptData.lines;
    } else {
      const translatedLines = translations[target];
      if (!translatedLines) {
        alert(`No ${target} translation available to download.`);
        return;
      }
      linesToSave = transcriptData.lines.map((line, index) => ({
        content: translatedLines[index],
        start_time: line.words[0]?.start_time || 0,
        end_time: line.words[line.words.length - 1]?.end_time || 0,
        type: line.type,
        label: line.label
      }));
    }

    const dataToSave = {
      metadata: {
        filename: file?.name,
        language: target,
        generated_at: new Date().toISOString(),
        mode: mode,
        type: 'single_language_timing'
      },
      lines: linesToSave
    };

    const jsonContent = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.split('.')[0]}_${target}_timing.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export to PowerPoint
  const handleExportToPowerPoint = async () => {
    if (!transcriptData || !file || !audioUrl) return;
    setStatus('exporting');
    setExportProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('transcript', JSON.stringify(transcriptData));
      formData.append('mode', mode);

      const response = await fetch('/api/audio-processor/export-pptx', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.split('.')[0]}_${mode}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus('done');
    } catch (err) {
      console.error('PowerPoint Export Error:', err);
      setError(lang === 'fa' ? 'خطا در ساخت پاورپوینت' : 'Failed to generate PowerPoint');
      setStatus('error');
    } finally {
      setExportProgress(0);
      setTotalSlides(0);
    }
  };

  // Translate
  const handleTranslate = async (target: TranslationTarget) => {
    if (!transcriptData) return;
    setIsTranslating(true);
    setError(null);
    setActiveTab(target);

    try {
      const response = await fetch('/api/audio-processor/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: transcriptData.lines.map(l => l.content),
          target
        }),
      });

      if (!response.ok) throw new Error('Translation failed');

      const data = await response.json();
      if (data.translated_lines && Array.isArray(data.translated_lines)) {
        setTranslations(prev => ({ ...prev, [target]: data.translated_lines }));
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError(lang === 'fa' ? 'خطا در ترجمه' : 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  // Generate TTS
  const handleGenerateAudio = async (sourceKey: 'original' | 'persian' | 'english' | 'finglish') => {
    let textToSpeak = '';

    if (sourceKey === 'original') {
      textToSpeak = transcriptData?.fullTranscript || '';
    } else {
      const lines = translations[sourceKey as TranslationTarget];
      textToSpeak = lines ? lines.join('\n') : '';
    }

    if (!textToSpeak) return;

    setIsGeneratingAudio(sourceKey);
    setError(null);

    try {
      const response = await fetch('/api/audio-processor/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, language: sourceKey }),
      });

      if (!response.ok) throw new Error('TTS failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setGeneratedAudioUrls(prev => ({ ...prev, [sourceKey]: url }));
    } catch (err) {
      console.error('TTS error:', err);
      setError(lang === 'fa' ? 'خطا در تولید صدا' : 'Failed to generate audio');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Audio time tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let animationFrameId: number;

    const loop = () => {
      setCurrentTime(audio.currentTime);
      if (!audio.paused && !audio.ended) {
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    const onPlay = () => loop();
    const onPause = () => cancelAnimationFrame(animationFrameId);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onPause);
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onPause);
      cancelAnimationFrame(animationFrameId);
    };
  }, [audioUrl, status]);

  // Auto-scroll for transcript
  useEffect(() => {
    if (!transcriptData || !transcriptContainerRef.current) return;
    const activeLineIndex = transcriptData.lines.findIndex(line => {
      const start = line.words[0]?.start_time;
      const end = line.words[line.words.length - 1]?.end_time;
      return start !== undefined && end !== undefined && currentTime >= start && currentTime <= end;
    });

    if (activeLineIndex !== -1) {
      const container = transcriptContainerRef.current;
      const activeLineElement = container.children[activeLineIndex] as HTMLElement;
      if (activeLineElement) {
        const containerRect = container.getBoundingClientRect();
        const elementRect = activeLineElement.getBoundingClientRect();
        if (elementRect.top < containerRect.top + 20 || elementRect.bottom > containerRect.bottom - 20) {
          activeLineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [currentTime, transcriptData]);

  // Render transcript
  const renderTranscript = () => {
    if (!transcriptData) return null;

    const isTextRtl = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(transcriptData.fullTranscript);
    const direction = isTextRtl ? 'rtl' : 'ltr';

    return (
      <div className="space-y-4" dir={direction}>
        {transcriptData.lines.map((line, lineIndex) => {
          const lineStart = line.words[0]?.start_time || 0;
          const lineEnd = line.words[line.words.length - 1]?.end_time || 0;
          const isLineActive = currentTime >= lineStart && currentTime <= lineEnd;

          if (line.type === 'book_title') {
            return (
              <div key={lineIndex} className={`w-full bg-blue-900/40 border-blue-500 rounded-xl p-4 mb-6 transition-all duration-500 ${isLineActive ? 'shadow-lg shadow-blue-500/20 scale-[1.02] border-2' : 'border border-blue-900'}`}>
                <h2 className="text-2xl font-bold text-center text-blue-100 uppercase tracking-widest drop-shadow-md">
                  {line.content}
                </h2>
              </div>
            );
          }

          if (line.type === 'chapter_title') {
            return (
              <div key={lineIndex} className={`w-full bg-gray-700/40 border-teal-500 rounded-lg py-2 px-4 mb-4 transition-all duration-500 ${isLineActive ? 'shadow-md shadow-teal-500/20 scale-[1.01] border-l-4' : 'border-l-2'}`}>
                <h3 className="text-xl font-semibold text-center text-teal-200">
                  {line.content}
                </h3>
              </div>
            );
          }

          const isVerse = line.type === 'verse';
          const textAlign = mode === 'song' ? 'text-center' : (isTextRtl ? 'text-right' : 'text-left');

          return (
            <div
              key={lineIndex}
              className={`p-3 rounded-lg transition-all duration-300 ${textAlign} relative`}
              style={{
                backgroundColor: isLineActive ? `${lineHighlightColor}80` : 'transparent',
                borderRight: isTextRtl && isLineActive ? `4px solid ${wordHighlightColor}` : '4px solid transparent',
                borderLeft: !isTextRtl && isLineActive ? `4px solid ${wordHighlightColor}` : '4px solid transparent',
                transform: isLineActive ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isLineActive ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none'
              }}
            >
              {isVerse && line.label && (
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mx-2 mb-1 align-middle ${isLineActive ? 'bg-teal-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                  {line.label}
                </span>
              )}

              {line.words.map((wordObj, wordIndex) => {
                const isWordActive = currentTime >= wordObj.start_time && currentTime < wordObj.end_time;
                return (
                  <span
                    key={wordIndex}
                    className={`inline-block mx-1 transition-all duration-100 px-0.5 rounded ${isWordActive ? 'font-bold' : 'text-gray-300'}`}
                    style={{
                      color: isWordActive ? wordHighlightColor : undefined,
                      textShadow: isWordActive ? `0 0 10px ${wordHighlightColor}66` : 'none',
                      transform: isWordActive ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {wordObj.word}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // Render translation content
  const renderTranslationContent = () => {
    const lines = translations[activeTab];
    if (!lines || !transcriptData) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <Languages className="w-8 h-8 mb-2 opacity-50" />
          <p>{lang === 'fa' ? 'هنوز ترجمه‌ای تولید نشده' : 'No translation generated yet.'}</p>
          <button onClick={() => handleTranslate(activeTab)} className="mt-2 text-blue-400 hover:underline">
            {lang === 'fa' ? 'همین الان ترجمه کن' : 'Generate now'}
          </button>
        </div>
      );
    }

    const isTextRtl = activeTab === 'persian';

    return (
      <div ref={translationContainerRef} className="space-y-4" dir={isTextRtl ? 'rtl' : 'ltr'}>
        {lines.map((lineText, index) => {
          const originalLine = transcriptData.lines[index];
          if (!originalLine) return null;

          const lineStart = originalLine.words[0]?.start_time || 0;
          const lineEnd = originalLine.words[originalLine.words.length - 1]?.end_time || 0;
          const isLineActive = currentTime >= lineStart && currentTime <= lineEnd;

          return (
            <div
              key={index}
              className={`p-3 rounded-lg transition-all duration-300 ${mode === 'song' ? 'text-center' : (isTextRtl ? 'text-right' : 'text-left')}`}
              style={{
                backgroundColor: isLineActive ? `${lineHighlightColor}80` : 'transparent',
                borderRight: isTextRtl && isLineActive ? `4px solid ${wordHighlightColor}` : '4px solid transparent',
                borderLeft: !isTextRtl && isLineActive ? `4px solid ${wordHighlightColor}` : '4px solid transparent',
                transform: isLineActive ? 'scale(1.02)' : 'scale(1)',
                color: isLineActive ? '#ffffff' : '#9ca3af'
              }}
            >
              {lineText}
            </div>
          );
        })}
      </div>
    );
  };

  // Mode selector
  const renderModeSelector = () => (
    <div className="flex justify-center mb-6 bg-gray-900/40 p-1 rounded-xl w-fit mx-auto border border-gray-700">
      <button
        onClick={() => setMode('speech')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${mode === 'speech' ? 'bg-teal-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
      >
        <BookOpen className="w-4 h-4" />
        {lang === 'fa' ? 'کتاب مقدس / سخنرانی' : 'Spoken Word (Bible/Book)'}
      </button>
      <button
        onClick={() => setMode('song')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${mode === 'song' ? 'bg-teal-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
      >
        <Music className="w-4 h-4" />
        {lang === 'fa' ? 'سرود پرستشی' : 'Worship Song'}
      </button>
    </div>
  );

  // Main content render
  const renderContent = () => {
    if (status === 'idle' || (status === 'error' && !file)) {
      return (
        <div className="text-center">
          {renderModeSelector()}
          <div
            className="relative border-2 border-dashed border-gray-600 rounded-lg p-12 cursor-pointer transition-colors hover:border-teal-500 bg-gray-800/50"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
          >
            <input type="file" ref={inputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
            <Upload className="w-12 h-12 mx-auto text-gray-500" />
            <p className="mt-4 text-gray-400">
              {mode === 'speech'
                ? (lang === 'fa' ? 'فایل صوتی کتاب مقدس یا سخنرانی را آپلود کنید' : 'Upload Bible reading or Audiobook')
                : (lang === 'fa' ? 'فایل صوتی سرود پرستشی را آپلود کنید' : 'Upload Worship Song (Audio)')}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {mode === 'speech'
                ? (lang === 'fa' ? 'تمرکز: متن، زمان‌بندی، ترجمه' : 'Focus: Transcription, Timeline, Translation')
                : (lang === 'fa' ? 'تمرکز: آکورد، متن شعر، اسلاید' : 'Focus: Chords, Lyrics, Slide Generation')}
            </p>
            {error && <p className="mt-2 text-red-400">{error}</p>}
          </div>
        </div>
      );
    }

    if (status !== 'done' && status !== 'error') {
      return (
        <div className="text-center p-12">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-teal-400" />
          <p className="mt-4 text-lg text-gray-300">{STATUS_MESSAGES[status][lang]}</p>
          {status === 'exporting' && totalSlides > 0 && (
            <div className="mt-4 w-full max-w-xs mx-auto">
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-teal-400 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(exportProgress / totalSlides) * 100}%` }}></div>
              </div>
              <p className="mt-2 text-sm text-gray-400">{`${lang === 'fa' ? 'ساخت اسلاید' : 'Generating slide'} ${exportProgress} ${lang === 'fa' ? 'از' : 'of'} ${totalSlides}...`}</p>
            </div>
          )}
        </div>
      );
    }

    const hasAnyTranslation = Object.values(translations).some(t => t !== null);

    return (
      <div>
        {error && <p className="mb-4 text-center text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</p>}

        {/* Action buttons */}
        <div className="mb-4 flex flex-wrap gap-2 justify-center items-center">
          <button onClick={resetState} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            {lang === 'fa' ? 'فایل جدید' : 'New File'}
          </button>
          <button onClick={handleDownloadTranscript} className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {lang === 'fa' ? 'دانلود متن' : 'Download Transcript'}
          </button>
          <button onClick={handleDownloadProjectJSON} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            {lang === 'fa' ? 'دانلود پروژه کامل (JSON)' : 'Download Project JSON'}
          </button>
          <button onClick={handleExportToPowerPoint} className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
            <Presentation className="w-4 h-4" />
            {mode === 'song' ? (lang === 'fa' ? 'خروجی اسلاید پرستشی' : 'Export Worship Slides') : (lang === 'fa' ? 'خروجی ارائه' : 'Export Presentation')}
          </button>

          {/* Translation Buttons */}
          <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700 gap-1">
            <button onClick={() => handleTranslate('persian')} disabled={isTranslating} className="px-3 py-2 text-sm rounded transition-colors hover:bg-blue-600 hover:text-white text-gray-300 disabled:opacity-50">
              {lang === 'fa' ? 'ترجمه فارسی' : 'To Persian'}
            </button>
            <button onClick={() => handleTranslate('english')} disabled={isTranslating} className="px-3 py-2 text-sm rounded transition-colors hover:bg-indigo-600 hover:text-white text-gray-300 disabled:opacity-50">
              {lang === 'fa' ? 'ترجمه انگلیسی' : 'To English'}
            </button>
            <button onClick={() => handleTranslate('finglish')} disabled={isTranslating} className="px-3 py-2 text-sm rounded transition-colors hover:bg-purple-600 hover:text-white text-gray-300 disabled:opacity-50">
              {lang === 'fa' ? 'فینگلیش' : 'To Finglish'}
            </button>
          </div>

          <button onClick={() => setShowAppearance(!showAppearance)} className={`p-2 rounded-lg transition-colors ${showAppearance ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}>
            <Palette className="w-6 h-6" />
          </button>
        </div>

        {/* Appearance settings */}
        {showAppearance && (
          <div className="mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-wrap justify-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <label className="text-xs text-gray-400 uppercase font-semibold">{lang === 'fa' ? 'رنگ هایلایت کلمه' : 'Word Highlight (Text)'}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={wordHighlightColor}
                  onChange={(e) => setWordHighlightColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                />
                <span className="text-sm font-mono text-gray-300">{wordHighlightColor}</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <label className="text-xs text-gray-400 uppercase font-semibold">{lang === 'fa' ? 'رنگ پس‌زمینه خط' : 'Line Highlight (Bg)'}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={lineHighlightColor}
                  onChange={(e) => setLineHighlightColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                />
                <span className="text-sm font-mono text-gray-300">{lineHighlightColor}</span>
              </div>
              <span className="text-xs text-gray-500">(50% {lang === 'fa' ? 'شفافیت' : 'Opacity'})</span>
            </div>
          </div>
        )}

        {/* Audio player */}
        <audio ref={audioRef} src={audioUrl!} controls className="w-full mb-4" />

        {/* Transcript and Translation panels */}
        <div className={`grid gap-4 ${hasAnyTranslation ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Original Section */}
          <div className="flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-2 px-2">
              <h3 className="font-semibold text-lg text-teal-400">
                {mode === 'song' ? (lang === 'fa' ? 'متن اصلی (شعر)' : 'Original (Lyrics)') : (lang === 'fa' ? 'متن اصلی' : 'Original (Transcript)')}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => handleDownloadSpecificJSON('original')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-1 px-3 text-sm rounded-lg transition-colors flex items-center gap-1.5" title="Download Original Timing JSON">
                  <Download className="w-4 h-4" /> JSON
                </button>
                {!generatedAudioUrls.original && (
                  <button onClick={() => handleGenerateAudio('original')} disabled={isGeneratingAudio !== false} className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-1 px-3 text-sm rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-1.5">
                    {isGeneratingAudio === 'original' ? <><Loader2 className="w-4 h-4 animate-spin" /> ...</> : <><Mic className="w-4 h-4" /> TTS</>}
                  </button>
                )}
              </div>
            </div>
            {generatedAudioUrls.original && <audio src={generatedAudioUrls.original} controls className="w-full mb-2 h-8" />}
            <div ref={transcriptContainerRef} className="p-6 bg-gray-900/70 rounded-lg overflow-y-auto border border-gray-700 flex-grow scrollbar-thin scrollbar-thumb-gray-600">
              {renderTranscript()}
            </div>
          </div>

          {/* Translation Section */}
          {hasAnyTranslation && (
            <div className="flex flex-col h-[500px]">
              <div className="flex border-b border-gray-700 mb-2">
                <button onClick={() => setActiveTab('persian')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'persian' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}>
                  {lang === 'fa' ? 'فارسی' : 'Persian'}
                </button>
                <button onClick={() => setActiveTab('english')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'english' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-gray-200'}`}>
                  {lang === 'fa' ? 'انگلیسی' : 'English'}
                </button>
                <button onClick={() => setActiveTab('finglish')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'finglish' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-gray-200'}`}>
                  {lang === 'fa' ? 'فینگلیش' : 'Finglish'}
                </button>
              </div>

              <div className="flex justify-between items-center mb-2 px-2">
                <h3 className="font-semibold text-lg text-gray-200 capitalize">
                  {activeTab === 'persian' ? (lang === 'fa' ? 'ترجمه فارسی' : 'Persian Translation') :
                    activeTab === 'english' ? (lang === 'fa' ? 'ترجمه انگلیسی' : 'English Translation') :
                      (lang === 'fa' ? 'فینگلیش' : 'Finglish')}
                </h3>
                <div className="flex gap-2">
                  {translations[activeTab] && (
                    <button onClick={() => handleDownloadSpecificJSON(activeTab)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-1 px-3 text-sm rounded-lg transition-colors flex items-center gap-1.5">
                      <Download className="w-4 h-4" /> JSON
                    </button>
                  )}
                  {!generatedAudioUrls[activeTab] && translations[activeTab] && (
                    <button onClick={() => handleGenerateAudio(activeTab)} disabled={isGeneratingAudio !== false} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-3 text-sm rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-1.5">
                      {isGeneratingAudio === activeTab ? <><Loader2 className="w-4 h-4 animate-spin" /> ...</> : <><Mic className="w-4 h-4" /> TTS</>}
                    </button>
                  )}
                </div>
              </div>

              {generatedAudioUrls[activeTab] && <audio src={generatedAudioUrls[activeTab]!} controls className="w-full mb-2 h-8" />}

              <div className="p-6 bg-gray-900/70 rounded-lg overflow-y-auto border border-gray-700 flex-grow scrollbar-thin scrollbar-thumb-gray-600">
                {isTranslating ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  </div>
                ) : renderTranslationContent()}
              </div>
            </div>
          )}
        </div>

        {/* Chords section */}
        {chords && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-teal-500/30">
            <h3 className="text-lg font-semibold text-teal-400 mb-2 flex items-center gap-2">
              <Music2 className="w-5 h-5" />
              {lang === 'fa' ? 'آکوردهای تشخیص داده شده' : 'Detected Chords'}
            </h3>
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300 overflow-x-auto">
              {chords}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
            {lang === 'fa' ? 'پردازشگر هوشمند صوتی' : 'Smart Audio Processor'}
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            {lang === 'fa'
              ? 'استخراج متن، زمان‌بندی، ترجمه و تبدیل به پاورپوینت با هوش مصنوعی Gemini'
              : 'Extract text, timing, translation, and create PowerPoint with Gemini AI'}
          </p>
        </header>

        <main className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 p-6">
          {renderContent()}
        </main>

        {/* Features Grid */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-400 mb-8">
            {lang === 'fa' ? 'قابلیت‌های کلیدی' : 'Key Features'}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-6 rounded-xl bg-gray-800/60 border border-gray-700 hover:border-teal-500/50 transition-all shadow-lg">
              <div className="flex items-center gap-3 mb-3 text-teal-400">
                <Volume2 className="w-6 h-6" />
                <h3 className="font-bold text-lg">{lang === 'fa' ? 'همگام‌سازی دقیق (۰.۰۱ ثانیه)' : 'Precision Timing (0.01s)'}</h3>
              </div>
              <p className="text-sm leading-relaxed text-gray-400">
                {lang === 'fa'
                  ? 'زمان‌بندی کلمات با دقت صدم ثانیه برای هماهنگی کامل با صدا'
                  : 'Word-level timing with 0.01s accuracy for perfect audio sync'}
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gray-800/60 border border-gray-700 hover:border-purple-500/50 transition-all shadow-lg">
              <div className="flex items-center gap-3 mb-3 text-purple-400">
                <Languages className="w-6 h-6" />
                <h3 className="font-bold text-lg">{lang === 'fa' ? 'ترجمه چندزبانه' : 'Multi-language Translation'}</h3>
              </div>
              <p className="text-sm leading-relaxed text-gray-400">
                {lang === 'fa'
                  ? 'ترجمه به فارسی، انگلیسی و فینگلیش با حفظ هماهنگی زمانی'
                  : 'Translate to Persian, English, and Finglish with timing sync'}
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gray-800/60 border border-gray-700 hover:border-orange-500/50 transition-all shadow-lg">
              <div className="flex items-center gap-3 mb-3 text-orange-400">
                <Presentation className="w-6 h-6" />
                <h3 className="font-bold text-lg">{lang === 'fa' ? 'پاورپوینت هوشمند' : 'Smart PowerPoint Export'}</h3>
              </div>
              <p className="text-sm leading-relaxed text-gray-400">
                {lang === 'fa'
                  ? 'تولید خودکار اسلاید با تصاویر AI و پشتیبانی از RTL'
                  : 'Auto-generate slides with AI images and RTL support'}
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gray-800/60 border border-gray-700 hover:border-blue-500/50 transition-all shadow-lg">
              <div className="flex items-center gap-3 mb-3 text-blue-400">
                <Music className="w-6 h-6" />
                <h3 className="font-bold text-lg">{lang === 'fa' ? 'تشخیص آکورد' : 'Chord Detection'}</h3>
              </div>
              <p className="text-sm leading-relaxed text-gray-400">
                {lang === 'fa'
                  ? 'تشخیص آکوردهای موسیقی برای سرودهای پرستشی'
                  : 'Detect musical chords for worship songs'}
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gray-800/60 border border-gray-700 hover:border-green-500/50 transition-all shadow-lg">
              <div className="flex items-center gap-3 mb-3 text-green-400">
                <Mic className="w-6 h-6" />
                <h3 className="font-bold text-lg">{lang === 'fa' ? 'تولید صوت (TTS)' : 'Text-to-Speech'}</h3>
              </div>
              <p className="text-sm leading-relaxed text-gray-400">
                {lang === 'fa'
                  ? 'خوانش متن با صدای طبیعی و لهجه ایرانی'
                  : 'Read text with natural voice and Iranian accent'}
              </p>
            </div>

            <div className="p-6 rounded-xl bg-gray-800/60 border border-gray-700 hover:border-pink-500/50 transition-all shadow-lg">
              <div className="flex items-center gap-3 mb-3 text-pink-400">
                <BookOpen className="w-6 h-6" />
                <h3 className="font-bold text-lg">{lang === 'fa' ? 'تحلیل ساختاری' : 'Structural Analysis'}</h3>
              </div>
              <p className="text-sm leading-relaxed text-gray-400">
                {lang === 'fa'
                  ? 'تشخیص فصل، آیه، عنوان کتاب برای کتاب مقدس'
                  : 'Detect chapters, verses, book titles for Bible readings'}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminAudioProcessorPage;
