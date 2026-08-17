'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, Loader2, ArrowRightLeft, Sparkles, Cpu } from 'lucide-react';

interface LiveTranslatorProps {
  initialSourceLang?: string;
  initialTargetLang?: string;
  className?: string;
}

export default function LiveTranslator({
  initialSourceLang = 'en',
  initialTargetLang = 'fa',
  className = '',
}: LiveTranslatorProps) {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState(initialSourceLang);
  const [targetLang, setTargetLang] = useState(initialTargetLang);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [preferredEngine, setPreferredEngine] = useState<'azure' | 'google' | 'auto'>('azure');
  const [engineUsed, setEngineUsed] = useState<string | null>(null);

  // Debounce logic (450ms delay to protect quota & avoid spam requests)
  useEffect(() => {
    if (!inputText.trim()) {
      setTranslatedText('');
      setIsTranslating(false);
      setEngineUsed(null);
      return;
    }

    setIsTranslating(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: inputText.trim(),
            sourceLanguage: sourceLang,
            targetLanguage: targetLang,
            preferredEngine: preferredEngine,
          }),
        });

        const data = await response.json();
        
        if (response.ok && data.translatedText) {
          setTranslatedText(data.translatedText);
          setEngineUsed(data.engine || 'azure');
        } else {
          setTranslatedText('خطا در ترجمه');
        }
      } catch (error) {
        console.error('Error fetching translation:', error);
        setTranslatedText('خطا در برقراری ارتباط با سرور');
      } finally {
        setIsTranslating(false);
      }
    }, 150);

    return () => clearTimeout(delayDebounceFn);
  }, [inputText, targetLang, sourceLang, preferredEngine]);

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatEngineLabel = (engine: string) => {
    if (engine === 'azure') return 'Microsoft Azure 🔷';
    if (engine === 'google_gemini') return 'Google Gemini AI 🟢';
    if (engine === 'google_translate') return 'Google Translate 🌐';
    return engine.toUpperCase();
  };

  return (
    <div className={`w-full max-w-3xl mx-auto rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-2xl space-y-6 ${className}`}>
      {/* Header with Language Selector & Engine Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          <div>
            <span className="font-bold text-sm text-white block">مترجم همزمان هوشمند</span>
            <span className="text-[10px] text-slate-400">اتصال همزمان به مایکروسافت آژور و گوگل</span>
          </div>
        </div>

        {/* Engine Switcher Tabs */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl text-xs">
          <button
            onClick={() => setPreferredEngine('auto')}
            className={`px-2.5 py-1 rounded-lg transition-all ${preferredEngine === 'auto' ? 'bg-amber-500 text-black font-bold shadow' : 'text-slate-400 hover:text-white'}`}
          >
            ترکیبی (خودکار)
          </button>
          <button
            onClick={() => setPreferredEngine('azure')}
            className={`px-2.5 py-1 rounded-lg transition-all ${preferredEngine === 'azure' ? 'bg-blue-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Microsoft Azure
          </button>
          <button
            onClick={() => setPreferredEngine('google')}
            className={`px-2.5 py-1 rounded-lg transition-all ${preferredEngine === 'google' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Google AI
          </button>
        </div>
      </div>

      {/* Language Selectors */}
      <div className="flex items-center justify-center gap-3">
        <select
          value={sourceLang}
          onChange={(e) => setSourceLang(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
        >
          <option value="en" className="bg-[#121820]">English (انگلیسی)</option>
          <option value="fa" className="bg-[#121820]">فارسی (Persian)</option>
          <option value="es" className="bg-[#121820]">Español (اسپانیایی)</option>
          <option value="ar" className="bg-[#121820]">العربية (عربی)</option>
          <option value="de" className="bg-[#121820]">Deutsch (آلمانی)</option>
        </select>

        <button
          onClick={handleSwapLanguages}
          className="p-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-amber-400 hover:border-amber-500/30 transition-all hover:rotate-180 duration-300"
          title="جابجایی زبان‌ها"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
        </button>

        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
        >
          <option value="fa" className="bg-[#121820]">فارسی (Persian)</option>
          <option value="en" className="bg-[#121820]">English (انگلیسی)</option>
          <option value="es" className="bg-[#121820]">Español (اسپانیایی)</option>
          <option value="ar" className="bg-[#121820]">العربية (عربی)</option>
          <option value="de" className="bg-[#121820]">Deutsch (آلمانی)</option>
        </select>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Textarea */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>متن مبدأ ({sourceLang.toUpperCase()}):</span>
            {inputText && (
              <button
                onClick={() => setInputText('')}
                className="text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                پاک کردن
              </button>
            )}
          </div>
          <textarea
            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all resize-none min-h-[150px] text-sm leading-relaxed"
            dir={sourceLang === 'fa' || sourceLang === 'ar' ? 'rtl' : 'ltr'}
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={sourceLang === 'fa' ? 'متن خود را اینجا بنویسید...' : 'Type or paste text here...'}
          />
        </div>

        {/* Translation Output Box */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span>ترجمه مقصد ({targetLang.toUpperCase()}):</span>
              {isTranslating && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />}
            </span>
            {translatedText && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'کپی شد' : 'کپی'}</span>
              </button>
            )}
          </div>
          
          <div 
            className="w-full p-4 bg-white/3 border border-white/10 rounded-xl min-h-[150px] text-sm leading-relaxed text-slate-100 flex flex-col justify-between"
            dir={targetLang === 'fa' || targetLang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div>
              {translatedText ? (
                <p className="whitespace-pre-wrap">{translatedText}</p>
              ) : isTranslating ? (
                <span className="text-slate-500 italic">در حال ترجمه سریع...</span>
              ) : (
                <span className="text-slate-600 italic select-none">
                  {targetLang === 'fa' ? 'ترجمه بلافاصله اینجا نمایش داده می‌شود...' : 'Translation will appear here instantly...'}
                </span>
              )}
            </div>

            {engineUsed && (
              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-amber-400" />
                  موتور فعال:
                </span>
                <span className="text-slate-200 font-bold">{formatEngineLabel(engineUsed)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
