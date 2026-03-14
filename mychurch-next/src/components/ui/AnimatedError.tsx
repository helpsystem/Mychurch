"use client";

import { useState } from "react";
import { AlertTriangle, RefreshCw, Send, X, CheckCircle } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

interface AnimatedErrorProps {
  /** The error object or message string */
  error?: Error | string | null;
  /** Optional title override */
  title?: string;
  /** Show a retry button — call this to retry the failed action */
  onRetry?: () => void;
  /** Show a dismiss button */
  onDismiss?: () => void;
  /** Code hint shown in a monospace block */
  code?: string;
  /** Variant: 'page' fills screen, 'inline' is a card */
  variant?: "page" | "inline" | "toast";
  className?: string;
}

const TRANSLATIONS = {
  en: {
    title: "Something went wrong",
    retry: "Try Again",
    report: "Report to Admin",
    dismiss: "Dismiss",
    sending: "Sending...",
    sent: "Reported!",
    reportedMsg: "Error has been reported to the admin team.",
    codeLbl: "Error details",
  },
  fa: {
    title: "مشکلی پیش آمد",
    retry: "تلاش مجدد",
    report: "گزارش به ادمین",
    dismiss: "بستن",
    sending: "در حال ارسال...",
    sent: "گزارش شد!",
    reportedMsg: "خطا به تیم ادمین گزارش داده شد.",
    codeLbl: "جزئیات خطا",
  },
};

export function AnimatedError({
  error,
  title,
  onRetry,
  onDismiss,
  code,
  variant = "inline",
  className = "",
}: AnimatedErrorProps) {
  const { language } = useLanguage();
  const isRtl = language === "fa";
  const t = TRANSLATIONS[isRtl ? "fa" : "en"];

  const [reportState, setReportState] = useState<"idle" | "sending" | "sent">("idle");

  const errorMsg =
    typeof error === "string"
      ? error
      : error instanceof Error
      ? error.message
      : null;

  const handleReport = async () => {
    setReportState("sending");
    try {
      await fetch("/api/admin/report-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: errorMsg,
          code,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      });
    } catch {
      // Best-effort — don't fail on report failure
    } finally {
      setReportState("sent");
      setTimeout(() => setReportState("idle"), 4000);
    }
  };

  const content = (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className={`
        flex flex-col items-center gap-5 text-center
        animate-in fade-in slide-in-from-bottom-4 duration-500
        ${variant === "page" ? "min-h-[60vh] justify-center px-4" : ""}
        ${className}
      `}
    >
      {/* Animated warning icon */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/10">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
      </div>

      {/* Title */}
      <div className="space-y-1">
        <h3 className="text-lg font-black text-slate-100 tracking-tight">
          {title ?? t.title}
        </h3>
        {errorMsg && (
          <p className="text-sm text-slate-400 max-w-md leading-relaxed">
            {errorMsg}
          </p>
        )}
      </div>

      {/* Code block */}
      {code && (
        <details className="w-full max-w-lg text-left">
          <summary className="text-xs font-bold uppercase tracking-widest text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
            {t.codeLbl}
          </summary>
          <pre className="mt-2 p-3 bg-black/40 rounded-xl border border-white/10 text-xs text-red-300 overflow-x-auto font-mono whitespace-pre-wrap">
            {code}
          </pre>
        </details>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            {t.retry}
          </button>
        )}

        {reportState === "sent" ? (
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold animate-in fade-in duration-300">
            <CheckCircle className="w-4 h-4" />
            {t.sent}
          </div>
        ) : (
          <button
            onClick={handleReport}
            disabled={reportState === "sending"}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {reportState === "sending" ? t.sending : t.report}
          </button>
        )}

        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label={t.dismiss}
            className="flex items-center gap-1.5 px-4 py-2.5 text-slate-500 hover:text-slate-300 text-sm font-bold rounded-xl hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
            {t.dismiss}
          </button>
        )}
      </div>

      {reportState === "sent" && (
        <p className="text-xs text-slate-500 animate-in fade-in duration-300">
          {t.reportedMsg}
        </p>
      )}
    </div>
  );

  if (variant === "page") {
    return <div className="flex flex-col items-center justify-center w-full">{content}</div>;
  }

  if (variant === "toast") {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4">
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-red-500/30 rounded-2xl p-4 shadow-2xl shadow-red-500/10">
          {content}
        </div>
      </div>
    );
  }

  // inline card
  return (
    <div className="w-full rounded-2xl bg-red-500/5 border border-red-500/20 p-8">
      {content}
    </div>
  );
}

// ─── Lightweight error boundary wrapper ──────────────────────────────────────
import React from "react";

interface ErrorBoundaryState { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <AnimatedError
          error={this.state.error}
          variant="inline"
          onRetry={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }
    return this.props.children;
  }
}
