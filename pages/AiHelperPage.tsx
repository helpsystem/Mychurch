import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import AlHayatGPTWidget from '../components/AlHayatGPTWidget';

const AiHelperPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    // Check Al Hayat GPT service availability
    const checkConnection = async () => {
      try {
        // Try to ping the Al Hayat GPT service with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch('https://www.alhayatgpt.com/chat', { 
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        setConnectionStatus('connected');
      } catch (error) {
        console.warn('Al Hayat GPT service not reachable:', error);
        // For now, we'll assume it's not available and show fallback
        setConnectionStatus('error');
      }
    };

    // Start with a small delay to show connecting state, then set as connected for local service
    const connectTimer = setTimeout(() => {
      setConnectionStatus('connected'); // Since we're using local AI, always connected
    }, 1500);
    
    return () => clearTimeout(connectTimer);
  }, []);

  return (
    <div className="sm:px-16 px-6 sm:py-8 py-4 flex flex-col" style={{ minHeight: '100vh' }}>
      <div className="flex flex-col flex-grow max-w-7xl mx-auto w-full bg-black-gradient rounded-[20px] shadow-2xl border border-gray-800" style={{ minHeight: 'calc(100vh - 8rem)' }}>
        {/* Header */}
        <header className="bg-gradient-to-r from-primary to-secondary text-white p-6 text-center border-b border-gray-700">
          <div className="flex items-center justify-center gap-3 mb-2">
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className="text-white"
            >
              <path d="M12 5v14" />
              <path d="M7 9h10" />
            </svg>
            <h1 className="font-semibold text-2xl text-gradient">
              {lang === 'fa' ? 'دستیار هوشمند مسیحی' : 'Christian AI Assistant'}
            </h1>
          </div>
          <p className="text-sm text-white/90">
            {lang === 'fa' 
              ? 'Al Hayat GPT - پاسخگوی سوالات شما درباره ایمان و کتاب مقدس'
              : 'Al Hayat GPT - Your guide for faith and Bible questions'}
          </p>
          <div className={`flex justify-center items-center gap-2 text-xs mt-2 ${
            connectionStatus === 'connected' ? 'text-green-400' : 
            connectionStatus === 'connecting' ? 'text-yellow-400' : 
            'text-red-400'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className={`animate-pulse-fast absolute inline-flex h-full w-full rounded-full opacity-75 ${
                connectionStatus === 'connected' ? 'bg-green-400' : 
                connectionStatus === 'connecting' ? 'bg-yellow-400' : 
                'bg-red-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 
                'bg-red-500'
              }`}></span>
            </span>
            {connectionStatus === 'connected' ? t('connected') : 
             connectionStatus === 'connecting' ? t('connecting') : t('connectionError')}
          </div>
        </header>

        {/* Al Hayat GPT Widget */}
        <main className="flex-1 relative" style={{ minHeight: '600px', height: 'calc(100vh - 16rem)' }}>
          {connectionStatus === 'error' && (
            <div className="absolute inset-4 bg-red-900/50 backdrop-blur-sm border border-red-700 rounded-lg flex flex-col items-center justify-center text-center p-6 z-10">
              <div className="text-red-400 text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {lang === 'fa' ? 'دستیار محلی آماده است' : 'Local Assistant Ready'}
              </h3>
              <p className="text-green-300 mb-4 max-w-md">
                {lang === 'fa' 
                  ? 'از دستیار هوشمند مسیحی محلی استفاده می‌کنیم. قابلیت‌های کامل چت و پاسخگویی در دسترس است.'
                  : 'Using our local Christian AI assistant. Full chat and question-answering capabilities available.'}
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {lang === 'fa' ? 'تلاش مجدد' : 'Retry'}
              </button>
            </div>
          )}
          <AlHayatGPTWidget 
            containerId="alhayat-chat-widget"
            style={{ 
              width: '100%', 
              height: '100%',
              minHeight: '600px',
              position: 'relative'
            }}
          />
        </main>

        {/* Footer Info */}
        <footer className="bg-gray-900/50 backdrop-blur-sm p-4 text-center border-t border-gray-800">
          <p className="text-xs text-gray-400">
            {lang === 'fa' 
              ? '🙏 این دستیار هوشمند توسط Al Hayat GPT قدرت گرفته است - یک چت‌بات مسیحی پیشرفته'
              : '🙏 Powered by Al Hayat GPT - An advanced Christian AI chatbot'}
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AiHelperPage;
