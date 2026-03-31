// src/app/documents/page.tsx
"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useLanguage } from "@/providers/LanguageProvider";
import { emailDocument } from "@/actions/documentMailer";
import { deleteDocument, getDocuments, saveDocument } from "@/actions/documents";
import { toast } from "sonner";
import {
  FileText, Printer, Plus, Building2, CreditCard, Package,
  FileSignature, Check, DollarSign, X, Settings, Wand2,
  Languages, Loader2, Sparkles, Hash, ChevronDown, Save, Send,
  Globe, Phone, Mail, User, MapPin, Calendar, History as HistoryIcon, Search, Trash2, Copy
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";


export interface DocumentDesign {
  titleSize: number;
  bodySize: number;
  footerSize: number;
  fontFamily: string;
  logoSize: number;
  headerPadding: number;
  isBoldTitle: boolean;
  isItalicBody: boolean;
}

// ─── Church Settings (Configurable) ──────────────────────────────────────────
const DEFAULT_CHURCH = {
  nameEn: "Iranian Christian Church of Washington DC",
  nameFa: "کلیسای ایرانیان واشنگتن دی.سی",
  address: "Washington, DC Metropolitan Area",
  ein: "XX-XXXXXXX",
  phone: "+1 (XXX) XXX-XXXX",
  email: "info@samanabyar.online",
  web: "samanabyar.online",
  logo: "/logo-transparent.png",
  pastor: "Rev. Sam Yarebeygi",
  denomination: "Persian Evangelical Church – 501(c)(3)",
  letterheadTheme: "modern", // modern, classic, elegant, minimal, custom
  customHeaderImage: "",
  paperSize: "A4", // Default to A4 as requested
  watermarkOpacity: 0.03, // 0 to 1
  showWatermark: true,
  signatureImage: "",
  signatoryName: "Rev. Sam Yarebeygi",
  signatoryTitle: "Senior Pastor",
  showVerifyQR: true,
  designEn: {
    titleSize: 32,
    bodySize: 14,
    footerSize: 10,
    fontFamily: "Inter, sans-serif",
    logoSize: 100,
    headerPadding: 24,
    isBoldTitle: true,
    isItalicBody: false,
  },
  designFa: {
    titleSize: 28,
    bodySize: 15,
    footerSize: 11,
    fontFamily: "'Vazirmatn', sans-serif",
    logoSize: 90,
    headerPadding: 20,
    isBoldTitle: true,
    isItalicBody: false,
  },
};


const PAPER_SIZES = {
  A4: "w-[210mm] min-h-[297mm]",
  Letter: "w-[215.9mm] min-h-[279.4mm]", // Official Letter size: 8.5 x 11 in
  A5: "w-[148mm] min-h-[210mm]",
};

const THEMES = [
  { id: "modern", name: "Modern / مدرن", preview: "bg-blue-500" },
  { id: "classic", name: "Classic / کلاسیک", preview: "bg-amber-700" },
  { id: "elegant", name: "Elegant / ظریف", preview: "bg-purple-600" },
  { id: "minimal", name: "Minimal / مینیمال", preview: "bg-zinc-400" },
  { id: "custom", name: "Custom / اختصاصی", preview: "border-dashed" },
];


// ─── Utility: Force English Digits ──────────────────────────────────────────
function formatDigits(text: string) {
  if (!text) return "";
  // In some environments, numbers might be localized to Persian digits.
  // We can force them to English digits if needed, though usually standard fonts handle this with tabular-nums.
  return text;
}

// ─── Component: QR Code ──────────────────────────────────────────────────────
const SITE_URL = typeof window !== "undefined" ? window.location.origin : "https://samanabyar.online";

function DocumentQR({ data }: { data: string }) {
  // If data looks like a reference number, generate a verify URL; otherwise use as-is
  const url = data.startsWith("http") ? data : `${SITE_URL}/verify/${encodeURIComponent(data)}`;

  return (
    <QRCodeSVG 
      value={url} 
      size={80} // corresponds to w-20 h-20
      level="M" 
      bgColor="#ffffff00" 
      fgColor="#000000"
      marginSize={1}
      imageSettings={{
        src: "/logo-transparent.png",
        height: 20,
        width: 20,
        excavate: true,
      }}
    />
  );
}

// ─── Component: Watermark ─────────────────────────────────────────────────────
function Watermark({ logo, opacity }: { logo: string; opacity: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt="Watermark"
        className="w-[400px] h-[400px] object-contain select-none grayscale"
        style={{ opacity }}
      />
    </div>
  );
}

// ─── Component: Document Security Wrapper ─────────────────────────────────────
function DocumentSecurity({ children, isLocked = true }: { children: React.ReactNode; isLocked?: boolean }) {
  if (!isLocked) return <>{children}</>;

  return (
    <div 
      className="relative select-none print:select-auto group w-full h-full"
      onContextMenu={(e) => e.preventDefault()}
      style={{ WebkitUserSelect: "none", MozUserSelect: "none", msUserSelect: "none", userSelect: "none" }}
    >
      {/* Invisible Guard Layer to prevent mouse interactions with text */}
      <div className="absolute inset-0 z-[100] cursor-default bg-transparent" />
      
      {/* Repeating Anti-Copy Watermark (Visible only on some captures/scans) */}
      <div className="absolute inset-0 z-[50] pointer-events-none opacity-[0.03] overflow-hidden select-none flex flex-wrap gap-20 p-10 rotate-12">
        {Array.from({ length: 40 }).map((_, i) => (
          <span key={i} className="text-slate-900 font-bold text-2xl tracking-tighter whitespace-nowrap">
            OFFICIAL DOCUMENT - COPY PROHIBITED - MYCHURCH BROADCAST SYSTEM
          </span>
        ))}
      </div>

      {children}
    </div>
  );
}

// ─── US Address Suggestions (Mock – replace with Google Places API) ───────────
const US_ADDRESS_SUGGESTIONS = [
  "USCIS – Washington Field Office, 2675 Prosprity Ave, Fairfax, VA 22031",

  "IRS Service Center, 2970 Market St, Philadelphia, PA 19104",
  "Department of Homeland Security, 245 Murray Lane SW, Washington, DC 20528",
  "US Embassy, 2201 C St NW, Washington, DC 20520",
  "USCIS – National Benefits Center, 850 S Street, Lincoln, NE 68508",
  "Social Security Administration, 6401 Security Blvd, Baltimore, MD 21235",
  "Department of Labor, 200 Constitution Ave NW, Washington, DC 20210",
  "US District Court, 333 Constitution Ave NW, Washington, DC 20001",
];

// ─── Letter Templates ─────────────────────────────────────────────────────────
const LETTER_TEMPLATES = [
  {
    id: "uscis-membership", category: "immigration",
    nameEn: "USCIS – Church Membership", nameFa: "نامه عضویت (USCIS)",
    toEn: "U.S. Citizenship and Immigration Services (USCIS)",
    subjectEn: "RE: Letter of Church Membership and Active Participation",
    bodyEn: `To Whom It May Concern,

This letter is to confirm that [MEMBER NAME] is a registered and active member of the Iranian Christian Church of Washington DC, a federally recognized 501(c)(3) non-profit religious organization (EIN: [EIN]).

[He/She] has been an active and faithful member of our congregation since [DATE]. [He/She] regularly attends our weekly worship services, participates in Bible study groups, and actively contributes to our church community ministry.

Our church serves the Persian-speaking Christian community throughout the greater Washington DC metropolitan area. We are committed to supporting our members in all legal matters.

We respectfully request your favorable consideration of [MEMBER NAME]'s application. Should you require any additional documentation or information, please do not hesitate to contact our church office.

Respectfully yours,`,
    bodyFa: `با احترام،

این نامه تأیید می‌کند که [نام عضو] عضو رسمی و فعال کلیسای ایرانیان واشنگتن دی.سی می‌باشد، که یک سازمان غیرانتفاعی مذهبی شناخته‌شده فدرال 501(c)(3) است.

ایشان از تاریخ [تاریخ] عضو فعال و متعهد جماعت ما بوده‌اند و به طور منظم در جلسات پرستشی هفتگی، گروه‌های مطالعه کتاب مقدس شرکت می‌کنند.

محترماً خواهشمند است تقاضای [نام عضو] مورد توجه مساعد قرار گیرد.

با احترام،`
  },
  {
    id: "irs-donation", category: "tax",
    nameEn: "IRS – Donation Letter", nameFa: "نامه کمک مالی (IRS)",
    toEn: "Donor / Internal Revenue Service", subjectEn: "RE: Acknowledgment of Charitable Contribution – 501(c)(3)",
    bodyEn: `Dear [DONOR NAME],

This letter serves as the official written acknowledgment of your generous charitable contribution to the Iranian Christian Church of Washington DC (EIN: [EIN]).

Contribution Details:
• Amount: $[AMOUNT]
• Date Received: [DATE]
• Method of Payment: [PAYMENT METHOD]

This organization qualifies as a tax-exempt entity under Section 501(c)(3) of the Internal Revenue Code. No goods or services were provided to you in exchange for this contribution. This acknowledgment constitutes a contemporaneous written notice as required by Section 170(f)(8) of the Internal Revenue Code.

You may deduct this contribution on your federal income tax return to the extent allowed by law. We strongly recommend retaining this letter for your records.

Thank you sincerely for your generous support of our ministry and community.

Gratefully in Christ,`,
    bodyFa: `[نام] عزیز،

این نامه تأیید رسمی کمک مالی سخاوتمندانه شما به کلیسای ایرانیان واشنگتن دی.سی می‌باشد.

جزئیات کمک مالی:
• مبلغ: $[مبلغ]
• تاریخ دریافت: [تاریخ]
• روش پرداخت: [روش]

این سازمان معاف از مالیات تحت بخش 501(c)(3) قانون مالیات داخلی می‌باشد. هیچ کالا یا خدماتی در ازای این کمک ارائه نشده است.

این نامه قابل ارائه به اداره مالیات برای کسر مالیاتی می‌باشد.

با تشکر صمیمانه،`
  },
  {
    id: "general-reference", category: "general",
    nameEn: "Reference / Support Letter", nameFa: "نامه معرفی",
    toEn: "To Whom It May Concern", subjectEn: "RE: Letter of Support and Character Reference",
    bodyEn: `To Whom It May Concern,

It is with great pleasure and without reservation that I write this letter of support on behalf of [NAME]. I have had the privilege of knowing [him/her] through our church community for [DURATION].

During this period, [NAME] has consistently demonstrated exceptional moral character, integrity, and dedication both within our congregation and in the broader community. [He/She] is deeply committed to our faith community and has shown exemplary responsibility in all facets of church life.

I wholeheartedly recommend [NAME] without reservation and vouch personally for [his/her] character, dependability, and positive standing in our community.

Should you have any questions or require further information, please do not hesitate to contact our church office directly.

Sincerely,`,
    bodyFa: `به مقام محترم،

با کمال افتخار و بدون هیچ تردیدی این نامه حمایت را از طرف [نام] می‌نویسم. من ایشان را از طریق جامعه کلیسا به مدت [مدت] می‌شناسم.

در این مدت، ایشان شخصیت اخلاقی قوی، صداقت و تعهد استثنایی را به طور ثابت نشان داده‌اند. ایشان به طور عمیقی به جامعه ایمانی ما متعهد هستند.

صمیمانه ایشان را بدون هیچ تردیدی توصیه می‌کنم.

با احترام،`
  },
  {
    id: "housing", category: "general",
    nameEn: "Housing / Rental Letter", nameFa: "نامه حمایت مسکن",
    toEn: "Property Manager / Landlord", subjectEn: "RE: Character Reference for Housing Application",
    bodyEn: `To Whom It May Concern,

I am writing this letter of character reference on behalf of [APPLICANT NAME], who has been a valued member of our congregation at the Iranian Christian Church of Washington DC.

I have known [APPLICANT NAME] personally for [DURATION] and can attest without reservation to [his/her] character, financial responsibility, and trustworthiness. [He/She] demonstrates consistent reliability in fulfilling all personal and community obligations.

Based on my personal knowledge of [APPLICANT NAME], I have every confidence that [he/she] will be an exemplary and responsible tenant. I highly recommend [him/her] for your consideration.

Please feel free to contact our church office for any additional information.

Sincerely,`,
    bodyFa: `با احترام،

این نامه در حمایت از [نام متقاضی]، عضو ارزشمند کلیسای ایرانیان واشنگتن دی.سی، نوشته می‌شود.

ایشان را به مدت [مدت] می‌شناسم و می‌توانم گواهی دهم که فردی مسئول، قابل اعتماد و صادق هستند.

مطمئن هستم که مستأجری نمونه و مسئول خواهند بود.

با احترام،`
  },
];

// ─── Address Autocomplete ────────────────────────────────────────────────────
function AddressInput({ value, onChange, placeholder, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const handleChange = (v: string) => {
    onChange(v);
    if (v.length > 2) {
      const filtered = US_ADDRESS_SUGGESTIONS.filter(s =>
        s.toLowerCase().includes(v.toLowerCase())
      );
      setSuggestions(filtered);
      setOpen(filtered.length > 0);
    } else {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <input
        value={value}
        onChange={e => handleChange(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder={placeholder}
        title={placeholder}
        className={className}
      />
      {open && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => { onChange(s); setOpen(false); }}
                title={s}
                className="w-full text-left px-4 py-2.5 text-xs text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors flex items-center gap-2"
              >
                <MapPin className="w-3 h-3 shrink-0 text-primary" />
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── AI Button ───────────────────────────────────────────────────────────────
function AIButton({ label, onClick, loading, disabled, icon }: {
  label: string; onClick: () => void; loading?: boolean; disabled?: boolean; icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      title={label}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
        disabled
          ? "border-white/10 text-white/20 cursor-not-allowed"
          : "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
      }`}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (icon || <Wand2 className="w-3.5 h-3.5" />)}
      {loading ? "..." : label}
    </button>
  );
}

// ─── Letterhead (Print) ──────────────────────────────────────────────────────
function Letterhead({ church, lang, docRef, date }: { church: typeof DEFAULT_CHURCH; lang: "en" | "fa"; docRef?: string; date?: string }) {
  const name = lang === "fa" ? church.nameFa : church.nameEn;
  const theme = church.letterheadTheme;

  const digitStyle = { fontVariantNumeric: "tabular-nums" } as const;

  const design = lang === "fa" ? church.designFa : church.designEn;
  const isRtl = lang === "fa";

  if (theme === "custom" && church.customHeaderImage) {
    return (
      <div className="mb-4 relative z-10" style={digitStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={church.customHeaderImage} alt="Custom Header" className="w-full h-auto" />
        <div className="flex justify-end text-[10px] text-gray-400 mt-1">Ref: {docRef} | {date}</div>
      </div>
    );
  }

  return (
    <div className={`mb-10 relative z-10`} style={{ ...digitStyle, paddingBottom: `${design.headerPadding / 2}px` }} dir="ltr">
      {/* Decorative Top Bar */}
      <div className="absolute -top-[20mm] -left-[20mm] -right-[20mm] h-4 bg-gradient-to-r from-blue-900 via-blue-700 to-blue-500 shadow-sm" />
      
      <div className="flex justify-between items-start pt-6">
         {/* Left Side: Logo & Name */}
         <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-blue-600/5 rounded-2xl blur-xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={church.logo} alt="Logo" className="object-contain relative z-10 drop-shadow-sm" style={{ height: `${design.logoSize}px`, width: "auto" }} />
            </div>
            
            <div className="flex flex-col border-l-2 border-slate-200 pl-5 py-1">
              <h1 className="text-slate-900 tracking-tighter leading-none" style={{ fontSize: `${design.titleSize}px`, fontWeight: 900, fontFamily: design.fontFamily }}>{name}</h1>
              <p className="text-[11px] uppercase font-black text-blue-700 tracking-[0.25em] mt-1.5">{church.denomination}</p>
            </div>
         </div>

         {/* Right Side: Contact Info & Meta */}
         <div className="text-right flex flex-col justify-between items-end h-full py-1">
            <div className="space-y-1 text-[10px] text-slate-500 font-medium">
              <div className="flex items-center justify-end gap-2 text-slate-700 font-bold">
                {church.address} <MapPin className="w-3.5 h-3.5 text-blue-600"/>
              </div>
              <div className="flex items-center justify-end gap-4">
                <span className="flex items-center gap-1.5">{church.web} <Globe className="w-3 h-3 text-slate-400"/></span>
                <span className="flex items-center gap-1.5">{church.email} <Mail className="w-3 h-3 text-slate-400"/></span>
                <span className="flex items-center gap-1.5">{church.phone} <Phone className="w-3 h-3 text-slate-400"/></span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs">
              <div className="text-right uppercase tracking-widest font-bold text-slate-400">
                <span className="text-[9px] block text-slate-400">Date</span>
                <span className="text-slate-900">{date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
              
              <div className="w-px h-8 bg-slate-200" />
              
              <div className="text-right uppercase tracking-widest font-bold text-slate-400">
                <span className="text-[9px] block text-slate-400">Reference No.</span>
                <span className="text-blue-700">{docRef || "N/A"}</span>
              </div>
            </div>
         </div>
      </div>
      
      {/* Bottom Separator */}
      <div className="mt-8 flex items-center gap-4">
        <div className="h-px bg-slate-200 flex-1" />
        <div className="text-[8px] font-mono text-slate-300 uppercase tracking-widest px-2">Official Document // EIN: {church.ein}</div>
        <div className="h-px bg-slate-200 flex-1" />
      </div>
    </div>
  );
}





export function LetterDoc({ bodyEn, bodyFa, editLang, to, toAddress, subject, recipientName, refNo, pageNum, totalPages, church }: {
  bodyEn: string; bodyFa: string; editLang: "en" | "fa"; to: string; toAddress?: string;
  subject: string; recipientName: string; refNo: string; pageNum?: number; totalPages?: number;
  church: typeof DEFAULT_CHURCH;
}) {
  const isRtl = editLang === "fa";
  const design = isRtl ? church.designFa : church.designEn;
  const paperClass = PAPER_SIZES[church.paperSize as keyof typeof PAPER_SIZES] || PAPER_SIZES.A4;
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <DocumentSecurity>
    <div className={`${paperClass} bg-white text-slate-800 p-[20mm] flex flex-col font-sans text-sm relative border-0 overflow-hidden shadow-2xl mx-auto print:shadow-none`} style={{ fontVariantNumeric: "tabular-nums" }}>
      {/* Decorative Abstract Shapes */}
      <div className="absolute top-40 right-10 w-96 h-96 bg-blue-50/50 rounded-full blur-[80px] -z-10 pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-indigo-50/50 rounded-full blur-[80px] -z-10 pointer-events-none" />

       {church.showWatermark && <Watermark logo={church.logo} opacity={church.watermarkOpacity} />}

      <Letterhead church={church} lang={editLang} docRef={refNo} date={dateStr} />

      <div className="mb-8 space-y-2 relative z-10" dir={isRtl ? "rtl" : "ltr"} style={{ fontSize: `${design.bodySize}px`, fontFamily: design.fontFamily }}>
        {recipientName && <div className="flex items-start gap-4">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] w-28 shrink-0 py-1">{isRtl ? "گیرنده:" : "Attention:"}</span>
          <span className="font-bold text-slate-900 border-b border-slate-200 pb-1 flex-1">{recipientName}</span>
        </div>}
        {to && <div className="flex items-start gap-4">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] w-28 shrink-0 py-1">{isRtl ? "به:" : "To:"}</span>
          <span className="font-medium text-slate-800 border-b border-slate-200 pb-1 flex-1">{to}</span>
        </div>}
        {toAddress && <div className="flex items-start gap-4">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] w-28 shrink-0 py-1">{isRtl ? "آدرس:" : "Address:"}</span>
          <span className="font-medium text-slate-800 border-b border-slate-200 pb-1 flex-1">{toAddress}</span>
        </div>}
        {subject && <div className="flex items-start gap-4 mt-6">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] w-28 shrink-0 py-1">{isRtl ? "موضوع:" : "Re  Subject:"}</span>
          <span className="font-black text-slate-900 text-lg uppercase tracking-tight leading-tight">{subject}</span>
        </div>}
      </div>

      <div 
        className={`flex-1 leading-relaxed text-justify whitespace-pre-wrap mb-10 relative z-10 text-slate-800`} 
        dir={isRtl ? "rtl" : "ltr"}
        style={{ 
          fontSize: `${design.bodySize}px`, 
          fontFamily: design.fontFamily,
          fontStyle: design.isItalicBody ? "italic" : "normal"
        }}
      >
        {(editLang === "en" ? bodyEn : bodyFa) || "..."}
      </div>

      <div className="mt-auto pt-6 border-t-2 border-slate-900 flex justify-between items-end relative z-10" dir={isRtl ? "rtl" : "ltr"}>
        {/* Signatory block */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{isRtl ? "تایید شده توسط" : "Authorized By"}</div>
            <div 
              className="font-black text-slate-900 tracking-tight" 
              style={{ 
                fontSize: `${design.bodySize + 2}px`, 
                fontFamily: isRtl ? 'Vazirmatn, sans-serif' : design.fontFamily,
                direction: isRtl ? 'rtl' : 'ltr'
              }}
            >{church.signatoryName}</div>
            <div 
              className="text-blue-600 font-bold tracking-widest" 
              style={{ 
                fontSize: `${design.bodySize - 2}px`, 
                fontFamily: isRtl ? 'Vazirmatn, sans-serif' : design.fontFamily,
                direction: isRtl ? 'rtl' : 'ltr'
              }}
            >{church.signatoryTitle}</div>
          </div>

          {church.signatureImage && (
            <div className="h-16 w-48 relative border-b border-slate-300 pb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={church.signatureImage}
                alt="Signature"
                className="h-full object-contain mix-blend-multiply opacity-95"
              />
            </div>
          )}

          <div className="text-[8px] text-slate-400 mt-2 max-w-sm uppercase leading-tight font-sans tracking-widest" dir="ltr">
            {isRtl
              ? "این سند به طور رسمی توسط کلیسای ایرانیان مسیحی واشنگتن دی‌سی صادر و تأیید شده است."
              : "This document is officially generated and verified by the Iranian Christian Church of Washington DC."
            }
          </div>
        </div>

        {church.showVerifyQR && (
          <div className={`flex flex-col gap-1 ${isRtl ? 'items-start text-left' : 'items-end text-right'}`}>
            <div className="p-2 border-2 border-slate-200 rounded-xl bg-white shadow-sm">
              <DocumentQR data={`VERIFY:${refNo}:${dateStr}:${church.ein}`} />
            </div>
            <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{isRtl ? 'اسکن برای تایید' : 'Scan to Verify'}</div>
            <div className="text-[7px] font-mono uppercase text-slate-400">{refNo}</div>
          </div>
        )}
      </div>

      <div className={`absolute bottom-6 font-mono font-bold ${isRtl ? "left-10" : "right-10"} text-[10px] text-slate-300`}>
        PAGE {pageNum || 1} / {totalPages || 1}
      </div>
    </div>
    </DocumentSecurity>
  );
}


// ─── Donation Receipt ─────────────────────────────────────────────────────────
export function DonationReceiptDoc({ receipt, receiptNo, isInKind, inKindItems, church }: {
  receipt: Record<string, string | number>; receiptNo: string; isInKind: boolean;
  inKindItems: { name: string; qty: number; value: number }[]; church: typeof DEFAULT_CHURCH;
}) {
  const design = church.designEn; // Receipts are primarily English
  const total = inKindItems.reduce((s, i) => s + i.value * i.qty, 0);
  const paperClass = PAPER_SIZES[church.paperSize as keyof typeof PAPER_SIZES] || PAPER_SIZES.A4;
  const dateStr = receipt.date as string || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <DocumentSecurity>
    <div className={`${paperClass} bg-white text-slate-800 p-[20mm] font-sans text-sm border-0 shadow-2xl relative overflow-hidden flex flex-col mx-auto print:shadow-none print:border-0`} style={{ fontVariantNumeric: "tabular-nums" }} dir="ltr">
      {/* Decorative Abstract Shapes */}
      <div className="absolute top-40 right-10 w-96 h-96 bg-blue-50/50 rounded-full blur-[80px] -z-10 pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-indigo-50/50 rounded-full blur-[80px] -z-10 pointer-events-none" />
      
      {church.showWatermark && <Watermark logo={church.logo} opacity={church.watermarkOpacity} />}

      <Letterhead church={church} lang="en" docRef={`RCP-${receiptNo}`} date={dateStr} />

      <div className="flex justify-between items-end mb-8 relative z-10 border-b-2 border-slate-900 pb-4">
        <div>
           <h2 className="uppercase tracking-[0.2em] font-black text-slate-900 leading-tight" style={{ fontSize: `${design.titleSize - 2}px`, fontFamily: design.fontFamily }}>
             {isInKind ? "In-Kind Donation Receipt" : "Official Charitable Contribution"}
           </h2>
           <p className="text-blue-600 font-bold tracking-widest text-[10px] mt-1 uppercase">US IRS Section 501(c)(3) Compliant</p>
        </div>
        <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
          <Check className="w-3 h-3 stroke-[3]" /> Authenticated
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-10 relative z-10" style={{ fontSize: `${design.bodySize}px`, fontFamily: design.fontFamily }}>
        <div className="space-y-3">
          <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Donor Information</div>
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="font-black text-lg text-slate-900 uppercase tracking-tight">{receipt.donorName as string || "—"}</div>
            <div className="text-slate-600 font-medium">{receipt.donorAddress as string || "—"}</div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Transaction Details</div>
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Receipt No</span>
              <span className="font-mono font-black text-slate-900">{receiptNo}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Date Issued</span>
              <span className="font-bold text-slate-900">{dateStr}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Organization EIN</span>
              <span className="font-mono font-bold text-slate-900">{church.ein}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative z-10" style={{ fontSize: `${design.bodySize}px`, fontFamily: design.fontFamily }}>
        <div className="rounded-xl overflow-hidden border border-slate-300 shadow-sm">
          <table className="w-full text-left border-collapse bg-white">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-[0.2em]">
                <th className="px-6 py-4 font-black">{isInKind ? "Item / Description" : "Purpose of Gift"}</th>
                <th className="px-6 py-4 text-right font-black w-24">{isInKind ? "Qty" : ""}</th>
                <th className="px-6 py-4 text-right font-black w-40">Value (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isInKind ? (
                inKindItems.filter(i => i.name).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{item.name}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-500">{item.qty}</td>
                    <td className="px-6 py-4 text-right font-mono font-black text-slate-900">${(item.value * item.qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-5 font-bold text-slate-800">General Church Offering / Tithe</td>
                  <td className="px-6 py-5 text-right font-mono text-slate-500">1</td>
                  <td className="px-6 py-5 text-right font-mono font-black text-slate-900">${Number(receipt.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-[3px] border-slate-900">
                <td colSpan={2} className="px-6 py-5 font-black uppercase tracking-widest text-[11px] text-slate-500">Grand Total Contribution</td>
                <td className="px-6 py-5 text-right font-black font-mono text-blue-700 bg-blue-50/50" style={{ fontSize: `${design.bodySize + 6}px` }}>
                  ${(isInKind ? total : Number(receipt.amount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-8 p-5 bg-blue-50/50 border-l-4 border-blue-600 rounded-r-xl text-blue-900 text-[11px] font-medium leading-relaxed relative flex gap-4 items-start">
          <Building2 className="w-6 h-6 shrink-0 text-blue-600/50 mt-1" />
          <p>
            The Iranian Christian Church of Washington DC is a qualified 501(c)(3) tax-exempt organization. 
            <span className="font-bold"> No goods or services were provided in exchange for this contribution.</span> Contributions are tax-deductible to the extent allowed by United States federal law. Please retain this letter for your tax records.
          </p>
        </div>
      </div>

      <div className="mt-8 flex justify-between items-end relative z-10 border-t-2 border-slate-900 pt-6">
        <div className="space-y-3">
          <div className="space-y-1">
             <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Authorized By</div>
             <div className="font-black text-slate-900 uppercase tracking-tight" style={{ fontSize: `${design.bodySize + 2}px`, fontFamily: design.fontFamily }}>{church.signatoryName}</div>
             <div className="text-blue-600 font-bold tracking-widest uppercase" style={{ fontSize: `${design.bodySize - 2}px`, fontFamily: design.fontFamily }}>{church.signatoryTitle}</div>
          </div>

          {church.signatureImage && (
            <div className="h-16 w-48 relative border-b border-slate-300 pb-2">
               {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={church.signatureImage}
                alt="Signature"
                className="h-full object-contain mix-blend-multiply opacity-95 relative z-10"
              />
            </div>
          )}

          <div className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
            VALIDATED ELECTRONIC SIGNATURE
          </div>
        </div>

        {church.showVerifyQR && (
          <div className="flex flex-col items-end gap-1 text-right">
             <div className="p-2 border-2 border-slate-200 rounded-xl bg-white shadow-sm">
                <DocumentQR data={`RECEIPT:${receiptNo}:${church.ein}:${total || receipt.amount}`} />
             </div>
             <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest pr-1">Scan for Auth</div>
             <div className="text-[7px] font-mono uppercase text-slate-400 pr-1">{receiptNo}</div>
          </div>
        )}
      </div>
    </div>
    </DocumentSecurity>
  );
}

export interface DocHistoryItem {
  id: string;
  type: "letter" | "receipt" | "inkind" | "invoice";
  date: string;
  timestamp: number;
  refNo: string;
  recipient: string;
  subject: string;
  bodyEn?: string;
  bodyFa?: string;
  amount?: number;
  donorName?: string;
  donorAddress?: string;
  inKindItems?: { name: string; qty: number; value: number }[];
  invoiceItems?: { id: string; description: string; total: number }[];
  invoiceWallet?: string;
}


// ─── Invoice Document ─────────────────────────────────────────────────────────
export function InvoiceDoc({ invoiceTo, invoiceAddress, invoiceName, invoiceDate, invoiceItems, invoiceTotalAmount, invoiceWallet, invoiceNotes, invoiceNo, church, lang, isPdf }: {
  invoiceTo: string; invoiceAddress?: string; invoiceName: string; invoiceDate: string; invoiceItems: any[]; invoiceTotalAmount: number; invoiceWallet: string; invoiceNotes?: string; invoiceNo: string; church: typeof DEFAULT_CHURCH; lang: "en" | "fa"; isPdf?: boolean;
}) {
  const paperClass = isPdf ? "w-full min-h-[1056px]" : (PAPER_SIZES[church.paperSize as keyof typeof PAPER_SIZES] || PAPER_SIZES.A4);
  const design = church.designEn; 

  return (
    <DocumentSecurity>
    <div className={`${paperClass} bg-white text-slate-800 p-[20mm] flex flex-col font-sans text-sm relative overflow-hidden mx-auto print:shadow-none ${isPdf ? "" : "shadow-2xl border-0"}`} style={{ fontVariantNumeric: "tabular-nums" }} dir="ltr">
      {/* Decorative Abstract Shapes */}
      <div className="absolute top-40 right-10 w-96 h-96 bg-blue-50/50 rounded-full blur-[80px] -z-10 pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-indigo-50/50 rounded-full blur-[80px] -z-10 pointer-events-none" />
      
      {church.showWatermark && <Watermark logo={church.logo} opacity={church.watermarkOpacity} />}

      <div className="page-container flex justify-end text-[10px] text-slate-400 mb-2">
        Page <span className="page mx-1">1</span> of <span className="pages mx-1">1</span>
      </div>

      <Letterhead church={church} lang="en" docRef={`INV-${invoiceNo}`} date={new Date(invoiceDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />

      <div className="flex justify-between items-end mb-8 relative z-10 border-b-2 border-slate-900 pb-4">
        <div>
           <h2 className="uppercase tracking-[0.1em] font-black text-slate-900 leading-tight" style={{ fontSize: `${design.titleSize}px`, fontFamily: design.fontFamily }}>
             Official Invoice
           </h2>
           <p className="text-blue-600 font-bold tracking-widest text-[10px] mt-1 uppercase">For Services Rendered / Ministry Support</p>
        </div>
        <div className="px-3 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-200 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
          <DollarSign className="w-3 h-3 stroke-[3]" /> Payment Due
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10 mb-10 relative z-10">
        <div className="space-y-3">
          <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest border-b border-slate-100 pb-1">Client / Billed To</div>
          <div className="p-0 space-y-1">
            <div className="font-black text-xl text-slate-900 leading-tight">{invoiceTo}</div>
            {invoiceName && <div className="text-slate-700 font-bold text-sm">{invoiceName}</div>}
            {invoiceAddress && <div className="text-slate-500 font-medium text-xs leading-relaxed max-w-[200px]">{invoiceAddress}</div>}
          </div>
        </div>
        <div className="space-y-3">
          <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest border-b border-slate-100 pb-1">Organization / Info</div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold text-[10px] uppercase">Invoice No</span>
              <span className="font-mono font-black text-slate-900 text-xs">{invoiceNo}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold text-[10px] uppercase">Date Issued</span>
              <span className="font-bold text-slate-900 text-xs">{new Date(invoiceDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="text-slate-900 font-black text-[10px] uppercase">Total Due</span>
              <span className="font-mono font-black text-blue-700 text-lg">${invoiceTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative z-10">
        <div className="overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-12">Qty</th>
                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-32">Price</th>
                <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-32">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoiceItems.map((item, index) => (
                <tr key={item.id} className="group">
                  <td className="py-5 font-mono text-slate-400 text-xs">01</td>
                  <td className="py-5">
                    <div className="font-bold text-slate-800">{item.description}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Professional Services / Church Ministry</div>
                  </td>
                  <td className="py-5 text-right font-mono text-slate-500 text-xs">${Number(item.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-5 text-right font-mono font-black text-slate-900">${Number(item.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="py-8"></td>
                <td className="py-8 border-t-2 border-slate-100 text-right font-bold text-slate-400 text-[10px] uppercase tracking-widest">Grand Total</td>
                <td className="py-8 border-t-2 border-slate-100 text-right font-black font-mono text-blue-700 text-2xl">
                  ${invoiceTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-10">
          <div>
            {invoiceNotes && (
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Notes & Policy</p>
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">{invoiceNotes}</p>
              </div>
            )}
          </div>
          <div>
             {invoiceWallet && (
              <div className="space-y-2">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Package className="w-3 h-3" /> Payment Instructions (TRC-20)
                </p>
                <p className="font-mono text-[10px] break-all font-bold bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600 shadow-inner">
                  {invoiceWallet}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t font-mono text-[8px] text-slate-300 uppercase tracking-[0.3em] flex justify-between items-center relative z-10">
        <div>
          <span>Generated by MyChurch Broadcast Console © 2026</span>
          <div className="mt-1 text-slate-200">System Integrity Verified • No Unauthorized Reproduction</div>
        </div>
        <span>Secure ID: {crypto.randomUUID().slice(0, 18).toUpperCase()}</span>
      </div>

      {church.showVerifyQR && (
        <div className="absolute bottom-10 right-10 flex flex-col items-end gap-1 text-right z-20">
          <div className="p-2 border-2 border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
            <DocumentQR data={`INV-${invoiceNo}:${invoiceTotalAmount}`} />
          </div>
          <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest pr-1">Scan to Verify</div>
          <div className="text-[7px] font-mono uppercase text-slate-400 pr-1">{invoiceNo}</div>
        </div>
      )}
    </div>
    </DocumentSecurity>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function ChurchDocumentsPage() {
  const { language } = useLanguage();
  const isRtl = language === "fa";
  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/50";
  // Church settings state
  const [church, setChurch] = useState(DEFAULT_CHURCH);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"info" | "design">("info");
  const [langTab, setLangTab] = useState<"en" | "fa">("fa");
  const [settingsDraft, setSettingsDraft] = useState(DEFAULT_CHURCH);

  // Template management
  const [docTemplates, setDocTemplates] = useState<{id: string, name: string, subject: string, bodyEn: string, bodyFa: string}[]>([]);
  const [isAdmin, setIsAdmin] = useState(true); // Mocking admin status
  const [currentUser, setCurrentUser] = useState({ name: "Rev. Sam Yarebeyگی", title: "Senior Pastor" });

  // Document History
  const [docHistory, setDocHistory] = useState<DocHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const mapDbDocumentToHistory = (doc: any): DocHistoryItem => {
    const content = doc?.document_content && typeof doc.document_content === "object" ? doc.document_content : {};
    const docType: DocHistoryItem["type"] =
      content.type === "inkind"
        ? "inkind"
        : doc.document_type === "letter"
          ? "letter"
          : doc.document_type === "invoice"
            ? "invoice"
            : "receipt";

    return {
      id: doc.id,
      type: docType,
      date:
        content.date ||
        new Date(doc.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      timestamp: new Date(doc.created_at).getTime(),
      refNo: content.refNo || `DOC-${String(doc.id).slice(0, 8).toUpperCase()}`,
      recipient: doc.recipient_name || content.recipient || "Unspecified",
      subject: doc.title || content.subject || "No Subject",
      bodyEn: content.bodyEn,
      bodyFa: content.bodyFa,
      amount: content.amount,
      donorName: content.donorName,
      donorAddress: content.donorAddress,
      inKindItems: content.inKindItems,
      invoiceItems: content.invoiceItems,
      invoiceWallet: content.invoiceWallet,
    };
  };

  const loadDocumentHistory = useCallback(async () => {
    const result = await getDocuments(1, 200);

    if (result.error) {
      const savedHistory = localStorage.getItem("church_doc_history");
      if (savedHistory) {
        try {
          setDocHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error(e);
        }
      }
      return;
    }

    const mapped = (result.data?.documents || []).map(mapDbDocumentToHistory);
    setDocHistory(mapped);
  }, []);

  const persistHistoryItem = useCallback(async (item: DocHistoryItem) => {
    const documentType = item.type === "letter" ? "letter" : item.type === "invoice" ? "invoice" : "receipt";

    const result = await saveDocument(
      {
        document_type: documentType,
        title: item.subject || "No Subject",
        description: `Reference: ${item.refNo}`,
        template_name: selectedTpl?.id,
        document_content: item,
        recipient_name: item.recipient,
        recipient_address: item.donorAddress,
        tags: [item.type],
        is_draft: false,
      },
      false
    );

    if (result.error) {
      toast.error(isRtl ? "ذخیره در دیتابیس انجام نشد" : "Failed to save in database");
      return null;
    }

    return (result.data as any)?.id || null;
  }, [isRtl, selectedTpl?.id]);

  const addHistoryItem = useCallback(async (item: DocHistoryItem) => {
    setDocHistory(prev => [item, ...prev]);

    const savedId = await persistHistoryItem(item);
    if (savedId) {
      setDocHistory(prev => prev.map(i => (i.id === item.id ? { ...i, id: savedId } : i)));
    }
  }, [persistHistoryItem]);

  const handleDeleteHistoryItem = useCallback(async (item: DocHistoryItem) => {
    const result = await deleteDocument(item.id);
    setDocHistory(prev => prev.filter(i => i.id !== item.id));

    if (result.error) {
      toast.error(isRtl ? "این مورد فقط محلی حذف شد" : "Deleted locally only");
      return;
    }

    toast.success(isRtl ? "حذف شد" : "Deleted");
  }, [isRtl]);

  const handleClearHistory = useCallback(async () => {
    const current = [...docHistory];
    let failed = 0;

    for (const item of current) {
      const result = await deleteDocument(item.id);
      if (result.error) failed += 1;
    }

    setDocHistory([]);

    if (failed > 0) {
      toast.error(isRtl ? "بخشی از حذف‌ها فقط محلی انجام شد" : "Some entries were deleted locally only");
      return;
    }

    toast.success(isRtl ? "تاریخچه پاک شد" : "History cleared");
  }, [docHistory, isRtl]);

  // Persistence: Load
  useEffect(() => {
    const savedSettings = localStorage.getItem("church_settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setChurch(prev => ({ ...prev, ...parsed }));
        setSettingsDraft(prev => ({ ...prev, ...parsed }));
      } catch (e) { console.error("Error loading church settings", e); }
    }

    void loadDocumentHistory();

    const savedTemplates = localStorage.getItem("mychurch_doc_templates");
    if (savedTemplates) {
        try { setDocTemplates(JSON.parse(savedTemplates)); } catch (e) { console.error(e); }
    }
  }, []);

  // Automate signatory for admins
  useEffect(() => {
    if (isAdmin && (church.signatoryName === DEFAULT_CHURCH.signatoryName || !church.signatoryName)) {
      setChurch(prev => ({ ...prev, signatoryName: currentUser.name, signatoryTitle: currentUser.title }));
      setSettingsDraft(prev => ({ ...prev, signatoryName: currentUser.name, signatoryTitle: currentUser.title }));
    }
  }, [isAdmin, currentUser, church.signatoryName]);

  // Persistence: Save
  useEffect(() => {
    localStorage.setItem("church_settings", JSON.stringify(church));
  }, [church]);

  useEffect(() => {
    localStorage.setItem("church_doc_history", JSON.stringify(docHistory));
  }, [docHistory]);

  useEffect(() => {
    localStorage.setItem("mychurch_doc_templates", JSON.stringify(docTemplates));
  }, [docTemplates]);



  // Tab
  const [activeTab, setActiveTab] = useState<"letters" | "receipts" | "inkind" | "invoice" | "history">("letters");

  // Letter fields
  const [selectedTpl, setSelectedTpl] = useState<typeof LETTER_TEMPLATES[number] | null>(null);
  const [editLang, setEditLang] = useState<"en" | "fa">("en");
  const [bodyEn, setBodyEn] = useState("");
  const [bodyFa, setBodyFa] = useState("");
  const [letterTo, setLetterTo] = useState("");
  const [letterToAddress, setLetterToAddress] = useState("");
  const [letterSubject, setLetterSubject] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [docNumber, setDocNumber] = useState(() => `ICW-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000 + 1000))}`);

  // AI loading states
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingEnhance, setLoadingEnhance] = useState(false);
  const [loadingTranslate, setLoadingTranslate] = useState(false);

  // Receipt state
  const [receipt, setReceipt] = useState<Record<string, string | number>>({
    donorName: "", donorAddress: "", amount: 0, method: "cash",
    checkNumber: "", description: "Charitable contribution to the " + DEFAULT_CHURCH.nameEn,
    date: new Date().toISOString().split("T")[0],
  });
  const [inKindItems, setInKindItems] = useState([{ name: "", qty: 1, value: 0 }]);
  const [receiptNo, setReceiptNo] = useState(() => String(Math.floor(Math.random() * 90000 + 10000)));

  // Invoice state
  const [invoiceLang, setInvoiceLang] = useState<"en" | "fa">("en");
  const [invoiceTo, setInvoiceTo] = useState("DEJ TV");
  const [invoiceAddress, setInvoiceAddress] = useState("");
  const [invoiceName, setInvoiceName] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [invoiceWallet, setInvoiceWallet] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [invoiceItems, setInvoiceItems] = useState([{ id: crypto.randomUUID(), description: "", total: 0 }]);
  const [aiInvoiceInput, setAiInvoiceInput] = useState("");
  const [invoiceNo, setInvoiceNo] = useState(() => String(Math.floor(Math.random() * 90000 + 10000)));
  const [historyCat, setHistoryCat] = useState<"all" | "letter" | "receipt" | "inkind" | "invoice">("all");

  const handleAddInvoiceItem = () => setInvoiceItems(prev => [...prev, { id: crypto.randomUUID(), description: "", total: 0 }]);
  const handleRemoveInvoiceItem = (id: string) => setInvoiceItems(prev => prev.filter(item => item.id !== id));
  const handleInvoiceItemChange = (id: string, field: "description" | "total", value: any) => {
    setInvoiceItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  const invoiceTotalAmount = invoiceItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  const handleCopyLink = (item: DocHistoryItem) => {
    // Generates a link to the new Public Viewer Route
    const link = `${window.location.origin}/documents/view/${item.id}`;
    navigator.clipboard.writeText(link);
    alert(isRtl ? "لینک کپی شد" : "Link copied to clipboard!");
  };

  const [loadingInvoiceGen, setLoadingInvoiceGen] = useState(false);
  const handleGenerateInvoice = async () => {
    if (!aiInvoiceInput.trim()) return;
    setLoadingInvoiceGen(true);
    try {
      const res = await fetch("/api/ai/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: aiInvoiceInput })
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const newItems = data.items.map((item: any) => ({
        id: crypto.randomUUID(),
        description: item.description,
        total: item.total
      }));
      if (invoiceItems.length === 1 && !invoiceItems[0].description && !invoiceItems[0].total) {
        setInvoiceItems(newItems);
      } else {
        setInvoiceItems([...invoiceItems, ...newItems]);
      }
      setAiInvoiceInput("");
    } catch (e) { alert("Failed to generate AI items"); }
    finally { setLoadingInvoiceGen(false); }
  };



  const letterRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const onPrintLetter = useReactToPrint({ contentRef: letterRef });
  const onPrintReceipt = useReactToPrint({ contentRef: receiptRef });
  const onPrintInvoice = useReactToPrint({ contentRef: invoiceRef });

  const handlePrintInvoice = () => {
    const newItem: DocHistoryItem = {
      id: crypto.randomUUID(),
      type: "invoice",
      date: invoiceDate,
      timestamp: Date.now(),
      refNo: `INV-${invoiceNo}`,
      recipient: invoiceTo,
      subject: `Invoice for ${invoiceName}`,
      amount: invoiceTotalAmount,
      invoiceItems: invoiceItems,
      invoiceWallet: invoiceWallet,
    };
    void addHistoryItem(newItem);
    onPrintInvoice();
  };


  const handlePrintLetter = () => {
    const newItem: DocHistoryItem = {
      id: crypto.randomUUID(),
      type: "letter",
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      timestamp: Date.now(),
      refNo: docNumber,
      recipient: recipientName || letterTo || "Unspecified",
      subject: letterSubject || "No Subject",
      bodyEn,
      bodyFa,
    };
    void addHistoryItem(newItem);
    onPrintLetter();
  };

  const handlePrintReceipt = () => {
    const total = inKindItems.reduce((s, i) => s + i.value * i.qty, 0);
    const newItem: DocHistoryItem = {
      id: crypto.randomUUID(),
      type: activeTab === "inkind" ? "inkind" : "receipt",
      date: receipt.date as string || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      timestamp: Date.now(),
      refNo: `RCP-${receiptNo}`,
      recipient: receipt.donorName as string || "Anonymous",
      subject: activeTab === "inkind" ? "In-Kind Donation" : "Financial Contribution",
      amount: activeTab === "inkind" ? total : Number(receipt.amount),
      donorName: receipt.donorName as string,
      donorAddress: receipt.donorAddress as string,
      inKindItems: activeTab === "inkind" ? inKindItems : undefined,
    };
    void addHistoryItem(newItem);
    handlePrintReceiptNative();
  };

  const handlePrintReceiptNative = onPrintReceipt;

  const loadTpl = (tpl: typeof LETTER_TEMPLATES[number]) => {
    setSelectedTpl(tpl);
    setBodyEn(tpl.bodyEn);
    setBodyFa(tpl.bodyFa);
    setLetterTo(tpl.toEn);
    setLetterSubject(tpl.subjectEn);
  };

  // Save template
  const handleSaveTemplate = () => {
    if (!letterSubject || (!bodyEn && !bodyFa)) return;
    const name = prompt(isRtl ? "نام قالب را وارد کنید:" : "Enter template name:", letterSubject);
    if (!name) return;
    
    const newTemplate = {
      id: crypto.randomUUID(),
      name,
      subject: letterSubject,
      bodyEn,
      bodyFa
    };
    setDocTemplates(prev => {
      const updated = [newTemplate, ...prev];
      localStorage.setItem("mychurch_doc_templates", JSON.stringify(updated));
      return updated;
    });
    alert(isRtl ? "قالب با موفقیت ذخیره شد" : "Template saved successfully");
  };

  // Load template
  const handleLoadTemplate = (tpl: any) => {
    setLetterSubject(tpl.subject);
    setBodyEn(tpl.bodyEn);
    setBodyFa(tpl.bodyFa);
    // Clear recipient info to correspond with user request
    setRecipientName("");
    setLetterTo("");
    setLetterToAddress("");
    setSelectedTpl(null);
  };

  useEffect(() => {
    const savedTemplates = localStorage.getItem("mychurch_doc_templates");
    if (savedTemplates) setDocTemplates(JSON.parse(savedTemplates));
  }, []);

  const callAI = useCallback(async (mode: string, body?: string) => {
    const res = await fetch("/api/ai/letters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, lang: editLang, topic: aiTopic, body: body || (editLang === "en" ? bodyEn : bodyFa) }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const data = await res.json();
    return data.result as string;
  }, [editLang, aiTopic, bodyEn, bodyFa]);

  const handleRePrint = (item: DocHistoryItem) => {
    if (item.type === "letter") {
      setActiveTab("letters");
      setDocNumber(item.refNo);
      setRecipientName(item.recipient);
      setLetterSubject(item.subject);
      setBodyEn(item.bodyEn || "");
      setBodyFa(item.bodyFa || "");
      setTimeout(() => handlePrintLetter(), 500);
    } else if (item.type === "invoice") {
      setActiveTab("invoice");
      setInvoiceNo(item.refNo.replace("INV-", ""));
      setInvoiceTo(item.recipient);
      setInvoiceName(item.subject.replace("Invoice for ", ""));
      setInvoiceDate(item.date);
      setInvoiceItems(item.invoiceItems || [{ id: crypto.randomUUID(), description: "", total: 0 }]);
      setInvoiceWallet(item.invoiceWallet || "");
      setTimeout(() => onPrintInvoice(), 500);

    } else {
      setActiveTab(item.type === "inkind" ? "inkind" : "receipts");
      setReceiptNo(item.refNo.replace("RCP-", ""));
      setReceipt({
        donorName: item.donorName || "",
        donorAddress: item.donorAddress || "",
        amount: item.amount || 0,
        date: item.date,
        method: "Check/Cash",
        description: item.subject,
      });
      if (item.type === "inkind") {
        setInKindItems(item.inKindItems || []);
      }
      setTimeout(() => handlePrintReceipt(), 500);
    }
  };

  const handleGenerate = async () => {
    if (!aiTopic.trim()) return;
    setLoadingGenerate(true);
    try {
      const result = await callAI("generate");
      if (editLang === "en") setBodyEn(result); else setBodyFa(result);
    } catch { /* silently fail */ }
    finally { setLoadingGenerate(false); }
  };

  const handleEnhance = async () => {
    setLoadingEnhance(true);
    try {
      const result = await callAI("enhance");
      if (editLang === "en") setBodyEn(result); else setBodyFa(result);
    } catch { /* silently fail */ }
    finally { setLoadingEnhance(false); }
  };

  const handleTranslate = async () => {
    setLoadingTranslate(true);
    try {
      const sourceBody = editLang === "en" ? bodyEn : bodyFa;
      const result = await callAI("translate", sourceBody);
      // Put result in the OTHER language pane
      if (editLang === "en") setBodyFa(result); else setBodyEn(result);
    } catch { /* silently fail */ }
    finally { setLoadingTranslate(false); }
  };

  const catColor: Record<string, string> = {
    immigration: "bg-blue-500/20 text-blue-300 border-blue-400/30",
    tax: "bg-green-500/20 text-green-300 border-green-400/30",
    general: "bg-zinc-500/20 text-zinc-300 border-zinc-400/30",
  };


  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir={isRtl ? "rtl" : "ltr"}>
      <PublicHeader />

      <main className="flex-1 pt-28 pb-16 px-4 md:px-8 max-w-7xl mx-auto w-full">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/25">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black">{isRtl ? "اسناد و مدارک رسمی کلیسا" : "Church Official Documents"}</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                {isRtl ? "نامه‌های اداری، رسید کمک مالی – با هوش مصنوعی" : "Administrative letters & donation receipts – AI powered"}
              </p>
            </div>
          </div>
          <button onClick={() => { setSettingsDraft(church); setShowSettings(true); }}
            className="flex items-center gap-2 glass border border-white/10 px-4 py-2.5 rounded-xl hover:border-primary/50 transition-all text-sm font-bold">
            <Settings className="w-4 h-4" />
            {isRtl ? "تنظیمات کلیسا" : "Church Settings"}
          </button>
        </div>

        {/* ── Settings Modal ── */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-3xl p-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black flex items-center gap-2"><Settings className="w-5 h-5 text-primary" />{isRtl ? "تنظیمات پیشرفته مدارک" : "Advanced Document Settings"}</h2>
                <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>

              {/* Settings Tabs */}
              <div className="flex gap-4 border-b border-white/10 mb-6">
                <button onClick={() => setSettingsTab("info")} title={isRtl ? "اطلاعات کلیسا" : "Church Info"} className={`pb-3 text-sm font-bold transition-all relative ${settingsTab === "info" ? "text-primary" : "text-muted-foreground"}`}>
                  <span className="flex items-center gap-2"><Building2 className="w-4 h-4"/> {isRtl ? "اطلاعات کلیسا" : "Church Info"}</span>
                  {settingsTab === "info" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>}
                </button>
                <button onClick={() => setSettingsTab("design")} title={isRtl ? "طراحی و امنیت" : "Design & Security"} className={`pb-3 text-sm font-bold transition-all relative ${settingsTab === "design" ? "text-primary" : "text-muted-foreground"}`}>
                  <span className="flex items-center gap-2"><Wand2 className="w-4 h-4"/> {isRtl ? "طراحی و امنیت" : "Design & Security"}</span>
                  {settingsTab === "design" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></div>}
                </button>

              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {settingsTab === "info" ? (
                  <div className="grid grid-cols-2 gap-4">
                    {([
                      { key: "nameEn", label: "Church Name (EN)", icon: <Globe className="w-4 h-4" /> },
                      { key: "nameFa", label: "نام کلیسا (FA)", icon: <Globe className="w-4 h-4" /> },
                      { key: "address", label: "Address", icon: <MapPin className="w-4 h-4" /> },
                      { key: "ein", label: "EIN Number", icon: <Hash className="w-4 h-4" /> },
                      { key: "phone", label: "Phone", icon: <Phone className="w-4 h-4" /> },
                      { key: "email", label: "Email", icon: <Mail className="w-4 h-4" /> },
                      { key: "web", label: "Website", icon: <Globe className="w-4 h-4" /> },
                      { key: "pastor", label: "Pastor / Signatory", icon: <User className="w-4 h-4" /> },
                      { key: "denomination", label: "Denomination / Legal Status", icon: <Building2 className="w-4 h-4" /> },
                    ] as { key: keyof typeof DEFAULT_CHURCH; label: string; icon: React.ReactNode }[]).map(f => (
                      <div key={f.key} className={f.key === "denomination" || f.key === "address" ? "col-span-2" : ""}>
                        <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">{f.icon}{f.label}</label>
                        <input
                          value={settingsDraft[f.key] as string}
                          onChange={e => setSettingsDraft(s => ({ ...s, [f.key]: e.target.value }))}
                          title={f.label}
                          className={inputCls}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Theme Selection */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-3 block">{isRtl ? "انتخاب تم سربرگ" : "Select Letterhead Theme"}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {THEMES.map(theme => (
                          <button
                            key={theme.id}
                            onClick={() => setSettingsDraft(s => ({ ...s, letterheadTheme: theme.id }))}
                            className={`flex flex-col gap-2 p-3 rounded-xl border transition-all text-left ${
                              settingsDraft.letterheadTheme === theme.id ? "border-primary bg-primary/10" : "border-white/10 glass hover:border-white/20"
                            }`}
                          >
                            <div className={`w-full h-12 rounded-lg ${theme.preview} flex items-center justify-center`}>
                              {theme.id === "custom" && <Plus className="w-5 h-5 text-muted-foreground" />}
                            </div>
                            <span className="text-xs font-bold">{theme.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Advanced Design Panel */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase text-primary/80">{isRtl ? "تنظیمات پیشرفته طراحی" : "Advanced Design Controls"}</h3>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setLangTab("fa")} 
                            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${langTab === "fa" ? "bg-primary text-white" : "glass border border-white/10 text-muted-foreground"}`}
                          >
                            FA (فارسی)
                          </button>
                          <button 
                            onClick={() => setLangTab("en")} 
                            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${langTab === "en" ? "bg-blue-600 text-white" : "glass border border-white/10 text-muted-foreground"}`}
                          >
                            EN (English)
                          </button>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-widest">{isRtl ? "سایز لوگو" : "Logo Size"}</label>
                            <input 
                              type="range" min="40" max="250" 
                              value={langTab === "fa" ? settingsDraft.designFa.logoSize : settingsDraft.designEn.logoSize}
                              onChange={e => {
                                const val = parseInt(e.target.value);
                                setSettingsDraft(s => ({
                                  ...s,
                                  [langTab === "fa" ? "designFa" : "designEn"]: { ...s[langTab === "fa" ? "designFa" : "designEn"], logoSize: val }
                                }));
                              }}
                              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none accent-primary"
                            />
                            <div className="flex justify-between mt-1"><span className="text-[9px] text-muted-foreground">Small</span><span className="text-[9px] text-primary font-bold">{langTab === "fa" ? settingsDraft.designFa.logoSize : settingsDraft.designEn.logoSize}px</span><span className="text-[9px] text-muted-foreground">Large</span></div>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-widest">{isRtl ? "فونت فامیلی" : "Font Family"}</label>
                            <select 
                              value={langTab === "fa" ? settingsDraft.designFa.fontFamily : settingsDraft.designEn.fontFamily}
                              onChange={e => {
                                const val = e.target.value;
                                setSettingsDraft(s => ({
                                  ...s,
                                  [langTab === "fa" ? "designFa" : "designEn"]: { ...s[langTab === "fa" ? "designFa" : "designEn"], fontFamily: val }
                                }));
                              }}
                              className={inputCls}
                            >
                              <option value="'Vazirmatn', sans-serif">Vazirmatn (Default Persian)</option>
                              <option value="Inter, sans-serif">Inter (Default English)</option>
                              <option value="'Times New Roman', serif">Times New Roman (Classic)</option>
                              <option value="Georgia, serif">Georgia (Elegant)</option>
                              <option value="Arial, sans-serif">Arial (Modern)</option>
                              <option value="'Courier New', monospace">Courier (Typewriter)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { key: "titleSize", label: isRtl ? "سایز تیتر" : "Title Size" },
                            { key: "bodySize", label: isRtl ? "سایز متن" : "Body Size" },
                            { key: "footerSize", label: isRtl ? "سایز فوتر" : "Footer Size" },
                          ].map(f => (
                            <div key={f.key}>
                              <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-tighter">{f.label}</label>
                              <input 
                                type="number"
                                value={(langTab === "fa" ? settingsDraft.designFa : settingsDraft.designEn)[f.key as keyof DocumentDesign] as number}
                                onChange={e => {
                                  const val = parseInt(e.target.value);
                                  setSettingsDraft(s => ({
                                    ...s,
                                    [langTab === "fa" ? "designFa" : "designEn"]: { ...s[langTab === "fa" ? "designFa" : "designEn"], [f.key]: val }
                                  }));
                                }}
                                className={inputCls}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-4">
                          <button 
                            onClick={() => {
                              setSettingsDraft(s => ({
                                ...s,
                                [langTab === "fa" ? "designFa" : "designEn"]: { ...s[langTab === "fa" ? "designFa" : "designEn"], isBoldTitle: !s[langTab === "fa" ? "designFa" : "designEn"].isBoldTitle }
                              }));
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border transition-all text-xs font-bold ${
                              (langTab === "fa" ? settingsDraft.designFa : settingsDraft.designEn).isBoldTitle ? "bg-primary/20 border-primary text-primary" : "glass border-white/10 text-muted-foreground"
                            }`}
                          >
                            <Plus className={`w-3 h-3 ${ (langTab === "fa" ? settingsDraft.designFa : settingsDraft.designEn).isBoldTitle ? "" : "opacity-30" }`} /> {isRtl ? "تیتر بولد" : "Bold Title"}
                          </button>
                          <button 
                            onClick={() => {
                              setSettingsDraft(s => ({
                                ...s,
                                [langTab === "fa" ? "designFa" : "designEn"]: { ...s[langTab === "fa" ? "designFa" : "designEn"], isItalicBody: !s[langTab === "fa" ? "designFa" : "designEn"].isItalicBody }
                              }));
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border transition-all text-xs font-bold ${
                              (langTab === "fa" ? settingsDraft.designFa : settingsDraft.designEn).isItalicBody ? "bg-primary/20 border-primary text-primary" : "glass border-white/10 text-muted-foreground"
                            }`}
                          >
                           <Sparkles className={`w-3 h-3 ${ (langTab === "fa" ? settingsDraft.designFa : settingsDraft.designEn).isItalicBody ? "" : "opacity-30" }`} /> {isRtl ? "متن ایتالیک" : "Italic Body"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Paper Size */}
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs text-muted-foreground mb-2 block">{isRtl ? "اندازه کاغذ" : "Paper Size"}</label>
                        <div className="flex gap-2">
                          {(["A4", "Letter"] as const).map(size => (
                            <button
                              key={size}
                              onClick={() => setSettingsDraft(s => ({ ...s, paperSize: size }))}
                              title={size}
                              className={`flex-1 py-2 rounded-lg border font-bold text-xs transition-all ${
                                settingsDraft.paperSize === size ? "bg-primary text-primary-foreground border-primary" : "glass border-white/10 text-muted-foreground"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                        <div className="mt-1 flex justify-between">
                          <span className="text-[9px] text-muted-foreground">{settingsDraft.paperSize === "A4" ? "210 x 297 mm" : "215.9 x 279.4 mm"}</span>
                          <span className="text-[9px] text-muted-foreground uppercase">{settingsDraft.paperSize === "A4" ? "ISO 216" : "US Letter"}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-2 block uppercase tracking-tighter">{isRtl ? "شفافیت واترمارک" : "Watermark Opacity"}</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range" min="0" max="0.1" step="0.01"
                            value={settingsDraft.watermarkOpacity}
                            onChange={e => setSettingsDraft(s => ({ ...s, watermarkOpacity: parseFloat(e.target.value) }))}
                            className="flex-1 accent-primary"
                          />
                          <span className="text-[10px] font-mono text-muted-foreground">{(settingsDraft.watermarkOpacity * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Signature & Author */}
                    <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                       <h3 className="text-xs font-black uppercase text-primary/80">{isRtl ? "تنظیمات امضا و هویت نویسنده" : "Signature & Author Identity"}</h3>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">{isRtl ? "نام امضاکننده" : "Signatory Name"}</label>
                            <input
                              value={settingsDraft.signatoryName}
                              onChange={e => setSettingsDraft(s => ({ ...s, signatoryName: e.target.value }))}
                              className={inputCls}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">{isRtl ? "سمت / عنوان" : "Title / Position"}</label>
                            <input
                              value={settingsDraft.signatoryTitle}
                              onChange={e => setSettingsDraft(s => ({ ...s, signatoryTitle: e.target.value }))}
                              className={inputCls}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-xs text-muted-foreground mb-1 block">{isRtl ? "آدرس تصویر امضا (PNG شفاف بهترین است)" : "Signature Image URL (Transparent PNG recommended)"}</label>
                            <div className="flex gap-2">
                               <input
                                value={settingsDraft.signatureImage}
                                onChange={e => setSettingsDraft(s => ({ ...s, signatureImage: e.target.value }))}
                                placeholder="https://..."
                                className={inputCls}
                              />
                               <div className="flex items-center gap-2 px-3 border border-white/10 rounded-xl glass">
                                  <input
                                    type="checkbox"
                                    id="qr_toggle"
                                    checked={settingsDraft.showVerifyQR}
                                    onChange={e => setSettingsDraft(s => ({ ...s, showVerifyQR: e.target.checked }))}
                                    className="accent-primary"
                                  />
                                  <label htmlFor="qr_toggle" className="text-[10px] font-bold cursor-pointer whitespace-nowrap">QR VERIFY</label>
                               </div>
                            </div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}
              </div>


              <div className="flex items-center justify-between gap-4 mt-6 pt-5 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(isRtl ? "آیا از بازنشانی تنظیمات به حالت پیش‌فرض اطمینان دارید؟" : "Are you sure you want to reset all settings to defaults?")) {
                      setSettingsDraft(DEFAULT_CHURCH);
                    }
                  }}
                  title={isRtl ? "بازنشانی به پیش‌فرض" : "Reset to Defaults"}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  {isRtl ? "بازنشانی پیش‌فرض" : "Restore Defaults"}
                </button>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowSettings(false)} className="glass border border-white/10 rounded-xl px-6 py-2.5 text-sm font-bold hover:border-white/20 transition-all">
                    {isRtl ? "انصراف" : "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setChurch(settingsDraft); setShowSettings(false); }}
                    className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-8 py-2.5 text-sm font-black shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    {isRtl ? "ذخیره تنظیمات" : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

                {/* ── Tabs ── */}
        <div className="flex gap-2 mb-8 glass p-1 rounded-2xl w-fit overflow-x-auto">
          {[
            { id: "letters", icon: <FileSignature className="w-4 h-4" />, en: "Official Letters", fa: "نامه‌های اداری" },
            { id: "receipts", icon: <CreditCard className="w-4 h-4" />, en: "Donation Receipt", fa: "رسید کمک مالی" },
            { id: "inkind", icon: <Package className="w-4 h-4" />, en: "In-Kind Receipt", fa: "رسید لوازم" },
            { id: "invoice", icon: <DollarSign className="w-4 h-4" />, en: "Invoice", fa: "فاکتور / هزینه" },
            { id: "history", icon: <HistoryIcon className="w-4 h-4" />, en: "History & Sent", fa: "تاریخچه و آرشیو" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}{isRtl ? tab.fa : tab.en}
            </button>
          ))}
        </div>

        {/* ══ LETTERS TAB ══ */}
        {activeTab === "letters" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Templates Sidebar */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4" />{isRtl ? "الگوهای آماده" : "Templates"}
              </h3>
              {LETTER_TEMPLATES.map(tpl => (
                <button key={tpl.id} onClick={() => loadTpl(tpl)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedTpl?.id === tpl.id ? "border-primary bg-primary/10" : "border-white/10 glass hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${catColor[tpl.category]}`}>{tpl.category}</span>
                    {selectedTpl?.id === tpl.id && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="text-sm font-semibold leading-tight">{isRtl ? tpl.nameFa : tpl.nameEn}</div>
                </button>
              ))}

              {docTemplates.length > 0 && (
                <>
                  <h3 className="font-bold text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-6 mb-2">{isRtl ? "قالب‌های ذخیره شده شما" : "Your Saved Templates"}</h3>
                  <div className="space-y-2">
                    {docTemplates.map(tpl => (
                      <div key={tpl.id} className="group relative">
                        <button onClick={() => handleLoadTemplate(tpl)}
                          className="w-full text-left p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all">
                          <div className="text-xs font-black text-blue-400 mb-1 flex items-center gap-2">
                            <Save className="w-3 h-3" /> {isRtl ? "قالب شخصی" : "CUSTOM TEMPLATE"}
                          </div>
                          <div className="text-sm font-semibold leading-tight">{tpl.name}</div>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDocTemplates(prev => prev.filter(t => t.id !== tpl.id)); }}
                          className="absolute top-2 right-2 p-1 text-red-400/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <button
                onClick={() => { setSelectedTpl(null); setBodyEn(""); setBodyFa(""); setLetterTo(""); setLetterSubject(""); }}
                className="w-full p-4 rounded-xl border border-dashed border-white/20 text-muted-foreground hover:text-foreground hover:border-white/40 transition-all flex items-center gap-2 justify-center text-sm font-medium"
              >
                <Plus className="w-4 h-4" />{isRtl ? "نامه خالی" : "Blank Letter"}
              </button>
            </div>

            {/* Editor */}
            <div className="lg:col-span-2 space-y-4">
              <div className="glass rounded-2xl border border-white/10 p-6 space-y-4">

                {/* Header row */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h3 className="font-bold text-lg">{isRtl ? "ویرایشگر نامه" : "Letter Editor"}</h3>
                  <div className="flex gap-2 items-center">
                    {/* Lang toggle */}
                    <div className="flex glass rounded-xl p-1 border border-white/10">
                      {(["en", "fa"] as const).map(l => (
                        <button key={l} onClick={() => setEditLang(l)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${editLang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                          {l === "en" ? "EN" : "فا"}
                        </button>
                      ))}
                    </div>
                    {/* Doc Number */}
                    <div className="flex items-center gap-1.5 glass border border-white/10 rounded-xl px-3 py-2">
                      <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                      <input value={docNumber} onChange={e => setDocNumber(e.target.value)} title="Document Reference Number"
                        className="bg-transparent text-xs w-36 focus:outline-none text-muted-foreground focus:text-foreground" />
                    </div>
                  </div>
                </div>

                {/* Recipient Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><User className="w-3 h-3" />{isRtl ? "نام گیرنده" : "Recipient Name"}</label>
                    <input value={recipientName} onChange={e => setRecipientName(e.target.value)}
                      placeholder={isRtl ? "نام و نام خانوادگی" : "Full Name"} title="Recipient Name" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Building2 className="w-3 h-3" />{isRtl ? "سازمان" : "Agency / Organization"}</label>
                    <input value={letterTo} onChange={e => setLetterTo(e.target.value)}
                      placeholder="USCIS, IRS, DHS..." title="Organization" className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{isRtl ? "آدرس گیرنده" : "Recipient Address"}</label>
                    <AddressInput
                      value={letterToAddress}
                      onChange={setLetterToAddress}
                      placeholder={isRtl ? "آدرس (شروع به تایپ کنید...)" : "Start typing address..."}
                      className={inputCls}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><FileText className="w-3 h-3" />{isRtl ? "موضوع نامه" : "Subject / RE:"}</label>
                    <input value={letterSubject} onChange={e => setLetterSubject(e.target.value)}
                      placeholder="RE: ..." title="Subject" className={inputCls} />
                  </div>
                </div>

                {/* AI Topic Generator */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold">{isRtl ? "تولید نامه با هوش مصنوعی" : "Generate Letter with AI"}</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={aiTopic}
                      onChange={e => setAiTopic(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleGenerate()}
                      placeholder={isRtl ? "موضوع نامه را بنویسید... (مثلاً: نامه حمایت تمدید ویزا)" : "Describe the letter topic... (e.g. Support letter for visa extension)"}
                      title="AI topic input"
                      className="flex-1 glass border border-primary/30 rounded-xl px-4 py-2.5 text-sm bg-transparent focus:outline-none focus:border-primary/60 placeholder-white/20"
                    />
                    <button
                      onClick={handleGenerate}
                      disabled={loadingGenerate || !aiTopic.trim()}
                      title="Generate"
                      className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-all"
                    >
                      {loadingGenerate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {isRtl ? "بساز" : "Generate"}
                    </button>
                  </div>
                </div>

                {/* Text Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                      {editLang === "en" ? "📝 English Text" : "📝 متن فارسی"}
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      <AIButton
                        label={isRtl ? "ویرایش حرفه‌ای" : "Polish Text"}
                        onClick={handleEnhance}
                        loading={loadingEnhance}
                        disabled={!(editLang === "en" ? bodyEn : bodyFa).trim()}
                        icon={<Wand2 className="w-3.5 h-3.5" />}
                      />
                      <AIButton
                        label={editLang === "en" ? "→ ترجمه فارسی" : "→ EN Translation"}
                        onClick={handleTranslate}
                        loading={loadingTranslate}
                        disabled={!(editLang === "en" ? bodyEn : bodyFa).trim()}
                        icon={<Languages className="w-3.5 h-3.5" />}
                      />
                    </div>
                  </div>
                  <textarea
                    dir={editLang === "fa" ? "rtl" : "ltr"}
                    value={editLang === "en" ? bodyEn : bodyFa}
                    onChange={e => editLang === "en" ? setBodyEn(e.target.value) : setBodyFa(e.target.value)}
                    rows={16}
                    title={isRtl ? "متن نامه" : "Letter body"}
                    placeholder={editLang === "en"
                      ? "Type or generate your letter..."
                      : "متن نامه را تایپ کنید..."}
                    className="w-full glass border border-white/10 rounded-xl px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-primary/50 resize-y transition-colors font-mono leading-relaxed placeholder-white/20"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleSaveTemplate}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors px-3 py-1.5 rounded-lg border border-blue-500/20 glass"
                    >
                      <Save className="w-3 h-3" /> {isRtl ? "ذخیره بعنوان قالب" : "Save as Template"}
                    </button>
                    {(editLang === "fa" ? bodyFa : bodyEn) && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-400" />
                        {editLang === "en" ? (bodyFa ? "Persian translation ready" : "No Persian translation yet") : (bodyEn ? "English translation ready" : "No English translation yet")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Print */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button onClick={() => handlePrintLetter()}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all text-sm">
                    <Printer className="w-4 h-4" />{isRtl ? "چاپ / ذخیره PDF" : "Print / Save PDF"}
                  </button>
                  <button onClick={() => {
                    const id = crypto.randomUUID();
                    const newItem: DocHistoryItem = {
                      id, type: "letter", date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
                      timestamp: Date.now(), refNo: docNumber, recipient: recipientName || letterTo || "Unspecified",
                      subject: letterSubject || "No Subject", bodyEn, bodyFa
                    };
                     void addHistoryItem(newItem);
                    alert(isRtl ? "در تاریخچه ذخیره شد" : "Saved to History");
                  }} className="glass border border-white/10 px-4 py-2.5 rounded-xl text-sm font-bold hover:border-white/20 transition-all">
                    {isRtl ? "فقط ذخیره در تاریخچه" : "Just Save to History"}
                  </button>
                </div>
              </div>
            </div>

            {/* Hidden print */}
            <div className="hidden print:block">
              <div ref={letterRef}>
                <LetterDoc bodyEn={bodyEn} bodyFa={bodyFa} editLang={editLang}
                  to={letterTo} toAddress={letterToAddress} subject={letterSubject}
                  recipientName={recipientName} refNo={docNumber} church={church} />
                <style>{`@media print { body { margin: 0; } }`}</style>
              </div>
            </div>
          </div>
        )}

        {/* ══ RECEIPTS & IN-KIND ══ */}
        {(activeTab === "receipts" || activeTab === "inkind") && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-2xl border border-white/10 p-6 space-y-4">
              <h3 className="font-bold flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5 text-green-400" />
                {activeTab === "receipts" ? (isRtl ? "رسید کمک مالی" : "Donation Receipt") : (isRtl ? "رسید لوازم اهدایی" : "In-Kind Receipt")}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">{isRtl ? "نام اهداکننده" : "Donor Full Name"}</label>
                  <input value={receipt.donorName as string} onChange={e => setReceipt(r => ({ ...r, donorName: e.target.value }))}
                    placeholder="John Smith" title="Donor name" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">{isRtl ? "آدرس اهداکننده" : "Donor Address"}</label>
                  <AddressInput value={receipt.donorAddress as string} onChange={v => setReceipt(r => ({ ...r, donorAddress: v }))}
                    placeholder="123 Main St, City, State ZIP" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" />{isRtl ? "تاریخ" : "Date"}</label>
                  <input type="date" value={receipt.date as string} onChange={e => setReceipt(r => ({ ...r, date: e.target.value }))}
                    title="Date" className={inputCls} />
                </div>
                {activeTab === "receipts" && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{isRtl ? "مبلغ ($)" : "Amount ($)"}</label>
                    <input type="number" value={receipt.amount as number} onChange={e => setReceipt(r => ({ ...r, amount: parseFloat(e.target.value) || 0 }))}
                      title="Amount" className={inputCls} />
                  </div>
                )}
                {activeTab === "receipts" && (<>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{isRtl ? "روش پرداخت" : "Payment Method"}</label>
                    <select value={receipt.method as string} onChange={e => setReceipt(r => ({ ...r, method: e.target.value }))}
                      title="Payment method" className={`${inputCls} bg-zinc-950`}>
                      <option value="cash">💵 Cash / نقد</option>
                      <option value="check">📝 Check / چک</option>
                      <option value="card">💳 Card / کارت</option>
                    </select>
                  </div>
                  {receipt.method === "check" && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{isRtl ? "شماره چک" : "Check #"}</label>
                      <input value={receipt.checkNumber as string} onChange={e => setReceipt(r => ({ ...r, checkNumber: e.target.value }))}
                        placeholder="#1234" title="Check number" className={inputCls} />
                    </div>
                  )}
                </>)}
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">{isRtl ? "هدف / توضیحات" : "Purpose / Description"}</label>
                  <textarea value={receipt.description as string} onChange={e => setReceipt(r => ({ ...r, description: e.target.value }))}
                    rows={2} title="Description" className={`${inputCls} resize-none`} />
                </div>
              </div>
              {/* In-Kind Items */}
              {activeTab === "inkind" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-muted-foreground font-bold">{isRtl ? "اقلام اهدایی" : "Donated Items"}</label>
                    <button onClick={() => setInKindItems(l => [...l, { name: "", qty: 1, value: 0 }])}
                      className="text-xs text-primary hover:opacity-80 flex items-center gap-1 font-bold">
                      <Plus className="w-3 h-3" />{isRtl ? "افزودن" : "Add Item"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {inKindItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-9 gap-2 items-center">
                        <input value={item.name} onChange={e => setInKindItems(l => l.map((it, i) => i === idx ? { ...it, name: e.target.value } : it))}
                          placeholder={isRtl ? "نام قلم" : "Item name"} title="Item name"
                          className="col-span-4 glass border border-white/10 rounded-lg px-2 py-2 text-xs bg-transparent focus:outline-none" />
                        <input type="number" value={item.qty} onChange={e => setInKindItems(l => l.map((it, i) => i === idx ? { ...it, qty: parseInt(e.target.value) || 1 } : it))}
                          title="Qty" className="col-span-2 glass border border-white/10 rounded-lg px-2 py-2 text-xs bg-transparent focus:outline-none" />
                        <input type="number" value={item.value} onChange={e => setInKindItems(l => l.map((it, i) => i === idx ? { ...it, value: parseFloat(e.target.value) || 0 } : it))}
                          placeholder="$" title="Value"
                          className="col-span-2 glass border border-white/10 rounded-lg px-2 py-2 text-xs bg-transparent focus:outline-none" />
                        <button onClick={() => setInKindItems(l => l.filter((_, i) => i !== idx))} title="Remove"
                          className="text-red-400 hover:text-red-300 flex justify-center"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => handlePrintReceipt()}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-3 rounded-xl font-bold transition-all text-sm">
                  <Printer className="w-4 h-4" />{isRtl ? "چاپ رسید / PDF" : "Print Receipt / PDF"}
                </button>
                <button onClick={() => {
                   const total = inKindItems.reduce((s, i) => s + i.value * i.qty, 0);
                   const newItem: DocHistoryItem = {
                     id: crypto.randomUUID(),
                     type: activeTab === "inkind" ? "inkind" : "receipt",
                     date: receipt.date as string || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
                     timestamp: Date.now(),
                     refNo: `RCP-${receiptNo}`,
                     recipient: receipt.donorName as string || "Anonymous",
                     subject: activeTab === "inkind" ? "In-Kind Donation" : "Financial Contribution",
                     amount: activeTab === "inkind" ? total : Number(receipt.amount),
                     donorName: receipt.donorName as string,
                     donorAddress: receipt.donorAddress as string,
                     inKindItems: activeTab === "inkind" ? inKindItems : undefined,
                   };
                   void addHistoryItem(newItem);
                   alert(isRtl ? "در تاریخچه ذخیره شد" : "Saved to History");
                }} className="glass border border-white/10 px-4 py-3 rounded-xl text-sm font-bold hover:border-white/20 transition-all">
                  {isRtl ? "فقط ذخیره" : "Archive Only"}
                </button>
              </div>
            </div>

            {/* Live Preview */}
            <div className="flex flex-col h-full">
              <h3 className="font-bold text-sm text-muted-foreground mb-3 flex justify-between">
                {isRtl ? "پیش‌نمایش زنده (اندازه واقعی در چاپ)" : "Live Preview (Actual size on print)"}
                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 rounded-full border border-blue-500/20">{church.paperSize} Format</span>
              </h3>
              <div className="flex-1 glass rounded-2xl border border-white/10 p-4 flex justify-center items-start overflow-auto max-h-[700px] scrollbar-hide">
                <div style={{ transform: "scale(0.6)", transformOrigin: "top center" }} className="shadow-2xl">
                   <DonationReceiptDoc receipt={receipt} receiptNo={receiptNo} isInKind={activeTab === "inkind"} inKindItems={inKindItems} church={church} />
                </div>
              </div>
            </div>

            {/* Hidden print */}
            <div className="hidden print:block">
              <div ref={receiptRef}>
                <DonationReceiptDoc receipt={receipt} receiptNo={receiptNo} isInKind={activeTab === "inkind"} inKindItems={inKindItems} church={church} />
                <style>{`@media print { body { margin: 0; } }`}</style>
              </div>
            </div>
          </div>
        )}

        {/* ══ INVOICE TAB ══ */}
        {activeTab === "invoice" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-6">
              <div className="glass border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full pointer-events-none" />
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-lg flex items-center gap-2 text-purple-400">
                    <DollarSign className="w-5 h-5" /> {isRtl ? "فرم ساز فاکتور الکترونیک" : "Invoice Generator Form"}
                  </h3>
                  <div className="flex glass rounded-xl p-1 border border-white/10">
                    {(["en", "fa"] as const).map(l => (
                      <button key={l} onClick={() => setInvoiceLang(l)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${invoiceLang === l ? "bg-purple-500 text-white" : "text-muted-foreground hover:text-white"}`}>
                        {l === "en" ? "EN" : "فا"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{isRtl ? "صورتحساب به (نام سازمان)" : "Bill To (Organization)"}</label>
                      <input value={invoiceTo} onChange={e => setInvoiceTo(e.target.value)} placeholder="Wait, you said DEJ TV?" className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{isRtl ? "تاریخ فاکتور" : "Invoice Date"}</label>
                      <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{isRtl ? "آدرس سازمان (صورتحساب به)" : "Bill To Address"}</label>
                    <AddressInput
                      value={invoiceAddress}
                      onChange={setInvoiceAddress}
                      placeholder={isRtl ? "آدرس صورتحساب (شروع به تایپ کنید...)" : "Start typing address..."}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{isRtl ? "نام شخص / سازمان (پیمانکار)" : "Name of Freelancer / Organization"}</label>
                    <input value={invoiceName} onChange={e => setInvoiceName(e.target.value)} placeholder="John Doe" className={inputCls} />
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                       <label className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{isRtl ? "استخراج با هوش مصنوعی" : "AI Smart Parser"}</label>
                    </div>
                    <div className="relative">
                       <textarea 
                           value={aiInvoiceInput} onChange={e => setAiInvoiceInput(e.target.value)}
                           className={`${inputCls} pr-12`} rows={3}
                           placeholder={isRtl ? "لیست کارها را اینجا پیست کنید (مثال: ۲ تا ویدیو جمعا ۱۰۰ دلار)" : "Paste list of works here..."}
                       ></textarea>
                       <div className="absolute top-6 right-2">
                           <AIButton label="" onClick={handleGenerateInvoice} loading={loadingInvoiceGen} disabled={!aiInvoiceInput.trim()} icon={<Sparkles className="w-4 h-4 text-purple-400"/>} />
                       </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                       <label className="text-xs text-muted-foreground">{isRtl ? "اقلام فاکتور" : "Invoice Items"}</label>
                       <button onClick={handleAddInvoiceItem} className="text-xs flex items-center gap-1 text-primary hover:text-primary/80">
                         <Plus className="w-3.5 h-3.5"/> {isRtl ? "افزودن" : "Add Row"}
                       </button>
                    </div>
                    <div className="space-y-2">
                      {invoiceItems.map(item => (
                        <div key={item.id} className="flex gap-2 items-center bg-white/5 p-2 rounded-xl">
                           <input value={item.description} onChange={e => handleInvoiceItemChange(item.id, "description", e.target.value)} placeholder="Description" className="flex-1 bg-transparent text-sm min-w-0 outline-none px-2" />
                           <div className="text-muted-foreground text-sm">$</div>
                           <input type="number" dir="ltr" value={item.total || ""} onChange={e => handleInvoiceItemChange(item.id, "total", e.target.value)} placeholder="0.00" className="w-20 bg-transparent text-sm outline-none px-2 font-mono text-primary font-bold" />
                           <button onClick={() => handleRemoveInvoiceItem(item.id)} className="p-1 text-red-400 hover:bg-white/10 rounded-md shrink-0"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-3 px-2">
                      <span className="text-sm font-bold text-muted-foreground">{isRtl ? "جمع هزینه:" : "Total Amount:"}</span>
                      <span className="text-xl font-black text-purple-400 font-mono tracking-tighter">${invoiceTotalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <label className="text-xs text-muted-foreground mb-1 block">{isRtl ? "توضیحات فاکتور (اختیاری)" : "Invoice Notes (Optional)"}</label>
                    <textarea value={invoiceNotes} onChange={e => setInvoiceNotes(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder={isRtl ? "توضیحات اضافه برای مشتری..." : "Additional notes for the client..."} />
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <label className="text-xs text-muted-foreground mb-1 block">{isRtl ? "کیف پول تتر (اختیاری)" : "Tether Wallet (TRC20 - Optional)"}</label>
                    <input dir="ltr" value={invoiceWallet} onChange={e => setInvoiceWallet(e.target.value)} placeholder="T..." className={`${inputCls} font-mono text-xs`} />
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button onClick={handlePrintInvoice} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-3 rounded-xl font-black text-sm shadow-xl shadow-purple-500/20 hover:scale-[1.02] transition-transform">
                      <Printer className="w-4 h-4" /> {isRtl ? "چاپ فاکتور" : "Print Invoice"}
                    </button>
                    <button onClick={() => {
                        const newItem: DocHistoryItem = {
                          id: crypto.randomUUID(), type: "invoice", date: invoiceDate, timestamp: Date.now(),
                          refNo: `INV-${invoiceNo}`, recipient: invoiceTo, subject: `Invoice for ${invoiceName}`,
                          amount: invoiceTotalAmount, invoiceItems: invoiceItems, invoiceWallet: invoiceWallet,
                        };
                        void addHistoryItem(newItem);
                        alert(isRtl ? "در تاریخچه ذخیره شد" : "Saved to History");
                    }} className="glass border border-white/10 px-4 py-3 rounded-xl text-sm font-bold hover:border-white/20 transition-all">
                      {isRtl ? "فقط ذخیره" : "Archive"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 flex justify-center sticky top-28 print:static">
              <div className="bg-white p-2 rounded-xl shadow-2xl scale-[0.6] sm:scale-75 md:scale-90 lg:scale-100 origin-top border border-white/20 transition-transform">
                <div ref={invoiceRef}>
                  <InvoiceDoc invoiceTo={invoiceTo} invoiceAddress={invoiceAddress} invoiceName={invoiceName} invoiceDate={invoiceDate} invoiceItems={invoiceItems} invoiceTotalAmount={invoiceTotalAmount} invoiceWallet={invoiceWallet} invoiceNotes={invoiceNotes} invoiceNo={invoiceNo} church={church} lang={invoiceLang} />
                </div>
              </div>
            </div>
          </div>
        )}

                {/* ══ HISTORY TAB ══ */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
               {/* Search Bar */}
               <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <input
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   placeholder={isRtl ? "جستجو در تاریخچه (شماره، گیرنده، موضوع پرداختی، مبلغ...)" : "Instant Search (Ref, Recipient, Subject, Amount...)"}
                   className="w-full glass border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50"
                 />
               </div>
               
               {/* Category Chips and Clear */}
               <div className="flex items-center justify-between flex-wrap gap-4">
                 <div className="flex gap-2 flex-wrap text-xs">
                   <button onClick={() => setHistoryCat("all")} className={`px-4 py-1.5 rounded-full border transition-all ${historyCat === "all" ? "bg-primary border-primary text-white" : "glass border-white/10 text-muted-foreground hover:border-white/20"}`}>{isRtl ? "همه" : "All"}</button>
                   <button onClick={() => setHistoryCat("letter")} className={`px-4 py-1.5 rounded-full border transition-all ${historyCat === "letter" ? "bg-blue-500 border-blue-500 text-white" : "glass border-white/10 text-muted-foreground hover:border-white/20"}`}>{isRtl ? "نامه‌ها" : "Letters"}</button>
                   <button onClick={() => setHistoryCat("receipt")} className={`px-4 py-1.5 rounded-full border transition-all ${historyCat === "receipt" ? "bg-green-500 border-green-500 text-white" : "glass border-white/10 text-muted-foreground hover:border-white/20"}`}>{isRtl ? "رسید نقدی" : "Cash Receipts"}</button>
                   <button onClick={() => setHistoryCat("inkind")} className={`px-4 py-1.5 rounded-full border transition-all ${historyCat === "inkind" ? "bg-amber-500 border-amber-500 text-white" : "glass border-white/10 text-muted-foreground hover:border-white/20"}`}>{isRtl ? "رسید کالا" : "In-Kind Receipts"}</button>
                   <button onClick={() => setHistoryCat("invoice")} className={`px-4 py-1.5 rounded-full border transition-all ${historyCat === "invoice" ? "bg-purple-500 border-purple-500 text-white" : "glass border-white/10 text-muted-foreground hover:border-white/20"}`}>{isRtl ? "فاکتورها" : "Invoices"}</button>
                 </div>
                 
                  <button onClick={() => { if(confirm(isRtl ? "آیا از پاکسازی کل تاریخچه اطمینان دارید؟" : "Are you sure you want to clear all history?")) { void handleClearHistory(); } }} 
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5" /> {isRtl ? "پاکسازی تاریخچه" : "Clear All History"}
                 </button>
               </div>
            </div>

            <div className="glass border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" dir={isRtl ? "rtl" : "ltr"}>
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/10">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{isRtl ? "تاریخ" : "Date"}</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{isRtl ? "شماره" : "Ref No"}</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{isRtl ? "نوع" : "Type"}</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{isRtl ? "گیرنده / درخواست‌کننده" : "Recipient / Donor"}</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{isRtl ? "موضوع" : "Subject"}</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{isRtl ? "مبلغ" : "Amount"}</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">{isRtl ? "عملیات" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {docHistory
                      .filter(item => historyCat === "all" || item.type === historyCat)
                      .filter(item =>
                        [item.refNo, item.recipient, item.subject, item.date, item.amount?.toString() || ""].some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                      .map(item => (
                        <tr key={item.id} className="hover:bg-white/[0.01] transition-colors group text-sm">
                          <td className="px-6 py-4 font-mono text-muted-foreground whitespace-nowrap">{item.date}</td>
                          <td className="px-6 py-4 font-black flex items-center gap-2">
                             {item.type === "letter" && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                             {item.type === "receipt" && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                             {item.type === "inkind" && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                             {item.type === "invoice" && <span className="w-2 h-2 rounded-full bg-purple-500"></span>}
                             <span className="text-primary">{item.refNo}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase ${
                              item.type === "letter" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : 
                              item.type === "inkind" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                              item.type === "invoice" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                              "bg-green-500/10 text-green-400 border-green-500/20"
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold">{item.recipient}</td>
                          <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]">{item.subject}</td>
                          <td className="px-6 py-4 font-mono font-bold">{item.amount ? `$${item.amount.toLocaleString()}` : "—"}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex justify-center gap-2 text-right rtl:text-left">
                              <button
                                onClick={() => handleCopyLink(item)}
                                title={isRtl ? "کپی لینک عمومی (ارسال)" : "Copy Public Link (Send)"}
                                className="p-2.5 rounded-xl glass border border-white/10 text-blue-400 hover:bg-blue-500/20 transition-all shadow-lg"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRePrint(item)}
                                title={isRtl ? "مشاهده و چاپ مجدد" : "View & Re-print"}
                                className="p-2.5 rounded-xl glass border border-white/10 text-primary hover:bg-primary/20 hover:text-primary transition-all shadow-lg"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => { if(confirm(isRtl ? "حذف شود؟" : "Delete?")) { void handleDeleteHistoryItem(item); } }}
                                  title={isRtl ? "حذف" : "Delete"}
                                  className="p-2.5 rounded-xl glass border border-white/10 text-red-500 hover:bg-red-500/20 transition-all shadow-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    {docHistory.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-24 text-center">
                          <div className="flex flex-col items-center gap-4 opacity-10">
                            <HistoryIcon className="w-16 h-16" />
                            <p className="text-lg font-black uppercase tracking-widest">{isRtl ? "تاریخچه خالی است" : "History is empty"}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
      <PublicFooter />
    </div>
  );
}