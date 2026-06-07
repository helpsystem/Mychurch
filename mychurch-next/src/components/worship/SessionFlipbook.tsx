"use client";

import React, { useRef, useState, useMemo } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight, BookOpen, Music, Book, Calendar, Info, HelpCircle } from 'lucide-react';
import { BroadcastSession, Slide, SlideType, LyricsLine, ScripturePage } from '@/types/broadcast';
import { cn } from '@/lib/utils';

// Helper to format date in Persian
function formatPersianDate(dateStr?: string | Date): string {
    if (!dateStr) return "";
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    return date.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
}

// ─── Individual Page Components ───

// 1. Cover Page Component
const BookCover = React.forwardRef<HTMLDivElement, { session: BroadcastSession }>(({ session }, ref) => {
    return (
        <div ref={ref} className="relative w-full h-full bg-gradient-to-br from-[#2c1b18] via-[#4a2e2b] to-[#1c100f] flex flex-col items-center justify-between text-[#ebdcb9] select-none overflow-hidden rounded-l-2xl shadow-2xl p-8 font-[Vazirmatn]">
            {/* Gilded Border Frame */}
            <div className="absolute inset-4 border-2 border-[#d4af37]/30 rounded-lg pointer-events-none" />
            <div className="absolute inset-5 border border-[#d4af37]/10 rounded pointer-events-none" />
            
            {/* Decorative Corner Ornaments */}
            <div className="absolute top-6 left-6 w-4 h-4 border-t-2 border-l-2 border-[#d4af37]/60" />
            <div className="absolute top-6 right-6 w-4 h-4 border-t-2 border-r-2 border-[#d4af37]/60" />
            <div className="absolute bottom-6 left-6 w-4 h-4 border-b-2 border-l-2 border-[#d4af37]/60" />
            <div className="absolute bottom-6 right-6 w-4 h-4 border-b-2 border-r-2 border-[#d4af37]/60" />

            {/* Subtle Cross watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <BookOpen className="w-80 h-80" />
            </div>

            <div className="w-full text-center mt-10 z-10">
                <span className="text-xs uppercase tracking-widest text-[#d4af37] font-bold">نشریه دیجیتال جلسات</span>
                <div className="w-12 h-0.5 bg-[#d4af37]/40 mx-auto my-3" />
                <h1 className="text-2xl font-black leading-normal drop-shadow-md mt-4 px-4">
                    {session.title || "دفترچه راهنمای جلسه"}
                </h1>
            </div>

            <div className="flex flex-col items-center gap-2 z-10">
                <img src="/logo-transparent.png" alt="Church Logo" className="w-20 h-20 object-contain drop-shadow-xl opacity-80" />
                <p className="text-sm font-semibold text-[#d4af37] mt-2">کلیسای ایرانیان واشنگتن دی‌سی</p>
                <p className="text-[10px] opacity-40 font-mono tracking-wider">IRANIAN CHURCH DC</p>
            </div>

            <div className="w-full text-center mb-8 z-10">
                <p className="text-xs text-[#ebdcb9]/60">{formatPersianDate(session.date)}</p>
                {session.hostName && (
                    <p className="text-xs text-[#d4af37]/80 mt-1">
                        رهبر جلسه: <span className="font-bold">{session.hostName}</span>
                    </p>
                )}
                <div className="text-[10px] text-[#d4af37]/50 mt-8 animate-pulse">
                    برای ورق زدن بکشید یا کلیک کنید ←
                </div>
            </div>
        </div>
    );
});
BookCover.displayName = 'BookCover';

// 2. Table of Contents / Index Page
const BookIndex = React.forwardRef<HTMLDivElement, { session: BroadcastSession, pagesMetadata: any[] }>(
    ({ session, pagesMetadata }, ref) => {
        // Find slide page indexes
        const indexItems = useMemo(() => {
            const items: { title: string; pageNum: number; icon: React.ReactNode }[] = [];
            let lastSlideId = '';
            pagesMetadata.forEach((meta) => {
                if (meta.slideId && meta.slideId !== lastSlideId) {
                    lastSlideId = meta.slideId;
                    items.push({
                        title: meta.title,
                        pageNum: meta.displayPageNum,
                        icon: meta.type === 'LYRICS' ? <Music className="w-3.5 h-3.5" /> : 
                              meta.type === 'SCRIPTURE' ? <Book className="w-3.5 h-3.5" /> :
                              <Info className="w-3.5 h-3.5" />
                    });
                }
            });
            return items;
        }, [pagesMetadata]);

        return (
            <div ref={ref} className="relative w-full h-full bg-[#fdfaf2] text-[#2c241e] flex flex-col justify-between p-8 select-none shadow-inner font-[Vazirmatn]">
                <div className="absolute top-0 right-0 left-0 h-1 bg-[#d4af37]/30" />
                
                <div className="flex-1 flex flex-col justify-start">
                    <h2 className="text-lg font-black text-[#5c4033] mb-6 pb-2 border-b-2 border-[#e6dfc6] flex items-center gap-2">
                        <span>فهرست مطالب جلسه</span>
                    </h2>

                    <div className="space-y-4 overflow-y-auto max-h-[320px] pr-1">
                        {indexItems.length === 0 ? (
                            <p className="text-xs text-stone-400 italic text-center py-10">محتوایی برای نمایش یافت نشد.</p>
                        ) : (
                            indexItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs group">
                                    <div className="flex items-center gap-2 text-stone-600 font-medium">
                                        <span className="text-[#a47c5c]">{item.icon}</span>
                                        <span className="hover:text-[#2c241e] transition-colors">{item.title}</span>
                                    </div>
                                    <div className="flex-1 border-b border-dashed border-[#e6dfc6] mx-2 h-1" />
                                    <span className="font-mono text-[#a47c5c] font-bold">ص {item.pageNum}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="text-center pt-4 border-t border-[#e6dfc6] text-[10px] text-stone-400">
                    «کلام خدا زنده و مؤثر است و برنده‌تر از هر شمشیر دو دم» — عبرانیان ۴:۱۲
                </div>
            </div>
        );
    }
);
BookIndex.displayName = 'BookIndex';

// 3. Lyrics (Worship Songs) Page
interface LyricsPageProps {
    title: string;
    subTitle?: string;
    lines: LyricsLine[];
    pageNum: number;
    totalSongPages: number;
    songPageIdx: number;
}
const LyricsPage = React.forwardRef<HTMLDivElement, LyricsPageProps>(
    ({ title, subTitle, lines, pageNum, totalSongPages, songPageIdx }, ref) => {
        return (
            <div ref={ref} className="relative w-full h-full bg-[#fdfaf2] text-[#2c241e] flex flex-col justify-between p-8 select-none shadow-inner font-[Vazirmatn]">
                <div className="absolute top-0 right-0 left-0 h-1 bg-[#8b5cf6]/30" />

                <div className="flex-1 flex flex-col">
                    {/* Song Header */}
                    <div className="mb-4 pb-2 border-b border-[#ebdcb9] flex items-start justify-between">
                        <div>
                            <span className="text-[9px] bg-[#8b5cf6]/10 text-[#7c3aed] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider mb-1 inline-block">
                                سرود پرستشی
                            </span>
                            <h3 className="text-sm font-black text-[#5c4033] leading-snug">
                                {title}
                            </h3>
                            {subTitle && (
                                <p className="text-[10px] text-stone-400 font-sans mt-0.5" dir="ltr">{subTitle}</p>
                            )}
                        </div>
                        <Music className="w-5 h-5 text-[#8b5cf6]/40 shrink-0 mt-1" />
                    </div>

                    {/* Lyric Lines Layout */}
                    <div className="flex-1 flex flex-col justify-center gap-1.5 overflow-hidden">
                        {lines.map((line, idx) => {
                            const isChorus = line.isChorus;
                            return (
                                <div
                                    key={idx}
                                    className={cn(
                                        "text-xs leading-relaxed text-center py-1 rounded transition-colors",
                                        isChorus 
                                            ? "bg-[#ebdcb9]/40 border-r-2 border-[#d4af37] font-bold px-2 py-1.5 my-1 text-[#4a2e2b]"
                                            : "text-stone-700"
                                    )}
                                >
                                    {line.text}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#e6dfc6] text-[10px] text-stone-400">
                    <span>کتابچه دیجیتال MyChurch</span>
                    <span className="font-sans">بخش {songPageIdx + 1} از {totalSongPages}</span>
                </div>
            </div>
        );
    }
);
LyricsPage.displayName = 'LyricsPage';

// 4. Scripture (Bible Reading) Page
interface ScripturePageProps {
    page: ScripturePage;
    pageNum: number;
}
const ScriptureBookPage = React.forwardRef<HTMLDivElement, ScripturePageProps>(
    ({ page, pageNum }, ref) => {
        return (
            <div ref={ref} className="relative w-full h-full bg-[#faf5e6] text-[#2c241e] flex flex-col justify-between p-8 select-none shadow-inner font-[Vazirmatn]">
                <div className="absolute top-0 right-0 left-0 h-1 bg-[#10b981]/30" />

                <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <div className="mb-4 pb-2 border-b border-[#ebdcb9] flex items-center justify-between">
                        <div>
                            <span className="text-[9px] bg-[#10b981]/10 text-[#059669] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider mb-1 inline-block">
                                قرائت کتاب مقدس
                            </span>
                            <h3 className="text-sm font-black text-[#5c4033] leading-snug">
                                {page.bookName.fa} — باب {page.chapter}
                            </h3>
                        </div>
                        <Book className="w-5 h-5 text-[#10b981]/40 shrink-0" />
                    </div>

                    {/* Verses Container */}
                    <div className="flex-1 overflow-y-auto max-h-[300px] pr-1 space-y-4">
                        {/* Persian Text */}
                        <div className="space-y-2" dir="rtl">
                            <p className="text-xs font-black text-[#8c6239] border-r-2 border-[#8c6239]/30 pr-2">ترجمه فارسی</p>
                            <div className="text-xs leading-relaxed text-stone-700 space-y-2 font-[Vazirmatn]">
                                {page.textPrimary.map((verse, idx) => {
                                    const vNum = page.verseNumbers[idx];
                                    return (
                                        <p key={idx} className="indent-4 text-justify">
                                            <span className="font-bold text-[#8c6239] font-mono ml-1">[{vNum}]</span>
                                            {verse}
                                        </p>
                                    );
                                })}
                            </div>
                        </div>

                        {/* English Text if exists */}
                        {page.textSecondary && page.textSecondary.length > 0 && (
                            <div className="space-y-2 mt-4 pt-4 border-t border-[#ebdcb9]/40" dir="ltr">
                                <p className="text-[10px] font-black text-[#8c6239] border-l-2 border-[#8c6239]/30 pl-2 uppercase font-sans">English Translation</p>
                                <div className="text-[11px] leading-relaxed text-stone-600 space-y-2 font-serif text-justify">
                                    {page.textSecondary.map((verse, idx) => {
                                        const vNum = page.verseNumbers[idx];
                                        return (
                                            <p key={idx}>
                                                <span className="font-bold text-[#8c6239] font-mono mr-1">[{vNum}]</span>
                                                {verse}
                                            </p>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#e6dfc6] text-[10px] text-stone-400">
                    <span>کتابچه دیجیتال MyChurch</span>
                    <span className="font-sans">آیات {page.verses}</span>
                </div>
            </div>
        );
    }
);
ScriptureBookPage.displayName = 'ScriptureBookPage';

// 5. Generic Slide Page (Sermons, Announcements, Prayers)
interface GenericBookPageProps {
    title: string;
    type: SlideType;
    htmlContent: string;
    pageNum: number;
}
const GenericBookPage = React.forwardRef<HTMLDivElement, GenericBookPageProps>(
    ({ title, type, htmlContent, pageNum }, ref) => {
        // Strip basic html tags if needed, or render safely
        const typeBadge = type === SlideType.ANNOUNCEMENT ? 'اعلان کلیسا' :
                          type === SlideType.PRAYER ? 'درخواست دعا' : 'پیام هفته';

        const badgeColor = type === SlideType.ANNOUNCEMENT ? 'from-amber-500 to-orange-500 bg-amber-500/10 text-amber-700' :
                           type === SlideType.PRAYER ? 'from-pink-500 to-rose-500 bg-pink-500/10 text-pink-700' :
                           'from-blue-500 to-cyan-500 bg-blue-500/10 text-blue-700';

        return (
            <div ref={ref} className="relative w-full h-full bg-[#fdfaf2] text-[#2c241e] flex flex-col justify-between p-8 select-none shadow-inner font-[Vazirmatn]">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r opacity-50" style={{ backgroundImage: `linear-gradient(to right, ${badgeColor.split(' ')[0].replace('from-', '')}, ${badgeColor.split(' ')[1].replace('to-', '')})` }} />

                <div className="flex-1 flex flex-col">
                    <div className="mb-4 pb-2 border-b border-[#ebdcb9] flex items-center justify-between">
                        <div>
                            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider mb-1 inline-block", badgeColor.split(' ').slice(2).join(' '))}>
                                {typeBadge}
                            </span>
                            <h3 className="text-sm font-black text-[#5c4033] leading-snug">
                                {title}
                            </h3>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[300px] pr-1 text-xs leading-relaxed text-stone-700 font-[Vazirmatn] text-justify whitespace-pre-line">
                        {/* Safe raw output */}
                        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#e6dfc6] text-[10px] text-stone-400">
                    <span>کتابچه دیجیتال MyChurch</span>
                    <span>صفحه {pageNum}</span>
                </div>
            </div>
        );
    }
);
GenericBookPage.displayName = 'GenericBookPage';

// 6. Back Cover Page Component
const BookBackCover = React.forwardRef<HTMLDivElement, {}>((_, ref) => {
    return (
        <div ref={ref} className="relative w-full h-full bg-gradient-to-br from-[#1c100f] via-[#4a2e2b] to-[#2c1b18] flex flex-col items-center justify-center text-[#ebdcb9] select-none overflow-hidden rounded-r-2xl shadow-2xl p-8 font-[Vazirmatn]">
            <div className="absolute inset-4 border-2 border-[#d4af37]/30 rounded-lg pointer-events-none" />
            <div className="absolute inset-5 border border-[#d4af37]/10 rounded pointer-events-none" />

            <BookOpen className="w-16 h-16 text-[#d4af37]/20 mb-6" />

            <div className="text-center px-4 max-w-xs space-y-4">
                <p className="text-xs text-[#ebdcb9]/80 italic leading-relaxed">
                    «اما تو در همه‌چیز هشیار باش، رنج را تحمل کن، کار تبشیر را انجام ده و خدمت خود را به کمال رسان.»
                </p>
                <p className="text-[10px] text-[#d4af37]/60 font-bold">دوم تیموتائوس ۴:۵</p>
            </div>

            <div className="absolute bottom-12 flex flex-col items-center gap-1.5 text-[10px] text-[#ebdcb9]/40">
                <p className="font-sans">www.iranianchurchdc.com</p>
                <p className="opacity-80">واشنگتن دی‌سی، ایالات متحده</p>
            </div>
        </div>
    );
});
BookBackCover.displayName = 'BookBackCover';

// ─── Main Session Flipbook Component ───

interface SessionFlipbookProps {
    session: BroadcastSession;
    onClose?: () => void;
}

export function SessionFlipbook({ session, onClose }: SessionFlipbookProps) {
    const bookRef = useRef<any>(null);
    const [page, setPage] = useState(0);

    // ── Generate Page Arrays dynamically ──
    const bookPages = useMemo(() => {
        const pages: React.ReactNode[] = [];
        const metadata: any[] = [];
        let globalPageCounter = 3; // Pages 1 & 2 are Cover & Index

        // Loop through slides and generate page components
        session.slides.forEach((slide) => {
            if (slide.type === SlideType.LYRICS) {
                const content = slide.content as any;
                const songTitle = content.titleFa || content.title || "سرود پرستش";
                const songSubTitle = content.titleEn || content.titleFa ? content.title : undefined;
                const lines = content.lines || [];

                if (lines.length === 0) return;

                // Professional Paginated Lyrics Chunking
                // Chunk lines into logical pages (approx. 8 lines per page)
                const lyricsPages: LyricsLine[][] = [];
                let currentChunk: LyricsLine[] = [];
                
                lines.forEach((line: LyricsLine) => {
                    // Start new chunk if we exceed 8 lines, or if it is a chorus transition
                    if (currentChunk.length >= 8 || (line.isChorus && currentChunk.length > 0 && !currentChunk[currentChunk.length - 1].isChorus)) {
                        lyricsPages.push(currentChunk);
                        currentChunk = [line];
                    } else {
                        currentChunk.push(line);
                    }
                });
                if (currentChunk.length > 0) {
                    lyricsPages.push(currentChunk);
                }

                // Push each chunk as a booklet page
                lyricsPages.forEach((chunkLines, idx) => {
                    pages.push(
                        <LyricsPage
                            key={`slide-${slide.id}-p-${idx}`}
                            title={songTitle}
                            subTitle={songSubTitle}
                            lines={chunkLines}
                            pageNum={globalPageCounter}
                            totalSongPages={lyricsPages.length}
                            songPageIdx={idx}
                        />
                    );
                    metadata.push({
                        slideId: slide.id,
                        title: songTitle,
                        type: SlideType.LYRICS,
                        displayPageNum: globalPageCounter
                    });
                    globalPageCounter++;
                });

            } else if (slide.type === SlideType.SCRIPTURE) {
                const content = slide.content as any;
                const biblePages = content.pages || [];

                biblePages.forEach((bPage: ScripturePage, idx: number) => {
                    const title = `${bPage.bookName.fa} ${bPage.chapter}:${bPage.verses}`;
                    pages.push(
                        <ScriptureBookPage
                            key={`slide-${slide.id}-p-${idx}`}
                            page={bPage}
                            pageNum={globalPageCounter}
                        />
                    );
                    metadata.push({
                        slideId: slide.id,
                        title: title,
                        type: SlideType.SCRIPTURE,
                        displayPageNum: globalPageCounter
                    });
                    globalPageCounter++;
                });

            } else if (slide.type === SlideType.ANNOUNCEMENT) {
                const content = slide.content as any;
                pages.push(
                    <GenericBookPage
                        key={`slide-${slide.id}`}
                        title={content.title || "اعلان کلیسا"}
                        type={SlideType.ANNOUNCEMENT}
                        htmlContent={content.content || ""}
                        pageNum={globalPageCounter}
                    />
                );
                metadata.push({
                    slideId: slide.id,
                    title: content.title || "اعلان کلیسا",
                    type: SlideType.ANNOUNCEMENT,
                    displayPageNum: globalPageCounter
                });
                globalPageCounter++;

            } else if (slide.type === SlideType.PRAYER) {
                const content = slide.content as any;
                pages.push(
                    <GenericBookPage
                        key={`slide-${slide.id}`}
                        title={content.title || "درخواست دعا"}
                        type={SlideType.PRAYER}
                        htmlContent={content.content || ""}
                        pageNum={globalPageCounter}
                    />
                );
                metadata.push({
                    slideId: slide.id,
                    title: content.title || "درخواست دعا",
                    type: SlideType.PRAYER,
                    displayPageNum: globalPageCounter
                });
                globalPageCounter++;

            } else if (slide.type === SlideType.GENERIC) {
                const content = slide.content as any;
                const title = content.title || "پیام هفته";
                pages.push(
                    <GenericBookPage
                        key={`slide-${slide.id}`}
                        title={title}
                        type={SlideType.GENERIC}
                        htmlContent={content.htmlContent || ""}
                        pageNum={globalPageCounter}
                    />
                );
                metadata.push({
                    slideId: slide.id,
                    title: title,
                    type: SlideType.GENERIC,
                    displayPageNum: globalPageCounter
                });
                globalPageCounter++;
            }
        });

        // Ensure total page count is even (including Cover, Index, and BackCover)
        // Total pages = 2 (Cover + Index) + pages.length + 1 (Back Cover)
        // If pages.length is odd, then (2 + pages.length + 1) = odd.
        // So we add an empty parchment page to balance it if pages.length is odd!
        if (pages.length % 2 === 1) {
            pages.push(
                <div key="blank-spacer" className="relative w-full h-full bg-[#fdfaf2] text-[#2c241e] flex flex-col justify-between p-8 select-none shadow-inner font-[Vazirmatn]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-[#ebdcb9]" />
                    <div className="flex-1 flex items-center justify-center italic text-stone-300 text-xs">
                        یادداشت‌ها...
                    </div>
                    <div className="text-right text-[10px] text-stone-400">
                        صفحه {globalPageCounter}
                    </div>
                </div>
            );
            globalPageCounter++;
        }

        return { pages, metadata };
    }, [session]);

    const onPage = (e: { data: number }) => setPage(e.data);

    // Total page count is: 1 (Cover) + 1 (Index) + pages.length + 1 (Back Cover)
    const totalPagesCount = 1 + 1 + bookPages.pages.length + 1;

    return (
        <div className="flex flex-col items-center gap-6 w-full py-4 animate-fade-in font-[Vazirmatn]" dir="rtl">
            {/* Header info */}
            <div className="w-full flex items-center justify-between border-b border-white/5 pb-4 px-2">
                <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    <div>
                        <h4 className="text-sm font-black text-white">{session.title}</h4>
                        <p className="text-[10px] text-white/40">{formatPersianDate(session.date)}</p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-xs px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        title="Close Booklet"
                        aria-label="Close Booklet"
                    >
                        بستن کتابچه
                    </button>
                )}
            </div>

            {/* Page Counter */}
            <div className="flex items-center gap-3 text-xs text-white/40 font-mono">
                <span>صفحه</span>
                <span className="text-indigo-400 font-bold">{page + 1}</span>
                <span>/</span>
                <span>{totalPagesCount}</span>
            </div>

            {/* The Book wrapper */}
            <div className="w-full flex justify-center py-2 max-w-full overflow-hidden">
                <div className="relative shadow-2xl rounded-2xl overflow-hidden max-w-[680px]">
                    <HTMLFlipBook
                        ref={bookRef}
                        width={320}
                        height={430}
                        flippingTime={700}
                        showCover={true}
                        onFlip={onPage}
                        className="shadow-2xl"
                        style={{}}
                        startPage={0}
                        size="fixed"
                        minWidth={300}
                        maxWidth={340}
                        minHeight={400}
                        maxHeight={450}
                        drawShadow={true}
                        usePortrait={false}
                        startZIndex={20}
                        autoSize={false}
                        clickEventForward={true}
                        useMouseEvents={true}
                        swipeDistance={30}
                        showPageCorners={true}
                        disableFlipByClick={false}
                        mobileScrollSupport={true}
                        maxShadowOpacity={0.5}
                    >
                        <BookCover session={session} />
                        <BookIndex session={session} pagesMetadata={bookPages.metadata} />
                        
                        {/* Dynamic Pages */}
                        {bookPages.pages}

                        <BookBackCover />
                    </HTMLFlipBook>
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-4 mt-2">
                <button
                    onClick={() => bookRef.current?.pageFlip().flipPrev()}
                    disabled={page === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all font-bold text-xs"
                    title="Previous Page"
                    aria-label="Previous Page"
                >
                    <ChevronRight className="w-4 h-4" />
                    صفحه قبلی
                </button>
                <button
                    onClick={() => bookRef.current?.pageFlip().flipNext()}
                    disabled={page >= totalPagesCount - 1}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all font-bold text-xs"
                    title="Next Page"
                    aria-label="Next Page"
                >
                    صفحه بعدی
                    <ChevronLeft className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
