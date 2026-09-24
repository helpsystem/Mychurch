"use client";

import React, { useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";

// Auto-redirect page that calls restore-access then goes to /admin
// Note: this page renders its own <html>/<body> (pre-existing behavior, not
// changed here) — it is a standalone admin/leader recovery utility, not part
// of normal site navigation.

const localDict = {
    en: {
        pageTitle: "Restore Admin Access | Restore Admin Access",
        heading: "Restore Admin Access",
        body: "If you're seeing an \"Access Denied\" error, click the button below to instantly restore your access.",
        loginFirstNote: "You must be logged in to the site first.",
        restoreButton: "🔓 Restore Access and Enter Panel",
        restoringButton: "⏳ Restoring access...",
        successButton: "✅ Success! Redirecting to panel...",
        retryButton: "🔓 Try Again",
        warning: "⚠️ This page is only usable by admins and site leaders.",
        unknownError: "Unknown error",
        connectionError: "Error connecting to the server",
    },
    fa: {
        pageTitle: "بازیابی دسترسی مدیریت | Restore Admin Access",
        heading: "بازیابی دسترسی مدیریت",
        body: "اگر با خطای «عدم دسترسی» مواجه شده‌اید، روی دکمه زیر کلیک کنید تا دسترسی شما فوراً بازیابی شود.",
        loginFirstNote: "ابتدا باید در سایت لاگین کرده باشید.",
        restoreButton: "🔓 بازیابی دسترسی و ورود به پنل",
        restoringButton: "⏳ در حال بازیابی دسترسی...",
        successButton: "✅ موفق! در حال انتقال به پنل...",
        retryButton: "🔓 تلاش مجدد",
        warning: "⚠️ این صفحه فقط برای ادمین‌ها و رهبران سایت قابل استفاده است.",
        unknownError: "خطای ناشناخته",
        connectionError: "خطا در اتصال به سرور",
    },
    es: {
        pageTitle: "Restaurar Acceso de Administrador | Restore Admin Access",
        heading: "Restaurar Acceso de Administrador",
        body: "Si ves un error de \"Acceso Denegado\", haz clic en el botón de abajo para restaurar tu acceso al instante.",
        loginFirstNote: "Primero debes haber iniciado sesión en el sitio.",
        restoreButton: "🔓 Restaurar Acceso y Entrar al Panel",
        restoringButton: "⏳ Restaurando acceso...",
        successButton: "✅ ¡Listo! Redirigiendo al panel...",
        retryButton: "🔓 Intentar de Nuevo",
        warning: "⚠️ Esta página solo puede ser usada por administradores y líderes del sitio.",
        unknownError: "Error desconocido",
        connectionError: "Error al conectar con el servidor",
    },
};

type Status = { kind: "idle" | "success" | "error"; text: string };

export default function RestoreAccessPage() {
    const { language, isRTL } = useLanguage();
    const d = localDict[language] || localDict.fa;

    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [status, setStatus] = useState<Status>({ kind: "idle", text: "" });

    const restoreAccess = async () => {
        setLoading(true);
        setStatus({ kind: "idle", text: "" });
        try {
            const res = await fetch("/api/admin/restore-access");
            const data = await res.json();
            if (data.success) {
                setStatus({ kind: "success", text: `✅ ${data.message}` });
                setDone(true);
                setTimeout(() => {
                    window.location.href = "/admin";
                }, 1500);
            } else {
                setStatus({ kind: "error", text: `❌ ${data.error || d.unknownError}` });
                setLoading(false);
            }
        } catch (e) {
            setStatus({ kind: "error", text: `❌ ${d.connectionError}` });
            setLoading(false);
        }
    };

    let buttonLabel = d.restoreButton;
    if (done) buttonLabel = d.successButton;
    else if (loading) buttonLabel = d.restoringButton;
    else if (status.kind === "error") buttonLabel = d.retryButton;

    return (
        <html lang={language} dir={isRTL ? "rtl" : "ltr"}>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>{d.pageTitle}</title>
                <style>{`
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        background: #09090b;
                        color: #fff;
                        font-family: 'Vazirmatn', Tahoma, sans-serif;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .card {
                        background: #1c1917;
                        border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 24px;
                        padding: 40px;
                        max-width: 480px;
                        width: 100%;
                        text-align: center;
                        box-shadow: 0 25px 50px rgba(0,0,0,0.5);
                    }
                    .icon { font-size: 48px; margin-bottom: 16px; }
                    h1 { font-size: 22px; font-weight: 900; margin-bottom: 8px; }
                    p { color: #a1a1aa; font-size: 14px; margin-bottom: 24px; line-height: 1.6; }
                    button {
                        background: #f59e0b;
                        color: #000;
                        border: none;
                        padding: 14px 32px;
                        border-radius: 14px;
                        font-size: 16px;
                        font-weight: 900;
                        cursor: pointer;
                        width: 100%;
                        transition: all 0.2s;
                        font-family: inherit;
                    }
                    button:hover { background: #d97706; transform: scale(0.99); }
                    button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
                    .status { margin-top: 20px; font-size: 13px; min-height: 20px; }
                    .success { color: #34d399; }
                    .error { color: #f87171; }
                    .warning { color: #fbbf24; margin-top: 16px; font-size: 12px; }
                `}</style>
            </head>
            <body>
                <div className="card">
                    <div className="icon">🛡️</div>
                    <h1>{d.heading}</h1>
                    <p>
                        {d.body}
                        <br /><br />
                        <small style={{ color: '#71717a' }}>{d.loginFirstNote}</small>
                    </p>
                    <button
                        id="restoreBtn"
                        onClick={restoreAccess}
                        disabled={loading || done}
                    >
                        {buttonLabel}
                    </button>
                    <div className={`status ${status.kind === "success" ? "success" : status.kind === "error" ? "error" : ""}`} id="status">
                        {status.text}
                    </div>
                    <p className="warning">{d.warning}</p>
                </div>
            </body>
        </html>
    );
}
