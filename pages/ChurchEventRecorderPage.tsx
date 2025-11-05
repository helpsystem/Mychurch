import React, { useState, useCallback, useRef } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useGeminiLive } from '@/hooks/useGeminiLive';
import { ConnectionState, ConversationRole } from '@/types/audioSync';
import AudioVisualizer from '@/components/AudioSync/AudioVisualizer';
import axios from 'axios';

const ChurchEventRecorderPage: React.FC = () => {
  const { lang } = useLanguage();
  const { connectionState, transcript, analyserNode, startSession, closeSession, errorMessage } = useGeminiLive();

  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<'worship' | 'sermon' | 'prayer' | 'other'>('worship');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);

  const isRecording = connectionState === ConnectionState.CONNECTED;

  const handleStartRecording = useCallback(() => {
    if (!eventTitle.trim()) {
      alert(lang === 'fa' ? 'لطفاً عنوان جلسه را وارد کنید' : 'Please enter event title');
      return;
    }
    recordingStartTimeRef.current = Date.now();
    startSession();
  }, [eventTitle, lang, startSession]);

  const handleStopRecording = useCallback(() => {
    closeSession();
  }, [closeSession]);

  const handleSaveEvent = useCallback(async () => {
    if (transcript.length === 0) {
      alert(lang === 'fa' ? 'هیچ محتوایی برای ذخیره وجود ندارد' : 'No content to save');
      return;
    }

    setIsSaving(true);
    setSaveStatus(lang === 'fa' ? 'در حال ذخیره‌سازی...' : 'Saving...');

    try {
      // Combine transcript
      const fullTranscript = transcript
        .map((entry) => `${entry.role === ConversationRole.USER ? 'Speaker' : 'AI'}: ${entry.text}`)
        .join('\n\n');

      // Calculate duration
      const duration = recordingStartTimeRef.current
        ? Math.floor((Date.now() - recordingStartTimeRef.current) / 1000)
        : 0;

      // Prepare event data
      const eventData = {
        title: eventTitle,
        type: eventType,
        date: new Date().toISOString(),
        duration_seconds: duration,
        transcript: fullTranscript,
        summary: `Recorded ${eventType} session: ${eventTitle}. Duration: ${Math.floor(duration / 60)} minutes.`,
        speaker_count: transcript.filter(e => e.role === ConversationRole.USER).length,
        word_count: fullTranscript.split(' ').length
      };

      // Save to database via API
      const response = await axios.post('/api/events/record-session', eventData);

      setSaveStatus(
        lang === 'fa'
          ? `✅ جلسه با موفقیت ذخیره شد! (ID: ${response.data.id})`
          : `✅ Session saved successfully! (ID: ${response.data.id})`
      );

      // Reset form after 3 seconds
      setTimeout(() => {
        setEventTitle('');
        setSaveStatus(null);
      }, 3000);

    } catch (error) {
      console.error('Error saving event:', error);
      setSaveStatus(lang === 'fa' ? '❌ خطا در ذخیره‌سازی' : '❌ Error saving event');
    } finally {
      setIsSaving(false);
    }
  }, [transcript, eventTitle, eventType, lang]);

  const getStatusText = () => {
    if (connectionState === ConnectionState.ERROR && errorMessage) {
      return errorMessage;
    }
    switch (connectionState) {
      case ConnectionState.IDLE:
        return lang === 'fa' ? 'آماده برای ضبط' : 'Ready to record';
      case ConnectionState.CONNECTING:
        return lang === 'fa' ? 'در حال اتصال...' : 'Connecting...';
      case ConnectionState.CONNECTED:
        return lang === 'fa' ? '🔴 در حال ضبط...' : '🔴 Recording...';
      case ConnectionState.CLOSING:
        return lang === 'fa' ? 'در حال قطع اتصال...' : 'Disconnecting...';
      case ConnectionState.CLOSED:
        return lang === 'fa' ? 'ضبط پایان یافت' : 'Recording ended';
      case ConnectionState.ERROR:
        return lang === 'fa' ? 'خطا در اتصال' : 'Connection error';
      default:
        return lang === 'fa' ? 'آماده' : 'Ready';
    }
  };

  const getStatusColor = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTING:
        return 'text-yellow-400';
      case ConnectionState.CONNECTED:
        return 'text-red-400 animate-pulse';
      case ConnectionState.ERROR:
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
          <h1 className="text-4xl font-bold text-white mb-4">
            {lang === 'fa' ? '🎙️ ضبط جلسات کلیسا' : '🎙️ Church Event Recorder'}
          </h1>
          <p className="text-red-200 text-lg max-w-3xl mx-auto">
            {lang === 'fa'
              ? 'ضبط زنده جلسات عبادت، موعظه، و دعا با Transcript خودکار و خلاصه‌سازی'
              : 'Live recording of worship, sermons, and prayer with automatic transcription and summarization'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Panel - Event Info */}
          <div className="md:col-span-1 space-y-6" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            {/* Event Settings */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {lang === 'fa' ? '⚙️ تنظیمات جلسه' : '⚙️ Event Settings'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-red-300 mb-2 font-semibold">
                    {lang === 'fa' ? 'عنوان جلسه:' : 'Event Title:'}
                  </label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder={lang === 'fa' ? 'مثال: عبادت صبح یکشنبه' : 'Example: Sunday Morning Worship'}
                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                    disabled={isRecording}
                  />
                </div>

                <div>
                  <label className="block text-red-300 mb-2 font-semibold">
                    {lang === 'fa' ? 'نوع جلسه:' : 'Event Type:'}
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                    disabled={isRecording}
                  >
                    <option value="worship">{lang === 'fa' ? '🎵 عبادت' : '🎵 Worship'}</option>
                    <option value="sermon">{lang === 'fa' ? '📖 موعظه' : '📖 Sermon'}</option>
                    <option value="prayer">{lang === 'fa' ? '🙏 دعا' : '🙏 Prayer'}</option>
                    <option value="other">{lang === 'fa' ? '🔷 سایر' : '🔷 Other'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Recording Stats */}
            {isRecording && (
              <div className="bg-red-900/30 backdrop-blur-md rounded-lg p-6 border border-red-600">
                <h2 className="text-xl font-bold text-red-300 mb-4">
                  {lang === 'fa' ? '📊 آمار ضبط' : '📊 Recording Stats'}
                </h2>
                <div className="space-y-2 text-red-100">
                  <div className="flex justify-between">
                    <span>{lang === 'fa' ? 'مدت زمان:' : 'Duration:'}</span>
                    <span className="font-bold">
                      {recordingStartTimeRef.current
                        ? formatDuration(Math.floor((Date.now() - recordingStartTimeRef.current) / 1000))
                        : '0:00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{lang === 'fa' ? 'تعداد گفتار:' : 'Segments:'}</span>
                    <span className="font-bold">{transcript.length}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Info Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {lang === 'fa' ? '💡 راهنما' : '💡 Guide'}
              </h2>
              <ul className="space-y-2 text-white text-sm">
                <li>1. {lang === 'fa' ? 'عنوان و نوع جلسه را وارد کنید' : 'Enter title and event type'}</li>
                <li>2. {lang === 'fa' ? 'روی "شروع ضبط" کلیک کنید' : 'Click "Start Recording"'}</li>
                <li>3. {lang === 'fa' ? 'شروع به صحبت کنید' : 'Start speaking'}</li>
                <li>4. {lang === 'fa' ? 'پس از پایان، "توقف" کنید' : 'When done, click "Stop"'}</li>
                <li>5. {lang === 'fa' ? 'جلسه را ذخیره کنید' : 'Save the session'}</li>
              </ul>
            </div>
          </div>

          {/* Right Panel - Recording Interface */}
          <div className="md:col-span-2">
            <div className="bg-gray-900/80 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden border border-gray-700">
              {/* Transcript Area */}
              <div className="h-[50vh] p-4 md:p-6 overflow-y-auto bg-gray-800/50">
                <div className="space-y-4">
                  {transcript.length === 0 && (
                    <div className="text-center text-gray-500 pt-16">
                      <p>
                        {lang === 'fa'
                          ? 'Transcript جلسه اینجا نمایش داده می‌شود'
                          : 'Session transcript will appear here'}
                      </p>
                    </div>
                  )}
                  {transcript.map((entry) => (
                    <div
                      key={entry.id}
                      className={`flex items-start gap-3 ${
                        entry.role === ConversationRole.USER ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {entry.role === ConversationRole.MODEL && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-500 to-orange-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                          AI
                        </div>
                      )}
                      <div
                        className={`max-w-xl p-3 rounded-xl ${
                          entry.role === ConversationRole.USER
                            ? 'bg-blue-600 rounded-br-none'
                            : 'bg-gray-700 rounded-bl-none'
                        }`}
                      >
                        <p className="text-white text-sm">{entry.text}</p>
                      </div>
                      {entry.role === ConversationRole.USER && (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                          👤
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Controls Area */}
              <div className="flex-shrink-0 bg-gray-800 border-t border-gray-700 p-4 space-y-4">
                {/* Audio Visualizer */}
                <div className="h-20 flex items-center justify-center bg-gray-900/50 rounded-lg">
                  <AudioVisualizer analyserNode={analyserNode} isActive={isRecording} />
                </div>

                {/* Status */}
                <div className="text-center">
                  <p className={`text-lg font-bold ${getStatusColor()}`}>{getStatusText()}</p>
                </div>

                {/* Control Buttons */}
                <div className="flex gap-4">
                  {!isRecording ? (
                    <button
                      onClick={handleStartRecording}
                      disabled={!eventTitle.trim()}
                      className="flex-1 py-4 rounded-lg font-bold text-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {lang === 'fa' ? '🔴 شروع ضبط' : '🔴 Start Recording'}
                    </button>
                  ) : (
                    <button
                      onClick={handleStopRecording}
                      className="flex-1 py-4 rounded-lg font-bold text-lg bg-gray-600 hover:bg-gray-700 text-white transition-all"
                    >
                      {lang === 'fa' ? '⏹️ توقف ضبط' : '⏹️ Stop Recording'}
                    </button>
                  )}

                  <button
                    onClick={handleSaveEvent}
                    disabled={transcript.length === 0 || isSaving || isRecording}
                    className="flex-1 py-4 rounded-lg font-bold text-lg bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSaving
                      ? lang === 'fa'
                        ? '⏳ در حال ذخیره...'
                        : '⏳ Saving...'
                      : lang === 'fa'
                      ? '💾 ذخیره جلسه'
                      : '💾 Save Session'}
                  </button>
                </div>

                {/* Save Status */}
                {saveStatus && (
                  <div
                    className={`p-4 rounded-lg text-center font-semibold ${
                      saveStatus.includes('✅')
                        ? 'bg-green-900/50 text-green-200'
                        : 'bg-red-900/50 text-red-200'
                    }`}
                  >
                    {saveStatus}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Technical Info */}
        <div className="mt-8 text-center text-red-300/60 text-sm">
          <p>
            Powered by Gemini Live API •{' '}
            {lang === 'fa' ? 'ضبط و Transcript خودکار جلسات کلیسا' : 'Automatic recording and transcription'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChurchEventRecorderPage;
