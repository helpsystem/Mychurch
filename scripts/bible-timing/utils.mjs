/**
 * Utility functions for Bible Karaoke timing system
 * Shared across build-index and auto-align scripts
 */

import fs from "fs-extra";
import path from "path";
import he from "he";
import { JSDOM } from "jsdom";

/**
 * Load JSON file
 */
export const loadJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

/**
 * Save JSON file with pretty formatting
 */
export const saveJSON = (p, obj) => 
  fs.outputFileSync(p, JSON.stringify(obj, null, 2), "utf8");

/**
 * Read HTML file and return DOM
 */
export const readHTML = (filePath) => {
  const raw = fs.readFileSync(filePath, "utf8");
  const { window } = new JSDOM(raw);
  const doc = window.document;
  return { doc, raw };
};

/**
 * Clean and decode HTML text
 */
export const cleanText = (t) =>
  he.decode(t.replace(/\s+/g, " ").replace(/\u00A0/g, " ").trim());

/**
 * Check if text contains RTL characters (Persian/Arabic)
 */
export const isRTL = (str) => /[\u0600-\u06FF]/.test(str);

/**
 * Split HTML content into verses by markers
 * WordProject uses <sup> tags for verse numbers
 */
export const splitVersesByMarkers = (htmlDoc) => {
  const result = [];
  const body = htmlDoc.querySelector("body");
  if (!body) return result;

  // Find all paragraph elements
  const paragraphs = [...body.querySelectorAll("p, div")];
  let currentVerse = null;
  let verseText = "";

  const pushVerse = () => {
    if (currentVerse !== null && verseText.trim()) {
      result.push({ 
        verse: Number(currentVerse), 
        text: cleanText(verseText) 
      });
    }
    currentVerse = null;
    verseText = "";
  };

  paragraphs.forEach((el) => {
    // Look for verse numbers in <sup> tags
    const sups = [...el.querySelectorAll("sup")];
    if (sups.length) {
      sups.forEach((s) => {
        const verseNum = s.textContent?.trim();
        if (/^\d+$/.test(verseNum)) {
          // New verse found
          if (currentVerse !== null) pushVerse();
          currentVerse = verseNum;
          
          // Extract text after the verse number
          const clone = el.cloneNode(true);
          [...clone.querySelectorAll("sup")].forEach((x) => x.remove());
          verseText = clone.textContent || "";
        }
      });
    }
  });

  pushVerse();
  return result;
};

/**
 * Generate safe chapter ID
 */
export const safeChapterId = (bookIso, chapter) => 
  `${bookIso}_${String(chapter).padStart(3, "0")}`;

/**
 * Normalize book name using mapping
 */
export const normalizeBook = (name, mapping) => {
  const nameLower = name.toLowerCase();
  
  // Direct match
  const direct = mapping.books.find(b =>
    b.en.toLowerCase() === nameLower ||
    b.fa === name ||
    b.iso.toLowerCase() === nameLower
  );
  if (direct) return direct;

  // Synonym match
  const enSyn = mapping.synonyms.en[name];
  if (enSyn) {
    return mapping.books.find(b => b.en === enSyn);
  }

  const faSyn = mapping.synonyms.fa[name];
  if (faSyn) {
    return mapping.books.find(b => b.fa === faSyn);
  }

  return null;
};

/**
 * Extract book/chapter/lang from file path
 * Handles various naming conventions from WordProject
 */
export const parseMetaFromPath = (absPath, mapping) => {
  const p = absPath.replace(/\\/g, "/").toLowerCase();
  
  // Detect language
  let lang = null;
  if (p.includes("/fa/") || p.includes("farsi") || p.includes("/20_farsi")) {
    lang = "fa";
  } else if (p.includes("/kj/") || p.includes("english") || p.includes("/01_english")) {
    lang = "en";
  }

  // Extract book and chapter
  let bookName = null;
  let chapter = null;

  const base = path.basename(absPath)
    .toLowerCase()
    .replace(/\.(html|htm|xhtml|php|mp3|m4a|wav|txt)$/i, "");

  // Common patterns:
  // genesis_1, gen_001, 01_genesis, genesis-1
  let m;
  if ((m = base.match(/^([a-z]+)_?(\d{1,3})$/))) {
    bookName = m[1];
    chapter = Number(m[2]);
  } else if ((m = base.match(/^(\d{1,3})_([a-z]+)$/))) {
    bookName = m[2];
    chapter = Number(m[1]);
  } else if ((m = base.match(/^([a-z]+)-(\d{1,3})$/))) {
    bookName = m[1];
    chapter = Number(m[2]);
  } else if ((m = p.match(/\/([a-z]+)\/(\d{1,3})\./))) {
    bookName = m[1];
    chapter = Number(m[2]);
  } else if ((m = p.match(/\/(\d{1,3})\.([a-z]+)\./))) {
    bookName = m[2];
    chapter = Number(m[1]);
  }

  // Fallback language detection
  if (!lang) {
    lang = isRTL(absPath) ? "fa" : "en";
  }

  // Normalize book name
  let resolved = null;
  if (bookName) {
    resolved = normalizeBook(bookName, mapping) || 
               normalizeBook(bookName[0].toUpperCase() + bookName.slice(1), mapping);
  }

  return {
    lang,
    book: resolved, // {id, iso, en, fa, chapters}
    chapter
  };
};

/**
 * Split text into words (handles Persian and English)
 */
export const splitIntoWords = (text) => {
  if (!text) return [];
  
  // Simple split by whitespace
  // For better Persian handling, you can add custom logic here
  return text.trim().split(/\s+/);
};

/**
 * Format duration in MM:SS
 */
export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

/**
 * Get audio duration from file (requires music-metadata)
 */
export const getAudioDuration = async (filePath) => {
  try {
    const mm = await import("music-metadata");
    const metadata = await mm.parseFile(filePath);
    return metadata.format.duration || null;
  } catch (error) {
    console.warn(`Could not read audio duration for ${filePath}:`, error.message);
    return null;
  }
};

/**
 * Log with color
 */
export const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
};
