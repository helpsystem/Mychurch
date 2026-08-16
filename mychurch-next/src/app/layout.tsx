import "@/lib/react-polyfill";
import type { Metadata, Viewport } from "next";
import React, { Suspense } from "react";
import "./globals.css";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { Inter, Vazirmatn, Lalezar, Cinzel, Cormorant_Garamond } from "next/font/google";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const vazirmatn = Vazirmatn({ subsets: ['arabic', 'latin'], variable: '--font-vazirmatn', display: 'swap' });
const lalezar = Lalezar({ weight: ['400'], subsets: ['arabic'], variable: '--font-lalezar', display: 'swap' });
const cinzel = Cinzel({ subsets: ['latin'], weight: ['700'], variable: '--font-cinzel', display: 'swap' });
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-cormorant', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.iranianchurchdc.com"),
  title: {
    default: "کلیسای مسیحی ایرانیان واشنگتن دی‌سی | Iranian Christian Church of D.C.",
    template: "%s | کلیسای مسیحی ایرانیان واشنگتن",
  },
  description: "وب‌سایت رسمی کلیسای مسیحی ایرانیان واشنگتن دی‌سی — پخش زنده جلسات عبادتی یکشنبه‌ها، سرودهای پرستشی، کتاب مقدس به زبان فارسی و انگلیسی، مواعظ و دعا.",
  keywords: ["کلیسای ایرانیان واشنگتن", "کلیسای مسیحی ایرانیان", "کتاب مقدس فارسی", "سرود پرستشی", "پخش زنده کلیسا", "Iranian Christian Church DC", "Persian Church Washington"],
  icons: {
    icon: [
      { url: "/logo-transparent.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "کلیسای مسیحی ایرانیان واشنگتن دی‌سی | Iranian Christian Church of D.C.",
    description: "مرجع رسمی خدمات روحانی، پخش زنده یکشنبه‌ها، کتاب مقدس فارسی و سرودهای پرستشی.",
    url: "https://www.iranianchurchdc.com",
    siteName: "Iranian Christian Church of Washington D.C.",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "لوگوی کلیسای مسیحی ایرانیان واشنگتن",
      },
    ],
    locale: "fa_IR",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "کلیسای ایرانیان واشنگتن",
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
import { GlobalPopupWrapper } from "@/components/widgets/GlobalPopupWrapper";
import { VersePopupWrapper } from "@/components/widgets/VersePopupWrapper";
import GlobalErrorReporter from "@/components/error/GlobalErrorReporter";
import { AutoLogout } from "@/components/layout/AutoLogout";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { getRealUserRole, getUserRole } from "@/utils/rbac";
import { CartProvider } from "@/providers/CartProvider";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const realRole = await getRealUserRole();
  const currentRole = await getUserRole();
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className={`dark ${inter.variable} ${vazirmatn.variable} ${lalezar.variable} ${cinzel.variable} ${cormorant.variable}`}>
      <head>
        {/* We use next/font/google for primary fonts, but keep runtime for secondary fonts just in case */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Noto+Nastaliq+Urdu:wght@400;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&family=Merriweather:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap" rel="stylesheet" />
        
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                document.documentElement.classList.add("dark");
              } catch {
                document.documentElement.classList.add("dark");
              }
            })();`,
          }}
        />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --font-roboto: 'Roboto', sans-serif;
            --font-naskh: 'Noto Naskh Arabic', serif;
            --font-homa: 'B Homa', 'BHoma', 'Homa', var(--font-vazirmatn), sans-serif;
            --font-sans: var(--font-vazirmatn), sans-serif;
            --font-nastaliq: 'Noto Nastaliq Urdu', serif;
            --font-playfair: 'Playfair Display', serif;
            --font-merriweather: 'Merriweather', serif;
          }
        `}} />
      </head>
      <body className="antialiased bg-background text-foreground">
        <LanguageProvider>
          <CartProvider>
            <GlobalErrorReporter />
            {realRole && currentRole && currentRole !== realRole && (
              <ImpersonationBanner currentRole={currentRole} realRole={realRole} />
            )}
            <AutoLogout timeoutMinutes={1440} />
            {children}
            <Suspense fallback={null}>
              <MobileNavigation />
            </Suspense>
            <Suspense fallback={null}>
              <GlobalPopupWrapper />
            </Suspense>
            <Suspense fallback={null}>
              <VersePopupWrapper />
            </Suspense>
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
