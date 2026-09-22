"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic, Square, Sparkles, Volume2, Globe, Radio,
  RefreshCw, AlertTriangle, WifiOff, Wifi
} from "lucide-react";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import { GeminiLiveTranslator } from "@/lib/geminiLiveTranslator";
import { toast } from "sonner";

interface LiveTranslatorProps {
  meetingId?: string;
  defaultTargetLang?: string;
}

type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error"
  | "max_retries";

export default function LiveTranslator({
  meetingId = "broadcast-main",
  defaultTargetLang = "en",
}: LiveTranslatorProps) {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [targetLang, setTargetLang] = useState(defaultTargetLang);
  const [inputTranscript, setInputTranscript] = useState("");
  const [outputTranscript, setOutputTranscript] = useState("");
  const [volume, setVolume] = useState(0);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [sessionDuration, setSessionDuration] = useState(0); // seconds live

  const translatorRef = useRef<GeminiLiveTranslator | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLive = status === "connected";
  const isActive = status === "connected" || status === "reconnecting" || status === "connecting";

  // Session duration timer
  useEffect(() => {
    if (isLive) {
      setSessionDuration(0);
      timerRef.current = setInterval(() => setSessionDuration((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isLive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      translatorRef.current?.stop();
    };
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const startLive = useCallback(async () => {
    setStatus("connecting");
    setInputTranscript("");
    setOutputTranscript("");
    setVolume(0);

    try {
      const tokenRes = await fetch("/api/translate/live-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetLanguage: targetLang, echoTargetLanguage: true }),
      });

      const tokenData = await tokenRes.json();
      const token = tokenData.token;

      if (!token) {
        setStatus("error");
        toast.error("کلید API Gemini یافت نشد. لطفاً GEMINI_API_KEY را در تنظیمات محیطی سرور تنظیم کنید.");
        return;
      }

      const translator = new GeminiLiveTranslator(
        {
          targetLanguageCode: targetLang,
          echoTargetLanguage: true,
          token,
          maxReconnectAttempts: 3,
        },
        {
          onOpen: () => {
            setStatus("connected");
            toast.success("ترجمه زنده متصل شد ✓", { duration: 2000 });
          },
          onClose: (reason) => {
            if (translatorRef.current === null) return; // intentional stop
            setStatus("idle");
          },
          onError: (err) => {
            console.error("[LiveTranslator] Error:", err);
            setStatus("error");
            toast.error(`خطای ترجمه: ${err}`, { duration: 4000 });
          },
          onReconnecting: (attempt, max) => {
            setStatus("reconnecting");
            setReconnectAttempt(attempt);
            setMaxAttempts(max);
            toast.warning(`اتصال مجدد... (${attempt}/${max})`, { duration: 2000 });
          },
          onMaxRetriesReached: () => {
            setStatus("max_retries");
            toast.error("اتصال به Gemini Live پس از ۳ تلاش قطع شد. لطفاً دوباره شروع کنید.", { duration: 5000 });
          },
          onInputTranscript: (text) => setInputTranscript(text),
          onOutputTranscript: (text) => setOutputTranscript(text),
          onVolumeChange: (vol) => setVolume(vol),
        }
      );

      translatorRef.current = translator;
      await translator.start();
    } catch (err: any) {
      console.error("[LiveTranslator] Start failed:", err);
      setStatus("error");
      toast.error("خطا در دسترسی به میکروفون یا اتصال به سرور AI.");
    }
  }, [targetLang]);

  const stopLive = useCallback(() => {
    translatorRef.current?.stop();
    translatorRef.current = null;
    setStatus("idle");
    setVolume(0);
  }, []);

  const handleToggle = () => {
    if (isActive) {
      stopLive();
    } else {
      startLive();
    }
  };

  const handleRestart = () => {
    stopLive();
    setTimeout(() => startLive(), 300);
  };

  // ── Status indicator config ──
  const statusConfig = {
    idle: { color: "text-zinc-500", dot: "bg-zinc-600", label: "آماده" },
    connecting: { color: "text-amber-400", dot: "bg-amber-400 animate-pulse", label: "در حال اتصال..." },
    connected: { color: "text-emerald-400", dot: "bg-emerald-400", label: `زنده ${formatDuration(sessionDuration)}` },
    reconnecting: { color: "text-orange-400", dot: "bg-orange-400 animate-pulse", label: `اتصال مجدد (${reconnectAttempt}/${maxAttempts})...` },
    error: { color: "text-rose-400", dot: "bg-rose-500", label: "خطا در اتصال" },
    max_retries: { color: "text-rose-500", dot: "bg-rose-600 animate-ping", label: "اتصال برقرار نشد" },
  }[status];

  return (
    <div
      className="flex flex-col gap-4 p-5 border border-amber-500/20 bg-gradient-to-b from-neutral-900/90 to-black/90 rounded-3xl w-full backdrop-blur-xl shadow-2xl font-[Vazirmatn]"
      dir="rtl"
    >
      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Start/Stop Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleToggle}
            disabled={status === "connecting"}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-wait ${
              isActive
                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 shadow-red-500/30"
                : status === "max_retries" || status === "error"
                ? "bg-gradient-to-r from-rose-700 to-red-700 text-white"
                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-500/30"
            }`}
            aria-label={isActive ? "توقف ترجمه" : "شروع ترجمه"}
          >
            {status === "connecting" ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isActive ? (
              <Square className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
            <span>
              {status === "connecting"
                ? "در حال اتصال..."
                : status === "reconnecting"
                ? "در حال اتصال مجدد..."
                : isLive
                ? "توقف ترجمه زنده"
                : "شروع ترجمه زنده Gemini AI"}
            </span>
          </button>

          {/* Restart button — only when error or max_retries */}
          {(status === "error" || status === "max_retries") && (
            <button
              onClick={handleRestart}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 transition"
              title="تلاش مجدد"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تلاش مجدد</span>
            </button>
          )}
        </div>

        {/* Model badge + status */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Pill */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold ${
            isLive ? "border-emerald-500/30 bg-emerald-500/10" :
            status === "reconnecting" ? "border-orange-500/30 bg-orange-500/10" :
            status === "error" || status === "max_retries" ? "border-rose-500/30 bg-rose-500/10" :
            "border-white/10 bg-white/5"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            <span className={statusConfig.color}>{statusConfig.label}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-[11px]">Gemini 3.5 Live</span>
          </div>

          <HelpTooltip text="ترجمه همزمان بلادرنگ صوتی Google Gemini. صدای گوینده مستقیماً به صدا و زیرنویس ترجمه‌شده تبدیل می‌شود. در صورت قطعی، سیستم تا ۳ بار به‌طور خودکار اتصال مجدد برقرار می‌کند." />
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-neutral-400" />
          <span className="text-xs text-neutral-400">زبان مقصد:</span>
          <select
            value={targetLang}
            onChange={(e) => {
              setTargetLang(e.target.value);
              translatorRef.current?.setTargetLanguage(e.target.value);
            }}
            disabled={status === "connecting" || status === "reconnecting"}
            className="bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
          >
            <option value="en">🇺🇸 English</option>
            <option value="fa">🇮🇷 فارسی</option>
            <option value="es">🇪🇸 Español</option>
            <option value="de">🇩🇪 Deutsch</option>
            <option value="fr">🇫🇷 Français</option>
            <option value="ar">🇸🇦 العربية</option>
            <option value="tr">🇹🇷 Türkçe</option>
          </select>
        </div>
      </div>

      {/* ── LIVE INDICATOR BAR ── */}
      {isLive && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
          <div className="flex items-center gap-2 font-bold">
            <Radio className="w-4 h-4 animate-pulse text-emerald-400" />
            <span>پخش و ترجمه زنده صوتی فعال — {formatDuration(sessionDuration)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-neutral-400">سطح ورودی:</span>
            <div className="w-24 h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-75"
                style={{ width: `${Math.min(100, Math.round(volume * 100))}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── RECONNECTING BANNER ── */}
      {status === "reconnecting" && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-300">
          <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
          <div>
            <p className="font-bold">اتصال قطع شد — در حال اتصال مجدد ({reconnectAttempt}/{maxAttempts})...</p>
            <p className="text-orange-400/70 mt-0.5">صبر کنید، سیستم به‌طور خودکار دوباره متصل می‌شود.</p>
          </div>
        </div>
      )}

      {/* ── ERROR BANNER ── */}
      {(status === "error" || status === "max_retries") && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <div>
            <p className="font-bold">
              {status === "max_retries"
                ? "پس از ۳ تلاش، اتصال برقرار نشد."
                : "خطا در سرویس ترجمه زنده."}
            </p>
            <p className="text-rose-400/70 mt-0.5">
              دکمه «تلاش مجدد» را بزنید یا از اتصال اینترنت مطمئن شوید.
            </p>
          </div>
        </div>
      )}

      {/* ── TRANSCRIPTS ── */}
      {(inputTranscript || outputTranscript || isActive) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
          {/* Original */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 min-h-[90px] flex flex-col">
            <span className="block text-[11px] font-bold text-neutral-400 mb-2">
              🎙 گفتار ورودی (متن مبدا):
            </span>
            <p className="text-sm text-neutral-200 leading-relaxed font-medium flex-1">
              {inputTranscript || (
                <span className="text-neutral-600 italic">
                  {isLive ? "در حال گوش دادن به صدای گوینده..." : "—"}
                </span>
              )}
            </p>
          </div>

          {/* Translated */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 min-h-[90px] flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-amber-400">🔊 ترجمه زنده:</span>
              {isLive && <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
            </div>
            <p className="text-sm text-amber-200 leading-relaxed font-bold flex-1">
              {outputTranscript || (
                <span className="text-neutral-600 italic font-normal">
                  {isLive ? "ترجمه بلادرنگ اینجا نمایش داده می‌شود..." : "—"}
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
