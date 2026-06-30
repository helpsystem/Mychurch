"use client";

import { useState } from "react";
import Toolbar from "@/components/Toolbar";
import LetterDoc from "@/components/LetterDoc";
import InvoiceDoc from "@/components/InvoiceDoc";
import type { InvoiceData, LetterData, Locale } from "@/lib/types";

const initialLetter: LetterData = {
  number: "۱۴۰۳/۱۰۲",
  date: "۱۴۰۳/۰۴/۰۸",
  reference: "",
  attachment: "",
  recipient: "جناب آقای دکتر احمدی\nمدیرعامل محترم شرکت آلفا",
  subject: "درخواست همکاری در پروژه‌ی فناوری اطلاعات",
  body:
    "احتراماً، با عنایت به سوابق ارزشمند آن مجموعه و در راستای توسعه‌ی همکاری‌های دوجانبه، بدین‌وسیله آمادگی این شرکت جهت مشارکت در پروژه‌ی یادشده اعلام می‌گردد.\n\nخواهشمند است دستور فرمایید نسبت به تعیین جلسه‌ای جهت بررسی جزئیات اقدام لازم صورت پذیرد.\n\nپیشاپیش از همکاری شما سپاسگزاریم.",
  signerName: "مهندس رضا کریمی",
  signerTitle: "مدیرعامل",
};

const initialInvoice: InvoiceData = {
  number: "۱۴۰۳-۰۰۵۷",
  date: "۱۴۰۳/۰۴/۰۸",
  customerName: "شرکت آلفا تجارت",
  customerAddress: "تهران، خیابان آزادی، پلاک ۴۵",
  customerPhone: "۰۲۱-۸۸۸۸۷۷۷۷",
  customerEconomicCode: "۹۹۹۹-۸۸۸۸-۷۷۷۷",
  items: [
    { description: "خدمات طراحی وب‌سایت", qty: 1, unitPrice: 45000000, discount: 0 },
    { description: "پشتیبانی ماهانه (۶ ماه)", qty: 6, unitPrice: 3000000, discount: 1000000 },
    { description: "آموزش پرسنل", qty: 2, unitPrice: 2500000, discount: 0 },
  ],
  taxRate: 10,
  notes: "مهلت پرداخت: ۱۰ روز پس از صدور فاکتور.",
};

export default function Page() {
  const [docType, setDocType] = useState<"letter" | "invoice">("letter");
  const [locale, setLocale] = useState<Locale>("fa");
  const [letter, setLetter] = useState<LetterData>(initialLetter);
  const [invoice, setInvoice] = useState<InvoiceData>(initialInvoice);

  const fa = locale === "fa";

  function getEmailPayload() {
    if (docType === "letter") {
      return { subject: `${fa ? "نامه شماره " : "Letter No. "}${letter.number}`, filename: `letter-${letter.number}` };
    }
    return { subject: `${fa ? "فاکتور شماره " : "Invoice No. "}${invoice.number}`, filename: `invoice-${invoice.number}` };
  }

  // ── ویرایش آیتم‌های فاکتور ──
  function updateItem(i: number, key: keyof InvoiceData["items"][number], val: string) {
    setInvoice((s) => {
      const items = [...s.items];
      const num = key === "description" ? val : Number(val) || 0;
      items[i] = { ...items[i], [key]: num } as any;
      return { ...s, items };
    });
  }
  function addItem() {
    setInvoice((s) => ({ ...s, items: [...s.items, { description: "", qty: 1, unitPrice: 0, discount: 0 }] }));
  }
  function removeItem(i: number) {
    setInvoice((s) => ({ ...s, items: s.items.filter((_, idx) => idx !== i) }));
  }

  return (
    <>
      <Toolbar
        docType={docType}
        onDocTypeChange={setDocType}
        locale={locale}
        onLocaleChange={setLocale}
        getEmailPayload={getEmailPayload}
      />

      <div className="layout">
        {/* ───── پنل ویرایش ───── */}
        <aside className="panel no-print">
          {docType === "letter" ? (
            <>
              <h2>{fa ? "ویرایش نامه" : "Edit letter"}</h2>
              <div className="field-row">
                <div className="field">
                  <label>{fa ? "شماره" : "Number"}</label>
                  <input value={letter.number} onChange={(e) => setLetter({ ...letter, number: e.target.value })} />
                </div>
                <div className="field">
                  <label>{fa ? "تاریخ" : "Date"}</label>
                  <input value={letter.date} onChange={(e) => setLetter({ ...letter, date: e.target.value })} />
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>{fa ? "عطف" : "Reference"}</label>
                  <input value={letter.reference} onChange={(e) => setLetter({ ...letter, reference: e.target.value })} />
                </div>
                <div className="field">
                  <label>{fa ? "پیوست" : "Attachment"}</label>
                  <input value={letter.attachment} onChange={(e) => setLetter({ ...letter, attachment: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label>{fa ? "گیرنده" : "Recipient"}</label>
                <textarea style={{ minHeight: 60 }} value={letter.recipient} onChange={(e) => setLetter({ ...letter, recipient: e.target.value })} />
              </div>
              <div className="field">
                <label>{fa ? "موضوع" : "Subject"}</label>
                <input value={letter.subject} onChange={(e) => setLetter({ ...letter, subject: e.target.value })} />
              </div>
              <div className="field">
                <label>{fa ? "متن نامه" : "Body"}</label>
                <textarea style={{ minHeight: 160 }} value={letter.body} onChange={(e) => setLetter({ ...letter, body: e.target.value })} />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>{fa ? "نام امضاکننده" : "Signer name"}</label>
                  <input value={letter.signerName} onChange={(e) => setLetter({ ...letter, signerName: e.target.value })} />
                </div>
                <div className="field">
                  <label>{fa ? "سمت" : "Title"}</label>
                  <input value={letter.signerTitle} onChange={(e) => setLetter({ ...letter, signerTitle: e.target.value })} />
                </div>
              </div>
            </>
          ) : (
            <>
              <h2>{fa ? "ویرایش فاکتور" : "Edit invoice"}</h2>
              <div className="field-row">
                <div className="field">
                  <label>{fa ? "شماره فاکتور" : "Invoice No."}</label>
                  <input value={invoice.number} onChange={(e) => setInvoice({ ...invoice, number: e.target.value })} />
                </div>
                <div className="field">
                  <label>{fa ? "تاریخ" : "Date"}</label>
                  <input value={invoice.date} onChange={(e) => setInvoice({ ...invoice, date: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label>{fa ? "نام خریدار" : "Customer name"}</label>
                <input value={invoice.customerName} onChange={(e) => setInvoice({ ...invoice, customerName: e.target.value })} />
              </div>
              <div className="field">
                <label>{fa ? "آدرس خریدار" : "Customer address"}</label>
                <input value={invoice.customerAddress} onChange={(e) => setInvoice({ ...invoice, customerAddress: e.target.value })} />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>{fa ? "تلفن" : "Phone"}</label>
                  <input value={invoice.customerPhone} onChange={(e) => setInvoice({ ...invoice, customerPhone: e.target.value })} />
                </div>
                <div className="field">
                  <label>{fa ? "کد اقتصادی" : "Eco. code"}</label>
                  <input value={invoice.customerEconomicCode} onChange={(e) => setInvoice({ ...invoice, customerEconomicCode: e.target.value })} />
                </div>
              </div>

              <h2 style={{ marginTop: 18 }}>{fa ? "ردیف‌ها" : "Items"}</h2>
              {invoice.items.map((it, i) => (
                <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10, marginBottom: 10 }}>
                  <div className="field" style={{ marginBottom: 8 }}>
                    <label>{fa ? `شرح ردیف ${i + 1}` : `Item ${i + 1} description`}</label>
                    <input value={it.description} onChange={(e) => updateItem(i, "description", e.target.value)} />
                  </div>
                  <div className="field-row">
                    <div className="field" style={{ marginBottom: 6 }}>
                      <label>{fa ? "تعداد" : "Qty"}</label>
                      <input type="number" value={it.qty} onChange={(e) => updateItem(i, "qty", e.target.value)} />
                    </div>
                    <div className="field" style={{ marginBottom: 6 }}>
                      <label>{fa ? "قیمت واحد" : "Unit price"}</label>
                      <input type="number" value={it.unitPrice} onChange={(e) => updateItem(i, "unitPrice", e.target.value)} />
                    </div>
                  </div>
                  <div className="field-row">
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label>{fa ? "تخفیف" : "Discount"}</label>
                      <input type="number" value={it.discount} onChange={(e) => updateItem(i, "discount", e.target.value)} />
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                      <button className="btn" style={{ width: "100%" }} onClick={() => removeItem(i)}>🗑 {fa ? "حذف" : "Remove"}</button>
                    </div>
                  </div>
                </div>
              ))}
              <button className="btn" onClick={addItem}>＋ {fa ? "افزودن ردیف" : "Add item"}</button>

              <div className="field" style={{ marginTop: 14 }}>
                <label>{fa ? "درصد مالیات (٪)" : "Tax rate (%)"}</label>
                <input type="number" value={invoice.taxRate} onChange={(e) => setInvoice({ ...invoice, taxRate: Number(e.target.value) || 0 })} />
              </div>
              <div className="field">
                <label>{fa ? "توضیحات" : "Notes"}</label>
                <textarea style={{ minHeight: 60 }} value={invoice.notes} onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })} />
              </div>
            </>
          )}
        </aside>

        {/* ───── پیش‌نمایش سند ───── */}
        <section className="preview-wrap">
          {docType === "letter" ? (
            <LetterDoc data={letter} locale={locale} />
          ) : (
            <InvoiceDoc data={invoice} locale={locale} />
          )}
        </section>
      </div>
    </>
  );
}
