"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { BookOpen, Zap, ChevronDown, Check, Sparkles, SlidersHorizontal, Loader2 } from "lucide-react";
import { ScripturePage } from "@/types/broadcast";
import { toast } from "sonner";

interface QuickScriptureBarProps {
  onAddSlides: (slides: ScripturePage[]) => void;
  onOpenFullSelector: () => void;
  isRTL?: boolean;
  className?: string;
}

interface BookOption {
  book_id: string;
  book_name_en: string;
  book_name_fa: string;
  chapter_count: number;
}

// Default initial popular books for instant zero-delay render
const POPULAR_BOOKS: BookOption[] = [
  { book_id: "GEN", book_name_en: "Genesis", book_name_fa: "پیدایش", chapter_count: 50 },
  { book_id: "EXO", book_name_en: "Exodus", book_name_fa: "خروج", chapter_count: 40 },
  { book_id: "PSA", book_name_en: "Psalms", book_name_fa: "مزامیر", chapter_count: 150 },
  { book_id: "PRO", book_name_en: "Proverbs", book_name_fa: "امثال", chapter_count: 31 },
  { book_id: "ISA", book_name_en: "Isaiah", book_name_fa: "اشعیا", chapter_count: 66 },
  { book_id: "MAT", book_name_en: "Matthew", book_name_fa: "متی", chapter_count: 28 },
  { book_id: "MRK", book_name_en: "Mark", book_name_fa: "مرقس", chapter_count: 16 },
  { book_id: "LUK", book_name_en: "Luke", book_name_fa: "لوقا", chapter_count: 24 },
  { book_id: "JHN", book_name_en: "John", book_name_fa: "یوحنا", chapter_count: 21 },
  { book_id: "ACT", book_name_en: "Acts", book_name_fa: "اعمال رسولان", chapter_count: 28 },
  { book_id: "ROM", book_name_en: "Romans", book_name_fa: "رومیان", chapter_count: 16 },
  { book_id: "1CO", book_name_en: "1 Corinthians", book_name_fa: "اول قرنتیان", chapter_count: 16 },
  { book_id: "HEB", book_name_en: "Hebrews", book_name_fa: "عبرانیان", chapter_count: 13 },
  { book_id: "REV", book_name_en: "Revelation", book_name_fa: "مکاشفه", chapter_count: 22 },
];

export default function QuickScriptureBar({
  onAddSlides,
  onOpenFullSelector,
  isRTL = true,
  className = "",
}: QuickScriptureBarProps) {
  const [books, setBooks] = useState<BookOption[]>(POPULAR_BOOKS);
  const [selectedBookId, setSelectedBookId] = useState<string>("GEN");
  const [chapter, setChapter] = useState<number>(1);
  const [fromVerse, setFromVerse] = useState<number>(1);
  const [toVerse, setToVerse] = useState<number>(1);
  const [slideMode, setSlideMode] = useState<"perVerse" | "single" | "perReference">("perVerse");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Book dropdown search state
  const [bookDropdownOpen, setBookDropdownOpen] = useState<boolean>(false);
  const [bookSearchQuery, setBookSearchQuery] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bookInputRef = useRef<HTMLInputElement>(null);

  // Fetch full 66 books from API
  useEffect(() => {
    fetch("/api/bible/books?version=BSB")
      .then((res) => res.json())
      .then((data) => {
        if (data?.books?.length) {
          setBooks(data.books);
        }
      })
      .catch(() => {
        // use default popular books fallback
      });
  }, []);

  // Handle clicking outside the book dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setBookDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentBook = useMemo(() => {
    return books.find((b) => b.book_id === selectedBookId) || books[0] || POPULAR_BOOKS[0];
  }, [books, selectedBookId]);

  // Filtered books for dropdown search
  const filteredBooks = useMemo(() => {
    if (!bookSearchQuery.trim()) return books;
    const q = bookSearchQuery.trim().toLowerCase();
    return books.filter(
      (b) =>
        b.book_name_fa.toLowerCase().includes(q) ||
        b.book_name_en.toLowerCase().includes(q) ||
        b.book_id.toLowerCase().includes(q)
    );
  }, [books, bookSearchQuery]);

  // When book changes, clamp chapter
  const handleSelectBook = (book: BookOption) => {
    setSelectedBookId(book.book_id);
    if (chapter > book.chapter_count) setChapter(1);
    setBookDropdownOpen(false);
    setBookSearchQuery("");
  };

  // Quick Insert Handler
  const handleQuickInsert = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const startV = Math.max(1, Math.min(fromVerse, toVerse));
      const endV = Math.max(fromVerse, toVerse);

      // Fetch parallel bilingual text
      const res = await fetch(
        `/api/bible/parallel?versionEn=BSB&versionFa=NMV&book=${currentBook.book_id}&chapter=${chapter}`
      );
      if (!res.ok) throw new Error("Failed to fetch scripture");

      const data = await res.json();
      const parallelList: { verse_num: number; en: string; fa: string }[] = data.parallel || [];

      // Filter requested range
      const selectedList = parallelList.filter(
        (v) => v.verse_num >= startV && v.verse_num <= endV
      );

      if (!selectedList.length) {
        toast.error(
          isRTL
            ? `آیه‌ای در بازه ${startV} تا ${endV} یافت نشد.`
            : `No verses found in range ${startV}-${endV}.`
        );
        setIsLoading(false);
        return;
      }

      const verseNumbers = selectedList.map((v) => v.verse_num);
      const versesLabel = startV === endV ? `${startV}` : `${startV}-${endV}`;
      const referenceItem = {
        id: crypto.randomUUID(),
        book: currentBook.book_id,
        bookName: { fa: currentBook.book_name_fa, en: currentBook.book_name_en },
        chapter: chapter,
        verses: versesLabel,
        verseNumbers: verseNumbers,
        textFa: selectedList.map((v) => v.fa || ""),
        textEn: selectedList.map((v) => v.en || ""),
        translation: "NMV",
        enTranslation: "BSB",
      };

      let generatedPages: ScripturePage[] = [];

      if (slideMode === "single") {
        generatedPages = [
          {
            id: crypto.randomUUID(),
            book: currentBook.book_id,
            bookName: { fa: currentBook.book_name_fa, en: currentBook.book_name_en },
            chapter: chapter,
            verses: versesLabel,
            verseNumbers: verseNumbers,
            textPrimary: selectedList.map((v) => v.fa || ""),
            textSecondary: selectedList.map((v) => v.en || ""),
            translation: "NMV",
            enTranslation: "BSB",
            displayMode: "referenceList",
            primaryLanguage: "fa",
            glassPopupEnabled: true,
            referenceItems: [referenceItem],
            popupLabelFa: `${currentBook.book_name_fa} ${chapter}:${versesLabel}`,
            popupLabelEn: `${currentBook.book_name_en} ${chapter}:${versesLabel}`,
          },
        ];
      } else if (slideMode === "perVerse") {
        generatedPages = selectedList.map((v) => ({
          id: crypto.randomUUID(),
          book: currentBook.book_id,
          bookName: { fa: currentBook.book_name_fa, en: currentBook.book_name_en },
          chapter: chapter,
          verses: `${v.verse_num}`,
          verseNumbers: [v.verse_num],
          textPrimary: [v.fa || ""],
          textSecondary: [v.en || ""],
          translation: "NMV",
          enTranslation: "BSB",
          displayMode: "list" as const,
          primaryLanguage: "fa",
          glassPopupEnabled: false,
          referenceItems: [
            {
              ...referenceItem,
              verses: `${v.verse_num}`,
              verseNumbers: [v.verse_num],
              textFa: [v.fa || ""],
              textEn: [v.en || ""],
            },
          ],
          popupLabelFa: `${currentBook.book_name_fa} ${chapter}:${v.verse_num}`,
          popupLabelEn: `${currentBook.book_name_en} ${chapter}:${v.verse_num}`,
        }));
      } else {
        // perReference
        generatedPages = [
          {
            id: crypto.randomUUID(),
            book: currentBook.book_id,
            bookName: { fa: currentBook.book_name_fa, en: currentBook.book_name_en },
            chapter: chapter,
            verses: versesLabel,
            verseNumbers: verseNumbers,
            textPrimary: selectedList.map((v) => v.fa || ""),
            textSecondary: selectedList.map((v) => v.en || ""),
            translation: "NMV",
            enTranslation: "BSB",
            displayMode: "list",
            primaryLanguage: "fa",
            glassPopupEnabled: true,
            referenceItems: [referenceItem],
            popupLabelFa: `${currentBook.book_name_fa} ${chapter}:${versesLabel}`,
            popupLabelEn: `${currentBook.book_name_en} ${chapter}:${versesLabel}`,
          },
        ];
      }

      onAddSlides(generatedPages);
      toast.success(
        isRTL
          ? `✓ ${generatedPages.length} اسلاید از ${currentBook.book_name_fa} ${chapter}:${versesLabel} افزوده شد.`
          : `✓ Added ${generatedPages.length} slide(s) from ${currentBook.book_name_en} ${chapter}:${versesLabel}.`
      );
    } catch {
      toast.error(isRTL ? "خطا در دریافت متن آیه" : "Failed to load scripture");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleQuickInsert();
    }
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={`relative bg-gradient-to-r from-slate-900/95 via-zinc-900/95 to-slate-900/95 border border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.08)] rounded-2xl p-2.5 flex flex-wrap items-center gap-2 text-white ${className}`}
    >
      {/* Title Badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 font-black text-xs shrink-0 select-none shadow-[0_0_10px_rgba(245,158,11,0.15)]">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span className={isRTL ? "font-[Vazirmatn]" : ""}>
          {isRTL ? "درج سریع آیه" : "Quick Verse"}
        </span>
      </div>

      {/* ── كادر ۱: انتخاب کتاب (Book Box) ── */}
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setBookDropdownOpen((prev) => !prev);
            setTimeout(() => bookInputRef.current?.focus(), 50);
          }}
          className="flex items-center justify-between gap-2 bg-black/60 hover:bg-black/80 border border-amber-400/60 rounded-xl px-3 py-1.5 text-xs md:text-sm font-bold transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 min-w-[130px] md:min-w-[160px]"
          title={isRTL ? "انتخاب کتاب مقدس" : "Select Book"}
        >
          <div className="flex items-center gap-1.5 truncate">
            <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className={`text-amber-200 truncate ${isRTL ? "font-[Vazirmatn]" : ""}`}>
              {isRTL ? currentBook.book_name_fa : currentBook.book_name_en}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-amber-400/70 shrink-0" />
        </button>

        {/* Dropdown Menu */}
        {bookDropdownOpen && (
          <div className="absolute top-full mt-1.5 right-0 z-50 w-64 max-h-80 bg-zinc-950/95 backdrop-blur-xl border border-amber-500/40 rounded-2xl shadow-2xl p-2 ring-1 ring-white/10 flex flex-col">
            <input
              ref={bookInputRef}
              type="text"
              value={bookSearchQuery}
              onChange={(e) => setBookSearchQuery(e.target.value)}
              placeholder={isRTL ? "جستجوی کتاب... (مثلاً متی، پیدایش)" : "Search book..."}
              className={`w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-400 mb-2 ${isRTL ? "font-[Vazirmatn]" : ""}`}
            />
            <div className="overflow-y-auto flex-1 space-y-0.5">
              {filteredBooks.map((b) => {
                const isSelected = b.book_id === selectedBookId;
                return (
                  <button
                    key={b.book_id}
                    type="button"
                    onClick={() => handleSelectBook(b)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all text-right ${
                      isSelected
                        ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40"
                        : "text-zinc-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="font-[Vazirmatn]">{b.book_name_fa}</span>
                    <span className="text-[11px] text-zinc-500 font-mono" dir="ltr">
                      {b.book_name_en}
                    </span>
                  </button>
                );
              })}
              {filteredBooks.length === 0 && (
                <div className="text-center py-4 text-xs text-zinc-500">
                  {isRTL ? "کتابی یافت نشد" : "No book found"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── كادر ۲: باب (Chapter Box) ── */}
      <div className="flex items-center gap-1.5 bg-black/60 border border-amber-400/60 rounded-xl px-2.5 py-1 shadow-[0_0_12px_rgba(245,158,11,0.2)] focus-within:ring-2 focus-within:ring-amber-400/50">
        <span className={`text-xs text-amber-400/80 font-bold select-none ${isRTL ? "font-[Vazirmatn]" : ""}`}>
          {isRTL ? "باب:" : "Ch:"}
        </span>
        <input
          type="number"
          min={1}
          max={currentBook.chapter_count}
          value={chapter}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            setChapter(isNaN(v) ? 1 : Math.max(1, Math.min(currentBook.chapter_count, v)));
          }}
          onKeyDown={handleKeyDown}
          className="w-12 bg-transparent text-center text-white font-mono font-bold text-sm outline-none"
        />
      </div>

      {/* ── كادر ۳: از آیه (From Verse Box) ── */}
      <div className="flex items-center gap-1.5 bg-black/60 border border-blue-400/60 rounded-xl px-2.5 py-1 shadow-[0_0_12px_rgba(59,130,246,0.2)] focus-within:ring-2 focus-within:ring-blue-400/50">
        <span className={`text-xs text-blue-300/80 font-bold select-none ${isRTL ? "font-[Vazirmatn]" : ""}`}>
          {isRTL ? "از آیه:" : "From:"}
        </span>
        <input
          type="number"
          min={1}
          max={200}
          value={fromVerse}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            const val = isNaN(v) ? 1 : Math.max(1, v);
            setFromVerse(val);
            if (val > toVerse) setToVerse(val);
          }}
          onKeyDown={handleKeyDown}
          className="w-12 bg-transparent text-center text-blue-200 font-mono font-bold text-sm outline-none"
        />
      </div>

      {/* ── كادر ۴: تا آیه (To Verse Box) ── */}
      <div className="flex items-center gap-1.5 bg-black/60 border border-blue-400/60 rounded-xl px-2.5 py-1 shadow-[0_0_12px_rgba(59,130,246,0.2)] focus-within:ring-2 focus-within:ring-blue-400/50">
        <span className={`text-xs text-blue-300/80 font-bold select-none ${isRTL ? "font-[Vazirmatn]" : ""}`}>
          {isRTL ? "تا آیه:" : "To:"}
        </span>
        <input
          type="number"
          min={1}
          max={200}
          value={toVerse}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            setToVerse(isNaN(v) ? fromVerse : Math.max(fromVerse, v));
          }}
          onKeyDown={handleKeyDown}
          className="w-12 bg-transparent text-center text-blue-200 font-mono font-bold text-sm outline-none"
        />
      </div>

      {/* ── كادر ۵: نحوه چیدمان اسلایدها (Mode Box) ── */}
      <div className="hidden sm:flex items-center bg-black/50 border border-white/10 rounded-xl p-0.5 text-xs">
        <button
          type="button"
          onClick={() => setSlideMode("perVerse")}
          className={`px-2 py-1 rounded-lg font-bold transition-all ${
            slideMode === "perVerse"
              ? "bg-amber-500/30 text-amber-300 shadow-sm"
              : "text-zinc-400 hover:text-white"
          } ${isRTL ? "font-[Vazirmatn]" : ""}`}
          title={isRTL ? "هر آیه در یک اسلاید جداگانه" : "1 Slide Per Verse"}
        >
          {isRTL ? "تک‌آیه" : "Per Verse"}
        </button>
        <button
          type="button"
          onClick={() => setSlideMode("single")}
          className={`px-2 py-1 rounded-lg font-bold transition-all ${
            slideMode === "single"
              ? "bg-amber-500/30 text-amber-300 shadow-sm"
              : "text-zinc-400 hover:text-white"
          } ${isRTL ? "font-[Vazirmatn]" : ""}`}
          title={isRTL ? "تمام آیات در یک اسلاید باهم" : "All In 1 Slide"}
        >
          {isRTL ? "کل بازه" : "Combined"}
        </button>
      </div>

      {/* ── دکمه اکشن درخشان: درج در اسلاید (Action Button) ── */}
      <button
        type="button"
        onClick={handleQuickInsert}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-black font-black text-xs md:text-sm rounded-xl shadow-[0_0_18px_rgba(245,158,11,0.4)] transition-all cursor-pointer disabled:opacity-50 select-none shrink-0"
        title={isRTL ? "افزودن فوری به اسلایدها (Enter)" : "Quick Add to Slides (Enter)"}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-black" />
        ) : (
          <Zap className="w-4 h-4 text-black fill-black" />
        )}
        <span className={isRTL ? "font-[Vazirmatn]" : ""}>
          {isRTL ? "درج در اسلاید (Enter)" : "Add to Slide"}
        </span>
      </button>

      {/* ── دکمه مرور کامل (Open Full Modal/Selector) ── */}
      <button
        type="button"
        onClick={onOpenFullSelector}
        className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all ml-auto shrink-0"
        title={isRTL ? "باز کردن صفحه کامل کاوش و انتخاب آیه" : "Open Full Bible Explorer"}
      >
        <SlidersHorizontal className="w-4 h-4" />
      </button>
    </div>
  );
}
