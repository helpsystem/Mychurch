"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, PlayCircle, Menu, X, Image as ImageIcon, FileText, Phone, User, Shield, Info, Music } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { createClient } from "@/utils/supabase/client";
import { Session } from "@supabase/supabase-js";

export function MobileNavigation() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  // Hide on admin or broadcast fullscreen routes
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/broadcast")) {
    return null;
  }

  const navItems = [
    { label: t?.home || "خانه", path: "/", icon: Home },
    { label: "کتاب مقدس", path: "/bible", icon: BookOpen },
    { label: "پرستش", path: "/worship", icon: Music },
    { label: t?.sermons || "موعظه‌ها", path: "/sermons", icon: PlayCircle },
  ];

  const moreLinks = [
    { label: "درباره ما", path: "/about", icon: Info },
    { label: "گالری", path: "/gallery", icon: ImageIcon },
    { label: "مدارک", path: "/documents", icon: FileText },
    { label: "حساب و کتاب", path: "/dej", icon: FileText }, // Or a generic calculator icon if available
    { label: t?.contact || "تماس", path: "/contact", icon: Phone },
    { label: "پشتیبانی", path: "/profile/support", icon: Shield },
  ];

  return (
    <>
      {/* Spacer to prevent content from hiding behind the bottom bar */}
      <div className="h-24 md:hidden w-full shrink-0" />

      {/* Slide-up Menu Overlay */}
      <div 
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden flex justify-center items-end ${
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div 
          className={`w-full max-w-md bg-zinc-950 border-t border-white/10 rounded-t-[2.5rem] p-6 shadow-2xl transition-transform duration-300 pb-[calc(env(safe-area-inset-bottom)+6rem)] ${
            isMenuOpen ? "translate-y-0" : "translate-y-full"
          }`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="font-black text-2xl text-white font-[Vazirmatn]">بیشتر</h3>
            <button title="بستن منو" onClick={() => setIsMenuOpen(false)} className="p-2.5 bg-white/5 rounded-full hover:bg-white/10 text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
             {moreLinks.map((link) => (
               <Link 
                 key={link.path} 
                 href={link.path}
                 onClick={() => setIsMenuOpen(false)}
                 className="flex flex-col items-center justify-center gap-3 p-5 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all active:scale-95"
               >
                 <link.icon className="w-7 h-7 text-blue-400" />
                 <span className="text-sm font-bold text-zinc-200 font-[Vazirmatn]">{link.label}</span>
               </Link>
             ))}
          </div>

          <div className="flex flex-col gap-4 font-[Vazirmatn]">
             {session ? (
               <>
                 <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/20 active:scale-95 transition-all text-base">
                    <User className="w-5 h-5" /> پروفایل من
                 </Link>
                 <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-zinc-900 border border-white/5 text-zinc-300 font-bold active:scale-95 transition-all text-base">
                    <Shield className="w-5 h-5" /> پنل مدیریت
                 </Link>
               </>
             ) : (
               <Link href="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-blue-600/90 text-white font-bold hover:bg-blue-500 shadow-xl shadow-blue-500/20 active:scale-95 transition-all text-base">
                  <User className="w-5 h-5" /> ورود اعضا
               </Link>
             )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-[50] bg-zinc-950/90 backdrop-blur-2xl border-t border-white/5 md:hidden flex items-center justify-around shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pb-[env(safe-area-inset-bottom)] h-[calc(env(safe-area-inset-bottom)+4.5rem)]"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${isActive ? 'text-blue-400 -translate-y-0.5' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <div className={`p-1.5 rounded-2xl transition-all duration-300 ${isActive ? 'bg-blue-500/20 shadow-inner border border-blue-500/20' : 'bg-transparent border border-transparent'}`}>
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold font-[Vazirmatn] ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
        
        {/* Menu Toggle Button */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${isMenuOpen ? 'text-white -translate-y-0.5' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <div className={`p-1.5 rounded-2xl transition-all duration-300 ${isMenuOpen ? 'bg-white/10 shadow-inner border border-white/10' : 'bg-transparent border border-transparent'}`}>
            <Menu className="w-5 h-5" strokeWidth={isMenuOpen ? 2.5 : 2} />
          </div>
          <span className={`text-[10px] font-bold font-[Vazirmatn] ${isMenuOpen ? 'opacity-100' : 'opacity-70'}`}>
            بیشتر
          </span>
        </button>
      </nav>
    </>
  );
}
