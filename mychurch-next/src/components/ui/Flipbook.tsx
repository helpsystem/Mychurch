"use client";

import React, { useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

// ---- Page Components ----

const CoverPage = React.forwardRef<HTMLDivElement, {}>((_, ref) => (
    <div ref={ref} className="relative w-full h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex flex-col items-center justify-center text-white select-none overflow-hidden rounded-l-xl shadow-2xl font-[Vazirmatn]">
        <div className="absolute inset-0 bg-[url('/logo-transparent.png')] bg-center bg-no-repeat bg-contain opacity-[0.04]" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <img src="/logo-transparent.png" alt="Church Logo" className="w-28 h-28 object-contain mb-6 drop-shadow-2xl" />
        <h2 className="text-3xl font-black text-center leading-normal mb-2 drop-shadow-lg" dir="rtl">خبرنامه کلیسا</h2>
        <p className="text-blue-300 font-semibold text-lg mb-1" dir="rtl">کلیسای ایرانیان واشنگتن دی‌سی</p>
        <p className="text-white/40 text-sm font-mono mt-4" dir="ltr">Iran Church DC</p>
        <div className="absolute bottom-6 text-white/30 text-xs" dir="rtl">تلنگر برای ورق زدن ←</div>
    </div>
));
CoverPage.displayName = 'CoverPage';

const InnerPage = React.forwardRef<HTMLDivElement, { title: string; children: React.ReactNode; accent?: string }>((
    { title, children, accent = "blue" }, ref
) => (
    <div ref={ref} className="relative w-full h-full bg-[#0d1117] text-white flex flex-col select-none overflow-hidden shadow-inner font-[Vazirmatn]">
        <div className={`h-1 bg-gradient-to-r from-${accent}-500 to-purple-500 shrink-0`} />
        <div className="p-8 flex flex-col flex-1 overflow-hidden">
            <h3 className={`text-xl font-black text-${accent}-400 mb-5 pb-3 border-b border-${accent}-500/20 uppercase tracking-widest leading-normal`} dir="rtl">
                {title}
            </h3>
            <div className="flex-1 text-white/75 leading-relaxed text-sm overflow-hidden" dir="rtl">
                {children}
            </div>
        </div>
    </div>
));
InnerPage.displayName = 'InnerPage';

const BackCoverPage = React.forwardRef<HTMLDivElement, {}>((_, ref) => (
    <div ref={ref} className="relative w-full h-full bg-gradient-to-br from-[#0f3460] via-[#16213e] to-[#1a1a2e] flex flex-col items-center justify-center text-white select-none overflow-hidden rounded-r-xl shadow-2xl font-[Vazirmatn]">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500" />
        <BookOpen className="w-16 h-16 text-white/20 mb-6" />
        <p className="text-white/50 text-sm font-medium text-center px-6 leading-normal" dir="rtl">
            «زیرا خدا جهان را اینقدر محبت نمود که پسر یگانه خود را داد.»<br />
            <span className="text-white/30 text-xs mt-1 block">یوحنا ۳:۱۶</span>
        </p>
        <div className="absolute bottom-6 text-white/20 text-xs" dir="ltr">www.iranianchurchdc.com</div>
    </div>
));
BackCoverPage.displayName = 'BackCoverPage';

// ---- Main Flipbook Component ----

export function Flipbook() {
    const bookRef = useRef<any>(null);
    const [page, setPage] = useState(0);

    const onPage = (e: { data: number }) => setPage(e.data);

    return (
        <div className="flex flex-col items-center gap-8 w-full py-8">

            {/* Page Counter */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono">
                <span className="text-primary font-bold">{page + 1}</span>
                <span>/</span>
                <span>6</span>
            </div>

            {/* The Book */}
            <div className="w-full flex justify-center overflow-x-auto select-none py-4 max-w-full">
                <HTMLFlipBook
                    ref={bookRef}
                    width={320}
                    height={420}
                    flippingTime={700}
                    showCover={true}
                    onFlip={onPage}
                    className="shadow-2xl"
                    style={{}}
                    startPage={0}
                    size="fixed"
                    minWidth={300}
                    maxWidth={400}
                    minHeight={380}
                    maxHeight={480}
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
                    <CoverPage />

                    <InnerPage title="برنامه این هفته" accent="blue">
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <span className="text-blue-400 font-black text-lg shrink-0">یکشنبه</span>
                                <span>جلسه عبادی اصلی — ساعت ۱۱ صبح</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-purple-400 font-black text-lg shrink-0">سه‌شنبه</span>
                                <span>مطالعه کتاب مقدس آنلاین — ساعت ۸ شب</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-pink-400 font-black text-lg shrink-0">جمعه</span>
                                <span>جلسه دعا و پرستش — ساعت ۷:۳۰ شب</span>
                            </li>
                        </ul>
                    </InnerPage>

                    <InnerPage title="اعلانات مهم" accent="purple">
                        <div className="space-y-5">
                            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                <p className="font-bold text-purple-300 mb-1">تعطیلات عید پاک 🐣</p>
                                <p className="text-xs text-white/60">جلسه مخصوص عید با برنامه‌ریزی ویژه. تمام خانواده‌ها دعوت هستند.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <p className="font-bold text-blue-300 mb-1">کلاس کتاب مقدس کودکان 📖</p>
                                <p className="text-xs text-white/60">هر یکشنبه موازی با جلسه اصلی برای کودکان ۵ تا ۱۲ سال.</p>
                            </div>
                        </div>
                    </InnerPage>

                    <InnerPage title="درخواست‌های دعا" accent="pink">
                        <div className="space-y-4">
                            <p className="text-white/50 text-xs mb-4">درخواست‌های جدید این هفته:</p>
                            {[
                                "سلامتی أعضای بیمار کلیسا",
                                "هدایت و حکمت برای خادمین",
                                "بازگشت فرزندان به ایمان",
                                "آزادی مسیحیان در ایران"
                            ].map((prayer, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm">
                                    <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                                    <span>{prayer}</span>
                                </div>
                            ))}
                        </div>
                    </InnerPage>

                    <InnerPage title="با ما در تماس باشید" accent="emerald">
                        <div className="space-y-4 text-sm">
                            <div className="flex items-center gap-3">
                                <span className="text-emerald-400">🌐</span>
                                <span className="font-mono text-xs text-white/70">www.iranianchurchdc.com</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-emerald-400">📍</span>
                                <span className="text-white/70">Washington D.C. Metro Area</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-emerald-400">📺</span>
                                <span className="text-white/70">پخش زنده هر یکشنبه</span>
                            </div>
                            <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <p className="text-xs text-emerald-300/80">برای دریافت نشریه دیجیتال هر هفته، با ما در تماس باشید.</p>
                            </div>
                        </div>
                    </InnerPage>

                    <BackCoverPage />
                </HTMLFlipBook>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => bookRef.current?.pageFlip().flipPrev()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all font-bold text-sm"
                    title="Previous Page"
                    aria-label="Previous Page"
                >
                    <ChevronRight className="w-4 h-4" />
                    قبلی
                </button>
                <button
                    onClick={() => bookRef.current?.pageFlip().flipNext()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all font-bold text-sm"
                    title="Next Page"
                    aria-label="Next Page"
                >
                    بعدی
                    <ChevronLeft className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
