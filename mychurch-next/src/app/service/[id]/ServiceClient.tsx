"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  BroadcastSession,
  Slide,
  SlideType,
  SlideContentLyrics,
  SlideContentScripture,
  SlideContentAnnouncement,
  SlideContentGeneric,
  SlideContentPrayer,
} from "@/types/broadcast";
import {
  Music,
  BookOpen,
  Share2,
  Send,
  MessageCircle,
  Copy,
  Check,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Calendar,
  User,
  Sparkles,
  Smartphone,
  Layers,
  Heart,
  ExternalLink,
  Volume2,
} from "lucide-react";
import { SlideRenderer } from "@/components/broadcast/SlideRenderer";
import { useLanguage } from "@/providers/LanguageProvider";

interface ServiceClientProps {
  session: BroadcastSession;
  initialRef?: string;
}

const localDict = {
  en: {
    churchNameShort: "Iranian Church of D.C.",
    churchNameFull: "Iranian Presbyterian Church of D.C.",
    sendToPhone: "Send to Phone",
    weeklySessionBadge: "Sunday Service Digital Package",
    hostedBy: "Message/Sermon: ",
    slideCount: "slides in program",
    dispatchTitle: "Get this program and songs on messaging apps",
    dispatchSubtitle: "One click to save all songs, audio, and verses on your phone:",
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    sms: "SMS",
    copyLink: "Copy Link",
    copyLinkTitle: "Copy page link",
    copied: "Copied",
    copiedFull: "Link copied!",
    tabSongs: "Worship Songs",
    tabScriptures: "Bible Verses",
    tabSlides: "Browse Slides",
    tabShare: "Share & Send",
    noSongs: "No song slides were recorded for this session.",
    noScriptures: "No scripture slides were recorded for this session.",
    chapterLabel: "Chapter",
    artist: "Artist / Group: ",
    playing: "Playing",
    playSong: "Play Song",
    noLyrics: "Lyrics for this song are not available.",
    noVerses: "Verse text is not available.",
    prevSlide: "Previous Slide",
    nextSlide: "Next Slide",
    shareHeading: "Share the Session Program",
    shareSubtitle: "Send this page to yourself, friends, or family members so they can access the audio files and song lyrics.",
    shareWhatsapp: "Share on WhatsApp",
    shareTelegram: "Share on Telegram",
    shareSmsDirect: "Send directly via SMS",
    copyPageUrl: "Copy Page Address",
    footerCopyright: "All Rights Reserved.",
    shareTextIntro: "Program, songs, and slides of the Iranian Church of D.C. session",
    shareTextSubject: "Subject: ",
    shareTextDate: "Date: ",
    shareTextView: "View and read online:",
    telegramShareText: "Program and songs of the session: ",
  },
  fa: {
    churchNameShort: "کلیسای ایرانیان واشنگتن",
    churchNameFull: "Iranian Presbyterian Church of D.C.",
    sendToPhone: "ارسال به گوشی",
    weeklySessionBadge: "پکیج دیجیتال جلسه یکشنبه",
    hostedBy: "پیام/موعظه: ",
    slideCount: "اسلاید برنامه",
    dispatchTitle: "دریافت این برنامه و سرودها در شبکه‌های پیام‌رسان",
    dispatchSubtitle: "یک کلیک کافیست تا تمام سرودها، صوت‌ها و آیات را در گوشی خود ذخیره داشته باشید:",
    whatsapp: "واتساپ",
    telegram: "تلگرام",
    sms: "پیامک",
    copyLink: "کپی لینک",
    copyLinkTitle: "کپی لینک صفحه",
    copied: "کپی شد",
    copiedFull: "آدرس کپی شد!",
    tabSongs: "سرودهای پرستشی",
    tabScriptures: "آیات کتاب‌مقدس",
    tabSlides: "ورق زدن اسلایدها",
    tabShare: "اشتراک و ارسال",
    noSongs: "در این جلسه اسلاید سرود ثبت نشده است.",
    noScriptures: "در این جلسه اسلاید آیه کتاب‌مقدس ثبت نشده است.",
    chapterLabel: "باب",
    artist: "خواننده / گروه: ",
    playing: "در حال پخش",
    playSong: "پخش سرود",
    noLyrics: "متن این سرود در دسترس نیست.",
    noVerses: "متن آیات در دسترس نیست.",
    prevSlide: "اسلاید قبلی",
    nextSlide: "اسلاید بعدی",
    shareHeading: "ارسال و اشتراک‌گذاری برنامه جلسه",
    shareSubtitle: "این صفحه را برای خود، دوستان یا اعضای خانواده ارسال کنید تا به فایل‌های صوتی و متن سرودها دسترسی داشته باشند.",
    shareWhatsapp: "اشتراک‌گذاری در واتساپ",
    shareTelegram: "اشتراک‌گذاری در تلگرام",
    shareSmsDirect: "ارسال مستقیم از طریق پیامک (SMS)",
    copyPageUrl: "کپی آدرس اختصاصی صفحه",
    footerCopyright: "کلیه حقوق محفوظ است.",
    shareTextIntro: "🕊️ برنامه، سرودها و اسلایدهای جلسه کلیسای ایرانیان واشنگتن",
    shareTextSubject: "📌 موضوع: ",
    shareTextDate: "📅 تاریخ: ",
    shareTextView: "📖 مشاهده و مطالعه آنلاین:",
    telegramShareText: "برنامه و سرودهای جلسه: ",
  },
  es: {
    churchNameShort: "Iglesia Iraní de D.C.",
    churchNameFull: "Iranian Presbyterian Church of D.C.",
    sendToPhone: "Enviar al Teléfono",
    weeklySessionBadge: "Paquete Digital del Culto Dominical",
    hostedBy: "Mensaje/Sermón: ",
    slideCount: "diapositivas del programa",
    dispatchTitle: "Reciba este programa y las canciones en sus apps de mensajería",
    dispatchSubtitle: "Un clic es suficiente para guardar todas las canciones, audios y versículos en su teléfono:",
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    sms: "SMS",
    copyLink: "Copiar Enlace",
    copyLinkTitle: "Copiar enlace de la página",
    copied: "Copiado",
    copiedFull: "¡Enlace copiado!",
    tabSongs: "Cantos de Adoración",
    tabScriptures: "Versículos Bíblicos",
    tabSlides: "Ver Diapositivas",
    tabShare: "Compartir y Enviar",
    noSongs: "No se registraron diapositivas de canciones para esta sesión.",
    noScriptures: "No se registraron diapositivas de versículos para esta sesión.",
    chapterLabel: "Capítulo",
    artist: "Artista / Grupo: ",
    playing: "Reproduciendo",
    playSong: "Reproducir Canción",
    noLyrics: "La letra de esta canción no está disponible.",
    noVerses: "El texto de los versículos no está disponible.",
    prevSlide: "Diapositiva Anterior",
    nextSlide: "Diapositiva Siguiente",
    shareHeading: "Compartir el Programa de la Sesión",
    shareSubtitle: "Envíe esta página a usted mismo, amigos o familiares para que puedan acceder a los archivos de audio y la letra de las canciones.",
    shareWhatsapp: "Compartir en WhatsApp",
    shareTelegram: "Compartir en Telegram",
    shareSmsDirect: "Enviar directamente por SMS",
    copyPageUrl: "Copiar Dirección de la Página",
    footerCopyright: "Todos los Derechos Reservados.",
    shareTextIntro: "🕊️ Programa, canciones y diapositivas de la sesión de la Iglesia Iraní de D.C.",
    shareTextSubject: "📌 Tema: ",
    shareTextDate: "📅 Fecha: ",
    shareTextView: "📖 Ver y leer en línea:",
    telegramShareText: "Programa y canciones de la sesión: ",
  },
};

export default function ServiceClient({ session, initialRef }: ServiceClientProps) {
  const { language, isRTL } = useLanguage();
  const d = localDict[language] || localDict.fa;
  const [activeTab, setActiveTab] = useState<"songs" | "scriptures" | "slides" | "share">("songs");
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [copied, setCopied] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Extract all songs from slides
  const songSlides = session.slides.filter((s) => s.type === SlideType.LYRICS);
  // Extract all scriptures from slides
  const scriptureSlides = session.slides.filter((s) => s.type === SlideType.SCRIPTURE);
  // Extract all prayers
  const prayerSlides = session.slides.filter((s) => s.type === SlideType.PRAYER);

  // Load saved phone from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mychurch_attendee_phone");
      if (saved) setPhoneNumber(saved);
      const savedCode = localStorage.getItem("mychurch_attendee_cc");
      if (savedCode) setCountryCode(savedCode);
    } catch {}
  }, []);

  const handleSavePhone = (val: string) => {
    setPhoneNumber(val);
    try {
      localStorage.setItem("mychurch_attendee_phone", val);
    } catch {}
  };

  const handleSaveCountryCode = (code: string) => {
    setCountryCode(code);
    try {
      localStorage.setItem("mychurch_attendee_cc", code);
    } catch {}
  };

  const pageUrl = typeof window !== "undefined" ? window.location.href : `https://www.iranianchurchdc.com/service/${session.id}`;

  const copyPageLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // WhatsApp Share Text
  const shareText = `${d.shareTextIntro}\n\n${d.shareTextSubject}${session.title}\n${d.shareTextDate}${session.jalaliDate || ""}\n\n${d.shareTextView}\n${pageUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(
    `${d.telegramShareText}${session.title}`
  )}`;
  const smsUrl = `sms:?body=${encodeURIComponent(shareText)}`;

  // Audio Playback Handler
  const toggleAudio = (audioUrl?: string, id?: string) => {
    if (!audioUrl) return;
    if (playingAudioId === id) {
      if (audioRef.current) {
        if (audioRef.current.paused) {
          audioRef.current.play();
        } else {
          audioRef.current.pause();
          setPlayingAudioId(null);
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setPlayingAudioId(id || audioUrl);
      audio.play().catch(console.warn);

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        }
      };
      audio.onended = () => {
        setPlayingAudioId(null);
        setAudioProgress(0);
      };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-[Vazirmatn]" dir={isRTL ? "rtl" : "ltr"}>
      {/* Top Banner / Church Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-amber-400 text-lg">
                ✝
              </div>
            </div>
            <div>
              <h2 className="text-sm md:text-base font-black text-white tracking-wide">
                {d.churchNameShort}
              </h2>
              <p className="text-[11px] text-amber-300/80 font-medium">
                {d.churchNameFull}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("share")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-lg shadow-md transition transform active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{d.sendToPhone}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Session Hero Banner */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-white/10 p-5 md:p-7 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{d.weeklySessionBadge}</span>
            </div>

            <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
              {session.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-slate-400 pt-1">
              {session.jalaliDate && (
                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{session.jalaliDate}</span>
                </div>
              )}
              {session.hostName && (
                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{d.hostedBy}{session.hostName}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>{session.slides.length} {d.slideCount}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Multi-Channel Dispatch Bar */}
        <section className="bg-gradient-to-r from-slate-900 to-indigo-950/60 rounded-2xl border border-amber-500/30 p-4 md:p-5 shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>{d.dispatchTitle}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {d.dispatchSubtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-950/40"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{d.whatsapp}</span>
              </a>

              <a
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-md shadow-sky-950/40"
              >
                <Send className="w-4 h-4" />
                <span>{d.telegram}</span>
              </a>

              <a
                href={smsUrl}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 transition"
              >
                <span>{d.sms}</span>
              </a>

              <button
                onClick={copyPageLink}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/20 transition"
                title={d.copyLinkTitle}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? d.copied : d.copyLink}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Tab Selector */}
        <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("songs")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition shrink-0 ${
              activeTab === "songs"
                ? "bg-pink-600/20 border border-pink-500/40 text-pink-300"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Music className="w-4 h-4 text-pink-400" />
            <span>{d.tabSongs} ({songSlides.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("scriptures")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition shrink-0 ${
              activeTab === "scriptures"
                ? "bg-amber-600/20 border border-amber-500/40 text-amber-300"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>{d.tabScriptures} ({scriptureSlides.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("slides")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition shrink-0 ${
              activeTab === "slides"
                ? "bg-indigo-600/20 border border-indigo-500/40 text-indigo-300"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>{d.tabSlides} ({session.slides.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("share")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition shrink-0 ${
              activeTab === "share"
                ? "bg-blue-600/20 border border-blue-500/40 text-blue-300"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Share2 className="w-4 h-4 text-blue-400" />
            <span>{d.tabShare}</span>
          </button>
        </div>

        {/* TAB 1: Worship Songs */}
        {activeTab === "songs" && (
          <div className="space-y-4">
            {songSlides.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                {d.noSongs}
              </div>
            ) : (
              songSlides.map((slide, idx) => {
                const content = slide.content as SlideContentLyrics;
                const isPlaying = playingAudioId === (content.audioUrl || slide.id);

                return (
                  <article
                    key={slide.id}
                    className="rounded-2xl bg-slate-900/90 border border-white/10 p-5 space-y-4 shadow-xl hover:border-pink-500/30 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <h2 className="text-lg md:text-xl font-bold text-white">
                            {content.title}
                          </h2>
                        </div>
                        {content.artist && (
                          <p className="text-xs text-slate-400 mt-1 mr-8">
                            {d.artist}{content.artist}
                          </p>
                        )}
                      </div>

                      {/* Audio Play Button */}
                      {content.audioUrl && (
                        <button
                          onClick={() => toggleAudio(content.audioUrl, slide.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shrink-0 ${
                            isPlaying
                              ? "bg-pink-600 text-white animate-pulse"
                              : "bg-pink-600/20 border border-pink-500/40 text-pink-300 hover:bg-pink-600/30"
                          }`}
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          <span>{isPlaying ? d.playing : d.playSong}</span>
                        </button>
                      )}
                    </div>

                    {/* Audio Seek bar if playing */}
                    {isPlaying && (
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-pink-500 h-full transition-all duration-300"
                          style={{ width: `${audioProgress}%` }}
                        />
                      </div>
                    )}

                    {/* Lyrics Lines */}
                    <div className="space-y-3 bg-black/40 rounded-xl p-4 border border-white/5 max-h-96 overflow-y-auto">
                      {content.lines && content.lines.length > 0 ? (
                        content.lines.map((line, lIdx) => (
                          <div key={lIdx} className="space-y-1">
                            {content.displayOptions?.showChords && line.chords && (
                              <div className="text-[11px] font-mono text-amber-400/80 dir-ltr text-right">
                                {line.chords}
                              </div>
                            )}
                            <p className="text-sm md:text-base text-slate-200 leading-relaxed font-medium">
                              {line.text}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 text-xs">{d.noLyrics}</p>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: Scriptures */}
        {activeTab === "scriptures" && (
          <div className="space-y-4">
            {scriptureSlides.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                {d.noScriptures}
              </div>
            ) : (
              scriptureSlides.map((slide, idx) => {
                const content = slide.content as SlideContentScripture;
                const page = content.pages?.[0];
                if (!page) return null;

                return (
                  <article
                    key={slide.id}
                    className="rounded-2xl bg-slate-900/90 border border-white/10 p-5 space-y-4 shadow-xl hover:border-amber-500/30 transition"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <h2 className="text-base md:text-lg font-bold text-amber-300">
                          {page.bookName?.fa || page.book} {d.chapterLabel} {page.chapter}
                        </h2>
                      </div>
                      <span className="text-xs text-slate-400 dir-ltr font-mono">
                        {page.bookName?.en || page.book} {page.chapter}
                      </span>
                    </div>

                    {/* Verses Container */}
                    <div className="space-y-3 bg-black/40 rounded-xl p-4 border border-white/5 max-h-96 overflow-y-auto">
                      {page.textPrimary && page.textPrimary.length > 0 ? (
                        page.textPrimary.map((txt, vIdx) => {
                          const verseNum = page.verseNumbers?.[vIdx] ?? (vIdx + 1);
                          const secTxt = page.textSecondary?.[vIdx];

                          return (
                            <div key={vIdx} className="space-y-1">
                              <div className="flex items-start gap-2">
                                <span className="text-amber-400 font-bold text-xs shrink-0 mt-1">
                                  [{verseNum}]
                                </span>
                                <p className="text-sm md:text-base text-slate-200 leading-relaxed font-medium">
                                  {txt}
                                </p>
                              </div>
                              {secTxt && (
                                <p className="text-xs text-slate-400 dir-ltr text-left pl-6 font-serif">
                                  {secTxt}
                                </p>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-slate-400 text-xs">{d.noVerses}</p>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: Interactive Slides Flipbook */}
        {activeTab === "slides" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-900 border border-white/10 overflow-hidden shadow-2xl">
              {/* Slide Canvas */}
              <div className="aspect-video w-full bg-black relative">
                {session.slides[currentSlideIdx] && (
                  <SlideRenderer
                    slide={session.slides[currentSlideIdx]}
                    isRemotePreview={true}
                  />
                )}
              </div>

              {/* Navigation Controller */}
              <div className="p-4 bg-slate-950 flex items-center justify-between border-t border-white/10">
                <button
                  onClick={() => setCurrentSlideIdx((prev) => Math.max(0, prev - 1))}
                  disabled={currentSlideIdx === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold transition"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>{d.prevSlide}</span>
                </button>

                <div className="text-xs text-slate-400 font-bold font-mono">
                  {currentSlideIdx + 1} / {session.slides.length}
                </div>

                <button
                  onClick={() =>
                    setCurrentSlideIdx((prev) => Math.min(session.slides.length - 1, prev + 1))
                  }
                  disabled={currentSlideIdx === session.slides.length - 1}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold transition"
                >
                  <span>{d.nextSlide}</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {session.slides.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentSlideIdx(idx)}
                  className={`w-20 aspect-video rounded-lg overflow-hidden border-2 shrink-0 transition ${
                    currentSlideIdx === idx
                      ? "border-amber-400 scale-105 shadow-md"
                      : "border-white/10 opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                    {idx + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Share & Multi-Channel Dispatch Hub */}
        {activeTab === "share" && (
          <div className="rounded-2xl bg-slate-900 border border-white/10 p-6 space-y-6 shadow-2xl">
            <div className="text-center max-w-md mx-auto space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <Share2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">{d.shareHeading}</h2>
              <p className="text-xs text-slate-400">
                {d.shareSubtitle}
              </p>
            </div>

            {/* Share Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-3 p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition shadow-lg shadow-emerald-950/40"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{d.shareWhatsapp}</span>
              </a>

              <a
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-3 p-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm transition shadow-lg shadow-sky-950/40"
              >
                <Send className="w-5 h-5" />
                <span>{d.shareTelegram}</span>
              </a>

              <a
                href={smsUrl}
                className="flex items-center justify-center gap-3 p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-white/10 transition"
              >
                <span>{d.shareSmsDirect}</span>
              </a>

              <button
                onClick={copyPageLink}
                className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-sm border border-amber-500/30 transition"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                <span>{copied ? d.copiedFull : d.copyPageUrl}</span>
              </button>
            </div>

            {/* Direct Link Box */}
            <div className="max-w-lg mx-auto bg-black/50 border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs text-slate-400 dir-ltr font-mono">
              <span className="truncate mr-2">{pageUrl}</span>
              <button
                onClick={copyPageLink}
                className="text-amber-400 hover:text-amber-300 shrink-0 font-sans font-bold"
              >
                {copied ? d.copied : d.copyLink}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 px-4 text-center text-xs text-slate-500 mt-12 bg-slate-950/60">
        <p>{d.churchNameShort} ({d.churchNameFull})</p>
        <p className="mt-1 text-[11px] text-slate-600 dir-ltr">
          © {new Date().getFullYear()} Iranian Church DC. {d.footerCopyright}
        </p>
      </footer>
    </div>
  );
}
