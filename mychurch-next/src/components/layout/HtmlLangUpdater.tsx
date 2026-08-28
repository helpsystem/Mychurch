"use client";

import { useLanguage } from "@/providers/LanguageProvider";
import { useEffect } from "react";

/**
 * HtmlLangUpdater — keeps <html lang> and <html dir> in sync with the
 * active LanguageProvider language. Must be rendered inside <LanguageProvider>.
 *
 * Fixes WCAG 3.1.1 (Language of Page) and improves bilingual SEO.
 */
export function HtmlLangUpdater() {
  const { language } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "fa" ? "rtl" : "ltr";
  }, [language]);

  return null;
}
