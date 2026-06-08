import type { Metadata, Viewport } from "next";
import React, { Suspense } from "react";
import "./globals.css";
import { LanguageProvider } from "@/providers/LanguageProvider";

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
    <html lang="fa" dir="rtl" suppressHydrationWarning className="dark">
      <head>
        {/* Runtime Google Fonts to prevent Next.js build crash on VPN drop */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Vazirmatn:wght@300;400;500;600;700;800&family=Noto+Nastaliq+Urdu:wght@400;600;700&family=Lalezar&family=Playfair+Display:wght@400;600;700&family=Merriweather:wght@400;700&display=swap" rel="stylesheet" />
        
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
            --font-inter: 'Roboto', 'Inter', sans-serif;
            --font-roboto: 'Roboto', sans-serif;
            --font-vazirmatn: 'Vazirmatn', sans-serif;
            --font-homa: 'B Homa', 'BHoma', 'Homa', 'Vazirmatn', sans-serif;
            --font-sans: 'Vazirmatn', sans-serif;
            --font-nastaliq: 'Noto Nastaliq Urdu', serif;
            --font-lalezar: 'Lalezar', cursive;
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
