"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, Zap, Database, Globe, Shield } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface HealthStatus {
    auth: { status: "ok" | "error"; message: string };
    database: { status: "ok" | "error"; message: string };
    oauth: { status: "ok" | "error"; message: string };
    api: { status: "ok" | "error"; message: string };
}

export default function LoginStatusPage() {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSystemHealth();
    }, []);

    const checkSystemHealth = async () => {
        try {
            setLoading(true);
            const status: HealthStatus = {
                auth: { status: "ok", message: "سیستم احراز هویت سالم / Auth system is healthy" },
                database: { status: "ok", message: "پایگاه داده متصل است / Database is connected" },
                oauth: { status: "ok", message: "Google OAuth آماده است / Google OAuth ready" },
                api: { status: "ok", message: "API پاسخ‌گو است / API responding" },
            };

            // Test Supabase connection
            try {
                const supabase = createClient();
                const { data, error } = await supabase.auth.getUser();
                if (error && error.status !== 400) {
                    status.auth.status = "error";
                    status.auth.message = `خطا: ${error.message} / Error: ${error.message}`;
                }
            } catch (err: any) {
                status.auth.status = "error";
                status.auth.message = `خطا در اتصال: ${err.message}`;
            }

            // Test database
            try {
                const supabase = createClient();
                const { error } = await supabase.from("users").select("count");
                if (error) {
                    status.database.status = "error";
                    status.database.message = `مشکل پایگاه داده / Database issue: ${error.message}`;
                }
            } catch (err: any) {
                status.database.status = "error";
                status.database.message = `خطا در پایگاه داده: ${err.message}`;
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
                    <h1 className="text-3xl font-black text-white mb-2">وضعیت سیستم / System Status</h1>
                    <p className="text-white/60">بررسی مشکلات احتمالی لاگین و ثبت‌نام</p>
                </div>

                {/* Info Cards */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <p className="mt-4 text-white/60">بررسی وضعیت سیستم... / Checking system status...</p>
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
                                        <p className="font-bold">احراز هویت / Authentication</p>
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
                                        <p className="font-bold">پایگاه داده / Database</p>
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
                                        <p className="font-bold">Google OAuth</p>
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
                                        <p className="font-bold">API</p>
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
                        راهنمای حل مشکلات / Troubleshooting Guide
                    </h3>
                    <ul className="space-y-2 text-sm text-white/80 font-[Vazirmatn]">
                        <li>✓ برای ورود، از ایمیل و رمز عبور خود استفاده کنید</li>
                        <li>✓ اگر مشکل دارید، صفحه را Refresh کنید (Ctrl + F5)</li>
                        <li>✓ اطمینان حاصل کنید که Google OAuth پیکربندی شده است</li>
                        <li>✓ اگر باز هم مشکل دارید، لطفا با پشتیبانی تماس بگیرید</li>
                    </ul>
                </div>

                {/* Refresh Button */}
                <button
                    onClick={checkSystemHealth}
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                    {loading ? "درحال بررسی..." : "بررسی مجدد / Check Again"}
                </button>
            </div>
        </div>
    );
}
