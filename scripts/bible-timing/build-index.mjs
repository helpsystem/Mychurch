/**
 * Bible Karaoke - Build Index Script
 * 
 * Scans WordProject files (HTML/MP3) and creates structured JSON
 * for each chapter with verses and audio references.
 * 
 * Usage: node scripts/bible-timing/build-index.mjs
 */

import path from "path";
import fs from "fs-extra";
import fg from "fast-glob";
import {
  loadJSON,
  saveJSON,
  readHTML,
  splitVersesByMarkers,
  safeChapterId,
  parseMetaFromPath,
  getAudioDuration,
  log
} from "./utils.mjs";

// Load configuration
const config = loadJSON("config/bible-karaoke-config.json");
const mapping = loadJSON("config/bible-books-mapping.json");

const { paths, audioFormats, htmlFormats, textFormats } = config;

// Ensure output directories exist
await fs.ensureDir(paths.outputDataDir);
await fs.ensureDir(paths.outputChaptersDir);

log.info("Starting Bible Karaoke index build...");
log.info(`Scanning: ${paths.wordprojectBase}`);

// 1) Collect all files
const globPatterns = [
  `${paths.wordprojectBase.replace(/\\/g, "/")}/**/*`,
  ...(paths.farsiAudio ? [`${paths.farsiAudio.replace(/\\/g, "/")}/**/*.mp3`] : []),
  ...(paths.farsiText ? [`${paths.farsiText.replace(/\\/g, "/")}/**/*.{html,htm}`] : []),
];

log.info("Collecting files...");
const entries = await fg(globPatterns, { 
  dot: false, 
  onlyFiles: true,
  absolute: true 
});

log.info(`Found ${entries.length} files`);

const files = entries.map((abs) => ({
  abs,
  ext: path.extname(abs).toLowerCase()
}));

// 2) Categorize files
const audioFiles = files.filter(f => audioFormats.includes(f.ext));
const htmlFiles = files.filter(f => htmlFormats.includes(f.ext));
const textFiles = files.filter(f => textFormats.includes(f.ext));

log.info(`Audio files: ${audioFiles.length}`);
log.info(`HTML files: ${htmlFiles.length}`);
log.info(`Text files: ${textFiles.length}`);

// 3) Build chapters map
const chaptersMap = new Map();

const getOrInit = (iso, chapter) => {
  const key = safeChapterId(iso, chapter);
  if (!chaptersMap.has(key)) {
    chaptersMap.set(key, {
      key,
      iso,
      chapter,
      langs: {
        en: {},
        fa: {}
      }
    });
  }
  return chaptersMap.get(key);
};

// 4) Process HTML files (extract verses)
log.info("Processing HTML files...");
let htmlProcessed = 0;

for (const f of htmlFiles) {
  try {
    const meta = parseMetaFromPath(f.abs, mapping);
    if (!meta?.book || !meta?.chapter) continue;

    const { doc } = readHTML(f.abs);
    const verses = splitVersesByMarkers(doc);
    
    if (verses.length === 0) continue;

    const lang = meta.lang === "fa" ? "fa" : "en";
    const ch = getOrInit(meta.book.iso, meta.chapter);
    
    ch.langs[lang].textFile = f.abs;
    ch.langs[lang].verses = verses;
    htmlProcessed++;

    if (htmlProcessed % 50 === 0) {
      log.info(`Processed ${htmlProcessed} HTML files...`);
    }
  } catch (error) {
    log.warn(`Error processing ${f.abs}: ${error.message}`);
  }
}

log.success(`Processed ${htmlProcessed} HTML files`);

// 5) Process text files (fallback)
log.info("Processing text files...");
let textProcessed = 0;

for (const f of textFiles) {
  try {
    const meta = parseMetaFromPath(f.abs, mapping);
    if (!meta?.book || !meta?.chapter) continue;

    const lang = meta.lang === "fa" ? "fa" : "en";
    const raw = fs.readFileSync(f.abs, "utf8");
    
    // Assume each line is: "1 In the beginning..."
    const verses = raw
      .split(/\r?\n/)
      .map(line => {
        const m = line.match(/^\s*(\d+)\s+(.*)$/);
        if (m) {
          return { 
            verse: Number(m[1]), 
            text: m[2].trim()
          };
        }
        return null;
      })
      .filter(Boolean);

    if (verses.length === 0) continue;

    const ch = getOrInit(meta.book.iso, meta.chapter);
    
    // Only use if no HTML verses exist
    if (!ch.langs[lang].verses || ch.langs[lang].verses.length === 0) {
      ch.langs[lang].textFile = f.abs;
      ch.langs[lang].verses = verses;
      textProcessed++;
    }
  } catch (error) {
    log.warn(`Error processing ${f.abs}: ${error.message}`);
  }
}

log.success(`Processed ${textProcessed} text files`);

// 6) Process audio files
log.info("Processing audio files...");
let audioProcessed = 0;

for (const f of audioFiles) {
  try {
    const meta = parseMetaFromPath(f.abs, mapping);
    if (!meta?.book || !meta?.chapter) continue;

    const lang = meta.lang === "fa" ? "fa" : "en";
    const ch = getOrInit(meta.book.iso, meta.chapter);
    
    ch.langs[lang].audioFile = f.abs;
    
    // Get duration
    const duration = await getAudioDuration(f.abs);
    if (duration) {
      ch.langs[lang].duration = duration;
    }
    
    audioProcessed++;

    if (audioProcessed % 20 === 0) {
      log.info(`Processed ${audioProcessed} audio files...`);
    }
  } catch (error) {
    log.warn(`Error processing ${f.abs}: ${error.message}`);
  }
}

log.success(`Processed ${audioProcessed} audio files`);

// 7) Save per-chapter JSON files
log.info("Saving chapter data...");
const index = [];
let savedCount = 0;

for (const [, ch] of chaptersMap.entries()) {
  const bookInfo = mapping.books.find(b => b.iso === ch.iso);
  if (!bookInfo) continue;

  const out = {
    book: bookInfo,
    chapter: ch.chapter,
    en: ch.langs.en ?? {},
    fa: ch.langs.fa ?? {}
  };

  // Generate public URLs for audio
  const relPath = (abs, root) => {
    if (!abs) return null;
    const name = path.basename(abs);
    return `${root}/${encodeURIComponent(name)}`;
  };

  out.en.audioUrl = relPath(out.en.audioFile, paths.publicAudioRoot + "/en");
  out.fa.audioUrl = relPath(out.fa.audioFile, paths.publicAudioRoot + "/fa");

  // Save chapter file
  const chapterKey = `${ch.iso}_${ch.chapter}`;
  const chapterFile = path.join(paths.outputChaptersDir, `${chapterKey}.json`);
  saveJSON(chapterFile, out);

  // Add to index
  index.push({
    key: chapterKey,
    iso: ch.iso,
    book: bookInfo,
    chapter: ch.chapter,
    en: {
      audioUrl: out.en.audioUrl,
      hasText: !!out.en.verses?.length,
      verseCount: out.en.verses?.length || 0
    },
    fa: {
      audioUrl: out.fa.audioUrl,
      hasText: !!out.fa.verses?.length,
      verseCount: out.fa.verses?.length || 0
    }
  });

  savedCount++;
}

// 8) Save main index
const indexFile = path.join(paths.outputDataDir, "bible-karaoke-index.json");
saveJSON(indexFile, {
  generatedAt: new Date().toISOString(),
  totalChapters: index.length,
  chapters: index
});

log.success(`✨ Index complete!`);
log.success(`  📁 ${savedCount} chapters saved to ${paths.outputChaptersDir}`);
log.success(`  📋 Index: ${indexFile}`);
log.info("");
log.info("Next step: Run auto-align to generate word timings");
log.info("  npm run bible:align");
