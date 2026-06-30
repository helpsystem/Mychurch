"use client";

import { company } from "@/lib/company";
import type { Locale } from "@/lib/types";
import { ReactNode } from "react";

/**
 * قالب سربرگ A4 — شامل هدر، فوتر و شماره صفحه.
 * محتوای نامه یا فاکتور به‌صورت children داخل بدنه قرار می‌گیرد.
 */
export default function Letterhead({
  locale = "fa",
  children,
  pageNo = 1,
  pageCount = 1,
  showLegal = false,
}: {
  locale?: Locale;
  children: ReactNode;
  pageNo?: number;
  pageCount?: number;
  showLegal?: boolean;
}) {
  const fa = locale === "fa";
  const dir = fa ? "rtl" : "ltr";

  return (
    <div className="page" dir={dir} id="document-page">
      {/* ───── هدر ───── */}
      <header className="lh-header">
        <div className="logo">
          {company.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logo} alt="logo" />
          ) : (
            <div className="logo-text">{(fa ? company.nameFa : company.nameEn).charAt(0)}</div>
          )}
        </div>
        <div className="info">
          <div className="name">{fa ? company.nameFa : company.nameEn}</div>
          <div className="name-en">{fa ? company.nameEn : company.nameFa}</div>
          {company.sloganFa && (
            <div className="slogan">{fa ? company.sloganFa : company.sloganEn}</div>
          )}
        </div>
        <div className="contact">
          <div>{fa ? company.addressFa : company.addressEn}</div>
          <div>{fa ? "تلفن:" : "Tel:"} {company.phone}</div>
          <div>{company.email} · {company.website}</div>
        </div>
      </header>

      {/* ───── بدنه ───── */}
      <main className="lh-body">{children}</main>

      {/* ───── فوتر ───── */}
      <footer className="lh-footer">
        <div>
          {showLegal ? (
            <>
              {fa ? "کد اقتصادی:" : "Economic code:"} {company.economicCode} &nbsp;·&nbsp;
              {fa ? "شناسه ملی:" : "National ID:"} {company.nationalId}
            </>
          ) : (
            <>{fa ? company.addressFa : company.addressEn}</>
          )}
        </div>
        <div className="pageno">
          {fa
            ? `صفحه ${toFa(pageNo)} از ${toFa(pageCount)}`
            : `Page ${pageNo} of ${pageCount}`}
        </div>
      </footer>
    </div>
  );
}

// تبدیل عدد به ارقام فارسی
export function toFa(n: number | string): string {
  const d = "۰۱۲۳۴۵۶۷۸۹";
  return String(n).replace(/\d/g, (x) => d[+x]);
}
