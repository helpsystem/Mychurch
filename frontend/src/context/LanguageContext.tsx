
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Language, LanguageContextType } from '../types';
import { getTranslation } from '../lib/i18n';

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('fa');

  const t = (key: string): string => {
    return getTranslation(key, lang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the Language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
