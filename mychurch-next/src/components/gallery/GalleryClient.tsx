"use client";

import React, { useState, useMemo } from "react";
import { GalleryGrid, type GalleryPhoto } from "./GalleryGrid";
import { cn } from "@/lib/utils";

const CATEGORIES = ["همه", "ویدیوها", "کلیسا", "رویداد", "طبیعت", "پس‌زمینه اسلاید", "پرستش"];

interface GalleryClientProps {
    photos: GalleryPhoto[];
}

export function GalleryClient({ photos }: GalleryClientProps) {
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

    return (
        <div className="w-full">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-10" dir="rtl">
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
                        {cat}
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
                    <p className="text-xl font-bold">تصویری در این دسته‌بندی یافت نشد.</p>
                </div>
            ) : (
                <GalleryGrid photos={filtered} />
            )}
        </div>
    );
}
