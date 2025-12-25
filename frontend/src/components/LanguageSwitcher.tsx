import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { USFlagIcon, IranFlagIcon } from './FlagIcons';

const LanguageSwitcher: React.FC = () => {
  const { lang, setLang } = useLanguage();

  const toggleLanguage = () => {
    setLang(lang === 'fa' ? 'en' : 'fa');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="group relative flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer"
      aria-label={lang === 'fa' ? 'Switch to English' : 'تغییر به فارسی'}
    >
      {/* Current Language - Large & Prominent */}
      <div className="flex items-center gap-2">
        {lang === 'fa' ? (
          <>
            <IranFlagIcon className="w-7 h-5 rounded shadow-md ring-2 ring-white/50" />
            <span className="text-white font-bold text-sm">فارسی</span>
          </>
        ) : (
          <>
            <USFlagIcon className="w-7 h-5 rounded shadow-md ring-2 ring-white/50" />
            <span className="text-white font-bold text-sm">English</span>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-white/30" />

      {/* Other Language - Small & Dimmed */}
      <div className="flex items-center gap-1 opacity-50 group-hover:opacity-80 transition-opacity duration-300">
        {lang === 'fa' ? (
          <>
            <USFlagIcon className="w-4 h-3 rounded shadow-sm" />
            <span className="text-white/70 text-xs hidden sm:inline">EN</span>
          </>
        ) : (
          <>
            <IranFlagIcon className="w-4 h-3 rounded shadow-sm" />
            <span className="text-white/70 text-xs hidden sm:inline">FA</span>
          </>
        )}
      </div>
    </button>
  );
};

export default LanguageSwitcher;

