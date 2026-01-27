import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { GoogleGenAI, Type } from '@google/genai';
import {
  Music, Save, X, Upload, Clock, FileText, Volume2,
  Eye, EyeOff, Play, Pause, SkipBack, SkipForward,
  Download, Trash2, Plus, AlertCircle, CheckCircle,
  Wand2, Loader2, Globe, Sparkles
} from 'lucide-react';

interface TimingWord {
  word: string;
  start: number;
  end: number;
}

interface TimingLine {
  line: string;
  start: number;
  end: number;
  words: TimingWord[];
}

interface TimingData {
  metadata: {
    title: string;
    artist?: string;
    totalDuration: number;
    wordCount: number;
    lineCount?: number;
    recordedDate?: string;
  };
  words: TimingWord[];
  lines: TimingLine[];
}

interface SongFormData {
  id?: number;
  title: { fa: string; en: string };
  artist?: string;
  lyrics: { fa: string; en: string; finglish?: string };
  lyricsWithChords?: string;  // Persian lyrics with chord notations like [Am], [C]
  chords?: string;  // Just the chord progression
  audioUrl?: string;
  youtubeId?: string;
  category?: string;
}

interface WorshipSongEditorProps {
  song?: SongFormData;
  onSave: (data: SongFormData, timingData?: TimingData) => Promise<void>;
  onCancel: () => void;
}

const WorshipSongEditor: React.FC<WorshipSongEditorProps> = ({ song, onSave, onCancel }) => {
  const { lang } = useLanguage();
  const [formData, setFormData] = useState<SongFormData>(song || {
    title: { fa: '', en: '' },
    artist: '',
    lyrics: { fa: '', en: '' },
    chords: '',
    audioUrl: '',
    youtubeId: '',
    category: 'worship'
  });

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [showTimingRecorder, setShowTimingRecorder] = useState(false);
  const [timingData, setTimingData] = useState<TimingData | null>(null);
  const [saving, setSaving] = useState(false);

  // Timing Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [recordedWords, setRecordedWords] = useState<TimingWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [editedLyrics, setEditedLyrics] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);


  // AI Smart Sync State
  const [aiSyncStatus, setAiSyncStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [aiSyncProgress, setAiSyncProgress] = useState('');
  const [aiGeneratedData, setAiGeneratedData] = useState<{
    timing: any | null;
    finglish: string[] | null;
    english: string[] | null;
  }>({ timing: null, finglish: null, english: null });
  const [showAIPreview, setShowAIPreview] = useState(false);

  // API Key Management
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('gemini_api_keys');
    return saved ? JSON.parse(saved) : [];
  });
  const [newApiKey, setNewApiKey] = useState('');
  const [activeKeyIndex, setActiveKeyIndex] = useState<number>(() => {
    const saved = localStorage.getItem('gemini_active_key_index');
    return saved ? parseInt(saved) : 0;
  });

  // Save API keys to localStorage
  useEffect(() => {
    localStorage.setItem('gemini_api_keys', JSON.stringify(apiKeys));
    localStorage.setItem('gemini_active_key_index', activeKeyIndex.toString());
  }, [apiKeys, activeKeyIndex]);

  const addApiKey = () => {
    if (newApiKey.trim() && !apiKeys.includes(newApiKey.trim())) {
      setApiKeys([...apiKeys, newApiKey.trim()]);
      setNewApiKey('');
    }
  };

  const removeApiKey = (index: number) => {
    const updated = apiKeys.filter((_, i) => i !== index);
    setApiKeys(updated);
    if (activeKeyIndex >= updated.length) {
      setActiveKeyIndex(Math.max(0, updated.length - 1));
    }
  };

  const getActiveApiKey = (): string => {
    // First try localStorage keys
    if (apiKeys.length > 0 && apiKeys[activeKeyIndex]) {
      return apiKeys[activeKeyIndex];
    }
    // Fallback to env
    return import.meta.env.VITE_GEMINI_API_KEY || '';
  };

  // Helper function to safely parse potentially truncated JSON
  const safeParseJSON = (text: string): any => {
    // First, try normal parsing
    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn('JSON parse failed, attempting smart repair...', e);
    }

    let fixed = text.trim();

    // Remove markdown code blocks if present
    fixed = fixed.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');

    // Strategy 1: Find the last complete "words" array closing bracket
    // Look for pattern: }] which ends a words array, then close properly
    const lastWordsEnd = fixed.lastIndexOf('}]');
    if (lastWordsEnd > 0) {
      let candidate = fixed.substring(0, lastWordsEnd + 2);

      // Now we need to close the line object and lines array
      // Check if we're inside a line object (has "content" and "words")
      const lastLineStart = candidate.lastIndexOf('{"type"');
      if (lastLineStart === -1) {
        // Try alternate format
        const altStart = candidate.lastIndexOf('{"content"');
        if (altStart > 0) {
          candidate = candidate.substring(0, candidate.lastIndexOf('}]') + 2) + '}]}\n';
        }
      } else {
        // Close the current line and the lines array
        candidate += '}]}';
      }

      try {
        const result = JSON.parse(candidate);
        console.log('✅ JSON repaired successfully with', result.lines?.length || 0, 'lines');
        return result;
      } catch (e2) {
        console.warn('Strategy 1 failed, trying strategy 2...');
      }
    }

    // Strategy 2: Find all complete line objects and reconstruct
    try {
      const linePattern = /\{"(?:type"[^}]*?")?content"\s*:\s*"[^"]*"\s*,\s*"words"\s*:\s*\[(?:[^\]]*\])\s*\}/g;
      const matches = fixed.match(linePattern);

      if (matches && matches.length > 0) {
        const reconstructed = { lines: matches.map(m => JSON.parse(m)) };
        console.log('✅ JSON reconstructed with', reconstructed.lines.length, 'lines');
        return reconstructed;
      }
    } catch (e3) {
      console.warn('Strategy 2 failed:', e3);
    }

    // Strategy 3: Brute force - try progressively shorter strings
    for (let i = fixed.length; i > 100; i -= 100) {
      let attempt = fixed.substring(0, i);

      // Count brackets and close them
      const openBraces = (attempt.match(/{/g) || []).length;
      const closeBraces = (attempt.match(/}/g) || []).length;
      const openBrackets = (attempt.match(/\[/g) || []).length;
      const closeBrackets = (attempt.match(/\]/g) || []).length;

      // Remove any trailing incomplete string or number
      attempt = attempt.replace(/,\s*"[^"]*$/, '').replace(/,\s*[\d.]+$/, '').replace(/,\s*$/, '');

      // Close structures
      for (let j = 0; j < openBrackets - closeBrackets; j++) attempt += ']';
      for (let j = 0; j < openBraces - closeBraces; j++) attempt += '}';

      try {
        const result = JSON.parse(attempt);
        if (result.lines && result.lines.length > 0) {
          console.log('✅ JSON repaired via brute force with', result.lines.length, 'lines');
          return result;
        }
      } catch {
        // Continue trying
      }
    }

    console.error('All JSON repair strategies failed');
    return { lines: [] };
  };

  // AI Smart Sync Function
  const handleAISync = async () => {
    if (!audioFile && !formData.audioUrl) {
      alert(lang === 'fa' ? 'ابتدا فایل صوتی را آپلود کنید' : 'Please upload an audio file first');
      return;
    }

    try {
      setAiSyncStatus('processing');
      setAiSyncProgress(lang === 'fa' ? 'در حال آماده‌سازی فایل...' : 'Preparing file...');

      const apiKey = getActiveApiKey();
      if (!apiKey) {
        setShowApiSettings(true);
        throw new Error(lang === 'fa' ? 'API Key تنظیم نشده. لطفاً در بخش تنظیمات اضافه کنید.' : 'API Key not set. Please add one in settings.');
      }

      const ai = new GoogleGenAI({ apiKey });

      // Convert audio to base64
      let audioBase64 = '';
      let mimeType = 'audio/mpeg';

      if (audioFile) {
        audioBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(audioFile);
        });
        mimeType = audioFile.type;
      } else if (formData.audioUrl) {
        // Fetch from URL
        setAiSyncProgress(lang === 'fa' ? 'در حال دانلود فایل صوتی...' : 'Downloading audio file...');
        const response = await fetch(formData.audioUrl);
        const blob = await response.blob();
        audioBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(blob);
        });
        mimeType = blob.type || 'audio/mpeg';
      }

      // Step 1: Transcribe with timing
      setAiSyncProgress(lang === 'fa' ? '🎤 در حال تحلیل صدا با AI...' : '🎤 Analyzing audio with AI...');

      const transcribeResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{
          parts: [
            { inlineData: { data: audioBase64, mimeType } },
            { text: `Transcribe this Persian worship song. Group words into natural lyric lines. Set type to 'lyric'. CRITICAL: Provide highly accurate timestamps for every single word, down to the hundredth of a second (0.01s), for perfect karaoke-style synchronization.` }
          ]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    content: { type: Type.STRING },
                    words: {
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
                  required: ['content', 'words']
                }
              }
            },
            required: ['lines']
          },
          maxOutputTokens: 16384  // Increased to prevent truncation
        }
      });

      const timingResult = safeParseJSON(transcribeResponse.text || '{}');
      console.log('✅ AI Timing generated:', timingResult);

      // Validate timing result
      if (!timingResult.lines || timingResult.lines.length === 0) {
        throw new Error(lang === 'fa'
          ? 'تایمینگ استخراج نشد. لطفاً دوباره تلاش کنید یا از روش دستی استفاده کنید.'
          : 'Timing extraction failed. Please try again or use manual mode.');
      }

      // Step 2: Generate Finglish
      setAiSyncProgress(lang === 'fa' ? '🔤 در حال تولید فینگلیش...' : '🔤 Generating Finglish...');

      const linesContent = timingResult.lines.map((l: any) => l.content);

      const finglishResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        config: {
          systemInstruction: "You are a transliteration expert. Convert each line of Persian text to Finglish (Persian using English alphabet). Maintain exact line count and order.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translated_lines: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        },
        contents: [{ parts: [{ text: `Convert these Persian lines to Finglish:\n${JSON.stringify(linesContent)}` }] }],
      });

      const finglishResult = safeParseJSON(finglishResponse.text || '{}');
      console.log('✅ Finglish generated:', finglishResult);

      // Step 3: Generate English translation
      setAiSyncProgress(lang === 'fa' ? '🌐 در حال ترجمه به انگلیسی...' : '🌐 Translating to English...');

      const englishResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        config: {
          systemInstruction: "Translate each line to fluent English. Maintain exact line count and order.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translated_lines: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        },
        contents: [{ parts: [{ text: `Translate these Persian lines to English:\n${JSON.stringify(linesContent)}` }] }],
      });

      const englishResult = safeParseJSON(englishResponse.text || '{}');
      console.log('✅ English translation generated:', englishResult);

      // Store all generated data
      setAiGeneratedData({
        timing: timingResult,
        finglish: finglishResult.translated_lines || [],
        english: englishResult.translated_lines || []
      });

      // Auto-update lyrics from AI if empty
      if (!formData.lyrics.fa && timingResult.lines) {
        const persianLyrics = timingResult.lines.map((l: any) => l.content).join('\n');
        setFormData(prev => ({ ...prev, lyrics: { ...prev.lyrics, fa: persianLyrics } }));
      }

      // Auto-update English lyrics
      if (englishResult.translated_lines) {
        const englishLyrics = englishResult.translated_lines.join('\n');
        setFormData(prev => ({ ...prev, lyrics: { ...prev.lyrics, en: englishLyrics } }));
      }

      // Convert to TimingData format for save
      const convertedTiming: TimingData = {
        metadata: {
          title: formData.title.fa || formData.title.en || 'Untitled',
          artist: formData.artist,
          totalDuration: timingResult.lines.reduce((max: number, l: any) => {
            const lastWord = l.words[l.words.length - 1];
            return Math.max(max, lastWord?.end_time || 0);
          }, 0),
          wordCount: timingResult.lines.reduce((sum: number, l: any) => sum + l.words.length, 0),
          lineCount: timingResult.lines.length,
          recordedDate: new Date().toISOString()
        },
        words: timingResult.lines.flatMap((l: any) => l.words.map((w: any) => ({
          word: w.word,
          start: w.start_time,
          end: w.end_time
        }))),
        lines: timingResult.lines.map((l: any, idx: number) => ({
          line: l.content,
          start: l.words[0]?.start_time || 0,
          end: l.words[l.words.length - 1]?.end_time || 0,
          words: l.words.map((w: any) => ({
            word: w.word,
            start: w.start_time,
            end: w.end_time,
            finglish: finglishResult.translated_lines?.[idx]?.split(/\s+/)?.[l.words.indexOf(w)] || ''
          }))
        }))
      };

      setTimingData(convertedTiming);
      setAiSyncStatus('done');
      setAiSyncProgress(lang === 'fa' ? '✅ سینک کامل شد!' : '✅ Sync completed!');
      setShowAIPreview(true);

    } catch (error) {
      console.error('AI Sync Error:', error);
      setAiSyncStatus('error');
      setAiSyncProgress(lang === 'fa' ? '❌ خطا در پردازش' : '❌ Processing error');
    }
  };

  // استخراج کلمات از متن
  const getLyricsWords = (): string[] => {
    const lyrics = formData.lyrics[lang] || formData.lyrics.fa || '';
    // حذف خطوط خالی، chords و علائم
    const cleanText = lyrics
      .replace(/\[([A-G][#b]?m?\d?)\]/g, '') // حذف chords
      .replace(/\n+/g, ' ') // تبدیل newline به فاصله
      .replace(/[،.:;!?؟]/g, '') // حذف punctuation
      .trim();

    return cleanText.split(/\s+/).filter(w => w.length > 0);
  };

  const words = getLyricsWords();

  // Handle Audio File Upload
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      // Create temporary URL for preview
      const url = URL.createObjectURL(file);
      setFormData({ ...formData, audioUrl: url });
    }
  };

  // Timing Recorder Functions
  const startRecording = () => {
    if (!audioRef.current) return;
    setIsRecording(true);
    setIsPaused(false);
    setCurrentWordIndex(0);
    setRecordedWords([]);
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  };

  const pauseRecording = () => {
    if (!audioRef.current) return;
    setIsPaused(!isPaused);
    if (isPaused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  const stopRecording = () => {
    if (!audioRef.current) return;
    setIsRecording(false);
    setIsPaused(false);
    audioRef.current.pause();
    audioRef.current.currentTime = 0;

    // Generate timing data
    generateTimingData();
  };

  const recordWord = () => {
    if (currentWordIndex >= words.length) return;

    const word = words[currentWordIndex];
    const startTime = recordedWords[recordedWords.length - 1]?.end || 0;
    const endTime = currentTime;

    const newWord: TimingWord = {
      word,
      start: startTime,
      end: endTime
    };

    setRecordedWords([...recordedWords, newWord]);
    setCurrentWordIndex(currentWordIndex + 1);
  };

  const undoLastWord = () => {
    if (recordedWords.length === 0) return;
    setRecordedWords(recordedWords.slice(0, -1));
    setCurrentWordIndex(Math.max(0, currentWordIndex - 1));
  };

  // Generate final timing data
  const generateTimingData = () => {
    if (recordedWords.length === 0) return;

    // تبدیل words به lines
    const lyricsLines = (formData.lyrics[lang] || formData.lyrics.fa || '')
      .split('\n')
      .filter(line => line.trim() && !line.match(/^\[([A-G][#b]?m?\d?)\]$/));

    const lines: TimingLine[] = [];
    let wordIndex = 0;

    lyricsLines.forEach(lineText => {
      const cleanLine = lineText.replace(/\[([A-G][#b]?m?\d?)\]/g, '').trim();
      const lineWords = cleanLine.split(/\s+/).filter(w => w.length > 0);

      if (lineWords.length === 0) return;

      const lineTimingWords: TimingWord[] = [];
      lineWords.forEach(() => {
        if (wordIndex < recordedWords.length) {
          lineTimingWords.push(recordedWords[wordIndex]);
          wordIndex++;
        }
      });

      if (lineTimingWords.length > 0) {
        lines.push({
          line: cleanLine,
          start: lineTimingWords[0].start,
          end: lineTimingWords[lineTimingWords.length - 1].end,
          words: lineTimingWords
        });
      }
    });

    const data: TimingData = {
      metadata: {
        title: formData.title.fa || formData.title.en || 'Untitled',
        artist: formData.artist,
        totalDuration: audioRef.current?.duration || 0,
        wordCount: recordedWords.length,
        lineCount: lines.length,
        recordedDate: new Date().toISOString()
      },
      words: recordedWords,
      lines
    };

    setTimingData(data);
  };

  // Update current time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    audio.addEventListener('timeupdate', updateTime);

    return () => audio.removeEventListener('timeupdate', updateTime);
  }, []);

  // Keyboard shortcuts for recording
  useEffect(() => {
    if (!isRecording) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        recordWord();
      } else if (e.code === 'Backspace') {
        e.preventDefault();
        undoLastWord();
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        pauseRecording();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRecording, currentWordIndex, recordedWords]);

  // AI Timing Generation State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleAiGeneration = () => {
    setShowAiModal(true);
  };

  const copyAiCommand = () => {
    const command = `node scripts/google-timing.cjs ${song?.id || 'SONG_ID'}`;
    navigator.clipboard.writeText(command);
    alert('دستور کپی شد! در ترمینال اجرا کنید.');
  };

  const loadAiTiming = async () => {
    if (!song?.id) return;
    try {
      const response = await fetch(`/worship/data/timings/song_${song.id}_timing_auto.json`);
      if (response.ok) {
        const data = await response.json();
        if (data.words) {
          setRecordedWords(data.words.map((w: any) => ({
            word: w.word,
            start: w.start_time,
            end: w.end_time
          })));
          alert('تایمینگ هوش مصنوعی با موفقیت بارگذاری شد!');
          setShowAiModal(false);
        }
      } else {
        alert('فایل تایمینگ هنوز تولید نشده است. ابتدا اسکریپت را اجرا کنید.');
      }
    } catch (error) {
      console.error(error);
      alert('خطا در بارگذاری فایل.');
    }
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData, timingData || undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-6 border border-purple-500/30">
            <div className="flex items-center gap-4">
              <div className="bg-purple-600 p-3 rounded-xl">
                <Music className="text-white" size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">
                  {song?.id
                    ? (lang === 'fa' ? 'ویرایش سرود' : 'Edit Song')
                    : (lang === 'fa' ? 'سرود جدید' : 'New Song')
                  }
                </h2>
                <p className="text-gray-400 mt-1">
                  {lang === 'fa'
                    ? 'مدیریت کامل متن، آکورد، فایل صوتی و تایمینگ'
                    : 'Complete management of lyrics, chords, audio, and timing'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
              title={lang === 'fa' ? 'بستن' : 'Close'}
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Basic Info */}
            <div className="space-y-6">
              {/* Titles */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FileText size={20} />
                  {lang === 'fa' ? 'اطلاعات پایه' : 'Basic Information'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2 font-semibold">
                      {lang === 'fa' ? 'عنوان فارسی *' : 'Persian Title *'}
                    </label>
                    <input
                      type="text"
                      value={formData.title.fa}
                      onChange={(e) => setFormData({ ...formData, title: { ...formData.title, fa: e.target.value } })}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      dir="rtl"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2 font-semibold">
                      {lang === 'fa' ? 'عنوان انگلیسی' : 'English Title'}
                    </label>
                    <input
                      type="text"
                      value={formData.title.en}
                      onChange={(e) => setFormData({ ...formData, title: { ...formData.title, en: e.target.value } })}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2 font-semibold">
                      {lang === 'fa' ? 'خواننده / هنرمند' : 'Artist'}
                    </label>
                    <input
                      type="text"
                      value={formData.artist || ''}
                      onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2 font-semibold">
                      {lang === 'fa' ? 'YouTube ID' : 'YouTube ID'}
                    </label>
                    <input
                      type="text"
                      value={formData.youtubeId || ''}
                      onChange={(e) => setFormData({ ...formData, youtubeId: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      placeholder="dQw4w9WgXcQ"
                    />
                  </div>
                </div>
              </div>

              {/* Audio Upload */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Volume2 size={20} />
                  {lang === 'fa' ? 'فایل صوتی' : 'Audio File'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2 font-semibold">
                      {lang === 'fa' ? 'آپلود فایل MP3' : 'Upload MP3 File'}
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg cursor-pointer transition-colors">
                        <Upload size={20} />
                        {audioFile ? audioFile.name : (lang === 'fa' ? 'انتخاب فایل' : 'Choose File')}
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleAudioUpload}
                          className="hidden"
                        />
                      </label>
                      {audioFile && (
                        <button
                          onClick={() => {
                            setAudioFile(null);
                            setFormData({ ...formData, audioUrl: '' });
                          }}
                          className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </div>

                  {(formData.audioUrl || audioFile) && (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <audio
                        ref={audioRef}
                        src={formData.audioUrl}
                        controls
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Lyrics & Chords */}
            <div className="space-y-6">
              {/* Lyrics - 4 Separate Sections */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  📝 {lang === 'fa' ? 'متون سرود' : 'Song Lyrics'}
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 1. Persian Lyrics */}
                  <div className="space-y-2">
                    <label className="block text-gray-300 font-semibold flex items-center gap-2">
                      🇮🇷 {lang === 'fa' ? 'متن فارسی' : 'Persian Lyrics'}
                    </label>
                    <textarea
                      value={formData.lyrics.fa}
                      onChange={(e) => setFormData({ ...formData, lyrics: { ...formData.lyrics, fa: e.target.value } })}
                      rows={8}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      dir="rtl"
                      placeholder={lang === 'fa' ? 'متن فارسی سرود را اینجا بنویسید...' : 'Enter Persian lyrics here...'}
                    />
                  </div>

                  {/* 2. Finglish Lyrics */}
                  <div className="space-y-2">
                    <label className="block text-gray-300 font-semibold flex items-center gap-2">
                      🔤 {lang === 'fa' ? 'متن فینگلیش' : 'Finglish Lyrics'}
                    </label>
                    <textarea
                      value={formData.lyrics.finglish || ''}
                      onChange={(e) => setFormData({ ...formData, lyrics: { ...formData.lyrics, finglish: e.target.value } })}
                      rows={8}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-purple-500"
                      placeholder={lang === 'fa' ? 'Matne Finglish ra inja benevisid...' : 'Enter Finglish lyrics here...'}
                    />
                    <p className="text-gray-500 text-xs">
                      {lang === 'fa' ? '💡 فارسی با حروف انگلیسی' : '💡 Persian written in English letters'}
                    </p>
                  </div>

                  {/* 3. English Lyrics */}
                  <div className="space-y-2">
                    <label className="block text-gray-300 font-semibold flex items-center gap-2">
                      🌐 {lang === 'fa' ? 'متن انگلیسی' : 'English Lyrics'}
                    </label>
                    <textarea
                      value={formData.lyrics.en}
                      onChange={(e) => setFormData({ ...formData, lyrics: { ...formData.lyrics, en: e.target.value } })}
                      rows={8}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      placeholder={lang === 'fa' ? 'ترجمه انگلیسی سرود...' : 'English translation of lyrics...'}
                    />
                  </div>

                  {/* 4. Persian with Chords */}
                  <div className="space-y-2">
                    <label className="block text-gray-300 font-semibold flex items-center gap-2">
                      🎸 {lang === 'fa' ? 'متن فارسی با آکورد' : 'Persian with Chords'}
                    </label>
                    <textarea
                      value={formData.lyricsWithChords || ''}
                      onChange={(e) => setFormData({ ...formData, lyricsWithChords: e.target.value })}
                      rows={8}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-orange-500"
                      dir="rtl"
                      placeholder="[Am]الشدای [C]الشدای&#10;[Dm]ال الــیون [G]ادونای..."
                    />
                    <p className="text-gray-500 text-xs">
                      {lang === 'fa'
                        ? '💡 آکوردها را داخل [] قرار دهید. مثال: [C], [Am], [Dm]'
                        : '💡 Place chords in []. Example: [C], [Am], [Dm]'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ⚡ AI Smart Sync Section */}
          <div className="mt-6 bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-xl p-6 border-2 border-pink-500/50">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="text-pink-400" size={28} />
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {lang === 'fa' ? '⚡ سینک هوشمند با AI' : '⚡ AI Smart Sync'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {lang === 'fa'
                      ? 'تولید خودکار تایمینگ، فینگلیش و ترجمه با هوش مصنوعی'
                      : 'Auto-generate timing, Finglish, and translation with AI'
                    }
                  </p>
                </div>
              </div>

              {/* Settings Toggle & Main Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowApiSettings(!showApiSettings)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${showApiSettings
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  title={lang === 'fa' ? 'تنظیمات API Key' : 'API Key Settings'}
                >
                  ⚙️
                </button>
                <button
                  onClick={handleAISync}
                  disabled={aiSyncStatus === 'processing' || (!audioFile && !formData.audioUrl)}
                  className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
                >
                  {aiSyncStatus === 'processing' ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      {lang === 'fa' ? 'در حال پردازش...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Wand2 size={20} />
                      {lang === 'fa' ? 'شروع سینک هوشمند' : 'Start Smart Sync'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* API Key Settings Panel */}
            {showApiSettings && (
              <div className="bg-gray-900/80 rounded-lg p-4 border border-blue-500/30 mb-4">
                <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  🔑 {lang === 'fa' ? 'مدیریت API Keys' : 'API Key Management'}
                </h4>

                {/* Add New Key */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    placeholder={lang === 'fa' ? 'API Key جدید را اینجا وارد کنید...' : 'Enter new API Key...'}
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={addApiKey}
                    disabled={!newApiKey.trim()}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    ➕ {lang === 'fa' ? 'افزودن' : 'Add'}
                  </button>
                </div>

                {/* Keys List */}
                {apiKeys.length > 0 ? (
                  <div className="space-y-2">
                    {apiKeys.map((key, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${index === activeKeyIndex
                          ? 'bg-green-900/30 border-green-500'
                          : 'bg-gray-800 border-gray-600 hover:border-gray-500'
                          }`}
                      >
                        <button
                          onClick={() => setActiveKeyIndex(index)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${index === activeKeyIndex
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-500'
                            }`}
                        >
                          {index === activeKeyIndex && <span className="text-white text-xs">✓</span>}
                        </button>
                        <span className="flex-1 font-mono text-sm text-gray-300">
                          {key.slice(0, 15)}...{key.slice(-8)}
                        </span>
                        <button
                          onClick={() => removeApiKey(index)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title={lang === 'fa' ? 'حذف' : 'Remove'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>{lang === 'fa' ? 'هیچ API Key اضافه نشده. از Google AI Studio دریافت کنید:' : 'No API Keys added. Get one from:'}</p>
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      aistudio.google.com/apikey
                    </a>
                  </div>
                )}

                {/* Active Key Display */}
                {getActiveApiKey() && (
                  <div className="mt-3 p-2 bg-green-900/20 rounded border border-green-500/30 text-center">
                    <span className="text-green-400 text-sm">
                      ✅ {lang === 'fa' ? 'کلید فعال:' : 'Active Key:'} {getActiveApiKey().slice(0, 10)}...
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Progress Display */}
            {aiSyncStatus === 'processing' && (
              <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30 mb-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin text-blue-400" size={24} />
                  <span className="text-blue-200 font-medium">{aiSyncProgress}</span>
                </div>
              </div>
            )}

            {/* Success Message */}
            {aiSyncStatus === 'done' && (
              <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30 mb-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-400" size={24} />
                  <span className="text-green-200 font-medium">{aiSyncProgress}</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {aiSyncStatus === 'error' && (
              <div className="bg-red-900/30 rounded-lg p-4 border border-red-500/30 mb-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-red-400" size={24} />
                  <span className="text-red-200 font-medium">{aiSyncProgress}</span>
                </div>
              </div>
            )}

            {/* AI Preview Panel */}
            {showAIPreview && aiGeneratedData.timing && (
              <div className="bg-gray-900/80 rounded-xl p-6 border border-gray-700 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold text-white flex items-center gap-2">
                    <Eye size={20} />
                    {lang === 'fa' ? 'پیش‌نمایش نتایج' : 'Preview Results'}
                  </h4>
                  <button
                    onClick={() => setShowAIPreview(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <EyeOff size={20} />
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-purple-900/30 rounded-lg p-4 text-center border border-purple-500/30">
                    <div className="text-3xl font-bold text-purple-400">
                      {aiGeneratedData.timing.lines?.length || 0}
                    </div>
                    <div className="text-gray-400 text-sm">{lang === 'fa' ? 'خط' : 'Lines'}</div>
                  </div>
                  <div className="bg-blue-900/30 rounded-lg p-4 text-center border border-blue-500/30">
                    <div className="text-3xl font-bold text-blue-400">
                      {aiGeneratedData.timing.lines?.reduce((sum: number, l: any) => sum + l.words.length, 0) || 0}
                    </div>
                    <div className="text-gray-400 text-sm">{lang === 'fa' ? 'کلمه' : 'Words'}</div>
                  </div>
                  <div className="bg-green-900/30 rounded-lg p-4 text-center border border-green-500/30">
                    <div className="text-3xl font-bold text-green-400">
                      {aiGeneratedData.finglish?.length || 0}
                    </div>
                    <div className="text-gray-400 text-sm">{lang === 'fa' ? 'فینگلیش' : 'Finglish'}</div>
                  </div>
                  <div className="bg-teal-900/30 rounded-lg p-4 text-center border border-teal-500/30">
                    <div className="text-3xl font-bold text-teal-400">
                      {aiGeneratedData.english?.length || 0}
                    </div>
                    <div className="text-gray-400 text-sm">{lang === 'fa' ? 'انگلیسی' : 'English'}</div>
                  </div>
                </div>

                {/* Lyrics Preview */}
                <div className="grid grid-cols-3 gap-4 max-h-60 overflow-hidden">
                  {/* Persian */}
                  <div className="bg-gray-800/50 rounded-lg p-4 overflow-y-auto max-h-60">
                    <h5 className="text-white font-bold mb-2 flex items-center gap-2">
                      <Globe size={16} /> {lang === 'fa' ? 'فارسی' : 'Persian'}
                    </h5>
                    <div className="text-gray-300 text-sm space-y-1" dir="rtl">
                      {aiGeneratedData.timing.lines?.slice(0, 8).map((l: any, i: number) => (
                        <p key={i} className="border-b border-gray-700 pb-1">{l.content}</p>
                      ))}
                      {(aiGeneratedData.timing.lines?.length || 0) > 8 && (
                        <p className="text-gray-500">... و {aiGeneratedData.timing.lines.length - 8} خط دیگر</p>
                      )}
                    </div>
                  </div>

                  {/* Finglish */}
                  <div className="bg-gray-800/50 rounded-lg p-4 overflow-y-auto max-h-60">
                    <h5 className="text-white font-bold mb-2 flex items-center gap-2">
                      🔤 {lang === 'fa' ? 'فینگلیش' : 'Finglish'}
                    </h5>
                    <div className="text-purple-300 text-sm space-y-1 font-mono">
                      {aiGeneratedData.finglish?.slice(0, 8).map((line: string, i: number) => (
                        <p key={i} className="border-b border-gray-700 pb-1">{line}</p>
                      ))}
                    </div>
                  </div>

                  {/* English */}
                  <div className="bg-gray-800/50 rounded-lg p-4 overflow-y-auto max-h-60">
                    <h5 className="text-white font-bold mb-2 flex items-center gap-2">
                      🌐 {lang === 'fa' ? 'انگلیسی' : 'English'}
                    </h5>
                    <div className="text-teal-300 text-sm space-y-1">
                      {aiGeneratedData.english?.slice(0, 8).map((line: string, i: number) => (
                        <p key={i} className="border-b border-gray-700 pb-1">{line}</p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30 text-center">
                  <p className="text-blue-200 text-sm">
                    {lang === 'fa'
                      ? '✅ داده‌ها آماده هستند. دکمه "ذخیره سرود" را بزنید تا همه چیز ذخیره شود.'
                      : '✅ Data is ready. Click "Save Song" to save everything.'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Timing Recorder Section */}
          <div className="mt-6 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl p-6 border-2 border-purple-500/50">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <Clock className="text-purple-400" size={28} />
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {lang === 'fa' ? '⏱️ ضبط تایمینگ کلمات' : '⏱️ Word Timing Recorder'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {lang === 'fa'
                      ? 'برای همگام‌سازی دقیق کلمات با موسیقی'
                      : 'For precise word synchronization with music'
                    }
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAiGeneration}
                  className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-teal-900/20"
                >
                  <Sparkles size={20} />
                  {lang === 'fa' ? 'تولید با هوش مصنوعی' : 'Generate with AI'}
                </button>
                <button
                  onClick={() => setShowTimingRecorder(!showTimingRecorder)}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {showTimingRecorder ? <EyeOff size={20} /> : <Eye size={20} />}
                  {showTimingRecorder
                    ? (lang === 'fa' ? 'بستن' : 'Close')
                    : (lang === 'fa' ? 'باز کردن' : 'Open')
                  }
                </button>
              </div>
            </div>

            {showTimingRecorder && (
              <div className="bg-gray-900/80 rounded-xl p-6 border border-gray-700">
                {!formData.audioUrl ? (
                  // ... existing content ...
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto text-yellow-500 mb-3" size={48} />
                    <p className="text-gray-300">
                      {lang === 'fa'
                        ? 'ابتدا یک فایل صوتی آپلود کنید'
                        : 'Please upload an audio file first'
                      }
                    </p>
                  </div>
                ) : words.length === 0 ? (
                  // ... existing content ...
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto text-yellow-500 mb-3" size={48} />
                    <p className="text-gray-300">
                      {lang === 'fa'
                        ? 'ابتدا متن سرود را وارد کنید'
                        : 'Please enter song lyrics first'
                      }
                    </p>
                  </div>
                ) : (
                  // ... existing content ...
                  <div className="space-y-6">
                    {/* Stats */}
                    {/* ... */}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Generation Modal */}
        {showAiModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
            <div className="bg-gray-900 rounded-2xl max-w-2xl w-full border border-teal-500/30 shadow-2xl shadow-teal-900/50">
              <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="text-teal-400" />
                  {lang === 'fa' ? 'تولید تایمینگ هوشمند (Google AI)' : 'AI Auto-Timing Generation'}
                </h3>
                <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-500/30">
                  <p className="text-blue-200 text-sm leading-relaxed">
                    {lang === 'fa'
                      ? 'به دلیل محدودیت‌های مرورگر، تولید تایمینگ باید توسط سرور انجام شود. لطفاً دستور زیر را کپی کرده و در ترمینال اجرا کنید:'
                      : 'Due to browser limitations, timing generation must be run on the server. Please copy and run this command in your terminal:'
                    }
                  </p>
                </div>

                <div className="bg-black/50 rounded-lg p-4 font-mono text-green-400 border border-gray-700 flex items-center justify-between group">
                  <code>node scripts/google-timing.cjs {song?.id || 'SONG_ID'}</code>
                  <button
                    onClick={copyAiCommand}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs"
                  >
                    Copy
                  </button>
                </div>

                <div className="flex flex-col items-center gap-4 pt-4">
                  <p className="text-gray-400 text-sm">
                    {lang === 'fa'
                      ? 'پس از اتمام اجرای دستور در ترمینال، دکمه زیر را بزنید:'
                      : 'After the command finishes in terminal, click below:'
                    }
                  </p>
                  <button
                    onClick={loadAiTiming}
                    className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-900/50 transition-all"
                  >
                    <Download size={24} />
                    {lang === 'fa' ? 'بارگذاری فایل تولید شده' : 'Load Generated Timing File'}
                  </button>
                </div>
              </div>
              <div className="bg-purple-900/30 rounded-lg p-4 text-center border border-purple-500/30">
                <div className="text-3xl font-bold text-purple-400">
                  {Math.round((recordedWords.length / words.length) * 100)}%
                </div>
                <div className="text-gray-400 text-sm">{lang === 'fa' ? 'پیشرفت' : 'Progress'}</div>
              </div>
            </div>

            {/* Full Lyrics Display with Word Highlighting */}
            < div className="bg-gray-800 rounded-xl p-6 border-2 border-purple-500/50 max-h-96 overflow-y-auto" >
              <div className="text-gray-400 text-sm mb-3 flex justify-between items-center">
                <span>{lang === 'fa' ? '📜 متن سرود - کلیک Space برای ثبت هر کلمه' : '📜 Lyrics - Press Space to record each word'}</span>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">{currentWordIndex + 1} / {words.length}</span>
                  {!isRecording && (
                    <button
                      onClick={() => {
                        if (isEditingLyrics) {
                          // Apply changes - update formData.lyrics.fa
                          setFormData(prev => ({ ...prev, lyrics: { ...prev.lyrics, fa: editedLyrics } }));
                          setCurrentWordIndex(0);
                          setRecordedWords([]);
                          setIsEditingLyrics(false);
                        } else {
                          // Start editing - use Persian lyrics
                          setEditedLyrics(typeof formData.lyrics === 'string' ? formData.lyrics : formData.lyrics.fa);
                          setIsEditingLyrics(true);
                        }
                      }}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${isEditingLyrics
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                      {isEditingLyrics
                        ? (lang === 'fa' ? '✓ اعمال' : '✓ Apply')
                        : (lang === 'fa' ? '✏️ ویرایش' : '✏️ Edit')
                      }
                    </button>
                  )}
                  {isEditingLyrics && (
                    <button
                      onClick={() => setIsEditingLyrics(false)}
                      className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-600 hover:bg-gray-500 text-white"
                    >
                      {lang === 'fa' ? '✕ لغو' : '✕ Cancel'}
                    </button>
                  )}
                </div>
              </div>

              {
                isEditingLyrics ? (
                  <div className="space-y-2">
                    <textarea
                      value={editedLyrics}
                      onChange={(e) => setEditedLyrics(e.target.value)}
                      className="w-full h-64 bg-gray-900 border border-gray-600 rounded-lg p-4 text-white text-lg leading-loose resize-none focus:outline-none focus:border-blue-500"
                      dir="rtl"
                      placeholder={lang === 'fa' ? 'متن سرود را اینجا ویرایش کنید...' : 'Edit lyrics here...'}
                    />
                    <p className="text-gray-500 text-sm text-center">
                      {lang === 'fa'
                        ? '💡 هر خط یک بند جدید است. تغییرات را اعمال کنید تا کلمات بروز شوند.'
                        : '💡 Each line is a new verse. Apply changes to update words.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl leading-loose font-semibold" dir="rtl">
                      {words.map((word, idx) => {
                        let className = 'inline-block mx-1 px-2 py-1 rounded transition-all duration-200 cursor-pointer hover:scale-105 ';

                        if (idx < currentWordIndex) {
                          // Already recorded - green
                          className += 'bg-green-600/30 text-green-400 border border-green-500/50';
                        } else if (idx === currentWordIndex) {
                          // Current word - yellow pulsing
                          className += 'bg-yellow-600/50 text-yellow-300 border-2 border-yellow-400 animate-pulse scale-110 shadow-lg shadow-yellow-500/30';
                        } else {
                          // Not yet recorded - gray
                          className += 'text-gray-500 hover:text-gray-300';
                        }

                        return (
                          <span
                            key={idx}
                            className={className}
                            onClick={() => {
                              if (!isRecording) {
                                // Allow clicking to jump to a word
                                setCurrentWordIndex(idx);
                                setRecordedWords(recordedWords.slice(0, idx));
                              }
                            }}
                            title={!isRecording ? (lang === 'fa' ? 'کلیک برای پرش' : 'Click to jump') : ''}
                          >
                            {word}
                          </span>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="mt-4 flex justify-center gap-6 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded"></span>
                        <span className="text-gray-400">{lang === 'fa' ? 'ثبت شده' : 'Recorded'}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-yellow-400 rounded animate-pulse"></span>
                        <span className="text-gray-400">{lang === 'fa' ? 'کلمه فعلی' : 'Current'}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-gray-600 rounded"></span>
                        <span className="text-gray-400">{lang === 'fa' ? 'باقیمانده' : 'Remaining'}</span>
                      </span>
                    </div>
                  </>
                )
              }
            </div >

            {/* Controls */}
            < div className="flex justify-center gap-4" >
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition-colors shadow-lg"
                >
                  <Play size={24} />
                  {lang === 'fa' ? 'شروع ضبط' : 'Start Recording'}
                </button>
              ) : (
                <>
                  <button
                    onClick={pauseRecording}
                    className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-4 rounded-xl font-bold transition-colors"
                  >
                    {isPaused ? <Play size={20} /> : <Pause size={20} />}
                    {isPaused ? (lang === 'fa' ? 'ادامه' : 'Resume') : (lang === 'fa' ? 'توقف' : 'Pause')}
                  </button>
                  <button
                    onClick={recordWord}
                    disabled={currentWordIndex >= words.length}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition-colors disabled:opacity-50 shadow-lg"
                  >
                    <CheckCircle size={24} />
                    {lang === 'fa' ? 'ثبت کلمه (Space)' : 'Record Word (Space)'}
                  </button>
                  <button
                    onClick={undoLastWord}
                    disabled={recordedWords.length === 0}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-xl font-bold transition-colors disabled:opacity-50"
                  >
                    <SkipBack size={20} />
                    {lang === 'fa' ? 'برگشت' : 'Undo'}
                  </button>
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-6 py-4 rounded-xl font-bold transition-colors"
                  >
                    <X size={20} />
                    {lang === 'fa' ? 'اتمام' : 'Stop'}
                  </button>
                </>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
              <h4 className="font-bold text-blue-300 mb-2">
                {lang === 'fa' ? '📖 راهنما:' : '📖 Instructions:'}
              </h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• {lang === 'fa' ? 'کلید Space: ثبت کلمه فعلی' : 'Space Key: Record current word'}</li>
                <li>• {lang === 'fa' ? 'کلید Backspace: حذف آخرین کلمه' : 'Backspace Key: Undo last word'}</li>
                <li>• {lang === 'fa' ? 'کلید P: توقف/ادامه' : 'P Key: Pause/Resume'}</li>
              </ul>
            </div>

            {/* Timing Data Preview */}
            {
              timingData && (
                <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="text-green-400" size={20} />
                    {showTimingRecorder && (
                      <div className="space-y-4">
                        {
                          timingData && (
                            <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="text-green-400" size={20} />
                                <h4 className="font-bold text-green-300">
                                  {lang === 'fa' ? '✅ تایمینگ آماده است!' : '✅ Timing Ready!'}
                                </h4>
                              </div>
                              <div className="text-gray-300 text-sm">
                                {lang === 'fa'
                                  ? `${timingData?.lines?.length || 0} خط، ${timingData?.words?.length || 0} کلمه ضبط شد`
                                  : `${timingData?.lines?.length || 0} lines, ${timingData?.words?.length || 0} words recorded`
                                }
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </div >
                </div>
              )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      < div className="mt-6 flex justify-end gap-4 bg-gray-900/50 rounded-xl p-6 border border-gray-700" >
        <button
          onClick={onCancel}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <X size={20} />
          {lang === 'fa' ? 'لغو' : 'Cancel'}
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !formData.title.fa}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 shadow-lg"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              {lang === 'fa' ? 'در حال ذخیره...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save size={20} />
              {lang === 'fa' ? 'ذخیره سرود' : 'Save Song'}
            </>
          )}
        </button>
      </div >

      {/* AI Generation Modal */}
      {
        showAiModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
            <div className="bg-gray-900 rounded-2xl max-w-2xl w-full border border-teal-500/30 shadow-2xl shadow-teal-900/50">
              <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="text-teal-400" />
                  {lang === 'fa' ? 'تولید تایمینگ هوشمند (Google AI)' : 'AI Auto-Timing Generation'}
                </h3>
                <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-500/30">
                  <p className="text-blue-200 text-sm leading-relaxed">
                    {lang === 'fa'
                      ? 'به دلیل محدودیت‌های مرورگر، تولید تایمینگ باید توسط سرور انجام شود. لطفاً دستور زیر را کپی کرده و در ترمینال اجرا کنید:'
                      : 'Due to browser limitations, timing generation must be run on the server. Please copy and run this command in your terminal:'
                    }
                  </p>
                </div>

                <div className="bg-black/50 rounded-lg p-4 font-mono text-green-400 border border-gray-700 flex items-center justify-between group">
                  <code>node scripts/google-timing.cjs {song?.id || 'SONG_ID'}</code>
                  <button
                    onClick={copyAiCommand}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs"
                  >
                    Copy
                  </button>
                </div>

                <div className="flex flex-col items-center gap-4 pt-4">
                  <p className="text-gray-400 text-sm">
                    {lang === 'fa'
                      ? 'پس از اتمام اجرای دستور در ترمینال، دکمه زیر را بزنید:'
                      : 'After the command finishes in terminal, click below:'
                    }
                  </p>
                  <button
                    onClick={loadAiTiming}
                    className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-900/50 transition-all"
                  >
                    <Download size={24} />
                    {lang === 'fa' ? 'بارگذاری فایل تولید شده' : 'Load Generated Timing File'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default WorshipSongEditor;
