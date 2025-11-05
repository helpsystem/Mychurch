import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useGeminiLive } from '@/hooks/useGeminiLive';
import { ConnectionState, ConversationRole } from '@/types/audioSync';
import AudioVisualizer from '@/components/AudioSync/AudioVisualizer';

const StartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5h1.5v-1.5a.75.75 0 0 1 .75-.75h1.5v-1.5Zm9.75 0h1.5a.75.75 0 0 1 .75.75V6h1.5V6A2.25 2.25 0 0 0 18 3.75h-1.5v-1.5ZM12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5ZM10.5 12a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
    <path fillRule="evenodd" d="M4.5 9.75A.75.75 0 0 1 5.25 9h13.5a.75.75 0 0 1 0 1.5H5.25a.75.75 0 0 1-.75-.75Zm0 4.5a.75.75 0 0 1 .75-.75h13.5a.75.75 0 0 1 0 1.5H5.25a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
  </svg>
);

const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" />
  </svg>
);

const BibleVoiceChatPage: React.FC = () => {
  const { lang } = useLanguage();
  const { connectionState, transcript, analyserNode, startSession, closeSession, errorMessage } = useGeminiLive();

  const isSessionActive = connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING;

  const getStatusText = () => {
    if (connectionState === ConnectionState.ERROR && errorMessage) {
      return errorMessage;
    }
    switch (connectionState) {
      case ConnectionState.IDLE: 
        return lang === 'fa' ? 'آماده برای شروع' : 'Ready to start';
      case ConnectionState.CONNECTING: 
        return lang === 'fa' ? 'در حال اتصال...' : 'Connecting...';
      case ConnectionState.CONNECTED: 
        return lang === 'fa' ? 'متصل شد. شروع به صحبت کنید.' : 'Connected. Start speaking.';
      case ConnectionState.CLOSING: 
        return lang === 'fa' ? 'در حال قطع اتصال...' : 'Disconnecting...';
      case ConnectionState.CLOSED: 
        return lang === 'fa' ? 'جلسه پایان یافت. برای شروع کلیک کنید.' : 'Session ended. Click to start again.';
      case ConnectionState.ERROR: 
        return lang === 'fa' ? 'خطا در اتصال. لطفاً دوباره تلاش کنید.' : 'Connection error. Please try again.';
      default: 
        return lang === 'fa' ? 'آماده' : 'Ready';
    }
  };

  const getStatusColor = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTING: return 'text-yellow-400';
      case ConnectionState.CONNECTED: return 'text-green-400';
      case ConnectionState.ERROR: return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
          <h1 className="text-4xl font-bold text-white mb-4">
            {lang === 'fa' ? '🎙️ گفتگوی صوتی با هوش مصنوعی' : '🎙️ Live Voice Chat with AI'}
          </h1>
          <p className="text-purple-200 text-lg max-w-3xl mx-auto">
            {lang === 'fa'
              ? 'با Gemini AI گفتگوی صوتی زنده داشته باشید - برای کتاب مقدس، سرودها، و موعظه‌ها'
              : 'Have a live voice conversation with Gemini AI - for Bible, worship songs, and sermons'}
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-8" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
          <h2 className="text-xl font-semibold text-purple-300 mb-4">
            {lang === 'fa' ? '💡 نحوه استفاده:' : '💡 How to Use:'}
          </h2>
          <ul className="space-y-2 text-purple-100">
            <li className="flex items-start gap-2">
              <span className="text-purple-400">1.</span>
              <span>
                {lang === 'fa'
                  ? 'روی دکمه میکروفون کلیک کنید تا اجازه دسترسی به صدا بدهید'
                  : 'Click the microphone button to grant audio access'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">2.</span>
              <span>
                {lang === 'fa'
                  ? 'شروع به صحبت کنید - سوالات خود را درباره کتاب مقدس، سرودها یا موعظه‌ها بپرسید'
                  : 'Start speaking - ask questions about Bible, worship songs, or sermons'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400">3.</span>
              <span>
                {lang === 'fa'
                  ? 'Gemini AI پاسخ‌های صوتی و متنی می‌دهد'
                  : 'Gemini AI responds with audio and text'}
              </span>
            </li>
          </ul>
        </div>

        {/* Conversation Container */}
        <div className="bg-gray-900/80 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden border border-gray-700">
          {/* Chat Messages Area */}
          <div className="h-[50vh] p-4 md:p-6 overflow-y-auto bg-gray-800/50">
            <div className="space-y-4">
              {transcript.length === 0 && (
                <div className="text-center text-gray-500 pt-16">
                  <p>
                    {lang === 'fa'
                      ? 'گفتگوی شما اینجا نمایش داده می‌شود.'
                      : 'Your conversation will appear here.'}
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center text-white font-bold">
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
                    <p className="text-white">{entry.text}</p>
                  </div>
                  {entry.role === ConversationRole.USER && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-white font-bold">
                      {lang === 'fa' ? 'من' : 'Me'}
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
              <AudioVisualizer analyserNode={analyserNode} isActive={isSessionActive} />
            </div>

            {/* Status & Control Button */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className={`text-sm font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </p>
              </div>
              <button
                onClick={isSessionActive ? closeSession : startSession}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 flex items-center gap-2 ${
                  isSessionActive
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                }`}
              >
                {isSessionActive ? <StopIcon /> : <StartIcon />}
                <span>
                  {isSessionActive
                    ? lang === 'fa'
                      ? 'توقف'
                      : 'Stop'
                    : lang === 'fa'
                    ? 'شروع گفتگو'
                    : 'Start Conversation'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Technical Info */}
        <div className="mt-8 text-center text-purple-300/60 text-sm">
          <p>
            Powered by Google Gemini Live API •{' '}
            {lang === 'fa' ? 'گفتگوی صوتی Real-time با AI' : 'Real-time voice conversation with AI'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BibleVoiceChatPage;
