import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "DEJ TV | Invoice Manager",
    description: "DEJ TV Freelancer Invoice Management System",
};

export default function DejLayout({ children }: { children: React.ReactNode }) {
    // Completely isolated from the main MyChurch site - no shared layouts or context
    return (
        <html lang="en">
            <body className="min-h-screen bg-gray-50 font-sans antialiased" suppressHydrationWarning>
                {children}
            </body>
        </html>
    );
}
