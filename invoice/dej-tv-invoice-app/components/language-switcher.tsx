"use client";

import { useLanguage } from "./language-provider";
import { Button } from "./ui/button";

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex gap-2 items-center print:hidden" dir="ltr">
      <Button 
        variant={lang === "en" ? "default" : "outline"} 
        size="sm" 
        onClick={() => setLang("en")}
      >
        EN
      </Button>
      <Button 
        variant={lang === "fa" ? "default" : "outline"} 
        size="sm" 
        onClick={() => setLang("fa")}
      >
        فا
      </Button>
      <Button 
        variant={lang === "de" ? "default" : "outline"} 
        size="sm" 
        onClick={() => setLang("de")}
      >
        DE
      </Button>
    </div>
  );
}
