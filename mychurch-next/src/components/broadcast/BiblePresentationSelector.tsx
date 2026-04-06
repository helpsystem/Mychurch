"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Columns2, List, Loader2, Music2, Pause, Play, Search, Trash2, X } from "lucide-react";
import { ScripturePage, ScriptureReferenceItem } from "@/types/broadcast";

interface BibleVersion {
  version_id: number;
  abbr: string;
  name: string;
  language: string;
  hasAudio?: boolean;
}

interface BookItem {
  book_id: string;
  book_name_en: string;
  book_name_fa: string;
  testament: string;
  book_order: number;
  chapter_count: number;
}

interface VerseRow {
  verse_num: number;
  text: string;
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
  id: string;
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

interface BiblePresentationSelectorProps {
  onClose: () => void;
  onAddSlides: (slides: ScripturePage[]) => void;
  lang: "fa" | "en";
}

const persist = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

const load = (key: string, fallback: string): string => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

const formatTime = (value: number) => {
  if (!isFinite(value) || value < 0) return "0:00";
  return `${Math.floor(value / 60)}:${Math.floor(value % 60).toString().padStart(2, "0")}`;
};

export default function BiblePresentationSelector({ onClose, onAddSlides, lang }: BiblePresentationSelectorProps) {
  const isRTL = lang === "fa";
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [selectedVersionEn, setSelectedVersionEn] = useState(() => load("bp_ver_en", "BSB"));
  const [selectedVersionFa, setSelectedVersionFa] = useState(() => load("bp_ver_fa", "NMV"));
  const [selectedBookId, setSelectedBookId] = useState("GEN");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [bookSearch, setBookSearch] = useState("");
  const [showBookList, setShowBookList] = useState(false);
  const [showChapterGrid, setShowChapterGrid] = useState(false);
  const [readingMode, setReadingMode] = useState<ReadingMode>(() => load("bp_reading_mode", "parallel") as ReadingMode);
  const [fontSize, setFontSize] = useState(() => parseInt(load("bp_font_size", "18"), 10));
  const [fontFa, setFontFa] = useState(() => load("bp_font_fa", "var(--font-vazirmatn)"));
  const [fontEn, setFontEn] = useState(() => load("bp_font_en", "var(--font-inter)"));
  const [primaryLang, setPrimaryLang] = useState<PrimaryLang>(() => load("bp_primary_lang", "fa") as PrimaryLang);
  const [combineIntoOneSlide] = useState(() => load("bp_combine", "true") === "true");

  const [verses, setVerses] = useState<VerseRow[]>([]);
  const [faVerses, setFaVerses] = useState<VerseRow[]>([]);
  const [headings, setHeadings] = useState<{ before_verse: number; text: string }[]>([]);
  const [parallelVerses, setParallelVerses] = useState<ParallelVerse[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [selectedTrackIdx, setSelectedTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<SelectedVerseEntry[]>([]);

  const currentBook = books.find((book) => book.book_id === selectedBookId) || null;
  const filteredBooks = bookSearch
    ? books.filter((book) => book.book_name_en.toLowerCase().includes(bookSearch.toLowerCase()) || book.book_name_fa.includes(bookSearch))
    : books;
  const englishVersions = versions.filter((version) => version.language !== "fa");
  const persianVersions = versions.filter((version) => version.language === "fa");
  const headingMap = new Map(headings.map((heading) => [heading.before_verse, heading.text]));

  useEffect(() => {
    fetch("/api/bible/versions")
      .then((response) => response.json())
      .then((data) => {
        const items: BibleVersion[] = data.versions || [];
        setVersions(items);

        if (!items.some((version) => version.abbr === selectedVersionEn)) {
          const nextEn = items.find((version) => version.abbr === "BSB") || items.find((version) => version.language !== "fa");
          if (nextEn) {
            setSelectedVersionEn(nextEn.abbr);
            persist("bp_ver_en", nextEn.abbr);
          }
        }
        if (!items.some((version) => version.abbr === selectedVersionFa)) {
          const nextFa = items.find((version) => version.abbr === "NMV") || items.find((version) => version.language === "fa");
          if (nextFa) {
            setSelectedVersionFa(nextFa.abbr);
            persist("bp_ver_fa", nextFa.abbr);
          }
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!selectedVersionEn) return;
    fetch(`/api/bible/books?version=${selectedVersionEn}`)
      .then((response) => response.json())
      .then((data) => {
        const items: BookItem[] = data.books || [];
        setBooks(items);
        if (!items.length) return;
        if (!items.some((book) => book.book_id === selectedBookId)) {
          const nextBook = items.find((book) => book.book_id === "JHN") || items[0];
          setSelectedBookId(nextBook.book_id);
          setSelectedChapter(1);
        }
      })
      .catch(() => undefined);
  }, [selectedBookId, selectedVersionEn]);

  const loadChapter = useCallback(async () => {
    if (!currentBook || !selectedVersionEn || !selectedVersionFa) return;
    setLoading(true);

    try {
      const parallelResponse = await fetch(`/api/bible/parallel?versionEn=${selectedVersionEn}&versionFa=${selectedVersionFa}&book=${currentBook.book_id}&chapter=${selectedChapter}`);
      const parallelData = await parallelResponse.json();
      const nextParallel: ParallelVerse[] = parallelData.parallel || [];
      setParallelVerses(nextParallel);
      setAudioTracks((lang === "fa" ? parallelData.audioFa : parallelData.audioEn) || parallelData.audioEn || parallelData.audioFa || []);
      setSelectedTrackIdx(0);

      if (readingMode === "parallel") {
        setVerses([]);
        setFaVerses([]);
        setHeadings([]);
      } else if (readingMode === "fa") {
        const response = await fetch(`/api/bible/chapter?version=${selectedVersionFa}&book=${currentBook.book_id}&chapter=${selectedChapter}`);
        const data = await response.json();
        setFaVerses(data.verses || []);
        setVerses([]);
        setHeadings([]);
      } else {
        const response = await fetch(`/api/bible/chapter?version=${selectedVersionEn}&book=${currentBook.book_id}&chapter=${selectedChapter}`);
        const data = await response.json();
        setVerses(data.verses || []);
        setHeadings(data.headings || []);
        setFaVerses([]);
      }
    } catch {
      setParallelVerses([]);
      setVerses([]);
      setFaVerses([]);
      setHeadings([]);
      setAudioTracks([]);
    } finally {
      setLoading(false);
    }
  }, [currentBook, lang, readingMode, selectedChapter, selectedVersionEn, selectedVersionFa]);

  useEffect(() => {
    loadChapter();
    setIsPlaying(false);
    setAudioProgress(0);
  }, [loadChapter]);

  useEffect(() => {
    if (!audioRef.current || !audioTracks[selectedTrackIdx]) return;
    audioRef.current.src = audioTracks[selectedTrackIdx].mp3_url;
    if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
  }, [audioTracks, isPlaying, selectedTrackIdx]);

  const prevChapter = () => {
    if (selectedChapter > 1) setSelectedChapter((value) => value - 1);
  };

  const nextChapter = () => {
    if (currentBook && selectedChapter < currentBook.chapter_count) setSelectedChapter((value) => value + 1);
  };

  const selectBook = (book: BookItem) => {
    setSelectedBookId(book.book_id);
    setSelectedChapter(1);
    setShowBookList(false);
    setBookSearch("");
  };

  const getVerseTexts = (verseNum: number) => {
    const parallel = parallelVerses.find((verse) => verse.verse_num === verseNum);
    return {
      en: parallel?.en ?? verses.find((verse) => verse.verse_num === verseNum)?.text ?? "",
      fa: parallel?.fa ?? faVerses.find((verse) => verse.verse_num === verseNum)?.text ?? "",
    };
  };

  const toggleVerse = (verseNum: number) => {
    if (!currentBook) return;
    const id = `${currentBook.book_id}-${selectedChapter}-${verseNum}`;
    const texts = getVerseTexts(verseNum);

    setSelectedVerses((previous) => {
      if (previous.some((entry) => entry.id === id)) return previous.filter((entry) => entry.id !== id);
      return [...previous, {
        id,
        book_id: currentBook.book_id,
        book_name_en: currentBook.book_name_en,
        book_name_fa: currentBook.book_name_fa,
        book_order: currentBook.book_order,
        chapter: selectedChapter,
        verse_num: verseNum,
        en: texts.en,
        fa: texts.fa,
      }].sort((a, b) => a.book_order - b.book_order || a.chapter - b.chapter || a.verse_num - b.verse_num);
    });
  };

  const buildSlides = (): ScripturePage[] => {
    const sorted = [...selectedVerses].sort((a, b) => a.book_order - b.book_order || a.chapter - b.chapter || a.verse_num - b.verse_num);
    const groups = new Map<string, SelectedVerseEntry[]>();
    sorted.forEach((entry) => {
      const key = `${entry.book_id}-${entry.chapter}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(entry);
    });

    const referenceItems: ScriptureReferenceItem[] = Array.from(groups.values()).map((group) => {
      const first = group[0];
      const numbers = group.map((entry) => entry.verse_num).sort((a, b) => a - b);
      const min = numbers[0];
      const max = numbers[numbers.length - 1];
      const versesLabel = min === max ? `${min}` : `${min}-${max}`;

      return {
        id: crypto.randomUUID(),
        book: first.book_id,
        bookName: { fa: first.book_name_fa, en: first.book_name_en },
        chapter: first.chapter,
        verses: versesLabel,
        verseNumbers: numbers,
        textFa: group.map((entry) => entry.fa),
        textEn: group.map((entry) => entry.en),
        fontFa,
        fontEn,
        translation: selectedVersionFa,
        enTranslation: selectedVersionEn,
      };
    });

    if (combineIntoOneSlide || referenceItems.length > 1) {
      const firstReference = referenceItems[0];
      const single = referenceItems.length === 1;
      return [{
        id: crypto.randomUUID(),
        book: single ? firstReference.book : "MULTI",
        bookName: single ? firstReference.bookName : { fa: "مجموعه آیات", en: "Verse Collection" },
        chapter: single ? firstReference.chapter : 0,
        verses: single ? firstReference.verses : `${referenceItems.length} بخش`,
        verseNumbers: single ? firstReference.verseNumbers : [],
        textPrimary: single ? (primaryLang === "fa" ? firstReference.textFa : firstReference.textEn) : [],
        textSecondary: single ? (primaryLang === "fa" ? firstReference.textEn : firstReference.textFa) : [],
        translation: selectedVersionFa,
        enTranslation: selectedVersionEn,
        displayMode: "referenceList",
        fontFa,
        fontEn,
        primaryLanguage: primaryLang,
        glassPopupEnabled: true,
        referenceItems,
        popupLabelFa: single ? `${firstReference.bookName.fa} ${firstReference.chapter}:${firstReference.verses}` : `${referenceItems.length} آیه انتخابی`,
        popupLabelEn: single ? `${firstReference.bookName.en} ${firstReference.chapter}:${firstReference.verses}` : `${referenceItems.length} Selected Verses`,
      }];
    }

    return referenceItems.map((reference) => ({
      id: crypto.randomUUID(),
      book: reference.book,
      bookName: reference.bookName,
      chapter: reference.chapter,
      verses: reference.verses,
      verseNumbers: reference.verseNumbers,
      textPrimary: primaryLang === "fa" ? reference.textFa : reference.textEn,
      textSecondary: primaryLang === "fa" ? reference.textEn : reference.textFa,
      translation: selectedVersionFa,
      enTranslation: selectedVersionEn,
      displayMode: "list" as const,
      fontFa,
      fontEn,
      primaryLanguage: primaryLang,
      glassPopupEnabled: false,
      referenceItems: [reference],
      popupLabelFa: `${reference.bookName.fa} ${reference.chapter}:${reference.verses}`,
      popupLabelEn: `${reference.bookName.en} ${reference.chapter}:${reference.verses}`,
    }));
  };

  const handleAddSlides = () => {
    if (!selectedVerses.length) return;
    onAddSlides(buildSlides());
    setSelectedVerses([]);
  };

  const selectedReferences = Array.from(new Set(selectedVerses.map((entry) => `${entry.book_name_fa}-${entry.chapter}`)));
  const chapterGrid = currentBook ? Array.from({ length: currentBook.chapter_count }, (_, index) => index + 1) : [];

  useEffect(() => {
    if (!audioRef.current || !audioTracks.length) return;
    audioRef.current.currentTime = audioProgress;
  }, [audioProgress, audioTracks.length]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0e0e0f] text-white" dir="ltr">
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (!audioRef.current) return;
          setAudioProgress(audioRef.current.currentTime);
          setAudioDuration(audioRef.current.duration || 0);
        }}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="shrink-0 bg-[#0e0e0f]/95 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3 flex-wrap">
        <BookOpen className="w-5 h-5 text-blue-400 shrink-0" />
        <span className="font-bold text-white text-base shrink-0">{isRTL ? "انتخاب آیه کتاب مقدس" : "Select Bible Verse"}</span>

        <div className="relative">
          <button onClick={() => { setShowBookList((value) => !value); setShowChapterGrid(false); }} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-bold transition-all text-left" aria-label="Select Bible book">
            <BookOpen className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="flex-1 truncate text-white">{currentBook ? (isRTL ? <span className="font-[Vazirmatn]">{currentBook.book_name_fa}</span> : currentBook.book_name_en) : (isRTL ? "انتخاب کتاب..." : "Select a book...")}</span>
            <List className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          </button>
          {showBookList && (
            <div className="absolute top-full mt-1 left-0 right-0 z-50 max-h-[55vh] overflow-y-auto bg-[#18181b] border border-white/20 rounded-2xl shadow-2xl p-2 ring-1 ring-white/10 min-w-[18rem]">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input value={bookSearch} onChange={(event) => setBookSearch(event.target.value)} placeholder={isRTL ? "جستجوی کتاب..." : "Search books..."} className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500/50 text-white" />
              </div>
              {filteredBooks.length ? filteredBooks.map((book) => (
                <button key={book.book_id} onClick={() => selectBook(book)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-all hover:bg-white/10 ${selectedBookId === book.book_id ? "bg-blue-500/20 text-blue-400 font-bold" : "text-zinc-300"}`}>
                  <span className="font-[Vazirmatn] text-[13px]" dir="rtl">{book.book_name_fa}</span>
                  <span className="text-zinc-500 text-xs" dir="ltr">{book.book_name_en}</span>
                </button>
              )) : <div className="px-3 py-4 text-center text-slate-500 text-sm">{isRTL ? "کتابی پیدا نشد" : "No books found"}</div>}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden" dir="ltr">
          <button onClick={prevChapter} disabled={selectedChapter <= 1} className="p-2.5 hover:bg-white/10 transition-colors disabled:opacity-20" aria-label="Previous chapter"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setShowChapterGrid((value) => !value)} className="bg-white/5 hover:bg-white/10 text-sm font-bold px-4 py-2 transition-all border-x border-white/5 flex items-center gap-2"><span className="text-blue-400">Ch.</span><span>{selectedChapter}</span></button>
          <button onClick={nextChapter} disabled={!currentBook || selectedChapter >= currentBook.chapter_count} className="p-2.5 hover:bg-white/10 transition-colors disabled:opacity-20" aria-label="Next chapter"><ChevronRight className="w-4 h-4" /></button>
        </div>

        <select value={selectedVersionEn} onChange={(event) => { setSelectedVersionEn(event.target.value); persist("bp_ver_en", event.target.value); }} aria-label="English Bible version" className="max-w-[100px] md:max-w-[120px] bg-white/5 border border-white/10 rounded-xl px-2 md:px-3 py-2.5 text-sm font-bold outline-none focus:border-blue-500/50 cursor-pointer [&>option]:bg-zinc-900 [&>option]:text-white">
          {englishVersions.map((version) => <option key={version.abbr} value={version.abbr} title={version.name} className="bg-zinc-900 text-white">{version.hasAudio ? "🔊 " : ""}{version.abbr}</option>)}
        </select>

        <select value={selectedVersionFa} onChange={(event) => { setSelectedVersionFa(event.target.value); persist("bp_ver_fa", event.target.value); }} aria-label="Farsi Bible version" className={`font-[Vazirmatn] max-w-[140px] md:max-w-[200px] truncate bg-white/5 border rounded-xl px-2 md:px-3 py-2.5 text-sm font-bold outline-none cursor-pointer [&>option]:bg-zinc-900 [&>option]:text-white ${persianVersions.length === 0 ? "border-red-500/30 text-red-100" : "border-purple-500/30 focus:border-purple-500"}`} dir="rtl">
          {persianVersions.length === 0 ? <option value="" className="bg-zinc-900 text-white">— ترجمه‌ای یافت نشد —</option> : persianVersions.map((version) => <option key={version.abbr} value={version.abbr} className="bg-zinc-900 text-white">{version.name} {version.hasAudio ? "🔊" : ""}</option>)}
        </select>

        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 shrink-0" dir="ltr">
          <button onClick={() => { setReadingMode("en"); persist("bp_reading_mode", "en"); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${readingMode === "en" ? "bg-blue-500 text-white shadow" : "text-slate-400 hover:text-white"}`}>EN</button>
          <button onClick={() => { setReadingMode("fa"); persist("bp_reading_mode", "fa"); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${readingMode === "fa" ? "bg-purple-500 text-white shadow" : "text-slate-400 hover:text-white"}`}>FA</button>
          <button onClick={() => { setReadingMode("parallel"); persist("bp_reading_mode", "parallel"); }} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${readingMode === "parallel" ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow" : "text-slate-400 hover:text-white"}`}><Columns2 className="w-3 h-3" /> EN|FA</button>
          <div className="w-px h-5 bg-white/20 mx-1 shrink-0" />
          <button onClick={() => { const next = Math.max(13, fontSize - 2); setFontSize(next); persist("bp_font_size", String(next)); }} className="px-2 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all hover:bg-white/10 shrink-0">A-</button>
          <button onClick={() => { const next = Math.min(36, fontSize + 2); setFontSize(next); persist("bp_font_size", String(next)); }} className="px-2 py-1.5 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-all hover:bg-white/10 shrink-0">A+</button>
        </div>

        <button onClick={onClose} className="ml-auto p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all" aria-label="Close scripture selector"><X className="w-5 h-5" /></button>
      </div>

      {showChapterGrid && currentBook && (
        <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 pt-24">
          <div className="w-full max-w-3xl bg-[#18181b] border border-white/10 rounded-3xl shadow-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">{currentBook.book_name_en}</p>
                <h3 className="text-xl font-black font-[Vazirmatn]">{currentBook.book_name_fa}</h3>
              </div>
              <button onClick={() => setShowChapterGrid(false)} className="p-2 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
              {chapterGrid.map((chapterNumber) => (
                <button key={chapterNumber} onClick={() => { setSelectedChapter(chapterNumber); setShowChapterGrid(false); }} className={`aspect-square rounded-xl text-sm font-medium transition-all border ${chapterNumber === selectedChapter ? "bg-indigo-600 text-white scale-105 shadow-lg shadow-indigo-500/30 border-indigo-500/60" : "bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700"}`}>{chapterNumber}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto bg-[#0e0e0f] pb-32 px-4 relative">
        {currentBook && (
          <div className="text-center pt-8 pb-6 border-b border-white/5" dir="ltr">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-1">{currentBook.book_name_en}</p>
            <h1 className="text-2xl font-black tracking-tight">Chapter {selectedChapter}</h1>
            <p className="font-[Vazirmatn] mt-1.5 text-base text-slate-400" dir="rtl">{currentBook.book_name_fa} — باب {selectedChapter}</p>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 pt-4 pb-1"><p className="text-xs text-slate-600 text-center">{isRTL ? "برای انتخاب هر آیه روی آن کلیک کنید" : "Click on any verse to select it"}</p></div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
        ) : (
          <div className="max-w-5xl mx-auto px-4 pb-16 pt-4">
            {readingMode === "parallel" && (
              <div className="space-y-3">
                {parallelVerses.map((verse) => {
                  const selected = selectedVerses.some((entry) => entry.verse_num === verse.verse_num && entry.chapter === selectedChapter && entry.book_id === currentBook?.book_id);
                  return (
                    <div key={verse.verse_num} onClick={() => toggleVerse(verse.verse_num)} className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 p-3 rounded-2xl transition-all duration-200 cursor-pointer ${selected ? "bg-amber-500/10 border border-amber-500/30" : "hover:bg-white/5 border border-transparent"}`}>
                      <div className="flex gap-3" dir="ltr"><span className="text-xs font-black text-blue-500/60 mt-1 shrink-0 select-none">{verse.verse_num}</span><p className="text-zinc-100 leading-relaxed" style={{ fontSize: `${fontSize}px`, fontFamily: fontEn }}>{verse.en || <span className="text-zinc-600 italic text-sm">—</span>}</p></div>
                      <div className="flex gap-3 text-right" dir="rtl"><span className="text-xs font-black text-purple-500/60 mt-1 shrink-0 select-none">{verse.verse_num}</span><p className="text-zinc-100 leading-relaxed" style={{ fontSize: `${fontSize + 2}px`, fontFamily: fontFa }}>{verse.fa || <span className="text-zinc-600 italic text-sm">—</span>}</p></div>
                    </div>
                  );
                })}
              </div>
            )}

            {readingMode === "en" && (
              <div className="space-y-1 prose prose-invert max-w-none" dir="ltr" style={{ fontSize: `${fontSize}px`, lineHeight: 1.9, fontFamily: fontEn }}>
                {verses.map((verse) => {
                  const selected = selectedVerses.some((entry) => entry.verse_num === verse.verse_num && entry.chapter === selectedChapter && entry.book_id === currentBook?.book_id);
                  return (
                    <span key={verse.verse_num}>
                      {headingMap.has(verse.verse_num) && <h3 className="text-base font-black text-blue-300 mt-8 mb-2 not-prose tracking-wide" dir="ltr">{headingMap.get(verse.verse_num)}</h3>}
                      <span dir="ltr" className={`inline cursor-pointer rounded px-1 transition-all duration-200 ${selected ? "bg-amber-500/30 text-amber-200 border-b-2 border-amber-500" : "hover:bg-white/5 active:scale-95"}`} onClick={() => toggleVerse(verse.verse_num)}>
                        <sup className="text-[0.6em] font-black text-blue-400/70 mr-1 select-none">{verse.verse_num}</sup>
                        {verse.text} 
                      </span>
                    </span>
                  );
                })}
              </div>
            )}

            {readingMode === "fa" && (
              <div className="text-right space-y-0.5" dir="rtl" style={{ fontSize: `${fontSize}px`, lineHeight: 2.3, fontFamily: fontFa }}>
                {faVerses.length === 0 ? <p className="text-center text-slate-600 italic py-8">— ترجمه‌ای یافت نشد —</p> : faVerses.map((verse) => {
                  const selected = selectedVerses.some((entry) => entry.verse_num === verse.verse_num && entry.chapter === selectedChapter && entry.book_id === currentBook?.book_id);
                  return (
                    <span key={verse.verse_num} dir="rtl" className={`inline cursor-pointer rounded px-1 transition-all duration-200 ${selected ? "bg-amber-500/30 text-amber-100 border-b-2 border-amber-500" : "hover:bg-white/5 active:scale-95"}`} onClick={() => toggleVerse(verse.verse_num)}>
                      <sup className="text-[0.6em] font-black text-purple-400/70 ml-1 select-none">{verse.verse_num}</sup>
                      {verse.text} 
                    </span>
                  );
                })}
              </div>
            )}

            {!parallelVerses.length && !verses.length && !faVerses.length && !loading && <p className="text-center text-slate-600 py-16">{isRTL ? "آیه‌ای یافت نشد" : "No verses found"}</p>}
          </div>
        )}
      </main>

      {audioTracks.length > 0 && (
        <div className="fixed bottom-20 md:bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-2xl border-y md:border-b-0 md:border-t border-white/10 px-4 py-3 shadow-2xl" dir="ltr">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0"><Music2 className="w-5 h-5 text-white" /></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-bold truncate">{currentBook?.book_name_en} — Ch. {selectedChapter}</p><p className="text-xs text-slate-400 truncate">{audioTracks[selectedTrackIdx]?.title}</p></div>
              <button aria-label={isPlaying ? "Pause" : "Play"} onClick={() => {
                if (!audioRef.current || !audioTracks.length) return;
                if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); } else { audioRef.current.src = audioTracks[selectedTrackIdx]?.mp3_url; audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false)); }
              }} className="w-11 h-11 shrink-0 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center shadow-xl shadow-blue-500/30 transition-all hover:scale-105">
                {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 flex-1 w-full">
              <span className="w-9 text-right tabular-nums">{formatTime(audioProgress)}</span>
              <div className="relative flex-1 h-3 flex items-center group touch-none mx-2">
                <input min={0} max={audioDuration || 100} aria-label="Audio playback progress" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" dir="ltr" type="range" value={audioProgress} onChange={(event) => { if (!audioRef.current) return; audioRef.current.currentTime = Number(event.target.value); setAudioProgress(Number(event.target.value)); }} />
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full pointer-events-none" style={{ width: `${(audioProgress / (audioDuration || 1)) * 100}%` }} /></div>
              </div>
              <span className="w-9 tabular-nums">{formatTime(audioDuration)}</span>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed bottom-52 md:bottom-24 left-0 right-0 z-40 flex items-center justify-center gap-2 md:gap-3 pointer-events-none transition-all duration-500 ${selectedVerses.length > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`} dir="ltr">
        <div className="pointer-events-auto bg-amber-500 text-black px-4 md:px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-4 font-bold flex-wrap max-w-[95vw]">
          <span className="text-sm font-black border-r border-black/20 pr-4 shrink-0">{selectedVerses.length} {isRTL ? "آیه انتخاب شده" : "verses selected"}</span>
          <div className="flex-1 flex flex-wrap gap-1.5 min-w-0 overflow-hidden">
            {selectedReferences.slice(0, 4).map((reference) => <span key={reference} className="text-xs bg-black/15 text-black/80 px-2 py-0.5 rounded-full font-[Vazirmatn] shrink-0">{reference}</span>)}
            {selectedReferences.length > 4 && <span className="text-xs bg-black/15 text-black/80 px-2 py-0.5 rounded-full shrink-0">…</span>}
          </div>
          <button onClick={() => setSelectedVerses([])} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity shrink-0 text-sm"><Trash2 className="w-4 h-4" />{isRTL ? "پاک کردن" : "Clear"}</button>
          <button onClick={handleAddSlides} className="flex items-center gap-2 bg-black text-white px-5 py-2 rounded-xl hover:bg-black/80 transition-all font-bold shadow-xl shrink-0">{isRTL ? "افزودن به اسلاید" : "Add to Slide"}</button>
        </div>
      </div>

      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 opacity-0 translate-y-20 pointer-events-none ${selectedVerses.length > 0 ? "opacity-0" : ""}`} />
    </div>
  );
}
