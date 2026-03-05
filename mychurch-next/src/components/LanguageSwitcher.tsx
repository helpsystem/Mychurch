"use client";

import React from "react";
import { Languages } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    return (
        <button
            onClick={() => setLanguage(language === "fa" ? "en" : "fa")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/50 bg-secondary hover:bg-secondary/80 text-foreground transition-all shadow-sm"
            title="تغییر زبان / Change Language"
        >
            <Languages className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm uppercase tracking-widest">
                {language === "fa" ? "EN" : "FA"}
            </span>
        </button>
    );
}
