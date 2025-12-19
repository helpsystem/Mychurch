import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { 
  Music, Save, X, Upload, Clock, FileText, Volume2, 
  Eye, EyeOff, Play, Pause, SkipBack, SkipForward,
  Download, Trash2, Plus, AlertCircle, CheckCircle
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
  lyrics: { fa: string; en: string };
  chords?: string;
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
  const audioRef = useRef<HTMLAudioElement>(null);

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

  // Handle Save
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
              {/* Lyrics */}
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">
                  {lang === 'fa' ? 'متن و آکوردها' : 'Lyrics & Chords'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2 font-semibold">
                      {lang === 'fa' ? 'متن فارسی با آکوردها' : 'Persian Lyrics with Chords'}
                    </label>
                    <textarea
                      value={formData.lyrics.fa}
                      onChange={(e) => setFormData({ ...formData, lyrics: { ...formData.lyrics, fa: e.target.value } })}
                      rows={12}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-purple-500"
                      dir="rtl"
                      placeholder="[C]الشدای الشدای&#10;[Dm]ال الــیون [G]ادونای&#10;..."
                    />
                    <p className="text-gray-500 text-sm mt-2">
                      {lang === 'fa' 
                        ? '💡 نکته: آکوردها را داخل [] قرار دهید. مثال: [C], [Dm], [G]'
                        : '💡 Tip: Place chords inside []. Example: [C], [Dm], [G]'
                      }
                    </p>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2 font-semibold">
                      {lang === 'fa' ? 'متن انگلیسی' : 'English Lyrics'}
                    </label>
                    <textarea
                      value={formData.lyrics.en}
                      onChange={(e) => setFormData({ ...formData, lyrics: { ...formData.lyrics, en: e.target.value } })}
                      rows={8}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
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

            {showTimingRecorder && (
              <div className="bg-gray-900/80 rounded-xl p-6 border border-gray-700">
                {!formData.audioUrl ? (
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
                  <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-900/30 rounded-lg p-4 text-center border border-blue-500/30">
                        <div className="text-3xl font-bold text-blue-400">{words.length}</div>
                        <div className="text-gray-400 text-sm">{lang === 'fa' ? 'کل کلمات' : 'Total Words'}</div>
                      </div>
                      <div className="bg-green-900/30 rounded-lg p-4 text-center border border-green-500/30">
                        <div className="text-3xl font-bold text-green-400">{recordedWords.length}</div>
                        <div className="text-gray-400 text-sm">{lang === 'fa' ? 'ضبط شده' : 'Recorded'}</div>
                      </div>
                      <div className="bg-purple-900/30 rounded-lg p-4 text-center border border-purple-500/30">
                        <div className="text-3xl font-bold text-purple-400">
                          {Math.round((recordedWords.length / words.length) * 100)}%
                        </div>
                        <div className="text-gray-400 text-sm">{lang === 'fa' ? 'پیشرفت' : 'Progress'}</div>
                      </div>
                    </div>

                    {/* Current Word Display */}
                    <div className="bg-gray-800 rounded-xl p-8 text-center border-2 border-purple-500/50">
                      <div className="text-gray-400 text-sm mb-2">
                        {lang === 'fa' ? 'کلمه فعلی:' : 'Current Word:'}
                      </div>
                      <div className="text-5xl font-bold text-white mb-4" dir="rtl">
                        {currentWordIndex < words.length ? words[currentWordIndex] : '✅ تمام'}
                      </div>
                      <div className="text-gray-500">
                        {currentWordIndex + 1} / {words.length}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-4">
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
                    {timingData && (
                      <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="text-green-400" size={20} />
                          <h4 className="font-bold text-green-300">
                            {lang === 'fa' ? '✅ تایمینگ آماده است!' : '✅ Timing Ready!'}
                          </h4>
                        </div>
                        <div className="text-gray-300 text-sm">
                          {lang === 'fa' 
                            ? `${timingData.lines.length} خط، ${timingData.words.length} کلمه ضبط شد`
                            : `${timingData.lines.length} lines, ${timingData.words.length} words recorded`
                          }
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="mt-6 flex justify-end gap-4 bg-gray-900/50 rounded-xl p-6 border border-gray-700">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorshipSongEditor;
