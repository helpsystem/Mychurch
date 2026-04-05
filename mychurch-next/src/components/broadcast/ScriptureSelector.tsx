"use client";

/**
 * 📖 Scripture Selector - انتخابگر آیات کتاب مقدس
 *
 * بازسازی کامل با همان تجربه صفحه /bible:
 * - Layout دوستونه: Sidebar (ناوبری) + Reader (متن کامل باب)
 * - خواندن متن کامل باب در حالت EN / FA / Parallel
 * - کلیک روی آیه = انتخاب/حذف از لیست (با highlight)
 * - اسلاید چندآیه‌ای باز‌شونده (ReferenceList + Popup)
 * - پخش صوت (اگر API ارائه دهد)
 * - ذخیره تنظیمات در localStorage
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScripturePage, ScriptureReferenceItem } from "@/types/broadcast";
import {
  BookOpen, ChevronLeft, ChevronRight, Search, X, Plus, Trash2,
  Play, Pause, Music2, Columns2, List, Loader2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface BibleVersion {
  version_id: number;
  abbr: string;
  name: string;
  language: string;
  hasAudio?: boolean;
}

interface BookItem {
  book_id: string;        // e.g. "GEN", "JHN" — used directly in API calls
  book_name_en: string;
  book_name_fa: string;
  testament: string;      // "OT" | "NT"
  book_order: number;
  chapter_count: number;
}

interface ParallelVerse {
  verse_num: number;
  en: string | null;
  fa: string | null;
}

interface AudioTrack {
  audio_version_id: number;
  title: string;
  dramatized: number;
  mp3_url: string;
}

interface SelectedVerseEntry {
  id: string;         // unique: `${book_id}-${chapter}-${verse_num}`
  book_id: string;
  book_name_en: string;
  book_name_fa: string;
  book_order: number;
  chapter: number;
  verse_num: number;
  en: string;
  fa: string;
}

type ReadingMode = "en" | "fa" | "parallel";
type PrimaryLang = "fa" | "en";

interface ScriptureSelectorProps {
  onClose: () => void;
  onAddSlides: (slides: ScripturePage[]) => void;
  lang: "fa" | "en";
}

// ── Helper ─────────────────────────────────────────────────────────────────────

const persist = (key: string, value: string) => {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
};

const load = (key: string, fallback: string): string => {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
};

const formatTime = (s: number): string => {
  if (!isFinite(s) || s < 0) return "0:00";
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
};

// ── Component ──────────────────────────────────────────────────────────────────

const ScriptureSelector: React.FC<ScriptureSelectorProps> = ({
  onClose,
  onAddSlides,
  lang,
}) => {
  const isRTL = lang === "fa";

  // ── State: Versions & Books ─────────────────────────────────────────────────
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [selectedVersionEn, setSelectedVersionEn] = useState(() => load("bs_ver_en", "BSB"));
  const [selectedVersionFa, setSelectedVersionFa] = useState(() => load("bs_ver_fa", "NMV"));

  // ── State: Navigation ───────────────────────────────────────────────────────
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [bookSearch, setBookSearch] = useState("");

  // ── State: Reading ──────────────────────────────────────────────────────────
  const [readingMode, setReadingMode] = useState<ReadingMode>(
    () => load("bs_reading_mode", "parallel") as ReadingMode
  );
  const [parallelVerses, setParallelVerses] = useState<ParallelVerse[]>([]);
  const [loading, setLoading] = useState(false);

  // ── State: Display ──────────────────────────────────────────────────────────
  const [fontSize, setFontSize] = useState(() => parseInt(load("bs_fontsize", "18")));
  const [fontFa, setFontFa] = useState(() => load("bs_font_fa", "var(--font-vazirmatn)"));
  const [fontEn, setFontEn] = useState(() => load("bs_font_en", "var(--font-inter)"));
  const [primaryLang, setPrimaryLang] = useState<PrimaryLang>(
    () => load("bs_primary_lang", "fa") as PrimaryLang
  );

  // ── State: Audio ────────────────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [selectedTrackIdx, setSelectedTrackIdx] = useState(0);

  // ── State: Selection ────────────────────────────────────────────────────────
  const [selectedVerses, setSelectedVerses] = useState<SelectedVerseEntry[]>([]);
  const [combineIntoOneSlide, setCombineIntoOneSlide] = useState(
    () => load("bs_combine", "true") === "true"
  );

  // ── Derived ─────────────────────────────────────────────────────────────────
  const englishVersions = versions.filter((v) => v.language !== "fa");
  const persianVersions = versions.filter((v) => v.language === "fa");
  const otBooks = books.filter((b) => b.testament === "OT");
  const ntBooks = books.filter((b) => b.testament === "NT");
  const filteredBooks = bookSearch
    ? books.filter(
        (b) =>
          b.book_name_en.toLowerCase().includes(bookSearch.toLowerCase()) ||
          b.book_name_fa.includes(bookSearch)
      )
    : books;

  // ── Effect: Load Versions ───────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/bible/versions")
      .then((r) => r.json())
      .then((d) => {
        const vers: BibleVersion[] = d.versions || [];
        setVersions(vers);

        const savedFa = load("bs_ver_fa", "");
        const savedEn = load("bs_ver_en", "");

        if (!savedFa || !vers.some((v) => v.abbr === savedFa)) {
          const fa = vers.find((v) => v.abbr === "NMV") || vers.find((v) => v.language === "fa");
          if (fa) { setSelectedVersionFa(fa.abbr); persist("bs_ver_fa", fa.abbr); }
        }
        if (!savedEn || !vers.some((v) => v.abbr === savedEn)) {
          const en = vers.find((v) => v.abbr === "BSB") || vers.find((v) => v.language !== "fa");
          if (en) { setSelectedVersionEn(en.abbr); persist("bs_ver_en", en.abbr); }
        }
      })
      .catch(console.error);
  }, []);

  // ── Effect: Load Books (always by EN version for full 66-book list) ─────────
  useEffect(() => {
    if (!selectedVersionEn) return;
    fetch(`/api/bible/books?version=${selectedVersionEn}`)
      .then((r) => r.json())
      .then((d) => {
        const bks: BookItem[] = d.books || [];
        setBooks(bks);
        if (!selectedBook) {
          const jhn = bks.find((b) => b.book_id === "JHN");
          setSelectedBook(jhn || bks[0] || null);
        }
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVersionEn]);

  // ── Effect: Load Chapter Data ───────────────────────────────────────────────
  const loadChapter = useCallback(async () => {
    if (!selectedBook || !selectedVersionEn || !selectedVersionFa) return;
    setLoading(true);
    try {
      const r = await fetch(
        `/api/bible/parallel?versionEn=${selectedVersionEn}&versionFa=${selectedVersionFa}&book=${selectedBook.book_id}&chapter=${selectedChapter}`
      );
      const d = await r.json();
      setParallelVerses(d.parallel || []);

      const aFa: AudioTrack[] = d.audioFa || [];
      const aEn: AudioTrack[] = d.audioEn || [];
      const tracks = lang === "fa" ? (aFa.length ? aFa : aEn) : (aEn.length ? aEn : aFa);
      setAudioTracks(tracks);
      setSelectedTrackIdx(0);
    } catch (e) {
      console.error(e);
      setParallelVerses([]);
      setAudioTracks([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBook, selectedChapter, selectedVersionEn, selectedVersionFa, lang]);

  useEffect(() => {
    loadChapter();
    setIsPlaying(false);
    setAudioProgress(0);
  }, [loadChapter]);

  // ── Effect: Audio track change ──────────────────────────────────────────────
  useEffect(() => {
    if (!audioRef.current || !audioTracks[selectedTrackIdx]) return;
    audioRef.current.src = audioTracks[selectedTrackIdx].mp3_url;
    if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrackIdx, audioTracks]);

  // ── Handlers: Audio ─────────────────────────────────────────────────────────
  const togglePlay = () => {
    if (!audioRef.current || !audioTracks.length) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.src = audioTracks[selectedTrackIdx]?.mp3_url;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  // ── Handlers: Navigation ────────────────────────────────────────────────────
  const handleBookSelect = (book: BookItem) => {
    setSelectedBook(book);
    setSelectedChapter(1);
    setShowBookDropdown(false);
    setBookSearch("");
  };

  const prevChapter = () => {
    if (selectedChapter > 1) setSelectedChapter((c) => c - 1);
  };

  const nextChapter = () => {
    if (selectedBook && selectedChapter < selectedBook.chapter_count)
      setSelectedChapter((c) => c + 1);
  };

  // ── Handlers: Verse Selection ───────────────────────────────────────────────
  const isSelected = (verse_num: number) =>
    selectedVerses.some(
      (v) =>
        v.verse_num === verse_num &&
        v.chapter === selectedChapter &&
        v.book_id === selectedBook?.book_id
    );

  const toggleVerse = (v: ParallelVerse) => {
    if (!selectedBook) return;
    const id = `${selectedBook.book_id}-${selectedChapter}-${v.verse_num}`;
    setSelectedVerses((prev) => {
      const exists = prev.some((s) => s.id === id);
      if (exists) return prev.filter((s) => s.id !== id);
      return [
        ...prev,
        {
          id,
          book_id: selectedBook.book_id,
          book_name_en: selectedBook.book_name_en,
          book_name_fa: selectedBook.book_name_fa,
          book_order: selectedBook.book_order,
          chapter: selectedChapter,
          verse_num: v.verse_num,
          en: v.en || "",
          fa: v.fa || "",
        },
      ];
    });
  };

  // ── Build Slides & Add ──────────────────────────────────────────────────────
  const handleAddSlides = () => {
    if (selectedVerses.length === 0) return;

    // Sort: book_order → chapter → verse_num
    const sorted = [...selectedVerses].sort((a, b) => {
      if (a.book_order !== b.book_order) return a.book_order - b.book_order;
      if (a.chapter !== b.chapter) return a.chapter - b.chapter;
      return a.verse_num - b.verse_num;
    });

    // Group by book+chapter
    const groupMap = new Map<string, SelectedVerseEntry[]>();
    sorted.forEach((v) => {
      const key = `${v.book_id}-${v.chapter}`;
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(v);
    });

    // Build ScriptureReferenceItems — one per book+chapter group
    const referenceItems: ScriptureReferenceItem[] = Array.from(
      groupMap.values()
    ).map((group) => {
      const first = group[0];
      const verseNums = group.map((v) => v.verse_num).sort((a, b) => a - b);
      const minV = verseNums[0];
      const maxV = verseNums[verseNums.length - 1];
      const verses = minV === maxV ? `${minV}` : `${minV}-${maxV}`;

      return {
        id: crypto.randomUUID(),
        book: first.book_id,
        bookName: { fa: first.book_name_fa, en: first.book_name_en },
        chapter: first.chapter,
        verses,
        verseNumbers: verseNums,
        textFa: group.map((v) => v.fa),
        textEn: group.map((v) => v.en),
        fontFa,
        fontEn,
        translation: selectedVersionFa,
        enTranslation: selectedVersionEn,
      };
    });

    let slides: ScripturePage[];

    if (combineIntoOneSlide || referenceItems.length > 1) {
      // ── MODE: Single slide with expandable referenceList ──────────────────
      const isSingle = referenceItems.length === 1;
      const firstRef = referenceItems[0];

      const slide: ScripturePage = {
        id: crypto.randomUUID(),
        book: isSingle ? firstRef.book : "MULTI",
        bookName: isSingle
          ? firstRef.bookName
          : { fa: "مجموعه آیات", en: "Verse Collection" },
        chapter: isSingle ? firstRef.chapter : 0,
        verses: isSingle ? firstRef.verses : `${referenceItems.length} بخش`,
        verseNumbers: isSingle ? firstRef.verseNumbers : [],
        textPrimary: isSingle
          ? primaryLang === "fa" ? firstRef.textFa : firstRef.textEn
          : [],
        textSecondary: isSingle
          ? primaryLang === "fa" ? firstRef.textEn : firstRef.textFa
          : [],
        translation: selectedVersionFa,
        enTranslation: selectedVersionEn,
        displayMode: "referenceList",
        fontFa,
        fontEn,
        primaryLanguage: primaryLang,
        glassPopupEnabled: true,
        referenceItems,
        popupLabelFa: isSingle
          ? `${firstRef.bookName.fa} ${firstRef.chapter}:${firstRef.verses}`
          : `${referenceItems.length} آیه انتخابی`,
        popupLabelEn: isSingle
          ? `${firstRef.bookName.en} ${firstRef.chapter}:${firstRef.verses}`
          : `${referenceItems.length} Selected Verses`,
      };

      slides = [slide];
    } else {
      // ── MODE: Separate slide per section ──────────────────────────────────
      slides = referenceItems.map((ref) => ({
        id: crypto.randomUUID(),
        book: ref.book,
        bookName: ref.bookName,
        chapter: ref.chapter,
        verses: ref.verses,
        verseNumbers: ref.verseNumbers,
        textPrimary: primaryLang === "fa" ? ref.textFa : ref.textEn,
        textSecondary: primaryLang === "fa" ? ref.textEn : ref.textFa,
        translation: selectedVersionFa,
        enTranslation: selectedVersionEn,
        displayMode: "list" as const,
        fontFa,
        fontEn,
        primaryLanguage: primaryLang,
        glassPopupEnabled: false,
        referenceItems: [ref],
        popupLabelFa: `${ref.bookName.fa} ${ref.chapter}:${ref.verses}`,
        popupLabelEn: `${ref.bookName.en} ${ref.chapter}:${ref.verses}`,
      }));
    }

    onAddSlides(slides);
    setSelectedVerses([]);
    onClose();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col" dir="ltr">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setAudioProgress(audioRef.current.currentTime);
            setAudioDuration(audioRef.current.duration || 0);
          }
        }}
        onEnded={() => setIsPlaying(false)}
      />

      {/* ══ HEADER ════════════════════════════════════════════════════════════ */}
      <div className="shrink-0 bg-[#0e0e0f]/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center gap-3 flex-wrap">
        <BookOpen className="w-5 h-5 text-blue-400 shrink-0" />
        <span className="font-bold text-white text-base shrink-0">
          {isRTL ? "انتخاب آیه کتاب مقدس" : "Select Bible Verse"}
        </span>

        {/* Reading Mode */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 ml-auto">
          <button
            onClick={() => { setReadingMode("en"); persist("bs_reading_mode", "en"); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${readingMode === "en" ? "bg-blue-500 text-white shadow" : "text-slate-400 hover:text-white"}`}
          >EN</button>
          <button
            onClick={() => { setReadingMode("fa"); persist("bs_reading_mode", "fa"); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${readingMode === "fa" ? "bg-purple-500 text-white shadow" : "text-slate-400 hover:text-white"}`}
          >FA</button>
          <button
            onClick={() => { setReadingMode("parallel"); persist("bs_reading_mode", "parallel"); }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${readingMode === "parallel" ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow" : "text-slate-400 hover:text-white"}`}
          >
            <Columns2 className="w-3 h-3" /> EN|FA
          </button>
        </div>

        {/* Font Size */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { const s = Math.max(13, fontSize - 2); setFontSize(s); persist("bs_fontsize", String(s)); }}
            className="px-2 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            title="Decrease font size"
          >A-</button>
          <span className="text-xs text-slate-600 tabular-nums w-7 text-center">{fontSize}</span>
          <button
            onClick={() => { const s = Math.min(36, fontSize + 2); setFontSize(s); persist("bs_fontsize", String(s)); }}
            className="px-2 py-1.5 rounded-lg text-sm font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            title="Increase font size"
          >A+</button>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          aria-label="Close scripture selector"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ══ BODY ══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex min-h-0">

        {/* ─── SIDEBAR ──────────────────────────────────────────────────────── */}
        <aside className="w-[270px] shrink-0 flex flex-col bg-[#111113] border-r border-white/10 overflow-y-auto">

          {/* Book Selector */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <button
                onClick={() => setShowBookDropdown((v) => !v)}
                className="w-full flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-bold transition-all text-left"
                aria-label="Select Bible book"
              >
                <BookOpen className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="flex-1 truncate text-white">
                  {selectedBook
                    ? lang === "fa"
                      ? <span className="font-[Vazirmatn]">{selectedBook.book_name_fa}</span>
                      : selectedBook.book_name_en
                    : (isRTL ? "انتخاب کتاب..." : "Select a book...")}
                </span>
                <List className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </button>

              {showBookDropdown && (
                <div className="absolute top-full mt-1 left-0 right-0 z-50 max-h-[55vh] overflow-y-auto bg-[#18181b] border border-white/20 rounded-2xl shadow-2xl p-2 ring-1 ring-white/10">
                  {/* Search */}
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      value={bookSearch}
                      onChange={(e) => setBookSearch(e.target.value)}
                      placeholder={isRTL ? "جستجوی کتاب..." : "Search books..."}
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500/50 text-white"
                    />
                  </div>

                  {bookSearch ? (
                    <div className="flex flex-col gap-0.5">
                      {filteredBooks.map((b) => (
                        <button
                          key={b.book_id}
                          onClick={() => handleBookSelect(b)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-all hover:bg-white/10 ${selectedBook?.book_id === b.book_id ? "bg-blue-500/20 text-blue-400 font-bold" : "text-zinc-300"}`}
                        >
                          <span className="font-[Vazirmatn] text-[13px]" dir="rtl">{b.book_name_fa}</span>
                          <span className="text-zinc-500 text-xs">{b.book_name_en}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/70 px-2 mt-1 mb-1">
                        {isRTL ? "عهد عتیق — Old Testament" : "Old Testament — عهد عتیق"}
                      </p>
                      {otBooks.map((b) => (
                        <button
                          key={b.book_id}
                          onClick={() => handleBookSelect(b)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-all hover:bg-white/10 ${selectedBook?.book_id === b.book_id ? "bg-blue-500/20 text-blue-400 font-bold" : "text-zinc-300"}`}
                        >
                          <span className="font-[Vazirmatn] text-[13px]" dir="rtl">{b.book_name_fa}</span>
                          <span className="text-zinc-500 text-xs">{b.book_id}</span>
                        </button>
                      ))}
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400/70 px-2 mt-3 mb-1">
                        {isRTL ? "عهد جدید — New Testament" : "New Testament — عهد جدید"}
                      </p>
                      {ntBooks.map((b) => (
                        <button
                          key={b.book_id}
                          onClick={() => handleBookSelect(b)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-all hover:bg-white/10 ${selectedBook?.book_id === b.book_id ? "bg-blue-500/20 text-blue-400 font-bold" : "text-zinc-300"}`}
                        >
                          <span className="font-[Vazirmatn] text-[13px]" dir="rtl">{b.book_name_fa}</span>
                          <span className="text-zinc-500 text-xs">{b.book_id}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chapter Navigator */}
          <div className="p-3 border-b border-white/10">
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={prevChapter}
                disabled={selectedChapter <= 1}
                className="p-2.5 hover:bg-white/10 transition-colors disabled:opacity-20"
                aria-label="Previous chapter"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 text-center py-2">
                <span className="font-black text-sm text-blue-400">
                  {isRTL ? `باب ${selectedChapter}` : `Ch. ${selectedChapter}`}
                </span>
                {selectedBook && (
                  <span className="text-slate-600 text-xs font-normal ml-1">
                    / {selectedBook.chapter_count}
                  </span>
                )}
              </div>
              <button
                onClick={nextChapter}
                disabled={!selectedBook || selectedChapter >= selectedBook.chapter_count}
                className="p-2.5 hover:bg-white/10 transition-colors disabled:opacity-20"
                aria-label="Next chapter"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Persian Version */}
          <div className="p-3 border-b border-white/10">
            <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest block mb-2">
              🇮🇷 {isRTL ? "ترجمه فارسی" : "Persian Version"}
            </label>
            {persianVersions.length === 0 ? (
              <p className="text-xs text-slate-600 italic">Loading...</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {persianVersions.map((v) => (
                  <button
                    key={v.abbr}
                    onClick={() => { setSelectedVersionFa(v.abbr); persist("bs_ver_fa", v.abbr); }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all font-[Vazirmatn] ${selectedVersionFa === v.abbr ? "bg-purple-600/20 text-purple-300 border-purple-500/50 shadow-md" : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white"}`}
                  >
                    {v.name.length > 15 ? v.abbr : v.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* English Version */}
          <div className="p-3 border-b border-white/10">
            <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest block mb-2">
              🇺🇸 {isRTL ? "ترجمه انگلیسی" : "English Version"}
            </label>
            {englishVersions.length === 0 ? (
              <p className="text-xs text-slate-600 italic">Loading...</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {englishVersions.slice(0, 8).map((v) => (
                  <button
                    key={v.abbr}
                    onClick={() => { setSelectedVersionEn(v.abbr); persist("bs_ver_en", v.abbr); }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${selectedVersionEn === v.abbr ? "bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-md" : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white"}`}
                  >
                    {v.hasAudio ? "🔊 " : ""}{v.abbr}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fonts */}
          <div className="p-3 border-b border-white/10">
            <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest block mb-2">
              {isRTL ? "فونت" : "Fonts"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-slate-600 mb-1">FA</p>
                <select
                  value={fontFa}
                  onChange={(e) => { setFontFa(e.target.value); persist("bs_font_fa", e.target.value); }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none [&>option]:bg-zinc-900"
                  aria-label="Farsi font"
                >
                  <option value="var(--font-vazirmatn)">Vazirmatn</option>
                  <option value="var(--font-nastaliq)">Nastaliq</option>
                  <option value="var(--font-lalezar)">Lalezar</option>
                </select>
              </div>
              <div>
                <p className="text-[10px] text-slate-600 mb-1">EN</p>
                <select
                  value={fontEn}
                  onChange={(e) => { setFontEn(e.target.value); persist("bs_font_en", e.target.value); }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none [&>option]:bg-zinc-900"
                  aria-label="English font"
                >
                  <option value="var(--font-inter)">Inter</option>
                  <option value="var(--font-playfair)">Playfair</option>
                  <option value="var(--font-merriweather)">Merriweather</option>
                </select>
              </div>
            </div>
          </div>

          {/* Primary Language for Slides */}
          <div className="p-3 border-b border-white/10">
            <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest block mb-2">
              {isRTL ? "زبان اولیه اسلاید" : "Slide Primary Language"}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => { setPrimaryLang("fa"); persist("bs_primary_lang", "fa"); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${primaryLang === "fa" ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/50" : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"}`}
              >🇮🇷 FA (بالا)</button>
              <button
                onClick={() => { setPrimaryLang("en"); persist("bs_primary_lang", "en"); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${primaryLang === "en" ? "bg-blue-600/20 text-blue-400 border-blue-500/50" : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"}`}
              >🇺🇸 EN (Top)</button>
            </div>
          </div>

          {/* Slide Output Mode */}
          <div className="p-3 border-b border-white/10">
            <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest block mb-3">
              {isRTL ? "نوع خروجی اسلاید" : "Slide Output Mode"}
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={combineIntoOneSlide}
                onChange={(e) => { setCombineIntoOneSlide(e.target.checked); persist("bs_combine", String(e.target.checked)); }}
                className="accent-indigo-500 w-4 h-4 mt-0.5 shrink-0"
              />
              <span className="text-xs text-slate-300 leading-relaxed group-hover:text-white transition-colors font-[Vazirmatn]">
                {isRTL
                  ? "📋 یک اسلاید با فهرست باز‌شونده (کلیک = متن کامل)"
                  : "📋 One slide — expandable list (click = full text)"}
              </span>
            </label>
            <p className="text-[10px] text-slate-600 mt-2 mr-7 font-[Vazirmatn]">
              {isRTL
                ? "غیرفعال = هر گروه کتاب+فصل یک اسلاید مجزا می‌شود"
                : "Unchecked = each book+chapter group becomes a separate slide"}
            </p>
          </div>

          {/* Audio Player */}
          {audioTracks.length > 0 && (
            <div className="p-3 mt-auto">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                    <Music2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-bold truncate">
                      {selectedBook?.book_name_en} — Ch. {selectedChapter}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{audioTracks[selectedTrackIdx]?.title}</p>
                  </div>
                  <button
                    onClick={togglePlay}
                    className="w-9 h-9 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center transition-all hover:scale-105 shrink-0 shadow-lg shadow-blue-500/30"
                    aria-label={isPlaying ? "Pause audio" : "Play audio"}
                  >
                    {isPlaying
                      ? <Pause className="w-4 h-4 text-white" />
                      : <Play className="w-4 h-4 text-white ml-0.5" />}
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                  <span className="tabular-nums w-8 text-right">{formatTime(audioProgress)}</span>
                  <div className="relative flex-1 h-2 flex items-center group">
                    <input
                      type="range"
                      min={0}
                      max={audioDuration || 100}
                      value={audioProgress}
                      onChange={(e) => {
                        if (!audioRef.current) return;
                        audioRef.current.currentTime = Number(e.target.value);
                        setAudioProgress(Number(e.target.value));
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      aria-label="Audio progress"
                    />
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full pointer-events-none"
                        style={{ width: `${(audioProgress / (audioDuration || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="tabular-nums w-8">{formatTime(audioDuration)}</span>
                </div>

                {/* Multiple tracks */}
                {audioTracks.length > 1 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {audioTracks.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => { setSelectedTrackIdx(i); setIsPlaying(true); }}
                        className={`text-[10px] px-2.5 py-1 rounded-full border transition-all font-bold ${selectedTrackIdx === i ? "bg-blue-500 border-blue-500 text-white" : "bg-white/5 border-white/10 text-slate-500 hover:border-white/20"}`}
                      >
                        {t.dramatized ? "Dramatized" : "Standard"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* ─── READER PANEL ──────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-[#0e0e0f] pb-20">
          {/* Chapter Title */}
          {selectedBook && (
            <div className="text-center pt-8 pb-6 border-b border-white/5" dir="ltr">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-1">
                {selectedBook.book_name_en}
              </p>
              <h1 className="text-2xl font-black tracking-tight">Chapter {selectedChapter}</h1>
              {selectedBook.book_name_fa && (
                <p className="font-[Vazirmatn] mt-1.5 text-base text-slate-400" dir="rtl">
                  {selectedBook.book_name_fa} — باب {selectedChapter}
                </p>
              )}
            </div>
          )}

          {/* Selection hint */}
          <div className="max-w-4xl mx-auto px-4 pt-4 pb-1">
            <p className="text-xs text-slate-600 text-center">
              {isRTL ? "برای انتخاب هر آیه روی آن کلیک کنید" : "Click on any verse to select it"}
            </p>
          </div>

          {/* Verses */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 pb-16 pt-4">

              {/* Parallel Mode */}
              {readingMode === "parallel" && (
                <div className="space-y-3">
                  {parallelVerses.map((v) => (
                    <div
                      key={v.verse_num}
                      onClick={() => toggleVerse(v)}
                      className={`grid grid-cols-2 gap-4 md:gap-8 p-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                        isSelected(v.verse_num)
                          ? "bg-amber-500/10 border border-amber-500/30"
                          : "hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      {/* English side */}
                      <div className="flex gap-3" dir="ltr">
                        <span className="text-xs font-black text-blue-500/60 mt-1 shrink-0 select-none">
                          {v.verse_num}
                        </span>
                        <p
                          className="text-zinc-100 leading-relaxed"
                          style={{ fontSize: `${fontSize}px`, fontFamily: fontEn }}
                        >
                          {v.en || <span className="text-zinc-600 italic text-sm">—</span>}
                        </p>
                      </div>
                      {/* Farsi side */}
                      <div className="flex gap-3 text-right" dir="rtl">
                        <span className="text-xs font-black text-purple-500/60 mt-1 shrink-0 select-none">
                          {v.verse_num}
                        </span>
                        <p
                          className="text-zinc-100 leading-relaxed"
                          style={{ fontSize: `${fontSize + 2}px`, fontFamily: fontFa }}
                        >
                          {v.fa || <span className="text-zinc-600 italic text-sm">—</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* English only */}
              {readingMode === "en" && (
                <div
                  className="space-y-1 prose prose-invert max-w-none"
                  dir="ltr"
                  style={{ fontSize: `${fontSize}px`, lineHeight: 1.9, fontFamily: fontEn }}
                >
                  {parallelVerses.map((v) => (
                    <span
                      key={v.verse_num}
                      onClick={() => toggleVerse(v)}
                      className={`inline cursor-pointer rounded px-1 transition-all duration-200 ${
                        isSelected(v.verse_num)
                          ? "bg-amber-500/30 text-amber-200 border-b-2 border-amber-500"
                          : "hover:bg-white/8 active:scale-95"
                      }`}
                    >
                      <sup className="text-[0.6em] font-black text-blue-400/70 mr-1 select-none not-prose">
                        {v.verse_num}
                      </sup>
                      {v.en}{" "}
                    </span>
                  ))}
                </div>
              )}

              {/* Farsi only */}
              {readingMode === "fa" && (
                <div
                  className="text-right space-y-0.5"
                  dir="rtl"
                  style={{ fontSize: `${fontSize}px`, lineHeight: 2.3, fontFamily: fontFa }}
                >
                  {parallelVerses.length === 0 ? (
                    <p className="text-center text-slate-600 italic py-8">— ترجمه‌ای یافت نشد —</p>
                  ) : parallelVerses.map((v) => (
                    <span
                      key={v.verse_num}
                      onClick={() => toggleVerse(v)}
                      className={`inline cursor-pointer rounded px-1 transition-all duration-200 ${
                        isSelected(v.verse_num)
                          ? "bg-amber-500/30 text-amber-100 border-b-2 border-amber-500"
                          : "hover:bg-white/5 active:scale-95"
                      }`}
                    >
                      <sup className="text-[0.6em] font-black text-purple-400/70 ml-1 select-none">
                        {v.verse_num}
                      </sup>
                      {v.fa}{" "}
                    </span>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && parallelVerses.length === 0 && (
                <p className="text-center text-slate-600 py-16">
                  {isRTL ? "آیه‌ای یافت نشد" : "No verses found"}
                </p>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ══ BOTTOM ACTION BAR ════════════════════════════════════════════════ */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[60] transition-all duration-500 ease-out ${
          selectedVerses.length > 0 ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-amber-500 text-black px-4 md:px-6 py-3.5 flex items-center gap-4 font-bold shadow-2xl flex-wrap">
          <span className="text-sm font-black border-r border-black/20 pr-4 shrink-0">
            {selectedVerses.length}{" "}
            {isRTL ? "آیه انتخاب شده" : "verses selected"}
          </span>

          {/* Selected references preview */}
          <div className="flex-1 flex flex-wrap gap-1.5 min-w-0 overflow-hidden">
            {Array.from(new Set(selectedVerses.map((v) => `${v.book_name_fa}-${v.chapter}`))).slice(0, 4).map((key) => {
              const parts = key.split("-");
              const chapterPart = parts[parts.length - 1];
              const bookPart = parts.slice(0, -1).join("-");
              return (
                <span key={key} className="text-xs bg-black/15 text-black/80 px-2 py-0.5 rounded-full font-[Vazirmatn] shrink-0">
                  {bookPart} {chapterPart}
                </span>
              );
            })}
            {Array.from(new Set(selectedVerses.map((v) => `${v.book_name_fa}-${v.chapter}`))).length > 4 && (
              <span className="text-xs bg-black/15 text-black/80 px-2 py-0.5 rounded-full shrink-0">…</span>
            )}
          </div>

          {/* Clear */}
          <button
            onClick={() => setSelectedVerses([])}
            className="flex items-center gap-1.5 hover:opacity-70 transition-opacity shrink-0 text-sm"
            aria-label="Clear selected verses"
          >
            <Trash2 className="w-4 h-4" />
            {isRTL ? "پاک کردن" : "Clear"}
          </button>

          {/* Add to Slide */}
          <button
            onClick={handleAddSlides}
            className="flex items-center gap-2 bg-black text-white px-5 py-2 rounded-xl hover:bg-black/80 transition-all font-bold shadow-xl shrink-0"
            aria-label="Add selected verses to slide"
          >
            <Plus className="w-4 h-4" />
            {isRTL ? "افزودن به اسلاید" : "Add to Slide"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScriptureSelector;
