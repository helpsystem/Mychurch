"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Columns2, List, Loader2, Music2, Pause, Play, Search, Trash2, X } from "lucide-react";
import { ScripturePage, ScriptureReferenceItem } from "@/types/broadcast";
import SelectedVersesModal from "./SelectedVersesModal";

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
type SlideBuildMode = "single" | "perReference" | "perVerse";

const VERSION_SELECT_STYLE = {
  en: "max-w-[92px] md:max-w-[120px]",
  fa: "max-w-[132px] md:max-w-[200px]",
  base: "bg-white/5 border rounded-xl px-2 md:px-3 py-2 text-xs md:text-sm font-bold outline-none cursor-pointer shrink-0 [&>option]:bg-zinc-900 [&>option]:text-white",
  normal: "border-purple-500/30 focus:border-purple-500 text-white",
  empty: "border-red-500/30 text-red-100",
} as const;

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
  const bookDropdownRef = useRef<HTMLDivElement | null>(null);

  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [selectedVersionEn, setSelectedVersionEn] = useState(() => load("bp_ver_en", "BSB"));
  const [selectedVersionFa, setSelectedVersionFa] = useState(() => load("bp_ver_fa", "NMV"));
  const [selectedBookId, setSelectedBookId] = useState("GEN");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [bookSearch, setBookSearch] = useState("");
  const [verseSearch, setVerseSearch] = useState("");
  const [showBookList, setShowBookList] = useState(false);
  const [showChapterGrid, setShowChapterGrid] = useState(false);
  const [readingMode, setReadingMode] = useState<ReadingMode>(() => load("bp_reading_mode", "parallel") as ReadingMode);
  const [fontSize, setFontSize] = useState(() => parseInt(load("bp_font_size", "18"), 10));
  const [fontFa, setFontFa] = useState(() => load("bp_font_fa", "var(--font-vazirmatn)"));
  const [fontEn, setFontEn] = useState(() => load("bp_font_en", "var(--font-inter)"));
  const [primaryLang, setPrimaryLang] = useState<PrimaryLang>(() => load("bp_primary_lang", "fa") as PrimaryLang);
  const [slideBuildMode, setSlideBuildMode] = useState<SlideBuildMode>(() => load("bp_slide_mode", "perReference") as SlideBuildMode);

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
  const [lastInteractedVerse, setLastInteractedVerse] = useState<number | null>(null);
  const [verseManagerOpen, setVerseManagerOpen] = useState(false);

  const currentBook = books.find((book) => book.book_id === selectedBookId) || null;
  const filteredBooks = bookSearch
    ? books.filter((book) => book.book_name_en.toLowerCase().includes(bookSearch.toLowerCase()) || book.book_name_fa.includes(bookSearch))
    : books;
  const englishVersions = versions.filter((version) => version.language !== "fa");
  const persianVersions = versions.filter((version) => version.language === "fa");
  const headingMap = new Map(headings.map((heading) => [heading.before_verse, heading.text]));

  // Filter verses based on search query
  const filterVersesBySearch = (verseList: VerseRow[]): VerseRow[] => {
    if (!verseSearch.trim()) return verseList;
    const query = verseSearch.toLowerCase();
    return verseList.filter((verse) => verse.text.toLowerCase().includes(query));
  };

  const filteredVerses = filterVersesBySearch(verses);
  const filteredFaVerses = filterVersesBySearch(faVerses);
  const filteredParallelVerses = parallelVerses.filter((verse) => {
    if (!verseSearch.trim()) return true;
    const query = verseSearch.toLowerCase();
    return (verse.en?.toLowerCase().includes(query) || verse.fa?.toLowerCase().includes(query));
  });

  const visibleVerseNumbers = useMemo(() => {
    if (readingMode === "parallel") return filteredParallelVerses.map((verse) => verse.verse_num);
    if (readingMode === "fa") return filteredFaVerses.map((verse) => verse.verse_num);
    return filteredVerses.map((verse) => verse.verse_num);
  }, [filteredFaVerses, filteredParallelVerses, filteredVerses, readingMode]);

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
      setAudioTracks(lang === "fa" ? (parallelData.audioFa || []) : (parallelData.audioEn || []));
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
    // Optionally clear verse search when chapter changes
    // setVerseSearch("");
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

  const isCurrentVerseSelected = (verseNum: number) => selectedVerses.some((entry) => entry.book_id === currentBook?.book_id && entry.chapter === selectedChapter && entry.verse_num === verseNum);

  const applyRangeSelection = (toVerseNum: number) => {
    if (!currentBook || lastInteractedVerse === null) {
      toggleVerse(toVerseNum);
      setLastInteractedVerse(toVerseNum);
      return;
    }

    const start = Math.min(lastInteractedVerse, toVerseNum);
    const end = Math.max(lastInteractedVerse, toVerseNum);
    const range = Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
    const shouldSelect = !isCurrentVerseSelected(toVerseNum);

    setSelectedVerses((previous) => {
      if (!currentBook) return previous;
      if (!shouldSelect) {
        const idsToRemove = new Set(range.map((verseNum) => `${currentBook.book_id}-${selectedChapter}-${verseNum}`));
        return previous.filter((entry) => !idsToRemove.has(entry.id));
      }

      const byId = new Map(previous.map((entry) => [entry.id, entry]));
      range.forEach((verseNum) => {
        const id = `${currentBook.book_id}-${selectedChapter}-${verseNum}`;
        const texts = getVerseTexts(verseNum);
        byId.set(id, {
          id,
          book_id: currentBook.book_id,
          book_name_en: currentBook.book_name_en,
          book_name_fa: currentBook.book_name_fa,
          book_order: currentBook.book_order,
          chapter: selectedChapter,
          verse_num: verseNum,
          en: texts.en,
          fa: texts.fa,
        });
      });

      return Array.from(byId.values()).sort((a, b) => a.book_order - b.book_order || a.chapter - b.chapter || a.verse_num - b.verse_num);
    });

    setLastInteractedVerse(toVerseNum);
  };

  const handleVerseClick = (verseNum: number, shiftKey: boolean) => {
    if (shiftKey && lastInteractedVerse !== null) {
      applyRangeSelection(verseNum);
      return;
    }
    toggleVerse(verseNum);
    setLastInteractedVerse(verseNum);
  };

  const addVisibleVerses = () => {
    if (!currentBook || visibleVerseNumbers.length === 0) return;
    setSelectedVerses((previous) => {
      const byId = new Map(previous.map((entry) => [entry.id, entry]));
      visibleVerseNumbers.forEach((verseNum) => {
        const id = `${currentBook.book_id}-${selectedChapter}-${verseNum}`;
        if (byId.has(id)) return;
        const texts = getVerseTexts(verseNum);
        byId.set(id, {
          id,
          book_id: currentBook.book_id,
          book_name_en: currentBook.book_name_en,
          book_name_fa: currentBook.book_name_fa,
          book_order: currentBook.book_order,
          chapter: selectedChapter,
          verse_num: verseNum,
          en: texts.en,
          fa: texts.fa,
        });
      });
      return Array.from(byId.values()).sort((a, b) => a.book_order - b.book_order || a.chapter - b.chapter || a.verse_num - b.verse_num);
    });
  };

  const clearCurrentChapterSelection = () => {
    if (!currentBook) return;
    setSelectedVerses((previous) => previous.filter((entry) => !(entry.book_id === currentBook.book_id && entry.chapter === selectedChapter)));
  };

  const buildSlides = (): ScripturePage[] => {
    const sorted = [...selectedVerses].sort((a, b) => a.book_order - b.book_order || a.chapter - b.chapter || a.verse_num - b.verse_num);
    const groups = new Map<string, SelectedVerseEntry[]>();
    sorted.forEach((entry) => {
      const key = `${entry.book_id}-${entry.chapter}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(entry);
    });

    const referenceItems: ScriptureReferenceItem[] = Array.from(groups.values()).flatMap((group) => {
      const sortedGroup = [...group].sort((a, b) => a.verse_num - b.verse_num);
      const chunks: SelectedVerseEntry[][] = [];

      sortedGroup.forEach((entry) => {
        const lastChunk = chunks[chunks.length - 1];
        if (!lastChunk) {
          chunks.push([entry]);
          return;
        }

        const lastEntry = lastChunk[lastChunk.length - 1];
        if (entry.verse_num === lastEntry.verse_num + 1) {
          lastChunk.push(entry);
        } else {
          chunks.push([entry]);
        }
      });

      return chunks.map((chunk) => {
        const first = chunk[0];
        const numbers = chunk.map((entry) => entry.verse_num);
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
          textFa: chunk.map((entry) => entry.fa),
          textEn: chunk.map((entry) => entry.en),
          fontFa,
          fontEn,
          translation: selectedVersionFa,
          enTranslation: selectedVersionEn,
        };
      });
    });

    if (slideBuildMode === "single") {
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

    if (slideBuildMode === "perVerse") {
      let slideNumber = 1;
      return referenceItems.flatMap((reference) => reference.verseNumbers.map((verseNum, idx) => ({
        id: crypto.randomUUID(),
        book: reference.book,
        bookName: reference.bookName,
        chapter: reference.chapter,
        verses: `${verseNum}`,
        verseNumbers: [verseNum],
        textPrimary: [primaryLang === "fa" ? reference.textFa[idx] : reference.textEn[idx]],
        textSecondary: [primaryLang === "fa" ? reference.textEn[idx] : reference.textFa[idx]],
        translation: selectedVersionFa,
        enTranslation: selectedVersionEn,
        displayMode: "list" as const,
        fontFa,
        fontEn,
        primaryLanguage: primaryLang,
        glassPopupEnabled: false,
        referenceItems: [{ ...reference, verses: `${verseNum}`, verseNumbers: [verseNum], textFa: [reference.textFa[idx]], textEn: [reference.textEn[idx]] }],
        popupLabelFa: `اسلاید ${slideNumber++}: ${reference.bookName.fa} ${reference.chapter}:${verseNum}`,
        popupLabelEn: `Slide ${slideNumber - 1}: ${reference.bookName.en} ${reference.chapter}:${verseNum}`,
      })));
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

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!showBookList) return;
      const target = event.target as Node;
      if (bookDropdownRef.current && !bookDropdownRef.current.contains(target)) {
        setShowBookList(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showBookList]);

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

      <div className="shrink-0 bg-[#0e0e0f]/95 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex flex-wrap items-center gap-2 md:gap-3 relative z-10">
        <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-blue-400 shrink-0" />
        <span className={`font-bold text-white text-sm md:text-base shrink-0 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{isRTL ? "انتخاب آیه کتاب مقدس" : "Select Bible Verse"}</span>

        <div ref={bookDropdownRef} className="relative z-[110]">
          <button type="button" onClick={(event) => { event.stopPropagation(); setShowBookList((value) => !value); setShowChapterGrid(false); }} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs md:text-sm font-bold transition-all text-left min-w-[11rem] md:min-w-[14rem] max-w-[16rem] md:max-w-none" aria-label="Select Bible book">
            <BookOpen className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="flex-1 truncate text-white">{currentBook ? (isRTL ? <span className="font-[Vazirmatn]">{currentBook.book_name_fa}</span> : currentBook.book_name_en) : (isRTL ? "انتخاب کتاب..." : "Select a book...")}</span>
            <List className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          </button>
          {showBookList && (
            <div className="absolute top-full mt-1 left-0 right-0 z-[120] max-h-[55vh] overflow-y-auto bg-[#18181b] border border-white/20 rounded-2xl shadow-2xl p-2 ring-1 ring-white/10 min-w-[18rem]">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input value={bookSearch} onChange={(event) => setBookSearch(event.target.value)} placeholder={isRTL ? "جستجوی کتاب..." : "Search books..."} className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500/50 text-white" />
              </div>
              {filteredBooks.length ? filteredBooks.map((book) => (
                <button type="button" key={book.book_id} onClick={() => selectBook(book)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-all hover:bg-white/10 ${selectedBookId === book.book_id ? "bg-blue-500/20 text-blue-400 font-bold" : "text-zinc-300"}`}>
                  <span className="font-[Vazirmatn] text-[13px]" dir="rtl">{book.book_name_fa}</span>
                  <span className="text-zinc-500 text-xs" dir="ltr">{book.book_name_en}</span>
                </button>
              )) : <div className="px-3 py-4 text-center text-slate-500 text-sm">{isRTL ? "کتابی پیدا نشد" : "No books found"}</div>}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden shrink-0" dir="ltr">
          <button onClick={prevChapter} disabled={selectedChapter <= 1} className="p-2 hover:bg-white/10 transition-colors disabled:opacity-20" aria-label="Previous chapter"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setShowChapterGrid((value) => !value)} className="bg-white/5 hover:bg-white/10 text-xs md:text-sm font-bold px-3 md:px-4 py-2 transition-all border-x border-white/5 flex items-center gap-2"><span className="text-blue-400">Ch.</span><span>{selectedChapter}</span></button>
          <button onClick={nextChapter} disabled={!currentBook || selectedChapter >= currentBook.chapter_count} className="p-2 hover:bg-white/10 transition-colors disabled:opacity-20" aria-label="Next chapter"><ChevronRight className="w-4 h-4" /></button>
        </div>

        <select value={selectedVersionEn} onChange={(event) => { setSelectedVersionEn(event.target.value); persist("bp_ver_en", event.target.value); }} aria-label="English Bible version" className={`${VERSION_SELECT_STYLE.en} ${VERSION_SELECT_STYLE.base} border-white/10 focus:border-blue-500/50`}>
          {englishVersions.map((version) => <option key={version.abbr} value={version.abbr} title={version.name} className="bg-zinc-900 text-white">{version.hasAudio ? "🔊 " : ""}{version.abbr}</option>)}
        </select>

        <select value={selectedVersionFa} onChange={(event) => { setSelectedVersionFa(event.target.value); persist("bp_ver_fa", event.target.value); }} aria-label="Farsi Bible version" className={`font-[Vazirmatn] ${VERSION_SELECT_STYLE.fa} ${VERSION_SELECT_STYLE.base} truncate ${persianVersions.length === 0 ? VERSION_SELECT_STYLE.empty : VERSION_SELECT_STYLE.normal}`} dir="rtl">
          {persianVersions.length === 0 ? <option value="" className="bg-zinc-900 text-white">— ترجمه‌ای یافت نشد —</option> : persianVersions.map((version) => <option key={version.abbr} value={version.abbr} className="bg-zinc-900 text-white">{version.name} {version.hasAudio ? "🔊" : ""}</option>)}
        </select>

        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 shrink-0" dir="ltr">
          <button onClick={() => { setReadingMode("en"); persist("bp_reading_mode", "en"); }} className={`px-2.5 md:px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all ${readingMode === "en" ? "bg-blue-500 text-white shadow" : "text-slate-400 hover:text-white"}`}>EN</button>
          <button onClick={() => { setReadingMode("fa"); persist("bp_reading_mode", "fa"); }} className={`px-2.5 md:px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all ${readingMode === "fa" ? "bg-purple-500 text-white shadow" : "text-slate-400 hover:text-white"}`}>FA</button>
          <button onClick={() => { setReadingMode("parallel"); persist("bp_reading_mode", "parallel"); }} className={`flex items-center gap-1 px-2.5 md:px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all ${readingMode === "parallel" ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow" : "text-slate-400 hover:text-white"}`}><Columns2 className="w-3 h-3" /> EN|FA</button>
          <div className="w-px h-5 bg-white/20 mx-1 shrink-0" />
          <button onClick={() => { const next = Math.max(13, fontSize - 2); setFontSize(next); persist("bp_font_size", String(next)); }} className="px-2 py-1.5 rounded-lg text-[11px] md:text-xs font-bold text-slate-400 hover:text-white transition-all hover:bg-white/10 shrink-0">A-</button>
          <button onClick={() => { const next = Math.min(36, fontSize + 2); setFontSize(next); persist("bp_font_size", String(next)); }} className="px-2 py-1.5 rounded-lg text-[11px] md:text-sm font-bold text-slate-400 hover:text-white transition-all hover:bg-white/10 shrink-0">A+</button>
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

      <div className="flex-1 flex overflow-hidden relative z-10">
        <main className="flex-1 overflow-y-auto bg-[#0e0e0f] px-4 pb-32">
        {currentBook && (
          <div className="text-center pt-8 pb-6 border-b border-white/5" dir="ltr">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-1">{currentBook.book_name_en}</p>
            <h1 className="text-2xl font-black tracking-tight">Chapter {selectedChapter}</h1>
            <p className="font-[Vazirmatn] mt-1.5 text-base text-slate-400" dir="rtl">{currentBook.book_name_fa} — باب {selectedChapter}</p>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 pt-4 pb-1"><p className="text-xs text-slate-600 text-center">{isRTL ? "برای انتخاب هر آیه روی آن کلیک کنید" : "Click on any verse to select it"}</p></div>

        <div className="max-w-5xl mx-auto px-4 pb-2 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={addVisibleVerses}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 transition"
          >
            {isRTL ? "افزودن همه نتایج" : "Select All Results"}
          </button>
          <button
            onClick={clearCurrentChapterSelection}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600/15 border border-rose-500/35 text-rose-300 hover:bg-rose-600/25 transition"
          >
            {isRTL ? "پاک کردن انتخاب‌های این باب" : "Clear Chapter Selection"}
          </button>
          <p className="text-[11px] text-slate-500 font-[Vazirmatn]">
            {isRTL ? "برای انتخاب بازه، Shift + کلیک استفاده کنید" : "Use Shift+Click to select a range"}
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={verseSearch}
              onChange={(event) => setVerseSearch(event.target.value)}
              placeholder={isRTL ? "جستجو در آیات..." : "Search in verses..."}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:border-blue-500/50 focus:bg-white/10 text-white placeholder-slate-600 transition-all"
            />
            {verseSearch && (
              <button
                onClick={() => setVerseSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
        ) : (
          <div className="max-w-5xl mx-auto px-4 pb-16 pt-4">
            {readingMode === "parallel" && (
              <div className="space-y-3">
                {filteredParallelVerses.length > 0 ? (
                  filteredParallelVerses.map((verse) => {
                    const selected = selectedVerses.some((entry) => entry.verse_num === verse.verse_num && entry.chapter === selectedChapter && entry.book_id === currentBook?.book_id);
                    return (
                      <div key={verse.verse_num} onClick={(event) => handleVerseClick(verse.verse_num, event.shiftKey)} className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 p-3 rounded-2xl transition-all duration-200 cursor-pointer ${selected ? "bg-amber-500/10 border border-amber-500/30" : "hover:bg-white/5 border border-transparent"}`}>
                        <div className="flex gap-3" dir="ltr"><span className="text-xs font-black text-blue-500/60 mt-1 shrink-0 select-none">{verse.verse_num}</span><p className="text-zinc-100 leading-relaxed" style={{ fontSize: `${fontSize}px`, fontFamily: fontEn }}>{verse.en || <span className="text-zinc-600 italic text-sm">—</span>}</p></div>
                        <div className="flex gap-3 text-right" dir="rtl"><span className="text-xs font-black text-purple-500/60 mt-1 shrink-0 select-none">{verse.verse_num}</span><p className="text-zinc-100 leading-relaxed" style={{ fontSize: `${fontSize + 2}px`, fontFamily: fontFa }}>{verse.fa || <span className="text-zinc-600 italic text-sm">—</span>}</p></div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-slate-600 py-16">{isRTL ? "آیه‌ای مطابقت یافت نشد" : "No verses found"}</p>
                )}
              </div>
            )}

            {readingMode === "en" && (
              <div className="space-y-1 prose prose-invert max-w-none" dir="ltr" style={{ fontSize: `${fontSize}px`, lineHeight: 1.9, fontFamily: fontEn }}>
                {filteredVerses.length > 0 ? (
                  filteredVerses.map((verse) => {
                    const selected = selectedVerses.some((entry) => entry.verse_num === verse.verse_num && entry.chapter === selectedChapter && entry.book_id === currentBook?.book_id);
                    return (
                      <span key={verse.verse_num}>
                        {headingMap.has(verse.verse_num) && <h3 className="text-base font-black text-blue-300 mt-8 mb-2 not-prose tracking-wide" dir="ltr">{headingMap.get(verse.verse_num)}</h3>}
                        <span dir="ltr" className={`inline cursor-pointer rounded px-1 transition-all duration-200 ${selected ? "bg-amber-500/30 text-amber-200 border-b-2 border-amber-500" : "hover:bg-white/5 active:scale-95"}`} onClick={(event) => handleVerseClick(verse.verse_num, event.shiftKey)}>
                          <sup className="text-[0.6em] font-black text-blue-400/70 mr-1 select-none">{verse.verse_num}</sup>
                          {verse.text} 
                        </span>
                      </span>
                    );
                  })
                ) : (
                  <p className="text-center text-slate-600 py-16 not-prose">{isRTL ? "آیه‌ای مطابقت یافت نشد" : "No verses found"}</p>
                )}
              </div>
            )}

            {readingMode === "fa" && (
              <div className="text-right space-y-0.5" dir="rtl" style={{ fontSize: `${fontSize}px`, lineHeight: 2.3, fontFamily: fontFa }}>
                {filteredFaVerses.length === 0 ? (
                  <p className="text-center text-slate-600 italic py-8">{faVerses.length === 0 ? "— ترجمه‌ای یافت نشد —" : "— آیه‌ای مطابقت یافت نشد —"}</p>
                ) : (
                  filteredFaVerses.map((verse) => {
                    const selected = selectedVerses.some((entry) => entry.verse_num === verse.verse_num && entry.chapter === selectedChapter && entry.book_id === currentBook?.book_id);
                    return (
                      <span key={verse.verse_num} dir="rtl" className={`inline cursor-pointer rounded px-1 transition-all duration-200 ${selected ? "bg-amber-500/30 text-amber-100 border-b-2 border-amber-500" : "hover:bg-white/5 active:scale-95"}`} onClick={(event) => handleVerseClick(verse.verse_num, event.shiftKey)}>
                        <sup className="text-[0.6em] font-black text-purple-400/70 ml-1 select-none">{verse.verse_num}</sup>
                        {verse.text} 
                      </span>
                    );
                  })
                )}
              </div>
            )}

            {!parallelVerses.length && !verses.length && !faVerses.length && !loading && <p className="text-center text-slate-600 py-16">{isRTL ? "آیه‌ای یافت نشد" : "No verses found"}</p>}
          </div>
        )}
        </main>

        {selectedVerses.length > 0 && (
          <div className={`w-80 bg-slate-900/95 border-l border-white/10 overflow-hidden flex flex-col ${isRTL ? 'border-l border-r-0' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="shrink-0 bg-gradient-to-r from-amber-600/20 to-amber-500/10 border-b border-amber-500/20 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setVerseManagerOpen(true)}
                  className={`font-bold text-amber-300 text-sm cursor-pointer hover:text-amber-200 transition-colors ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                  title={isRTL ? 'کلیک برای مدیریت آیات' : 'Click to manage verses'}
                >
                  {selectedVerses.length} {isRTL ? 'آیه انتخاب‌شده' : 'Verses Selected'}
                </button>
                <button
                  onClick={() => setSelectedVerses([])}
                  className="p-1 text-slate-400 hover:text-red-400 transition-colors rounded"
                  title={isRTL ? 'پاک کردن همه' : 'Clear all'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-400">
                {isRTL
                  ? `${selectedReferences.length} بخش‌شناسی از کتاب‌ها`
                  : `${selectedReferences.length} section(s)`}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-white/5 p-3 space-y-0">
                {selectedVerses.map((verse, idx) => (
                  <div
                    key={verse.id}
                    className="py-3 first:pt-0 last:pb-0 text-sm leading-relaxed"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-2 items-center mb-1">
                          <span className="text-[11px] font-bold text-amber-400 shrink-0">
                            {verse.book_name_fa}
                          </span>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {isRTL ? `${verse.chapter}:${verse.verse_num}` : `${verse.chapter}:${verse.verse_num}`}
                          </span>
                        </div>
                        <p
                          className="text-xs text-slate-300 leading-snug truncate"
                          title={verse.en}
                        >
                          EN: {verse.en ? verse.en.substring(0, 60) : '—'}...
                        </p>
                        <p
                          className="text-xs text-slate-400 leading-snug truncate font-[Vazirmatn]"
                          title={verse.fa}
                        >
                          FA: {verse.fa ? verse.fa.substring(0, 60) : '—'}...
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setSelectedVerses((prev) =>
                            prev.filter((v) => v.id !== verse.id)
                          )
                        }
                        className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors shrink-0 mt-0.5"
                        title={isRTL ? 'حذف' : 'Remove'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="shrink-0 bg-slate-950/50 border-t border-white/5 px-4 py-3 space-y-2">
              <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setSlideBuildMode("single");
                    persist("bp_slide_mode", "single");
                  }}
                  className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold transition ${slideBuildMode === "single" ? "bg-amber-600/40 text-amber-300" : "text-slate-400 hover:text-slate-200"}`}
                  title={isRTL ? 'یک اسلاید برای همه' : 'Single slide'}
                >
                  {isRTL ? "تک" : "Single"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSlideBuildMode("perReference");
                    persist("bp_slide_mode", "perReference");
                  }}
                  className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold transition ${slideBuildMode === "perReference" ? "bg-amber-600/40 text-amber-300" : "text-slate-400 hover:text-slate-200"}`}
                  title={isRTL ? 'اسلاید برای هر بخش' : 'Per section'}
                >
                  {isRTL ? "بخشی" : "Group"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSlideBuildMode("perVerse");
                    persist("bp_slide_mode", "perVerse");
                  }}
                  className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold transition ${slideBuildMode === "perVerse" ? "bg-amber-600/40 text-amber-300" : "text-slate-400 hover:text-slate-200"}`}
                  title={isRTL ? 'اسلاید برای هر آیه' : 'Per verse'}
                >
                  {isRTL ? "تکی" : "Verse"}
                </button>
              </div>
              <button
                onClick={handleAddSlides}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white px-4 py-2.5 rounded-lg font-bold shadow-lg transition-all text-sm"
              >
                <span>✓</span>
                <span className={isRTL ? 'font-[Vazirmatn]' : ''}>
                  {isRTL ? "افزودن اسلایدها" : "Add Slides"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

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

      {/* Verse Manager Modal */}
      <SelectedVersesModal
        isOpen={verseManagerOpen}
        verses={selectedVerses}
        onClose={() => setVerseManagerOpen(false)}
        onReorder={setSelectedVerses}
        onRemove={(verseId) =>
          setSelectedVerses((prev) =>
            prev.filter((v) => v.id !== verseId)
          )
        }
        onClear={() => setSelectedVerses([])}
        lang={lang}
      />

    </div>
  );
}
