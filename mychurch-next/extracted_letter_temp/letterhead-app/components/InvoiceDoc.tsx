"use client";

import Letterhead, { toFa } from "./Letterhead";
import { company } from "@/lib/company";
import type { InvoiceData, Locale } from "@/lib/types";

export function computeInvoice(data: InvoiceData) {
  const rows = data.items.map((it) => {
    const gross = it.qty * it.unitPrice;
    const net = gross - (it.discount || 0);
    return { ...it, gross, net };
  });
  const subtotal = rows.reduce((s, r) => s + r.gross, 0);
  const discountTotal = rows.reduce((s, r) => s + (r.discount || 0), 0);
  const taxable = subtotal - discountTotal;
  const tax = Math.round((taxable * (data.taxRate || 0)) / 100);
  const grand = taxable + tax;
  return { rows, subtotal, discountTotal, taxable, tax, grand };
}

export default function InvoiceDoc({
  data,
  locale = "fa",
}: {
  data: InvoiceData;
  locale?: Locale;
}) {
  const fa = locale === "fa";
  const { rows, subtotal, discountTotal, tax, grand } = computeInvoice(data);

  const money = (n: number) => {
    const s = n.toLocaleString("en-US");
    return fa ? toFa(s) : s;
  };
  const num = (v: string | number) => (fa ? toFa(v) : String(v));
  const unit = fa ? "ریال" : "IRR";

  return (
    <Letterhead locale={locale} pageNo={1} pageCount={1} showLegal>
      <div className="inv-title">{fa ? "فاکتور فروش" : "SALES INVOICE"}</div>

      <div className="inv-top">
        {/* اطلاعات فاکتور */}
        <div className="inv-box">
          <h3>{fa ? "مشخصات فاکتور" : "Invoice details"}</h3>
          <div>{fa ? "شماره فاکتور: " : "Invoice No.: "}{num(data.number)}</div>
          <div>{fa ? "تاریخ: " : "Date: "}{num(data.date)}</div>
        </div>
        {/* اطلاعات مشتری */}
        <div className="inv-box">
          <h3>{fa ? "خریدار" : "Buyer"}</h3>
          <div>{data.customerName}</div>
          {data.customerAddress && <div>{data.customerAddress}</div>}
          {data.customerPhone && <div>{fa ? "تلفن: " : "Tel: "}{num(data.customerPhone)}</div>}
          {data.customerEconomicCode && <div>{fa ? "کد اقتصادی: " : "Eco. code: "}{num(data.customerEconomicCode)}</div>}
        </div>
      </div>

      <table className="inv">
        <thead>
          <tr>
            <th style={{ width: "5%" }}>{fa ? "ردیف" : "#"}</th>
            <th>{fa ? "شرح کالا / خدمات" : "Description"}</th>
            <th style={{ width: "10%" }}>{fa ? "تعداد" : "Qty"}</th>
            <th style={{ width: "18%" }}>{fa ? "قیمت واحد" : "Unit price"}</th>
            <th style={{ width: "13%" }}>{fa ? "تخفیف" : "Discount"}</th>
            <th style={{ width: "18%" }}>{fa ? "مبلغ کل" : "Amount"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="num">{num(i + 1)}</td>
              <td>{r.description}</td>
              <td className="num">{num(r.qty)}</td>
              <td className="num">{money(r.unitPrice)}</td>
              <td className="num">{money(r.discount || 0)}</td>
              <td className="num">{money(r.net)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: "center", color: "#9ca3af" }}>{fa ? "ردیفی ثبت نشده است" : "No items"}</td></tr>
          )}
        </tbody>
      </table>

      <div className="inv-totals">
        <div className="row"><span>{fa ? "جمع کل" : "Subtotal"}</span><span>{money(subtotal)} {unit}</span></div>
        <div className="row"><span>{fa ? "مجموع تخفیف" : "Total discount"}</span><span>{money(discountTotal)} {unit}</span></div>
        <div className="row"><span>{fa ? `مالیات (${num(data.taxRate)}٪)` : `Tax (${data.taxRate}%)`}</span><span>{money(tax)} {unit}</span></div>
        <div className="row grand"><span>{fa ? "مبلغ قابل پرداخت" : "Grand total"}</span><span>{money(grand)} {unit}</span></div>
      </div>

      {data.notes && <div className="inv-notes">{data.notes}</div>}
      <div className="inv-notes">
        {fa
          ? `${company.nameFa} — شناسه ملی ${company.nationalId} — شماره ثبت ${company.registrationNo}`
          : `${company.nameEn} — National ID ${company.nationalId} — Reg. No. ${company.registrationNo}`}
      </div>
    </Letterhead>
  );
}
