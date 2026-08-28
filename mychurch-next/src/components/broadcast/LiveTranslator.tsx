"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Square, Sparkles, Volume2, Globe, Radio } from "lucide-react";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import { GeminiLiveTranslator } from "@/lib/geminiLiveTranslator";

interface LiveTranslatorProps {
  meetingId?: string;
  defaultTargetLang?: string;
}

export default function LiveTranslator({
  meetingId = "broadcast-main",
  defaultTargetLang = "en",
}: LiveTranslatorProps) {
  const [isLive, setIsLive] = useState(false);
  const [mode, setMode] = useState<"gemini-live" | "browser-stt">("gemini-live");
  const [targetLang, setTargetLang] = useState(defaultTargetLang);
  const [inputTranscript, setInputTranscript] = useState("");
  const [outputTranscript, setOutputTranscript] = useState("");
  const [volume, setVolume] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");

  const geminiTranslatorRef = useRef<GeminiLiveTranslator | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (geminiTranslatorRef.current) {
        geminiTranslatorRef.current.stop();
      }
    };
  }, []);

  const startGeminiLive = async () => {
    setStatusMsg("در حال دریافت توکن و اتصال به Gemini Live...");
    try {
      // 1. Fetch ephemeral token from our server route
      const tokenRes = await fetch("/api/translate/live-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetLanguage: targetLang, echoTargetLanguage: true }),
      });

      const tokenData = await tokenRes.json();
      const token = tokenData.token || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

      const translator = new GeminiLiveTranslator(
        {
          targetLanguageCode: targetLang,
          echoTargetLanguage: true,
          token: token,
        },
        {
          onOpen: () => {
            setIsLive(true);
            setStatusMsg("متصل شد — در حال ترجمه پیوسته صوتی و متنی...");
          },
          onClose: () => {
            setIsLive(false);
            setStatusMsg("ارتباط قطع شد.");
          },
          onError: (err) => {
            console.error("[LiveTranslator] Error:", err);
            setStatusMsg(`خطا: ${err}`);
            setIsLive(false);
          },
          onInputTranscript: (text) => {
            setInputTranscript(text);
          },
          onOutputTranscript: (text) => {
            setOutputTranscript(text);
          },
          onVolumeChange: (vol) => {
            setVolume(vol);
          },
        }
      );

      geminiTranslatorRef.current = translator;
      await translator.start();
    } catch (err: any) {
      console.error("[LiveTranslator] Start failed:", err);
      setStatusMsg("خطا در دسترسی به میکروفون یا اتصال به سرور هوش مصنوعی.");
      setIsLive(false);
    }
  };

  const stopGeminiLive = () => {
    if (geminiTranslatorRef.current) {
      geminiTranslatorRef.current.stop();
      geminiTranslatorRef.current = null;
    }
    setIsLive(false);
    setStatusMsg("");
    setVolume(0);
  };

  const toggleLive = () => {
    if (isLive) {
      stopGeminiLive();
    } else {
      startGeminiLive();
    }
  };

  return (
    <div className="flex flex-col gap-4 p-5 border border-amber-500/20 bg-gradient-to-b from-neutral-900/90 to-black/90 rounded-3xl w-full backdrop-blur-xl shadow-2xl font-[Vazirmatn]" dir="rtl">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLive}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-lg active:scale-95 ${
              isLive
                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 shadow-red-500/30 animate-pulse"
                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-500/30"
            }`}
          >
            {isLive ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isLive ? "توقف ترجمه زنده" : "شروع ترجمه زنده Gemini AI"}</span>
          </button>

          {/* Mode Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-[11px]">Gemini 3.5 Live Voice-to-Voice</span>
          </div>

          <HelpTooltip text="موتور ترجمه همزمان بلادرنگ صوتی گوگل جمینای. صدای گوینده مستقیماً به صدای ترجمه شده و زیرنویس زنده تبدیل می‌شود." />
        </div>

        {/* Target language selector */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-neutral-400" />
          <span className="text-xs text-neutral-400">زبان مقصد:</span>
          <select
            value={targetLang}
            onChange={(e) => {
              setTargetLang(e.target.value);
              if (geminiTranslatorRef.current) {
                geminiTranslatorRef.current.setTargetLanguage(e.target.value);
              }
            }}
            className="bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            disabled={isLive}
          >
            <option value="en">🇺🇸 English (انگلیسی)</option>
            <option value="fa">🇮🇷 فارسی (Persian)</option>
            <option value="es">🇪🇸 Español (اسپانیایی)</option>
            <option value="de">🇩🇪 Deutsch (آلمانی)</option>
            <option value="fr">🇫🇷 Français (فرانسوی)</option>
            <option value="ar">🇸🇦 العربية (عربی)</option>
            <option value="tr">🇹🇷 Türkçe (ترکی)</option>
          </select>
        </div>
      </div>

      {/* Live indicators */}
      {isLive && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
          <div className="flex items-center gap-2 font-bold">
            <Radio className="w-4 h-4 animate-spin text-emerald-400" />
            <span>پخش و ترجمه زنده صوتی فعال است</span>
          </div>
          {/* Dynamic Volume Bar */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-neutral-400">سطح ورودی صدا:</span>
            <div className="w-24 h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-75"
                style={{ width: `${Math.min(100, Math.round(volume * 100))}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Transcripts Display Grid */}
      {(inputTranscript || outputTranscript || isLive) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
          {/* Original speech transcript */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 min-h-[90px] flex flex-col justify-between">
            <div>
              <span className="block text-[11px] font-bold text-neutral-400 mb-1">گفتار ورودی (متن مبدا):</span>
              <p className="text-sm text-neutral-200 leading-relaxed font-medium">
                {inputTranscript || (
                  <span className="text-neutral-600 italic">در حال گوش دادن به صدای گوینده...</span>
                )}
              </p>
            </div>
          </div>

          {/* Translated live transcript */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 min-h-[90px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-amber-400">ترجمه زنده صوتی و متنی:</span>
                <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              </div>
              <p className="text-sm text-amber-200 leading-relaxed font-bold">
                {outputTranscript || (
                  <span className="text-neutral-600 italic font-normal">
                    ترجمه بلادرنگ در اینجا نمایش و همزمان پخش می‌شود...
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {statusMsg && !isLive && (
        <p className="text-xs text-neutral-400 text-center">{statusMsg}</p>
      )}
    </div>
  );
}
