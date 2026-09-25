import "@/lib/react-polyfill";
import type { Metadata, Viewport } from "next";
import React, { Suspense } from "react";
import "./globals.css";
import { LanguageProvider } from "@/providers/LanguageProvider";
import localFont from "next/font/local";

// Self-hosted (see src/fonts/) rather than next/font/google: fetching ~10 font
// families from Google at build time is what was making `next build` hang on
// "Retrying 1/3..." and eventually time out on the production server whenever
// its outbound access to Google's font CDN was slow or blocked. Local files
// make the build fully offline and deterministic. Vazirmatn is the one
// exception — it needs both its arabic and latin subsets, which next/font/local
// can't express as two unicode-range-scoped @font-face rules under one
// variable, so it's hand-declared in the <style> block below instead.
const inter = localFont({ src: "../fonts/inter-variable.woff2", weight: "100 900", variable: "--font-inter", display: "swap" });
const lalezar = localFont({ src: "../fonts/lalezar-400.woff2", weight: "400", variable: "--font-lalezar", display: "swap" });
const cinzel = localFont({ src: "../fonts/cinzel-700.woff2", weight: "700", variable: "--font-cinzel", display: "swap" });
const cormorant = localFont({
  src: [
    { path: "../fonts/cormorant-garamond-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/cormorant-garamond-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/cormorant-garamond-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-cormorant",
  display: "swap",
});
const roboto = localFont({
  src: [
    { path: "../fonts/roboto-300.woff2", weight: "300", style: "normal" },
    { path: "../fonts/roboto-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/roboto-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/roboto-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-roboto",
  display: "swap",
});
const playfair = localFont({
  src: [
    { path: "../fonts/playfair-display-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/playfair-display-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/playfair-display-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-playfair",
  display: "swap",
});
const merriweather = localFont({
  src: [
    { path: "../fonts/merriweather-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/merriweather-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-merriweather",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.iranianchurchdc.com"),
  title: {
    default: "Iranian Presbyterian Church | کلیسای انجیلی ایرانیان واشنگتن دی‌سی",
    template: "%s | Iranian Presbyterian Church",
  },
  description: "وب‌سایت رسمی کلیسای انجیلی ایرانیان واشنگتن دی‌سی — پخش زنده جلسات عبادتی یکشنبه‌ها، سرودهای پرستشی، کتاب مقدس به زبان فارسی و انگلیسی، مواعظ و دعا.",
  keywords: ["کلیسای انجیلی ایرانیان واشنگتن دی‌سی", "کلیسای انجیلی ایرانیان", "کتاب مقدس فارسی", "سرود پرستشی", "پخش زنده کلیسا", "Iranian Presbyterian Church", "Persian Presbyterian Church Washington"],
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
    title: "Iranian Presbyterian Church of D.C. | کلیسای انجیلی ایرانیان واشنگتن دی‌سی",
    description: "مرجع رسمی خدمات روحانی، پخش زنده یکشنبه‌ها، کتاب مقدس فارسی و سرودهای پرستشی.",
    url: "https://www.iranianchurchdc.com",
    siteName: "Iranian Presbyterian Church of Washington D.C.",
    images: [
      {
        // Create public/og-image.jpg at 1200×630 for proper social sharing
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "کلیسای انجیلی ایرانیان واشنگتن دی‌سی",
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
    <html lang="fa" dir="rtl" suppressHydrationWarning className={`dark ${inter.variable} ${lalezar.variable} ${cinzel.variable} ${cormorant.variable} ${roboto.variable} ${playfair.variable} ${merriweather.variable}`}>
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
          @font-face {
            font-family: 'Vazirmatn Local';
            font-style: normal;
            font-weight: 100 900;
            font-display: swap;
            src: url('/fonts/vazirmatn-arabic-variable.woff2') format('woff2-variations');
            unicode-range: U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC,U+102E0-102FB,U+10E60-10E7E,U+10EC2-10EC4,U+10EFC-10EFF,U+1EE00-1EE03,U+1EE05-1EE1F,U+1EE21-1EE22,U+1EE24,U+1EE27,U+1EE29-1EE32,U+1EE34-1EE37,U+1EE39,U+1EE3B,U+1EE42,U+1EE47,U+1EE49,U+1EE4B,U+1EE4D-1EE4F,U+1EE51-1EE52,U+1EE54,U+1EE57,U+1EE59,U+1EE5B,U+1EE5D,U+1EE5F,U+1EE61-1EE62,U+1EE64,U+1EE67-1EE6A,U+1EE6C-1EE72,U+1EE74-1EE77,U+1EE79-1EE7C,U+1EE7E,U+1EE80-1EE89,U+1EE8B-1EE9B,U+1EEA1-1EEA3,U+1EEA5-1EEA9,U+1EEAB-1EEBB,U+1EEF0-1EEF1;
          }
          @font-face {
            font-family: 'Vazirmatn Local';
            font-style: normal;
            font-weight: 100 900;
            font-display: swap;
            src: url('/fonts/vazirmatn-latin-variable.woff2') format('woff2-variations');
            unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;
          }
          :root {
            --font-vazirmatn: 'Vazirmatn Local', sans-serif;
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
              "name": "Iranian Presbyterian Church of Washington D.C.",
              "alternateName": "کلیسای انجیلی ایرانیان واشنگتن",
              "url": "https://www.iranianchurchdc.com",
              "logo": "https://www.iranianchurchdc.com/logo.png",
              "image": "https://www.iranianchurchdc.com/logo.png",
              "description": "وب‌سایت رسمی کلیسای انجیلی ایرانیان واشنگتن دی‌سی",
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
              "email": "info@iranianchurchdc.com",
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
              "name": "Iranian Presbyterian Church DC Sunday Service — جلسه عبادتی یکشنبه",
              "description": "پخش زنده جلسه عبادتی کلیسای انجیلی ایرانیان واشنگتن دی‌سی — یکشنبه‌ها ساعت ۱:۰۰ بعد از ظهر",
              "eventStatus": "https://schema.org/EventScheduled",
              "eventAttendanceMode": "https://schema.org/MixedEventAttendanceMode",
              "location": [
                {
                  "@type": "Place",
                  "name": "Iranian Presbyterian Church of Washington D.C.",
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
                "name": "Iranian Presbyterian Church of Washington D.C.",
                "url": "https://www.iranianchurchdc.com"
              }
            }),
          }}
        />
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
