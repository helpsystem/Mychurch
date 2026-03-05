"use client";

import React, { useState } from "react";
import {
    Book, Search, Settings, ChevronRight, ChevronLeft,
    Volume2, Monitor, Home, Languages, Maximize2
} from "lucide-react";
import { type BibleBook } from "@/data/bibleBooks";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BibleReaderProps {
    initialBooks: BibleBook[];
}

export default function BibleReader({ initialBooks }: BibleReaderProps) {
    const [selectedBook, setSelectedBook] = useState<string>("01");
    const [selectedChapter, setSelectedChapter] = useState<number>(1);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [translation, setTranslation] = useState("MOJDEH");

    const filteredBooks = initialBooks.filter(b =>
        b.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.name_fa.includes(searchQuery)
    );

    const currentBook = initialBooks.find(b => b.code === selectedBook) || initialBooks[0];

    // Placeholder verses for the UI preview
    const placeholderVerses = Array.from({ length: 10 }, (_, i) => ({
        number: i + 1,
        fa: "در ابتدا خدا آسمانها و زمین را آفرید.",
        en: "In the beginning God created the heavens and the earth."
    }));

    return (
        <div className="flex h-[100dvh] w-full bg-background text-foreground overflow-hidden selection:bg-primary/30">

            {/* Desktop Sidebar */}
            <aside className={cn(
                "w-80 border-l border-border/50 bg-background/50 backdrop-blur-2xl flex flex-col transition-all duration-300 z-40 relative",
                isSidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0 hidden md:flex"
            )}>
                {/* Search Bar */}
                <div className="p-4 border-b border-border/50 sticky top-0 z-10 bg-background/80 backdrop-blur-md">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="نام کتاب (پیدایش، یوحنا...)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-secondary/50 border border-border/50 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium placeholder:text-muted-foreground/50"
                        />
                    </div>
                </div>

                {/* Books List */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 p-3 space-y-1">
                    {filteredBooks.map(book => (
                        <div key={book.code} className="flex flex-col gap-1">
                            <button
                                onClick={() => {
                                    setSelectedBook(book.code);
                                    setSelectedChapter(1);
                                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                                }}
                                className={cn(
                                    "w-full text-right px-4 py-3 rounded-xl flex items-center justify-between transition-all duration-300 group",
                                    selectedBook === book.code
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-bold"
                                        : "hover:bg-secondary/80 text-foreground/80 hover:text-foreground font-medium"
                                )}
                            >
                                <span className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-1.5 h-1.5 rounded-full transition-all",
                                        selectedBook === book.code ? "bg-primary-foreground" : "bg-primary/50 group-hover:scale-150"
                                    )} />
                                    {book.name_fa}
                                </span>
                                <span className={cn(
                                    "text-xs transition-colors",
                                    selectedBook === book.code ? "text-primary-foreground/80" : "text-muted-foreground"
                                )}>
                                    {book.name_en}
                                </span>
                            </button>

                            {/* Chapters Grid (Only if selected) */}
                            {selectedBook === book.code && (
                                <div className="grid grid-cols-5 gap-1.5 p-2 bg-secondary/30 rounded-xl mt-1 mb-2 animate-in slide-in-from-top-2 duration-300">
                                    {Array.from({ length: book.chapters }, (_, i) => i + 1).map(ch => (
                                        <button
                                            key={ch}
                                            onClick={() => setSelectedChapter(ch)}
                                            className={cn(
                                                "py-2 rounded-lg text-sm font-semibold transition-all",
                                                selectedChapter === ch
                                                    ? "bg-primary/20 text-primary border border-primary/30"
                                                    : "bg-background/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                            )}
                                        >
                                            {ch}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Reading Area */}
            <main className="flex-1 flex flex-col relative bg-background h-[100dvh]">

                {/* Background Ambient Layers */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px]" />
                    <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[100px]" />
                </div>

                {/* Top Nav / Breadcrumbs */}
                <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 relative z-10 shrink-0 shadow-sm">
                    {/* Left side actions */}
                    <div className="flex items-center gap-2 lg:gap-4">
                        <Link href="/" className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all group" title="خانه">
                            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </Link>

                        <div className="w-px h-6 bg-border hidden sm:block mx-1" />

                        {/* Chapter Navigation Panel */}
                        <div className="flex items-center bg-secondary/50 rounded-xl border border-border/50 p-1 shadow-sm">
                            <button
                                title="Next Chapter"
                                onClick={() => setSelectedChapter(c => Math.min(currentBook.chapters, c + 1))}
                                disabled={selectedChapter >= currentBook.chapters}
                                className="p-2 rounded-lg hover:bg-background hover:shadow-sm disabled:opacity-30 transition-all text-foreground"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>

                            <div className="px-4 font-bold text-sm min-w-[5rem] text-center select-none text-foreground">
                                فصل {selectedChapter}
                            </div>

                            <button
                                title="Previous Chapter"
                                onClick={() => setSelectedChapter(c => Math.max(1, c - 1))}
                                disabled={selectedChapter <= 1}
                                className="p-2 rounded-lg hover:bg-background hover:shadow-sm disabled:opacity-30 transition-all text-foreground"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-2">
                        <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-secondary/50 hover:bg-secondary rounded-xl font-medium text-sm transition-all border border-border/50 shadow-sm text-foreground">
                            <Volume2 className="w-4 h-4 text-primary" /> پخش صوتی
                        </button>

                        <button title="Toggle Sidebar" className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all sm:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            <Book className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Reader Content */}
                <div className="flex-1 overflow-y-auto relative z-10 scroll-smooth">
                    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 lg:px-8">
                        {/* Title Display */}
                        <div className="text-center mb-16 animate-in slide-in-from-bottom-4 duration-700 fade-in">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-widest mb-6">
                                {translation} TRANSLATION
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black mb-4 text-foreground tracking-tight drop-shadow-sm">
                                {currentBook.name_fa}
                            </h1>
                            <p className="text-xl md:text-2xl text-muted-foreground font-medium opacity-80 uppercase tracking-widest">
                                {currentBook.name_en} {selectedChapter}
                            </p>
                        </div>

                        {/* Verses Container */}
                        <div className="space-y-10 md:space-y-12">
                            {placeholderVerses.map(verse => (
                                <div key={verse.number} className="group flex flex-col gap-3 relative hover:bg-secondary/20 p-4 -mx-4 rounded-2xl transition-colors duration-300">
                                    <div className="absolute top-4 -right-12 text-sm font-bold text-primary/40 group-hover:text-primary transition-colors select-none text-right w-8">
                                        {verse.number}
                                    </div>
                                    <p className="text-2xl md:text-3xl leading-relaxed text-foreground font-medium text-right drop-shadow-sm">
                                        {verse.fa}
                                    </p>
                                    <p className="text-lg md:text-xl leading-relaxed text-muted-foreground/80 font-serif text-left ml-auto w-full md:w-4/5 border-l-2 border-primary/20 pl-4 mt-2">
                                        {verse.en}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* End of Chapter Navigation */}
                        <div className="mt-24 flex justify-between items-center py-8 border-t border-border/50">
                            {selectedChapter < currentBook.chapters && (
                                <button onClick={() => setSelectedChapter(c => c + 1)} className="flex items-center gap-3 px-6 py-3 bg-secondary rounded-2xl hover:bg-secondary/80 transition-all font-semibold mr-auto group text-foreground">
                                    فصل بعدی <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
