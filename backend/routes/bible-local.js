/**
 * Bible Local Content API - Serves Bible content with HiDrive audio integration
 * 
 * UPDATED: Uses shared translation config for proper audio handling
 * 
 * BIBLE STRUCTURE:
 * - Bible
 *   └── Translations (MOJDEH, QADIM, NET, etc.)
 *       └── Books (66 books: Genesis to Revelation)
 *           └── Chapters (varies per book)
 *               └── Verses
 * 
 * AUDIO NOTES:
 * - Each translation may or may not have audio
 * - Translations without audio use a fallback (e.g., QADIM → MOJDEH)
 * - Audio files are stored on HiDrive
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// ============================================
// TRANSLATION CONFIGURATION
// ============================================
const BIBLE_TRANSLATIONS = {
    // Persian Translations
    MOJDEH: {
        code: 'MOJDEH',
        language: 'fa',
        hasAudio: true,
        audioSource: 'hidrive',
        audioFallback: null,
        name: { en: 'Mojdeh (Good News)', fa: 'مژده' }
    },
    QADIM: {
        code: 'QADIM',
        language: 'fa',
        hasAudio: false,
        audioFallback: 'MOJDEH',
        name: { en: 'Qadim (Classical)', fa: 'قدیم' }
    },
    TPV: {
        code: 'TPV',
        language: 'fa',
        hasAudio: true,
        audioSource: 'hidrive',
        audioFallback: null,
        name: { en: "Today's Persian Version", fa: 'ترجمه نوین' }
    },
    NMV: {
        code: 'NMV',
        language: 'fa',
        hasAudio: false,
        audioFallback: 'MOJDEH',
        name: { en: 'New Millennium Version', fa: 'هزاره نو' }
    },
    PCB: {
        code: 'PCB',
        language: 'fa',
        hasAudio: false,
        audioFallback: 'MOJDEH',
        name: { en: 'Persian Contemporary Bible', fa: 'معاصر' }
    },
    // English Translations
    NET: {
        code: 'NET',
        language: 'en',
        hasAudio: false,
        audioFallback: null,
        name: { en: 'New English Translation', fa: 'NET' }
    },
    KJV: {
        code: 'KJV',
        language: 'en',
        hasAudio: true,
        audioSource: 'wordproject',
        audioFallback: null,
        name: { en: 'King James Version', fa: 'کینگ جیمز' }
    },
    ESV: {
        code: 'ESV',
        language: 'en',
        hasAudio: false,
        audioFallback: 'KJV',
        name: { en: 'English Standard Version', fa: 'ESV' }
    }
};

/**
 * Get the translation to use for audio (handles fallback)
 */
function getAudioTranslation(translationCode) {
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
 * Get translation info
 */
function getTranslationInfo(translationCode) {
    return BIBLE_TRANSLATIONS[translationCode.toUpperCase()] || null;
}

// Determine if we're in production or development
const isProduction = process.env.NODE_ENV === 'production';

// Path to Bible text files - check both locations
// Production: dist/text/bible (after Vite build)
// Development: frontend/public/text/bible
const BIBLE_TEXT_DIRS = [
    path.join(__dirname, '../../dist/text/bible'),           // Production (built)
    path.join(__dirname, '../../frontend/public/text/bible'), // Development
    path.join(__dirname, '../../public/text/bible')           // Alternative (legacy)
];

// Path to timing files - matches file structure: bible_data/timestamps/{TRANSLATION}/{BOOK}/{CHAPTER}.json
const BIBLE_TIMING_DIRS = [
    path.join(__dirname, '../../dist/bible_data/timestamps'),          // Production (built)
    path.join(__dirname, '../../public/bible_data/timestamps'),        // Development (public)
    path.join(__dirname, '../../frontend/public/bible_data/timestamps') // Development (frontend/public)
];

// USFM code mapping (3-letter) to numeric book code (01-66)
const USFM_TO_NUMERIC = {
    'GEN': '01', 'EXO': '02', 'LEV': '03', 'NUM': '04', 'DEU': '05',
    'JOS': '06', 'JDG': '07', 'RUT': '08', '1SA': '09', '2SA': '10',
    '1KI': '11', '2KI': '12', '1CH': '13', '2CH': '14', 'EZR': '15',
    'NEH': '16', 'EST': '17', 'JOB': '18', 'PSA': '19', 'PRO': '20',
    'ECC': '21', 'SNG': '22', 'ISA': '23', 'JER': '24', 'LAM': '25',
    'EZK': '26', 'DAN': '27', 'HOS': '28', 'JOL': '29', 'AMO': '30',
    'OBA': '31', 'JON': '32', 'MIC': '33', 'NAM': '34', 'HAB': '35',
    'ZEP': '36', 'HAG': '37', 'ZEC': '38', 'MAL': '39',
    'MAT': '40', 'MRK': '41', 'LUK': '42', 'JHN': '43', 'ACT': '44',
    'ROM': '45', '1CO': '46', '2CO': '47', 'GAL': '48', 'EPH': '49',
    'PHP': '50', 'COL': '51', '1TH': '52', '2TH': '53', '1TI': '54',
    '2TI': '55', 'TIT': '56', 'PHM': '57', 'HEB': '58', 'JAS': '59',
    '1PE': '60', '2PE': '61', '1JN': '62', '2JN': '63', '3JN': '64',
    'JUD': '65', 'REV': '66'
};

/**
 * GET /api/bible-local/translations
 * Returns list of available translations with their metadata
 */
router.get('/translations', (req, res) => {
    const translations = Object.values(BIBLE_TRANSLATIONS).map(t => ({
        code: t.code,
        name: t.name,
        language: t.language,
        hasAudio: t.hasAudio,
        audioFallback: t.audioFallback,
        hasAudioAvailable: !!getAudioTranslation(t.code)
    }));

    res.json({
        success: true,
        translations,
        persian: translations.filter(t => t.language === 'fa'),
        english: translations.filter(t => t.language === 'en')
    });
});

/**
 * GET /api/bible-local/content/:translation/:book/:chapter
 * Serves chapter text from public/text/bible with HiDrive audio URLs
 * 
 * FILE STRUCTURE:
 * - Translation-specific: public/text/bible/{TRANSLATION}/{book}/{chapter}.json
 * - Language fallback: public/text/bible/{lang}/{book}/{chapter}.json
 * 
 * NOTE: Currently all Persian translations share the same text files under 'fa' folder.
 * To have different text per translation, create folders like MOJDEH/, QADIM/, TPV/
 */
router.get('/content/:translation/:book/:chapter', async (req, res) => {
    try {
        const { translation, book, chapter } = req.params;
        const bookUpper = book.toUpperCase();
        const translationUpper = translation.toUpperCase();

        // Get translation info
        const translationInfo = getTranslationInfo(translationUpper);
        const lang = translationInfo?.language || (
            ['MOJDEH', 'QADIM', 'TPV', 'NMV', 'PCB'].includes(translationUpper) ? 'fa' : 'en'
        );

        // Convert USFM code (GEN, EXO...) to numeric (01, 02...)
        const numericCode = USFM_TO_NUMERIC[bookUpper] || bookUpper;

        let textData;
        let textSource = 'translation'; // Track which source was used
        let foundPath = null;

        // Build paths to try for EACH base directory (production and development)
        const pathsToTry = [];
        for (const baseDir of BIBLE_TEXT_DIRS) {
            // Try translation-specific folder first (USFM code like GEN)
            pathsToTry.push({
                path: path.join(baseDir, translationUpper, bookUpper, `${chapter}.json`),
                source: 'translation'
            });
            // Then try translation-specific folder (numeric code like 01)
            pathsToTry.push({
                path: path.join(baseDir, translationUpper, numericCode, `${chapter}.json`),
                source: 'translation'
            });
            // Finally try language folder fallback
            pathsToTry.push({
                path: path.join(baseDir, lang, numericCode, `${chapter}.json`),
                source: 'language'
            });
        }

        for (const { path: tryPath, source } of pathsToTry) {
            try {
                const fileContent = await fs.readFile(tryPath, 'utf-8');
                textData = JSON.parse(fileContent);
                textSource = source;
                foundPath = tryPath;
                console.log(`📖 Bible: Loaded ${translationUpper} from ${source} folder: ${tryPath}`);
                break;
            } catch (e) {
                // Continue to next path
            }
        }

        if (!textData) {
            console.error(`Bible text not found for ${translationUpper}. Tried paths:`, pathsToTry.map(p => p.path));
            return res.status(404).json({
                success: false,
                error: 'Chapter not found',
                message: `No text file found for ${translationUpper}/${bookUpper}/${chapter}`
            });
        }

        // Convert verses to array format - supports both formats:
        // Format 1 (old): { "verses": { "1": "text", "2": "text" } }
        // Format 2 (new): { "verses": [{ "verse": 1, "text": "..." }] }
        let versesArray;
        const versesData = textData.verses || {};

        if (Array.isArray(versesData)) {
            // New format: already an array of { verse, text }
            versesArray = versesData.map(v => ({
                verse: parseInt(v.verse),
                text: (v.text || '').replace(/&nbsp;/g, ' ').trim()
            })).sort((a, b) => a.verse - b.verse);
        } else {
            // Old format: object { "1": "text", "2": "text" }
            versesArray = Object.entries(versesData).map(([num, text]) => ({
                verse: parseInt(num),
                text: (text || '').replace(/&nbsp;/g, ' ').trim()
            })).sort((a, b) => a.verse - b.verse);
        }

        // Get audio translation (handles fallback logic)
        const audioTranslationCode = getAudioTranslation(translationUpper);
        const hasAudioAvailable = !!audioTranslationCode;

        // Check if this translation has its OWN audio (not via fallback)
        const hasOwnAudio = translationInfo?.hasAudio === true;

        // Generate HiDrive audio URL if audio is available
        let audioUrl = null;
        let audioNote = null;

        if (audioTranslationCode) {
            // Generate audio URL - using local static files served from /bible_data
            // Files are located at: public/bible_data/audio/{TRANSLATION}/{BOOK}/{CHAPTER}.mp3
            audioUrl = `/bible_data/audio/${audioTranslationCode}/${bookUpper}/${chapter}.mp3`;

            // Note if using fallback audio
            if (audioTranslationCode !== translationUpper) {
                const fallbackInfo = getTranslationInfo(audioTranslationCode);
                audioNote = {
                    usingFallback: true,
                    originalTranslation: translationUpper,
                    audioTranslation: audioTranslationCode,
                    message: {
                        en: `Audio from ${fallbackInfo?.name?.en || audioTranslationCode} translation`,
                        fa: `صوت از ترجمه ${fallbackInfo?.name?.fa || audioTranslationCode}`
                    }
                };
            }
        }

        // Check for timing file - try multiple directories
        // File structure: bible_data/timestamps/{TRANSLATION}/{BOOK}/{CHAPTER}.json
        let hasTiming = false;
        // Try with the audio translation first (since timing syncs with audio)
        const timingTranslation = audioTranslationCode || translationUpper;
        const timingPathsToTry = [];

        for (const timingDir of BIBLE_TIMING_DIRS) {
            // New format: TRANSLATION/BOOK/CHAPTER.json
            timingPathsToTry.push(path.join(timingDir, timingTranslation, bookUpper, `${chapter}.json`));
            // Also try with requested translation
            if (timingTranslation !== translationUpper) {
                timingPathsToTry.push(path.join(timingDir, translationUpper, bookUpper, `${chapter}.json`));
            }
            // Legacy format: BOOK_CHAPTER_timing.json (backward compatibility)
            timingPathsToTry.push(path.join(timingDir, `${bookUpper}_${chapter}_timing.json`));
        }

        for (const timingPath of timingPathsToTry) {
            try {
                await fs.access(timingPath);
                const timingContent = await fs.readFile(timingPath, 'utf-8');
                timingData = JSON.parse(timingContent);
                hasTiming = true;
                console.log(`⏱️ Timing: Loaded from ${timingPath}`);
                break;
            } catch (e) {
                // No timing file at this path - try next
            }
        }

        // Merge timing data into verses if available
        if (hasTiming && timingData) {
            // Group words by verse number if structure is flat words array
            let wordsByVerse = {};

            if (timingData.words && Array.isArray(timingData.words)) {
                // Flat structure (like GEN_1_timing.json)
                timingData.words.forEach(w => {
                    const vNum = typeof w.verseNum === 'number' ? w.verseNum : parseInt(w.verseNum);
                    if (!wordsByVerse[vNum]) {
                        wordsByVerse[vNum] = [];
                    }
                    wordsByVerse[vNum].push(w);
                });
            } else if (timingData.verses && Array.isArray(timingData.verses)) {
                // Nested structure (backward compatibility)
                timingData.verses.forEach((v, idx) => {
                    // Assuming sequential verses if no explicit number
                    const vNum = v.verse || (idx + 1);
                    if (v.words) {
                        wordsByVerse[vNum] = v.words;
                    }
                });
            }

            versesArray = versesArray.map(v => {
                const verseWords = wordsByVerse[v.verse];

                if (verseWords && verseWords.length > 0) {
                    return {
                        ...v,
                        timing: {
                            start: verseWords[0].start || 0,
                            end: verseWords[verseWords.length - 1].end || 0,
                            words: verseWords
                        }
                    };
                }
                return v;
            });
        }

        // Build response with comprehensive translation info
        res.json({
            success: true,

            // Basic info
            book: textData.book || book,
            chapter: parseInt(chapter),
            verses: versesArray,

            // Translation info
            translation: {
                code: translationUpper,
                name: translationInfo?.name || { en: translationUpper, fa: translationUpper },
                language: lang,
                textSource: textSource // 'translation' or 'language' (shared)
            },

            // Text source note (if using shared language text)
            textNote: textSource === 'language' ? {
                usingSharedText: true,
                message: {
                    en: `All Persian translations currently share the same text`,
                    fa: `همه ترجمه‌های فارسی از یک متن استفاده می‌کنند`
                }
            } : null,

            // Audio info
            // hasAudio: true if this translation has its OWN audio (use for UI show/hide)
            // hasAudioAvailable: true if audio is available (own or via fallback)
            audio: audioUrl,
            audioUrl: audioUrl,
            hasAudio: hasOwnAudio,
            hasAudioAvailable: hasAudioAvailable,
            audioNote: audioNote,

            // Timing info - URL matches static file path
            hasTiming: hasTiming,
            timingUrl: hasTiming ? `/bible_data/timestamps/${audioTranslationCode || translationUpper}/${bookUpper}/${chapter}.json` : null
        });

    } catch (error) {
        console.error('Bible content error:', error.message);
        res.status(404).json({
            success: false,
            error: 'Chapter not found',
            message: error.message
        });
    }
});

/**
 * GET /api/bible-local/audio/:translation/:book/:chapter
 * Redirects to HiDrive streaming endpoint with fallback support
 */
router.get('/audio/:translation/:book/:chapter', async (req, res) => {
    const { translation, book, chapter } = req.params;
    const bookUpper = book.toUpperCase();
    const translationUpper = translation.toUpperCase();

    // Get audio translation (handles fallback)
    const audioTranslationCode = getAudioTranslation(translationUpper);

    if (!audioTranslationCode) {
        return res.status(404).json({
            success: false,
            error: 'No audio available',
            message: `Translation ${translationUpper} has no audio and no fallback available`
        });
    }

    // Redirect to HiDrive stream
    const hidriveUrl = `/api/hidrive/stream/bible/audio/${audioTranslationCode}/${bookUpper}/${chapter}.mp3`;
    console.log(`🔄 Redirecting audio request to HiDrive: ${hidriveUrl}`);
    res.redirect(302, hidriveUrl);
});

module.exports = router;