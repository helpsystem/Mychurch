"use client";

import React, { useState, useMemo } from "react";
import { Search, Play, FileText, Music, LayoutGrid, Youtube } from "lucide-react";
import Image from "next/image";
import { DynamicWatermark } from "@/components/ui/DynamicWatermark";
import { useLanguage } from "@/providers/LanguageProvider";
import { type WorshipSong } from "@/data/worshipSongs";
import { cn } from "@/lib/utils";

export default function WorshipArchive({ initialSongs }: { initialSongs: WorshipSong[] }) {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeLetter, setActiveLetter] = useState<string | null>(null);
    const [selectedAlphabet, setSelectedAlphabet] = useState<string | null>(null); // Added for the new alphabet filter logic

    // Get unique first letters for alphabet filter
    const alphabet = useMemo(() => {
        const letters = new Set<string>();
        initialSongs.forEach(song => {
            const firstChar = song.title.fa.trim().charAt(0);
            if (firstChar) letters.add(firstChar);
        });
        return Array.from(letters).sort();
    }, [initialSongs]);

    // Filter songs based on search and active letter
    const filteredSongs = useMemo(() => {
        let result = initialSongs;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(song =>
                song.title.fa.includes(query) ||
                song.title.en?.toLowerCase().includes(query) ||
                song.artist?.includes(query)
            );
        } else if (selectedAlphabet) { // Changed to selectedAlphabet
            result = result.filter(song => song.title.fa.trim().startsWith(selectedAlphabet)); // Changed to selectedAlphabet
        }

        return result;
    }, [initialSongs, searchQuery, selectedAlphabet]); // Changed to selectedAlphabet

    return (
        <div className="w-full max-w-7xl mx-auto px-6 py-12 lg:px-12 relative z-10 selection:bg-primary/30">
            {/* Background Watermark */}
            <DynamicWatermark defaultSize={600} defaultPosition="center" defaultOpacity={2} className="-z-10" />

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-widest mb-4">
                        <Music className="w-4 h-4" />
                        WORSHIP CENTER
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/70 mb-4 tracking-tight">
                        {t.worshipTitle}
                    </h1>
                    <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
                        {t.worshipDesc}
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    <div className="relative flex items-center bg-secondary/80 backdrop-blur-md border border-border/50 rounded-2xl p-2 shadow-sm">
                        <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none focus:outline-none w-full text-foreground placeholder:text-muted-foreground/50 py-1 font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Alphabet Filter */}
            {!searchQuery && (
                <div className="flex flex-wrap items-center gap-2 mb-10 pb-4 border-b border-border/50">
                    <button
                        onClick={() => setSelectedAlphabet(null)}
                        className={cn(
                            "h-12 w-16 shrink-0 rounded-2xl font-bold transition-all border shadow-sm",
                            selectedAlphabet === null
                                ? "bg-primary text-primary-foreground border-primary shadow-primary/20 scale-105"
                                : "bg-secondary/40 text-muted-foreground border-border/50 hover:bg-secondary hover:text-foreground hover:scale-105"
                        )}
                    >
                        {t.all}
                    </button>
                    {alphabet.map(letter => (
                        <button
                            key={letter}
                            onClick={() => setSelectedAlphabet(letter)} // Changed to setSelectedAlphabet
                            className={cn(
                                "w-10 h-10 flex items-center justify-center text-sm font-bold rounded-xl transition-all",
                                selectedAlphabet === letter // Changed to selectedAlphabet
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                    : "hover:bg-secondary text-muted-foreground"
                            )}
                        >
                            {letter}
                        </button>
                    ))}
                </div>
            )}

            {/* Songs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSongs.length > 0 ? filteredSongs.map(song => (
                    <div key={song.id} className="group relative overflow-hidden rounded-3xl bg-secondary/30 border border-border/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1 p-5 flex flex-col gap-4">

                        {/* Thumbnail / Header */}
                        <div className="w-full h-40 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 overflow-hidden relative flex flex-col justify-end p-4 border border-border/30">
                            {song.youtubeId && (
                                <img
                                    src={`https://img.youtube.com/vi/${song.youtubeId}/hqdefault.jpg`}
                                    alt={song.title.fa}
                                    className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:scale-110 transition-transform duration-700"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />

                            <h3 className="relative font-bold text-xl text-foreground truncate drop-shadow-md pb-1 border-b border-primary/30 inline-block w-fit">
                                {song.title.fa}
                            </h3>
                            {song.title.en && (
                                <p className="relative text-sm text-muted-foreground/90 font-medium tracking-wide mt-1">
                                    {song.title.en}
                                </p>
                            )}
                        </div>

                        {/* Details */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground font-medium flex items-center gap-2">
                                <Music className="w-4 h-4 text-primary" />
                                {song.artist || "ناشناس"}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-auto pt-4 border-t border-border/50">
                            {/* Main Action (Karaoke / Play) */}
                            {song.audioUrl && (
                                <button className="flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary py-3 rounded-xl font-bold text-sm transition-colors border border-primary/20">
                                    <FileText className="w-4 h-4" />
                                    {t.liveText}
                                </button>
                            )}
                            <button className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground py-3 rounded-xl font-bold text-sm transition-colors">
                                <Play className="w-4 h-4 text-emerald-500" />
                                {t.play}
                            </button>
                            {song.youtubeId && (
                                <button className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground py-3 rounded-xl font-bold text-sm transition-colors">
                                    <Youtube className="w-4 h-4 text-red-500" />
                                    {t.youtube}
                                </button>
                            )}
                            <button className="p-2.5 bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-xl transition-colors border border-border/50" title="Presentation">
                                <LayoutGrid className="w-5 h-5" /> {/* Changed to LayoutGrid */}
                            </button>
                        </div>

                    </div>
                )) : (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-center opacity-50">
                        <FileText className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
                        <h3 className="text-xl font-bold text-foreground mb-2">{t.notFoundTitle}</h3>
                        <p className="text-muted-foreground">{t.notFoundDesc}</p>
                    </div>
                )}
            </div>

        </div>
    );
}
