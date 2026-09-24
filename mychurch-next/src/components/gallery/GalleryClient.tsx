"use client";

import React, { useState, useMemo } from "react";
import { Images } from "lucide-react";
import { GalleryGrid, type GalleryPhoto } from "./GalleryGrid";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";

// NOTE: these are the raw category values as stored in the database (fa is the
// source of truth). They are used for filtering and must NOT be translated —
// only their on-screen labels are translated via `categoryLabels` below.
const CATEGORIES = ["همه", "ویدیوها", "کلیسا", "رویداد", "طبیعت", "پس‌زمینه اسلاید", "پرستش"];

const categoryLabels: Record<string, { en: string; fa: string; es: string }> = {
    "همه": { en: "All", fa: "همه", es: "Todo" },
    "ویدیوها": { en: "Videos", fa: "ویدیوها", es: "Videos" },
    "کلیسا": { en: "Church", fa: "کلیسا", es: "Iglesia" },
    "رویداد": { en: "Event", fa: "رویداد", es: "Evento" },
    "طبیعت": { en: "Nature", fa: "طبیعت", es: "Naturaleza" },
    "پس‌زمینه اسلاید": { en: "Slide Background", fa: "پس‌زمینه اسلاید", es: "Fondo de Diapositiva" },
    "پرستش": { en: "Worship", fa: "پرستش", es: "Adoración" },
};

const localDict = {
    en: {
        badge: "GALLERY",
        heroTitle: "Church Photo Gallery",
        heroSubtitle: "Browse cherished memories and moments from our church's events and gatherings.",
        emptyCategory: "No photos found in this category.",
    },
    fa: {
        badge: "گالری",
        heroTitle: "گالری تصاویر کلیسا",
        heroSubtitle: "خاطرات و لحظه‌های ماندگار از رویدادها و جلسات کلیسای ما را مرور کنید.",
        emptyCategory: "تصویری در این دسته‌بندی یافت نشد.",
    },
    es: {
        badge: "GALERÍA",
        heroTitle: "Galería de Fotos de la Iglesia",
        heroSubtitle: "Explore recuerdos y momentos entrañables de los eventos y reuniones de nuestra iglesia.",
        emptyCategory: "No se encontraron fotos en esta categoría.",
    },
};

interface GalleryClientProps {
    photos: GalleryPhoto[];
}

export function GalleryHeader() {
    const { language, isRTL } = useLanguage();
    const d = localDict[language] || localDict.fa;

    return (
        <div className="mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20 mb-6">
                <Images className="w-4 h-4" />
                {d.badge}
            </div>
            <h1
                className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/60 leading-[1.1] mb-4"
                dir={isRTL ? "rtl" : "ltr"}
            >
                {d.heroTitle}
            </h1>
            <p className="text-xl text-muted-foreground font-medium max-w-2xl" dir={isRTL ? "rtl" : "ltr"}>
                {d.heroSubtitle}
            </p>
        </div>
    );
}

export function GalleryClient({ photos }: GalleryClientProps) {
    const { language, isRTL } = useLanguage();
    const d = localDict[language] || localDict.fa;
    const [activeCategory, setActiveCategory] = useState("همه");

    const filtered = useMemo(() => {
        if (activeCategory === "همه") return photos;
        if (activeCategory === "ویدیوها") {
            return photos.filter(p => p.mediaType === 'video' || p.category === 'ویدیوها' || p.category === 'ویدیو پس‌زمینه');
        }
        return photos.filter(p => p.category === activeCategory);
    }, [photos, activeCategory]);

    // Only show categories that have photos
    const availableCategories = useMemo(() => {
        const hasVideos = photos.some(p => p.mediaType === 'video' || p.category === 'ویدیوها' || p.category === 'ویدیو پس‌زمینه');
        const used = new Set(photos.map(p => p.category).filter(Boolean));
        return CATEGORIES.filter(c => {
            if (c === "همه") return true;
            if (c === "ویدیوها") return hasVideos;
            return used.has(c);
        });
    }, [photos]);

    const getCount = (cat: string) => {
        if (cat === "ویدیوها") {
            return photos.filter(p => p.mediaType === 'video' || p.category === 'ویدیوها' || p.category === 'ویدیو پس‌زمینه').length;
        }
        return photos.filter(p => p.category === cat).length;
    };

    const getLabel = (cat: string) => categoryLabels[cat]?.[language] ?? categoryLabels[cat]?.fa ?? cat;

    return (
        <div className="w-full">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-10" dir={isRTL ? "rtl" : "ltr"}>
                {availableCategories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                            activeCategory === cat
                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                : "bg-secondary/40 text-muted-foreground border-border/50 hover:bg-secondary hover:text-foreground"
                        )}
                    >
                        {getLabel(cat)}
                        {cat !== "همه" && (
                            <span className="ml-2 text-xs opacity-60">
                                ({getCount(cat)})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Gallery */}
            {filtered.length === 0 ? (
                <div className="text-center py-32 text-muted-foreground">
                    <p className="text-xl font-bold">{d.emptyCategory}</p>
                </div>
            ) : (
                <GalleryGrid photos={filtered} />
            )}
        </div>
    );
}
