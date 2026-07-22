"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Mic, Square, Loader2 } from "lucide-react";
import { HelpTooltip } from "@/components/ui/HelpTooltip";

export default function LiveTranslator({ meetingId }: { meetingId: string }) {
    const [isLive, setIsLive] = useState(false);
    const [transcript, setTranscript] = useState("");
    const recognitionRef = useRef<any>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Connect to the separate Socket.io server
        const socket = io("http://localhost:8080");
        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("join_meeting", meetingId);
            console.log("[LiveTranslator] Connected to Socket Server and joined room:", meetingId);
        });

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("[LiveTranslator] Browser does not support SpeechRecognition.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'fa-IR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                    sendToServer(event.results[i][0].transcript, true);
                } else {
                    interimTranscript += event.results[i][0].transcript;
                    sendToServer(event.results[i][0].transcript, false);
                }
            }
            setTranscript(finalTranscript + interimTranscript);
        };

        recognition.onend = () => {
            if (isLive) recognition.start();
        };

        recognitionRef.current = recognition;

        return () => {
            socket.disconnect();
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) {}
            }
        };
    }, [isLive, meetingId]);

    const sendToServer = (text: string, isFinal: boolean) => {
        if (socketRef.current?.connected && text.trim() !== "") {
            socketRef.current.emit("speaker_text", {
                meetingId,
                text,
                isFinal
            });
        }
    };

    const toggleLive = () => {
        if (!recognitionRef.current) {
            alert("مرورگر شما از سیستم تشخیص گفتار گوگل پشتیبانی نمی‌کند. لطفاً از کروم استفاده کنید.");
            return;
        }

        if (isLive) {
            try { recognitionRef.current.stop(); } catch (e) {}
            setIsLive(false);
        } else {
            setTranscript("");
            try { recognitionRef.current.start(); } catch (e) {}
            setIsLive(true);
        }
    };

    return (
        <div className="flex flex-col gap-3 p-4 border border-white/10 bg-neutral-900/50 rounded-2xl w-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={toggleLive} 
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                            isLive 
                                ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/30" 
                                : "bg-blue-600 hover:bg-blue-500 text-white border border-blue-500"
                        }`}
                    >
                        {isLive ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        {isLive ? "توقف ترجمه همزمان" : "شروع ترجمه همزمان (رایگان)"}
                    </button>
                    <HelpTooltip text="با فعال کردن این گزینه، صدای شما با استفاده از موتور تشخیص گفتار گوگل به متن تبدیل شده و سپس از طریق هوش مصنوعی گوگل به صورت زنده ترجمه و در صفحه پابلیک (Public Link) برای حضار نمایش داده می‌شود." />
                </div>
                {isLive && (
                    <div className="flex items-center gap-2 text-xs text-red-400 font-bold animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        در حال شنود...
                    </div>
                )}
            </div>

            {transcript && (
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 min-h-[60px] text-sm text-neutral-300 leading-relaxed font-[Vazirmatn]" dir="rtl">
                    {transcript}
                </div>
            )}
        </div>
    );
}
