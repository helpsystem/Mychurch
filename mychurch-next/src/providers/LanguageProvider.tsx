"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { dictionaries, type Language, type Dictionary } from "@/locales/dictionary";

interface LanguageContextType {
    language: Language;
    isRTL: boolean;
    setLanguage: (lang: Language) => void;
    t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType>({
    language: "fa",
    isRTL: true,
    setLanguage: () => { },
    t: dictionaries.fa,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>("fa");

    useEffect(() => {
        // Hydrate from localStorage
        const stored = localStorage.getItem("preferred-lang") as Language;
        if (stored === "fa" || stored === "en") {
            setLanguage(stored);
        } else {
            // Default setup based on initial state
            document.documentElement.lang = "fa";
            document.documentElement.dir = "rtl";
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("preferred-lang", lang);

        // Deep RTL/LTR support by setting html attributes
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
    };

    return (
        <LanguageContext.Provider value={{
            language,
            isRTL: language === "fa",
            setLanguage,
            t: dictionaries[language]
        }}>
            {children}
            {/* Font initialization based on direction is handled in globals.css */}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
