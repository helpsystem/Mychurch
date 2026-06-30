"use client";

import { useState } from "react";

/**
 * نوار ابزار اقدامات: چاپ، PDF و ارسال ایمیل.
 *
 * - چاپ:  window.print() — با @media print خود مرورگر PDF هم می‌سازد.
 * - PDF :  همان دیالوگ چاپ با راهنمای «Save as PDF» (بدون وابستگی سنگین).
 * - ایمیل: مودال که فایل را به API می‌فرستد تا با nodemailer ارسال شود.
 */
export default function Toolbar({
  docType,
  onDocTypeChange,
  locale,
  onLocaleChange,
  getEmailPayload,
}: {
  docType: "letter" | "invoice";
  onDocTypeChange: (t: "letter" | "invoice") => void;
  locale: "fa" | "en";
  onLocaleChange: (l: "fa" | "en") => void;
  getEmailPayload: () => { subject: string; filename: string };
}) {
  const [mailOpen, setMailOpen] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const fa = locale === "fa";

  function handlePrint() {
    window.print();
  }

  function openMail() {
    const p = getEmailPayload();
    setSubject(p.subject);
    setMessage(
      fa
        ? "با سلام،\nسند پیوست شده تقدیم می‌گردد.\nبا احترام."
        : "Hello,\nPlease find the attached document.\nBest regards."
    );
    setResult(null);
    setMailOpen(true);
  }

  async function sendMail() {
    setSending(true);
    setResult(null);
    try {
      // گرفتن HTML سند برای پیوست
      const node = document.getElementById("document-page");
      const docHtml = node ? node.outerHTML : "";
      const css = await fetch("/print-styles.css").then((r) => r.text()).catch(() => "");
      const p = getEmailPayload();

      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          message,
          filename: p.filename,
          html: `<!doctype html><html dir="${fa ? "rtl" : "ltr"}"><head><meta charset="utf-8"><style>${css}</style></head><body><div class="preview-wrap">${docHtml}</div></body></html>`,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setResult(fa ? "✓ ایمیل با موفقیت ارسال شد." : "✓ Email sent successfully.");
      } else {
        setResult((fa ? "خطا: " : "Error: ") + (json.error || res.statusText));
      }
    } catch (e: any) {
      setResult((fa ? "خطا: " : "Error: ") + (e?.message || "unknown"));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="toolbar no-print">
        <h1>{fa ? "صدور اسناد اداری" : "Document Studio"}</h1>

        <div className="tabs">
          <button className={`tab ${docType === "letter" ? "active" : ""}`} onClick={() => onDocTypeChange("letter")}>
            {fa ? "نامه اداری" : "Letter"}
          </button>
          <button className={`tab ${docType === "invoice" ? "active" : ""}`} onClick={() => onDocTypeChange("invoice")}>
            {fa ? "فاکتور" : "Invoice"}
          </button>
        </div>

        <div className="spacer" />

        <select
          className="btn"
          value={locale}
          onChange={(e) => onLocaleChange(e.target.value as "fa" | "en")}
          title={fa ? "زبان سند" : "Document language"}
        >
          <option value="fa">فارسی</option>
          <option value="en">English</option>
        </select>

        <button className="btn" onClick={handlePrint}>🖨️ {fa ? "چاپ" : "Print"}</button>
        <button className="btn" onClick={handlePrint} title={fa ? "در پنجره‌ی چاپ گزینه Save as PDF را انتخاب کنید" : "Choose 'Save as PDF' in print dialog"}>
          📄 {fa ? "ذخیره PDF" : "Save PDF"}
        </button>
        <button className="btn btn-primary" onClick={openMail}>✉️ {fa ? "ارسال ایمیل" : "Send email"}</button>
      </div>

      {/* مودال ایمیل */}
      {mailOpen && (
        <div className="modal-overlay no-print" onClick={() => setMailOpen(false)}>
          <div className="modal" dir={fa ? "rtl" : "ltr"} onClick={(e) => e.stopPropagation()}>
            <h2>{fa ? "ارسال سند با ایمیل" : "Send document by email"}</h2>
            <div className="field">
              <label>{fa ? "گیرنده (ایمیل)" : "Recipient (email)"}</label>
              <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="name@example.com" type="email" />
            </div>
            <div className="field">
              <label>{fa ? "موضوع" : "Subject"}</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="field">
              <label>{fa ? "متن پیام" : "Message"}</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>

            {result && <div className={`mail-result ${result.startsWith("✓") ? "ok" : "err"}`}>{result}</div>}

            <div className="modal-actions">
              <button className="btn" onClick={() => setMailOpen(false)}>{fa ? "بستن" : "Close"}</button>
              <button className="btn btn-primary" onClick={sendMail} disabled={sending || !to}>
                {sending ? (fa ? "در حال ارسال…" : "Sending…") : (fa ? "ارسال" : "Send")}
              </button>
            </div>
            <p className="hint">
              {fa
                ? "نکته: برای ارسال واقعی باید SMTP را در فایل .env.local تنظیم کنید (راهنما در README)."
                : "Note: configure SMTP in .env.local to actually send (see README)."}
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,.45);
          display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
        }
        .modal {
          background: #fff; border-radius: 14px; padding: 22px 24px; width: 460px; max-width: 100%;
          box-shadow: 0 12px 40px rgba(0,0,0,.25);
        }
        .modal h2 { margin: 0 0 16px; font-size: 17px; color: var(--brand); }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
        .hint { font-size: 11.5px; color: var(--muted); margin: 12px 0 0; line-height: 1.7; }
        .mail-result { padding: 9px 12px; border-radius: 8px; font-size: 13px; margin-top: 6px; }
        .mail-result.ok { background: #ecfdf5; color: #047857; }
        .mail-result.err { background: #fef2f2; color: #b91c1c; }
      `}</style>
    </>
  );
}
