"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "fa" | "de";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const translations = {
  en: {
    "invoices": "Documents",
    "manage_invoices": "Manage your DEJ TV documents",
    "export_csv": "Export CSV",
    "new_invoice": "New Document",
    "recent_invoices": "Recent Documents",
    "recent_invoices_desc": "A list of your recent documents stored locally.",
    "no_invoices": "No documents found. Create one to get started.",
    "date": "Date",
    "name": "Title/Name",
    "total": "Total",
    "actions": "Actions",
    "view": "View",
    "delete_confirm": "Are you sure you want to delete this document?",
    "back_to_dashboard": "Back to Dashboard",
    "ai_assistant": "AI Assistant",
    "ai_desc": "Describe your work in natural language and let AI fill the items.",
    "ai_placeholder": "e.g., I edited 2 videos for $100 and wrote a report for $50...",
    "thinking": "Thinking...",
    "extract_items": "Extract Items",
    "invoice_details": "Invoice Details",
    "to": "To",
    "personnel_name": "Name (Personnel)",
    "items": "Items",
    "add_row": "Add Row",
    "description": "Description",
    "wallet_tether": "Wallet Tether (USDT TRC20)",
    "save_invoice": "Save Document",
    "alert_name": "Please enter a name or title.",
    "alert_items": "Please add at least one valid item.",
    "alert_ai": "Failed to parse input. Please try again.",
    "print_save": "Print / Save PDF",
    "invoice": "INVOICE",
    "bill_to": "Bill To:",
    "no": "No",
    "type": "Type",
    "payment_receipt": "Payment Receipt",
    "goods_receipt": "Goods Receipt",
    "letter": "Official Letterhead",
    "select_doc_type": "Select Document Type",
    "payment_details": "Payment Details",
    "payer": "Payer",
    "payee": "Payee",
    "amount": "Amount",
    "amount_in_words": "Amount in Words",
    "payment_for": "Payment For",
    "payment_method": "Payment Method",
    "reference_no": "Reference No.",
    "goods_details": "Goods Details",
    "sender": "Sender",
    "receiver": "Receiver",
    "delivery_date": "Delivery Date",
    "driver_name": "Driver Name",
    "quantity": "Quantity",
    "unit": "Unit",
    "letter_details": "Letter Details",
    "recipient": "Recipient",
    "subject": "Subject",
    "body": "Body",
    "sender_name": "Sender Name",
    "sender_title": "Sender Title",
    "page": "Page",
    "of": "of",
    "signature": "Signature",
    "date_received": "Date Received",
  },
  fa: {
    "invoices": "اسناد",
    "manage_invoices": "مدیریت اسناد DEJ TV",
    "export_csv": "خروجی CSV",
    "new_invoice": "سند جدید",
    "recent_invoices": "اسناد اخیر",
    "recent_invoices_desc": "لیست اسناد اخیر شما که به صورت محلی ذخیره شده‌اند.",
    "no_invoices": "سندی یافت نشد. برای شروع یکی ایجاد کنید.",
    "date": "تاریخ",
    "name": "عنوان/نام",
    "total": "مجموع",
    "actions": "عملیات",
    "view": "مشاهده",
    "delete_confirm": "آیا از حذف این سند اطمینان دارید؟",
    "back_to_dashboard": "بازگشت به داشبورد",
    "ai_assistant": "دستیار هوش مصنوعی",
    "ai_desc": "کار خود را به زبان ساده بنویسید تا هوش مصنوعی آیتم‌ها را پر کند.",
    "ai_placeholder": "مثلا: ۲ تا ویدیو ادیت زدم ۱۰۰ دلار و یک گزارش نوشتم ۵۰ دلار...",
    "thinking": "در حال پردازش...",
    "extract_items": "استخراج آیتم‌ها",
    "invoice_details": "جزئیات فاکتور",
    "to": "به",
    "personnel_name": "نام (پرسنل)",
    "items": "آیتم‌ها",
    "add_row": "افزودن ردیف",
    "description": "توضیحات",
    "wallet_tether": "کیف پول تتر (USDT TRC20)",
    "save_invoice": "ذخیره سند",
    "alert_name": "لطفا یک نام یا عنوان وارد کنید.",
    "alert_items": "لطفا حداقل یک آیتم معتبر اضافه کنید.",
    "alert_ai": "خطا در پردازش متن. لطفا دوباره تلاش کنید.",
    "print_save": "چاپ / ذخیره PDF",
    "invoice": "فاکتور",
    "bill_to": "صورتحساب به:",
    "no": "ردیف",
    "type": "نوع",
    "payment_receipt": "رسید پرداخت",
    "goods_receipt": "رسید کالای دریافتی",
    "letter": "سربرگ نامه رسمی",
    "select_doc_type": "انتخاب نوع سند",
    "payment_details": "جزئیات پرداخت",
    "payer": "پرداخت کننده",
    "payee": "دریافت کننده",
    "amount": "مبلغ",
    "amount_in_words": "مبلغ به حروف",
    "payment_for": "بابت",
    "payment_method": "روش پرداخت",
    "reference_no": "شماره پیگیری/ارجاع",
    "goods_details": "جزئیات کالا",
    "sender": "فرستنده",
    "receiver": "گیرنده",
    "delivery_date": "تاریخ تحویل",
    "driver_name": "نام راننده/پیک",
    "quantity": "تعداد/مقدار",
    "unit": "واحد",
    "letter_details": "جزئیات نامه",
    "recipient": "گیرنده",
    "subject": "موضوع",
    "body": "متن نامه",
    "sender_name": "نام فرستنده",
    "sender_title": "سمت فرستنده",
    "page": "صفحه",
    "of": "از",
    "signature": "مهر و امضا",
    "date_received": "تاریخ دریافت",
  },
  de: {
    "invoices": "Dokumente",
    "manage_invoices": "Verwalten Sie Ihre DEJ TV Dokumente",
    "export_csv": "CSV Exportieren",
    "new_invoice": "Neues Dokument",
    "recent_invoices": "Aktuelle Dokumente",
    "recent_invoices_desc": "Eine Liste Ihrer lokal gespeicherten aktuellen Dokumente.",
    "no_invoices": "Keine Dokumente gefunden. Erstellen Sie eines, um zu beginnen.",
    "date": "Datum",
    "name": "Titel/Name",
    "total": "Gesamt",
    "actions": "Aktionen",
    "view": "Ansehen",
    "delete_confirm": "Sind Sie sicher, dass Sie dieses Dokument löschen möchten?",
    "back_to_dashboard": "Zurück zum Dashboard",
    "ai_assistant": "KI-Assistent",
    "ai_desc": "Beschreiben Sie Ihre Arbeit in natürlicher Sprache und lassen Sie die KI die Elemente ausfüllen.",
    "ai_placeholder": "z.B. Ich habe 2 Videos für 100$ bearbeitet und einen Bericht für 50$ geschrieben...",
    "thinking": "Denke nach...",
    "extract_items": "Elemente extrahieren",
    "invoice_details": "Rechnungsdetails",
    "to": "An",
    "personnel_name": "Name (Personal)",
    "items": "Elemente",
    "add_row": "Zeile hinzufügen",
    "description": "Beschreibung",
    "wallet_tether": "Tether-Wallet (USDT TRC20)",
    "save_invoice": "Dokument speichern",
    "alert_name": "Bitte geben Sie einen Namen oder Titel ein.",
    "alert_items": "Bitte fügen Sie mindestens ein gültiges Element hinzu.",
    "alert_ai": "Fehler beim Verarbeiten der Eingabe. Bitte versuchen Sie es erneut.",
    "print_save": "Drucken / PDF speichern",
    "invoice": "RECHNUNG",
    "bill_to": "Rechnung an:",
    "no": "Nr",
    "type": "Typ",
    "payment_receipt": "Zahlungsbeleg",
    "goods_receipt": "Warenempfangsschein",
    "letter": "Offizieller Briefkopf",
    "select_doc_type": "Dokumenttyp auswählen",
    "payment_details": "Zahlungsdetails",
    "payer": "Zahler",
    "payee": "Empfänger",
    "amount": "Betrag",
    "amount_in_words": "Betrag in Worten",
    "payment_for": "Zahlung für",
    "payment_method": "Zahlungsmethode",
    "reference_no": "Referenznummer",
    "goods_details": "Warendetails",
    "sender": "Absender",
    "receiver": "Empfänger",
    "delivery_date": "Lieferdatum",
    "driver_name": "Fahrername",
    "quantity": "Menge",
    "unit": "Einheit",
    "letter_details": "Briefdetails",
    "recipient": "Empfänger",
    "subject": "Betreff",
    "body": "Text",
    "sender_name": "Absendername",
    "sender_title": "Absendertitel",
    "page": "Seite",
    "of": "von",
    "signature": "Unterschrift",
    "date_received": "Empfangsdatum",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("app_lang") as Language;
    if (saved && ["en", "fa", "de"].includes(saved)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLang(saved);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  const t = (key: string) => {
    return translations[lang][key as keyof typeof translations["en"]] || key;
  };

  const dir = lang === "fa" ? "rtl" : "ltr";

  // Provide default context during SSR to avoid useLanguage throwing
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ lang: "en", setLang: handleSetLang, t: (k) => translations["en"][k as keyof typeof translations["en"]] || k, dir: "ltr" }}>
        <div style={{ visibility: "hidden" }}>{children}</div>
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t, dir }}>
      <div dir={dir} className={dir === "rtl" ? "font-sans" : ""}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
