// انواع داده برای اسناد / Document data types

export type Locale = "fa" | "en";

export interface LetterData {
  date: string;          // تاریخ
  number: string;        // شماره نامه
  reference: string;     // عطف
  attachment: string;    // پیوست
  recipient: string;     // گیرنده
  subject: string;       // موضوع
  body: string;          // متن نامه
  signerName: string;    // نام امضاکننده
  signerTitle: string;   // سمت امضاکننده
}

export interface InvoiceItem {
  description: string;   // شرح کالا/خدمات
  qty: number;           // تعداد
  unitPrice: number;     // قیمت واحد
  discount: number;      // تخفیف (مبلغ)
}

export interface InvoiceData {
  number: string;        // شماره فاکتور
  date: string;          // تاریخ
  customerName: string;  // نام مشتری
  customerAddress: string;
  customerPhone: string;
  customerEconomicCode: string;
  items: InvoiceItem[];
  taxRate: number;       // درصد مالیات بر ارزش افزوده
  notes: string;         // توضیحات
}
