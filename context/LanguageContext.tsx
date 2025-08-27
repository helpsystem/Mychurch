
import React, { createContext, useState, ReactNode } from 'react';
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
