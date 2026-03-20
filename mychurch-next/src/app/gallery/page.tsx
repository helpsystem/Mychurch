// src/app/gallery/page.tsx
import React from "react";
import { Suspense } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { GalleryClient } from "@/components/gallery/GalleryClient";
import { fetchGalleryImages } from "@/actions/gallery";
import { Images } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "گالری | کلیسای ایرانیان مسیحی واشنگتن دی‌سی",
    description: "تصاویر و خاطرات رویدادهای کلیسای ایرانیان مسیحی واشنگتن دی‌سی",
};

export const dynamic = 'force-dynamic';

// Fallback demo photos when DB is empty, so the page always looks great
const DEMO_PHOTOS = [
    { id: "d1", src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600", width: 800, height: 600, title: "کوه‌های سر به فلک کشیده", category: "طبیعت" },
    { id: "d2", src: "https://images.unsplash.com/photo-1490750967868-88df5691cc32?w=600&h=800", width: 600, height: 800, title: "گل‌های بهاری", category: "طبیعت" },
    { id: "d3", src: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=900&h=600", width: 900, height: 600, title: "لحظه‌ای از عبادت", category: "کلیسا" },
    { id: "d4", src: "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=700&h=700", width: 700, height: 700, title: "خدمت جوانان", category: "رویداد" },
    { id: "d5", src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&h=700", width: 1000, height: 700, title: "برنامه‌ریزی کلیسا", category: "رویداد" },
    { id: "d6", src: "https://images.unsplash.com/photo-1519682577862-22b62b24e493?w=600&h=900", width: 600, height: 900, title: "مطالعه کتاب مقدس", category: "کلیسا" }
];

export default async function GalleryPage() {
    const dbPhotos = await fetchGalleryImages();
    // Fall back to demo photos if DB has none yet
    const photos = dbPhotos.length > 0 ? dbPhotos : DEMO_PHOTOS as any[];

    return (
        <div className="min-h-screen bg-background relative selection:bg-primary/30 font-sans flex flex-col">
            <PublicHeader />

            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[25%] right-[10%] w-[35%] h-[35%] bg-purple-500/8 rounded-full blur-[140px]" />
                <div className="absolute bottom-[20%] left-[10%] w-[35%] h-[35%] bg-blue-500/8 rounded-full blur-[140px]" />
            </div>

            <main className="relative z-10 flex-1 pt-32 pb-24 px-6 lg:px-12 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20 mb-6">
                        <Images className="w-4 h-4" />
                        GALLERY
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/60 leading-[1.1] mb-4" dir="rtl">
                        گالری تصاویر کلیسا
                    </h1>
                    <p className="text-xl text-muted-foreground font-medium max-w-2xl" dir="rtl">
                        خاطرات و لحظه‌های ماندگار از رویدادها و جلسات کلیسای ما را مرور کنید.
                    </p>
                </div>

                {/* Gallery Grid */}
                <Suspense fallback={
                    <div className="w-full grid grid-cols-3 gap-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="aspect-video bg-neutral-800/50 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                }>
                    <GalleryClient photos={photos} />
                </Suspense>
            </main>

            <PublicFooter />
        </div>
    );
}
