import type { Metadata, Viewport } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Runtime Google Fonts to prevent Next.js build crash on VPN drop */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Vazirmatn:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const storedTheme = localStorage.getItem("theme");
                const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                const isDark = storedTheme ? storedTheme === "dark" : prefersDark;
                document.documentElement.classList.toggle("dark", isDark);
              } catch {
                document.documentElement.classList.add("dark");
              }
            })();`,
          }}
        />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --font-inter: 'Inter', sans-serif;
            --font-vazirmatn: 'Vazirmatn', sans-serif;
          }
        `}} />
      </head>
      <body className={`antialiased bg-background text-foreground`} style={{ fontFamily: 'var(--font-vazirmatn)' }}>
        <LanguageProvider>
          {children}
          <MobileNavigation />
          <GlobalPopupWrapper />
        </LanguageProvider>
      </body>
    </html>
  );
}
