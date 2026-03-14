import type { Metadata, Viewport } from "next";
import { Inter, Vazirmatn } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/providers/LanguageProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "MyChurch | Broadcast Console & Platform",
  description: "The Iranian Christian Church of Washington D.C. - Advanced presentation and media management platform",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MyChurch",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { MobileNavigation } from "@/components/layout/MobileNavigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${vazirmatn.variable} antialiased bg-background text-foreground font-vazirmatn`}
      >
        <LanguageProvider>
          {children}
          <MobileNavigation />
        </LanguageProvider>
      </body>
    </html>
  );
}
