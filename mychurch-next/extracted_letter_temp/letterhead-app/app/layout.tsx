import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "صدور اسناد اداری — نامه و فاکتور",
  description: "سیستم تولید نامه اداری و فاکتور روی سربرگ با چاپ، PDF و ارسال ایمیل",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
