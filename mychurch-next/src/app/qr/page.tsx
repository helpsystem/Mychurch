"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { QrCode, Download, Palette, Link2, Type, Image as ImageIcon, RefreshCw, Copy, Check } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useLanguage } from "@/providers/LanguageProvider";

// We'll use the qrcode library via CDN-style import
// Install: npm install qrcode (already in many Next.js setups)

const localDict = {
    en: {
        presets: [
            { label: "Homepage", value: "https://www.iranianchurchdc.com/" },
            { label: "Worship", value: "https://www.iranianchurchdc.com/worship" },
            { label: "Bible", value: "https://www.iranianchurchdc.com/bible" },
            { label: "Contact Us", value: "https://www.iranianchurchdc.com/contact" },
            { label: "Sermons", value: "https://www.iranianchurchdc.com/sermons" },
            { label: "Download App", value: "https://www.iranianchurchdc.com/download" },
        ],
        colors: ["Dark", "Light", "Blue", "Purple", "Green", "Gold"],
        defaultLabel: "Iranian Church of Washington",
        heading: "Create a Church QR Code",
        subheading: "Build QR codes for church cards, signage, and sharing information",
        qrContent: "QR Content",
        textPlaceholder: "Custom URL or text...",
        copy: "Copy",
        labelBelowQR: "Label Below QR",
        labelPlaceholder: "Text below the code (optional)",
        colorScheme: "Color Scheme",
        sizeLabel: "Size",
        sizeTitle: "QR Size",
        preview: "Preview",
        refresh: "Refresh",
        downloadPng: "Download PNG",
        qualityNote: "High-quality QR code (Error Correction: H) · suitable for printing",
        installLib: "To generate a QR code, install the library:",
    },
    fa: {
        presets: [
            { label: "صفحه اصلی", value: "https://www.iranianchurchdc.com/" },
            { label: "پرستش", value: "https://www.iranianchurchdc.com/worship" },
            { label: "کتاب مقدس", value: "https://www.iranianchurchdc.com/bible" },
            { label: "تماس با ما", value: "https://www.iranianchurchdc.com/contact" },
            { label: "موعظه‌ها", value: "https://www.iranianchurchdc.com/sermons" },
            { label: "دانلود اپ", value: "https://www.iranianchurchdc.com/download" },
        ],
        colors: ["تاریک", "روشن", "آبی", "بنفش", "سبز", "طلایی"],
        defaultLabel: "کلیسای ایرانیان واشنگتن",
        heading: "ساخت کد QR کلیسا",
        subheading: "کدهای QR برای کارت‌های کلیسا، تابلوها و اشتراک اطلاعات بسازید",
        qrContent: "محتوای QR",
        textPlaceholder: "آدرس یا متن دلخواه...",
        copy: "کپی",
        labelBelowQR: "برچسب زیر QR",
        labelPlaceholder: "متن زیر کد (اختیاری)",
        colorScheme: "رنگ‌بندی",
        sizeLabel: "اندازه",
        sizeTitle: "اندازه QR",
        preview: "پیش‌نمایش",
        refresh: "به‌روزرسانی",
        downloadPng: "دانلود PNG",
        qualityNote: "کد QR با کیفیت بالا (Error Correction: H) · مناسب برای چاپ",
        installLib: "برای تولید QR، کتابخانه را نصب کنید:",
    },
    es: {
        presets: [
            { label: "Página Principal", value: "https://www.iranianchurchdc.com/" },
            { label: "Adoración", value: "https://www.iranianchurchdc.com/worship" },
            { label: "Biblia", value: "https://www.iranianchurchdc.com/bible" },
            { label: "Contáctenos", value: "https://www.iranianchurchdc.com/contact" },
            { label: "Sermones", value: "https://www.iranianchurchdc.com/sermons" },
            { label: "Descargar App", value: "https://www.iranianchurchdc.com/download" },
        ],
        colors: ["Oscuro", "Claro", "Azul", "Morado", "Verde", "Dorado"],
        defaultLabel: "Iglesia Iraní de Washington",
        heading: "Crear un Código QR de la Iglesia",
        subheading: "Cree códigos QR para tarjetas de la iglesia, carteles y para compartir información",
        qrContent: "Contenido del QR",
        textPlaceholder: "URL o texto personalizado...",
        copy: "Copiar",
        labelBelowQR: "Etiqueta Debajo del QR",
        labelPlaceholder: "Texto debajo del código (opcional)",
        colorScheme: "Combinación de Colores",
        sizeLabel: "Tamaño",
        sizeTitle: "Tamaño del QR",
        preview: "Vista Previa",
        refresh: "Actualizar",
        downloadPng: "Descargar PNG",
        qualityNote: "Código QR de alta calidad (Corrección de Errores: H) · apto para impresión",
        installLib: "Para generar un código QR, instale la librería:",
    },
};

const COLOR_VALUES = [
    { fg: "#ffffff", bg: "#1a1a2e" },
    { fg: "#000000", bg: "#ffffff" },
    { fg: "#3b82f6", bg: "#ffffff" },
    { fg: "#8b5cf6", bg: "#1a1a2e" },
    { fg: "#10b981", bg: "#ffffff" },
    { fg: "#f59e0b", bg: "#1a1a2e" },
];

export default function QRStudioPage() {
    const { language, isRTL } = useLanguage();
    const d = localDict[language] || localDict.fa;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [text, setText] = useState("https://www.iranianchurchdc.com/");
    const [label, setLabel] = useState(d.defaultLabel);
    const [colorIndex, setColorIndex] = useState(0);
    const [size, setSize] = useState(300);
    const [copied, setCopied] = useState(false);
    const [qrGenerated, setQrGenerated] = useState(false);

    // Stable color values (identity doesn't change across renders); labels are
    // translated separately for display only, so they don't retrigger the QR effect.
    const colorSet = COLOR_VALUES[colorIndex];

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
                ctx.direction = isRTL ? "rtl" : "ltr";
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
            ctx.fillText(d.installLib, size / 2, size / 2 - 10);
            ctx.fillText("npm install qrcode", size / 2, size / 2 + 15);
            setQrGenerated(true);
        }
    }, [text, colorSet, size, label, isRTL, d.installLib]);

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
        <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
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
                        {d.heading}
                    </h1>
                    <p className="text-muted-foreground">{d.subheading}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Controls */}
                    <div className="space-y-5 animate-fade-in-up">
                        {/* URL Input */}
                        <div className="glass rounded-2xl p-5 space-y-4">
                            <h3 className="font-black flex items-center gap-2"><Link2 className="w-4 h-4 text-primary" /> {d.qrContent}</h3>
                            <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                    {d.presets.map(p => (
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
                                        placeholder={d.textPlaceholder}
                                        dir="ltr"
                                        title={d.qrContent}
                                    />
                                    <button onClick={handleCopyLink} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-secondary transition" title={d.copy}>
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Label */}
                        <div className="glass rounded-2xl p-5 space-y-3">
                            <h3 className="font-black flex items-center gap-2"><Type className="w-4 h-4 text-primary" /> {d.labelBelowQR}</h3>
                            <input
                                type="text"
                                value={label}
                                onChange={e => setLabel(e.target.value)}
                                className="w-full bg-secondary/50 border border-border/30 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                                placeholder={d.labelPlaceholder}
                                title={d.labelBelowQR}
                            />
                        </div>

                        {/* Colors */}
                        <div className="glass rounded-2xl p-5 space-y-3">
                            <h3 className="font-black flex items-center gap-2"><Palette className="w-4 h-4 text-primary" /> {d.colorScheme}</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {COLOR_VALUES.map((c, i) => (
                                    <button key={d.colors[i]} onClick={() => setColorIndex(i)}
                                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all btn-lift flex items-center gap-2
                                            ${colorIndex === i ? "border-primary ring-2 ring-primary/30" : "border-border/30 hover:border-primary/40"}`}
                                        style={{ backgroundColor: c.bg, color: c.fg }}
                                    >
                                        <span className="w-4 h-4 rounded border border-white/20 shrink-0" style={{ backgroundColor: c.fg }} />
                                        {d.colors[i]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Size */}
                        <div className="glass rounded-2xl p-5 space-y-3">
                            <h3 className="font-black flex items-center gap-2"><ImageIcon className="w-4 h-4 text-primary" /> {d.sizeLabel}: {size}×{size}</h3>
                            <input type="range" min="200" max="600" step="50" value={size} onChange={e => setSize(Number(e.target.value))}
                                className="w-full accent-primary" title={d.sizeTitle} />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>200px</span><span>600px</span>
                            </div>
                        </div>
                    </div>

                    {/* QR Preview */}
                    <div className="flex flex-col items-center gap-5 animate-fade-in-up">
                        <div className="glass rounded-3xl p-8 flex flex-col items-center gap-4 w-full">
                            <h3 className="font-black self-start">{d.preview}</h3>
                            <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/20">
                                <canvas ref={canvasRef} className="max-w-full" />
                            </div>
                        </div>

                        <div className="flex gap-3 w-full">
                            <button onClick={generateQR} className="flex-1 flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground font-bold px-6 py-3 rounded-2xl transition btn-lift">
                                <RefreshCw className="w-4 h-4" /> {d.refresh}
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={!qrGenerated}
                                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-2xl hover:bg-primary/90 transition disabled:opacity-50 btn-lift shadow-lg shadow-primary/20"
                            >
                                <Download className="w-4 h-4" /> {d.downloadPng}
                            </button>
                        </div>

                        <p className="text-xs text-muted-foreground text-center">
                            {d.qualityNote}
                        </p>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}
