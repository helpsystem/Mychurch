"use client";

import Letterhead, { toFa } from "./Letterhead";
import type { LetterData, Locale } from "@/lib/types";

export default function LetterDoc({
  data,
  locale = "fa",
}: {
  data: LetterData;
  locale?: Locale;
}) {
  const fa = locale === "fa";
  const num = (v: string) => (fa ? toFa(v) : v);

  return (
    <Letterhead locale={locale} pageNo={1} pageCount={1}>
      {/* فراداده‌ی نامه: تاریخ / شماره / پیوست */}
      <div className="letter-meta">
        <div className="block">
          <div><span className="lbl">{fa ? "شماره:" : "No.:"}</span> {num(data.number)}</div>
          <div><span className="lbl">{fa ? "تاریخ:" : "Date:"}</span> {num(data.date)}</div>
        </div>
        <div className="block">
          <div><span className="lbl">{fa ? "پیوست:" : "Attachment:"}</span> {data.attachment || (fa ? "ندارد" : "None")}</div>
          <div><span className="lbl">{fa ? "عطف:" : "Ref.:"}</span> {data.reference || "—"}</div>
        </div>
      </div>

      {/* گیرنده */}
      {data.recipient && <div className="letter-recipient">{data.recipient}</div>}

      {/* موضوع */}
      {data.subject && (
        <div className="letter-subject">
          {fa ? "موضوع: " : "Subject: "}
          {data.subject}
        </div>
      )}

      {/* متن نامه */}
      <div className="letter-text">{data.body}</div>

      {/* امضا */}
      <div className={`letter-sign ${fa ? "rtl" : ""}`}>
        <div className="name">{data.signerName}</div>
        <div className="title">{data.signerTitle}</div>
      </div>
    </Letterhead>
  );
}
