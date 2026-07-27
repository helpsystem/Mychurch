"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Mic, MicOff, Volume2, Copy, Trash2, ArrowRightLeft, 
    Play, Square, Sparkles, Settings, HelpCircle, Check,
    MessageSquare, History, VolumeX, ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { nvidiaTranslateText } from "@/actions/translate";

// Supported languages and their configuration
const LANGUAGES = [
    { code: "fa", name: "فارسی", flag: "🇮🇷", dir: "rtl", sttCode: "fa-IR", ttsCode: "fa-IR" },
    { code: "en", name: "English", flag: "🇺🇸", dir: "ltr", sttCode: "en-US", ttsCode: "en-US" },
    { code: "ar", name: "العربية", flag: "🇸🇦", dir: "rtl", sttCode: "ar-SA", ttsCode: "ar-SA" },
    { code: "es", name: "Español", flag: "🇪🇸", dir: "ltr", sttCode: "es-ES", ttsCode: "es-ES" },
    { code: "fr", name: "Français", flag: "🇫🇷", dir: "ltr", sttCode: "fr-FR", ttsCode: "fr-FR" },
    { code: "de", name: "Deutsch", flag: "🇩🇪", dir: "ltr", sttCode: "de-DE", ttsCode: "de-DE" },
    { code: "tr", name: "Türkçe", flag: "🇹🇷", dir: "ltr", sttCode: "tr-TR", ttsCode: "tr-TR" },
    { code: "ru", name: "Русский", flag: "🇷🇺", dir: "ltr", sttCode: "ru-RU", ttsCode: "ru-RU" },
    { code: "zh", name: "中文", flag: "🇨🇳", dir: "ltr", sttCode: "zh-CN", ttsCode: "zh-CN" },
    { code: "ko", name: "한국어", flag: "🇰🇷", dir: "ltr", sttCode: "ko-KR", ttsCode: "ko-KR" },
    { code: "ja", name: "日本語", flag: "🇯🇵", dir: "ltr", sttCode: "ja-JP", ttsCode: "ja-JP" },
];

interface TranslationHistoryItem {
    id: string;
    originalText: string;
    translatedText: string;
    fromLang: string;
    toLang: string;
    timestamp: string;
    duration: string;
}

export default function LiveTranslatorPage() {
    // UI State
    const [fromLang, setFromLang] = useState("fa");
    const [toLang, setToLang] = useState("en");
    const [isListening, setIsListening] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    // Transcripts
    const [sourceText, setSourceText] = useState("");
    const [translatedText, setTranslatedText] = useState("");
    const [interimText, setInterimText] = useState("");
    
    // Configurations
    const [autoSpeak, setAutoSpeak] = useState(true);
    const [continuous, setContinuous] = useState(true);
    const [showInterim, setShowInterim] = useState(true);
    const [convMode, setConvMode] = useState(false);
    const [activeSpeaker, setActiveSpeaker] = useState<"A" | "B">("A");
    
    // History & stats
    const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
    const [latency, setLatency] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(true);

    // Refs
    const recognitionRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const speechAccumulatorRef = useRef<string>("");

    const currentFromLang = LANGUAGES.find(l => l.code === fromLang) || LANGUAGES[1];
    const currentToLang = LANGUAGES.find(l => l.code === toLang) || LANGUAGES[0];

    // ─── Initialize Speech Recognition ───
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
            toast.error("مرورگر شما از Speech Recognition پشتیبانی نمی‌کند. لطفاً از کروم استفاده کنید.");
        }
        
        // Load history from localStorage if available
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("mychurch_translator_history");
            if (saved) {
                try { setHistory(JSON.parse(saved)); } catch (e) { console.error(e); }
            }
        }
        
        return () => {
            stopListening();
            stopAudioVisualization();
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // ─── Speech Recognition Handler ───
    const startListening = () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const activeLangCode = convMode 
            ? (activeSpeaker === "A" ? fromLang : toLang)
            : fromLang;
        const activeLangConfig = LANGUAGES.find(l => l.code === activeLangCode) || LANGUAGES[1];

        const rec = new SpeechRecognition();
        rec.lang = activeLangConfig.sttCode;
        rec.continuous = continuous;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        speechAccumulatorRef.current = "";
        setSourceText("");
        setInterimText("");
        setTranslatedText("");

        rec.onstart = () => {
            setIsListening(true);
            startAudioVisualization();
            toast.info("میکروفون فعال شد. شروع به صحبت کنید...");
        };

        rec.onresult = (event: any) => {
            let interim = "";
            let final = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript;
                } else {
                    interim += transcript;
                }
            }

            if (interim && showInterim) {
                setInterimText(interim);
            }

            if (final) {
                speechAccumulatorRef.current += (speechAccumulatorRef.current ? " " : "") + final;
                const updatedSource = speechAccumulatorRef.current;
                setSourceText(updatedSource);
                setInterimText("");
                
                // Trigger translation
                const sourceLang = convMode ? (activeSpeaker === "A" ? fromLang : toLang) : fromLang;
                const targetLang = convMode ? (activeSpeaker === "A" ? toLang : fromLang) : toLang;
                handleTranslate(updatedSource, sourceLang, targetLang);
            }
        };

        rec.onerror = (event: any) => {
            if (event.error !== "no-speech" && event.error !== "aborted") {
                console.error("Speech Recognition Error:", event.error);
                toast.error(`خطای شناسایی گفتار: ${event.error}`);
                stopListening();
            }
        };

        rec.onend = () => {
            if (isListening && continuous) {
                try {
                    recognitionRef.current.start();
                } catch (e) {
                    stopListening();
                }
            } else {
                stopListening();
            }
        };

        recognitionRef.current = rec;
        rec.start();
    };

    const stopListening = () => {
        setIsListening(false);
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) {}
            recognitionRef.current = null;
        }
        stopAudioVisualization();

        // Ensure accumulated text gets translated immediately when microphone stops
        const fullText = (speechAccumulatorRef.current || sourceText).trim();
        if (fullText) {
            const sourceLang = convMode ? (activeSpeaker === "A" ? fromLang : toLang) : fromLang;
            const targetLang = convMode ? (activeSpeaker === "A" ? toLang : fromLang) : toLang;
            handleTranslate(fullText, sourceLang, targetLang);
        }
        setInterimText("");
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    // ─── Nvidia GLM Translation Handler ───
    const handleTranslate = async (text: string, src: string, dest: string) => {
        if (!text || text.trim() === "") return;

        setIsTranslating(true);
        const start = performance.now();

        try {
            const res = await nvidiaTranslateText(text, src, dest);
            const elapsed = ((performance.now() - start) / 1000).toFixed(2);
            setLatency(elapsed);

            if (res.success && res.text) {
                setTranslatedText(res.text);

                // Auto Speak
                if (autoSpeak) {
                    speakText(res.text, dest);
                }

                // Add to history
                const newItem: TranslationHistoryItem = {
                    id: Math.random().toString(36).substring(2, 9),
                    originalText: text,
                    translatedText: res.text,
                    fromLang: src,
                    toLang: dest,
                    timestamp: new Date().toLocaleTimeString("fa-IR"),
                    duration: elapsed
                };

                setHistory(prev => {
                    const updated = [newItem, ...prev.slice(0, 49)];
                    localStorage.setItem("mychurch_translator_history", JSON.stringify(updated));
                    return updated;
                });
            } else {
                toast.error(res.error || "خطا در ترجمه.");
            }
        } catch (error) {
            console.error(error);
            toast.error("برقراری ارتباط با سرور ترجمه با خطا مواجه شد.");
        } finally {
            setIsTranslating(false);
        }
    };

    // ─── Audio Waveform Canvas ───
    const startAudioVisualization = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioCtx();
            audioContextRef.current = audioCtx;

            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 128;
            source.connect(analyser);
            analyserRef.current = analyser;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const draw = () => {
                if (!analyserRef.current || !canvasRef.current) return;
                
                animationFrameRef.current = requestAnimationFrame(draw);
                analyser.getByteFrequencyData(dataArray);

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Draw decorative waves
                ctx.lineWidth = 2;
                ctx.strokeStyle = "rgba(99, 102, 241, 0.8)"; // Indigo color
                ctx.beginPath();

                const sliceWidth = canvas.width / bufferLength;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const percent = dataArray[i] / 255;
                    const amplitude = percent * (canvas.height / 2);
                    const y = (canvas.height / 2) + (i % 2 === 0 ? amplitude : -amplitude) * Math.sin(x * 0.05);

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }

                    x += sliceWidth;
                }

                ctx.lineTo(canvas.width, canvas.height / 2);
                ctx.stroke();
            };

            draw();
        } catch (err) {
            console.error("Microphone access denied for visualizer:", err);
        }
    };

    const stopAudioVisualization = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }
        analyserRef.current = null;

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    // ─── Text-to-Speech (TTS) ───
    const speakText = (text: string, langCode: string) => {
        if (!window.speechSynthesis || !text) return;

        window.speechSynthesis.cancel();
        const langConfig = LANGUAGES.find(l => l.code === langCode);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langConfig?.ttsCode || "en-US";
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const targetPrefix = (langConfig?.ttsCode || "en-US").split("-")[0];
        const matchingVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetPrefix.toLowerCase()));
        
        if (matchingVoice) {
            utterance.voice = matchingVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    // ─── Utilities ───
    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success("متن با موفقیت کپی شد!");
    };

    const swapLanguages = () => {
        const temp = fromLang;
        setFromLang(toLang);
        setToLang(temp);
        
        // Swap content
        const tempSource = sourceText;
        setSourceText(translatedText);
        setTranslatedText(tempSource);
    };

    const clearAll = () => {
        setSourceText("");
        setTranslatedText("");
        setInterimText("");
        speechAccumulatorRef.current = "";
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem("mychurch_translator_history");
        toast.success("تاریخچه ترجمه پاک شد.");
    };

    return (
        <div className="space-y-8 pb-12 font-[Vazirmatn]">
            {/* Header section with glassmorphism */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-8 md:p-10 backdrop-blur-2xl">
                <div className="absolute top-0 right-0 -z-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-[80px]" />
                <div className="absolute bottom-0 left-0 -z-10 h-72 w-72 rounded-full bg-purple-500/10 blur-[80px]" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                                <Sparkles className="w-5 h-5" />
                            </span>
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Live AI Speech Tool</span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-white">مترجم همزمان گفتار</h2>
                        <p className="text-neutral-400 text-sm">ترجمه صوتی بلادرنگ دو طرفه با استفاده از هوش مصنوعی محلی پیشرفته Nvidia GLM-5.1</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-neutral-300 font-mono">Nvidia Llama 3.1 70B / Gemini AI</span>
                        </div>
                        
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-300">
                            <span>تاخیر شبکه:</span>
                            <span className="font-bold text-indigo-400 font-mono">{latency ? `${latency}s` : "N/A"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Check browser compatibility */}
            {!isSupported && (
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    <ShieldAlert className="w-6 h-6 shrink-0" />
                    <div className="space-y-1">
                        <h4 className="font-bold">مرورگر ناسازگار</h4>
                        <p className="text-xs text-amber-400/80 leading-relaxed">
                            مرورگر شما از وب سرویس‌های Web Speech API پشتیبانی نمی‌کند. قابلیت تشخیص صدا (STT) در این مرورگر غیرفعال است. جهت دریافت بهترین بازدهی لطفا از آخرین نسخه مرورگر Google Chrome استفاده کنید.
                        </p>
                    </div>
                </div>
            )}

            {/* Language Selector bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <span className="text-neutral-400 text-xs font-bold whitespace-nowrap">زبان مبدا:</span>
                    <select 
                        value={fromLang} 
                        onChange={(e) => setFromLang(e.target.value)}
                        className="w-full sm:w-44 bg-neutral-900 border border-white/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
                        disabled={isListening}
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>
                                {lang.flag} {lang.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button 
                    onClick={swapLanguages}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-indigo-400 hover:text-white transition-all transform hover:rotate-180 duration-500 active:scale-95 shrink-0"
                    title="جابجایی زبان‌ها"
                    disabled={isListening}
                >
                    <ArrowRightLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <span className="text-neutral-400 text-xs font-bold whitespace-nowrap">زبان مقصد:</span>
                    <select 
                        value={toLang} 
                        onChange={(e) => setToLang(e.target.value)}
                        className="w-full sm:w-44 bg-neutral-900 border border-white/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
                        disabled={isListening}
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>
                                {lang.flag} {lang.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Interactive Translation Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Source Speech Transcription Panel */}
                <div className="lg:col-span-5 flex flex-col rounded-3xl border border-white/10 bg-neutral-900/40 overflow-hidden backdrop-blur-xl relative">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{currentFromLang.flag}</span>
                            <span className="font-bold text-sm text-neutral-200">
                                {convMode && activeSpeaker === "B" ? currentToLang.name : currentFromLang.name}
                            </span>
                        </div>
                        <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Source Speech</span>
                    </div>

                    <div 
                        className="flex-1 p-6 min-h-[220px] max-h-[350px] overflow-y-auto text-lg leading-relaxed font-medium relative" 
                        dir={convMode && activeSpeaker === "B" ? currentToLang.dir : currentFromLang.dir}
                    >
                        {sourceText ? (
                            <span className="text-neutral-100">{sourceText}</span>
                        ) : (
                            <span className="text-neutral-600 italic text-sm">
                                {isListening 
                                    ? "درحال شنیدن صدای شما... شروع به صحبت کنید" 
                                    : "برای شروع ترجمه دکمه میکروفون را بزنید و صحبت کنید..."}
                            </span>
                        )}

                        {/* Live interim transcript overlay */}
                        {interimText && (
                            <p className="mt-3 text-indigo-400/80 italic text-base flex items-center gap-1.5 animate-pulse">
                                <span>💬</span>
                                <span>{interimText}</span>
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-black/10">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => copyToClipboard(sourceText)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-colors"
                                title="کپی متن"
                                disabled={!sourceText}
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => speakText(sourceText, convMode && activeSpeaker === "B" ? toLang : fromLang)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-colors"
                                title="پخش صوتی"
                                disabled={!sourceText}
                            >
                                <Volume2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    const textToTranslate = (speechAccumulatorRef.current || sourceText).trim();
                                    if (textToTranslate) {
                                        const sourceLang = convMode ? (activeSpeaker === "A" ? fromLang : toLang) : fromLang;
                                        const targetLang = convMode ? (activeSpeaker === "A" ? toLang : fromLang) : toLang;
                                        handleTranslate(textToTranslate, sourceLang, targetLang);
                                    }
                                }}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-40"
                                title="ترجمه فوری"
                                disabled={!sourceText && !speechAccumulatorRef.current}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>ترجمه فوری</span>
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                            {isListening ? (
                                <span className="flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                                    <span className="text-red-400 font-bold">Listening</span>
                                </span>
                            ) : (
                                <span>Idle</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pulsating Microphone Control Center */}
                <div className="lg:col-span-2 flex flex-col justify-center items-center gap-6 py-8">
                    {/* Big pulsing mic button */}
                    <div className="relative flex items-center justify-center">
                        <AnimatePresence>
                            {isListening && (
                                <>
                                    <motion.div 
                                        initial={{ scale: 0.9, opacity: 0.5 }}
                                        animate={{ scale: 1.6, opacity: 0 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                                        className="absolute h-24 w-24 rounded-full bg-indigo-500/20 border border-indigo-500/30 -z-10"
                                    />
                                    <motion.div 
                                        initial={{ scale: 0.9, opacity: 0.4 }}
                                        animate={{ scale: 2.2, opacity: 0 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                        transition={{ repeat: Infinity, duration: 2, delay: 0.7, ease: "easeOut" }}
                                        className="absolute h-24 w-24 rounded-full bg-purple-500/20 border border-purple-500/30 -z-10"
                                    />
                                </>
                            )}
                        </AnimatePresence>

                        <button 
                            onClick={toggleListening}
                            disabled={!isSupported}
                            className={`h-24 w-24 rounded-full flex items-center justify-center text-white border transition-all duration-300 relative z-10 shadow-2xl active:scale-95 cursor-pointer ${
                                isListening 
                                    ? "bg-gradient-to-r from-red-600 to-rose-500 border-red-500/30 shadow-red-500/20" 
                                    : isTranslating
                                        ? "bg-gradient-to-r from-amber-600 to-orange-500 border-amber-500/30 shadow-amber-500/20"
                                        : "bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-500/30 shadow-indigo-500/20 hover:scale-105"
                            }`}
                        >
                            {isListening ? (
                                <MicOff className="w-8 h-8 animate-pulse" />
                            ) : (
                                <Mic className="w-8 h-8" />
                            )}
                        </button>
                    </div>

                    <div className="text-center space-y-1">
                        <span className="block text-xs font-black uppercase tracking-widest text-neutral-400">
                            {isListening ? "Listening" : isTranslating ? "Translating" : "Press to Talk"}
                        </span>
                        <span className="block text-[11px] text-neutral-500 max-w-[120px] mx-auto leading-relaxed">
                            {isListening ? "کلیک کنید برای توقف" : "کلیک کنید برای ضبط صوتی"}
                        </span>
                    </div>

                    {/* Waveform Canvas */}
                    <div className="w-full max-w-[200px] h-12 bg-white/5 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center">
                        <canvas ref={canvasRef} width="200" height="48" className="w-full h-full block" />
                    </div>

                    {/* Quick clear button */}
                    <button 
                        onClick={clearAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-xs text-neutral-400 hover:text-red-400 transition-colors"
                        title="پاک کردن متن"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>پاکسازی</span>
                    </button>
                </div>

                {/* Target Translation Output Panel */}
                <div className="lg:col-span-5 flex flex-col rounded-3xl border border-white/10 bg-neutral-900/40 overflow-hidden backdrop-blur-xl relative">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{currentToLang.flag}</span>
                            <span className="font-bold text-sm text-neutral-200">
                                {convMode && activeSpeaker === "B" ? currentFromLang.name : currentToLang.name}
                            </span>
                        </div>
                        <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Translation</span>
                    </div>

                    <div 
                        className="flex-1 p-6 min-h-[220px] max-h-[350px] overflow-y-auto text-lg leading-relaxed font-bold text-white relative" 
                        dir={convMode && activeSpeaker === "B" ? currentFromLang.dir : currentToLang.dir}
                    >
                        {isTranslating ? (
                            <div className="flex flex-col gap-2 w-full h-full justify-center items-center py-6 text-neutral-400">
                                <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                                <span className="text-xs text-indigo-300">در حال ترجمه با هوش مصنوعی...</span>
                            </div>
                        ) : translatedText ? (
                            <span className="text-indigo-200">{translatedText}</span>
                        ) : (
                            <span className="text-neutral-600 italic text-sm">
                                ترجمه نهایی بعد از ثبت صحبت‌های شما در اینجا ظاهر خواهد شد...
                            </span>
                        )}
                    </div>

                    <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-black/10">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => copyToClipboard(translatedText)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-colors"
                                title="کپی ترجمه"
                                disabled={!translatedText}
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => speakText(translatedText, convMode && activeSpeaker === "B" ? fromLang : toLang)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-colors"
                                title="پخش صوتی ترجمه"
                                disabled={!translatedText}
                            >
                                <Volume2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs">
                            {isSpeaking ? (
                                <span className="flex items-center gap-1 text-indigo-400 font-bold">
                                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                    <span>Speaking TTS</span>
                                </span>
                            ) : (
                                <span className="text-neutral-500">Ready</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Conversation Mode Segment */}
            <div className="rounded-3xl border border-white/10 bg-neutral-900/30 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-indigo-400" />
                        <div>
                            <h3 className="font-bold text-white text-base">حالت گفتگوی دو نفره (Two-Way Mode)</h3>
                            <p className="text-xs text-neutral-400 mt-0.5">برای مصاحبه‌ها یا گفتگو‌های رو در رو با زبان‌های مختلف</p>
                        </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={convMode} 
                            onChange={(e) => setConvMode(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                    </label>
                </div>

                <AnimatePresence>
                    {convMode && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden border-t border-white/5 pt-4 mt-2"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => {
                                        setActiveSpeaker("A");
                                        if (isListening) {
                                            stopListening();
                                            setTimeout(startListening, 100);
                                        }
                                    }}
                                    className={`p-4 rounded-2xl border text-center transition-all ${
                                        activeSpeaker === "A"
                                            ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-300 ring-2 ring-indigo-500/20"
                                            : "bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    <span className="block text-xs uppercase font-bold tracking-widest text-neutral-400 mb-1">Speaker A</span>
                                    <span className="text-sm font-bold">{currentFromLang.flag} {currentFromLang.name}</span>
                                </button>

                                <button 
                                    onClick={() => {
                                        setActiveSpeaker("B");
                                        if (isListening) {
                                            stopListening();
                                            setTimeout(startListening, 100);
                                        }
                                    }}
                                    className={`p-4 rounded-2xl border text-center transition-all ${
                                        activeSpeaker === "B"
                                            ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-300 ring-2 ring-indigo-500/20"
                                            : "bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    <span className="block text-xs uppercase font-bold tracking-widest text-neutral-400 mb-1">Speaker B</span>
                                    <span className="text-sm font-bold">{currentToLang.flag} {currentToLang.name}</span>
                                </button>
                            </div>
                            
                            <p className="text-[11px] text-neutral-500 text-center mt-3 leading-relaxed">
                                نکته: هر سخنران در زمان صحبت، پنل خود را فعال می‌کند. صدا به زبان فرد مقابل ترجمه و پخش خواهد شد.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Translation Settings row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl bg-neutral-950 border border-white/5 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <span className="block font-bold text-sm text-neutral-200">پخش خودکار صوتی</span>
                        <span className="block text-[11px] text-neutral-500">پخش اتوماتیک متن ترجمه شده (TTS)</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={autoSpeak} 
                            onChange={(e) => setAutoSpeak(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                    </label>
                </div>

                <div className="p-5 rounded-2xl bg-neutral-950 border border-white/5 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <span className="block font-bold text-sm text-neutral-200">شنیدن مداوم</span>
                        <span className="block text-[11px] text-neutral-500">میکروفون پس از اتمام جمله باز می‌ماند</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={continuous} 
                            onChange={(e) => setContinuous(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                    </label>
                </div>

                <div className="p-5 rounded-2xl bg-neutral-950 border border-white/5 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                        <span className="block font-bold text-sm text-neutral-200">نمایش زنده تایپ</span>
                        <span className="block text-[11px] text-neutral-500">نمایش کلمات در حین تلفظ صوتی</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={showInterim} 
                            onChange={(e) => setShowInterim(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                    </label>
                </div>
            </div>

            {/* Translation History segment */}
            <div className="rounded-3xl border border-white/10 bg-neutral-900/20 p-6 md:p-8">
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                        <History className="w-5 h-5 text-indigo-400" />
                        <h3 className="font-bold text-white text-lg">تاریخچه ترجمه‌ها</h3>
                    </div>
                    
                    {history.length > 0 && (
                        <button 
                            onClick={clearHistory}
                            className="text-xs text-neutral-500 hover:text-red-400 font-bold transition-colors flex items-center gap-1.5"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف کل تاریخچه</span>
                        </button>
                    )}
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {history.length > 0 ? (
                        history.map((item) => {
                            const fromLangConfig = LANGUAGES.find(l => l.code === item.fromLang) || LANGUAGES[1];
                            const toLangConfig = LANGUAGES.find(l => l.code === item.toLang) || LANGUAGES[0];
                            return (
                                <div 
                                    key={item.id}
                                    className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                                >
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-start gap-4">
                                            <span className="text-neutral-500 font-bold text-xs uppercase tracking-wider min-w-[70px] pt-1">Original ({fromLangConfig.flag})</span>
                                            <p className="text-neutral-300 text-sm font-medium" dir={fromLangConfig.dir}>{item.originalText}</p>
                                        </div>
                                        <div className="flex items-start gap-4 border-t border-white/5 pt-2">
                                            <span className="text-indigo-400 font-bold text-xs uppercase tracking-wider min-w-[70px] pt-1">Translation ({toLangConfig.flag})</span>
                                            <p className="text-indigo-200 text-sm font-bold" dir={toLangConfig.dir}>{item.translatedText}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                                        <span className="text-[10px] text-neutral-500 font-mono">
                                            {item.timestamp} • ⚡ {item.duration}s
                                        </span>
                                        
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => copyToClipboard(item.translatedText)}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-indigo-600/10 border border-white/10 hover:border-indigo-500/20 text-neutral-400 hover:text-indigo-400 transition-colors"
                                                title="کپی"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                onClick={() => speakText(item.translatedText, item.toLang)}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-indigo-600/10 border border-white/10 hover:border-indigo-500/20 text-neutral-400 hover:text-indigo-400 transition-colors"
                                                title="پخش صوتی"
                                            >
                                                <Volume2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-10 text-neutral-600 space-y-2">
                            <span className="text-3xl block">💭</span>
                            <p className="text-sm">هیچ ترجمه‌ای هنوز ثبت نشده است. شروع به صحبت کنید!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
