import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { USFlagIcon, IranFlagIcon } from './FlagIcons';

const LanguageSwitcher: React.FC = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="relative flex w-32 items-center rounded-full bg-primary p-1 border border-gray-700">
      {/* Positioner for the moving highlight */}
      <div className="absolute inset-0">
        <span
          className="absolute top-0 left-0 h-full w-1/2 rounded-full bg-blue-gradient transition-transform duration-300 ease-in-out shadow-lg"
          style={{
            transform: `translateX(${lang === 'en' ? '0%' : '100%'})`,
          }}
          aria-hidden="true"
        />
      </div>

      {/* Buttons */}
      <button
        onClick={() => setLang('en')}
        className="relative z-10 flex w-1/2 items-center justify-center gap-1.5 py-1.5 text-sm font-medium transition-all duration-300"
        aria-label="Switch to English"
        aria-pressed={lang === 'en'}
      >
        <USFlagIcon className={`w-5 h-4 rounded-sm shadow-sm ${lang === 'en' ? 'ring-1 ring-white/50' : ''}`} />
        <span className={`${lang === 'en' ? 'text-white font-semibold' : 'text-dimWhite'} transition-colors duration-300`}>EN</span>
      </button>

      <button
        onClick={() => setLang('fa')}
        className="relative z-10 flex w-1/2 items-center justify-center gap-1.5 py-1.5 text-sm font-medium transition-all duration-300"
        aria-label="Switch to Farsi"
        aria-pressed={lang === 'fa'}
      >
        <IranFlagIcon className={`w-5 h-4 rounded-sm shadow-sm ${lang === 'fa' ? 'ring-1 ring-white/50' : ''}`} />
        <span className={`${lang === 'fa' ? 'text-white font-semibold' : 'text-dimWhite'} transition-colors duration-300`}>FA</span>
      </button>
    </div>
  );
};

export default LanguageSwitcher;

