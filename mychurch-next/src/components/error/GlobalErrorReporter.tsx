"use client";

import { useEffect } from "react";

type ReportPayload = {
  message: string;
  code?: string | null;
  stack?: string | null;
  url?: string;
  timestamp?: string;
  userAgent?: string;
  source?: string;
};

const REPORT_ENDPOINT = "/api/admin/report-error";
const DEDUPE_WINDOW_MS = 15000;

function normalizeMessage(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value ?? "Unknown client error");
  }
}

function isChunkLoadMessage(message: string): boolean {
  const text = message.toLowerCase();
  return (
    text.includes("loading chunk") ||
    text.includes("chunkloaderror") ||
    text.includes("failed to fetch dynamically imported module") ||
    text.includes("importing a module script failed")
  );
}

function buildCodeHint(message: string): string {
  if (isChunkLoadMessage(message)) {
    return "CHUNK_LOAD_FAILURE";
  }
  return "RUNTIME_CLIENT_ERROR";
}

export default function GlobalErrorReporter() {
  useEffect(() => {
    let lastFingerprint = "";
    let lastSentAt = 0;

    const report = (payload: ReportPayload) => {
      const now = Date.now();
      const fingerprint = `${payload.source || "unknown"}::${payload.code || "none"}::${payload.message}`;
      if (fingerprint === lastFingerprint && now - lastSentAt < DEDUPE_WINDOW_MS) {
        return;
      }

      lastFingerprint = fingerprint;
      lastSentAt = now;

      const body = {
        message: payload.message || "Unknown client error",
        code: payload.code || null,
        stack: payload.stack || null,
        url: payload.url || window.location.href,
        timestamp: payload.timestamp || new Date().toISOString(),
        userAgent: payload.userAgent || navigator.userAgent,
        source: payload.source || "window.error",
      };

      fetch(REPORT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => {
        // Best effort only.
      });
    };

    const onWindowError = (event: ErrorEvent) => {
      const message = normalizeMessage(event.error || event.message);
      report({
        message,
        code: buildCodeHint(message),
        stack: event.error?.stack || null,
        source: "window.error",
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const rawReason = event.reason;
      const message = normalizeMessage(rawReason);
      const stack = rawReason instanceof Error ? rawReason.stack : null;
      report({
        message,
        code: buildCodeHint(message),
        stack,
        source: "window.unhandledrejection",
      });
    };

    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
