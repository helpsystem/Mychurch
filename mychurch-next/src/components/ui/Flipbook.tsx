"use client";

import React, { useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';

const localDict = {
    fa: {
        coverTitle: "خبرنامه کلیسا",
        coverSubtitle: "کلیسای انجیلی ایرانیان واشنگتن دی‌سی",
        coverEnglishName: "Iranian Presbyterian Church",
        coverLogoAlt: "لوگوی کلیسا",
        coverFlipHint: "تلنگر برای ورق زدن ←",
        backCoverVerse: "«زیرا خدا جهان را اینقدر محبت نمود که پسر یگانه خود را داد.»",
        backCoverReference: "یوحنا ۳:۱۶",
        pageTitles: {
            schedule: "برنامه این هفته",
            announcements: "اعلانات مهم",
            prayers: "درخواست‌های دعا",
            contact: "با ما در تماس باشید",
        },
        scheduleItems: [
            { day: "یکشنبه", event: "جلسه عبادی اصلی — ساعت ۱۱ صبح" },
            { day: "سه‌شنبه", event: "مطالعه کتاب مقدس آنلاین — ساعت ۸ شب" },
            { day: "جمعه", event: "جلسه دعا و پرستش — ساعت ۷:۳۰ شب" },
        ],
        announcementEaster: { title: "تعطیلات عید پاک 🐣", body: "جلسه مخصوص عید با برنامه‌ریزی ویژه. تمام خانواده‌ها دعوت هستند." },
        announcementKids: { title: "کلاس کتاب مقدس کودکان 📖", body: "هر یکشنبه موازی با جلسه اصلی برای کودکان ۵ تا ۱۲ سال." },
        prayerIntro: "درخواست‌های جدید این هفته:",
        prayerRequests: [
            "سلامتی أعضای بیمار کلیسا",
            "هدایت و حکمت برای خادمین",
            "بازگشت فرزندان به ایمان",
            "آزادی مسیحیان در ایران",
        ],
        contactWebsite: "www.iranianchurchdc.com",
        contactLocation: "Washington D.C. Metro Area",
        contactLivestream: "پخش زنده هر یکشنبه",
        contactNewsletter: "برای دریافت نشریه دیجیتال هر هفته، با ما در تماس باشید.",
        prevPage: "قبلی",
        nextPage: "بعدی",
    },
    en: {
        coverTitle: "Church Newsletter",
        coverSubtitle: "Iranian Evangelical Church of Washington D.C.",
        coverEnglishName: "Iranian Presbyterian Church",
        coverLogoAlt: "Church Logo",
        coverFlipHint: "Tap to flip →",
        backCoverVerse: "\"For God so loved the world that he gave his one and only Son.\"",
        backCoverReference: "John 3:16",
        pageTitles: {
            schedule: "This Week's Schedule",
            announcements: "Important Announcements",
            prayers: "Prayer Requests",
            contact: "Get in Touch",
        },
        scheduleItems: [
            { day: "Sunday", event: "Main Worship Service — 11:00 AM" },
            { day: "Tuesday", event: "Online Bible Study — 8:00 PM" },
            { day: "Friday", event: "Prayer & Worship Gathering — 7:30 PM" },
        ],
        announcementEaster: { title: "Easter Holiday 🐣", body: "A special Easter service with a full program. All families are welcome." },
        announcementKids: { title: "Children's Bible Class 📖", body: "Every Sunday alongside the main service, for children ages 5 to 12." },
        prayerIntro: "New requests this week:",
        prayerRequests: [
            "Healing for church members who are ill",
            "Guidance and wisdom for our servants",
            "The return of children to the faith",
            "Freedom for Christians in Iran",
        ],
        contactWebsite: "www.iranianchurchdc.com",
        contactLocation: "Washington D.C. Metro Area",
        contactLivestream: "Live stream every Sunday",
        contactNewsletter: "Get in touch to receive our weekly digital newsletter.",
        prevPage: "Previous",
        nextPage: "Next",
    },
    es: {
        coverTitle: "Boletín de la Iglesia",
        coverSubtitle: "Iglesia Evangélica Iraní de Washington D.C.",
        coverEnglishName: "Iranian Presbyterian Church",
        coverLogoAlt: "Logo de la Iglesia",
        coverFlipHint: "Toca para pasar la página →",
        backCoverVerse: "«Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito.»",
        backCoverReference: "Juan 3:16",
        pageTitles: {
            schedule: "Programa de esta semana",
            announcements: "Anuncios importantes",
            prayers: "Peticiones de oración",
            contact: "Ponte en contacto",
        },
        scheduleItems: [
            { day: "Domingo", event: "Servicio de adoración principal — 11:00 a.m." },
            { day: "Martes", event: "Estudio bíblico en línea — 8:00 p.m." },
            { day: "Viernes", event: "Reunión de oración y adoración — 7:30 p.m." },
        ],
        announcementEaster: { title: "Vacaciones de Pascua 🐣", body: "Un servicio especial de Pascua con un programa completo. Todas las familias son bienvenidas." },
        announcementKids: { title: "Clase bíblica infantil 📖", body: "Cada domingo, en paralelo al servicio principal, para niños de 5 a 12 años." },
        prayerIntro: "Nuevas peticiones de esta semana:",
        prayerRequests: [
            "Sanidad para los miembros enfermos de la iglesia",
            "Guía y sabiduría para nuestros siervos",
            "El regreso de los hijos a la fe",
            "Libertad para los cristianos en Irán",
        ],
        contactWebsite: "www.iranianchurchdc.com",
        contactLocation: "Washington D.C. Metro Area",
        contactLivestream: "Transmisión en vivo cada domingo",
        contactNewsletter: "Ponte en contacto para recibir nuestro boletín digital semanal.",
        prevPage: "Anterior",
        nextPage: "Siguiente",
    },
};

// ---- Page Components ----

const CoverPage = React.forwardRef<HTMLDivElement, { d: typeof localDict.fa; dir: "rtl" | "ltr" }>(({ d, dir }, ref) => (
    <div ref={ref} className="relative w-full h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex flex-col items-center justify-center text-white select-none overflow-hidden rounded-l-xl shadow-2xl font-[Vazirmatn]">
        <div className="absolute inset-0 bg-[url('/logo-transparent.png')] bg-center bg-no-repeat bg-contain opacity-[0.04]" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <img src="/logo-transparent.png" alt={d.coverLogoAlt} className="w-28 h-28 object-contain mb-6 drop-shadow-2xl" />
        <h2 className="text-3xl font-black text-center leading-normal mb-2 drop-shadow-lg" dir={dir}>{d.coverTitle}</h2>
        <p className="text-blue-300 font-semibold text-lg mb-1" dir={dir}>{d.coverSubtitle}</p>
        <p className="text-white/40 text-sm font-mono mt-4" dir="ltr">{d.coverEnglishName}</p>
        <div className="absolute bottom-6 text-white/30 text-xs" dir={dir}>{d.coverFlipHint}</div>
    </div>
));
CoverPage.displayName = 'CoverPage';

const InnerPage = React.forwardRef<HTMLDivElement, { title: string; children: React.ReactNode; accent?: string; dir: "rtl" | "ltr" }>((
    { title, children, accent = "blue", dir }, ref
) => (
    <div ref={ref} className="relative w-full h-full bg-[#0d1117] text-white flex flex-col select-none overflow-hidden shadow-inner font-[Vazirmatn]">
        <div className={`h-1 bg-gradient-to-r from-${accent}-500 to-purple-500 shrink-0`} />
        <div className="p-8 flex flex-col flex-1 overflow-hidden">
            <h3 className={`text-xl font-black text-${accent}-400 mb-5 pb-3 border-b border-${accent}-500/20 uppercase tracking-widest leading-normal`} dir={dir}>
                {title}
            </h3>
            <div className="flex-1 text-white/75 leading-relaxed text-sm overflow-hidden" dir={dir}>
                {children}
            </div>
        </div>
    </div>
));
InnerPage.displayName = 'InnerPage';

const BackCoverPage = React.forwardRef<HTMLDivElement, { d: typeof localDict.fa; dir: "rtl" | "ltr" }>(({ d, dir }, ref) => (
    <div ref={ref} className="relative w-full h-full bg-gradient-to-br from-[#0f3460] via-[#16213e] to-[#1a1a2e] flex flex-col items-center justify-center text-white select-none overflow-hidden rounded-r-xl shadow-2xl font-[Vazirmatn]">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500" />
        <BookOpen className="w-16 h-16 text-white/20 mb-6" />
        <p className="text-white/50 text-sm font-medium text-center px-6 leading-normal" dir={dir}>
            {d.backCoverVerse}<br />
            <span className="text-white/30 text-xs mt-1 block">{d.backCoverReference}</span>
        </p>
        <div className="absolute bottom-6 text-white/20 text-xs" dir="ltr">www.iranianchurchdc.com</div>
    </div>
));
BackCoverPage.displayName = 'BackCoverPage';

// ---- Main Flipbook Component ----

export function Flipbook() {
    const { language, isRTL } = useLanguage();
    const d = localDict[language] || localDict.fa;
    const dir: "rtl" | "ltr" = isRTL ? "rtl" : "ltr";
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
                    <CoverPage d={d} dir={dir} />

                    <InnerPage title={d.pageTitles.schedule} accent="blue" dir={dir}>
                        <ul className="space-y-4">
                            {d.scheduleItems.map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="text-blue-400 font-black text-lg shrink-0">{item.day}</span>
                                    <span>{item.event}</span>
                                </li>
                            ))}
                        </ul>
                    </InnerPage>

                    <InnerPage title={d.pageTitles.announcements} accent="purple" dir={dir}>
                        <div className="space-y-5">
                            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                <p className="font-bold text-purple-300 mb-1">{d.announcementEaster.title}</p>
                                <p className="text-xs text-white/60">{d.announcementEaster.body}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <p className="font-bold text-blue-300 mb-1">{d.announcementKids.title}</p>
                                <p className="text-xs text-white/60">{d.announcementKids.body}</p>
                            </div>
                        </div>
                    </InnerPage>

                    <InnerPage title={d.pageTitles.prayers} accent="pink" dir={dir}>
                        <div className="space-y-4">
                            <p className="text-white/50 text-xs mb-4">{d.prayerIntro}</p>
                            {d.prayerRequests.map((prayer, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm">
                                    <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                                    <span>{prayer}</span>
                                </div>
                            ))}
                        </div>
                    </InnerPage>

                    <InnerPage title={d.pageTitles.contact} accent="emerald" dir={dir}>
                        <div className="space-y-4 text-sm">
                            <div className="flex items-center gap-3">
                                <span className="text-emerald-400">🌐</span>
                                <span className="font-mono text-xs text-white/70">{d.contactWebsite}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-emerald-400">📍</span>
                                <span className="text-white/70">{d.contactLocation}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-emerald-400">📺</span>
                                <span className="text-white/70">{d.contactLivestream}</span>
                            </div>
                            <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <p className="text-xs text-emerald-300/80">{d.contactNewsletter}</p>
                            </div>
                        </div>
                    </InnerPage>

                    <BackCoverPage d={d} dir={dir} />
                </HTMLFlipBook>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => bookRef.current?.pageFlip().flipPrev()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all font-bold text-sm"
                    title={d.prevPage}
                    aria-label={d.prevPage}
                >
                    <ChevronRight className="w-4 h-4" />
                    {d.prevPage}
                </button>
                <button
                    onClick={() => bookRef.current?.pageFlip().flipNext()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all font-bold text-sm"
                    title={d.nextPage}
                    aria-label={d.nextPage}
                >
                    {d.nextPage}
                    <ChevronLeft className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
