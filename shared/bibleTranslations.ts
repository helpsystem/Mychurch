/**
 * Bible Translations Configuration
 * 
 * This file defines all available Bible translations with their metadata.
 * Used by both frontend and backend for consistent behavior.
 * 
 * STRUCTURE:
 * - Bible
 *   └── Translations (MOJDEH, QADIM, NET, etc.)
 *       └── Books (66 books: Genesis to Revelation)
 *           └── Chapters (varies per book)
 *               └── Verses
 */

export interface BibleTranslation {
  code: string;                    // Unique identifier (MOJDEH, QADIM, NET, etc.)
  name: {
    en: string;                    // English name
    fa: string;                    // Persian name
  };
  language: 'fa' | 'en';           // Primary language
  hasAudio: boolean;               // Does this translation have audio files?
  audioSource?: string;            // Where audio comes from (hidrive, wordproject, etc.)
  audioFallback?: string;          // If no audio, which translation to use as fallback
  description?: {
    en: string;
    fa: string;
  };
  year?: number;                   // Year of translation
  isDefault?: boolean;             // Is this the default for its language?
}

/**
 * All available Bible translations
 */
export const BIBLE_TRANSLATIONS: Record<string, BibleTranslation> = {
  // ============================================
  // PERSIAN TRANSLATIONS
  // ============================================
  
  MOJDEH: {
    code: 'MOJDEH',
    name: {
      en: 'Mojdeh (Good News)',
      fa: 'مژده'
    },
    language: 'fa',
    hasAudio: true,
    audioSource: 'hidrive',
    description: {
      en: 'Modern Persian translation, easy to understand',
      fa: 'ترجمه مدرن فارسی، آسان برای درک'
    },
    year: 2007,
    isDefault: true
  },

  QADIM: {
    code: 'QADIM',
    name: {
      en: 'Qadim (Classical)',
      fa: 'قدیم (ترجمه کلاسیک)'
    },
    language: 'fa',
    hasAudio: false,
    audioFallback: 'MOJDEH',  // Use MOJDEH audio when playing
    description: {
      en: 'Classical Persian translation',
      fa: 'ترجمه کلاسیک فارسی'
    },
    year: 1895
  },

  TPV: {
    code: 'TPV',
    name: {
      en: "Today's Persian Version",
      fa: 'ترجمه نوین'
    },
    language: 'fa',
    hasAudio: false,
    audioFallback: 'MOJDEH',
    description: {
      en: "Today's Persian Version - modern language",
      fa: 'ترجمه امروز - زبان مدرن'
    },
    year: 2014
  },

  NMV: {
    code: 'NMV',
    name: {
      en: 'New Millennium Version',
      fa: 'ترجمه هزاره نو'
    },
    language: 'fa',
    hasAudio: false,
    audioFallback: 'MOJDEH',
    description: {
      en: 'New Millennium Persian translation',
      fa: 'ترجمه هزاره نو'
    },
    year: 2015
  },

  PCB: {
    code: 'PCB',
    name: {
      en: 'Persian Contemporary Bible',
      fa: 'کتاب مقدس معاصر'
    },
    language: 'fa',
    hasAudio: false,
    audioFallback: 'MOJDEH',
    description: {
      en: 'Contemporary Persian Bible',
      fa: 'کتاب مقدس به زبان فارسی معاصر'
    }
  },

  // ============================================
  // ENGLISH TRANSLATIONS
  // ============================================

  NET: {
    code: 'NET',
    name: {
      en: 'New English Translation',
      fa: 'ترجمه نوین انگلیسی'
    },
    language: 'en',
    hasAudio: false,  // No audio available yet
    audioFallback: undefined,
    description: {
      en: 'New English Translation with extensive notes',
      fa: 'ترجمه نوین انگلیسی با یادداشت‌های گسترده'
    },
    year: 1996,
    isDefault: true
  },

  KJV: {
    code: 'KJV',
    name: {
      en: 'King James Version',
      fa: 'ترجمه کینگ جیمز'
    },
    language: 'en',
    hasAudio: true,
    audioSource: 'wordproject',  // Available from WordProject
    description: {
      en: 'Traditional English translation from 1611',
      fa: 'ترجمه سنتی انگلیسی از سال ۱۶۱۱'
    },
    year: 1611
  },

  ESV: {
    code: 'ESV',
    name: {
      en: 'English Standard Version',
      fa: 'ترجمه استاندارد انگلیسی'
    },
    language: 'en',
    hasAudio: false,
    audioFallback: 'KJV',
    description: {
      en: 'Modern, literal English translation',
      fa: 'ترجمه مدرن و تحت‌اللفظی انگلیسی'
    },
    year: 2001
  },

  NIV: {
    code: 'NIV',
    name: {
      en: 'New International Version',
      fa: 'ترجمه بین‌المللی نوین'
    },
    language: 'en',
    hasAudio: false,
    audioFallback: 'KJV',
    description: {
      en: 'Popular modern English translation',
      fa: 'ترجمه محبوب مدرن انگلیسی'
    },
    year: 1978
  }
};

/**
 * Get translations by language
 */
export function getTranslationsByLanguage(language: 'fa' | 'en'): BibleTranslation[] {
  return Object.values(BIBLE_TRANSLATIONS).filter(t => t.language === language);
}

/**
 * Get default translation for a language
 */
export function getDefaultTranslation(language: 'fa' | 'en'): BibleTranslation | undefined {
  return Object.values(BIBLE_TRANSLATIONS).find(
    t => t.language === language && t.isDefault
  );
}

/**
 * Get the audio translation to use (handles fallback)
 * Returns the translation code that has audio
 */
export function getAudioTranslation(translationCode: string): string | null {
  const translation = BIBLE_TRANSLATIONS[translationCode.toUpperCase()];
  if (!translation) return null;
  
  if (translation.hasAudio) {
    return translation.code;
  }
  
  if (translation.audioFallback) {
    const fallback = BIBLE_TRANSLATIONS[translation.audioFallback];
    if (fallback?.hasAudio) {
      return fallback.code;
    }
  }
  
  return null;
}

/**
 * Check if a translation has audio (directly or via fallback)
 */
export function hasAudioAvailable(translationCode: string): boolean {
  return getAudioTranslation(translationCode) !== null;
}

/**
 * Get translation info for display
 */
export function getTranslationInfo(translationCode: string): BibleTranslation | null {
  return BIBLE_TRANSLATIONS[translationCode.toUpperCase()] || null;
}

/**
 * All Persian translations (for UI dropdowns)
 */
export const PERSIAN_TRANSLATIONS = getTranslationsByLanguage('fa');

/**
 * All English translations (for UI dropdowns)
 */
export const ENGLISH_TRANSLATIONS = getTranslationsByLanguage('en');

/**
 * Translation codes that have audio directly
 */
export const TRANSLATIONS_WITH_AUDIO = Object.values(BIBLE_TRANSLATIONS)
  .filter(t => t.hasAudio)
  .map(t => t.code);

// Export for CommonJS compatibility (backend)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BIBLE_TRANSLATIONS,
    getTranslationsByLanguage,
    getDefaultTranslation,
    getAudioTranslation,
    hasAudioAvailable,
    getTranslationInfo,
    PERSIAN_TRANSLATIONS,
    ENGLISH_TRANSLATIONS,
    TRANSLATIONS_WITH_AUDIO
  };
}
