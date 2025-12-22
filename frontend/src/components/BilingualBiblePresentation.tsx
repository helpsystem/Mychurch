// BilingualBiblePresentation.tsx
// ------------------------------------------------------------
// ✅ Full-screen, projector-friendly bilingual Bible presenter
//    - Left: English (LTR)   |   Right: Persian (RTL)
//    - Large verse numbers & synchronized highlighting
//    - Keyboard controls (←/→ verse, PgUp/PgDn chapter, Space play/pause, F fullscreen)
//    - Auto-advance with Web Speech API (if available) or per-verse audio URLs
//    - Flipbook-like chapter transition (Framer Motion)
//    - Responsive layout; stacks on narrow screens
//    - TailwindCSS styling (no external CSS needed)
// ------------------------------------------------------------
// Usage:
//   import BilingualBiblePresentation from "./BilingualBiblePresentation";
//   <BilingualBiblePresentation data={sampleData}/>  // see sampleData at bottom
// ------------------------------------------------------------

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Play, Pause, SkipBack, SkipForward, Volume2, Book, Type, RefreshCw } from "lucide-react";
import { speakPersian, findBestPersianVoice, isPersianTTSAvailable } from "../lib/persianTTS";
import ReadAlongView from "./ReadAlongView"; // ✨ NEW: Karaoke-style read-along
import PresentationAudioPlayer from "./PresentationAudioPlayer"; // 🎵 NEW: Smart Audio Player

// ---------- Types ----------
export type Verse = {
  verseNumber: number;
  text_en: string;
  text_fa: string;
  audio_en?: string; // optional per-verse audio file
  audio_fa?: string; // optional per-verse audio file
};

export type Chapter = {
  chapterNumber: number;
  verses: Verse[];
};

export type BiblePayload = {
  book_en: string;     // e.g., "Ephesians"
  book_fa: string;     // e.g., "افسسیان"
  translation_name?: { en: string; fa: string }; // e.g., { en: "Mojdeh", fa: "مژده" }
  chapters: Chapter[];
};

// ---------- Helpers ----------
const requestFullscreen = (el: HTMLElement | null) => {
  if (!el) return;
  const anyEl = el as any;
  (anyEl.requestFullscreen || anyEl.webkitRequestFullscreen || anyEl.msRequestFullscreen || anyEl.mozRequestFullScreen)?.call(anyEl);
};

const speak = async (text: string, lang: string): Promise<void> => {
  return new Promise((resolve) => {
    try {
      if (!("speechSynthesis" in window)) {
        console.warn("Speech Synthesis not supported");
        return resolve();
      }

      // استفاده از helper فارسی بهبود یافته برای فارسی
      if (lang === 'fa-IR' || lang === 'fa') {
        speakPersian(text, {
          onEnd: () => {
            console.log('✅ Persian speech ended');
            resolve();
          },
          onError: (err) => {
            console.error('❌ Persian speech error:', err);
            resolve();
          }
        });
        return;
      }

      // English speech (original code)
      const utterance = new SpeechSynthesisUtterance(text);

      const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        setVoice();
      } else {
        window.speechSynthesis.onvoiceschanged = setVoice;
      }

      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        console.log('Speech ended');
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        resolve();
      };

      window.speechSynthesis.cancel();
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 100);

    } catch (error) {
      console.error('Speak error:', error);
      resolve();
    }
  });
};

// ---------- Main Component ----------
interface Props {
  data: BiblePayload;
  startChapter?: number; // 1-based
  autoStart?: boolean;
  bookCode?: string; // 🎵 NEW: Book code for audio (e.g., 'EPH', 'MAT')
  enableAudio?: boolean; // 🎵 NEW: Enable audio player
  viewMode?: 'dual' | 'fa' | 'en'; // ✨ NEW: External view control
}

const BilingualBiblePresentation: React.FC<Props> = ({
  data,
  startChapter = 1,
  autoStart = false,
  bookCode,
  enableAudio = false,
  viewMode = 'dual' // Default to dual
}) => {
  // 🐛 DEBUG: Removed excessive logging - only log on mount
  const hasLoggedRef = useRef(false);
  useEffect(() => {
    if (!hasLoggedRef.current) {
      console.log('📚 BilingualBiblePresentation loaded:', {
        book_fa: data.book_fa,
        chapters: data.chapters.length,
        verses: data.chapters[0]?.verses.length
      });
      hasLoggedRef.current = true;
    }
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const [chapterIdx, setChapterIdx] = useState(Math.max(0, startChapter - 1));
  const [verseIdx, setVerseIdx] = useState(0);
  const [playing, setPlaying] = useState(false); // Changed from autoStart to false - explicit control
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [fontScale, setFontScale] = useState(1.1);
  const [readingMode, setReadingMode] = useState<"both" | "en" | "fa">("fa"); // Audio reading mode
  const [readAlongMode, setReadAlongMode] = useState(false); // ✨ NEW: Karaoke-style word-by-word mode
  const [audioUrl, setAudioUrl] = useState<string | null>(null); // ✨ NEW: Current chapter audio URL
  const [wordsPerSecond, setWordsPerSecond] = useState(1.6); // ✨ NEW: Highlight speed
  const [currentAudioTime, setCurrentAudioTime] = useState(0); // ✨ Track audio playback time
  const sharedAudioRef = useRef<HTMLAudioElement | null>(null); // ✨ Shared audio reference
  const durationRef = useRef<number>(0); // ✨ Track audio duration for sync

  const [highlightColor, setHighlightColor] = useState('#fde047'); // ✨ NEW: Custom highlight color (yellow-300 default)

  // ✅ Check if text_en and text_fa are identical (both Persian)
  const hasEnglishTranslation = useMemo(() => {
    // Check first few verses to see if EN is different from FA
    const sample = data.chapters[0]?.verses.slice(0, 5) || [];
    const allSame = sample.every(v => v.text_en === v.text_fa);
    return !allSame; // true if they're different (has English), false if same (no English)
  }, [data]);

  const [displayMode, setDisplayMode] = useState<"both" | "en" | "fa">(
    viewMode === 'dual' ? 'both' : viewMode // Initialize based on prop
  );

  // ✨ Sync internal displayMode when viewMode prop changes
  useEffect(() => {
    setDisplayMode(viewMode === 'dual' ? 'both' : viewMode);
  }, [viewMode]);
  const [showVoiceInfo, setShowVoiceInfo] = useState(false);

  const chapter = data.chapters[chapterIdx];
  const verse = chapter?.verses[verseIdx];

  // 🐛 DEBUG: Removed - was causing excessive logging

  const enPaneRef = useRef<HTMLDivElement>(null);
  const faPaneRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const goToVerse = useCallback((next: number) => {
    const total = chapter.verses.length;
    const bounded = Math.min(Math.max(0, next), total - 1);
    setVerseIdx(bounded);
  }, [chapter?.verses.length]);

  const nextVerse = useCallback(() => {
    if (verseIdx < chapter.verses.length - 1) setVerseIdx((v) => v + 1);
    else if (chapterIdx < data.chapters.length - 1) {
      setChapterIdx((c) => c + 1);
      setVerseIdx(0);
    }
  }, [verseIdx, chapter, chapterIdx, data.chapters.length]);

  const prevVerse = useCallback(() => {
    if (verseIdx > 0) setVerseIdx((v) => v - 1);
    else if (chapterIdx > 0) {
      const prevChapterLen = data.chapters[chapterIdx - 1].verses.length;
      setChapterIdx((c) => c - 1);
      setVerseIdx(prevChapterLen - 1);
    }
  }, [verseIdx, chapterIdx, data.chapters]);

  const nextChapter = () => {
    if (chapterIdx < data.chapters.length - 1) {
      setChapterIdx(chapterIdx + 1);
      setVerseIdx(0);
    }
  };

  const prevChapter = () => {
    if (chapterIdx > 0) {
      setChapterIdx(chapterIdx - 1);
      setVerseIdx(0);
    }
  };

  // Get available voices info
  const getAvailableVoices = () => {
    if (!("speechSynthesis" in window)) return [];
    const voices = window.speechSynthesis.getVoices();
    return voices.map(v => ({
      name: v.name,
      lang: v.lang,
      localService: v.localService,
      default: v.default
    }));
  };

  // Test speak function
  const testSpeak = async () => {
    const voices = getAvailableVoices();
    console.log('📢 Available voices:', voices);

    if (readingMode === 'fa' || readingMode === 'both') {
      console.log('Testing Persian speech...');
      await speak('سلام. این یک تست صدای فارسی است.', 'fa-IR');
    }
    if (readingMode === 'en' || readingMode === 'both') {
      console.log('Testing English speech...');
      await speak('Hello. This is an English voice test.', 'en-US');
    }
  };

  // ✨ Unified play/pause/stop handler
  const togglePlayPause = useCallback(() => {
    setPlaying(prev => !prev);
  }, []);

  const stopAudio = useCallback(() => {
    setPlaying(false);
    setCurrentAudioTime(0);
    if (sharedAudioRef.current) {
      sharedAudioRef.current.pause();
      sharedAudioRef.current.currentTime = 0;
    }
  }, []);

  // ✨ NEW: Load chapter audio from bible_data.json
  const loadChapterAudio = async () => {
    try {
      const cacheBust = new Date().getTime();
      const response = await fetch(`/bible_data.json?v=${cacheBust}`);
      if (!response.ok) throw new Error('Failed to load Bible data');

      const bibleData = await response.json();

      // Get audio for current chapter
      const bookCode = Object.keys(bibleData.bible_text?.['118'] || {}).find(
        key => bibleData.bible_text['118'][key]?.[chapter.chapterNumber]
      );

      if (!bookCode) {
        console.warn('❌ Could not find book code');
        return;
      }

      const audioInfo = bibleData.audio_files?.['118']?.[bookCode]?.[chapter.chapterNumber];

      if (!audioInfo || audioInfo.length === 0) {
        console.warn('⚠️ No audio available for this chapter');
        setAudioUrl(null);
        return;
      }

      // Prefer Persian audio
      const persianAudio = audioInfo.find((a: any) =>
        a.title?.includes('ترجمۀ') || a.title?.includes('هزارۀ')
      );
      const selectedAudio = persianAudio || audioInfo[0];

      const url = selectedAudio.download_urls?.format_mp3_32k || selectedAudio.download_urls?.format_hls;
      if (url) {
        const fullUrl = url.startsWith('//') ? `https:${url}` : url;
        setAudioUrl(fullUrl);
        console.log('✅ Audio loaded:', selectedAudio.title, fullUrl);
      }
    } catch (error) {
      console.error('❌ Error loading audio:', error);
      setAudioUrl(null);
    }
  };

  // ✨ Load audio when chapter changes in read-along mode
  useEffect(() => {
    if (readAlongMode) {
      loadChapterAudio();
    }
  }, [chapterIdx, readAlongMode]);

  // Scroll current verse into center in both panes
  useEffect(() => {
    const enEl = enPaneRef.current?.querySelector(`#v_en_${verse?.verseNumber}`) as HTMLElement | null;
    const faEl = faPaneRef.current?.querySelector(`#v_fa_${verse?.verseNumber}`) as HTMLElement | null;
    [enEl, faEl].forEach((el) => {
      if (!el) return;
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }, [verseIdx, chapterIdx, verse?.verseNumber]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { nextVerse(); }
      else if (e.key === "ArrowLeft") { prevVerse(); }
      else if (e.key === "PageDown") { nextChapter(); }
      else if (e.key === "PageUp") { prevChapter(); }
      else if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); }
      else if (e.key === "f" || e.key === "F") { requestFullscreen(containerRef.current); }
      else if (e.key === "+") { setFontScale((s) => Math.min(1.8, s + 0.05)); }
      else if (e.key === "-") { setFontScale((s) => Math.max(0.8, s - 0.05)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextVerse, prevVerse, nextChapter, prevChapter]);

  // Playback logic: prefer per-verse audio; else use Web Speech API (both languages if selected)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!playing) return;
      const v = verse; if (!v) return;

      // choose mode
      const tryAudio = (url?: string) => new Promise<void>((resolve) => {
        if (!url || !audioRef.current) return resolve();
        const audio = audioRef.current;
        audio.src = url;
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      });

      if (readingMode === "fa" || readingMode === "both") {
        if (v.audio_fa) await tryAudio(v.audio_fa);
        // Remove number from text for better TTS language detection
        else await speak(v.text_fa, "fa-IR");
      }
      if (!cancelled && (readingMode === "en" || readingMode === "both")) {
        if (v.audio_en) await tryAudio(v.audio_en);
        // Remove number from text for better TTS language detection
        else await speak(v.text_en, "en-US");
      }

      if (!cancelled && autoAdvance) nextVerse();
    };

    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, verseIdx, chapterIdx, readingMode, autoAdvance]);

  const headerColors = useMemo(() => ({ en: "bg-sky-600", fa: "bg-lime-600" }), []);

  return (
    <div ref={containerRef} className="w-full h-full bg-neutral-900 text-neutral-50 relative">
      {/* ⚠️ Warning banner if no English translation - now at top-12 to avoid blocking back button */}
      {!hasEnglishTranslation && (
        <div className="fixed z-40 top-12 left-1/2 -translate-x-1/2 bg-amber-600/95 text-white text-center px-4 py-1.5 text-xs rounded-lg backdrop-blur shadow-md max-w-md" dir="rtl">
          ⚠️ فقط ترجمه فارسی موجود است
        </div>
      )}

      {/* Controls */}
      <div className={`fixed z-50 left-1/2 -translate-x-1/2 top-3 flex items-center gap-2 rounded-2xl bg-neutral-800/80 px-3 py-2 backdrop-blur shadow-lg`}>
        <button className="px-3 py-1 rounded-xl bg-neutral-700 hover:bg-neutral-600" onClick={() => setPlaying((p) => !p)}>
          {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button className="px-3 py-1 rounded-xl bg-neutral-700 hover:bg-neutral-600" onClick={prevVerse}><SkipBack className="w-5 h-5" /></button>
        <button className="px-3 py-1 rounded-xl bg-neutral-700 hover:bg-neutral-600" onClick={nextVerse}><SkipForward className="w-5 h-5" /></button>
        <button className={`px-3 py-1 rounded-xl ${autoAdvance ? "bg-emerald-600" : "bg-neutral-700 hover:bg-neutral-600"}`} onClick={() => setAutoAdvance(a => !a)} title="Auto advance"><RefreshCw className="w-5 h-5" /></button>
        <button className="px-3 py-1 rounded-xl bg-neutral-700 hover:bg-neutral-600" onClick={() => requestFullscreen(containerRef.current)}><Maximize2 className="w-5 h-5" /></button>
        <div className="mx-2 text-sm opacity-90">Ch {chapter.chapterNumber} • V {verse?.verseNumber ?? 1}</div>
        <div className="flex items-center gap-1 text-xs">
          <Type className="w-4 h-4" />
          <button className="px-2 py-0.5 rounded bg-neutral-700" onClick={() => setFontScale(s => Math.max(0.8, s - 0.05))}>A-</button>
          <button className="px-2 py-0.5 rounded bg-neutral-700" onClick={() => setFontScale(s => Math.min(1.8, s + 0.05))}>A+</button>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Book className="w-4 h-4" />
          <select className="bg-neutral-700 rounded px-2 py-0.5" value={displayMode} onChange={(e) => setDisplayMode(e.target.value as any)}>
            {hasEnglishTranslation && <option value="both">هر دو زبان</option>}
            <option value="fa">فقط فارسی</option>
            {hasEnglishTranslation && <option value="en">فقط انگلیسی</option>}
          </select>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Volume2 className="w-4 h-4" />
          <select className="bg-neutral-700 rounded px-2 py-0.5" value={readingMode} onChange={(e) => setReadingMode(e.target.value as any)}>
            <option value="fa">خواندن فارسی</option>
            {hasEnglishTranslation && <option value="en">خواندن انگلیسی</option>}
          </select>

          {/* ✨ NEW: Color Picker for Highlight */}
          <div className="flex items-center gap-1 ml-2 border-l border-white/20 pl-2">
            <span className="text-[10px] opacity-70">Highlight:</span>
            <input
              type="color"
              value={highlightColor}
              onChange={(e) => setHighlightColor(e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-none bg-transparent p-0"
              title="رنگ هایلایت"
            />
          </div>
        </div>
        <button
          className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700"
          onClick={testSpeak}
          title="Test Voice">
          🔊
        </button>
        {/* ✨ NEW: Read-Along Mode Toggle */}
        <button
          className={`px-3 py-1 rounded-xl font-semibold text-xs ${readAlongMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-neutral-700 hover:bg-neutral-600'}`}
          onClick={() => setReadAlongMode(!readAlongMode)}
          title="حالت روخوانی کلمه به کلمه">
          {readAlongMode ? '🎤 روخوانی' : '📖 معمولی'}
        </button>
      </div>

      {/* 🎵 Audio Player - Positioned at the BOTTOM to avoid overlapping main toolbar */}
      {enableAudio && bookCode && (
        <div className="fixed z-50 left-1/2 -translate-x-1/2 bottom-20 sm:bottom-8 w-[94vw] sm:w-auto">
          <PresentationAudioPlayer
            bookCode={bookCode}
            chapter={chapter.chapterNumber}
            compact={true}
            autoPlay={false}
            isPlaying={playing} // ✨ Sync with toolbar
            onPlayingChange={setPlaying} // ✨ Notify toolbar of changes
            onTimeUpdate={(time: number) => {
              setCurrentAudioTime(time);

              // ✨ Use ACTUAL timing data from verses, not character count
              if (chapter.verses && chapter.verses.length > 0) {
                // Find the verse that matches current audio time
                for (let i = 0; i < chapter.verses.length; i++) {
                  const verse = chapter.verses[i];
                  // Check if this verse has timing data
                  if (verse.timing && verse.timing.start !== undefined && verse.timing.end !== undefined) {
                    if (time >= verse.timing.start && time < verse.timing.end) {
                      if (verseIdx !== i) {
                        setVerseIdx(i);
                      }
                      break; // Found the current verse, stop searching
                    }
                  }
                }
              }
            }}
            onDurationChange={(dur: number) => {
              durationRef.current = dur;
            }}
          />
        </div>
      )}

      {/* Page */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`chapter-${chapter.chapterNumber}`}
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -60, opacity: 0 }}
          transition={{ type: "tween", duration: 0.35 }}
          className="w-full h-full flex flex-col"
        >
          {/* Headers */}
          <div className={`grid ${displayMode === 'both' ? 'grid-cols-2' : 'grid-cols-1'} gap-0`}>
            {(displayMode === 'fa' || displayMode === 'both') && (
              <div className={`px-4 py-3 ${headerColors.fa} text-white font-semibold text-xl flex items-center justify-between`} dir="rtl">
                <span className="text-right">{data.book_fa} {chapter.chapterNumber}</span>
                <span className="text-sm opacity-80">
                  فارسی {data.translation_name?.fa && `(${data.translation_name.fa})`}
                </span>
              </div>
            )}
            {(displayMode === 'en' || displayMode === 'both') && (
              <div className={`px-4 py-3 ${headerColors.en} text-white font-semibold text-xl flex items-center justify-between`} dir="ltr">
                <span className="flex items-center gap-2"><Book className="w-5 h-5" /> {data.book_en} {chapter.chapterNumber}</span>
                <span className="text-sm opacity-80">
                  English {data.translation_name?.en && `(${data.translation_name.en})`}
                </span>
              </div>
            )}
          </div>

          {/* ✨ Conditional rendering: Read-Along Mode or Normal Mode */}
          {readAlongMode ? (
            /* Read-Along View - Karaoke style */
            <ReadAlongView
              chapter={chapter}
              audioUrl={audioUrl}
              wordsPerSecond={wordsPerSecond}
              onWordsPerSecondChange={setWordsPerSecond}
              fontScale={fontScale}
              bookName={data.book_fa}
              playing={playing}
              onPlayPause={togglePlayPause}
              onStop={stopAudio}
              viewMode={displayMode} // ✨ Pass view mode
              highlightColor={highlightColor} // ✨ Pass custom color
              audioRef={sharedAudioRef} // ✨ Pass shared audio ref
            />
          ) : (
            /* Normal Two-Pane View */
            <div className={`flex-1 grid grid-cols-1 ${displayMode === 'both' ? 'md:grid-cols-2' : ''} gap-0 overflow-hidden`}>
              {/* Persian pane - RIGHT SIDE */}
              {(displayMode === 'fa' || displayMode === 'both') && (
                <div ref={faPaneRef} className="h-full overflow-y-auto bg-neutral-100 text-neutral-900 p-6" dir="rtl">
                  {chapter.verses.map((v) => (
                    <div key={`fa-${v.verseNumber}`} id={`v_fa_${v.verseNumber}`} className={`transition-colors rounded-xl px-4 py-2 mb-2 ${v.verseNumber === verse?.verseNumber ? "bg-yellow-200" : "bg-white"}`}
                      style={{ fontSize: `${fontScale}rem`, lineHeight: 2 }}>
                      <span className="text-lime-700 font-bold ml-2 text-2xl align-top">{v.verseNumber}</span>
                      <span className="align-middle" style={{ fontFamily: '"B Homa", ui-sans-serif, system-ui' }}>{v.text_fa}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* English pane - LEFT SIDE */}
              {(displayMode === 'en' || displayMode === 'both') && (
                <div ref={enPaneRef} className="h-full overflow-y-auto bg-neutral-50 text-neutral-900 p-6" dir="ltr">
                  {chapter.verses.map((v) => (
                    <div key={`en-${v.verseNumber}`} id={`v_en_${v.verseNumber}`} className={`transition-colors rounded-xl px-4 py-2 mb-2 ${v.verseNumber === verse?.verseNumber ? "bg-yellow-200" : "bg-white"}`}
                      style={{ fontSize: `${fontScale}rem`, lineHeight: 1.8 }}>
                      <span className="text-sky-700 font-bold mr-2 text-2xl align-top">{v.verseNumber}</span>
                      <span className="align-middle">{v.text_en}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Hidden audio element for per-verse files */}
      <audio ref={audioRef} className="hidden" />

      {/* Footer tips */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-neutral-800 bg-white/90 backdrop-blur px-4 py-2 rounded-lg text-xs opacity-80 shadow-lg z-50">
        کلیدها: ←/→ آیه • PgUp/PgDn فصل • Space پخش/توقف • F تمام صفحه • +/- اندازه فونت
        <br />
        <span className="text-amber-600 font-semibold">💡 نکته:</span> برای شنیدن صدای فارسی، دکمه 🔊 را بزنید. اگر صدای فارسی در سیستم شما نباشد، صدای عربی یا پیش‌فرض سیستم استفاده می‌شود.
      </div>
    </div>
  );
};

export default BilingualBiblePresentation;

// ------------------ SAMPLE DATA (you can replace) ------------------
// Drop-in minimal example to see it working quickly.
export const sampleData: BiblePayload = {
  book_en: "Ephesians",
  book_fa: "افسسیان",
  chapters: [
    {
      chapterNumber: 1,
      verses: [
        {
          verseNumber: 15,
          text_en: "For this reason, ever since I heard about your faith in the Lord Jesus and your love for all the saints,",
          text_fa: "از آن جهت که چون خبر ایمان شما را به خداوند عیسی و محبت شما را با همه مقدسین شنیدم،",
          audio_en: "",
          audio_fa: ""
        },
        {
          verseNumber: 16,
          text_en: "I have not stopped giving thanks for you, remembering you in my prayers.",
          text_fa: "از بابت شما باز شکرگزاری نمی‌بس کنم و شما را در دعاهای خود یاد می‌آورم.",
        },
        {
          verseNumber: 17,
          text_en: "I keep asking that the God of our Lord Jesus Christ, the glorious Father, may give you the Spirit of wisdom and revelation...",
          text_fa: "تضرع می‌کنم که خدای خداوند ما عیسی مسیح، آن پدرِ باشکوه، شما را روح حکمت و مکاشفه عطا فرماید...",
        },
      ]
    }
  ]
};

// Example of rendering in your app:
// export default function App() { return <BilingualBiblePresentation data={sampleData} autoStart/> }
