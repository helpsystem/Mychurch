"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Check, ChevronLeft, ChevronRight, Columns2, List, Loader2, Music2, Pause, Play, Search, Trash2, X, Zap, Star, Sparkles } from "lucide-react";
import { ScripturePage, ScriptureReferenceItem } from "@/types/broadcast";
import SelectedVersesModal from "./SelectedVersesModal";
import BibleStepWizard from "./BibleStepWizard";
import { toast } from "sonner";

interface BibleVersion {
  version_id: number;
  abbr: string;
  name: string;
  language: string;
  hasAudio?: boolean;
  scope?: string;
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

const normalizeFarsi = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/‌/g, ' ')
    .toLowerCase()
    .trim();
};

const toAsciiDigits = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
};

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
  const selectedBookIdRef = useRef("GEN");
  const mainScrollRef = useRef<HTMLElement | null>(null);

  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [defaultVersionEn, setDefaultVersionEn] = useState(() => load("bp_default_ver_en", "BSB"));
  const [defaultVersionFa, setDefaultVersionFa] = useState(() => load("bp_default_ver_fa", "NMV"));
  const [selectedVersionEn, setSelectedVersionEn] = useState(() => load("bp_ver_en", load("bp_default_ver_en", "BSB")));
  const [selectedVersionFa, setSelectedVersionFa] = useState(() => load("bp_ver_fa", load("bp_default_ver_fa", "NMV")));
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [isWizardModeOpen, setIsWizardModeOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState("GEN");

  const isCurrentVersionsDefault = selectedVersionFa === defaultVersionFa && selectedVersionEn === defaultVersionEn;

  const handleToggleDefaultVersions = () => {
    setDefaultVersionEn(selectedVersionEn);
    setDefaultVersionFa(selectedVersionFa);
    persist("bp_default_ver_en", selectedVersionEn);
    persist("bp_default_ver_fa", selectedVersionFa);
    toast.success(
      isRTL
        ? `✓ ترجمه پیش‌فرض فارسی به «${selectedVersionFa}» و انگلیسی به «${selectedVersionEn}» تنظیم شد.`
        : `✓ Default set: ${selectedVersionFa} (FA) & ${selectedVersionEn} (EN)`
    );
  };

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
  const [showSidebar, setShowSidebar] = useState(false);
  const [rangeStartStr, setRangeStartStr] = useState("1");
  const [rangeEndStr, setRangeEndStr] = useState("10");

  const totalVerseCount = useMemo(() => {
    if (parallelVerses.length > 0) return Math.max(...parallelVerses.map((v) => v.verse_num));
    if (verses.length > 0) return Math.max(...verses.map((v) => v.verse_num));
    if (faVerses.length > 0) return Math.max(...faVerses.map((v) => v.verse_num));
    return 0;
  }, [parallelVerses, verses, faVerses]);

  const currentBook = books.find((book) => book.book_id === selectedBookId) || null;
  const filteredBooks = bookSearch
    ? books.filter((book) => 
        book.book_name_en.toLowerCase().includes(bookSearch.toLowerCase()) || 
        normalizeFarsi(book.book_name_fa).includes(normalizeFarsi(bookSearch))
      )
    : books;
  const englishVersions = versions.filter((version) => version.language !== "fa");
  const persianVersions = versions.filter((version) => version.language === "fa");
  const headingMap = new Map(headings.map((heading) => [heading.before_verse, heading.text]));

  // Filter verses based on search query
  const filterVersesBySearch = (verseList: VerseRow[]): VerseRow[] => {
    if (!verseSearch.trim()) return verseList;
    const query = normalizeFarsi(verseSearch);
    return verseList.filter((verse) => normalizeFarsi(verse.text).includes(query));
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
          const nextEn = items.find((version) => version.abbr === defaultVersionEn) || items.find((version) => version.abbr === "BSB") || items.find((version) => version.language !== "fa");
          if (nextEn) {
            setSelectedVersionEn(nextEn.abbr);
            persist("bp_ver_en", nextEn.abbr);
          }
        }
        if (!items.some((version) => version.abbr === selectedVersionFa)) {
          const nextFa = items.find((version) => version.abbr === defaultVersionFa) || items.find((version) => version.abbr === "NMV") || items.find((version) => version.language === "fa");
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
        // Use ref to read current selectedBookId without it being a dependency
        const currentBookId = selectedBookIdRef.current;
        if (!items.some((book) => book.book_id === currentBookId)) {
          const nextBook = items.find((book) => book.book_id === "JHN") || items[0];
          setSelectedBookId(nextBook.book_id);
          selectedBookIdRef.current = nextBook.book_id;
          setSelectedChapter(1);
        }
      })
      .catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVersionEn]);

  // Guards against a slow response for a chapter/book the user has already
  // navigated away from landing after a newer request and overwriting it.
  const loadChapterRequestRef = useRef(0);

  const loadChapter = useCallback(async () => {
    if (!currentBook || !selectedVersionEn || !selectedVersionFa) return;
    const requestId = ++loadChapterRequestRef.current;
    const isStale = () => loadChapterRequestRef.current !== requestId;
    setLoading(true);

    try {
      const parallelResponse = await fetch(`/api/bible/parallel?versionEn=${selectedVersionEn}&versionFa=${selectedVersionFa}&book=${currentBook.book_id}&chapter=${selectedChapter}`);
      const parallelData = await parallelResponse.json();
      if (isStale()) return;
      const nextParallel: ParallelVerse[] = parallelData.parallel || [];
      setParallelVerses(nextParallel);
      setAudioTracks(lang === "fa" ? (parallelData.audioFa || []) : (parallelData.audioEn || []));
      setSelectedTrackIdx(0);

      if (parallelData.isFaFallback && parallelData.fallbackNoticeFa) {
        setFallbackNotice(parallelData.fallbackNoticeFa);
      } else {
        setFallbackNotice(null);
      }

      if (readingMode === "parallel") {
        setVerses([]);
        setFaVerses([]);
        setHeadings([]);
      } else if (readingMode === "fa") {
        const response = await fetch(`/api/bible/chapter?version=${selectedVersionFa}&book=${currentBook.book_id}&chapter=${selectedChapter}`);
        const data = await response.json();
        if (isStale()) return;
        setFaVerses(data.verses || []);
        if (data.isFallback && data.fallbackNotice) {
          setFallbackNotice(data.fallbackNotice);
        }
        setVerses([]);
        setHeadings([]);
      } else {
        const response = await fetch(`/api/bible/chapter?version=${selectedVersionEn}&book=${currentBook.book_id}&chapter=${selectedChapter}`);
        const data = await response.json();
        if (isStale()) return;
        setVerses(data.verses || []);
        setHeadings(data.headings || []);
        if (data.isFallback && data.fallbackNotice) {
          setFallbackNotice(data.fallbackNotice);
        }
        setFaVerses([]);
      }
    } catch {
      if (isStale()) return;
      setParallelVerses([]);
      setVerses([]);
      setFaVerses([]);
      setHeadings([]);
      setAudioTracks([]);
      setFallbackNotice(null);
    } finally {
      if (!isStale()) setLoading(false);
    }
  }, [currentBook, lang, readingMode, selectedChapter, selectedVersionEn, selectedVersionFa]);

  useEffect(() => {
    loadChapter();
    setIsPlaying(false);
    setAudioProgress(0);
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
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
    selectedBookIdRef.current = book.book_id;
    setSelectedChapter(1);
    setShowBookList(false);
    setBookSearch("");
  };

  const openVerseDetails = () => {
    // Auto-open the full verse manager to show multi-section list + full verse details
    setVerseManagerOpen(true);
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
    // Fast & uninterrupted: No auto-opening drawer on click!
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

  const handleVerseClick = (verseNum: number, event: React.MouseEvent) => {
    if (event.shiftKey && lastInteractedVerse !== null) {
      applyRangeSelection(verseNum);
      return;
    }
    toggleVerse(verseNum);
    setLastInteractedVerse(verseNum);
  };

  // Auto-adapt rangeEnd to current chapter's actual verse count
  useEffect(() => {
    if (totalVerseCount > 0) {
      setRangeStartStr("1");
      setRangeEndStr(String(Math.min(10, totalVerseCount)));
    }
  }, [selectedChapter, selectedBookId, totalVerseCount]);

  // Keep selected verses texts synced with active translation
  useEffect(() => {
    setSelectedVerses((previous) => {
      if (!previous.length) return previous;
      return previous.map((entry) => {
        if (entry.book_id === currentBook?.book_id && entry.chapter === selectedChapter) {
          const texts = getVerseTexts(entry.verse_num);
          if (texts.fa || texts.en) {
            return {
              ...entry,
              fa: texts.fa || entry.fa,
              en: texts.en || entry.en,
            };
          }
        }
        return entry;
      });
    });
  }, [parallelVerses, faVerses, verses]);

  const selectCustomRange = () => {
    if (!currentBook) return;
    const maxAvailable = totalVerseCount > 0
      ? totalVerseCount
      : (visibleVerseNumbers.length > 0 ? Math.max(...visibleVerseNumbers) : 176);

    const parsedStart = parseInt(toAsciiDigits(rangeStartStr), 10) || 1;
    const parsedEnd = parseInt(toAsciiDigits(rangeEndStr), 10) || parsedStart;

    if (maxAvailable > 0 && Math.min(parsedStart, parsedEnd) > maxAvailable) {
      toast.error(
        isRTL
          ? `باب ${selectedChapter} از ${currentBook.book_name_fa} تنها دارای ${maxAvailable} آیه است (آیات ۱ تا ${maxAvailable}).`
          : `${currentBook.book_name_en} ${selectedChapter} only contains ${maxAvailable} verses.`
      );
      return;
    }

    const start = Math.max(1, Math.min(parsedStart, parsedEnd));
    const rawEnd = Math.max(parsedStart, parsedEnd);
    const end = maxAvailable > 0 ? Math.min(rawEnd, maxAvailable) : rawEnd;

    setRangeStartStr(String(start));
    setRangeEndStr(String(end));

    const range = Array.from({ length: end - start + 1 }, (_, idx) => start + idx);

    setSelectedVerses((previous) => {
      const byId = new Map(previous.map((entry) => [entry.id, entry]));
      range.forEach((verseNum) => {
        const texts = getVerseTexts(verseNum);
        if (!texts.fa && !texts.en) return;
        const id = `${currentBook.book_id}-${selectedChapter}-${verseNum}`;
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
    setLastInteractedVerse(end);

    // Scroll smoothly to first selected verse
    setTimeout(() => {
      const targetEl = document.getElementById(`verse-row-${start}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 50);

    toast.success(
      isRTL
        ? `✓ آیات ${start} تا ${end} انتخاب شدند (${range.length} آیه).`
        : `Selected verses ${start} to ${end} (${range.length} verses).`
    );
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
    toast.success(
      isRTL
        ? `تمام آیات باب ${selectedChapter} انتخاب شدند.`
        : `Selected all verses of chapter ${selectedChapter}.`
    );
  };

  const addCustomRangeDirectlyToSlides = () => {
    if (!currentBook) return;
    const maxAvailable = totalVerseCount > 0
      ? totalVerseCount
      : (visibleVerseNumbers.length > 0 ? Math.max(...visibleVerseNumbers) : 176);

    const parsedStart = parseInt(toAsciiDigits(rangeStartStr), 10) || 1;
    const parsedEnd = parseInt(toAsciiDigits(rangeEndStr), 10) || parsedStart;

    const start = Math.max(1, Math.min(parsedStart, parsedEnd));
    const rawEnd = Math.max(parsedStart, parsedEnd);
    const end = maxAvailable > 0 ? Math.min(rawEnd, maxAvailable) : rawEnd;

    setRangeStartStr(String(start));
    setRangeEndStr(String(end));

    const range = Array.from({ length: end - start + 1 }, (_, idx) => start + idx);

    const entries: SelectedVerseEntry[] = [];
    range.forEach((verseNum) => {
      const texts = getVerseTexts(verseNum);
      // Skip verses that have no text in either language
      if (!texts.fa && !texts.en) return;
      const id = `${currentBook.book_id}-${selectedChapter}-${verseNum}`;
      entries.push({
        id,
        book_id: currentBook.book_id,
        book_name_en: currentBook.book_name_en,
        book_name_fa: currentBook.book_name_fa,
        book_order: currentBook.book_order,
        chapter: selectedChapter,
        verse_num: verseNum,
        en: texts.en ?? "",
        fa: texts.fa ?? "",
      });
    });

    if (entries.length === 0) {
      toast.error(isRTL ? 'در این بازه آیه‌ای یافت نشد. لطفاً ابتدا فصل را بارگذاری کنید.' : 'No verses found in this range. Please load the chapter first.');
      return;
    }
    const slides = buildSlides(entries);
    onAddSlides(slides);
    setSelectedVerses([]);
    onClose();
    toast.success(
      isRTL
        ? `✓ آیات ${start} تا ${end} از ${currentBook.book_name_fa} باب ${selectedChapter} به اسلایدها افزوده شد.`
        : `✓ Added ${currentBook.book_name_en} ${selectedChapter}:${start}-${end} to slides.`
    );
  };

  const addAllChapterDirectlyToSlides = () => {
    if (!currentBook) return;
    const maxAvailable = parallelVerses.length > 0
      ? Math.max(...parallelVerses.map((v) => v.verse_num))
      : Math.max(verses.length, faVerses.length);

    if (maxAvailable <= 0) {
      toast.error(isRTL ? 'لطفاً ابتدا فصل را بارگذاری کنید.' : 'Please load the chapter first.');
      return;
    }
    const range = Array.from({ length: maxAvailable }, (_, idx) => idx + 1);

    const entries: SelectedVerseEntry[] = [];
    range.forEach((verseNum) => {
      const texts = getVerseTexts(verseNum);
      // Skip verses that have no text in either language
      if (!texts.fa && !texts.en) return;
      const id = `${currentBook.book_id}-${selectedChapter}-${verseNum}`;
      entries.push({
        id,
        book_id: currentBook.book_id,
        book_name_en: currentBook.book_name_en,
        book_name_fa: currentBook.book_name_fa,
        book_order: currentBook.book_order,
        chapter: selectedChapter,
        verse_num: verseNum,
        en: texts.en ?? "",
        fa: texts.fa ?? "",
      });
    });

    if (entries.length === 0) {
      toast.error(isRTL ? 'آیه‌ای برای افزودن یافت نشد.' : 'No verses to add.');
      return;
    }
    const slides = buildSlides(entries);
    onAddSlides(slides);
    setSelectedVerses([]);
    onClose();
    toast.success(
      isRTL
        ? `✓ کل باب ${selectedChapter} از ${currentBook.book_name_fa} (${entries.length} آیه) به اسلایدها افزوده شد.`
        : `✓ Added entire ${currentBook.book_name_en} chapter ${selectedChapter} (${entries.length} verses) to slides.`
    );
  };

  const clearCurrentChapterSelection = () => {
    if (!currentBook) return;
    setSelectedVerses((previous) => previous.filter((entry) => !(entry.book_id === currentBook.book_id && entry.chapter === selectedChapter)));
  };

  const buildSlides = (customVerses?: SelectedVerseEntry[]): ScripturePage[] => {
    const list = customVerses && customVerses.length > 0 ? customVerses : selectedVerses;
    if (!list.length) return [];
    const sorted = [...list].sort((a, b) => a.book_order - b.book_order || a.chapter - b.chapter || a.verse_num - b.verse_num);
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
        popupLabelFa: single ? `${firstReference.bookName.fa} \u2066${firstReference.chapter}:${firstReference.verses}\u2069` : `${referenceItems.length} آیه انتخابی`,
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
        popupLabelFa: `اسلاید ${slideNumber++}: ${reference.bookName.fa} \u2066${reference.chapter}:${verseNum}\u2069`,
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
      popupLabelFa: `${reference.bookName.fa} \u2066${reference.chapter}:${reference.verses}\u2069`,
      popupLabelEn: `${reference.bookName.en} ${reference.chapter}:${reference.verses}`,
    }));
  };

  const handleAddSlides = () => {
    if (!selectedVerses.length) {
      toast.error(isRTL ? 'هیچ آیه‌ای انتخاب نشده است.' : 'No verses selected.');
      return;
    }
    const slides = buildSlides();
    if (!slides.length) {
      toast.error(isRTL ? 'آیات انتخاب‌شده متنی ندارند. لطفاً دوباره تلاش کنید.' : 'Selected verses have no text. Please try again.');
      return;
    }
    onAddSlides(slides);
    // onClose is called by applyScripturePages inside SlideBuilder (via setActiveModal),
    // so we only clear local selection state here without calling onClose twice.
    setSelectedVerses([]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && selectedVerses.length > 0) {
        const tag = (document.activeElement?.tagName || "").toLowerCase();
        if (tag === "input" || tag === "textarea") return;
        e.preventDefault();
        handleAddSlides();
      } else if (e.key === "Escape") {
        if (showBookList) setShowBookList(false);
        else if (showChapterGrid) setShowChapterGrid(false);
        else if (showSidebar) setShowSidebar(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedVerses, showBookList, showChapterGrid, showSidebar]);

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

      <div className="shrink-0 bg-[#0e0e0f]/95 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex flex-wrap items-center gap-2 md:gap-3 relative z-[220] overflow-visible">
        <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-blue-400 shrink-0" />
        <span className={`font-bold text-white text-sm md:text-base shrink-0 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{isRTL ? "انتخاب آیه کتاب مقدس" : "Select Bible Verse"}</span>

        <div ref={bookDropdownRef} className="relative z-[230]">
          <button type="button" onClick={(event) => { event.stopPropagation(); setShowBookList((value) => !value); setShowChapterGrid(false); }} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs md:text-sm font-bold transition-all text-left min-w-[11rem] md:min-w-[14rem] max-w-[16rem] md:max-w-none" aria-label="Select Bible book">
            <BookOpen className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="flex-1 truncate text-white">{currentBook ? (isRTL ? <span className="font-[Vazirmatn]">{currentBook.book_name_fa}</span> : currentBook.book_name_en) : (isRTL ? "انتخاب کتاب..." : "Select a book...")}</span>
            <List className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          </button>
          {showBookList && (
            <div className="absolute top-full mt-1 left-0 z-[240] max-h-[55vh] overflow-y-auto bg-[#18181b] border border-white/20 rounded-2xl shadow-2xl p-2 ring-1 ring-white/10 min-w-[18rem] w-max">
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

        {/* English version select */}
        <select
          value={selectedVersionEn}
          onChange={(event) => {
            setSelectedVersionEn(event.target.value);
            persist("bp_ver_en", event.target.value);
          }}
          aria-label="English Bible version"
          className={`${VERSION_SELECT_STYLE.en} ${VERSION_SELECT_STYLE.base} border-white/10 focus:border-blue-500/50`}
        >
          {englishVersions.map((version) => (
            <option key={version.abbr} value={version.abbr} title={version.name} className="bg-zinc-900 text-white">
              {version.hasAudio ? "🔊 " : ""}
              {version.abbr}
              {version.abbr === defaultVersionEn ? " ⭐" : ""}
            </option>
          ))}
        </select>

        {/* Farsi version select */}
        <select
          value={selectedVersionFa}
          onChange={(event) => {
            setSelectedVersionFa(event.target.value);
            persist("bp_ver_fa", event.target.value);
          }}
          aria-label="Farsi Bible version"
          className={`font-[Vazirmatn] ${VERSION_SELECT_STYLE.fa} ${VERSION_SELECT_STYLE.base} truncate ${persianVersions.length === 0 ? VERSION_SELECT_STYLE.empty : VERSION_SELECT_STYLE.normal}`}
          dir="rtl"
        >
          {persianVersions.length === 0 ? (
            <option value="" className="bg-zinc-900 text-white">— ترجمه‌ای یافت نشد —</option>
          ) : (
            persianVersions.map((version) => {
              const isNTOnly = version.scope === "NT" || version.abbr === "PES" || version.abbr === "BBK";
              const isCurrentBookOT = currentBook && currentBook.testament === "OT";
              return (
                <option key={version.abbr} value={version.abbr} className="bg-zinc-900 text-white">
                  {version.name} {version.hasAudio ? "🔊" : ""}
                  {version.abbr === defaultVersionFa ? " ⭐ (پیش‌فرض)" : ""}
                  {isNTOnly && isCurrentBookOT ? " ⚠️ (فقط عهد جدید)" : ""}
                </option>
              );
            })
          )}
        </select>

        {/* Set as Default Button */}
        <button
          type="button"
          onClick={handleToggleDefaultVersions}
          className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            isCurrentVersionsDefault
              ? "bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
          }`}
          title={
            isCurrentVersionsDefault
              ? (isRTL ? `ترجمه‌های پیش‌فرض فعال: ${defaultVersionFa} و ${defaultVersionEn}` : `Default active: ${defaultVersionFa} & ${defaultVersionEn}`)
              : (isRTL ? `تنظیم ${selectedVersionFa} و ${selectedVersionEn} به عنوان پیش‌فرض همیشگی` : `Set ${selectedVersionFa} & ${selectedVersionEn} as permanent default`)
          }
        >
          <Star className={`w-3.5 h-3.5 ${isCurrentVersionsDefault ? "fill-amber-400 text-amber-400" : ""}`} />
          <span className="hidden xl:inline text-[11px] font-[Vazirmatn]">
            {isCurrentVersionsDefault ? (isRTL ? "پیش‌فرض" : "Default") : (isRTL ? "ذخیره پیش‌فرض" : "Set Default")}
          </span>
        </button>

        {/* Switch to Step Wizard Button */}
        <button
          type="button"
          onClick={() => setIsWizardModeOpen(true)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-purple-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-500/40 text-purple-200 px-3 py-2 rounded-xl text-xs font-bold transition shadow shrink-0 font-[Vazirmatn] cursor-pointer"
          title={isRTL ? "باز کردن دستیار گام‌به‌گام هوشمند آیات" : "Open Step-by-Step Bible Wizard"}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">{isRTL ? "دستیار گام‌به‌گام" : "Step Wizard"}</span>
        </button>

        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 shrink-0" dir="ltr">
          <button onClick={() => { setReadingMode("en"); persist("bp_reading_mode", "en"); }} className={`px-2.5 md:px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all ${readingMode === "en" ? "bg-blue-500 text-white shadow" : "text-slate-400 hover:text-white"}`}>EN</button>
          <button onClick={() => { setReadingMode("fa"); persist("bp_reading_mode", "fa"); }} className={`px-2.5 md:px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all ${readingMode === "fa" ? "bg-purple-500 text-white shadow" : "text-slate-400 hover:text-white"}`}>FA</button>
          <button onClick={() => { setReadingMode("parallel"); persist("bp_reading_mode", "parallel"); }} className={`flex items-center gap-1 px-2.5 md:px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all ${readingMode === "parallel" ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow" : "text-slate-400 hover:text-white"}`}><Columns2 className="w-3 h-3" /> EN|FA</button>
          <div className="w-px h-5 bg-white/20 mx-1 shrink-0" />
          <button onClick={() => { const next = Math.max(13, fontSize - 2); setFontSize(next); persist("bp_font_size", String(next)); }} className="px-2 py-1.5 rounded-lg text-[11px] md:text-xs font-bold text-slate-400 hover:text-white transition-all hover:bg-white/10 shrink-0">A-</button>
          <button onClick={() => { const next = Math.min(36, fontSize + 2); setFontSize(next); persist("bp_font_size", String(next)); }} className="px-2 py-1.5 rounded-lg text-[11px] md:text-sm font-bold text-slate-400 hover:text-white transition-all hover:bg-white/10 shrink-0">A+</button>
        </div>

        {selectedVerses.length > 0 && (
          <button
            type="button"
            onClick={handleAddSlides}
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-black font-black text-xs md:text-sm rounded-xl shadow-[0_0_16px_rgba(245,158,11,0.5)] transition cursor-pointer font-[Vazirmatn] shrink-0"
            title={isRTL ? "افزودن آیات انتخاب‌شده به اسلایدها" : "Add selected verses to presentation slides"}
          >
            <Zap className="w-4 h-4 fill-black" />
            <span>{isRTL ? `✓ افزودن به اسلاید (${selectedVerses.length})` : `✓ Add to Slides (${selectedVerses.length})`}</span>
          </button>
        )}

        <button onClick={onClose} className="ml-auto p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all" aria-label="Close scripture selector"><X className="w-5 h-5" /></button>
      </div>

      {showChapterGrid && currentBook && (
        <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 pt-16 sm:pt-20">
          <div className="w-full max-w-3xl bg-[#18181b] border border-white/10 rounded-3xl shadow-2xl p-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 font-black flex items-center justify-center text-sm">
                  {currentBook.chapter_count}
                </span>
                <div>
                  <h3 className="text-xl font-black font-[Vazirmatn] text-white flex items-center gap-2">
                    <span>{currentBook.book_name_fa}</span>
                    <span className="text-xs font-normal text-slate-400 font-sans">({currentBook.chapter_count} {currentBook.book_id === 'PSA' || currentBook.book_name_en === 'Psalms' ? 'مزمور' : 'باب'})</span>
                  </h3>
                  <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">{currentBook.book_name_en} — {currentBook.chapter_count} Chapters</p>
                </div>
              </div>
              <button onClick={() => setShowChapterGrid(false)} className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 overflow-y-auto pr-1 flex-1 py-1">
              {chapterGrid.map((chapterNumber) => (
                <button 
                  key={chapterNumber} 
                  onClick={() => { setSelectedChapter(chapterNumber); setShowChapterGrid(false); }} 
                  className={`aspect-square rounded-xl text-sm font-bold transition-all border flex items-center justify-center ${
                    chapterNumber === selectedChapter 
                      ? "bg-indigo-600 text-white scale-105 shadow-lg shadow-indigo-500/40 border-indigo-400" 
                      : "bg-slate-850 text-slate-200 hover:bg-slate-750 hover:text-white hover:border-indigo-500/50 border-slate-700/60"
                  }`}
                >
                  {chapterNumber}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative z-0">
        <main ref={mainScrollRef} className="flex-1 overflow-y-auto bg-[#0e0e0f] px-4 pb-32">
        {currentBook && (
          <div className="text-center pt-8 pb-6 border-b border-white/5" dir="ltr">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-1">{currentBook.book_name_en}</p>
            <h1 className="text-2xl font-black tracking-tight">
              {currentBook.book_id === 'PSA' ? 'Psalm' : 'Chapter'} {selectedChapter}
            </h1>
            <p className="font-[Vazirmatn] mt-1.5 text-base text-slate-400" dir="rtl">
              {currentBook.book_name_fa} — {currentBook.book_id === 'PSA' ? 'مزمور' : 'باب'} {selectedChapter}
            </p>
          </div>
        )}

        {/* Fallback Notice Banner */}
        {fallbackNotice && (
          <div className="max-w-5xl mx-auto px-4 mt-3 mb-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-amber-500/15 border border-amber-500/40 text-amber-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs" dir={isRTL ? "rtl" : "ltr"}>
              <div className="flex items-center gap-2.5">
                <span className="text-base shrink-0">⚠️</span>
                <span className="font-[Vazirmatn] leading-relaxed">{fallbackNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedVersionFa(defaultVersionFa);
                  persist("bp_ver_fa", defaultVersionFa);
                }}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-black rounded-xl transition cursor-pointer text-xs shrink-0 font-[Vazirmatn]"
              >
                {isRTL ? `تغییر به ترجمه پیش‌فرض (${defaultVersionFa})` : `Switch to Default (${defaultVersionFa})`}
              </button>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 pt-3 pb-2 flex flex-wrap items-center justify-center gap-2.5">
          {/* Segmented Range Selector Box */}
          <div className="flex items-center gap-2 bg-black/80 border border-amber-400/60 rounded-xl px-3 py-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <span className="text-xs text-amber-300 font-bold font-[Vazirmatn] select-none">انتخاب بازه:</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-zinc-400 font-[Vazirmatn]">از آیه</span>
              <input
                type="text"
                inputMode="numeric"
                value={rangeStartStr}
                onChange={(e) => {
                  const clean = toAsciiDigits(e.target.value).replace(/\D/g, "");
                  setRangeStartStr(clean);
                }}
                onBlur={() => {
                  const parsed = parseInt(toAsciiDigits(rangeStartStr), 10);
                  const max = totalVerseCount > 0 ? totalVerseCount : 176;
                  if (isNaN(parsed) || parsed < 1) {
                    setRangeStartStr("1");
                  } else if (parsed > max) {
                    setRangeStartStr(String(max));
                  }
                }}
                className="w-12 bg-white/10 border border-amber-400/40 rounded px-1.5 py-0.5 text-center text-xs font-bold font-mono text-white outline-none focus:border-amber-400 focus:bg-white/20 transition-all"
                placeholder="1"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-zinc-400 font-[Vazirmatn]">تا</span>
              <input
                type="text"
                inputMode="numeric"
                value={rangeEndStr}
                onChange={(e) => {
                  const clean = toAsciiDigits(e.target.value).replace(/\D/g, "");
                  setRangeEndStr(clean);
                }}
                onBlur={() => {
                  const parsed = parseInt(toAsciiDigits(rangeEndStr), 10);
                  const max = totalVerseCount > 0 ? totalVerseCount : 176;
                  if (isNaN(parsed) || parsed < 1) {
                    setRangeEndStr("1");
                  } else if (parsed > max) {
                    setRangeEndStr(String(max));
                  }
                }}
                className="w-12 bg-white/10 border border-amber-400/40 rounded px-1.5 py-0.5 text-center text-xs font-bold font-mono text-white outline-none focus:border-amber-400 focus:bg-white/20 transition-all"
                placeholder={String(totalVerseCount || 10)}
              />
            </div>
            {totalVerseCount > 0 && (
              <span className="text-[11px] text-zinc-400 font-mono select-none">
                (از {totalVerseCount})
              </span>
            )}
            <button
              type="button"
              onClick={selectCustomRange}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition shadow flex items-center gap-1 cursor-pointer font-[Vazirmatn]"
              title={isRTL ? "انتخاب این بازه در لیست آیات" : "Select this range in list"}
            >
              <Check className="w-3.5 h-3.5 text-amber-400" />
              <span>انتخاب</span>
            </button>
            <button
              type="button"
              onClick={addCustomRangeDirectlyToSlides}
              className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-black font-black text-xs rounded-lg transition shadow-[0_0_12px_rgba(245,158,11,0.4)] flex items-center gap-1 cursor-pointer font-[Vazirmatn]"
              title={isRTL ? "ساخت فوری اسلاید از این بازه" : "Directly add this range as slides"}
            >
              <Zap className="w-3.5 h-3.5 fill-black" />
              <span>➕ افزودن به اسلاید</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addAllChapterDirectlyToSlides}
              className="px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 font-[Vazirmatn] cursor-pointer"
              title={isRTL ? "ساخت مستقیم اسلاید از تمام آیات این باب" : "Directly add whole chapter to slides"}
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>{isRTL ? "➕ افزودن کل این باب به اسلاید" : "Add Whole Chapter"}</span>
            </button>
            <button
              type="button"
              onClick={addVisibleVerses}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white/5 border border-white/15 text-slate-300 hover:text-white hover:bg-white/10 transition font-[Vazirmatn]"
            >
              {isRTL ? "انتخاب همه آیات" : "Select All"}
            </button>
            <button
              type="button"
              onClick={clearCurrentChapterSelection}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600/15 border border-rose-500/35 text-rose-300 hover:bg-rose-600/25 transition font-[Vazirmatn]"
            >
              {isRTL ? "پاک کردن انتخاب‌ها" : "Clear Selection"}
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 pb-2">
          <p className="text-xs text-zinc-400 text-center font-[Vazirmatn] flex items-center justify-center gap-2 flex-wrap select-none">
            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[11px] text-amber-300 font-bold">💡 راهنمای انتخاب:</span>
            <span>کلیک روی آیه: انتخاب یا حذف</span>
            <span>•</span>
            <span><kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-[10px] text-zinc-200">Ctrl + کلیک</kbd>: سلکت دستی چندگانه</span>
            <span>•</span>
            <span><kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-[10px] text-zinc-200">Shift + کلیک</kbd>: انتخاب بازه</span>
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={verseSearch}
              onChange={(event) => setVerseSearch(event.target.value)}
              placeholder={isRTL ? "جستجو در آیات..." : "Search in verses..."}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm outline-none focus:border-blue-500/50 focus:bg-white/10 text-white placeholder-slate-600 transition-all"
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
          <div className="max-w-5xl mx-auto px-4 pb-28 pt-2">
            {readingMode === "parallel" && (
              <div className="space-y-3">
                {filteredParallelVerses.length > 0 ? (
                  filteredParallelVerses.map((verse) => {
                    const selected = selectedVerses.some((entry) => entry.verse_num === verse.verse_num && entry.chapter === selectedChapter && entry.book_id === currentBook?.book_id);
                    return (
                      <div key={verse.verse_num} id={`verse-row-${verse.verse_num}`} onClick={(event) => handleVerseClick(verse.verse_num, event)} className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 p-3 rounded-2xl transition-all duration-150 cursor-pointer select-none ${selected ? "bg-amber-500/15 border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]" : "hover:bg-white/5 border border-transparent"}`}>
                        <div className="flex gap-3" dir="ltr"><span className={`text-sm font-black px-1.5 py-0.5 rounded mt-1 shrink-0 select-none ${selected ? "text-black bg-amber-400" : "text-blue-400 bg-blue-500/10"}`}>{verse.verse_num}</span><p className="text-zinc-100 leading-relaxed" style={{ fontSize: `${fontSize}px`, fontFamily: fontEn }}>{verse.en || <span className="text-zinc-600 italic text-sm">—</span>}</p></div>
                        <div className="flex gap-3 text-right" dir="rtl"><span className={`text-sm font-black px-1.5 py-0.5 rounded mt-1 shrink-0 select-none ${selected ? "text-black bg-amber-400" : "text-amber-500 bg-amber-500/10"}`}>{verse.verse_num}</span><p className="text-zinc-100 leading-relaxed" style={{ fontSize: `${fontSize + 2}px`, fontFamily: fontFa }}>{verse.fa || <span className="text-zinc-600 italic text-sm">—</span>}</p></div>
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
                      <span key={verse.verse_num} id={`verse-row-${verse.verse_num}`}>
                        {headingMap.has(verse.verse_num) && <h3 className="text-base font-black text-blue-300 mt-8 mb-2 not-prose tracking-wide" dir="ltr">{headingMap.get(verse.verse_num)}</h3>}
                        <span dir="ltr" className={`inline cursor-pointer rounded px-1 transition-all duration-150 select-none ${selected ? "bg-amber-500/30 text-amber-200 border-b-2 border-amber-400 font-bold" : "hover:bg-white/5 active:scale-95"}`} onClick={(event) => handleVerseClick(verse.verse_num, event)}>
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
                      <span key={verse.verse_num} id={`verse-row-${verse.verse_num}`} dir="rtl" className={`inline cursor-pointer rounded px-1 transition-all duration-150 select-none ${selected ? "bg-amber-500/30 text-amber-100 border-b-2 border-amber-400 font-bold" : "hover:bg-white/5 active:scale-95"}`} onClick={(event) => handleVerseClick(verse.verse_num, event)}>
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

        {/* ── کپسول شناور اکشن‌ها (Floating Action Bar) ── */}
        {selectedVerses.length > 0 && (
          <div className={`fixed ${audioTracks.length > 0 ? "bottom-24 md:bottom-20" : "bottom-6"} left-1/2 -translate-x-1/2 z-[350] bg-zinc-950/95 border border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.3)] backdrop-blur-2xl rounded-2xl px-4 py-2.5 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 max-w-[95vw] overflow-x-auto`}>
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-300 font-black text-xs md:text-sm font-[Vazirmatn] select-none">
                {selectedVerses.length} {isRTL ? "آیه انتخاب شد" : "verses"}
              </span>
            </div>

            <div className="h-5 w-px bg-white/20 shrink-0" />

            {/* Quick Mode Switcher */}
            <div className="hidden sm:flex items-center bg-black/60 border border-white/10 rounded-xl p-0.5 text-xs shrink-0">
              <button
                type="button"
                onClick={() => { setSlideBuildMode("perVerse"); persist("bp_slide_mode", "perVerse"); }}
                className={`px-2 py-1 rounded-lg font-bold transition font-[Vazirmatn] ${slideBuildMode === "perVerse" ? "bg-amber-500/30 text-amber-300" : "text-zinc-400 hover:text-white"}`}
              >
                {isRTL ? "هر آیه مجزا" : "Per Verse"}
              </button>
              <button
                type="button"
                onClick={() => { setSlideBuildMode("single"); persist("bp_slide_mode", "single"); }}
                className={`px-2 py-1 rounded-lg font-bold transition font-[Vazirmatn] ${slideBuildMode === "single" ? "bg-amber-500/30 text-amber-300" : "text-zinc-400 hover:text-white"}`}
              >
                {isRTL ? "همه در یک اسلاید" : "Combined"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowSidebar(prev => !prev)}
              className={`px-2.5 py-1 text-xs rounded-lg transition font-[Vazirmatn] shrink-0 ${showSidebar ? "bg-white/20 text-white" : "text-zinc-400 hover:text-white hover:bg-white/10"}`}
              title={isRTL ? "نمایش یا بستن لیست انتخاب‌ها" : "Toggle selected list"}
            >
              {showSidebar ? (isRTL ? "بستن لیست" : "Hide List") : (isRTL ? "نمایش لیست" : "Show List")}
            </button>

            <button
              type="button"
              onClick={() => setSelectedVerses([])}
              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition shrink-0"
              title={isRTL ? "پاک کردن انتخاب‌ها" : "Clear selection"}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleAddSlides}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-black font-black text-xs md:text-sm rounded-xl shadow-[0_0_18px_rgba(245,158,11,0.5)] transition cursor-pointer font-[Vazirmatn] shrink-0"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>{isRTL ? "افزودن اسلایدها (Enter)" : "Add Slides (Enter)"}</span>
            </button>
          </div>
        )}
        </main>

        {showSidebar && selectedVerses.length > 0 && (
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
              <div className={`flex items-stretch gap-1 bg-black/30 rounded-lg p-1 border border-white/10 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                <button
                  type="button"
                  onClick={() => {
                    setSlideBuildMode("single");
                    persist("bp_slide_mode", "single");
                  }}
                  className={`flex-1 px-2 py-1.5 rounded-md text-[10px] leading-tight font-bold transition ${slideBuildMode === "single" ? "bg-amber-600/40 text-amber-300 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                  title={isRTL ? "تمام آیات در یک اسلاید واحد قرار می‌گیرند (با قابلیت بازشوندگی داخلی). مناسب برای ساخت کالکشن آیات." : "All selected verses are merged into a single slide with internal accordion. Good for verse collections."}
                >
                  {isRTL ? "همه در یک اسلاید" : "Multi in One"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSlideBuildMode("perReference");
                    persist("bp_slide_mode", "perReference");
                  }}
                  className={`flex-1 px-2 py-1.5 rounded-md text-[10px] leading-tight font-bold transition ${slideBuildMode === "perReference" ? "bg-amber-600/40 text-amber-300 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                  title={isRTL ? "برای هر بخش پیوسته (مثلاً آیات ۱ الی ۵) یک اسلاید جداگانه ساخته می‌شود. (حالت پیش‌نهادی)" : "Creates a separate slide for each contiguous block of verses. (Recommended)"}
                >
                  {isRTL ? "بخش‌بخش (مرجع)" : "By Section"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSlideBuildMode("perVerse");
                    persist("bp_slide_mode", "perVerse");
                  }}
                  className={`flex-1 px-2 py-1.5 rounded-md text-[10px] leading-tight font-bold transition ${slideBuildMode === "perVerse" ? "bg-amber-600/40 text-amber-300 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                  title={isRTL ? "هر تک آیه کاملاً یک اسلاید مجزا خواهد شد. مناسب برای ورق زدن آیه به آیه هنگام موعظه." : "Every individual verse forms a standalone separate slide. Best for verse-by-verse preaching."}
                >
                  {isRTL ? "هر آیه مجزا" : "Per Verse"}
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

      {/* Verse Manager Modal - auto-opens after verse selection for full details & multi-section view */}
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

      {/* Bible Step Wizard - Step by step interactive assistant */}
      {isWizardModeOpen && (
        <BibleStepWizard
          onClose={() => setIsWizardModeOpen(false)}
          onAddSlides={(slides) => {
            setIsWizardModeOpen(false);
            onAddSlides(slides);
          }}
          lang={lang}
          versions={versions}
          books={books}
          selectedVersionEn={selectedVersionEn}
          selectedVersionFa={selectedVersionFa}
          setSelectedVersionEn={(v) => { setSelectedVersionEn(v); persist("bp_ver_en", v); }}
          setSelectedVersionFa={(v) => { setSelectedVersionFa(v); persist("bp_ver_fa", v); }}
          fontFa={fontFa}
          fontEn={fontEn}
          fontSize={fontSize}
          onSwitchToFreeReader={() => setIsWizardModeOpen(false)}
        />
      )}

    </div>
  );
}
