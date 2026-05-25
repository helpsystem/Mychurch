"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { QrCode, Download, Palette, Link2, Type, Image as ImageIcon, RefreshCw, Copy, Check } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

// We'll use the qrcode library via CDN-style import
// Install: npm install qrcode (already in many Next.js setups)

const PRESETS = [
    { label: "صفحه اصلی", value: "https://www.iranianchurchdc.com/" },
    { label: "پرستش", value: "https://www.iranianchurchdc.com/worship" },
    { label: "کتاب مقدس", value: "https://www.iranianchurchdc.com/bible" },
    { label: "تماس با ما", value: "https://www.iranianchurchdc.com/contact" },
    { label: "موعظه‌ها", value: "https://www.iranianchurchdc.com/sermons" },
    { label: "دانلود اپ", value: "https://www.iranianchurchdc.com/download" },
];

const COLORS = [
    { fg: "#ffffff", bg: "#1a1a2e", label: "تاریک" },
    { fg: "#000000", bg: "#ffffff", label: "روشن" },
    { fg: "#3b82f6", bg: "#ffffff", label: "آبی" },
    { fg: "#8b5cf6", bg: "#1a1a2e", label: "بنفش" },
    { fg: "#10b981", bg: "#ffffff", label: "سبز" },
    { fg: "#f59e0b", bg: "#1a1a2e", label: "طلایی" },
];

export default function QRStudioPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [text, setText] = useState("https://www.iranianchurchdc.com/");
    const [label, setLabel] = useState("کلیسای ایرانیان واشنگتن");
    const [colorSet, setColorSet] = useState(COLORS[0]);
    const [size, setSize] = useState(300);
    const [copied, setCopied] = useState(false);
    const [qrGenerated, setQrGenerated] = useState(false);

    const generateQR = useCallback(async () => {
        if (!canvasRef.current || !text.trim()) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Dynamically import qrcode
        try {
            const QRCode = (await import("qrcode")).default;
            canvas.width = size;
            canvas.height = size + (label ? 44 : 0);

            ctx.fillStyle = colorSet.bg;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            await QRCode.toCanvas(canvas, text, {
                width: size,
                margin: 2,
                color: { dark: colorSet.fg, light: colorSet.bg },
                errorCorrectionLevel: "H",
            });

            if (label) {
                ctx.fillStyle = colorSet.bg;
                ctx.fillRect(0, size, canvas.width, 44);
                ctx.fillStyle = colorSet.fg;
                ctx.font = "bold 15px Vazirmatn, sans-serif";
                ctx.textAlign = "center";
                ctx.direction = "rtl";
                ctx.fillText(label, size / 2, size + 28);
            }
            setQrGenerated(true);
        } catch {
            // Fallback: draw placeholder
            ctx.fillStyle = colorSet.bg;
            ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = colorSet.fg;
            ctx.font = "14px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("برای تولید QR، کتابخانه را نصب کنید:", size / 2, size / 2 - 10);
            ctx.fillText("npm install qrcode", size / 2, size / 2 + 15);
            setQrGenerated(true);
        }
    }, [text, colorSet, size, label]);

    useEffect(() => { generateQR(); }, [generateQR]);

    const handleDownload = () => {
        if (!canvasRef.current) return;
        const link = document.createElement("a");
        link.download = `mychurch-qr-${Date.now()}.png`;
        link.href = canvasRef.current.toDataURL("image/png");
        link.click();
    };

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col" dir="rtl">
            <PublicHeader />
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-[120px]" />
            </div>

            <main className="flex-1 relative z-10 pt-32 pb-24 px-4 lg:px-12 max-w-5xl mx-auto w-full">
                {/* Header */}
                <div className="mb-10 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-sm font-bold border border-blue-500/20 mb-4">
                        <QrCode className="w-4 h-4" /> QR Studio
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/60 mb-3">
                        ساخت کد QR کلیسا
                    </h1>
                    <p className="text-muted-foreground">کدهای QR برای کارت‌های کلیسا، تابلوها و اشتراک اطلاعات بسازید</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Controls */}
                    <div className="space-y-5 animate-fade-in-up">
                        {/* URL Input */}
                        <div className="glass rounded-2xl p-5 space-y-4">
                            <h3 className="font-black flex items-center gap-2"><Link2 className="w-4 h-4 text-primary" /> محتوای QR</h3>
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    {PRESETS.map(p => (
                                        <button key={p.value} onClick={() => setText(p.value)}
                                            className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition-all btn-lift
                                                ${text === p.value ? "bg-primary text-primary-foreground border-primary" : "border-border/30 hover:border-primary/50 text-muted-foreground"}`}>
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={text}
                                        onChange={e => setText(e.target.value)}
                                        className="w-full bg-secondary/50 border border-border/30 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none pr-10"
                                        placeholder="آدرس یا متن دلخواه..."
                                        dir="ltr"
                                        title="محتوای QR"
                                    />
                                    <button onClick={handleCopyLink} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-secondary transition" title="کپی">
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Label */}
                        <div className="glass rounded-2xl p-5 space-y-3">
                            <h3 className="font-black flex items-center gap-2"><Type className="w-4 h-4 text-primary" /> برچسب زیر QR</h3>
                            <input
                                type="text"
                                value={label}
                                onChange={e => setLabel(e.target.value)}
                                className="w-full bg-secondary/50 border border-border/30 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                                placeholder="متن زیر کد (اختیاری)"
                                title="برچسب زیر QR"
                            />
                        </div>

                        {/* Colors */}
                        <div className="glass rounded-2xl p-5 space-y-3">
                            <h3 className="font-black flex items-center gap-2"><Palette className="w-4 h-4 text-primary" /> رنگ‌بندی</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {COLORS.map(c => (
                                    <button key={c.label} onClick={() => setColorSet(c)}
                                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all btn-lift flex items-center gap-2
                                            ${colorSet === c ? "border-primary ring-2 ring-primary/30" : "border-border/30 hover:border-primary/40"}`}
                                        style={{ backgroundColor: c.bg, color: c.fg }}
                                    >
                                        <span className="w-4 h-4 rounded border border-white/20 shrink-0" style={{ backgroundColor: c.fg }} />
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Size */}
                        <div className="glass rounded-2xl p-5 space-y-3">
                            <h3 className="font-black flex items-center gap-2"><ImageIcon className="w-4 h-4 text-primary" /> اندازه: {size}×{size}</h3>
                            <input type="range" min="200" max="600" step="50" value={size} onChange={e => setSize(Number(e.target.value))}
                                className="w-full accent-primary" title="اندازه QR" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>۲۰۰px</span><span>۶۰۰px</span>
                            </div>
                        </div>
                    </div>

                    {/* QR Preview */}
                    <div className="flex flex-col items-center gap-5 animate-fade-in-up">
                        <div className="glass rounded-3xl p-8 flex flex-col items-center gap-4 w-full">
                            <h3 className="font-black self-start">پیش‌نمایش</h3>
                            <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/20">
                                <canvas ref={canvasRef} className="max-w-full" />
                            </div>
                        </div>

                        <div className="flex gap-3 w-full">
                            <button onClick={generateQR} className="flex-1 flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground font-bold px-6 py-3 rounded-2xl transition btn-lift">
                                <RefreshCw className="w-4 h-4" /> به‌روزرسانی
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={!qrGenerated}
                                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-2xl hover:bg-primary/90 transition disabled:opacity-50 btn-lift shadow-lg shadow-primary/20"
                            >
                                <Download className="w-4 h-4" /> دانلود PNG
                            </button>
                        </div>

                        <p className="text-xs text-muted-foreground text-center">
                            کد QR با کیفیت بالا (Error Correction: H) · مناسب برای چاپ
                        </p>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}
