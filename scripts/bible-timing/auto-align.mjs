/**
 * Bible Karaoke - Auto Alignment Script
 * 
 * Generates word-level timing data for Bible verses.
 * Uses proportional distribution based on word count and audio duration.
 * 
 * For production: Replace with WhisperX or Gentle Forced Alignment
 * 
 * Usage: node scripts/bible-timing/auto-align.mjs
 */

import path from "path";
import fs from "fs-extra";
import {
  loadJSON,
  saveJSON,
  splitIntoWords,
  formatDuration,
  log
} from "./utils.mjs";

const config = loadJSON("config/bible-karaoke-config.json");
const { paths } = config;

// Load index
const indexPath = path.join(paths.outputDataDir, "bible-karaoke-index.json");

if (!fs.existsSync(indexPath)) {
  log.error("Index file not found!");
  log.error("Run build-index first: npm run bible:index");
  process.exit(1);
}

const indexData = loadJSON(indexPath);
const chapters = indexData.chapters || [];

log.info("Starting auto-alignment...");
log.info(`Processing ${chapters.length} chapters`);

let processedCount = 0;
let alignedCount = 0;

/**
 * Align verses in a language section
 */
const alignLanguage = (langData, langKey) => {
  if (!langData || !Array.isArray(langData.verses) || !langData.duration) {
    return false;
  }

  const verses = langData.verses;
  const totalDuration = langData.duration;

  // Calculate total words across all verses
  const totalWords = verses.reduce((acc, v) => {
    const words = splitIntoWords(v.text || "");
    return acc + words.length;
  }, 0);

  if (totalWords === 0) {
    log.warn(`No words found in ${langKey} verses`);
    return false;
  }

  // Proportionally distribute time based on word count
  let cursor = 0;

  verses.forEach((verse) => {
    const words = splitIntoWords(verse.text || "");
    
    if (words.length === 0) {
      verse.timings = [];
      verse.start = cursor;
      verse.end = cursor;
      return;
    }

    // Calculate this verse's share of total time
    const verseShare = (words.length / totalWords) * totalDuration;
    const timePerWord = verseShare / words.length;

    // Generate word timings
    const timings = words.map((word, i) => {
      const start = cursor + (i * timePerWord);
      const end = cursor + ((i + 1) * timePerWord);
      return {
        word,
        start: Number(start.toFixed(3)),
        end: Number(end.toFixed(3))
      };
    });

    verse.timings = timings;
    verse.start = timings[0]?.start ?? cursor;
    verse.end = timings[timings.length - 1]?.end ?? (cursor + verseShare);

    cursor += verseShare;
  });

  langData.aligned = true;
  langData.alignedAt = new Date().toISOString();
  langData.alignmentMethod = "proportional";

  return true;
};

/**
 * Process each chapter
 */
for (const chapterInfo of chapters) {
  try {
    const chapterFile = path.join(
      paths.outputChaptersDir,
      `${chapterInfo.key}.json`
    );

    if (!fs.existsSync(chapterFile)) {
      log.warn(`Chapter file not found: ${chapterFile}`);
      continue;
    }

    const data = loadJSON(chapterFile);
    let modified = false;

    // Align English
    if (data.en && !data.en.aligned) {
      if (alignLanguage(data.en, "en")) {
        modified = true;
        alignedCount++;
      }
    }

    // Align Farsi
    if (data.fa && !data.fa.aligned) {
      if (alignLanguage(data.fa, "fa")) {
        modified = true;
        alignedCount++;
      }
    }

    // Save if modified
    if (modified) {
      saveJSON(chapterFile, data);
      processedCount++;

      if (processedCount % 20 === 0) {
        log.info(`Aligned ${processedCount} chapters...`);
      }
    }
  } catch (error) {
    log.error(`Error processing ${chapterInfo.key}: ${error.message}`);
  }
}

log.success(`✨ Auto-alignment complete!`);
log.success(`  📊 Processed: ${processedCount} chapters`);
log.success(`  🎯 Aligned: ${alignedCount} language sections`);
log.info("");
log.info("💡 Note: This is proportional timing (approximate)");
log.info("   For accurate word timings, use WhisperX or Gentle Forced Alignment");
log.info("");
log.info("Next: Test with BibleKaraokePlayer component");
