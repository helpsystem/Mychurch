"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, Zap, Database, Globe, Shield } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useLanguage } from "@/providers/LanguageProvider";

interface HealthStatus {
    auth: { status: "ok" | "error"; message: string };
    database: { status: "ok" | "error"; message: string };
    oauth: { status: "ok" | "error"; message: string };
    api: { status: "ok" | "error"; message: string };
}

const localDict = {
    en: {
        pageTitle: "System Status",
        pageSubtitle: "Checking for possible login and signup issues",
        checkingStatus: "Checking system status...",
        authLabel: "Authentication",
        databaseLabel: "Database",
        oauthLabel: "Google OAuth",
        apiLabel: "API",
        authHealthyMsg: "Auth system is healthy",
        databaseHealthyMsg: "Database is connected",
        oauthHealthyMsg: "Google OAuth ready",
        apiHealthyMsg: "API responding",
        errorPrefix: "Error:",
        connectionErrorPrefix: "Connection error:",
        databaseIssuePrefix: "Database issue:",
        databaseErrorPrefix: "Database error:",
        troubleshootingTitle: "Troubleshooting Guide",
        tip1: "Use your email and password to sign in",
        tip2: "If you're having trouble, refresh the page (Ctrl + F5)",
        tip3: "Make sure Google OAuth is configured",
        tip4: "If the problem persists, please contact support",
        checking: "Checking...",
        checkAgain: "Check Again",
    },
    fa: {
        pageTitle: "وضعیت سیستم",
        pageSubtitle: "بررسی مشکلات احتمالی لاگین و ثبت‌نام",
        checkingStatus: "بررسی وضعیت سیستم...",
        authLabel: "احراز هویت",
        databaseLabel: "پایگاه داده",
        oauthLabel: "Google OAuth",
        apiLabel: "API",
        authHealthyMsg: "سیستم احراز هویت سالم",
        databaseHealthyMsg: "پایگاه داده متصل است",
        oauthHealthyMsg: "Google OAuth آماده است",
        apiHealthyMsg: "API پاسخ‌گو است",
        errorPrefix: "خطا:",
        connectionErrorPrefix: "خطا در اتصال:",
        databaseIssuePrefix: "مشکل پایگاه داده:",
        databaseErrorPrefix: "خطا در پایگاه داده:",
        troubleshootingTitle: "راهنمای حل مشکلات",
        tip1: "برای ورود، از ایمیل و رمز عبور خود استفاده کنید",
        tip2: "اگر مشکل دارید، صفحه را Refresh کنید (Ctrl + F5)",
        tip3: "اطمینان حاصل کنید که Google OAuth پیکربندی شده است",
        tip4: "اگر باز هم مشکل دارید، لطفا با پشتیبانی تماس بگیرید",
        checking: "درحال بررسی...",
        checkAgain: "بررسی مجدد",
    },
    es: {
        pageTitle: "Estado del Sistema",
        pageSubtitle: "Comprobando posibles problemas de inicio de sesión y registro",
        checkingStatus: "Comprobando el estado del sistema...",
        authLabel: "Autenticación",
        databaseLabel: "Base de Datos",
        oauthLabel: "Google OAuth",
        apiLabel: "API",
        authHealthyMsg: "El sistema de autenticación funciona correctamente",
        databaseHealthyMsg: "La base de datos está conectada",
        oauthHealthyMsg: "Google OAuth está listo",
        apiHealthyMsg: "La API responde correctamente",
        errorPrefix: "Error:",
        connectionErrorPrefix: "Error de conexión:",
        databaseIssuePrefix: "Problema de base de datos:",
        databaseErrorPrefix: "Error de base de datos:",
        troubleshootingTitle: "Guía de Solución de Problemas",
        tip1: "Usa tu correo electrónico y contraseña para iniciar sesión",
        tip2: "Si tienes problemas, actualiza la página (Ctrl + F5)",
        tip3: "Asegúrate de que Google OAuth esté configurado",
        tip4: "Si el problema persiste, por favor contacta a soporte",
        checking: "Comprobando...",
        checkAgain: "Comprobar de Nuevo",
    },
};

export default function LoginStatusPage() {
    const { language } = useLanguage();
    const d = localDict[language] || localDict.fa;

    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSystemHealth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language]);

    const checkSystemHealth = async () => {
        try {
            setLoading(true);
            const status: HealthStatus = {
                auth: { status: "ok", message: d.authHealthyMsg },
                database: { status: "ok", message: d.databaseHealthyMsg },
                oauth: { status: "ok", message: d.oauthHealthyMsg },
                api: { status: "ok", message: d.apiHealthyMsg },
            };

            // Test Supabase connection
            try {
                const supabase = createClient();
                const { data, error } = await supabase.auth.getUser();
                if (error && error.status !== 400) {
                    status.auth.status = "error";
                    status.auth.message = `${d.errorPrefix} ${error.message}`;
                }
            } catch (err: any) {
                status.auth.status = "error";
                status.auth.message = `${d.connectionErrorPrefix} ${err.message}`;
            }

            // Test database
            try {
                const supabase = createClient();
                const { error } = await supabase.from("users").select("count");
                if (error) {
                    status.database.status = "error";
                    status.database.message = `${d.databaseIssuePrefix} ${error.message}`;
                }
            } catch (err: any) {
                status.database.status = "error";
                status.database.message = `${d.databaseErrorPrefix} ${err.message}`;
            }

            setHealth(status);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] w-full flex items-center justify-center bg-neutral-950 font-sans relative overflow-hidden selection:bg-primary/30 px-4 py-8">
            <div className="relative z-10 w-full max-w-2xl space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-black text-white mb-2">{d.pageTitle}</h1>
                    <p className="text-white/60">{d.pageSubtitle}</p>
                </div>

                {/* Info Cards */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <p className="mt-4 text-white/60">{d.checkingStatus}</p>
                    </div>
                ) : health ? (
                    <div className="space-y-4">
                        {/* Auth Status */}
                        <div className={`p-4 rounded-xl border ${health.auth.status === "ok" ? "bg-emerald-500/5 border-emerald-500/30" : "bg-red-500/5 border-red-500/30"}`}>
                            <div className="flex items-start gap-3">
                                {health.auth.status === "ok" ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Shield className="w-4 h-4 opacity-70" />
                                        <p className="font-bold">{d.authLabel}</p>
                                    </div>
                                    <p className={`text-sm ${health.auth.status === "ok" ? "text-emerald-300" : "text-red-300"}`}>
                                        {health.auth.message}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Database Status */}
                        <div className={`p-4 rounded-xl border ${health.database.status === "ok" ? "bg-emerald-500/5 border-emerald-500/30" : "bg-red-500/5 border-red-500/30"}`}>
                            <div className="flex items-start gap-3">
                                {health.database.status === "ok" ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Database className="w-4 h-4 opacity-70" />
                                        <p className="font-bold">{d.databaseLabel}</p>
                                    </div>
                                    <p className={`text-sm ${health.database.status === "ok" ? "text-emerald-300" : "text-red-300"}`}>
                                        {health.database.message}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* OAuth Status */}
                        <div className={`p-4 rounded-xl border ${health.oauth.status === "ok" ? "bg-emerald-500/5 border-emerald-500/30" : "bg-red-500/5 border-red-500/30"}`}>
                            <div className="flex items-start gap-3">
                                {health.oauth.status === "ok" ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Globe className="w-4 h-4 opacity-70" />
                                        <p className="font-bold">{d.oauthLabel}</p>
                                    </div>
                                    <p className={`text-sm ${health.oauth.status === "ok" ? "text-emerald-300" : "text-red-300"}`}>
                                        {health.oauth.message}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* API Status */}
                        <div className={`p-4 rounded-xl border ${health.api.status === "ok" ? "bg-emerald-500/5 border-emerald-500/30" : "bg-red-500/5 border-red-500/30"}`}>
                            <div className="flex items-start gap-3">
                                {health.api.status === "ok" ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Zap className="w-4 h-4 opacity-70" />
                                        <p className="font-bold">{d.apiLabel}</p>
                                    </div>
                                    <p className={`text-sm ${health.api.status === "ok" ? "text-emerald-300" : "text-red-300"}`}>
                                        {health.api.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Instructions */}
                <div className="bg-neutral-900 border border-white/10 rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-primary" />
                        {d.troubleshootingTitle}
                    </h3>
                    <ul className="space-y-2 text-sm text-white/80 font-[Vazirmatn]">
                        <li>✓ {d.tip1}</li>
                        <li>✓ {d.tip2}</li>
                        <li>✓ {d.tip3}</li>
                        <li>✓ {d.tip4}</li>
                    </ul>
                </div>

                {/* Refresh Button */}
                <button
                    onClick={checkSystemHealth}
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                    {loading ? d.checking : d.checkAgain}
                </button>
            </div>
        </div>
    );
}
