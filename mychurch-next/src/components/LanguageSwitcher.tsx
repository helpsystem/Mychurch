"use client";

import React, { useState, useRef, useEffect } from "react";
import { Languages, Check } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import type { Language } from "@/locales/dictionary";

const LANGUAGE_OPTIONS: { code: Language; label: string; nativeLabel: string }[] = [
    { code: "fa", label: "FA", nativeLabel: "فارسی" },
    { code: "en", label: "EN", nativeLabel: "English" },
    { code: "es", label: "ES", nativeLabel: "Español" },
];

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const current = LANGUAGE_OPTIONS.find((opt) => opt.code === language) ?? LANGUAGE_OPTIONS[0];

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/50 bg-secondary hover:bg-secondary/80 text-foreground transition-all shadow-sm"
                title="تغییر زبان / Change Language / Cambiar Idioma"
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <Languages className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm uppercase tracking-widest">
                    {current.label}
                </span>
            </button>

            {open && (
                <div
                    role="listbox"
                    className="absolute end-0 mt-2 w-36 rounded-xl border border-border/50 bg-popover shadow-lg overflow-hidden z-50"
                >
                    {LANGUAGE_OPTIONS.map((opt) => (
                        <button
                            key={opt.code}
                            role="option"
                            aria-selected={language === opt.code}
                            onClick={() => {
                                setLanguage(opt.code);
                                setOpen(false);
                            }}
                            className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-secondary transition-colors text-foreground"
                        >
                            <span className="flex items-center gap-2">
                                <span className="font-bold uppercase tracking-widest text-xs text-primary">
                                    {opt.label}
                                </span>
                                <span>{opt.nativeLabel}</span>
                            </span>
                            {language === opt.code && <Check className="w-4 h-4 text-primary" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
