const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: "postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
});

// Helper for fuzzy/sub-string matching between Farsi and Finglish/English representations
// This maps common Farsi words to their Finglish sounds for audio file name auditing
const FARSI_TO_FINGLISH_MAP = {
  "شادی": ["shadi", "schadi", "shaadi"],
  "نام": ["nam", "name"],
  "لمس": ["lams", "lamsash", "lamseth"],
  "آزاد": ["azad", "azaad", "azadam"],
  "روح": ["ruh", "rooh", "ruhe", "roohe"],
  "شاد": ["shad", "shaad", "shadam"],
  "قوت": ["ghovat", "govat", "qovat"],
  "آرام": ["aram", "araam", "aramam", "arami"],
  "دل": ["del", "delha", "delhaayee", "delhayee"],
  "صلیب": ["salib", "saleeb", "salibat"],
  "عیسی": ["isa", "isaa", "jesus", "jésus"],
  "مسیح": ["masih", "maseeh", "christ"],
  "خداوند": ["khodavand", "khoda", "god"],
  "پدر": ["pedar", "peder", "father"],
  "سرود": ["sorood", "sorud", "song"],
  "پرستش": ["parastesh", "worship"],
  "بسراییم": ["besaraiym", "besarayed", "besara", "sarayam"],
  "فدیه": ["fedye", "fedyeh"],
  "هللویا": ["halelujah", "hallelujah", "halelooya", "halleluiah"],
  "نجات": ["nejat", "nejaat"],
  "شکر": ["shokr", "shukr"],
  "عشق": ["eshgh", "eshq", "love"],
  "طوفان": ["tufan", "toofan"],
  "تخت": ["takht", "taxt"],
  "امید": ["omid", "omeed"],
  "قدوس": ["ghodus", "ghodoos", "qodus", "holy"]
};

function checkAudioTitleMismatch(title, audioUrl) {
  if (!audioUrl) return { isMismatch: false };
  const filename = path.basename(audioUrl).toLowerCase();
  
  // Extract words from the title
  const titleWords = title.split(/[\s,()\-،]+/);
  let checkedWords = 0;
  let matchingWords = 0;

  for (const word of titleWords) {
    const cleanWord = word.trim();
    if (cleanWord.length < 3) continue; // Skip short Farsi particles/words

    checkedWords++;
    
    // Check if the Farsi word itself is in the filename (e.g. Farsi filename)
    if (filename.includes(cleanWord)) {
      matchingWords++;
      continue;
    }

    // Check if any of its mapped Finglish equivalents are in the filename
    const finglishList = FARSI_TO_FINGLISH_MAP[cleanWord];
    if (finglishList) {
      const found = finglishList.some(f => filename.includes(f));
      if (found) {
        matchingWords++;
      }
    }
  }

  // If we checked multiple words and none of them matched the audio file name, it's a warning/mismatch
  if (checkedWords >= 2 && matchingWords === 0) {
    return {
      isMismatch: true,
      reason: `عنوان سرود شامل واژه‌های Farsi (${titleWords.slice(0, 3).join(', ')}) است اما نام فایل صوتی (${filename}) هیچ‌کدام از آواهای مربوطه را در خود ندارد.`
    };
  }

  return { isMismatch: false };
}

function checkLyricsTimingMismatch(lyricsText, timingData) {
  if (!lyricsText || !timingData || !Array.isArray(timingData.lines)) return { isMismatch: false };
  
  // Extract Farsi words from lyrics
  const lyricWords = new Set(lyricsText.split(/[\s,()\[\]\-\d:.*#|+=\/\\،؟\n]+/).filter(w => w.length > 2));
  
  // Extract Farsi words from timing data lines
  const timingLinesText = timingData.lines.map(l => l.line || "").join(" ");
  const timingWords = timingLinesText.split(/[\s,()\[\]\-\d:.*#|+=\/\\،؟\n]+/).filter(w => w.length > 2);

  if (lyricWords.size === 0 || timingWords.length === 0) return { isMismatch: false };

  let matchingWords = 0;
  timingWords.forEach(word => {
    if (lyricWords.has(word)) {
      matchingWords++;
    }
  });

  const overlapRatio = matchingWords / timingWords.length;

  if (overlapRatio < 0.25) { // Less than 25% word overlap is a critical mismatch
    return {
      isMismatch: true,
      reason: `تداخل شدید متنی! کلمات متن سرود با زمان‌بندی کارائوکه تطابق ندارند (نسبت تشابه: ${(overlapRatio * 100).toFixed(1)}%). احتمالاً زمان‌بندی متعلق به سرود دیگری است.`
    };
  }

  return { isMismatch: false };
}

async function main() {
  await client.connect();
  console.log("🔍 Fetching all worship songs from database for comprehensive audit...");
  
  const { rows: songs } = await client.query("SELECT id, title_fa, youtube_id, audio_url, lyrics_fa, timing_data, is_verified FROM church_worship_songs ORDER BY title_fa ASC");
  console.log(`📊 Found ${songs.length} songs in database.`);

  const audioMap = new Map();
  const youtubeMap = new Map();
  const mismatches = [];
  const statistics = {
    totalSongs: songs.length,
    verifiedSongs: 0,
    missingAudio: 0,
    missingLyrics: 0,
    hasTiming: 0,
    duplicateAudios: 0,
    duplicateYoutubes: 0,
    audioMismatches: 0,
    timingMismatches: 0
  };

  // Perform checks
  songs.forEach(song => {
    if (song.is_verified) statistics.verifiedSongs++;
    if (!song.audio_url) statistics.missingAudio++;
    if (!song.lyrics_fa) statistics.missingLyrics++;
    if (song.timing_data) statistics.hasTiming++;

    // Check 1 & 2: Duplicates
    if (song.audio_url) {
      if (!audioMap.has(song.audio_url)) {
        audioMap.set(song.audio_url, []);
      }
      audioMap.get(song.audio_url).push(song);
    }

    if (song.youtube_id) {
      if (!youtubeMap.has(song.youtube_id)) {
        youtubeMap.set(song.youtube_id, []);
      }
      youtubeMap.get(song.youtube_id).push(song);
    }

    // Check 3: Audio Filename to Title Mismatch
    const audioCheck = checkAudioTitleMismatch(song.title_fa, song.audio_url);
    if (audioCheck.isMismatch) {
      statistics.audioMismatches++;
      mismatches.push({
        songId: song.id,
        title: song.title_fa,
        type: "AUDIO_NAME_MISMATCH",
        severity: "WARNING",
        detail: audioCheck.reason,
        currentAudio: song.audio_url
      });
    }

    // Check 4: Lyrics to Timing Data Mismatch
    const timingCheck = checkLyricsTimingMismatch(song.lyrics_fa, song.timing_data);
    if (timingCheck.isMismatch) {
      statistics.timingMismatches++;
      mismatches.push({
        songId: song.id,
        title: song.title_fa,
        type: "KARAOKE_CONTENT_MISMATCH",
        severity: "CRITICAL",
        detail: timingCheck.reason,
        currentAudio: song.audio_url
      });
    }
  });

  // Process Duplicates statistics and findings
  for (const [audioUrl, linkedSongs] of audioMap.entries()) {
    if (linkedSongs.length > 1) {
      statistics.duplicateAudios += linkedSongs.length - 1;
      mismatches.push({
        type: "DUPLICATE_AUDIO_URL",
        severity: "CRITICAL",
        detail: `چندین سرود مختلف از یک فایل صوتی یکسان (${audioUrl}) استفاده می‌کنند! این فایل صوتی به سرودهای زیر متصل است:`,
        songs: linkedSongs.map(s => ({ id: s.id, title: s.title_fa }))
      });
    }
  }

  for (const [youtubeId, linkedSongs] of youtubeMap.entries()) {
    if (linkedSongs.length > 1) {
      statistics.duplicateYoutubes += linkedSongs.length - 1;
      mismatches.push({
        type: "DUPLICATE_YOUTUBE_ID",
        severity: "CRITICAL",
        detail: `چندین سرود مختلف از یک شناسه ویدیوی یوتیوب یکسان (${youtubeId}) استفاده می‌کنند! این ویدیو به سرودهای زیر متصل است:`,
        songs: linkedSongs.map(s => ({ id: s.id, title: s.title_fa }))
      });
    }
  }

  await client.end();

  // Print results
  console.log("\n=============================================================");
  console.log("📊 WORSHIP METADATA AUDIT REPORT STATISTICS");
  console.log("=============================================================");
  console.log(`- Total Songs Audited:      ${statistics.totalSongs}`);
  console.log(`- Verified Songs:           ${statistics.verifiedSongs}`);
  console.log(`- Songs with Audio:         ${statistics.totalSongs - statistics.missingAudio}`);
  console.log(`- Songs with timing data:   ${statistics.hasTiming}`);
  console.log(`- Duplicate Audios Found:   ${statistics.duplicateAudios}`);
  console.log(`- Duplicate YouTubes Found: ${statistics.duplicateYoutubes}`);
  console.log(`- Audio Name Mismatches:    ${statistics.audioMismatches}`);
  console.log(`- Karaoke/Lyrics Mismatches: ${statistics.timingMismatches}`);
  console.log("=============================================================");

  const report = {
    generatedAt: new Date().toISOString(),
    statistics,
    mismatches
  };

  const reportPath = path.join(__dirname, "worship_audit_report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`💾 Machine-readable report saved to: ${reportPath}`);

  // Write a clean markdown summary in project root
  const mdSummaryPath = path.join(__dirname, "..", "WORSHIP_AUDIT_REPORT.md");
  let mdContent = `# 🔍 Worship Songs Metadata Audit Report - گزارش کامل حسابرسی متادیتا\n\n`;
  mdContent += `**تاریخ تولید گزارش:** ${new Date().toLocaleDateString('fa-IR')} | **زمان:** ${new Date().toLocaleTimeString('fa-IR')}\n\n`;
  mdContent += `## 📊 خلاصه وضعیت آماری\n\n`;
  mdContent += `| عنوان آماری | تعداد | توضیحات |\n`;
  mdContent += `| --- | --- | --- |\n`;
  mdContent += `| **کل سرودهای حسابرسی شده** | ${statistics.totalSongs} | تعداد کل رکوردها در دیتابیس |\n`;
  mdContent += `| **سرودهای تایید نهایی شده (Verified)** | ${statistics.verifiedSongs} | سرودهایی که صحت متون و آهنگ آن‌ها تایید شده است |\n`;
  mdContent += `| **سرودهای دارای فایل صوتی** | ${statistics.totalSongs - statistics.missingAudio} | سرودهای دارای فایل صوتی بارگذاری شده |\n`;
  mdContent += `| **سرودهای دارای زمان‌بندی کارائوکه** | ${statistics.hasTiming} | سرودهای با زمان‌بندی کلمه به کلمه فعال |\n`;
  mdContent += `| **فایل‌های صوتی تکراری (تداخل لینک)** | ${statistics.duplicateAudios} | مواردی که چند سرود به یک آهنگ متصل هستند |\n`;
  mdContent += `| **ویدیوهای یوتیوب تکراری (تداخل لینک)** | ${statistics.duplicateYoutubes} | مواردی که چند سرود به یک ویدیو متصل هستند |\n`;
  mdContent += `| **عدم تطابق نام فایل با عنوان سرود** | ${statistics.audioMismatches} | خطای عدم تشابه عنوان فارسی سرود با نام فایل |\n`;
  mdContent += `| **عدم تطابق متن با زمان‌بندی کارائوکه** | ${statistics.timingMismatches} | خطاهای شدید تداخل محتوایی کارائوکه |\n\n`;

  mdContent += `## ⚠️ خطاهای بحرانی و هشدارهای شناسایی شده\n\n`;

  if (mismatches.length === 0) {
    mdContent += `### ✨ هیچ تداخل یا خطایی در سرودها یافت نشد. همه چیز کاملاً منطبق و مرتب است!\n`;
  } else {
    mismatches.forEach((m, idx) => {
      const severityIcon = m.severity === "CRITICAL" ? "🔴 **بحرانی**" : "🟡 **هشدار**";
      mdContent += `### ${idx + 1}. ${severityIcon} [${m.type}] ${m.title || ""}\n`;
      mdContent += `- **توضیحات خطا:** ${m.detail}\n`;
      if (m.currentAudio) mdContent += `- **فایل صوتی فعلی:** \`${m.currentAudio}\`\n`;
      if (m.songs) {
        mdContent += `- **سرودهای متداخل:**\n`;
        m.songs.forEach(s => {
          mdContent += `  - [${s.title}](file:///d:/Windows.old/Users/Sami/Desktop/Iran%20Church%20DC/Git/Mychurch/mychurch-next/src/app/admin/worship) (ID: \`${s.id}\`)\n`;
        });
      }
      mdContent += `\n---\n\n`;
    });
  }

  fs.writeFileSync(mdSummaryPath, mdContent, "utf8");
  console.log(`📝 Beautiful Markdown Summary saved to: ${mdSummaryPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
