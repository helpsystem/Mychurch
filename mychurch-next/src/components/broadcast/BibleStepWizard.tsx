"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit3,
  Plus,
  Layers,
  Layout,
  Sparkles,
  X,
  Zap,
  HelpCircle,
  Columns2,
  ListOrdered,
  FileText,
  Search,
  CheckCircle2,
} from "lucide-react";
import { ScripturePage, ScriptureReferenceItem } from "@/types/broadcast";
import { toast } from "sonner";

export interface BibleVersion {
  version_id: number;
  abbr: string;
  name: string;
  language: string;
  hasAudio?: boolean;
}

export interface BookItem {
  book_id: string;
  book_name_en: string;
  book_name_fa: string;
  testament: string;
  book_order: number;
  chapter_count: number;
}

export interface VerseItem {
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

export interface SectionBlock {
  id: string;
  book: BookItem;
  chapter: number;
  verses: VerseItem[];
}

export type SlideLayoutMode = "perVerse" | "single" | "chunk2" | "chunk3";

interface BibleStepWizardProps {
  onClose: () => void;
  onAddSlides: (slides: ScripturePage[]) => void;
  lang: "fa" | "en";
  versions: BibleVersion[];
  books: BookItem[];
  selectedVersionEn: string;
  selectedVersionFa: string;
  setSelectedVersionEn: (v: string) => void;
  setSelectedVersionFa: (v: string) => void;
  fontFa: string;
  fontEn: string;
  fontSize: number;
  onSwitchToFreeReader?: () => void;
}

const normalizeFarsi = (str: string): string => {
  if (!str) return "";
  return str
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/‌/g, " ")
    .toLowerCase()
    .trim();
};

const toAsciiDigits = (str: string): string => {
  if (!str) return "";
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
};

export default function BibleStepWizard({
  onClose,
  onAddSlides,
  lang,
  versions,
  books,
  selectedVersionEn,
  selectedVersionFa,
  setSelectedVersionEn,
  setSelectedVersionFa,
  fontFa,
  fontEn,
  fontSize,
  onSwitchToFreeReader,
}: BibleStepWizardProps) {
  const isRTL = lang === "fa";

  // Wizard current step: 1 = Book/Chapter, 2 = Verses, 3 = Layout & Structure, 4 = Review & Reorder
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Active section currently being edited in Step 1/2
  const [activeBookId, setActiveBookId] = useState<string>("JHN");
  const [activeChapter, setActiveChapter] = useState<number>(3);
  const [bookFilterTab, setBookFilterTab] = useState<"all" | "NT" | "OT" | "gospels">("all");
  const [bookSearchQuery, setBookSearchQuery] = useState("");

  // Verses loaded for the active chapter
  const [chapterVerses, setChapterVerses] = useState<{ verse_num: number; en: string; fa: string }[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(false);

  // Range inputs for Step 2
  const [rangeStart, setRangeStart] = useState("16");
  const [rangeEnd, setRangeEnd] = useState("17");

  // Sections collection (for multi-section / cross-reference)
  const [sections, setSections] = useState<SectionBlock[]>([]);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  // Step 3 layout configuration
  const [layoutMode, setLayoutMode] = useState<SlideLayoutMode>("perVerse");
  const [primaryLang, setPrimaryLang] = useState<"fa" | "en">("fa");

  // Inline editing in Step 4 — no modal needed
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineFa, setInlineFa] = useState("");
  const [inlineEn, setInlineEn] = useState("");

  const activeBook = useMemo(() => {
    return books.find((b) => b.book_id === activeBookId) || books[0] || null;
  }, [books, activeBookId]);

  // Load chapter verses when active book/chapter changes
  useEffect(() => {
    if (!activeBook || !selectedVersionEn || !selectedVersionFa) return;
    let cancelled = false;
    setLoadingVerses(true);
    fetch(
      `/api/bible/parallel?versionEn=${selectedVersionEn}&versionFa=${selectedVersionFa}&book=${activeBook.book_id}&chapter=${activeChapter}`
    )
      .then((res) => res.json())
      .then((data) => {
        // A newer chapter/book selection may have started (and finished)
        // while this request was in flight — don't overwrite it with stale data.
        if (cancelled) return;
        const list = (data.parallel || []).map((p: any) => ({
          verse_num: p.verse_num,
          en: p.en || "",
          fa: p.fa || "",
        }));
        setChapterVerses(list);
        if (list.length > 0) {
          const max = Math.max(...list.map((v: any) => v.verse_num));
          setRangeEnd((prev) => {
            const parsed = parseInt(toAsciiDigits(prev), 10);
            return parsed > max ? String(max) : prev;
          });
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoadingVerses(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeBook, activeChapter, selectedVersionEn, selectedVersionFa]);

  // Filtered books for Step 1
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      if (bookFilterTab === "NT" && b.testament !== "NT") return false;
      if (bookFilterTab === "OT" && b.testament !== "OT") return false;
      if (bookFilterTab === "gospels") {
        const gospels = ["MAT", "MRK", "LUK", "JHN"];
        if (!gospels.includes(b.book_id)) return false;
      }
      if (bookSearchQuery.trim()) {
        const q = normalizeFarsi(bookSearchQuery);
        const matchFa = normalizeFarsi(b.book_name_fa).includes(q);
        const matchEn = b.book_name_en.toLowerCase().includes(bookSearchQuery.toLowerCase());
        if (!matchFa && !matchEn) return false;
      }
      return true;
    });
  }, [books, bookFilterTab, bookSearchQuery]);

  // Handle selecting / toggling a verse in step 2
  const toggleVerseInActiveSection = (verseNum: number) => {
    if (!activeBook) return;
    const vData = chapterVerses.find((v) => v.verse_num === verseNum);
    if (!vData) return;

    const verseId = `${activeBook.book_id}-${activeChapter}-${verseNum}`;

    setSections((prev) => {
      let targetSectionId = editingSectionId;
      let targetSection = prev.find((s) => s.id === targetSectionId);

      // If no section exists or active doesn't match current book/chapter, create one
      if (!targetSection || targetSection.book.book_id !== activeBook.book_id || targetSection.chapter !== activeChapter) {
        const newSec: SectionBlock = {
          id: `sec-${Date.now()}`,
          book: activeBook,
          chapter: activeChapter,
          verses: [],
        };
        targetSectionId = newSec.id;
        setEditingSectionId(newSec.id);
        prev = [...prev, newSec];
        targetSection = newSec;
      }

      return prev.map((sec) => {
        if (sec.id !== targetSectionId) return sec;
        const exists = sec.verses.some((v) => v.id === verseId);
        let updatedVerses: VerseItem[];
        if (exists) {
          updatedVerses = sec.verses.filter((v) => v.id !== verseId);
        } else {
          updatedVerses = [
            ...sec.verses,
            {
              id: verseId,
              book_id: activeBook.book_id,
              book_name_en: activeBook.book_name_en,
              book_name_fa: activeBook.book_name_fa,
              book_order: activeBook.book_order,
              chapter: activeChapter,
              verse_num: verseNum,
              en: vData.en,
              fa: vData.fa,
            },
          ].sort((a, b) => a.verse_num - b.verse_num);
        }
        return { ...sec, verses: updatedVerses };
      });
    });
  };

  // Add range of verses
  const applyRangeSelection = () => {
    if (!activeBook || chapterVerses.length === 0) return;
    const start = Math.max(1, parseInt(toAsciiDigits(rangeStart), 10) || 1);
    const end = Math.max(start, parseInt(toAsciiDigits(rangeEnd), 10) || start);

    const rangeNums: number[] = [];
    for (let i = start; i <= end; i++) {
      if (chapterVerses.some((v) => v.verse_num === i)) {
        rangeNums.push(i);
      }
    }

    if (rangeNums.length === 0) {
      toast.error(isRTL ? "هیچ آیه‌ای در این بازه یافت نشد." : "No verses found in this range.");
      return;
    }

    const items: VerseItem[] = rangeNums.map((num) => {
      const vData = chapterVerses.find((v) => v.verse_num === num)!;
      return {
        id: `${activeBook.book_id}-${activeChapter}-${num}`,
        book_id: activeBook.book_id,
        book_name_en: activeBook.book_name_en,
        book_name_fa: activeBook.book_name_fa,
        book_order: activeBook.book_order,
        chapter: activeChapter,
        verse_num: num,
        en: vData.en,
        fa: vData.fa,
      };
    });

    setSections((prev) => {
      let targetSectionId = editingSectionId;
      let targetSection = prev.find((s) => s.id === targetSectionId);

      if (!targetSection || targetSection.book.book_id !== activeBook.book_id || targetSection.chapter !== activeChapter) {
        const newSec: SectionBlock = {
          id: `sec-${Date.now()}`,
          book: activeBook,
          chapter: activeChapter,
          verses: items,
        };
        setEditingSectionId(newSec.id);
        return [...prev, newSec];
      }

      return prev.map((sec) => {
        if (sec.id !== targetSectionId) return sec;
        const byId = new Map(sec.verses.map((v) => [v.id, v]));
        items.forEach((item) => byId.set(item.id, item));
        return {
          ...sec,
          verses: Array.from(byId.values()).sort((a, b) => a.verse_num - b.verse_num),
        };
      });
    });

    toast.success(
      isRTL
        ? `✓ آیات ${start} تا ${end} (${rangeNums.length} آیه) به لیست افزوده شدند.`
        : `✓ Added verses ${start} to ${end} (${rangeNums.length} verses).`
    );
  };

  // Add entire chapter
  const selectAllChapter = () => {
    if (!activeBook || chapterVerses.length === 0) return;
    const items: VerseItem[] = chapterVerses.map((v) => ({
      id: `${activeBook.book_id}-${activeChapter}-${v.verse_num}`,
      book_id: activeBook.book_id,
      book_name_en: activeBook.book_name_en,
      book_name_fa: activeBook.book_name_fa,
      book_order: activeBook.book_order,
      chapter: activeChapter,
      verse_num: v.verse_num,
      en: v.en,
      fa: v.fa,
    }));

    setSections((prev) => {
      const existing = prev.filter((s) => !(s.book.book_id === activeBook.book_id && s.chapter === activeChapter));
      const newSec: SectionBlock = {
        id: `sec-${Date.now()}`,
        book: activeBook,
        chapter: activeChapter,
        verses: items,
      };
      setEditingSectionId(newSec.id);
      return [...existing, newSec];
    });

    toast.success(isRTL ? `✓ کل آیات باب ${activeChapter} انتخاب شدند.` : `✓ Selected all verses of chapter ${activeChapter}.`);
  };

  // Total verses count across all sections
  const totalSelectedVersesCount = useMemo(() => {
    return sections.reduce((acc, sec) => acc + sec.verses.length, 0);
  }, [sections]);

  // Remove a verse from a section
  const removeVerse = (sectionId: string, verseId: string) => {
    setSections((prev) =>
      prev
        .map((sec) => {
          if (sec.id !== sectionId) return sec;
          return {
            ...sec,
            verses: sec.verses.filter((v) => v.id !== verseId),
          };
        })
        .filter((sec) => sec.verses.length > 0)
    );
  };

  // Move a verse up or down inside a section or globally
  const moveVerse = (sectionId: string, index: number, direction: "up" | "down") => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec;
        const newIdx = direction === "up" ? index - 1 : index + 1;
        if (newIdx < 0 || newIdx >= sec.verses.length) return sec;
        const updated = [...sec.verses];
        const [moved] = updated.splice(index, 1);
        updated.splice(newIdx, 0, moved);
        return { ...sec, verses: updated };
      })
    );
  };

  // Move entire section up or down
  const moveSection = (secIndex: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? secIndex - 1 : secIndex + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;
    setSections((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(secIndex, 1);
      updated.splice(newIdx, 0, moved);
      return updated;
    });
  };

  // ── Inline edit helpers (Step 4) ──

  const startInlineEdit = (v: VerseItem) => {
    setInlineEditId(v.id);
    setInlineFa(v.fa);
    setInlineEn(v.en);
  };
  const cancelInlineEdit = () => setInlineEditId(null);
  const saveInlineEdit = () => {
    if (!inlineEditId) return;
    setSections((prev) =>
      prev.map((sec) => ({
        ...sec,
        verses: sec.verses.map((v) =>
          v.id === inlineEditId ? { ...v, fa: inlineFa || v.fa, en: inlineEn || v.en } : v
        ),
      }))
    );
    setInlineEditId(null);
    toast.success(isRTL ? "✓ متن آیه ویرایش شد." : "✓ Verse updated.");
  };

  // Build the final ScripturePage[] slides
  const buildFinalSlides = (): ScripturePage[] => {
    if (sections.length === 0) return [];

    // Helper to generate reference item from verse list
    const makeReferenceItem = (sec: SectionBlock, versesSubset: VerseItem[]): ScriptureReferenceItem => {
      const numbers = versesSubset.map((v) => v.verse_num);
      const min = numbers[0];
      const max = numbers[numbers.length - 1];
      const versesLabel = min === max ? `${min}` : `${min}-${max}`;
      return {
        id: crypto.randomUUID(),
        book: sec.book.book_id,
        bookName: { fa: sec.book.book_name_fa, en: sec.book.book_name_en },
        chapter: sec.chapter,
        verses: versesLabel,
        verseNumbers: numbers,
        textFa: versesSubset.map((v) => v.fa),
        textEn: versesSubset.map((v) => v.en),
        fontFa,
        fontEn,
        translation: selectedVersionFa,
        enTranslation: selectedVersionEn,
      };
    };

    // Mode 1: Everything in a single slide
    if (layoutMode === "single") {
      const referenceItems: ScriptureReferenceItem[] = sections.map((sec) => makeReferenceItem(sec, sec.verses));
      const firstSec = sections[0];
      const isSingleSection = sections.length === 1;

      return [
        {
          id: crypto.randomUUID(),
          book: isSingleSection ? firstSec.book.book_id : "MULTI",
          bookName: isSingleSection
            ? { fa: firstSec.book.book_name_fa, en: firstSec.book.book_name_en }
            : { fa: "مجموعه آیات انتخابی", en: "Selected Scripture Readings" },
          chapter: isSingleSection ? firstSec.chapter : 0,
          verses: isSingleSection
            ? `${firstSec.verses[0]?.verse_num || 1}-${firstSec.verses[firstSec.verses.length - 1]?.verse_num || 1}`
            : `${sections.length} بخش`,
          verseNumbers: isSingleSection ? firstSec.verses.map((v) => v.verse_num) : [],
          textPrimary: isSingleSection
            ? primaryLang === "fa"
              ? firstSec.verses.map((v) => v.fa)
              : firstSec.verses.map((v) => v.en)
            : [],
          textSecondary: isSingleSection
            ? primaryLang === "fa"
              ? firstSec.verses.map((v) => v.en)
              : firstSec.verses.map((v) => v.fa)
            : [],
          translation: selectedVersionFa,
          enTranslation: selectedVersionEn,
          displayMode: isSingleSection ? "list" : "referenceList",
          fontFa,
          fontEn,
          primaryLanguage: primaryLang,
          glassPopupEnabled: true,
          referenceItems,
          popupLabelFa: isSingleSection
            ? `${firstSec.book.book_name_fa} ${firstSec.chapter}:${firstSec.verses[0]?.verse_num || 1}`
            : `${sections.length} بخش انتخابی`,
          popupLabelEn: isSingleSection
            ? `${firstSec.book.book_name_en} ${firstSec.chapter}`
            : `${sections.length} Selected Sections`,
        },
      ];
    }

    // Mode 2: Per verse (each verse is its own slide)
    if (layoutMode === "perVerse") {
      const slides: ScripturePage[] = [];

      sections.forEach((sec) => {
        sec.verses.forEach((v) => {
          const refItem: ScriptureReferenceItem = {
            id: crypto.randomUUID(),
            book: sec.book.book_id,
            bookName: { fa: sec.book.book_name_fa, en: sec.book.book_name_en },
            chapter: sec.chapter,
            verses: `${v.verse_num}`,
            verseNumbers: [v.verse_num],
            textFa: [v.fa],
            textEn: [v.en],
            fontFa,
            fontEn,
            translation: selectedVersionFa,
            enTranslation: selectedVersionEn,
          };

          slides.push({
            id: crypto.randomUUID(),
            book: sec.book.book_id,
            bookName: { fa: sec.book.book_name_fa, en: sec.book.book_name_en },
            chapter: sec.chapter,
            verses: `${v.verse_num}`,
            verseNumbers: [v.verse_num],
            textPrimary: primaryLang === "fa" ? [v.fa] : [v.en],
            textSecondary: primaryLang === "fa" ? [v.en] : [v.fa],
            translation: selectedVersionFa,
            enTranslation: selectedVersionEn,
            displayMode: "list",
            fontFa,
            fontEn,
            primaryLanguage: primaryLang,
            glassPopupEnabled: false,
            referenceItems: [refItem],
            popupLabelFa: `${sec.book.book_name_fa} \u2066${sec.chapter}:${v.verse_num}\u2069`,
            popupLabelEn: `${sec.book.book_name_en} ${sec.chapter}:${v.verse_num}`,
          });
        });
      });
      return slides;
    }

    // Mode 3: Chunks of 2 or 3 verses per slide
    const chunkSize = layoutMode === "chunk2" ? 2 : 3;
    const slides: ScripturePage[] = [];

    sections.forEach((sec) => {
      for (let i = 0; i < sec.verses.length; i += chunkSize) {
        const chunk = sec.verses.slice(i, i + chunkSize);
        const refItem = makeReferenceItem(sec, chunk);

        slides.push({
          id: crypto.randomUUID(),
          book: sec.book.book_id,
          bookName: { fa: sec.book.book_name_fa, en: sec.book.book_name_en },
          chapter: sec.chapter,
          verses: refItem.verses,
          verseNumbers: refItem.verseNumbers,
          textPrimary: primaryLang === "fa" ? chunk.map((v) => v.fa) : chunk.map((v) => v.en),
          textSecondary: primaryLang === "fa" ? chunk.map((v) => v.en) : chunk.map((v) => v.fa),
          translation: selectedVersionFa,
          enTranslation: selectedVersionEn,
          displayMode: "list",
          fontFa,
          fontEn,
          primaryLanguage: primaryLang,
          glassPopupEnabled: false,
          referenceItems: [refItem],
          popupLabelFa: `${sec.book.book_name_fa} \u2066${sec.chapter}:${refItem.verses}\u2069`,
          popupLabelEn: `${sec.book.book_name_en} ${sec.chapter}:${refItem.verses}`,
        });
      }
    });

    return slides;
  };

  const handleFinish = () => {
    const slides = buildFinalSlides();
    if (slides.length === 0) {
      toast.error(isRTL ? "هیچ اسلایدی برای افزودن ساخته نشد." : "No slides created.");
      return;
    }
    onAddSlides(slides);
    onClose();
    toast.success(
      isRTL
        ? `✓ تعداد ${slides.length} اسلاید با موفقیت به پرزنتیشن افزوده شد.`
        : `✓ Added ${slides.length} slides to presentation.`
    );
  };

  // Preview count of generated slides
  const previewSlidesCount = useMemo(() => {
    return buildFinalSlides().length;
  }, [sections, layoutMode, primaryLang]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#09090b] text-white font-[Vazirmatn]" dir={isRTL ? "rtl" : "ltr"}>
      {/* ── HEADER & STEPPER ── */}
      <header className="shrink-0 bg-[#121215] border-b border-white/10 px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2">
              <span>{isRTL ? "دستیار گام‌به‌گام انتخاب آیه کتاب مقدس" : "Step-by-Step Bible Slide Wizard"}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PRO
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              {isRTL
                ? "انتخاب هدایت‌شده، ساختاردهی هوشمند اسلایدها و ترکیب چند بخشی"
                : "Guided selection, smart layouts & multi-section scripture"}
            </p>
          </div>
        </div>

        {/* Wizard Stepper Tabs */}
        <div className="flex items-center bg-black/60 border border-white/10 rounded-2xl p-1 gap-1 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              currentStep === 1
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px]">۱</span>
            <span>{isRTL ? "انتخاب کتاب و فصل" : "Book & Chapter"}</span>
          </button>

          <ChevronLeft className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              currentStep === 2
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px]">۲</span>
            <span>{isRTL ? "انتخاب آیات" : "Select Verses"}</span>
            {totalSelectedVersesCount > 0 && (
              <span className="bg-black/30 px-1.5 py-0.2 rounded-full text-[10px]">{totalSelectedVersesCount}</span>
            )}
          </button>

          <ChevronLeft className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            disabled={totalSelectedVersesCount === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed ${
              currentStep === 3
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px]">۳</span>
            <span>{isRTL ? "چیدمان و ساختار اسلاید" : "Slide Layout"}</span>
          </button>

          <ChevronLeft className="w-3.5 h-3.5 text-zinc-600 shrink-0" />

          <button
            type="button"
            onClick={() => setCurrentStep(4)}
            disabled={totalSelectedVersesCount === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed ${
              currentStep === 4
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px]">۴</span>
            <span>{isRTL ? "پیش‌نمایش و تایید نهایی" : "Review & Insert"}</span>
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {onSwitchToFreeReader && (
            <button
              type="button"
              onClick={onSwitchToFreeReader}
              className="px-3 py-1.5 text-xs rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 transition flex items-center gap-1.5"
              title={isRTL ? "تغییر به نمای مطالعه آزاد متن کامل" : "Switch to free reading view"}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">{isRTL ? "نمای آزاد کتاب" : "Free View"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full">
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── STEP 1: انتخاب کتاب و فصل ── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Guide Banner */}
            <div className="bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border border-blue-500/30 rounded-3xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-300 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-black text-blue-200">
                  {isRTL ? "مرحله ۱ از ۴: کتاب و فصل مورد نظر خود را انتخاب کنید" : "Step 1: Choose Book and Chapter"}
                </h3>
                <p className="text-xs text-blue-300/80 mt-1 leading-relaxed">
                  {isRTL
                    ? "می‌توانید با فیلترهای زیر (عهد جدید، عهد عتیق، اناجیل) یا جستجوی نام، کتاب دلخواه را بیابید و سپس شماره فصل را مشخص کنید."
                    : "Select Testament or search to find your desired Bible book, then choose the chapter number."}
                </p>
              </div>
            </div>

            {/* Translation Selectors */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 px-4">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                <span>{isRTL ? "ترجمه فارسی:" : "Persian:"}</span>
                <select
                  value={selectedVersionFa}
                  onChange={(e) => setSelectedVersionFa(e.target.value)}
                  className="bg-black/60 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-bold outline-none cursor-pointer"
                >
                  {versions
                    .filter((v) => v.language === "fa")
                    .map((v) => (
                      <option key={v.abbr} value={v.abbr} className="bg-zinc-900 text-white">
                        {v.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-zinc-300" dir="ltr">
                <span>English:</span>
                <select
                  value={selectedVersionEn}
                  onChange={(e) => setSelectedVersionEn(e.target.value)}
                  className="bg-black/60 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-blue-300 font-bold outline-none cursor-pointer"
                >
                  {versions
                    .filter((v) => v.language !== "fa")
                    .map((v) => (
                      <option key={v.abbr} value={v.abbr} className="bg-zinc-900 text-white">
                        {v.name} ({v.abbr})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Book Filter and Search */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-2xl p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setBookFilterTab("all")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    bookFilterTab === "all" ? "bg-white/20 text-white shadow" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {isRTL ? "همه کتب (۶۶)" : "All"}
                </button>
                <button
                  type="button"
                  onClick={() => setBookFilterTab("NT")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    bookFilterTab === "NT" ? "bg-indigo-600 text-white shadow" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {isRTL ? "عهد جدید (۲۷)" : "New Testament"}
                </button>
                <button
                  type="button"
                  onClick={() => setBookFilterTab("OT")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    bookFilterTab === "OT" ? "bg-amber-600 text-white shadow" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {isRTL ? "عهد قدیم (۳۹)" : "Old Testament"}
                </button>
                <button
                  type="button"
                  onClick={() => setBookFilterTab("gospels")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    bookFilterTab === "gospels" ? "bg-emerald-600 text-white shadow" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {isRTL ? "اناجیل اربعه (۴)" : "Gospels"}
                </button>
              </div>

              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={bookSearchQuery}
                  onChange={(e) => setBookSearchQuery(e.target.value)}
                  placeholder={isRTL ? "جستجوی نام کتاب (مثال: یوحنا، مزمور، پیدایش)..." : "Search book name..."}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pr-9 pl-4 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-400 focus:bg-white/10 transition"
                />
                {bookSearchQuery && (
                  <button
                    onClick={() => setBookSearchQuery("")}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[36vh] overflow-y-auto pr-1">
              {filteredBooks.map((b) => {
                const isSelected = b.book_id === activeBookId;
                return (
                  <button
                    key={b.book_id}
                    type="button"
                    onClick={() => {
                      setActiveBookId(b.book_id);
                      setActiveChapter(1);
                    }}
                    className={`p-3 rounded-2xl text-right transition border flex flex-col justify-between ${
                      isSelected
                        ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)] scale-[1.02]"
                        : "bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-sm">{b.book_name_fa}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          b.testament === "NT" ? "bg-indigo-500/20 text-indigo-300" : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {b.chapter_count}ف
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500 truncate" dir="ltr">
                      {b.book_name_en}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Chapter Selection Grid */}
            {activeBook && (
              <div className="bg-black/50 border border-white/10 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-black text-sm">
                      {isRTL ? "انتخاب فصل از" : "Select Chapter in"} {activeBook.book_name_fa}:
                    </span>
                    <span className="text-xs text-zinc-400">
                      ({activeBook.chapter_count} {activeBook.book_id === "PSA" ? "مزمور" : "فصل"})
                    </span>
                  </div>
                  <span className="text-xs font-bold text-zinc-500">
                    فصل انتخاب‌شده: <strong className="text-white text-sm">{activeChapter}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-2 max-h-[26vh] overflow-y-auto pr-1">
                  {Array.from({ length: activeBook.chapter_count }, (_, i) => i + 1).map((chNum) => (
                    <button
                      key={chNum}
                      type="button"
                      onClick={() => setActiveChapter(chNum)}
                      className={`h-11 rounded-xl text-sm font-black transition-all flex items-center justify-center border ${
                        chNum === activeChapter
                          ? "bg-amber-500 text-black border-amber-300 scale-105 shadow-lg shadow-amber-500/30"
                          : "bg-white/5 border-white/5 text-zinc-300 hover:bg-white/15 hover:text-white"
                      }`}
                    >
                      {chNum}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1 Footer Action */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-xs text-zinc-400">
                کتاب فعال: <strong className="text-white">{activeBook?.book_name_fa}</strong> — باب{" "}
                <strong className="text-white">{activeChapter}</strong>
              </span>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95 transition flex items-center gap-2 cursor-pointer"
              >
                <span>{isRTL ? "تایید و رفتن به انتخاب آیات" : "Proceed to Select Verses"}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── STEP 2: انتخاب آیات ── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {currentStep === 2 && activeBook && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Guide Banner */}
            <div className="bg-gradient-to-r from-amber-900/30 via-zinc-900 to-amber-900/20 border border-amber-500/30 rounded-3xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
                <ListOrdered className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm md:text-base font-black text-amber-200">
                    {isRTL ? "مرحله ۲ از ۴: انتخاب آیات" : "Step 2: Choose Verses"} — {activeBook.book_name_fa} باب{" "}
                    {activeChapter}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>(تغییر کتاب یا فصل)</span>
                  </button>
                </div>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {isRTL
                    ? "می‌توانید بازه آیات (از آیه تا آیه) را وارد کرده و دکمه «افزودن بازه» را بزنید، یا مستقیماً روی هر آیه در لیست زیر کلیک کنید."
                    : "Enter a range or click individual verses below to toggle them."}
                </p>
              </div>
            </div>

            {/* Quick Tools Box */}
            <div className="bg-black/60 border border-white/10 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4">
              {/* Range Selector */}
              <div className="flex items-center gap-2 bg-white/5 border border-amber-400/40 rounded-2xl px-3 py-2">
                <span className="text-xs text-amber-300 font-bold select-none">{isRTL ? "بازه آیات:" : "Range:"}</span>
                <span className="text-xs text-zinc-400 font-[Vazirmatn]">از آیه</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(toAsciiDigits(e.target.value).replace(/\D/g, ""))}
                  className="w-12 bg-white/10 border border-white/20 rounded-lg px-1.5 py-1 text-center text-xs font-bold text-white outline-none focus:border-amber-400"
                  placeholder="1"
                />
                <span className="text-xs text-zinc-400 font-[Vazirmatn]">تا آیه</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(toAsciiDigits(e.target.value).replace(/\D/g, ""))}
                  className="w-12 bg-white/10 border border-white/20 rounded-lg px-1.5 py-1 text-center text-xs font-bold text-white outline-none focus:border-amber-400"
                  placeholder={String(chapterVerses.length || 10)}
                />
                <button
                  type="button"
                  onClick={applyRangeSelection}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow transition active:scale-95 cursor-pointer"
                >
                  {isRTL ? "✓ افزودن این بازه" : "Add Range"}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllChapter}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 transition cursor-pointer"
                >
                  {isRTL ? "انتخاب کل آیات این باب" : "Select Entire Chapter"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSections((prev) =>
                      prev.filter((s) => !(s.book.book_id === activeBook.book_id && s.chapter === activeChapter))
                    );
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 transition cursor-pointer"
                >
                  {isRTL ? "پاک کردن این باب" : "Clear This Chapter"}
                </button>
              </div>
            </div>

            {/* Verses List */}
            {loadingVerses ? (
              <div className="py-20 text-center text-amber-400 font-bold flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span>{isRTL ? "در حال بارگذاری آیات..." : "Loading verses..."}</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                {chapterVerses.map((verse) => {
                  const verseId = `${activeBook.book_id}-${activeChapter}-${verse.verse_num}`;
                  const isSelected = sections.some((s) => s.verses.some((v) => v.id === verseId));

                  return (
                    <div
                      key={verse.verse_num}
                      onClick={() => toggleVerseInActiveSection(verse.verse_num)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                        isSelected
                          ? "bg-amber-500/15 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                          : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15 text-zinc-300"
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 mt-0.5 ${
                          isSelected ? "bg-amber-400 text-black shadow" : "bg-white/10 text-zinc-400"
                        }`}
                      >
                        {verse.verse_num}
                      </span>

                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm text-zinc-100 font-[Vazirmatn] leading-relaxed">
                          {verse.fa || <span className="text-zinc-600 italic">— ترجمه فارسی موجود نیست —</span>}
                        </p>
                        <p className="text-xs text-zinc-400 font-sans leading-snug" dir="ltr">
                          {verse.en || <span className="text-zinc-600 italic">— No English translation —</span>}
                        </p>
                      </div>

                      <div className="shrink-0 pt-1">
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-black shadow">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-white/20 hover:border-white/40" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 2 Footer / Smart Action Panel */}
            <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900 to-amber-500/10 border border-amber-500/30 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-amber-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>
                      {totalSelectedVersesCount > 0 ? (
                        <>
                          {totalSelectedVersesCount} {isRTL ? "آیه انتخاب شد" : "verses selected"} (
                          {activeBook.book_name_fa} باب {activeChapter})
                        </>
                      ) : (
                        <>{isRTL ? "هنوز آیه‌ای انتخاب نشده است" : "No verses selected yet"}</>
                      )}
                    </span>
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {totalSelectedVersesCount > 0
                      ? isRTL
                        ? "آیا می‌خواهید آیه/بخش دیگری از کتاب یا فصل دیگر به این مجموعه بیفزایید، یا برای انتخاب چیدمان به مرحله بعد بروید؟"
                        : "Would you like to add verses from another book/chapter or proceed to slide layout?"
                      : isRTL
                      ? "روی آیات مورد نظر در بالا کلیک کنید یا از جعبه «بازه آیات» استفاده نمایید."
                      : "Click verses above or enter a range to select."}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  >
                    {isRTL ? "⬅️ تغییر کتاب یا فصل" : "Back to Book/Chapter"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingSectionId(null);
                      setCurrentStep(1);
                      toast.info(isRTL ? "کتاب یا فصل دوم را برای اضافه کردن انتخاب کنید." : "Select second book/chapter.");
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-amber-300 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isRTL ? "➕ افزودن بخش دیگر (کتاب/باب متفاوت)" : "Add Another Section"}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  disabled={totalSelectedVersesCount === 0}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95 transition flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>{isRTL ? "ادامه به مرحله ۳: انتخاب چیدمان و ساختار اسلایدها" : "Proceed to Slide Layout"}</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── STEP 3: چیدمان و ساختار اسلاید ── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Guide Banner */}
            <div className="bg-gradient-to-r from-purple-900/30 via-zinc-900 to-purple-900/20 border border-purple-500/30 rounded-3xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0">
                <Layout className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm md:text-base font-black text-purple-200">
                  {isRTL ? "مرحله ۳ از ۴: نحوه نمایش و ساختار اسلایدها" : "Step 3: Slide Structure & Layout"}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {isRTL
                    ? "مشخص کنید این آیات چگونه در پرزنتیشن نمایش یابند. همچنین می‌توانید در این مرحله آیات دیگری از کتاب‌های دیگر اضافه کنید."
                    : "Choose how verses are grouped into presentation slides or add cross-reference verses."}
                </p>
              </div>
            </div>

            {/* ── QUESTION 1: SLIDE LAYOUT CHOICES ── */}
            <div className="space-y-3">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-xs flex items-center justify-center font-bold">
                  ۱
                </span>
                <span>{isRTL ? "این آیات چگونه در اسلایدها چیده شوند؟" : "How should verses be arranged on slides?"}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {/* Option 1: Per Verse */}
                <div
                  onClick={() => setLayoutMode("perVerse")}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                    layoutMode === "perVerse"
                      ? "bg-amber-500/15 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                      : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                        <Layers className="w-5 h-5" />
                      </div>
                      {layoutMode === "perVerse" && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
                    </div>
                    <h5 className="font-black text-sm text-white mb-1">
                      {isRTL ? "هر آیه در یک اسلاید جداگانه" : "One Verse Per Slide"}
                    </h5>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {isRTL
                        ? "ایده‌آل برای خطبه‌ها و موعظه‌ها جهت تمرکز روی هر آیه. فونت درشت و خوانا از دور."
                        : "Ideal for sermons focusing on each verse individually. Large, clear typography."}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">{isRTL ? "تعداد اسلاید نهایی:" : "Output slides:"}</span>
                    <span className="font-black text-amber-400">{totalSelectedVersesCount} اسلاید</span>
                  </div>
                </div>

                {/* Option 2: Single Slide (Combined) */}
                <div
                  onClick={() => setLayoutMode("single")}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                    layoutMode === "single"
                      ? "bg-amber-500/15 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                      : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      {layoutMode === "single" && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
                    </div>
                    <h5 className="font-black text-sm text-white mb-1">
                      {isRTL ? "همه آیات در یک اسلاید پیوسته" : "All Verses in One Slide"}
                    </h5>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {isRTL
                        ? "همه آیات انتخابی پشت سر هم درون یک اسلاید قرار می‌گیرند. عالی برای قرائت عمومی مزمور یا قطعه کوتاه."
                        : "Combines all selected verses continuously on a single slide. Great for short passages."}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">{isRTL ? "تعداد اسلاید نهایی:" : "Output slides:"}</span>
                    <span className="font-black text-blue-400">۱ اسلاید</span>
                  </div>
                </div>

                {/* Option 3: Chunks of 2 or 3 */}
                <div
                  onClick={() => setLayoutMode("chunk2")}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                    layoutMode === "chunk2"
                      ? "bg-amber-500/15 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                      : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                        <Columns2 className="w-5 h-5" />
                      </div>
                      {layoutMode === "chunk2" && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
                    </div>
                    <h5 className="font-black text-sm text-white mb-1">
                      {isRTL ? "دسته‌بندی ۲ آیه در هر اسلاید" : "2 Verses Per Slide"}
                    </h5>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {isRTL
                        ? "متعادل‌ترین حالت برای متون طولانی تا فونت نه خیلی ریز شود و نه تعداد اسلایدها خیلی زیاد گردد."
                        : "Balanced view for longer scripture, avoiding tiny fonts or too many slide switches."}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">{isRTL ? "تعداد اسلاید نهایی:" : "Output slides:"}</span>
                    <span className="font-black text-emerald-400">
                      {Math.ceil(totalSelectedVersesCount / 2)} اسلاید
                    </span>
                  </div>
                </div>

                {/* Option 4: Chunks of 3 */}
                <div
                  onClick={() => setLayoutMode("chunk3")}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                    layoutMode === "chunk3"
                      ? "bg-amber-500/15 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                      : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                        <Layers className="w-5 h-5" />
                      </div>
                      {layoutMode === "chunk3" && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
                    </div>
                    <h5 className="font-black text-sm text-white mb-1">
                      {isRTL ? "دسته‌بندی ۳ آیه در هر اسلاید" : "3 Verses Per Slide"}
                    </h5>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {isRTL
                        ? "برای متون طولانی مثل مزامیر — سه آیه در هر اسلاید، تعداد اسلایدها کمتر."
                        : "For longer passages like Psalms — 3 verses per slide, fewer total slides."}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">{isRTL ? "تعداد اسلاید نهایی:" : "Output slides:"}</span>
                    <span className="font-black text-purple-400">
                      {Math.ceil(totalSelectedVersesCount / 3)} اسلاید
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── QUESTION 2: ADDING ANOTHER SECTION / CROSS-BOOK ── */}
            <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900 to-indigo-500/10 border-2 border-dashed border-amber-400/40 rounded-3xl p-6 space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="space-y-1">
                  <h4 className="text-base font-black text-amber-300 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    <span>
                      {isRTL
                        ? "آیا می‌خواهید آیه دیگری از کتاب یا فصل دیگری به این مجموعه اضافه کنید؟"
                        : "Would you like to add another scripture section from a different book/chapter?"}
                    </span>
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                    {isRTL
                      ? "برای مقایسه نبوت عهد عتیق و تحقق آن در عهد جدید (یا مقایسه دو موضوع موعظه)، می‌توانید بخش دیگری را اضافه کنید بدون آنکه آیات قبلی پاک شوند."
                      : "Add a cross-reference or secondary scripture section to compare passages together."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    // Set up new section and switch back to step 1
                    setEditingSectionId(null);
                    setCurrentStep(1);
                    toast.info(isRTL ? "لطفاً کتاب و فصل دوم را انتخاب کنید." : "Select second book and chapter.");
                  }}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs md:text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>{isRTL ? "➕ افزودن بخش دیگر از کتاب مقدس" : "Add Another Section"}</span>
                </button>
              </div>

              {/* Current sections summary */}
              <div className="bg-black/40 border border-white/5 rounded-2xl p-3">
                <span className="text-xs font-bold text-zinc-400 block mb-2">
                  {isRTL ? "بخش‌های ثبت‌شده تا این لحظه:" : "Current Selected Sections:"}
                </span>
                <div className="flex flex-wrap gap-2">
                  {sections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs"
                    >
                      <span className="w-4 h-4 rounded-full bg-amber-400 text-black text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-white">
                        {sec.book.book_name_fa} باب {sec.chapter}:
                      </span>
                      <span className="text-amber-300">
                        {sec.verses.map((v) => v.verse_num).join("، ")} ({sec.verses.length} آیه)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSections((prev) => prev.filter((s) => s.id !== sec.id));
                        }}
                        className="text-zinc-500 hover:text-rose-400 transition"
                        title={isRTL ? "حذف این بخش" : "Remove section"}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Language Preference */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-4">
              <span className="text-xs font-bold text-zinc-300">
                {isRTL ? "زبان متن اصلی در پرزنتیشن:" : "Primary Presentation Language:"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrimaryLang("fa")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    primaryLang === "fa" ? "bg-amber-500 text-black" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  فارسی (متن بزرگ)
                </button>
                <button
                  type="button"
                  onClick={() => setPrimaryLang("en")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    primaryLang === "en" ? "bg-blue-500 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  English (Primary)
                </button>
              </div>
            </div>

            {/* Step 3 Footer Action */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
              >
                {isRTL ? "⬅️ بازگشت به انتخاب آیات" : "Back to Verses"}
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95 transition flex items-center gap-2 cursor-pointer"
              >
                <span>{isRTL ? "رفتن به پیش‌نمایش و تایید نهایی" : "Proceed to Review"}</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ── STEP 4: پیش‌نمایش، ویرایش، حذف و جابجایی ردیف‌ها ── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Guide Banner */}
            <div className="bg-gradient-to-r from-emerald-900/30 via-zinc-900 to-emerald-900/20 border border-emerald-500/30 rounded-3xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm md:text-base font-black text-emerald-200">
                    {isRTL ? "مرحله ۴ از ۴: پیش‌نمایش نهایی و مدیریت ردیف‌ها" : "Step 4: Final Review & Reorder"}
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black">
                    {previewSlidesCount} اسلاید آماده درج
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {isRTL
                    ? "در این مرحله می‌توانید ترتیب ردیف‌ها را با دکمه‌های بالا/پایین تغییر دهید، متن آیه را اصلاح کنید یا با زدن دکمه تایید، اسلایدها را به پرزنتیشن اضافه نمایید."
                    : "Reorder verses, edit text, delete unwanted items, and insert the final slides."}
                </p>
              </div>
            </div>

            {/* Verses Management List */}
            <div className="space-y-4">
              {sections.map((sec, secIdx) => (
                <div key={sec.id} className="bg-black/40 border border-white/10 rounded-3xl p-4 md:p-5 space-y-3">
                  {/* Section Header with Reorder */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-black text-xs font-black flex items-center justify-center">
                        {secIdx + 1}
                      </span>
                      <h4 className="font-black text-sm text-white">
                        {sec.book.book_name_fa} باب {sec.chapter}
                      </h4>
                      <span className="text-xs text-zinc-500" dir="ltr">
                        ({sec.book.book_name_en} {sec.chapter})
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveSection(secIdx, "up")}
                        disabled={secIdx === 0}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 disabled:opacity-20 transition cursor-pointer"
                        title={isRTL ? "انتقال بخش به بالا" : "Move section up"}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(secIdx, "down")}
                        disabled={secIdx === sections.length - 1}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 disabled:opacity-20 transition cursor-pointer"
                        title={isRTL ? "انتقال بخش به پایین" : "Move section down"}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Verses inside section — with inline edit support */}
                  <div className="space-y-2">
                    {sec.verses.map((v, vIdx) => (
                      <div
                        key={v.id}
                        className={`border rounded-2xl transition-all duration-200 ${
                          inlineEditId === v.id
                            ? "p-4 bg-zinc-800/80 border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                            : "p-3 bg-white/5 border-white/5 flex items-start gap-3 hover:border-white/15 group"
                        }`}
                      >
                        {inlineEditId === v.id ? (
                          /* ── Inline Edit Mode ── */
                          <div className="space-y-3 w-full animate-in fade-in duration-150">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-blue-400/20 text-blue-300 font-bold text-xs flex items-center justify-center">
                                {v.verse_num}
                              </span>
                              <span className="text-xs font-bold text-blue-300">
                                {isRTL ? "ویرایش آیه" : "Editing verse"} {v.verse_num}
                              </span>
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-zinc-400 block mb-1">متن فارسی:</label>
                              <textarea
                                value={inlineFa}
                                onChange={(e) => setInlineFa(e.target.value)}
                                rows={3}
                                className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-sm text-zinc-100 font-[Vazirmatn] outline-none focus:border-blue-400 resize-none"
                                dir="rtl"
                                autoFocus
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-zinc-400 block mb-1">English Text:</label>
                              <textarea
                                value={inlineEn}
                                onChange={(e) => setInlineEn(e.target.value)}
                                rows={2}
                                className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-zinc-200 font-sans outline-none focus:border-blue-400 resize-none"
                                dir="ltr"
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={saveInlineEdit}
                                className="px-4 py-1.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                {isRTL ? "ذخیره تغییرات" : "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={cancelInlineEdit}
                                className="px-4 py-1.5 text-zinc-400 hover:text-white text-xs font-bold transition cursor-pointer rounded-xl hover:bg-white/5"
                              >
                                {isRTL ? "انصراف" : "Cancel"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* ── Normal View Mode ── */
                          <>
                            <span className="w-6 h-6 rounded-lg bg-black/40 border border-white/10 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {v.verse_num}
                            </span>

                            <div className="flex-1 min-w-0 space-y-0.5">
                              <p className="text-sm text-zinc-100 font-[Vazirmatn] leading-relaxed line-clamp-2">
                                {v.fa}
                              </p>
                              <p className="text-xs text-zinc-400 font-sans leading-snug line-clamp-1" dir="ltr">
                                {v.en}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0 pt-0.5">
                              <button
                                type="button"
                                onClick={() => moveVerse(sec.id, vIdx, "up")}
                                disabled={vIdx === 0}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-20 transition cursor-pointer"
                                title={isRTL ? "انتقال به بالا" : "Move up"}
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveVerse(sec.id, vIdx, "down")}
                                disabled={vIdx === sec.verses.length - 1}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-20 transition cursor-pointer"
                                title={isRTL ? "انتقال به پایین" : "Move down"}
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => startInlineEdit(v)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition cursor-pointer"
                                title={isRTL ? "ویرایش متن آیه" : "Edit verse text"}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeVerse(sec.id, v.id)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                                title={isRTL ? "حذف آیه" : "Remove"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Step 4 Footer Action */}
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
              >
                {isRTL ? "⬅️ بازگشت به تنظیم چیدمان" : "Back to Layout"}
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-amber-500 to-emerald-500 hover:brightness-110 text-black font-black text-sm md:text-base shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-95 transition flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-5 h-5 fill-black" />
                <span>
                  {isRTL
                    ? `✓ درج نهایی در پرزنتیشن (${previewSlidesCount} اسلاید)`
                    : `✓ Insert into Presentation (${previewSlidesCount} Slides)`}
                </span>
              </button>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}
