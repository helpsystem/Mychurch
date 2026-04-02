"use client";

import React, { useEffect, useState } from "react";
import { 
    Slide, SlideType, 
    SlideContentScripture, SlideContentLyrics, SlideContentMedia, 
    SlideContentAnnouncement, SlideContentGeneric, SlideContentLiveData, SlideContentMeeting, ScriptureReferenceItem
} from "@/types/broadcast";
import { cn } from "@/lib/utils";
import { Megaphone, MapPin, Calendar, Clock, BarChart3, PieChart, LineChart } from "lucide-react";

interface SlideRendererProps {
    slide: Slide | undefined;
    className?: string;
    isRemotePreview?: boolean;
    previewZoom?: number;
    previewMode?: 'fit' | 'fixed';
    internalPageIndex?: number;
}

export function SlideRenderer({ slide, className, isRemotePreview = false, previewZoom = 1, internalPageIndex = 0 }: SlideRendererProps) {
    const [activeReference, setActiveReference] = useState<ScriptureReferenceItem | null>(null);
    const slideZoom = Number.isFinite(slide?.zoom || 1) ? Math.max(0.5, Math.min(slide?.zoom || 1, 2.5)) : 1;
    const safeZoom = Number.isFinite(previewZoom) ? Math.max(0.25, Math.min(previewZoom, 3)) : 1;

    useEffect(() => {
        setActiveReference(null);
    }, [slide?.id]);

    if (!slide) {
        return (
            <div className={cn("w-full h-full flex flex-col items-center justify-center bg-black text-white/30", className)}>
                <div className="text-6xl mb-4">🖥️</div>
                <div className="text-xl font-bold font-[Vazirmatn]">هیچ اسلایدی انتخاب نشده</div>
            </div>
        );
    }

    // Common background utility
    const renderBackground = (bgConfig: any) => {
        if (!bgConfig) return <div className="absolute inset-0 bg-black -z-10" />;
        
        switch (bgConfig.type) {
            case 'color':
                return <div className="absolute inset-0 -z-10" style={{ backgroundColor: bgConfig.value, opacity: (bgConfig.opacity || 100) / 100 }} />;
            case 'gradient':
                return <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-900 via-black to-blue-900" style={{ opacity: (bgConfig.opacity || 100) / 100 }} />;
            case 'image':
                return (
                    <div 
                        className="absolute inset-0 -z-10 bg-cover bg-center" 
                        style={{ backgroundImage: `url(${bgConfig.value})`, opacity: (bgConfig.opacity || 100) / 100 }} 
                    />
                );
            case 'video':
                return (
                    <video 
                        className="absolute inset-0 w-full h-full object-cover -z-10" 
                        autoPlay loop muted playsInline 
                        style={{ opacity: (bgConfig.opacity || 100) / 100 }}
                    >
                        <source src={bgConfig.value} type="video/mp4" />
                    </video>
                );
            case 'wavyPaper': {
                const line = (bgConfig.value || 'Sample text / نمونه متن').trim() || 'Sample text / نمونه متن';
                const lines = Array.from({ length: 4 }, () => line);
                return (
                    <div className="absolute inset-0 -z-10 overflow-hidden bg-[#fffef0]">
                        <svg className="absolute w-0 h-0" aria-hidden="true" focusable="false">
                            <filter id="wavy2">
                                <feTurbulence x="0" y="0" baseFrequency="0.02" numOctaves="5" seed="1" />
                                <feDisplacementMap in="SourceGraphic" scale="15" />
                            </filter>
                        </svg>
                        <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(0,0,0,0.03)_1px,transparent_1px)] [background-size:4px_4px]" />
                        <div className="relative h-full w-full p-10 space-y-5 text-[#41290e]">
                            {lines.map((item, idx) => (
                                <blockquote
                                    key={idx}
                                    className="relative rounded-md p-4 leading-tight bg-[#fffef0] shadow-[2px_3px_10px_rgba(0,0,0,0.45),inset_0_0_30px_#8a4d0f]"
                                    style={{ filter: 'url(#wavy2)' }}
                                >
                                    <p className="relative z-10 text-sm md:text-base">{item}</p>
                                </blockquote>
                            ))}
                        </div>
                    </div>
                );
            }
            default:
                return <div className="absolute inset-0 bg-black -z-10" />;
        }
    };

    const renderContent = () => {
        switch (slide.type) {
            case SlideType.LYRICS: {
                const content = slide.content as SlideContentLyrics;
                const opts = content.displayOptions;
                const showFa = opts?.showFarsiLyrics !== false;
                const showEn = opts?.showEnglishLyrics !== false;
                const showFinglish = opts?.showFinglish !== false;

                return (
                    <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
                        {/* Dynamic Background */}
                        {opts?.showBackground !== false && (
                            <div className="absolute inset-0 -z-10">
                                {opts?.backgroundType === 'image' && opts.backgroundUrl ? (
                                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${opts.backgroundUrl})`, opacity: opts.backgroundOpacity ? opts.backgroundOpacity / 100 : 0.6 }} />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 to-black" />
                                )}
                            </div>
                        )}
                        
                        <div className={`space-y-8 z-10 ${opts?.textShadow ? 'drop-shadow-2xl' : ''}`}>
                            {content.lines.map((line, idx) => (
                                <div key={idx} className="flex flex-col items-center justify-center gap-2">
                                    {showFa && line.text && (
                                        <h1 className="text-5xl md:text-7xl font-bold font-[Vazirmatn] text-white leading-tight" dir="rtl">
                                            {line.text}
                                        </h1>
                                    )}
                                    {showFinglish && content.finglishLines && content.finglishLines[idx] && (
                                        <h3 className="text-2xl md:text-3xl text-yellow-300 font-medium tracking-wide">
                                            {content.finglishLines[idx]}
                                        </h3>
                                    )}
                                    {showEn && content.lyricsEnLines && content.lyricsEnLines[idx] && (
                                        <h2 className="text-3xl md:text-5xl text-blue-200 font-serif opacity-90 mt-2">
                                            {content.lyricsEnLines[idx]}
                                        </h2>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {opts?.showTitle !== false && (
                            <div className="absolute bottom-12 left-12 text-left z-10 glass-strong p-4 border border-white/10 rounded-2xl">
                                <p className="text-white/80 font-bold text-xl">{content.title}</p>
                                {opts?.showArtist !== false && (
                                    <p className="text-white/50 text-sm mt-1">Iran Church DC Worship</p>
                                )}
                            </div>
                        )}
                    </div>
                );
            }

            case SlideType.SCRIPTURE: {
                const content = slide.content as SlideContentScripture;
                const page = content.pages[internalPageIndex] || content.pages[0];
                if (!page) return null;

                const references = page.referenceItems || [];
                if (page.displayMode === 'referenceList' && references.length > 0) {
                    const useWavyPaper = page.glassPopupEnabled === true;
                    return (
                        <div className={`w-full h-full p-6 md:p-8 lg:p-10 relative overflow-hidden ${useWavyPaper ? 'bg-[#fffef0]' : 'bg-slate-950'}`}>
                            {useWavyPaper ? (
                                <>
                                    <svg className="absolute w-0 h-0" aria-hidden="true" focusable="false">
                                        <filter id="wavyRefBg">
                                            <feTurbulence x="0" y="0" baseFrequency="0.02" numOctaves="5" seed="2" />
                                            <feDisplacementMap in="SourceGraphic" scale="12" />
                                        </filter>
                                    </svg>
                                    <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(0,0,0,0.03)_1px,transparent_1px)] [background-size:4px_4px] -z-10" />
                                </>
                            ) : (
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.2),_rgba(2,6,23,0.9))] -z-10" />
                            )}

                                                        <div
                                                            className={`h-full min-h-0 rounded-3xl p-5 md:p-6 flex flex-col gap-3 overflow-hidden ${useWavyPaper ? 'border border-[#8a4d0f]/40 bg-[#fffef0]/90 shadow-[2px_3px_10px_rgba(0,0,0,0.25),inset_0_0_30px_#8a4d0f]' : 'border border-indigo-500/20 bg-black/30 backdrop-blur-sm'}`}
                                                            style={{
                                                                ...(useWavyPaper ? { filter: 'url(#wavyRefBg)' } : undefined),
                                                                transform: `scale(${slideZoom})`,
                                                                transformOrigin: 'center center'
                                                            }}
                                                        >
                                <div className="flex items-center justify-between">
                                    <h2 className={`text-2xl md:text-3xl font-black font-[Vazirmatn] leading-tight ${useWavyPaper ? 'text-[#41290e]' : 'text-indigo-300'}`}>فهرست آیات انتخابی</h2>
                                    <span className={`text-[10px] md:text-xs px-2.5 py-1 rounded-full whitespace-nowrap ${useWavyPaper ? 'bg-[#8a4d0f]/10 border border-[#8a4d0f]/30 text-[#41290e]' : 'bg-indigo-500/20 border border-indigo-500/40 text-indigo-200'}`}>
                                        {references.length} Reference{references.length > 1 ? 's' : ''}
                                    </span>
                                </div>

                                <div className={`grid grid-cols-12 text-[10px] md:text-xs pb-2 px-1 md:px-2 ${useWavyPaper ? 'text-[#5e4021] border-b border-[#8a4d0f]/30' : 'text-slate-400 border-b border-slate-700'}`}>
                                    <div className="col-span-6 text-right font-[Vazirmatn]">فارسی</div>
                                    <div className="col-span-6 text-left">English</div>
                                </div>

                                <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                                    {references.map((ref, idx) => (
                                        <button
                                            key={ref.id}
                                            onClick={() => setActiveReference(ref)}
                                            className={`w-full grid grid-cols-12 items-center rounded-xl transition px-2.5 py-2.5 md:px-3 md:py-3 ${useWavyPaper ? 'border border-[#8a4d0f]/30 bg-[#fffef0] hover:bg-[#f6eed9]' : 'border border-slate-700/80 bg-slate-900/50 hover:bg-indigo-500/10 hover:border-indigo-500/40'}`}
                                        >
                                            <div className="col-span-6 text-right">
                                                <p className={`font-bold text-sm md:text-base lg:text-lg leading-snug break-words ${useWavyPaper ? 'text-[#41290e]' : 'text-white'}`} style={{ fontFamily: ref.fontFa || page.fontFa || 'var(--font-vazirmatn)' }}>
                                                    {idx + 1}. {ref.bookName.fa} {ref.chapter}:{ref.verses}
                                                </p>
                                            </div>
                                            <div className="col-span-6 text-left">
                                                <p className={`font-semibold text-sm md:text-base lg:text-lg leading-snug break-words ${useWavyPaper ? 'text-[#5e4021]' : 'text-indigo-200'}`} style={{ fontFamily: ref.fontEn || page.fontEn || 'var(--font-inter)' }}>
                                                    {idx + 1}. {ref.bookName.en} {ref.chapter}:{ref.verses}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {activeReference && (
                                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-10 z-50">
                                    <div className="w-full max-w-5xl max-h-[85vh] overflow-y-auto rounded-3xl border border-indigo-500/30 bg-slate-900 p-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-2xl font-black text-white font-[Vazirmatn]">
                                                {activeReference.bookName.fa} {activeReference.chapter}:{activeReference.verses}
                                            </h3>
                                            <button
                                                onClick={() => setActiveReference(null)}
                                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm"
                                            >
                                                بستن
                                            </button>
                                        </div>

                                        <p className="text-sm text-indigo-200 mb-6">{activeReference.bookName.en} {activeReference.chapter}:{activeReference.verses}</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4" dir="rtl">
                                                <h4 className="text-emerald-300 font-bold mb-3 font-[Vazirmatn]">متن فارسی</h4>
                                                <div className="space-y-2 text-slate-100 leading-8" style={{ fontFamily: activeReference.fontFa || page.fontFa || 'var(--font-vazirmatn)' }}>
                                                    {activeReference.textFa.map((line, i) => (
                                                        <p key={`fa-${i}`}>
                                                            <span className="text-amber-300 ml-2">{activeReference.verseNumbers[i] || ''}</span>
                                                            {line}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4" dir="ltr">
                                                <h4 className="text-blue-300 font-bold mb-3">English Text</h4>
                                                <div className="space-y-2 text-slate-100 leading-8" style={{ fontFamily: activeReference.fontEn || page.fontEn || 'var(--font-inter)' }}>
                                                    {activeReference.textEn.map((line, i) => (
                                                        <p key={`en-${i}`}>
                                                            <span className="text-amber-300 mr-2">{activeReference.verseNumbers[i] || ''}</span>
                                                            {line}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                }

                return (
                    <div className="w-full h-full flex flex-col bg-[url('/bg-dark-texture.jpg')] bg-cover bg-center items-center justify-center p-16 relative">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm -z-10" />
                        
                        {/* Reference Badge */}
                        <div className="absolute top-12 left-12 bg-amber-500/20 border border-amber-500/30 px-6 py-2 rounded-full backdrop-blur-md">
                            <span className="text-amber-400 font-bold text-2xl font-[Vazirmatn]">{page.bookName.fa} {page.chapter}:{page.verses}</span>
                        </div>
                        
                        <div className="max-w-6xl w-full text-center space-y-12">
                            <p
                                className="text-5xl md:text-7xl leading-snug font-bold text-white"
                                dir="rtl"
                                style={{ textShadow: "0 4px 12px rgba(0,0,0,0.5)", fontFamily: page.fontFa || "var(--font-vazirmatn)" }}
                            >
                                {page.textPrimary.join(" ")}
                            </p>
                            
                            {page.textSecondary && page.textSecondary.length > 0 && (
                                <p
                                    className="text-3xl md:text-5xl leading-relaxed text-amber-200/80 italic"
                                    dir="ltr"
                                    style={{ fontFamily: page.fontEn || "var(--font-inter)" }}
                                >
                                    {page.textSecondary.join(" ")}
                                </p>
                            )}
                        </div>
                    </div>
                );
            }

            case SlideType.ANNOUNCEMENT: {
                const content = slide.content as SlideContentAnnouncement;
                return (
                    <div className="w-full h-full flex bg-gradient-to-br from-indigo-950 to-black p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-600/10 blur-[150px] -z-10" />
                        
                        <div className="flex-1 flex flex-col justify-center max-w-4xl z-10 space-y-8" dir="rtl">
                            <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 px-4 py-2 rounded-full w-fit">
                                <Megaphone className="w-6 h-6 text-indigo-400" />
                                <span className="text-indigo-200 font-bold tracking-widest text-lg font-[Vazirmatn]">اطلاعیه کلیسا</span>
                            </div>
                            
                            <h1 className="text-6xl md:text-8xl font-black text-white font-[Vazirmatn] leading-tight">
                                {content.title}
                            </h1>
                            
                            {content.content && (
                                <p className="text-3xl text-slate-300 leading-relaxed font-[Vazirmatn] max-w-3xl">
                                    {content.content}
                                </p>
                            )}
                            
                            {content.eventDate && (
                                <div className="flex items-center gap-4 text-2xl text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl w-fit mt-8">
                                    <Calendar className="w-8 h-8" />
                                    <span>تاریخ: {content.eventDate}</span>
                                </div>
                            )}
                        </div>

                        {content.imageUrl && (
                            <div className="flex-1 flex items-center justify-end z-10">
                                <div className="w-[80%] aspect-square rounded-[3rem] overflow-hidden border-8 border-white/10 shadow-2xl relative">
                                    <img src={content.imageUrl} alt={content.title} className="w-full h-full object-cover" />
                                </div>
                            </div>
                        )}
                    </div>
                );
            }

            case SlideType.MEDIA: {
                const content = slide.content as SlideContentMedia;
                return (
                    <div className="w-full h-full bg-black flex items-center justify-center relative overflow-hidden">
                        {content.mediaType === 'image' && (
                            <img src={content.url} className="w-full h-full object-contain" alt="Media" />
                        )}
                        {content.mediaType === 'video' && (
                            <video src={content.url} className="w-full h-full object-contain" autoPlay={content.isAutoPlay} loop={content.isLoop} muted={isRemotePreview} />
                        )}
                    </div>
                );
            }

            case SlideType.GENERIC: {
                const content = slide.content as SlideContentGeneric;
                return (
                    <div className="w-full h-full flex p-16 relative overflow-hidden font-[Vazirmatn]">
                        {renderBackground(content.background)}
                        
                        <div 
                            className={`w-full h-full flex flex-col z-10 ${content.layout === 'centered' ? 'items-center justify-center text-center' : content.layout === 'split-left' ? 'items-start justify-center w-1/2' : 'items-center justify-center'}`} 
                            dir="rtl"
                            style={{ fontFamily: content.fontFamily || 'var(--font-vazirmatn)' }}
                            dangerouslySetInnerHTML={{ __html: content.htmlContent }} 
                        />
                    </div>
                );
            }

            case SlideType.LIVEDATA: {
                const content = slide.content as SlideContentLiveData;
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center p-16 relative overflow-hidden">
                        {renderBackground(content.background)}
                        <h1 className="text-6xl font-black text-white font-[Vazirmatn] mb-12 z-10">{content.title}</h1>
                        
                        <div className="flex items-end justify-center gap-8 h-1/2 w-full max-w-5xl z-10 border-b-4 border-white/20 pb-2">
                            {content.data.map((point, idx) => {
                                const maxVal = Math.max(...content.data.map(d => d.value));
                                const heightPct = (point.value / maxVal) * 100;
                                return (
                                    <div key={idx} className="flex flex-col items-center gap-4 flex-1">
                                        {content.showValues && <span className="text-3xl font-bold text-white mb-2">{point.value}</span>}
                                        <div 
                                            className="w-full rounded-t-xl transition-all duration-1000 shadow-[0_0_30px_rgba(255,255,255,0.1)]" 
                                            style={{ backgroundColor: point.color, height: `${heightPct}%` }}
                                        />
                                        <span className="text-2xl font-bold text-white/80 font-[Vazirmatn] mt-4">{point.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            }

            default:
                return (
                    <div className="w-full h-full flex items-center justify-center bg-black">
                        <h1 className="text-4xl text-white">Unsupported Slide Type</h1>
                    </div>
                );
        }
    };

    return (
        <div className={cn("relative w-full h-full overflow-hidden shrink-0", className)}>
            {/* Resolution Scaling Container (Forces 16:9 1080p aspect internally for broadcast accuracy) */}
            <div className="absolute inset-0" style={{ containerType: 'size' }}>
                <div 
                    className="absolute"
                    style={{ 
                        width: '1920px', 
                        height: '1080px',
                        left: '50%',
                        top: '50%',
                        // Keep outer frame constrained to parent; zoom is applied inside the frame.
                        transform: 'translate(-50%, -50%) scale(min(calc(100cqw / 1920px), calc(100cqh / 1080px)))',
                        transformOrigin: 'center center'
                    }}
                >
                    <div className="w-[1920px] h-[1080px] bg-black overflow-hidden relative shadow-2xl">
                        <div
                            className="w-full h-full"
                            style={{
                                transform: `scale(${safeZoom})`,
                                transformOrigin: 'center center'
                            }}
                        >
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
