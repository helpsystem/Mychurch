import "@/lib/react-polyfill";
import type { Metadata, Viewport } from "next";
import React, { Suspense } from "react";
import "./globals.css";
import { LanguageProvider } from "@/providers/LanguageProvider";
import {
  Inter,
  Vazirmatn,
  Lalezar,
  Cinzel,
  Cormorant_Garamond,
  Roboto,
  Playfair_Display,
  Merriweather,
} from "next/font/google";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const vazirmatn = Vazirmatn({ subsets: ['arabic', 'latin'], variable: '--font-vazirmatn', display: 'swap' });
const lalezar = Lalezar({ weight: ['400'], subsets: ['arabic'], variable: '--font-lalezar', display: 'swap' });
const cinzel = Cinzel({ subsets: ['latin'], weight: ['700'], variable: '--font-cinzel', display: 'swap' });
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-cormorant', display: 'swap' });
const roboto = Roboto({ subsets: ['latin'], weight: ['300', '400', '500', '700'], variable: '--font-roboto', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-playfair', display: 'swap' });
const merriweather = Merriweather({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-merriweather', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.iranianchurchdc.com"),
  title: {
    default: "Iranian Christian Church of D.C. | کلیسای مسیحی ایرانیان واشنگتن",
    template: "%s | Iranian Christian Church DC",
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
    title: "Iranian Christian Church of D.C. | کلیسای مسیحی ایرانیان واشنگتن دی‌سی",
    description: "مرجع رسمی خدمات روحانی، پخش زنده یکشنبه‌ها، کتاب مقدس فارسی و سرودهای پرستشی.",
    url: "https://www.iranianchurchdc.com",
    siteName: "Iranian Christian Church of Washington D.C.",
    images: [
      {
        // Create public/og-image.jpg at 1200×630 for proper social sharing
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "کلیسای مسیحی ایرانیان واشنگتن دی‌سی",
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
  // maximumScale intentionally omitted — allows pinch-to-zoom (WCAG 2.1 SC 1.4.4)
};

import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { GlobalPopupWrapper } from "@/components/widgets/GlobalPopupWrapper";
import { VersePopupWrapper } from "@/components/widgets/VersePopupWrapper";
import GlobalErrorReporter from "@/components/error/GlobalErrorReporter";
import { AutoLogout } from "@/components/layout/AutoLogout";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { HtmlLangUpdater } from "@/components/layout/HtmlLangUpdater";
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
    <html lang="fa" dir="rtl" suppressHydrationWarning className={`dark ${inter.variable} ${vazirmatn.variable} ${lalezar.variable} ${cinzel.variable} ${cormorant.variable} ${roboto.variable} ${playfair.variable} ${merriweather.variable}`}>
      <head>
        {/* Preconnect to Google Fonts for Noto scripts (Arabic/Nastaliq not available via next/font) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Only Noto fonts still use external link — all others moved to next/font above */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap"
        />

        {/* Hreflang for bilingual site */}
        <link rel="alternate" hrefLang="fa" href="https://www.iranianchurchdc.com/?lang=fa" />
        <link rel="alternate" hrefLang="en" href="https://www.iranianchurchdc.com/?lang=en" />
        <link rel="alternate" hrefLang="x-default" href="https://www.iranianchurchdc.com" />

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
            --font-naskh: 'Noto Naskh Arabic', serif;
            --font-homa: 'B Homa', 'BHoma', 'Homa', var(--font-vazirmatn), sans-serif;
            --font-sans: var(--font-vazirmatn), sans-serif;
            --font-nastaliq: 'Noto Nastaliq Urdu', serif;
          }
        `}} />

        {/* Schema.org: Church Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Church",
              "name": "Iranian Christian Church of Washington D.C.",
              "alternateName": "کلیسای مسیحی ایرانیان واشنگتن",
              "url": "https://www.iranianchurchdc.com",
              "logo": "https://www.iranianchurchdc.com/logo.png",
              "image": "https://www.iranianchurchdc.com/logo.png",
              "description": "وب‌سایت رسمی کلیسای مسیحی ایرانیان واشنگتن دی‌سی",
              "foundingDate": "1990",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "10613 Georgia Ave",
                "addressLocality": "Silver Spring",
                "addressRegion": "MD",
                "postalCode": "20902",
                "addressCountry": "US"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 39.0181,
                "longitude": -77.0233
              },
              "telephone": "+13016497086",
              "email": "info@iranianchristianchurchdc.com",
              "sameAs": [
                "https://www.youtube.com/@IranianChristianChurchDC",
                "https://www.instagram.com/iranianchurchdc"
              ],
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": "Sunday",
                "opens": "13:00",
                "closes": "15:00"
              }
            }),
          }}
        />

        {/* Schema.org: Weekly Sunday Service Event */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Event",
              "name": "Iranian Church DC Sunday Service — جلسه عبادتی یکشنبه",
              "description": "پخش زنده جلسه عبادتی کلیسای مسیحی ایرانیان واشنگتن دی‌سی — یکشنبه‌ها ساعت ۱:۰۰ بعد از ظهر",
              "eventStatus": "https://schema.org/EventScheduled",
              "eventAttendanceMode": "https://schema.org/MixedEventAttendanceMode",
              "location": [
                {
                  "@type": "Place",
                  "name": "Iranian Christian Church of Washington D.C.",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "10613 Georgia Ave",
                    "addressLocality": "Silver Spring",
                    "addressRegion": "MD",
                    "postalCode": "20902",
                    "addressCountry": "US"
                  }
                },
                {
                  "@type": "VirtualLocation",
                  "url": "https://www.iranianchurchdc.com/broadcast/view"
                }
              ],
              "organizer": {
                "@type": "Organization",
                "name": "Iranian Christian Church of Washington D.C.",
                "url": "https://www.iranianchurchdc.com"
              }
            }),
          }}
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        <LanguageProvider>
          <HtmlLangUpdater />
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
