import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import AlHayatGPTWidget from '../components/AlHayatGPTWidget';

const AiHelperPage: React.FC = () => {
  const { t, lang } = useLanguage();

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
          <div className="flex justify-center items-center gap-2 text-xs text-green-400 mt-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-pulse-fast absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            {t('connected')}
          </div>
        </header>

        {/* Al Hayat GPT Widget */}
        <main className="flex-1 relative" style={{ minHeight: '600px', height: 'calc(100vh - 16rem)' }}>
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
