import type {Metadata} from 'next';
import { Vazirmatn, JetBrains_Mono } from 'next/font/google';
import './globals.css'; // Global styles

const vazir = Vazirmatn({
  subsets: ['arabic', 'latin'],
  variable: '--font-vazir',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'DocuGenius - Smart Persian Templates',
  description: 'Generate and customize beautiful HTML/Tailwind templates for letterheads, payment receipts, and delivery receipts with AI assistance.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="fa" dir="rtl" className={`${vazir.variable} ${jetbrainsMono.variable}`}>
      <body className="font-vazir antialiased bg-gray-50 text-gray-900" suppressHydrationWarning>{children}</body>
    </html>
  );
}
