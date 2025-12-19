import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

const LanguageSwitcher: React.FC = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="relative flex w-32 items-center rounded-full bg-primary p-1 border border-gray-700">
      {/* Positioner for the moving highlight */}
      <div className="absolute inset-0">
        <span
          className="absolute top-0 left-0 h-full w-1/2 rounded-full bg-blue-gradient transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(${lang === 'en' ? '0%' : '100%'})`,
          }}
          aria-hidden="true"
        />
      </div>

      {/* Buttons */}
      <button
        onClick={() => setLang('en')}
        className="relative z-10 flex w-1/2 items-center justify-center gap-1 py-1 text-sm font-medium"
        aria-label="Switch to English"
        aria-pressed={lang === 'en'}
      >
        <span>🇺🇸</span>
        <span className={`${lang === 'en' ? 'text-primary' : 'text-dimWhite'} transition-colors duration-300`}>EN</span>
      </button>

      <button
        onClick={() => setLang('fa')}
        className="relative z-10 flex w-1/2 items-center justify-center gap-1 py-1 text-sm font-medium"
        aria-label="Switch to Farsi"
        aria-pressed={lang === 'fa'}
      >
        <span>🇮🇷</span>
        <span className={`${lang === 'fa' ? 'text-primary' : 'text-dimWhite'} transition-colors duration-300`}>FA</span>
      </button>
    </div>
  );
};

export default LanguageSwitcher;
