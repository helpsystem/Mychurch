"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, BookOpen, Cpu, RefreshCw, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
  usingFallback?: boolean;
  verses?: Array<{
    book_id: string;
    chapter_num: number;
    verse_num: number;
    text: string;
    abbr: string;
  }>;
}

export default function BibleChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "سلام! من دستیار هوش مصنوعی کتاب‌مقدس کلیسا هستم. می‌توانید سوالات الهیاتی یا موضوعی خود را از من بپرسید تا با جستجوی مستقیم در آیات کتاب‌مقدس و تحلیل مدل هوشمند محلی (Ollama/Pinokio) پاسخ دهم.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeVerses, setActiveVerses] = useState<Message["verses"]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      text: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userQuestion = input.trim();
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/local-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userQuestion }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در برقراری ارتباط با سرور");
      }

      const botMessage: Message = {
        id: crypto.randomUUID(),
        sender: "bot",
        text: data.answer,
        timestamp: new Date(),
        usingFallback: data.usingFallback,
        verses: data.verses || [],
      };

      setMessages(prev => [...prev, botMessage]);
      if (data.verses && data.verses.length > 0) {
        setActiveVerses(data.verses);
      }
    } catch (err: any) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        sender: "bot",
        text: `⚠️ خطا: ${err.message || "پاسخی از هوش مصنوعی دریافت نشد."}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 h-[calc(100vh-110px)] min-h-[500px]" dir="rtl">
      
      {/* ===== Right: Chat Window ===== */}
      <div className="flex-1 flex flex-col glass-card rounded-2xl overflow-hidden border border-white/10 relative">
        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
        
        {/* Header */}
        <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-sm font-[Vazirmatn]">دستیار هوشمند کتاب‌مقدس کلیسا</h2>
              <p className="text-xs text-neutral-400 font-mono">Local RAG AI Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>مدل فعال: Qwen 2.5 (لوکال)</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar z-10">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                msg.sender === "user" ? "mr-auto flex-row-reverse" : "ml-auto"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${
                  msg.sender === "user"
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-white/5 text-amber-400 border-white/10"
                }`}
              >
                {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className="flex flex-col gap-1">
                <div
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap font-[Vazirmatn] ${
                    msg.sender === "user"
                      ? "bg-primary/25 text-white rounded-tr-none border border-primary/30"
                      : "bg-white/5 text-neutral-200 rounded-tl-none border border-white/5"
                  }`}
                >
                  {msg.text}
                </div>
                
                {/* Meta details if bot message */}
                {msg.sender === "bot" && (msg.usingFallback || (msg.verses && msg.verses.length > 0)) && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {msg.usingFallback && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                        <RefreshCw className="w-2.5 h-2.5" /> Fallback (Nvidia) Active
                      </span>
                    )}
                    {msg.verses && msg.verses.length > 0 && (
                      <button
                        onClick={() => setActiveVerses(msg.verses)}
                        className="inline-flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                      >
                        <BookOpen className="w-2.5 h-2.5" /> نمایش {msg.verses.length} آیه رفرنس
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 max-w-[85%] ml-auto">
              <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-white/5 text-amber-400 border border-white/10">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white/5 text-neutral-400 p-3.5 rounded-2xl rounded-tl-none border border-white/5 text-sm flex items-center gap-2">
                <span>درحال جستجوی آیات و تحلیل پاسخ...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-black/10 z-10 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="مثال: نظر کتاب مقدس درباره محبت و وفاداری چیست؟"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-amber-500/50 transition-colors font-[Vazirmatn]"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-bold flex items-center gap-2 transition-all"
            title="ارسال پیام"
          >
            <Send className="w-4 h-4 rotate-180" />
            <span className="hidden sm:inline">ارسال</span>
          </button>
        </form>
      </div>

      {/* ===== Left: Reference Verses Sidebar ===== */}
      <div className="w-full lg:w-80 flex flex-col glass-card rounded-2xl border border-white/10 p-4 shrink-0 lg:max-h-full overflow-y-auto">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
          <BookOpen className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-foreground text-sm font-[Vazirmatn]">آیات مرجع استخراج‌شده</h3>
        </div>

        {activeVerses && activeVerses.length > 0 ? (
          <div className="space-y-4">
            {activeVerses.map((v, i) => (
              <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between text-xs text-blue-400 font-mono">
                  <span>{v.book_id} {v.chapter_num}:{v.verse_num}</span>
                  <span className="bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/10">{v.abbr}</span>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed font-[Vazirmatn]">{v.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-neutral-500">
            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs font-[Vazirmatn]">هیچ آیه مرجعی انتخاب نشده است. با ارسال هر پیام، آیات استناد شده در این بخش لیست می‌شوند.</p>
          </div>
        )}
      </div>

    </div>
  );
}
