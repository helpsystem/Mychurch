"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import SlideBuilder from "@/components/broadcast/SlideBuilder";
import { BroadcastSession, AppLanguage, Slide } from "@/types/broadcast";
import { savePresentation } from "@/actions/presentations";
import { ArrowRight, CalendarDays, Loader2, Save, BookOpen, MonitorPlay } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useLanguage } from "@/providers/LanguageProvider";
import { SlideRenderer } from "@/components/broadcast/SlideRenderer";
import { useRouter } from "next/navigation";
import TemplateManager from "@/components/broadcast/TemplateManager";

type SerializedBroadcastSession = Omit<BroadcastSession, "date"> & {
    date: string;
};

export default function BuilderClientWrapper({ initialSession }: { initialSession: SerializedBroadcastSession }) {
    const [session, setSession] = useState<BroadcastSession>(() => ({
        ...initialSession,
        date: new Date(initialSession.date),
    }));
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);
    const [isPending, startTransition] = useTransition();
    const [isOpeningPresenter, setIsOpeningPresenter] = useState(false);
    const [templateModalOpen, setTemplateModalOpen] = useState(false);
    const viewerChannelRef = useRef<BroadcastChannel | null>(null);
    const { t, language } = useLanguage();
    const router = useRouter();

    useEffect(() => {
        const sessionId = session.id;
        if (!sessionId) {
            viewerChannelRef.current?.close();
            viewerChannelRef.current = null;
            return;
        }

        const channel = new BroadcastChannel(`broadcast-console-${sessionId}`);
        viewerChannelRef.current = channel;

        const pushFullState = () => {
            const currentSlide = session.slides[activeSlideIndex] || null;
            channel.postMessage({
                type: "full_state",
                payload: {
                    currentSlide,
                    slideIndex: activeSlideIndex,
                    internalPageIndex: 0,
                    config: null
                }
            });
        };

        channel.onmessage = (event) => {
            if (event.data?.type === "viewer_ready") {
                pushFullState();
            }
        };

        pushFullState();

        return () => {
            channel.close();
        };
    }, [session.id, session.slides, activeSlideIndex]);

    useEffect(() => {
        if (!session.id || !viewerChannelRef.current) return;
        const currentSlide = session.slides[activeSlideIndex] || null;
        viewerChannelRef.current.postMessage({
            type: "slide_change",
            payload: {
                slide: currentSlide,
                index: activeSlideIndex,
                internalPageIndex: 0
            }
        });
    }, [session.id, session.slides, activeSlideIndex]);

    const statusInfo: Record<BroadcastSession["status"], { label: string; description: string }> = {
        draft: {
            label: "پیش نویس",
            description: "برای آماده سازی اولیه اسلایدها و ویرایش مداوم قبل از تایید نهایی.",
        },
        ready: {
            label: "آماده پخش",
            description: "محتوا نهایی شده و آماده اجرا در برنامه زنده است.",
        },
        live: {
            label: "زنده",
            description: "این جلسه همین الان در پخش یا ارائه فعال استفاده می شود.",
        },
        ended: {
            label: "آرشیو",
            description: "جلسه تمام شده و برای مراجعه بعدی، گزارش و استفاده مجدد نگهداری می شود.",
        },
    };

    const formatDateForInput = (value: Date | string) => {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    const handleDateChange = (nextDate: string) => {
        if (!nextDate) return;
        const [y, m, d] = nextDate.split("-").map(Number);
        const base = session.date instanceof Date ? new Date(session.date) : new Date(session.date);
        base.setFullYear(y, (m || 1) - 1, d || 1);
        setSession({ ...session, date: base });
    };


    const handleSave = () => {
        startTransition(async () => {
             const res = await savePresentation(session);
             if (!res.success) {
                 toast.error(res.error || t.saveError || "Error");
                 return;
             }

             if (res.serverSaved) {
                 const statusLabel = statusInfo[session.status]?.label || "وضعیت نامشخص";
                 toast.success(`ذخیره شد: ${statusLabel}`);

                 if (session.status === "ready" || session.status === "live") {
                     try {
                         const tokenRes = await fetch('/api/broadcast/viewer-token', {
                             method: 'POST',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({ sessionId: session.id }),
                         });

                         const tokenData = await tokenRes.json();
                         if (!tokenRes.ok || !tokenData?.token) {
                             throw new Error(tokenData?.error || 'token_failed');
                         }

                         router.push(`/broadcast/view?session=${encodeURIComponent(session.id)}&token=${encodeURIComponent(tokenData.token)}`);
                         return;
                     } catch {
                         toast.error("ذخیره انجام شد اما لینک Viewer امن ساخته نشد.");
                         return;
                     }
                 }

                 return;
             }

             toast.error(res.error || "ذخیره در سرور انجام نشد. در همین صفحه بمانید و دوباره تلاش کنید.");
        });
    };

    const handleOpenPresenter = async () => {
        if (!session.id) {
            toast.error("شناسه ارائه نامعتبر است.");
            return;
        }

        setIsOpeningPresenter(true);
        try {
            const tokenRes = await fetch('/api/broadcast/viewer-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: session.id }),
            });
            const tokenData = await tokenRes.json();

            if (!tokenRes.ok || !tokenData?.token) {
                throw new Error(tokenData?.error || 'token_failed');
            }

            const url = `/broadcast/view?session=${encodeURIComponent(session.id)}&token=${encodeURIComponent(tokenData.token)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
            toast.success(language === 'fa' ? 'Presenter باز شد' : 'Presenter opened');
        } catch {
            toast.error(language === 'fa' ? 'ساخت لینک Presenter ناموفق بود.' : 'Failed to open presenter link.');
        } finally {
            setIsOpeningPresenter(false);
        }
    };

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-[Vazirmatn]">
            {/* Top Toolbar for Cloud Sync */}
            <div className="h-14 bg-black border-b border-indigo-500/30 flex items-center justify-between px-6 px-4 z-50 shadow-md">
                <div className="flex items-center gap-4">
                    <Link href="/admin/presentations" className="text-muted-foreground hover:text-white transition-colors flex items-center gap-2 text-sm">
                        <ArrowRight className="w-4 h-4" /> {t.backToFiles || 'Back'}
                    </Link>
                    <div className="h-4 w-px bg-white/20 mx-2" />
                    <input 
                        type="text"
                        value={session.title}
                        onChange={(e) => setSession({...session, title: e.target.value})}
                        className="bg-transparent text-white font-bold outline-none border-b border-transparent hover:border-white/20 focus:border-indigo-500 transition-colors py-1 px-2 rounded"
                        placeholder={t.presentationName || "Name..."}
                    />
                    <div className="flex items-center gap-2 bg-neutral-900 border border-white/20 rounded-md px-2 py-1.5">
                        <CalendarDays className="w-4 h-4 text-indigo-300" />
                        <input
                            type="date"
                            value={formatDateForInput(session.date)}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="bg-transparent text-xs text-slate-200 outline-none"
                            aria-label="Session Date"
                        />
                    </div>
                    <select 
                        title="Presentation Status"
                        value={session.status}
                        onChange={(e) => setSession({...session, status: e.target.value as any})}
                        className="bg-neutral-900 border border-white/20 rounded-md text-xs px-2 py-1 text-muted-foreground focus:outline-none"
                    >
                        <option value="draft">{statusInfo.draft.label}</option>
                        <option value="ready">{statusInfo.ready.label}</option>
                        <option value="live">{statusInfo.live.label}</option>
                        <option value="ended">{statusInfo.ended.label}</option>
                    </select>
                </div>
                
                <button 
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {t.cloudSave || 'Cloud Save'}
                </button>

                <button
                    onClick={handleOpenPresenter}
                    disabled={isOpeningPresenter}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                    {isOpeningPresenter ? <Loader2 className="w-4 h-4 animate-spin" /> : <MonitorPlay className="w-4 h-4" />}
                    {language === 'fa' ? 'باز کردن Presenter' : 'Open Presenter'}
                </button>

                <div className="flex items-center gap-2 ml-4">
                    <button 
                        onClick={() => setTemplateModalOpen(true)}
                        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-amber-500/20"
                    >
                        <BookOpen className="w-4 h-4" />
                        {language === 'fa' ? '💾 نمونه' : '💾 Templates'}
                    </button>
                </div>
            </div>

            <div className="h-10 bg-slate-900/70 border-b border-slate-800 px-6 flex items-center text-xs text-slate-300">
                <span className="font-bold text-indigo-300 ml-2">{statusInfo[session.status].label}:</span>
                <span>{statusInfo[session.status].description}</span>
            </div>

            <div className="flex flex-1 overflow-hidden" dir={language === 'fa' ? 'rtl' : 'ltr'}>
                <SlideBuilder 
                    session={session}
                    setSession={setSession}
                    lang={language as AppLanguage}
                    activeSlideIndex={activeSlideIndex}
                    onSlideSelect={setActiveSlideIndex}
                />
                
                {/* Advanced Live Preview Hub */}
                <div className="flex-1 bg-neutral-950 flex flex-col items-center justify-center p-8 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0.1))] relative overflow-hidden">
                     <div className="absolute inset-0 bg-indigo-500/5 mix-blend-overlay pointer-events-none" />

                     
                     {/* Preview Wrapper forces 16:9 aspect ratio - perfectly centered */}
                     <div className="relative w-screen h-screen flex items-center justify-center" style={{width: '100%', height: '100%'}}>
                          <div className="relative w-full aspect-video bg-black rounded-3xl border-4 border-neutral-800 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden group max-w-5xl">
                               {session.slides.length > 0 ? (
                                   <SlideRenderer 
                                       slide={session.slides[activeSlideIndex]} 
                                       isRemotePreview={true}
                                   />
                               ) : (
                                   <div className="text-center h-full w-full flex flex-col items-center justify-center bg-neutral-900 absolute top-0 left-0 z-10 transition-transform group-hover:scale-105">
                                       <div className="text-8xl mb-6 drop-shadow-2xl opacity-50">🎬</div>
                                       <h2 className="text-3xl font-black text-white tracking-widest uppercase opacity-40">{t.emptySession || 'Empty Session'}</h2>
                                       <p className="text-indigo-400 font-bold mt-2 font-[Vazirmatn]">{t.addFirstSlide || 'Add first slide'}</p>
                                   </div>
                               )}
                               
                               {/* Subtle ambient glow effect radiating from behind */}
                               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -z-20" />
                          </div>
                     </div>
                </div>
            </div>

            {/* Template Manager Modal */}
            <TemplateManager
                isOpen={templateModalOpen}
                onClose={() => setTemplateModalOpen(false)}
                onLoadTemplate={(slides: Slide[]) => {
                    setSession({...session, slides});
                    setActiveSlideIndex(0);
                    setTemplateModalOpen(false);
                    toast.success(language === 'fa' ? 'نمونه بارگذاری شد' : 'Template loaded');
                }}
                onSaveTemplate={() => {
                    toast.success(language === 'fa' ? 'نمونه ذخیره شد' : 'Template saved');
                    setTemplateModalOpen(false);
                }}
                currentSlides={session.slides}
                isRTL={language === 'fa'}
            />
        </div>
    );
}
