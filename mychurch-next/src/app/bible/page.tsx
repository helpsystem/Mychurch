"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Book, Music2, ChevronLeft, ChevronRight, Play, Pause,
  Columns2, Search, Loader2, List, X, ExternalLink, Highlighter, Copy, GitCompareArrows, Share2, Link2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useLanguage } from "@/providers/LanguageProvider";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BibleVersion { version_id: number; abbr: string; name: string; language: string; hasAudio?: boolean; }
interface BibleBook {
  book_id: string; book_name_en: string; book_name_fa: string;
  testament: string; book_order: number; chapter_count: number;
}
interface AudioTrack { audio_version_id: number; title: string; dramatized: number; mp3_url: string; }
interface BibleVerse { verse_num: number; text: string; }
interface Heading { before_verse: number; text: string; }
interface ParallelVerse { verse_num: number; en: string; fa: string | null; }
interface CompareVerseEntry { verseNum: number; text: string; }
interface CompareVersionRow {
  abbr: string;
  name: string;
  language: string;
  entries: CompareVerseEntry[];
  hasContent: boolean;
}

// "en" = English single, "fa" = Farsi single, "parallel" = side-by-side
type ReadingMode = "en" | "fa" | "parallel";

function groupByTestament(books: BibleBook[]) {
  return {
    ot: books.filter(b => b.testament === "OT"),
    nt: books.filter(b => b.testament === "NT"),
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BibleReaderPage() {
  const { language } = useLanguage();
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedVersionEn, setSelectedVersionEn] = useState("BSB");
  const [selectedVersionFa, setSelectedVersionFa] = useState("NMV");
  const [selectedBook, setSelectedBook] = useState("GEN");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [readingMode, setReadingMode] = useState<ReadingMode>("parallel");
  const [fontSize, setFontSize] = useState(18);

  const [selectedVerses, setSelectedVerses] = useState<ParallelVerse[]>([]);
  const [selectedHighlightColor, setSelectedHighlightColor] = useState("#fffe00");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareRows, setCompareRows] = useState<CompareVersionRow[]>([]);
  const [compareReferenceAbbr, setCompareReferenceAbbr] = useState<string>("");
  const [compareLanguageFilter, setCompareLanguageFilter] = useState<"all" | "en" | "fa">("all");
  const [compareHideMissing, setCompareHideMissing] = useState(true);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookSearch, setBookSearch] = useState("");
  const [showBookList, setShowBookList] = useState(false);
  const [showChapterGrid, setShowChapterGrid] = useState(false);
  const [currentBook, setCurrentBook] = useState<BibleBook | null>(null);

  // Audio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTrackIdx, setSelectedTrackIdx] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // --- Selection Logic ---
  const toggleVerseSelection = (v: any) => {
    setSelectedVerses(prev => {
      const exists = prev.find(item => item.verse_num === v.verse_num);
      if (exists) return prev.filter(item => item.verse_num !== v.verse_num);
      return [...prev, v].sort((a, b) => a.verse_num - b.verse_num);
    });
  };

  const getSelectedVersesText = useCallback(() => {
    return selectedVerses
      .map(v => {
        const en = v.en ?? "";
        const fa = v.fa ?? "";
        const content = readingMode === "parallel" ? `${en} | ${fa}` : (readingMode === "fa" ? fa : en);
        return `(${v.verse_num}) ${content}`.trim();
      })
      .join("\n");
  }, [selectedVerses, readingMode]);

  const copySelected = () => {
    const text = getSelectedVersesText();
    navigator.clipboard.writeText(text).then(() => {
      alert(language === 'fa' ? "آیات کپی شدند" : "Verses copied to clipboard");
    });
  };

  const shareSelected = () => setShowShareModal(true);

  // Load versions
  useEffect(() => {
    fetch("/api/bible/versions")
      .then(r => r.json())
      .then(d => setVersions(d.versions || []))
      .catch(console.error);
  }, []);

  // Load books (always load by En version for book metadata)
  useEffect(() => {
    fetch(`/api/bible/books?version=${selectedVersionEn}`)
      .then(r => r.json())
      .then(d => {
        setBooks(d.books || []);
        const bk = d.books?.find((b: BibleBook) => b.book_id === selectedBook);
        setCurrentBook(bk ?? null);
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVersionEn]);

  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [faVerses, setFaVerses] = useState<BibleVerse[]>([]);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [parallelVerses, setParallelVerses] = useState<ParallelVerse[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);

  // Load chapter
  const loadChapter = useCallback(async () => {
    setLoading(true);
    try {
      if (readingMode === "parallel") {
        const r = await fetch(`/api/bible/parallel?versionEn=${selectedVersionEn}&versionFa=${selectedVersionFa}&book=${selectedBook}&chapter=${selectedChapter}`);
        const d = await r.json();
        setParallelVerses(d.parallel || []);
        setAudioTracks(language === "fa" ? (d.audioFa || []) : (d.audioEn || []));
      } else if (readingMode === "fa") {
        // Load Farsi-only
        const r = await fetch(`/api/bible/chapter?version=${selectedVersionFa}&book=${selectedBook}&chapter=${selectedChapter}`);
        const d = await r.json();
        setFaVerses(d.verses || []);
        setAudioTracks(d.audio || []);
        setCurrentBook(prev => prev ? { ...prev, book_name_en: d.bookNameEn || prev.book_name_en, book_name_fa: d.bookNameFa || prev.book_name_fa } : prev);
      } else {
        // Load English-only
        const r = await fetch(`/api/bible/chapter?version=${selectedVersionEn}&book=${selectedBook}&chapter=${selectedChapter}`);
        const d = await r.json();
        setVerses(d.verses || []);
        setHeadings(d.headings || []);
        setAudioTracks(d.audio || []);
        setCurrentBook(prev => prev ? { ...prev, book_id: selectedBook, book_name_en: d.bookNameEn, book_name_fa: d.bookNameFa, chapter_count: d.chapterCount } : { book_id: selectedBook, book_name_en: d.bookNameEn, book_name_fa: d.bookNameFa, chapter_count: d.chapterCount, testament: '', book_order: 0 } as BibleBook);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedVersionEn, selectedVersionFa, selectedBook, selectedChapter, readingMode, language]);

  useEffect(() => {
    loadChapter();
    setIsPlaying(false);
  }, [loadChapter]);

  // Audio
  useEffect(() => {
    if (!audioRef.current || !audioTracks.length) return;
    const track = audioTracks[selectedTrackIdx];
    if (!track?.mp3_url) return;
    audioRef.current.src = track.mp3_url;
    if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrackIdx, audioTracks]);

  const togglePlay = () => {
    if (!audioRef.current || !audioTracks.length) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false)); }
  };
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setAudioProgress(audioRef.current.currentTime);
    setAudioDuration(audioRef.current.duration || 0);
  };
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Number(e.target.value);
    setAudioProgress(Number(e.target.value));
  };
  const formatTime = (s: number) => {
    if (!isFinite(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  // Chapter nav — always LTR logic (Prev = smaller, Next = larger)
  const prevChapter = () => { if (selectedChapter > 1) setSelectedChapter(c => c - 1); };
  const nextChapter = () => { if (selectedChapter < (currentBook?.chapter_count ?? 999)) setSelectedChapter(c => c + 1); };

  const { ot, nt } = groupByTestament(books);
  const filteredBooks = bookSearch
    ? books.filter(b =>
        b.book_name_en?.toLowerCase().includes(bookSearch.toLowerCase()) ||
        b.book_name_fa?.includes(bookSearch))
    : books;

  const englishVersions = versions.filter(v => v.language !== 'fa');
  const persianVersions = versions.filter(v => v.language === 'fa');
  const headingMap = new Map(headings.map(h => [h.before_verse, h.text]));
  const highlightPalette = ["#fffe00", "#5dff79", "#00d6ff", "#ffc66f", "#ff95ef"];
  const selectedStyle = (isSelected: boolean) =>
    isSelected
      ? {
          backgroundColor: `${selectedHighlightColor}3a`,
          borderBottom: `2px solid ${selectedHighlightColor}`,
        }
      : undefined;

  const verseNums = selectedVerses.map(v => v.verse_num).sort((a, b) => a - b);
  const firstVerse = verseNums[0];
  const lastVerse = verseNums[verseNums.length - 1];
  const selectedRef = verseNums.length <= 1 ? `${selectedChapter}:${firstVerse || ""}` : `${selectedChapter}:${firstVerse}-${lastVerse}`;
  const selectedVersionAbbr = readingMode === "en" ? selectedVersionEn : selectedVersionFa;
  const selectedVersionId = versions.find(v => v.abbr === selectedVersionAbbr)?.version_id;
  const bibleComUrl = selectedVersionId && firstVerse
    ? `https://www.bible.com/fa/bible/${selectedVersionId}/${selectedBook}.${selectedChapter}.${firstVerse}.${selectedVersionAbbr.toLowerCase()}`
    : "https://www.bible.com/fa/bible";
  const selectedBookLabel = (language === "fa" ? currentBook?.book_name_fa : currentBook?.book_name_en) || selectedBook;
  const shareTitle = `${selectedBookLabel} ${selectedRef} ${selectedVersionAbbr.toLowerCase()}`;
  const selectedSnippetRaw = getSelectedVersesText().replace(/\s+/g, " ").trim();
  const selectedSnippet = selectedSnippetRaw.length > 220 ? `${selectedSnippetRaw.slice(0, 220)}...` : selectedSnippetRaw;
  const sharePreviewLines = selectedSnippetRaw ? selectedSnippetRaw.split("\n").slice(0, 3) : [];
  const shareText = selectedSnippet ? `${shareTitle}: ${selectedSnippet}` : shareTitle;
  const shareEncodedUrl = encodeURIComponent(bibleComUrl);
  const shareEncodedText = encodeURIComponent(shareText);

  const shareTargets = [
    { label: "Email", href: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${bibleComUrl}`)}` },
    { label: "Facebook", href: `https://www.facebook.com/dialog/share?app_id=117344358296665&href=${shareEncodedUrl}&quote=${shareEncodedText}` },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${shareEncodedText}&url=${shareEncodedUrl}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/shareArticle?mini=true&url=${shareEncodedUrl}` },
    { label: "WhatsApp", href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${bibleComUrl}`)}` },
    { label: "Pinterest", href: `https://www.pinterest.com/pin/create/button/?description=${shareEncodedText}&url=${shareEncodedUrl}` },
    { label: "Tumblr", href: `https://www.tumblr.com/share/link?name=${encodeURIComponent(shareTitle)}&description=${shareEncodedText}&url=${shareEncodedUrl}` },
    { label: "Line", href: `https://social-plugins.line.me/lineit/share?url=${shareEncodedUrl}` },
  ];

  const copyShareLink = () => {
    navigator.clipboard.writeText(bibleComUrl).then(() => {
      setShareLinkCopied(true);
      window.setTimeout(() => setShareLinkCopied(false), 1600);
    });
  };

  const compareVisibleRows = compareRows.filter((row) => compareLanguageFilter === "all" || row.language === compareLanguageFilter);
  const compareMissingRowsCount = compareVisibleRows.filter((row) => !row.hasContent).length;
  const compareDisplayRows = compareHideMissing ? compareVisibleRows.filter((row) => row.hasContent) : compareVisibleRows;
  const compareReferenceRow = compareVisibleRows.find((row) => row.abbr === compareReferenceAbbr && row.hasContent)
    || compareVisibleRows.find((row) => row.hasContent)
    || compareVisibleRows[0]
    || null;
  const compareReferenceMap = new Map((compareReferenceRow?.entries || []).map((entry) => [entry.verseNum, entry.text]));
  const compareComparableRows = compareDisplayRows.filter((row) => row.abbr !== (compareReferenceRow?.abbr || ""));
  const compareVerseNums = Array.from(
    new Set([
      ...(compareReferenceRow?.entries || []).map((entry) => entry.verseNum),
      ...compareComparableRows.flatMap((row) => row.entries.map((entry) => entry.verseNum)),
    ]),
  ).sort((a, b) => a - b);

  const downloadComparePdf = () => {
    if (!compareReferenceRow || compareComparableRows.length === 0 || compareVerseNums.length === 0) {
      alert(language === "fa" ? "برای خروجی PDF ابتدا آیات و ترجمه‌ها را انتخاب کنید." : "Select verses and translations before exporting PDF.");
      return;
    }
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const marginX = 40;
      const pageHeight = doc.internal.pageSize.getHeight();
      let cursorY = 44;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(`Bible Compare - ${selectedBookLabel} ${selectedRef}`, marginX, cursorY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      cursorY += 18;
      doc.text(`Reference: ${compareReferenceRow.abbr} - ${compareReferenceRow.name}`, marginX, cursorY);

      autoTable(doc, {
        startY: cursorY + 12,
        head: [["Verse", "Reference"]],
        body: compareVerseNums.map((verseNum) => [
          String(verseNum),
          compareReferenceMap.get(verseNum) || "-",
        ]),
        styles: { font: "helvetica", fontSize: 9, cellPadding: 4, overflow: "linebreak" },
        headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontStyle: "bold" },
        columnStyles: { 0: { cellWidth: 64 }, 1: { cellWidth: 430 } },
      });

      cursorY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || cursorY + 30;

      compareComparableRows.forEach((row) => {
        if (cursorY > pageHeight - 120) {
          doc.addPage();
          cursorY = 44;
        }

        cursorY += 18;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(`${row.abbr} - ${row.name}`, marginX, cursorY);

        autoTable(doc, {
          startY: cursorY + 8,
          head: [["Verse", row.abbr]],
          body: compareVerseNums.map((verseNum) => [
            String(verseNum),
            row.entries.find((entry) => entry.verseNum === verseNum)?.text || "-",
          ]),
          styles: { font: "helvetica", fontSize: 9, cellPadding: 4, overflow: "linebreak" },
          headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold" },
          columnStyles: { 0: { cellWidth: 64 }, 1: { cellWidth: 430 } },
        });

        cursorY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || cursorY + 24;
      });

      doc.save(`bible-compare-${selectedBook}-${selectedChapter}-${Date.now()}.pdf`);
    } catch {
      alert(language === "fa" ? "خطا در ساخت PDF. دوباره تلاش کنید." : "Failed to generate PDF. Please try again.");
    }
  };

  const loadCompareRows = useCallback(async () => {
    if (!selectedVerses.length || !versions.length) {
      setCompareRows([]);
      return;
    }

    setCompareLoading(true);
    setCompareError(null);

    try {
      const targetVerseNums = [...selectedVerses].map(v => v.verse_num).sort((a, b) => a - b);
      const versionsParam = encodeURIComponent(versions.map((version) => version.abbr).join(","));
      const versesParam = encodeURIComponent(targetVerseNums.join(","));
      const response = await fetch(`/api/bible/compare?book=${selectedBook}&chapter=${selectedChapter}&versions=${versionsParam}&verses=${versesParam}`);
      if (!response.ok) {
        throw new Error("Failed to load compare rows");
      }

      const data = await response.json();
      const rows: CompareVersionRow[] = data.rows || [];

      const sortedRows = rows.sort((a, b) => {
        if (a.language === b.language) return a.name.localeCompare(b.name);
        return a.language === "fa" ? -1 : 1;
      });

      setCompareRows(sortedRows);
      const preferredReference = sortedRows.find((row) => row.abbr === selectedVersionAbbr && row.hasContent);
      setCompareReferenceAbbr(preferredReference?.abbr || sortedRows.find((row) => row.hasContent)?.abbr || sortedRows[0]?.abbr || "");
    } catch {
      setCompareError(language === "fa" ? "خطا در دریافت داده‌های مقایسه" : "Failed to load comparison data");
      setCompareRows([]);
    } finally {
      setCompareLoading(false);
    }
  }, [language, selectedBook, selectedChapter, selectedVerses, selectedVersionAbbr, versions]);

  // ─── Render ──────────────────────────────────────────────────────────────────
  // The entire page root always uses dir="ltr" 
  // Only the Farsi text containers use dir="rtl" explicitly
  return (
    <div className="min-h-screen bg-[#0e0e0f] text-white flex flex-col" dir="ltr">
      <PublicHeader />
      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} />

      {/* ── Top Toolbar — Responsive wrapping for mobile ── */}
      <div className="sticky top-16 z-40 bg-[#0e0e0f]/95 backdrop-blur-xl border-b border-white/5 py-3 shadow-lg" dir="ltr">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center gap-2 md:gap-3">

          {/* Book Picker */}
          <div className="relative">
            <button
              onClick={() => {
                setShowBookList(v => !v);
                if (!showBookList) setShowChapterGrid(false);
              }}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3.5 py-2 text-xs md:text-sm font-bold transition-all min-w-[11rem] md:min-w-[14rem] max-w-[16rem] md:max-w-none"
            >
              <Book className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="flex items-center gap-1 min-w-0">
                {currentBook ? (
                  language === 'fa' 
                    ? <><span className="font-[Vazirmatn] text-sm md:text-base truncate">{currentBook.book_name_fa}</span> <span className="text-muted-foreground text-[11px] md:text-xs font-normal ml-1 border-l border-white/20 pl-2 opacity-70 hidden sm:inline">({currentBook.book_name_en})</span></>
                    : <span className="truncate">{currentBook.book_id} — {currentBook.book_name_en}</span>
                ) : selectedBook}
              </span>
              <List className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {showBookList && (
              <div className="absolute top-full mt-2 left-0 z-50 w-72 max-h-[70vh] overflow-y-auto bg-[#18181b] border border-white/20 rounded-2xl shadow-2xl p-3 flex flex-col gap-2 ring-1 ring-white/10" dir="ltr">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={bookSearch}
                    onChange={e => setBookSearch(e.target.value)}
                    placeholder={language === 'fa' ? "جستجوی کتاب..." : "Search books..."}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500/50"
                  />
                </div>

                {bookSearch ? (
                  <div className="flex flex-col gap-0.5">
                    {filteredBooks.map(b => (
                      <button
                        key={b.book_id}
                        onClick={() => { setSelectedBook(b.book_id); setSelectedChapter(1); setCurrentBook(b); setShowBookList(false); setBookSearch(""); }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-all hover:bg-white/10 ${selectedBook === b.book_id ? "bg-blue-500/20 text-blue-400 font-bold" : "text-zinc-200"}`}
                      >
                        {language === 'fa' ? (
                          <>
                            <span className="font-[Vazirmatn] font-medium text-[15px]" dir="rtl">{b.book_name_fa}</span>
                            <span className="text-xs text-muted-foreground" dir="ltr">{b.book_name_en}</span>
                          </>
                        ) : (
                          <>
                            <span><span className="text-muted-foreground text-xs mr-1">{b.book_id}</span> {b.book_name_en}</span>
                            <span className="font-[Vazirmatn] text-xs text-zinc-400" dir="rtl">{b.book_name_fa}</span>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/70 px-1 mt-1">{language === 'fa' ? "عهد عتیق — Old Testament" : "Old Testament — عهد عتیق"}</p>
                    {ot.map(b => (
                      <button key={b.book_id} onClick={() => { setSelectedBook(b.book_id); setSelectedChapter(1); setCurrentBook(b); setShowBookList(false); }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-all hover:bg-white/10 ${selectedBook === b.book_id ? "bg-blue-500/20 text-blue-400 font-bold" : "text-zinc-200"}`}>
                        {language === 'fa' ? (
                          <>
                            <span className="font-[Vazirmatn] font-medium text-[15px]" dir="rtl">{b.book_name_fa}</span>
                            <span className="text-xs text-muted-foreground" dir="ltr">{b.book_name_en}</span>
                          </>
                        ) : (
                          <>
                            <span><span className="text-muted-foreground text-xs mr-1">{b.book_id}</span> {b.book_name_en}</span>
                            <span className="font-[Vazirmatn] text-xs text-zinc-400" dir="rtl">{b.book_name_fa}</span>
                          </>
                        )}
                      </button>
                    ))}
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400/70 px-1 mt-2">{language === 'fa' ? "عهد جدید — New Testament" : "New Testament — عهد جدید"}</p>
                    {nt.map(b => (
                      <button key={b.book_id} onClick={() => { setSelectedBook(b.book_id); setSelectedChapter(1); setCurrentBook(b); setShowBookList(false); }}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-all hover:bg-white/10 ${selectedBook === b.book_id ? "bg-blue-500/20 text-blue-400 font-bold" : "text-zinc-200"}`}>
                        {language === 'fa' ? (
                          <>
                            <span className="font-[Vazirmatn] font-medium text-[15px]" dir="rtl">{b.book_name_fa}</span>
                            <span className="text-xs text-muted-foreground" dir="ltr">{b.book_name_en}</span>
                          </>
                        ) : (
                          <>
                            <span><span className="text-muted-foreground text-xs mr-1">{b.book_id}</span> {b.book_name_en}</span>
                            <span className="font-[Vazirmatn] text-xs text-zinc-400" dir="rtl">{b.book_name_fa}</span>
                          </>
                        )}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Chapter Selector — Grid Trigger */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden shrink-0 shadow-sm" dir="ltr">
            <button 
              onClick={prevChapter} 
              disabled={selectedChapter <= 1}
              className="p-2 hover:bg-white/10 transition-colors disabled:opacity-20" 
              aria-label="Previous chapter"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button 
              onClick={() => {
                setShowChapterGrid(true);
                setShowBookList(false);
              }}
              className="bg-white/5 hover:bg-white/10 text-xs md:text-sm font-bold px-3 md:px-4 py-2 transition-all border-x border-white/5 flex items-center gap-2"
            >
              <span className="text-blue-400">Ch.</span>
              <span>{selectedChapter}</span>
            </button>

            <button 
              onClick={nextChapter} 
              disabled={selectedChapter >= (currentBook?.chapter_count ?? 1)}
              className="p-2 hover:bg-white/10 transition-colors disabled:opacity-20" 
              aria-label="Next chapter"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* English version selector */}
          <select value={selectedVersionEn} onChange={e => setSelectedVersionEn(e.target.value)} aria-label="English Bible version" className="max-w-[92px] md:max-w-[120px] bg-white/5 border border-white/10 rounded-xl px-2 md:px-3 py-2 text-xs md:text-sm font-bold outline-none focus:border-blue-500/50 cursor-pointer shrink-0 [&>option]:bg-zinc-900 [&>option]:text-white">
            {englishVersions.map(v => <option key={v.abbr} value={v.abbr} title={v.name} className="bg-zinc-900 text-white">{v.hasAudio ? '🔊 ' : ''}{v.abbr}</option>)}
          </select>

          {/* Farsi version selector */}
          <select value={selectedVersionFa} onChange={e => setSelectedVersionFa(e.target.value)} aria-label="Farsi Bible version" className={`font-[Vazirmatn] max-w-[132px] md:max-w-[200px] truncate bg-white/5 border rounded-xl px-2 md:px-3 py-2 text-xs md:text-sm font-bold outline-none cursor-pointer shrink-0 [&>option]:bg-zinc-900 [&>option]:text-white ${persianVersions.length === 0 ? 'border-red-500/30 text-red-100' : 'border-purple-500/30 focus:border-purple-500'}`} dir="rtl">
            {persianVersions.length === 0
              ? <option value="" className="bg-zinc-900 text-white">— ترجمه‌ای یافت نشد —</option>
              : persianVersions.map(v => <option key={v.abbr} value={v.abbr} className="bg-zinc-900 text-white">{v.name} {v.hasAudio ? '🔊' : ''}</option>)
            }
          </select>

          {/* Reading Mode Switcher & Font Controls */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 shrink-0 shadow-sm" dir="ltr">
            <button onClick={() => setReadingMode("en")} className={`px-2.5 md:px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all ${readingMode === "en" ? "bg-blue-500 text-white shadow" : "text-muted-foreground hover:text-white"}`}>EN</button>
            <button onClick={() => setReadingMode("fa")} className={`px-2.5 md:px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all ${readingMode === "fa" ? "bg-purple-500 text-white shadow" : "text-muted-foreground hover:text-white"}`}>FA</button>
            <button onClick={() => setReadingMode("parallel")} className={`flex items-center gap-1 px-2.5 md:px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all ${readingMode === "parallel" ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow" : "text-muted-foreground hover:text-white"}`}>
              <Columns2 className="w-3 h-3" /> EN|FA
            </button>
            
            <div className="w-px h-5 bg-white/20 mx-1 shrink-0"></div>
            
            <button onClick={() => setFontSize(f => Math.max(12, f - 2))} className="px-2 py-1.5 rounded-lg text-[11px] md:text-xs font-bold text-muted-foreground hover:text-white transition-all hover:bg-white/10 shrink-0" title="Decrease font size">A-</button>
            <button onClick={() => setFontSize(f => Math.min(48, f + 2))} className="px-2 py-1.5 rounded-lg text-[11px] md:text-sm font-bold text-muted-foreground hover:text-white transition-all hover:bg-white/10 shrink-0" title="Increase font size">A+</button>
          </div>
        </div>
      </div>

      {/* ── Main Reader ── */}
      <main className="flex-1 pb-60 px-4 max-w-5xl w-full mx-auto pt-44 md:pt-32 relative" dir="ltr">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : (
          <>
            {/* Chapter Title — always LTR wrapper, but Farsi subtitle is RTL */}
            <div className="mb-10 text-center" dir="ltr">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-1">{currentBook?.book_name_en}</p>
              <h1 className="text-3xl font-black tracking-tight">Chapter {selectedChapter}</h1>
              {currentBook?.book_name_fa && (
                <p className="font-[Vazirmatn] mt-2 text-lg text-muted-foreground" dir="rtl">
                  {currentBook.book_name_fa} — باب {selectedChapter}
                </p>
              )}
            </div>

            {/* ── English Single ── */}
            {readingMode === "en" && (
              <div className="space-y-1 prose prose-invert max-w-none" dir="ltr" style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}>
                {verses.map((v: any) => {
                  const isSelected = selectedVerses.some(sv => sv.verse_num === v.verse_num);
                  return (
                    <span key={v.verse_num}>
                      {headingMap.has(v.verse_num) && (
                        <h3 className="text-base font-black text-blue-300 mt-8 mb-2 not-prose tracking-wide" dir="ltr">{headingMap.get(v.verse_num)}</h3>
                      )}
                      <span
                        dir="ltr"
                        className={`inline cursor-pointer rounded px-1 transition-all duration-200 ${isSelected ? "text-white" : "hover:bg-white/5 active:scale-95"}`}
                        style={selectedStyle(isSelected)}
                        onClick={() => toggleVerseSelection({ verse_num: v.verse_num, en: v.text, fa: null })}
                      >
                        <sup className="text-[0.6em] font-black text-blue-400/70 mr-1 select-none">{v.verse_num}</sup>
                        {v.text}{" "}
                      </span>
                    </span>
                  );
                })}
              </div>
            )}

            {/* ── Farsi Single ── */}
            {readingMode === "fa" && (
              <div className="space-y-1 text-right font-[Vazirmatn]" dir="rtl" style={{ fontSize: `${fontSize}px`, lineHeight: 2.2 }}>
                {faVerses.length === 0 ? (
                  <div className="text-center py-20 text-zinc-500">— ترجمه‌ای یافت نشد —</div>
                ) : (
                  faVerses.map((v: any) => {
                    const isSelected = selectedVerses.some(sv => sv.verse_num === v.verse_num);
                    return (
                      <span
                        key={v.verse_num}
                        className={`inline cursor-pointer rounded px-1 transition-all duration-200 ${isSelected ? "text-white" : "hover:bg-white/5 active:scale-95"}`}
                        style={selectedStyle(isSelected)}
                        onClick={() => toggleVerseSelection({ verse_num: v.verse_num, en: null, fa: v.text })}
                      >
                        <sup className="text-[0.6em] font-black text-purple-400/70 ml-1 select-none">{v.verse_num}</sup>
                        {v.text}{" "}
                      </span>
                    );
                  })
                )}
              </div>
            )}

            {/* ── Parallel (EN left | FA right) ── */}
            {readingMode === "parallel" && (
              <div className="space-y-6">
                {parallelVerses.map(v => {
                  const isSelected = selectedVerses.some(sv => sv.verse_num === v.verse_num);
                  return (
                    <div
                      key={v.verse_num}
                      className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 p-3 rounded-2xl transition-all duration-200 cursor-pointer ${isSelected ? "border" : "hover:bg-white/5"}`}
                      style={isSelected ? { backgroundColor: `${selectedHighlightColor}1f`, borderColor: `${selectedHighlightColor}66` } : undefined}
                      onClick={() => toggleVerseSelection(v)}
                    >
                      <div className="flex gap-3" dir="ltr">
                        <span className="text-xs font-black text-blue-500/60 mt-1 shrink-0">{v.verse_num}</span>
                        <p className="text-zinc-100 leading-relaxed font-sans" style={{ fontSize: `${fontSize}px` }}>{v.en}</p>
                      </div>
                      <div className="flex gap-3 text-right" dir="rtl">
                        <span className="text-xs font-black text-purple-500/60 mt-1 shrink-0">{v.verse_num}</span>
                        <p className="text-zinc-100 leading-relaxed font-[Vazirmatn]" style={{ fontSize: `${fontSize + 2}px` }}>{v.fa}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── YouVersion-style Selection Action Panel ── */}
      <div
        className={`fixed left-1/2 z-[999] w-[calc(100%-1rem)] max-w-[520px] -translate-x-1/2 rounded-t-3xl border border-white/10 bg-white text-zinc-900 shadow-2xl backdrop-blur-xl transition-all duration-300 ${selectedVerses.length > 0 ? "bottom-0 translate-y-0 opacity-100" : "-bottom-8 translate-y-10 opacity-0 pointer-events-none"}`}
        dir="rtl"
      >
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between rtl:flex-row-reverse rtl:text-end">
            <div className="flex flex-col -space-y-1">
              <p className="text-[13px] font-medium text-zinc-500">اکنون انتخاب شده:</p>
              <a className="flex items-center gap-1 no-underline" href={bibleComUrl} target="_blank" rel="noreferrer">
                <p className="text-[15px] font-bold text-zinc-900 font-[Vazirmatn] leading-tight">
                  {selectedBookLabel} {selectedRef} {selectedVersionAbbr.toLowerCase()}
                </p>
                <ExternalLink className="h-[18px] w-[18px]" />
              </a>
            </div>
            <button
              className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 hover:shadow"
              aria-label="انصراف"
              onClick={() => setSelectedVerses([])}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-2 flex flex-col divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-100">
            <div className="flex items-center justify-between bg-zinc-50/40 p-[14px] rtl:flex-row-reverse">
              <div className="flex w-full items-center gap-1 rtl:flex-row-reverse hover:cursor-default">
                <Highlighter className="h-5 w-5" />
                <p className="text-[15px] font-bold">های‌لایت</p>
              </div>
              <div className="flex w-full justify-start gap-3 rtl:flex-row-reverse">
                {highlightPalette.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`h-4 w-4 rounded-full ring-2 transition ${selectedHighlightColor === color ? "ring-zinc-700" : "ring-transparent"}`}
                    style={{ backgroundColor: color }}
                    aria-label={`highlight-${color}`}
                    onClick={() => setSelectedHighlightColor(color)}
                  />
                ))}
              </div>
            </div>

            <button className="flex items-center justify-between bg-white p-[14px] rtl:flex-row-reverse" onClick={copySelected}>
              <div className="flex w-full items-center gap-1 rtl:flex-row-reverse hover:cursor-pointer">
                <Copy className="h-5 w-5" />
                <p className="text-[15px] font-bold">کپی</p>
              </div>
              <div className="flex w-full gap-1.5 rtl:flex-row-reverse" />
            </button>

            <button
              className="flex items-center justify-between bg-white p-[14px] rtl:flex-row-reverse"
              onClick={() => {
                setShowCompareModal(true);
                void loadCompareRows();
              }}
            >
              <div className="flex w-full items-center gap-1 rtl:flex-row-reverse hover:cursor-pointer">
                <GitCompareArrows className="h-5 w-5" />
                <p className="text-[15px] font-bold">compare</p>
              </div>
              <div className="flex w-full gap-1.5 rtl:flex-row-reverse" />
            </button>

            <button className="flex items-center justify-between bg-white p-[14px] rtl:flex-row-reverse" onClick={shareSelected}>
              <div className="flex w-full items-center gap-1 rtl:flex-row-reverse hover:cursor-pointer">
                <Share2 className="h-5 w-5" />
                <p className="text-[15px] font-bold">به اشتراک گذاشتن</p>
              </div>
              <div className="flex w-full gap-1.5 rtl:flex-row-reverse" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Share Modal ── */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 10, opacity: 0 }}
              className="relative w-full max-w-[700px] rounded-3xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-2xl"
              dir="rtl"
              onClick={e => e.stopPropagation()}
            >
              <button
                className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                type="button"
                aria-label="close-modal-button"
                onClick={() => setShowShareModal(false)}
              >
                <X className="h-4 w-4" />
              </button>

              <h2 className="pb-2 pr-1 text-[23px] font-black leading-tight">به اشتراک گذاشتن</h2>

              <div className="mb-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="mb-1 text-[12px] font-bold text-zinc-500">پیش‌نمایش</p>
                <p className="mb-2 font-[Vazirmatn] text-sm font-bold text-zinc-900">{shareTitle}</p>
                <div className="max-h-28 space-y-1 overflow-y-auto rounded-xl bg-white p-3 text-[13px] leading-7 text-zinc-700">
                  {sharePreviewLines.length > 0 ? (
                    sharePreviewLines.map((line, index) => (
                      <p key={index} className="whitespace-pre-wrap">{line}</p>
                    ))
                  ) : (
                    <p className="text-zinc-400">متنی برای پیش‌نمایش وجود ندارد</p>
                  )}
                </div>
              </div>

              <div className="mb-3 rounded-2xl border border-zinc-200 p-1" dir="ltr">
                <div className="flex items-center gap-2 rounded-xl bg-zinc-100 px-2 py-1.5">
                  <button
                    type="button"
                    onClick={copyShareLink}
                    className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-zinc-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-700"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    <span>{shareLinkCopied ? "کپی شد" : "لینک را کپی کن"}</span>
                  </button>
                  <p className="truncate text-sm text-zinc-700">{bibleComUrl}</p>
                </div>
              </div>

              <div className="max-h-[46vh] space-y-1 overflow-y-auto pr-1" dir="ltr">
                {shareTargets.map(target => (
                  <a
                    key={target.label}
                    href={target.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl px-3 py-2 no-underline transition hover:bg-zinc-100"
                  >
                    <span className="text-sm font-semibold text-zinc-900">{target.label}</span>
                    <ExternalLink className="h-4 w-4 text-zinc-500" />
                  </a>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Internal Compare Modal (Database Driven) ── */}
      <AnimatePresence>
        {showCompareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setShowCompareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 10, opacity: 0 }}
              className="relative w-full max-w-[1000px] rounded-3xl border border-zinc-700 bg-zinc-950 p-4 text-zinc-100 shadow-2xl"
              dir="rtl"
              onClick={e => e.stopPropagation()}
            >
              <button
                className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                type="button"
                onClick={() => setShowCompareModal(false)}
                aria-label="close-compare-modal"
              >
                <X className="h-4 w-4" />
              </button>

              <h2 className="pb-1 text-[22px] font-black font-[Vazirmatn]">مقایسه ترجمه‌ها</h2>
              <p className="mb-3 text-sm text-zinc-400" dir="ltr">{selectedBookLabel} {selectedRef}</p>

              {!compareLoading && compareRows.length > 0 && (
                <div className="mb-3 grid gap-2 md:grid-cols-[1.3fr_auto]">
                  <div className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-3">
                    <label className="mb-1 block text-xs font-bold text-zinc-400">فیلتر زبان</label>
                    <select
                      value={compareLanguageFilter}
                      onChange={(event) => setCompareLanguageFilter(event.target.value as "all" | "en" | "fa")}
                      className="w-full rounded-xl border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm font-bold text-zinc-100 outline-none focus:border-blue-500"
                      dir="ltr"
                    >
                      <option value="all">All translations / همه ترجمه‌ها</option>
                      <option value="fa">فقط فارسی</option>
                      <option value="en">Only English</option>
                    </select>
                    <label className="mt-2 flex items-center gap-2 text-xs text-zinc-300" dir="rtl">
                      <input
                        type="checkbox"
                        checked={compareHideMissing}
                        onChange={(event) => setCompareHideMissing(event.target.checked)}
                        className="h-4 w-4 rounded border-zinc-600 bg-zinc-950 text-blue-500"
                      />
                      <span>فقط ترجمه‌هایی که متن آیه دارند نمایش داده شود</span>
                    </label>
                    {compareMissingRowsCount > 0 && (
                      <p className="mt-2 text-[11px] text-amber-300">
                        {compareMissingRowsCount} ترجمه برای این آیه در دیتابیس متن ندارند و با `-` نمایش داده می‌شوند.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={downloadComparePdf}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-400/30 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:brightness-110 hover:shadow-blue-500/30"
                  >
                    <ExternalLink className="h-4 w-4" />
                    دانلود PDF
                  </button>
                </div>
              )}

              {!compareLoading && compareRows.length > 0 && (
                <div className="mb-3 rounded-2xl border border-zinc-700 bg-zinc-900/70 p-3">
                  <label className="mb-1 block text-xs font-bold text-zinc-400">ترجمه مرجع</label>
                  <select
                    value={compareReferenceRow?.abbr || compareReferenceAbbr}
                    onChange={(event) => setCompareReferenceAbbr(event.target.value)}
                    className="w-full rounded-xl border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm font-bold text-zinc-100 outline-none focus:border-blue-500"
                    dir="ltr"
                  >
                    {compareVisibleRows.map((row) => (
                      <option key={row.abbr} value={row.abbr}>{row.abbr} - {row.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {compareLoading ? (
                <div className="flex items-center justify-center py-14">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-400" />
                </div>
              ) : compareError ? (
                <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">{compareError}</div>
              ) : (
                <div className="max-h-[70vh] overflow-hidden">
                  {compareReferenceRow && (
                    <div className="sticky top-0 z-20 mb-3 rounded-2xl border border-amber-500/30 bg-zinc-950/95 p-3 backdrop-blur-sm">
                      <div className="mb-2 flex items-center justify-between" dir="ltr">
                        <h3 className="text-sm font-black text-amber-300">Reference: {compareReferenceRow.abbr} - {compareReferenceRow.name}</h3>
                        <span className="rounded-lg bg-amber-500/20 px-2 py-0.5 text-[11px] font-black text-amber-300">مرجع</span>
                      </div>
                      {compareReferenceRow.hasContent ? (
                        <div className="space-y-2 text-sm leading-7 text-zinc-100" dir={compareReferenceRow.language === "fa" ? "rtl" : "ltr"}>
                          {compareReferenceRow.entries.map((entry) => (
                            <p key={`ref-${entry.verseNum}`}><span className="font-black text-amber-300">{entry.verseNum}. </span>{entry.text}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400">Reference has no verse content</p>
                      )}
                    </div>
                  )}

                  <div className="h-[calc(70vh-170px)] min-h-[320px] overflow-y-auto pr-1">
                    <div className="mb-3 rounded-2xl border border-zinc-700 bg-zinc-900/70 p-3 text-xs text-zinc-400">
                      {compareLanguageFilter === "all" ? "All languages" : compareLanguageFilter === "fa" ? "فقط فارسی" : "Only English"} · {compareDisplayRows.length} ترجمه
                    </div>

                    {compareVisibleRows.length === 0 ? (
                      <div className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-4 text-sm text-zinc-300">
                        {language === "fa" ? "هیچ ترجمه‌ای با این فیلتر پیدا نشد." : "No translations match this filter."}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {compareComparableRows.map((row) => (
                          <div key={row.abbr} className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-3">
                          <div className="mb-2 flex items-center justify-between" dir="ltr">
                            <h3 className="text-sm font-bold text-blue-300">{row.abbr} - {row.name}</h3>
                            <span className="rounded-lg bg-blue-500/15 px-2 py-0.5 text-[11px] font-black text-blue-300">Compare</span>
                          </div>

                          <div className="overflow-hidden rounded-xl border border-zinc-700">
                            <div className="grid grid-cols-[64px_1fr] bg-zinc-800/70 text-[11px] font-black text-zinc-300" dir="ltr">
                              <div className="border-r border-zinc-700 px-2 py-1.5">Verse</div>
                              <div className="px-2 py-1.5">{row.abbr}</div>
                            </div>

                            {compareVerseNums.map((verseNum) => {
                              const targetText = row.entries.find((entry) => entry.verseNum === verseNum)?.text || "";
                              return (
                                <div key={`${row.abbr}-${verseNum}`} className="grid grid-cols-[64px_1fr] border-t border-zinc-800/80 text-sm">
                                  <div className="border-r border-zinc-800 px-2 py-2 font-black text-zinc-400" dir="ltr">{verseNum}</div>
                                  <div className="px-2 py-2 text-zinc-100" dir={row.language === "fa" ? "rtl" : "ltr"}>
                                    {targetText || <span className="text-zinc-500 text-xs">-</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sticky Audio Player — always LTR, hover above Mobile Bottom Nav ── */}
      {audioTracks.length > 0 && (
        <div className="fixed bottom-20 md:bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-2xl border-y md:border-b-0 md:border-t border-white/10 px-4 py-3 shadow-2xl" dir="ltr">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center gap-3 md:gap-6" dir="ltr">
            {/* Row 1: icon | title/subtitle | play btn */}
            <div className="flex items-center gap-4 flex-1" dir="ltr">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <Music2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0" dir="ltr">
                <p className="text-sm font-bold truncate">{currentBook?.book_name_en} — Ch. {selectedChapter}</p>
                <p className="text-xs text-muted-foreground truncate">{audioTracks[selectedTrackIdx]?.title}</p>
              </div>
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="w-11 h-11 shrink-0 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center shadow-xl shadow-blue-500/30 transition-all hover:scale-105"
              >
                {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
              </button>
            </div>

            {/* Row 2: seekbar — always LTR */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-1 w-full" dir="ltr">
              <span className="w-9 text-right tabular-nums">{formatTime(audioProgress)}</span>
              <div className="relative flex-1 h-3 flex items-center group touch-none mx-2">
                <input
                  type="range"
                  min={0}
                  max={audioDuration || 100}
                  value={audioProgress}
                  onChange={handleSeek}
                  aria-label="Audio playback progress"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  dir="ltr"
                />
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full pointer-events-none" style={{ width: `${(audioProgress / (audioDuration || 1)) * 100}%` }} />
                </div>
              </div>
              <span className="w-9 tabular-nums">{formatTime(audioDuration)}</span>
            </div>

            {/* Row 3: Track variants */}
            {audioTracks.length > 1 && (
              <div className="flex gap-2 flex-wrap items-center justify-center md:hidden" dir="ltr">
                {audioTracks.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedTrackIdx(i); setIsPlaying(true); }}
                    className={`text-[10px] px-3 py-1 rounded-full border transition-all font-bold ${selectedTrackIdx === i ? "bg-blue-500 border-blue-500 text-white" : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"}`}
                  >
                    {t.dramatized ? "Dramatized" : "Standard"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom Chapter Nav — Prev LEFT, Next RIGHT, always LTR ── */}
      <div
        className={`fixed ${audioTracks.length > 0 ? "bottom-52 md:bottom-24" : "bottom-24 md:bottom-6"} left-0 right-0 z-40 flex items-center justify-center gap-2 md:gap-3 pointer-events-none transition-all duration-500`}
        dir="ltr"
      >
        {/* Prev (left) */}
        <button
          onClick={prevChapter}
          disabled={selectedChapter <= 1}
          className="pointer-events-auto flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold shadow-xl disabled:opacity-30 hover:border-white/20 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev</span>
          <span className="font-[Vazirmatn] text-muted-foreground text-xs ml-1">(قبلی)</span>
        </button>

        {/* Current chapter badge */}
        <span className="pointer-events-none bg-zinc-900/90 backdrop-blur border border-white/10 px-4 py-2 rounded-full text-[11px] font-black text-muted-foreground shadow-sm">
          {selectedChapter} / {currentBook?.chapter_count ?? "—"}
        </span>

        {/* Next (right) */}
        <button
          onClick={nextChapter}
          disabled={selectedChapter >= (currentBook?.chapter_count ?? 1)}
          className="pointer-events-auto flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur border border-white/10 px-5 py-2.5 rounded-full text-sm font-bold shadow-xl disabled:opacity-30 hover:border-white/20 transition-all"
        >
          <span>Next</span>
          <span className="font-[Vazirmatn] text-muted-foreground text-xs mr-1">(بعدی)</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Chapter Grid Overlay ── */}
      <AnimatePresence>
        {showChapterGrid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setShowChapterGrid(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-zinc-900/90 border border-white/20 rounded-[2.5rem] p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl relative custom-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowChapterGrid(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-black tracking-tighter mb-1 uppercase opacity-30">Select Chapter</h2>
                <div className="flex items-center justify-center gap-2">
                  <span className="h-px w-8 bg-blue-500/50"></span>
                  <p className="text-lg font-bold text-blue-400">
                    {language === 'fa' ? currentBook?.book_name_fa : currentBook?.book_name_en}
                  </p>
                  <span className="h-px w-8 bg-blue-500/50"></span>
                </div>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
                {Array.from({ length: currentBook?.chapter_count ?? 1 }, (_, i) => i + 1).map(chapNum => (
                  <motion.button
                    key={chapNum}
                    whileHover={{ scale: 1.1, backgroundColor: "rgba(59, 130, 246, 0.2)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedChapter(chapNum);
                      setShowChapterGrid(false);
                    }}
                    className={`aspect-square flex items-center justify-center text-lg font-black rounded-2xl transition-all border ${
                      selectedChapter === chapNum 
                        ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]" 
                        : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {chapNum}
                  </motion.button>
                ))}
              </div>

              <div className="mt-10 pt-6 border-t border-white/5 text-center">
                <p className="text-xs text-zinc-500 font-medium tracking-widest uppercase">
                  {currentBook?.chapter_count} Chapters in total
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
