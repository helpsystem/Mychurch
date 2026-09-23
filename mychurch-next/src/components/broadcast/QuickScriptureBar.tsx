"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  BookOpen,
  Zap,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
  Loader2,
  Plus,
  Star,
  Languages,
  Check,
} from "lucide-react";
import { ScripturePage, ScriptureReferenceItem } from "@/types/broadcast";
import { CANONICAL_BOOKS } from "@/lib/bibleUsfm";
import { toast } from "sonner";
import { useLanguage } from "@/providers/LanguageProvider";

const localDict = {
  en: {
    savedDefaultBook: (name: string) => `⭐ ${name} saved as default book.`,
    savedDefaultFa: (abbr: string) => `⭐ Persian translation ${abbr} saved as default.`,
    savedDefaultEn: (abbr: string) => `⭐ English translation ${abbr} saved as default.`,
    notEnoughVerses: (bookName: string, chapter: number, maxVerses: number, startV: number, endV: number) =>
      `${bookName} ${chapter} only contains ${maxVerses} verses (1 to ${maxVerses}). Verse ${startV}-${endV} does not exist in this chapter.`,
    slidesAdded: (count: number, bookName: string, chapter: number, verses: string, verFa: string, verEn: string) =>
      `✓ Added ${count} slide(s) from ${bookName} ${chapter}:${verses} (${verFa}/${verEn}).`,
    scriptureFetchFailed: "Failed to load scripture",
    bookAndTranslations: "Book & Translations:",
    selectBibleBook: "Select Bible Book",
    isDefaultBook: "This is the default book (⭐)",
    setAsDefaultBook: "Set as default book",
    searchBookPlaceholder: "Search book... (e.g. John)",
    currentDefaultBook: "Current default book",
    setBookAsDefault: (name: string) => `Set ${name} as default`,
    noBooksFound: "No books found",
    selectPersianTranslation: "Select Persian Translation",
    defaultPersianTranslation: "Default Persian translation",
    setAsDefaultPersian: "Set as default Persian translation",
    persianTranslations: "Persian Translations",
    clickStarToSetDefault: "Click ⭐ to set default",
    currentDefault: "Current default",
    setVersionAsDefault: (name: string) => `Set ${name} as default`,
    selectEnglishTranslation: "Select English Translation",
    defaultEnglishTranslation: "Default English translation",
    setAsDefaultEnglish: "Set as default English translation",
    englishTranslations: "English Translations",
    defaultsLabel: "Defaults:",
    quickVerse: "Quick Verse",
    chapterLabel: "Ch:",
    fromLabel: "From:",
    toLabel: "To:",
    perVerseTitle: "1 Slide Per Verse",
    perVerse: "Per Verse",
    combinedTitle: "All In 1 Slide",
    combined: "Combined",
    addToCurrentSlideTitle: "Add to Current Slide",
    addToNewSlideTitle: "Add to Slide (Enter)",
    addIntoThisSlide: "Add into This Slide",
    addToSlide: "Add to Slide",
    createNewSlideTitle: "Add as a brand new slide",
    newSlide: "New Slide",
    openFullExplorer: "Open Full Bible Explorer",
  },
  fa: {
    savedDefaultBook: (name: string) => `⭐ کتاب «${name}» به عنوان کتاب پیش‌فرض ذخیره شد.`,
    savedDefaultFa: (abbr: string) => `⭐ ترجمه فارسی «${abbr}» به عنوان پیش‌فرض ذخیره شد.`,
    savedDefaultEn: (abbr: string) => `⭐ ترجمه انگلیسی «${abbr}» به عنوان پیش‌فرض ذخیره شد.`,
    notEnoughVerses: (bookName: string, chapter: number, maxVerses: number, startV: number, endV: number) =>
      `باب ${chapter} از ${bookName} تنها دارای ${maxVerses} آیه است (آیات ۱ تا ${maxVerses}). آیه ${startV} تا ${endV} در این باب وجود ندارد.`,
    slidesAdded: (count: number, bookName: string, chapter: number, verses: string, verFa: string, verEn: string) =>
      `✓ ${count} اسلاید از ${bookName} ${chapter}:${verses} (${verFa} / ${verEn}) افزوده شد.`,
    scriptureFetchFailed: "خطا در دریافت متن آیه",
    bookAndTranslations: "کتاب و ترجمه‌ها:",
    selectBibleBook: "انتخاب کتاب مقدس",
    isDefaultBook: "این کتاب، کتاب پیش‌فرض است (⭐)",
    setAsDefaultBook: "تنظیم این کتاب به عنوان پیش‌فرض",
    searchBookPlaceholder: "جستجوی کتاب... (مثال: یوحنا)",
    currentDefaultBook: "کتاب پیش‌فرض فعلی (⭐)",
    setBookAsDefault: (name: string) => `ستاره‌دار کردن «${name}» به عنوان پیش‌فرض`,
    noBooksFound: "کتابی با این نام یافت نشد",
    selectPersianTranslation: "انتخاب ترجمه فارسی",
    defaultPersianTranslation: "این ترجمه، پیش‌فرض فارسی است (⭐)",
    setAsDefaultPersian: "تنظیم این ترجمه به عنوان پیش‌فرض فارسی",
    persianTranslations: "ترجمه‌های معتبر فارسی",
    clickStarToSetDefault: "کلیک روی ⭐ = پیش‌فرض",
    currentDefault: "ترجمه پیش‌فرض فعلی (⭐)",
    setVersionAsDefault: (name: string) => `ستاره‌دار کردن «${name}» به عنوان پیش‌فرض`,
    selectEnglishTranslation: "انتخاب ترجمه انگلیسی",
    defaultEnglishTranslation: "این ترجمه، پیش‌فرض انگلیسی است (⭐)",
    setAsDefaultEnglish: "تنظیم این ترجمه به عنوان پیش‌فرض انگلیسی",
    englishTranslations: "ترجمه‌های انگلیسی",
    defaultsLabel: "پیش‌فرض‌ها:",
    quickVerse: "درج سریع آیه",
    chapterLabel: "باب:",
    fromLabel: "از آیه:",
    toLabel: "تا آیه:",
    perVerseTitle: "هر آیه در یک اسلاید جداگانه",
    perVerse: "تک‌آیه",
    combinedTitle: "تمام آیات در یک اسلاید باهم",
    combined: "کل بازه",
    addToCurrentSlideTitle: "افزودن این آیه به اسلاید جاری انتخابی",
    addToNewSlideTitle: "درج در اسلاید جدید (Enter)",
    addIntoThisSlide: "افزودن در این اسلاید (Enter)",
    addToSlide: "درج در اسلاید (Enter)",
    createNewSlideTitle: "افزودن به عنوان یک اسلاید کاملاً جدید",
    newSlide: "اسلاید جدید",
    openFullExplorer: "باز کردن صفحه کامل کاوش و انتخاب آیه",
  },
  es: {
    savedDefaultBook: (name: string) => `⭐ ${name} guardado como libro predeterminado.`,
    savedDefaultFa: (abbr: string) => `⭐ Traducción persa ${abbr} guardada como predeterminada.`,
    savedDefaultEn: (abbr: string) => `⭐ Traducción inglesa ${abbr} guardada como predeterminada.`,
    notEnoughVerses: (bookName: string, chapter: number, maxVerses: number, startV: number, endV: number) =>
      `${bookName} ${chapter} solo tiene ${maxVerses} versículos (1 a ${maxVerses}). El versículo ${startV}-${endV} no existe en este capítulo.`,
    slidesAdded: (count: number, bookName: string, chapter: number, verses: string, verFa: string, verEn: string) =>
      `✓ Se añadieron ${count} diapositiva(s) de ${bookName} ${chapter}:${verses} (${verFa}/${verEn}).`,
    scriptureFetchFailed: "Error al cargar la Escritura",
    bookAndTranslations: "Libro y traducciones:",
    selectBibleBook: "Seleccionar libro bíblico",
    isDefaultBook: "Este es el libro predeterminado (⭐)",
    setAsDefaultBook: "Establecer como libro predeterminado",
    searchBookPlaceholder: "Buscar libro... (ej. Juan)",
    currentDefaultBook: "Libro predeterminado actual",
    setBookAsDefault: (name: string) => `Establecer ${name} como predeterminado`,
    noBooksFound: "No se encontraron libros",
    selectPersianTranslation: "Seleccionar traducción persa",
    defaultPersianTranslation: "Traducción persa predeterminada",
    setAsDefaultPersian: "Establecer como traducción persa predeterminada",
    persianTranslations: "Traducciones persas",
    clickStarToSetDefault: "Haga clic en ⭐ para establecer como predeterminada",
    currentDefault: "Predeterminada actual",
    setVersionAsDefault: (name: string) => `Establecer ${name} como predeterminada`,
    selectEnglishTranslation: "Seleccionar traducción inglesa",
    defaultEnglishTranslation: "Traducción inglesa predeterminada",
    setAsDefaultEnglish: "Establecer como traducción inglesa predeterminada",
    englishTranslations: "Traducciones inglesas",
    defaultsLabel: "Predeterminados:",
    quickVerse: "Versículo rápido",
    chapterLabel: "Cap:",
    fromLabel: "Desde:",
    toLabel: "Hasta:",
    perVerseTitle: "1 diapositiva por versículo",
    perVerse: "Por versículo",
    combinedTitle: "Todos los versículos en 1 diapositiva",
    combined: "Combinado",
    addToCurrentSlideTitle: "Añadir este versículo a la diapositiva actual",
    addToNewSlideTitle: "Añadir a nueva diapositiva (Enter)",
    addIntoThisSlide: "Añadir a esta diapositiva (Enter)",
    addToSlide: "Añadir a la diapositiva",
    createNewSlideTitle: "Añadir como una diapositiva completamente nueva",
    newSlide: "Nueva diapositiva",
    openFullExplorer: "Abrir explorador bíblico completo",
  },
};

interface QuickScriptureBarProps {
  onAddSlides: (slides: ScripturePage[]) => void;
  onInsertIntoActiveSlide?: (referenceItem: ScriptureReferenceItem, newPage: ScripturePage) => void;
  isCurrentSlideScripture?: boolean;
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

interface TranslationOption {
  abbr: string;
  nameFa: string;
  nameEn: string;
  descFa: string;
  descEn: string;
}

// Available Persian Translations
const FA_TRANSLATIONS: TranslationOption[] = [
  { abbr: "NMV", nameFa: "هزارۀ نو (معاصر)", nameEn: "New Millennium (NMV)", descFa: "ترجمه استاندارد و روان معاصر - رایج‌ترین در کلیساها", descEn: "Contemporary standard Persian" },
  { abbr: "TPV", nameFa: "کتاب مقدس مژده (تفسیری)", nameEn: "Good News / Tafsiri (TPV)", descFa: "ترجمه تفسیری ساده و روان برای درک آسان", descEn: "Dynamic thought-for-thought" },
  { abbr: "PCB", nameFa: "ترجمه قدیم (فاضل‌خان)", nameEn: "Classic Farsi (PCB)", descFa: "متن سنتی و کهن ادبی فاخر، ممتاز برای موعظه", descEn: "Classic traditional literary" },
  { abbr: "MOZ", nameFa: "مژده برای عصر جدید", nameEn: "Mozhdeh New Era (MOZ)", descFa: "ترجمه عصر جدید برای نسل نو", descEn: "New era contemporary translation" },
  { abbr: "FARSIO", nameFa: "متن اصیل کهن", nameEn: "Ancient Historical (FARSIO)", descFa: "نگارش اصیل تاریخی فارسی", descEn: "Historical ancient Persian" },
  { abbr: "RCPV", nameFa: "کتاب مقدس ون‌دایک", nameEn: "Van Dyke (RCPV)", descFa: "عهد قدیم و ترجمه مشهور ون‌دایک", descEn: "Historic Van Dyke translation" },
  { abbr: "BBK", nameFa: "ترجمه بیگدلی (عهد جدید)", nameEn: "Bigdeli NT (BBK)", descFa: "فقط شامل عهد جدید", descEn: "New Testament only" },
  { abbr: "PES", nameFa: "پشیتا سریانی (عهد جدید)", nameEn: "Peshitta NT (PES)", descFa: "برگردان از زبان سریانی", descEn: "Peshitta Syriac translation" },
];

// Available English Translations
const EN_TRANSLATIONS: TranslationOption[] = [
  { abbr: "BSB", nameFa: "Berean Standard Bible", nameEn: "Berean Standard Bible (BSB)", descFa: "دقیق، روان و بدون کپی‌رایت محدودکننده", descEn: "Accurate & readable modern text" },
  { abbr: "NIV", nameFa: "New International Version", nameEn: "New International Version (NIV)", descFa: "محبوب‌ترین ترجمه معاصر جهان", descEn: "Most widely read worldwide" },
  { abbr: "ESV", nameFa: "English Standard Version", nameEn: "English Standard Version (ESV)", descFa: "ترجمه لفظ‌به‌لفظ دقیق و رسمی", descEn: "Word-for-word literal and formal" },
  { abbr: "KJV", nameFa: "King James Version", nameEn: "King James Version (KJV)", descFa: "متن تاریخی فاخر و کلاسیک ۱۶۱۱", descEn: "Classic traditional 1611 text" },
  { abbr: "NLT", nameFa: "New Living Translation", nameEn: "New Living Translation (NLT)", descFa: "بسیار روان و زنده با درک فوری", descEn: "Living, clear thought-for-thought" },
  { abbr: "NASB", nameFa: "New American Standard Bible", nameEn: "New American Standard (NASB)", descFa: "فوق‌العاده وفادار به ساختار زبان اصلی", descEn: "Strictly literal and scholarly" },
  { abbr: "CSB", nameFa: "Christian Standard Bible", nameEn: "Christian Standard Bible (CSB)", descFa: "تعادل کم‌نظیر میان دقت و وضوح کلام", descEn: "Optimal blend of accuracy & clarity" },
];

// Canonical 66 Books
const INITIAL_BOOKS: BookOption[] = CANONICAL_BOOKS.map((b) => ({
  book_id: b.usfm,
  book_name_en: b.nameEn,
  book_name_fa: b.nameFa,
  chapter_count: b.chapters,
}));

const loadStorage = (key: string, fallback: string): string => {
  if (typeof window === "undefined") return fallback;
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

const saveStorage = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

export default function QuickScriptureBar({
  onAddSlides,
  onInsertIntoActiveSlide,
  isCurrentSlideScripture = false,
  onOpenFullSelector,
  isRTL = true,
  className = "",
}: QuickScriptureBarProps) {
  const { language } = useLanguage();
  const d = localDict[language] || localDict.fa;
  const books = INITIAL_BOOKS;

  // Defaults persisted in localStorage
  const [defaultBookId, setDefaultBookId] = useState<string>(() => loadStorage("bp_default_book", "GEN"));
  const [defaultVersionFa, setDefaultVersionFa] = useState<string>(() => loadStorage("bp_default_ver_fa", "NMV"));
  const [defaultVersionEn, setDefaultVersionEn] = useState<string>(() => loadStorage("bp_default_ver_en", "BSB"));

  // Active selections
  const [selectedBookId, setSelectedBookId] = useState<string>(() =>
    loadStorage("bp_quick_book", loadStorage("bp_default_book", "GEN"))
  );
  const [selectedVersionFa, setSelectedVersionFa] = useState<string>(() =>
    loadStorage("bp_ver_fa", loadStorage("bp_default_ver_fa", "NMV"))
  );
  const [selectedVersionEn, setSelectedVersionEn] = useState<string>(() =>
    loadStorage("bp_ver_en", loadStorage("bp_default_ver_en", "BSB"))
  );

  const [chapter, setChapter] = useState<number>(1);
  const [fromVerse, setFromVerse] = useState<number>(1);
  const [toVerse, setToVerse] = useState<number>(1);
  const [slideMode, setSlideMode] = useState<"perVerse" | "single" | "perReference">("perVerse");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Dropdown states
  const [bookDropdownOpen, setBookDropdownOpen] = useState<boolean>(false);
  const [faDropdownOpen, setFaDropdownOpen] = useState<boolean>(false);
  const [enDropdownOpen, setEnDropdownOpen] = useState<boolean>(false);
  const [bookSearchQuery, setBookSearchQuery] = useState<string>("");

  const containerRef = useRef<HTMLDivElement>(null);
  const bookInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setBookDropdownOpen(false);
        setFaDropdownOpen(false);
        setEnDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentBook = useMemo(() => {
    return books.find((b) => b.book_id === selectedBookId) || books[0];
  }, [books, selectedBookId]);

  const currentFa = useMemo(() => {
    return FA_TRANSLATIONS.find((v) => v.abbr === selectedVersionFa) || FA_TRANSLATIONS[0];
  }, [selectedVersionFa]);

  const currentEn = useMemo(() => {
    return EN_TRANSLATIONS.find((v) => v.abbr === selectedVersionEn) || EN_TRANSLATIONS[0];
  }, [selectedVersionEn]);

  // Filtered books for search
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

  // Handle setting/toggling default book
  const handleToggleDefaultBook = (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    const targetBook = books.find((b) => b.book_id === bookId) || currentBook;
    saveStorage("bp_default_book", bookId);
    setDefaultBookId(bookId);
    toast.success(d.savedDefaultBook(isRTL ? targetBook.book_name_fa : targetBook.book_name_en));
  };

  // Handle setting/toggling default Persian translation
  const handleToggleDefaultFa = (e: React.MouseEvent, verAbbr: string) => {
    e.stopPropagation();
    const targetVer = FA_TRANSLATIONS.find((v) => v.abbr === verAbbr) || currentFa;
    saveStorage("bp_default_ver_fa", verAbbr);
    setDefaultVersionFa(verAbbr);
    toast.success(d.savedDefaultFa(isRTL ? targetVer.nameFa : verAbbr));
  };

  // Handle setting/toggling default English translation
  const handleToggleDefaultEn = (e: React.MouseEvent, verAbbr: string) => {
    e.stopPropagation();
    const targetVer = EN_TRANSLATIONS.find((v) => v.abbr === verAbbr) || currentEn;
    saveStorage("bp_default_ver_en", verAbbr);
    setDefaultVersionEn(verAbbr);
    toast.success(d.savedDefaultEn(verAbbr));
  };

  const handleSelectBook = (book: BookOption) => {
    setSelectedBookId(book.book_id);
    saveStorage("bp_quick_book", book.book_id);
    if (chapter > book.chapter_count) setChapter(1);
    setBookDropdownOpen(false);
    setBookSearchQuery("");
  };

  const handleSelectFa = (abbr: string) => {
    setSelectedVersionFa(abbr);
    saveStorage("bp_ver_fa", abbr);
    setFaDropdownOpen(false);
  };

  const handleSelectEn = (abbr: string) => {
    setSelectedVersionEn(abbr);
    saveStorage("bp_ver_en", abbr);
    setEnDropdownOpen(false);
  };

  // Quick Insert Handler using selected translations
  const handleQuickInsert = async (forceNewSlide = false) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const startV = Math.max(1, Math.min(fromVerse, toVerse));
      const endV = Math.max(fromVerse, toVerse);

      // Fetch parallel bilingual text with user-selected Persian & English versions
      const res = await fetch(
        `/api/bible/parallel?versionEn=${encodeURIComponent(selectedVersionEn)}&versionFa=${encodeURIComponent(
          selectedVersionFa
        )}&book=${encodeURIComponent(currentBook.book_id)}&chapter=${chapter}`
      );
      if (!res.ok) throw new Error("Failed to fetch scripture");

      const data = await res.json();
      const parallelList: { verse_num: number; en: string; fa: string }[] = data.parallel || [];

      // Filter requested range
      const selectedList = parallelList.filter((v) => v.verse_num >= startV && v.verse_num <= endV);

      if (!selectedList.length) {
        const maxVerses = parallelList.length;
        toast.error(d.notEnoughVerses(isRTL ? currentBook.book_name_fa : currentBook.book_name_en, chapter, maxVerses, startV, endV));
        setIsLoading(false);
        return;
      }

      const verseNumbers = selectedList.map((v) => v.verse_num);
      const versesLabel = startV === endV ? `${startV}` : `${startV}-${endV}`;
      const referenceItem: ScriptureReferenceItem = {
        id: crypto.randomUUID(),
        book: currentBook.book_id,
        bookName: { fa: currentBook.book_name_fa, en: currentBook.book_name_en },
        chapter: chapter,
        verses: versesLabel,
        verseNumbers: verseNumbers,
        textFa: selectedList.map((v) => v.fa || ""),
        textEn: selectedList.map((v) => v.en || ""),
        translation: selectedVersionFa,
        enTranslation: selectedVersionEn,
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
            textPrimary: isRTL ? selectedList.map((v) => v.fa || "") : selectedList.map((v) => v.en || ""),
            textSecondary: isRTL ? selectedList.map((v) => v.en || "") : selectedList.map((v) => v.fa || ""),
            translation: selectedVersionFa,
            enTranslation: selectedVersionEn,
            displayMode: "referenceList",
            primaryLanguage: isRTL ? "fa" : "en",
            glassPopupEnabled: true,
            referenceItems: [referenceItem],
            popupLabelFa: `${currentBook.book_name_fa} ${chapter}:${versesLabel} (${selectedVersionFa})`,
            popupLabelEn: `${currentBook.book_name_en} ${chapter}:${versesLabel} (${selectedVersionEn})`,
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
          textPrimary: isRTL ? [v.fa || ""] : [v.en || ""],
          textSecondary: isRTL ? [v.en || ""] : [v.fa || ""],
          translation: selectedVersionFa,
          enTranslation: selectedVersionEn,
          displayMode: "list" as const,
          primaryLanguage: isRTL ? "fa" : "en",
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
          popupLabelFa: `${currentBook.book_name_fa} ${chapter}:${v.verse_num} (${selectedVersionFa})`,
          popupLabelEn: `${currentBook.book_name_en} ${chapter}:${v.verse_num} (${selectedVersionEn})`,
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
            textPrimary: isRTL ? selectedList.map((v) => v.fa || "") : selectedList.map((v) => v.en || ""),
            textSecondary: isRTL ? selectedList.map((v) => v.en || "") : selectedList.map((v) => v.fa || ""),
            translation: selectedVersionFa,
            enTranslation: selectedVersionEn,
            displayMode: "list",
            primaryLanguage: isRTL ? "fa" : "en",
            glassPopupEnabled: true,
            referenceItems: [referenceItem],
            popupLabelFa: `${currentBook.book_name_fa} ${chapter}:${versesLabel} (${selectedVersionFa})`,
            popupLabelEn: `${currentBook.book_name_en} ${chapter}:${versesLabel} (${selectedVersionEn})`,
          },
        ];
      }

      if (!forceNewSlide && isCurrentSlideScripture && onInsertIntoActiveSlide) {
        onInsertIntoActiveSlide(referenceItem, generatedPages[0]);
      } else {
        onAddSlides(generatedPages);
        toast.success(
          d.slidesAdded(
            generatedPages.length,
            isRTL ? currentBook.book_name_fa : currentBook.book_name_en,
            chapter,
            versesLabel,
            selectedVersionFa,
            selectedVersionEn
          )
        );
      }
    } catch {
      toast.error(d.scriptureFetchFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleQuickInsert(false);
    }
  };

  return (
    <div
      ref={containerRef}
      dir={isRTL ? "rtl" : "ltr"}
      className={`relative bg-gradient-to-r from-slate-950/95 via-zinc-900/95 to-slate-950/95 border border-amber-500/35 shadow-[0_0_30px_rgba(245,158,11,0.12)] rounded-2xl p-2.5 sm:p-3 flex flex-col gap-2.5 text-white ${className}`}
    >
      {/* ══════════════════════════════════════════════════════════════════
          ردیف ۱ (قبل از درج آیه): تعیین کتاب و ترجمه‌های فارسی و انگلیسی
          با قابلیت ستاره‌دار کردن (پیش‌فرض) برای هر یک
          ══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* نشان مشخص‌کننده بخش تنظیمات و پیش‌فرض‌ها */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 font-bold select-none">
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span className={isRTL ? "font-[Vazirmatn]" : ""}>
              {d.bookAndTranslations}
            </span>
          </div>

          {/* ۱. انتخاب کتاب و ستاره پیش‌فرض */}
          <div className="relative">
            <div className="flex items-center bg-black/60 border border-amber-400/50 hover:border-amber-400 rounded-xl overflow-hidden shadow-[0_0_12px_rgba(245,158,11,0.15)] transition-all">
              <button
                type="button"
                onClick={() => {
                  setBookDropdownOpen((prev) => !prev);
                  setFaDropdownOpen(false);
                  setEnDropdownOpen(false);
                  setTimeout(() => bookInputRef.current?.focus(), 50);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/5 transition text-amber-200 font-bold max-w-[140px] md:max-w-[170px]"
                title={d.selectBibleBook}
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className={`truncate ${isRTL ? "font-[Vazirmatn]" : ""}`}>
                  {isRTL ? currentBook.book_name_fa : currentBook.book_name_en}
                </span>
                <ChevronDown className="w-3 h-3 text-amber-400/70 shrink-0" />
              </button>

              {/* دکمه ستاره کتاب انتخابی */}
              <button
                type="button"
                onClick={(e) => handleToggleDefaultBook(e, currentBook.book_id)}
                className={`p-1.5 border-r border-white/10 transition flex items-center justify-center ${
                  currentBook.book_id === defaultBookId
                    ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                    : "text-zinc-500 hover:text-amber-300 hover:bg-white/5"
                }`}
                title={currentBook.book_id === defaultBookId ? d.isDefaultBook : d.setAsDefaultBook}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    currentBook.book_id === defaultBookId ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]" : ""
                  }`}
                />
              </button>
            </div>

            {/* منوی دراپ‌داون کتاب‌ها با جستجو و ستاره */}
            {bookDropdownOpen && (
              <div className="absolute top-full mt-1.5 right-0 z-50 w-72 max-h-80 bg-zinc-950/98 backdrop-blur-2xl border border-amber-500/40 rounded-2xl shadow-2xl p-2 ring-1 ring-white/10 flex flex-col">
                <input
                  ref={bookInputRef}
                  type="text"
                  value={bookSearchQuery}
                  onChange={(e) => setBookSearchQuery(e.target.value)}
                  placeholder={d.searchBookPlaceholder}
                  className={`w-full bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-400 mb-2 ${
                    isRTL ? "font-[Vazirmatn]" : ""
                  }`}
                />
                <div className="overflow-y-auto flex-1 space-y-0.5 custom-scrollbar max-h-64">
                  {filteredBooks.map((b) => {
                    const isSelected = b.book_id === currentBook.book_id;
                    const isDefault = b.book_id === defaultBookId;
                    return (
                      <div
                        key={b.book_id}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSelected ? "bg-amber-500/20 text-amber-300" : "text-zinc-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectBook(b)}
                          className="flex-1 flex items-center justify-between text-right truncate pl-2"
                        >
                          <span className={`truncate ${isRTL ? "font-[Vazirmatn]" : ""}`}>
                            {isRTL ? b.book_name_fa : b.book_name_en}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono ml-2 shrink-0">
                            {b.chapter_count} ch.
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleToggleDefaultBook(e, b.book_id)}
                          className={`p-1 rounded hover:bg-white/10 transition shrink-0 ${
                            isDefault ? "text-amber-400" : "text-zinc-600 hover:text-amber-400"
                          }`}
                          title={isDefault ? d.currentDefaultBook : d.setBookAsDefault(isRTL ? b.book_name_fa : b.book_name_en)}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              isDefault ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" : ""
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                  {filteredBooks.length === 0 && (
                    <div className="text-center py-4 text-xs text-zinc-500">
                      {d.noBooksFound}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ۲. انتخاب ترجمه فارسی و ستاره پیش‌فرض */}
          <div className="relative">
            <div className="flex items-center bg-black/60 border border-emerald-500/50 hover:border-emerald-400 rounded-xl overflow-hidden shadow-[0_0_12px_rgba(16,185,129,0.15)] transition-all">
              <button
                type="button"
                onClick={() => {
                  setFaDropdownOpen((prev) => !prev);
                  setBookDropdownOpen(false);
                  setEnDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/5 transition text-emerald-200 font-bold max-w-[150px] md:max-w-[190px]"
                title={d.selectPersianTranslation}
              >
                <span className="text-[10px] px-1 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono font-black">
                  FA
                </span>
                <span className={`truncate ${isRTL ? "font-[Vazirmatn]" : ""}`}>
                  {currentFa.nameFa}
                </span>
                <ChevronDown className="w-3 h-3 text-emerald-400/70 shrink-0" />
              </button>

              {/* دکمه ستاره ترجمه فارسی */}
              <button
                type="button"
                onClick={(e) => handleToggleDefaultFa(e, currentFa.abbr)}
                className={`p-1.5 border-r border-white/10 transition flex items-center justify-center ${
                  currentFa.abbr === defaultVersionFa
                    ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                    : "text-zinc-500 hover:text-amber-300 hover:bg-white/5"
                }`}
                title={currentFa.abbr === defaultVersionFa ? d.defaultPersianTranslation : d.setAsDefaultPersian}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    currentFa.abbr === defaultVersionFa
                      ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]"
                      : ""
                  }`}
                />
              </button>
            </div>

            {/* دراپ‌داون ترجمه‌های فارسی */}
            {faDropdownOpen && (
              <div className="absolute top-full mt-1.5 right-0 z-50 w-72 max-h-80 bg-zinc-950/98 backdrop-blur-2xl border border-emerald-500/40 rounded-2xl shadow-2xl p-2 ring-1 ring-white/10 overflow-y-auto custom-scrollbar">
                <div className="text-[11px] font-bold text-emerald-400 px-2 py-1 mb-1 border-b border-white/10 flex items-center justify-between">
                  <span>{d.persianTranslations}</span>
                  <span className="text-[10px] text-zinc-400 font-normal">
                    {d.clickStarToSetDefault}
                  </span>
                </div>
                {FA_TRANSLATIONS.map((ver) => {
                  const isSelected = ver.abbr === selectedVersionFa;
                  const isDefault = ver.abbr === defaultVersionFa;
                  return (
                    <div
                      key={ver.abbr}
                      className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                        isSelected ? "bg-emerald-500/20 text-emerald-200" : "hover:bg-white/5 text-zinc-300"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectFa(ver.abbr)}
                        className="flex-1 text-right truncate pl-2"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-1 bg-emerald-500/20 text-emerald-300 rounded font-mono font-bold">
                            {ver.abbr}
                          </span>
                          <span className={`text-xs font-bold ${isRTL ? "font-[Vazirmatn]" : ""}`}>
                            {ver.nameFa}
                          </span>
                        </div>
                        <p className={`text-[10px] text-zinc-400 mt-0.5 truncate ${isRTL ? "font-[Vazirmatn]" : ""}`}>
                          {ver.descFa}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleToggleDefaultFa(e, ver.abbr)}
                        className={`p-1.5 rounded-lg hover:bg-white/10 transition shrink-0 ${
                          isDefault ? "text-amber-400" : "text-zinc-600 hover:text-amber-400"
                        }`}
                        title={isDefault ? d.currentDefault : d.setVersionAsDefault(isRTL ? ver.nameFa : ver.abbr)}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            isDefault ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" : ""
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ۳. انتخاب ترجمه انگلیسی و ستاره پیش‌فرض */}
          <div className="relative">
            <div className="flex items-center bg-black/60 border border-blue-500/50 hover:border-blue-400 rounded-xl overflow-hidden shadow-[0_0_12px_rgba(59,130,246,0.15)] transition-all">
              <button
                type="button"
                onClick={() => {
                  setEnDropdownOpen((prev) => !prev);
                  setBookDropdownOpen(false);
                  setFaDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/5 transition text-blue-200 font-bold max-w-[150px] md:max-w-[190px]"
                title={d.selectEnglishTranslation}
              >
                <span className="text-[10px] px-1 py-0.5 bg-blue-500/20 text-blue-300 rounded font-mono font-black">
                  EN
                </span>
                <span className="truncate">{currentEn.abbr}</span>
                <ChevronDown className="w-3 h-3 text-blue-400/70 shrink-0" />
              </button>

              {/* دکمه ستاره ترجمه انگلیسی */}
              <button
                type="button"
                onClick={(e) => handleToggleDefaultEn(e, currentEn.abbr)}
                className={`p-1.5 border-r border-white/10 transition flex items-center justify-center ${
                  currentEn.abbr === defaultVersionEn
                    ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                    : "text-zinc-500 hover:text-amber-300 hover:bg-white/5"
                }`}
                title={currentEn.abbr === defaultVersionEn ? d.defaultEnglishTranslation : d.setAsDefaultEnglish}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    currentEn.abbr === defaultVersionEn
                      ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]"
                      : ""
                  }`}
                />
              </button>
            </div>

            {/* دراپ‌داون ترجمه‌های انگلیسی */}
            {enDropdownOpen && (
              <div className="absolute top-full mt-1.5 right-0 z-50 w-72 max-h-80 bg-zinc-950/98 backdrop-blur-2xl border border-blue-500/40 rounded-2xl shadow-2xl p-2 ring-1 ring-white/10 overflow-y-auto custom-scrollbar">
                <div className="text-[11px] font-bold text-blue-400 px-2 py-1 mb-1 border-b border-white/10 flex items-center justify-between">
                  <span>{d.englishTranslations}</span>
                  <span className="text-[10px] text-zinc-400 font-normal">
                    {d.clickStarToSetDefault}
                  </span>
                </div>
                {EN_TRANSLATIONS.map((ver) => {
                  const isSelected = ver.abbr === selectedVersionEn;
                  const isDefault = ver.abbr === defaultVersionEn;
                  return (
                    <div
                      key={ver.abbr}
                      className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                        isSelected ? "bg-blue-500/20 text-blue-200" : "hover:bg-white/5 text-zinc-300"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectEn(ver.abbr)}
                        className="flex-1 text-right truncate pl-2"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-1 bg-blue-500/20 text-blue-300 rounded font-mono font-bold">
                            {ver.abbr}
                          </span>
                          <span className="text-xs font-bold">{ver.nameEn}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{ver.descEn}</p>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleToggleDefaultEn(e, ver.abbr)}
                        className={`p-1.5 rounded-lg hover:bg-white/10 transition shrink-0 ${
                          isDefault ? "text-amber-400" : "text-zinc-600 hover:text-amber-400"
                        }`}
                        title={isDefault ? d.currentDefault : d.setVersionAsDefault(ver.abbr)}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            isDefault ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" : ""
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* خلاصه پیش‌فرض‌های ستاره‌دار ذخیره شده */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1 text-amber-300/90 font-mono">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className={isRTL ? "font-[Vazirmatn]" : ""}>
              {d.defaultsLabel}
            </span>
            <span className="text-white font-bold">{defaultBookId}</span>
            <span className="text-zinc-600">|</span>
            <span className="text-emerald-300 font-bold">{defaultVersionFa}</span>
            <span className="text-zinc-600">|</span>
            <span className="text-blue-300 font-bold">{defaultVersionEn}</span>
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ردیف ۲: نوار درج سریع آیه (مطابق تصویر ارسالی با همگام‌سازی کامل)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-2 text-white">
        {/* Title Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 font-black text-xs shrink-0 select-none shadow-[0_0_10px_rgba(245,158,11,0.15)]">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className={isRTL ? "font-[Vazirmatn]" : ""}>
            {d.quickVerse}
          </span>
        </div>

        {/* ── كادر ۱: انتخاب کتاب و نمایش سریع ── */}
        <button
          type="button"
          onClick={() => {
            setBookDropdownOpen((prev) => !prev);
            setFaDropdownOpen(false);
            setEnDropdownOpen(false);
            setTimeout(() => bookInputRef.current?.focus(), 50);
          }}
          className="flex items-center justify-between gap-2 bg-black/60 hover:bg-black/80 border border-amber-400/60 rounded-xl px-3 py-1.5 text-xs md:text-sm font-bold transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 min-w-[130px] md:min-w-[160px]"
          title={d.selectBibleBook}
        >
          <div className="flex items-center gap-1.5 truncate">
            <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className={`text-amber-200 truncate ${isRTL ? "font-[Vazirmatn]" : ""}`}>
              {isRTL ? currentBook.book_name_fa : currentBook.book_name_en}
            </span>
            {currentBook.book_id === defaultBookId && (
              <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
            )}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-amber-400/70 shrink-0" />
        </button>

        {/* ── كادر ۲: شماره باب (Chapter Box) ── */}
        <div className="flex items-center gap-1.5 bg-black/60 border border-amber-400/60 rounded-xl px-2.5 py-1 shadow-[0_0_12px_rgba(245,158,11,0.2)] focus-within:ring-2 focus-within:ring-amber-400/50">
          <span className={`text-xs text-amber-300/80 font-bold select-none ${isRTL ? "font-[Vazirmatn]" : ""}`}>
            {d.chapterLabel}
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
            className="w-10 bg-transparent text-center text-amber-200 font-mono font-bold text-sm outline-none"
          />
          <span className="text-[10px] text-zinc-500 font-mono select-none">
            /{currentBook.chapter_count}
          </span>
        </div>

        {/* ── كادر ۳: از آیه (From Verse Box) ── */}
        <div className="flex items-center gap-1.5 bg-black/60 border border-blue-400/60 rounded-xl px-2.5 py-1 shadow-[0_0_12px_rgba(59,130,246,0.2)] focus-within:ring-2 focus-within:ring-blue-400/50">
          <span className={`text-xs text-blue-300/80 font-bold select-none ${isRTL ? "font-[Vazirmatn]" : ""}`}>
            {d.fromLabel}
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
            {d.toLabel}
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
            title={d.perVerseTitle}
          >
            {d.perVerse}
          </button>
          <button
            type="button"
            onClick={() => setSlideMode("single")}
            className={`px-2 py-1 rounded-lg font-bold transition-all ${
              slideMode === "single"
                ? "bg-amber-500/30 text-amber-300 shadow-sm"
                : "text-zinc-400 hover:text-white"
            } ${isRTL ? "font-[Vazirmatn]" : ""}`}
            title={d.combinedTitle}
          >
            {d.combined}
          </button>
        </div>

        {/* ── دکمه اکشن اصلی: درج در اسلاید (Action Button) ── */}
        <button
          type="button"
          onClick={() => handleQuickInsert(false)}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-black font-black text-xs md:text-sm rounded-xl shadow-[0_0_18px_rgba(245,158,11,0.4)] transition-all cursor-pointer disabled:opacity-50 select-none shrink-0"
          title={isCurrentSlideScripture ? d.addToCurrentSlideTitle : d.addToNewSlideTitle}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-black" />
          ) : (
            <Zap className="w-4 h-4 text-black fill-black" />
          )}
          <span className={isRTL ? "font-[Vazirmatn]" : ""}>
            {isCurrentSlideScripture ? d.addIntoThisSlide : d.addToSlide}
          </span>
        </button>

        {/* ── دکمه افزودن به عنوان اسلاید جدید (در صورت انتخاب اسلاید فعلی) ── */}
        {isCurrentSlideScripture && (
          <button
            type="button"
            onClick={() => handleQuickInsert(true)}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition cursor-pointer select-none shrink-0"
            title={d.createNewSlideTitle}
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span className={isRTL ? "font-[Vazirmatn]" : ""}>
              {d.newSlide}
            </span>
          </button>
        )}

        {/* ── دکمه مرور کامل (Open Full Modal/Selector) ── */}
        <button
          type="button"
          onClick={onOpenFullSelector}
          className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all ml-auto shrink-0"
          title={d.openFullExplorer}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
