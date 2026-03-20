"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Book, Music2, ChevronLeft, ChevronRight, Play, Pause,
  Columns2, Search, Loader2, List, Languages, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

  const copySelected = () => {
    const text = selectedVerses.map(v => {
      const content = readingMode === 'parallel' ? `${v.en} | ${v.fa}` : (readingMode === 'fa' ? v.fa : v.en);
      return `(${v.verse_num}) ${content}`;
    }).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      alert(language === 'fa' ? "آیات کپی شدند" : "Verses copied to clipboard");
      setSelectedVerses([]);
    });
  };

  const shareSelected = () => {
    const text = selectedVerses.map(v => {
      const content = readingMode === 'parallel' ? `${v.en} | ${v.fa}` : (readingMode === 'fa' ? v.fa : v.en);
      return `(${v.verse_num}) ${content}`;
    }).join('\n');
    if (navigator.share) {
      navigator.share({ title: 'Mychurch Bible', text }).catch(console.error);
    } else {
      copySelected();
    }
  };

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
              onClick={() => setShowBookList(v => !v)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold transition-all"
            >
              <Book className="w-4 h-4 text-blue-400" />
              <span className="flex items-center gap-1">
                {currentBook ? (
                  language === 'fa' 
                    ? <><span className="font-[Vazirmatn] text-base">{currentBook.book_name_fa}</span> <span className="text-muted-foreground text-xs font-normal ml-1 border-l border-white/20 pl-2 opacity-70">({currentBook.book_name_en})</span></>
                    : `${currentBook.book_id} — ${currentBook.book_name_en}`
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
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden" dir="ltr">
            <button 
              onClick={prevChapter} 
              disabled={selectedChapter <= 1}
              className="p-2.5 hover:bg-white/10 transition-colors disabled:opacity-20" 
              aria-label="Previous chapter"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button 
              onClick={() => setShowChapterGrid(true)}
              className="bg-white/5 hover:bg-white/10 text-sm font-bold px-4 py-2 transition-all border-x border-white/5 flex items-center gap-2"
            >
              <span className="text-blue-400">Ch.</span>
              <span>{selectedChapter}</span>
            </button>

            <button 
              onClick={nextChapter} 
              disabled={selectedChapter >= (currentBook?.chapter_count ?? 1)}
              className="p-2.5 hover:bg-white/10 transition-colors disabled:opacity-20" 
              aria-label="Next chapter"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* English version selector */}
          <select value={selectedVersionEn} onChange={e => setSelectedVersionEn(e.target.value)} aria-label="English Bible version" className="max-w-[100px] md:max-w-[120px] bg-white/5 border border-white/10 rounded-xl px-2 md:px-3 py-2.5 text-sm font-bold outline-none focus:border-blue-500/50 cursor-pointer [&>option]:bg-zinc-900 [&>option]:text-white">
            {englishVersions.map(v => <option key={v.abbr} value={v.abbr} title={v.name} className="bg-zinc-900 text-white">{v.hasAudio ? '🔊 ' : ''}{v.abbr}</option>)}
          </select>

          {/* Farsi version selector */}
          <select value={selectedVersionFa} onChange={e => setSelectedVersionFa(e.target.value)} aria-label="Farsi Bible version" className={`font-[Vazirmatn] max-w-[140px] md:max-w-[200px] truncate bg-white/5 border rounded-xl px-2 md:px-3 py-2.5 text-sm font-bold outline-none cursor-pointer [&>option]:bg-zinc-900 [&>option]:text-white ${persianVersions.length === 0 ? 'border-red-500/30 text-red-100' : 'border-purple-500/30 focus:border-purple-500'}`} dir="rtl">
            {persianVersions.length === 0
              ? <option value="" className="bg-zinc-900 text-white">— ترجمه‌ای یافت نشد —</option>
              : persianVersions.map(v => <option key={v.abbr} value={v.abbr} className="bg-zinc-900 text-white">{v.name} {v.hasAudio ? '🔊' : ''}</option>)
            }
          </select>

          {/* Reading Mode Switcher & Font Controls */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 shrink-0" dir="ltr">
            <button onClick={() => setReadingMode("en")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${readingMode === "en" ? "bg-blue-500 text-white shadow" : "text-muted-foreground hover:text-white"}`}>EN</button>
            <button onClick={() => setReadingMode("fa")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${readingMode === "fa" ? "bg-purple-500 text-white shadow" : "text-muted-foreground hover:text-white"}`}>FA</button>
            <button onClick={() => setReadingMode("parallel")} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${readingMode === "parallel" ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow" : "text-muted-foreground hover:text-white"}`}>
              <Columns2 className="w-3 h-3" /> EN|FA
            </button>
            
            <div className="w-px h-5 bg-white/20 mx-1 shrink-0"></div>
            
            <button onClick={() => setFontSize(f => Math.max(12, f - 2))} className="px-2 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-white transition-all hover:bg-white/10 shrink-0" title="Decrease font size">A-</button>
            <button onClick={() => setFontSize(f => Math.min(48, f + 2))} className="px-2 py-1.5 rounded-lg text-sm font-bold text-muted-foreground hover:text-white transition-all hover:bg-white/10 shrink-0" title="Increase font size">A+</button>
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
                        className={`inline cursor-pointer rounded px-1 transition-all duration-200 ${isSelected ? "bg-amber-500/30 text-amber-200 border-b-2 border-amber-500" : "hover:bg-white/5 active:scale-95"}`}
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
                        className={`inline cursor-pointer rounded px-1 transition-all duration-200 ${isSelected ? "bg-amber-500/30 text-amber-100 border-b-2 border-amber-500" : "hover:bg-white/5 active:scale-95"}`}
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
                      className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 p-3 rounded-2xl transition-all duration-200 cursor-pointer ${isSelected ? "bg-amber-500/10 border border-amber-500/30" : "hover:bg-white/5"}`}
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

      {/* ── Contextual Action Bar ── */}
      <div 
        className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275) ${selectedVerses.length > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20 pointer-events-none"}`}
      >
        <div className="bg-amber-500 text-black px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-6 font-bold">
          <span className="text-sm font-black border-r border-black/20 pr-4">
            {selectedVerses.length} {language === 'fa' ? "آیه انتخاب شد" : "verses selected"}
          </span>
          <button onClick={copySelected} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <span>📋</span> {language === 'fa' ? "کپی" : "Copy"}
          </button>
          <button onClick={shareSelected} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <span>🔗</span> {language === 'fa' ? "اشتراک" : "Share"}
          </button>
          <button onClick={() => setSelectedVerses([])} className="ml-2 text-black/50 hover:text-black">
            ✕
          </button>
        </div>
      </div>

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
        <span className="pointer-events-none bg-zinc-900/90 backdrop-blur border border-white/10 px-4 py-2.5 rounded-full text-xs font-black text-muted-foreground">
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

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
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
