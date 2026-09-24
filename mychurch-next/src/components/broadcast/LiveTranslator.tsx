"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic, Square, Sparkles, Volume2, Globe, Radio,
  RefreshCw, AlertTriangle, WifiOff, Wifi
} from "lucide-react";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import { GeminiLiveTranslator } from "@/lib/geminiLiveTranslator";
import { toast } from "sonner";
import { useLanguage } from "@/providers/LanguageProvider";

const localDict = {
  en: {
    apiKeyNotFound: "Gemini API key not found. Please set GEMINI_API_KEY in the server environment settings.",
    connectedSuccess: "Live translation connected ✓",
    translationError: (err: string) => `Translation error: ${err}`,
    reconnectingToast: (attempt: number, max: number) => `Reconnecting... (${attempt}/${max})`,
    maxRetriesError: "Connection to Gemini Live was lost after 3 attempts. Please start again.",
    micAccessError: "Error accessing the microphone or connecting to the AI server.",
    statusIdle: "Ready",
    statusConnecting: "Connecting...",
    statusConnected: (duration: string) => `Live ${duration}`,
    statusReconnecting: (attempt: number, max: number) => `Reconnecting (${attempt}/${max})...`,
    statusError: "Connection error",
    statusMaxRetries: "Connection failed",
    stopTranslationAria: "Stop translation",
    startTranslationAria: "Start translation",
    connectingButton: "Connecting...",
    reconnectingButton: "Reconnecting...",
    stopLiveTranslation: "Stop Live Translation",
    startLiveTranslation: "Start Gemini AI Live Translation",
    retry: "Retry",
    helpTooltipText: "Real-time simultaneous voice translation by Google Gemini. The speaker's voice is converted directly into translated audio and captions. If the connection drops, the system automatically reconnects up to 3 times.",
    targetLanguageLabel: "Target language:",
    liveAudioActive: (duration: string) => `Live audio translation active — ${duration}`,
    inputLevel: "Input level:",
    connectionLostReconnecting: (attempt: number, max: number) => `Connection lost — reconnecting (${attempt}/${max})...`,
    waitAutoReconnect: "Please wait, the system will automatically reconnect.",
    failedAfter3Attempts: "Connection failed after 3 attempts.",
    liveTranslationServiceError: "Error in the live translation service.",
    pressRetryOrCheckInternet: "Press «Retry» or check your internet connection.",
    inputSpeechLabel: "🎙 Input speech (source text):",
    listeningToSpeaker: "Listening to the speaker...",
    liveTranslationLabel: "🔊 Live translation:",
    liveTranslationPlaceholder: "The real-time translation will appear here...",
  },
  fa: {
    apiKeyNotFound: "کلید API Gemini یافت نشد. لطفاً GEMINI_API_KEY را در تنظیمات محیطی سرور تنظیم کنید.",
    connectedSuccess: "ترجمه زنده متصل شد ✓",
    translationError: (err: string) => `خطای ترجمه: ${err}`,
    reconnectingToast: (attempt: number, max: number) => `اتصال مجدد... (${attempt}/${max})`,
    maxRetriesError: "اتصال به Gemini Live پس از ۳ تلاش قطع شد. لطفاً دوباره شروع کنید.",
    micAccessError: "خطا در دسترسی به میکروفون یا اتصال به سرور AI.",
    statusIdle: "آماده",
    statusConnecting: "در حال اتصال...",
    statusConnected: (duration: string) => `زنده ${duration}`,
    statusReconnecting: (attempt: number, max: number) => `اتصال مجدد (${attempt}/${max})...`,
    statusError: "خطا در اتصال",
    statusMaxRetries: "اتصال برقرار نشد",
    stopTranslationAria: "توقف ترجمه",
    startTranslationAria: "شروع ترجمه",
    connectingButton: "در حال اتصال...",
    reconnectingButton: "در حال اتصال مجدد...",
    stopLiveTranslation: "توقف ترجمه زنده",
    startLiveTranslation: "شروع ترجمه زنده Gemini AI",
    retry: "تلاش مجدد",
    helpTooltipText: "ترجمه همزمان بلادرنگ صوتی Google Gemini. صدای گوینده مستقیماً به صدا و زیرنویس ترجمه‌شده تبدیل می‌شود. در صورت قطعی، سیستم تا ۳ بار به‌طور خودکار اتصال مجدد برقرار می‌کند.",
    targetLanguageLabel: "زبان مقصد:",
    liveAudioActive: (duration: string) => `پخش و ترجمه زنده صوتی فعال — ${duration}`,
    inputLevel: "سطح ورودی:",
    connectionLostReconnecting: (attempt: number, max: number) => `اتصال قطع شد — در حال اتصال مجدد (${attempt}/${max})...`,
    waitAutoReconnect: "صبر کنید، سیستم به‌طور خودکار دوباره متصل می‌شود.",
    failedAfter3Attempts: "پس از ۳ تلاش، اتصال برقرار نشد.",
    liveTranslationServiceError: "خطا در سرویس ترجمه زنده.",
    pressRetryOrCheckInternet: "دکمه «تلاش مجدد» را بزنید یا از اتصال اینترنت مطمئن شوید.",
    inputSpeechLabel: "🎙 گفتار ورودی (متن مبدا):",
    listeningToSpeaker: "در حال گوش دادن به صدای گوینده...",
    liveTranslationLabel: "🔊 ترجمه زنده:",
    liveTranslationPlaceholder: "ترجمه بلادرنگ اینجا نمایش داده می‌شود...",
  },
  es: {
    apiKeyNotFound: "No se encontró la clave API de Gemini. Configure GEMINI_API_KEY en los ajustes del entorno del servidor.",
    connectedSuccess: "Traducción en vivo conectada ✓",
    translationError: (err: string) => `Error de traducción: ${err}`,
    reconnectingToast: (attempt: number, max: number) => `Reconectando... (${attempt}/${max})`,
    maxRetriesError: "La conexión con Gemini Live se perdió después de 3 intentos. Vuelva a empezar.",
    micAccessError: "Error al acceder al micrófono o conectar con el servidor de IA.",
    statusIdle: "Listo",
    statusConnecting: "Conectando...",
    statusConnected: (duration: string) => `En vivo ${duration}`,
    statusReconnecting: (attempt: number, max: number) => `Reconectando (${attempt}/${max})...`,
    statusError: "Error de conexión",
    statusMaxRetries: "Conexión fallida",
    stopTranslationAria: "Detener traducción",
    startTranslationAria: "Iniciar traducción",
    connectingButton: "Conectando...",
    reconnectingButton: "Reconectando...",
    stopLiveTranslation: "Detener traducción en vivo",
    startLiveTranslation: "Iniciar traducción en vivo con Gemini AI",
    retry: "Reintentar",
    helpTooltipText: "Traducción de voz simultánea en tiempo real de Google Gemini. La voz del orador se convierte directamente en audio y subtítulos traducidos. Si la conexión se interrumpe, el sistema se reconecta automáticamente hasta 3 veces.",
    targetLanguageLabel: "Idioma de destino:",
    liveAudioActive: (duration: string) => `Traducción de audio en vivo activa — ${duration}`,
    inputLevel: "Nivel de entrada:",
    connectionLostReconnecting: (attempt: number, max: number) => `Conexión perdida — reconectando (${attempt}/${max})...`,
    waitAutoReconnect: "Espere, el sistema se reconectará automáticamente.",
    failedAfter3Attempts: "La conexión falló después de 3 intentos.",
    liveTranslationServiceError: "Error en el servicio de traducción en vivo.",
    pressRetryOrCheckInternet: "Pulse «Reintentar» o verifique su conexión a internet.",
    inputSpeechLabel: "🎙 Voz de entrada (texto de origen):",
    listeningToSpeaker: "Escuchando al orador...",
    liveTranslationLabel: "🔊 Traducción en vivo:",
    liveTranslationPlaceholder: "La traducción en tiempo real aparecerá aquí...",
  },
};

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
  const { language, isRTL } = useLanguage();
  const d = localDict[language] || localDict.fa;
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
        toast.error(d.apiKeyNotFound);
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
            toast.success(d.connectedSuccess, { duration: 2000 });
          },
          onClose: (reason) => {
            if (translatorRef.current === null) return; // intentional stop
            setStatus("idle");
          },
          onError: (err) => {
            console.error("[LiveTranslator] Error:", err);
            setStatus("error");
            toast.error(d.translationError(err), { duration: 4000 });
          },
          onReconnecting: (attempt, max) => {
            setStatus("reconnecting");
            setReconnectAttempt(attempt);
            setMaxAttempts(max);
            toast.warning(d.reconnectingToast(attempt, max), { duration: 2000 });
          },
          onMaxRetriesReached: () => {
            setStatus("max_retries");
            toast.error(d.maxRetriesError, { duration: 5000 });
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
      toast.error(d.micAccessError);
    }
  }, [targetLang, d]);

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
    idle: { color: "text-zinc-500", dot: "bg-zinc-600", label: d.statusIdle },
    connecting: { color: "text-amber-400", dot: "bg-amber-400 animate-pulse", label: d.statusConnecting },
    connected: { color: "text-emerald-400", dot: "bg-emerald-400", label: d.statusConnected(formatDuration(sessionDuration)) },
    reconnecting: { color: "text-orange-400", dot: "bg-orange-400 animate-pulse", label: d.statusReconnecting(reconnectAttempt, maxAttempts) },
    error: { color: "text-rose-400", dot: "bg-rose-500", label: d.statusError },
    max_retries: { color: "text-rose-500", dot: "bg-rose-600 animate-ping", label: d.statusMaxRetries },
  }[status];

  return (
    <div
      className="flex flex-col gap-4 p-5 border border-amber-500/20 bg-gradient-to-b from-neutral-900/90 to-black/90 rounded-3xl w-full backdrop-blur-xl shadow-2xl font-[Vazirmatn]"
      dir={isRTL ? "rtl" : "ltr"}
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
            aria-label={isActive ? d.stopTranslationAria : d.startTranslationAria}
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
                ? d.connectingButton
                : status === "reconnecting"
                ? d.reconnectingButton
                : isLive
                ? d.stopLiveTranslation
                : d.startLiveTranslation}
            </span>
          </button>

          {/* Restart button — only when error or max_retries */}
          {(status === "error" || status === "max_retries") && (
            <button
              onClick={handleRestart}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 transition"
              title={d.retry}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{d.retry}</span>
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

          <HelpTooltip text={d.helpTooltipText} />
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-neutral-400" />
          <span className="text-xs text-neutral-400">{d.targetLanguageLabel}</span>
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
            <span>{d.liveAudioActive(formatDuration(sessionDuration))}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-neutral-400">{d.inputLevel}</span>
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
            <p className="font-bold">{d.connectionLostReconnecting(reconnectAttempt, maxAttempts)}</p>
            <p className="text-orange-400/70 mt-0.5">{d.waitAutoReconnect}</p>
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
                ? d.failedAfter3Attempts
                : d.liveTranslationServiceError}
            </p>
            <p className="text-rose-400/70 mt-0.5">
              {d.pressRetryOrCheckInternet}
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
              {d.inputSpeechLabel}
            </span>
            <p className="text-sm text-neutral-200 leading-relaxed font-medium flex-1">
              {inputTranscript || (
                <span className="text-neutral-600 italic">
                  {isLive ? d.listeningToSpeaker : "—"}
                </span>
              )}
            </p>
          </div>

          {/* Translated */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 min-h-[90px] flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-amber-400">{d.liveTranslationLabel}</span>
              {isLive && <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
            </div>
            <p className="text-sm text-amber-200 leading-relaxed font-bold flex-1">
              {outputTranscript || (
                <span className="text-neutral-600 italic font-normal">
                  {isLive ? d.liveTranslationPlaceholder : "—"}
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
