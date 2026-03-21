"use client";

import React, { useEffect } from "react";
import { X, Youtube, Music, AlignLeft, Guitar } from "lucide-react";
import { type WorshipSong } from "@/actions/worship";

interface Props {
    song: WorshipSong;
    onClose: () => void;
}

export function SongDetailsModal({ song, onClose }: Props) {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const hasFa = !!song.lyrics_fa;
    const hasEn = !!song.lyrics_en;
    const hasChords = !!(song as any).chords;

    // Calculate columns based on available text content
    let colClasses = "grid-cols-1";
    let colCount = 0;
    if (hasFa) colCount++;
    if (hasEn) colCount++;
    if (hasChords) colCount++;

    if (colCount === 2) colClasses = "grid-cols-1 md:grid-cols-2";
    if (colCount >= 3) colClasses = "grid-cols-1 lg:grid-cols-3";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative bg-background border border-border/50 rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200" dir="rtl">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-white/5 shrink-0 bg-secondary/30">
                    <div>
                        <h2 className="text-3xl font-black text-foreground">{song.title_fa}</h2>
                        {song.title_en && <h3 className="text-lg text-muted-foreground font-serif mt-1" dir="ltr">{song.title_en}</h3>}
                        <div className="flex flex-col gap-1 mt-4">
                            {song.artist && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] uppercase tracking-widest text-primary/70 font-black">نام خواننده / گروه:</span>
                                    <span className="flex items-center gap-2 text-lg font-bold text-foreground bg-primary/5 px-4 py-2 rounded-2xl border border-primary/20 w-fit">
                                        <Music className="w-5 h-5 text-primary" /> {song.artist}
                                    </span>
                                </div>
                            )}
                            {song.youtube_id && (
                                <a href={`https://youtube.com/watch?v=${song.youtube_id}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 px-3 py-1 rounded-full border border-red-500/20 transition-colors">
                                    <Youtube className="w-4 h-4" /> تماشا در یوتیوب
                                </a>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors bg-white/5" title="بستن">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {/* Media Row */}
                    {(song.youtube_id || song.audio_url) && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {song.youtube_id && (
                                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-border/50 bg-black shadow-lg">
                                    <iframe 
                                        src={`https://www.youtube.com/embed/${song.youtube_id}?rel=0`} 
                                        className="w-full h-full"
                                        allowFullScreen
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    />
                                </div>
                            )}
                            {song.audio_url && (
                                <div className="flex flex-col justify-center bg-secondary/30 border border-border/50 rounded-2xl p-6 h-full min-h-[160px]">
                                    <h4 className="font-bold flex items-center gap-2 mb-4 text-muted-foreground"><Music className="w-5 h-5 text-primary" /> پخش فایل صوتی</h4>
                                    <audio src={song.audio_url} controls className="w-full grayscale opacity-90 hover:opacity-100 hover:grayscale-0 transition-all" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Content Columns */}
                    {colCount > 0 ? (
                        <div className={`grid ${colClasses} gap-6`}>
                            {hasFa && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-inner">
                                    <h4 className="flex items-center gap-2 font-bold mb-4 pb-4 border-b border-border/50 text-foreground">
                                        <AlignLeft className="w-5 h-5 text-primary" /> متن فارسی
                                    </h4>
                                    <div className="whitespace-pre-wrap font-vazirmatn text-lg leading-loose text-foreground/90 font-medium">
                                        {song.lyrics_fa}
                                    </div>
                                </div>
                            )}
                            
                            {hasEn && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-inner" dir="ltr">
                                    <h4 className="flex items-center gap-2 font-bold mb-4 pb-4 border-b border-border/50 text-foreground">
                                        <AlignLeft className="w-5 h-5 text-blue-400" /> English Lyrics
                                    </h4>
                                    <div className="whitespace-pre-wrap font-serif text-lg leading-loose text-foreground/90">
                                        {song.lyrics_en}
                                    </div>
                                </div>
                            )}

                            {hasChords && (
                                <div className="bg-black/40 border border-white/10 rounded-2xl p-6 shadow-inner" dir="ltr">
                                    <h4 className="flex items-center gap-2 font-bold mb-4 pb-4 border-b border-border/50 text-purple-400">
                                        <Guitar className="w-5 h-5" /> Chords
                                    </h4>
                                    <div className="whitespace-pre-wrap font-mono text-base leading-relaxed text-purple-200">
                                        {(song as any).chords}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-20 text-center flex flex-col items-center opacity-50">
                            <AlignLeft className="w-16 h-16 mb-4" />
                            <h3 className="text-xl font-bold">هیچ محتوای متنی برای این سرود ثبت نشده است.</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
