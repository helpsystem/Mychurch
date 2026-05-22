"use client";

import { useEffect } from "react";
import Error500Animated from "@/components/ui/Error500Animated";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global Error Boundary Caught:", error);

        if (typeof window !== "undefined") {
            const errorMsg = (error?.message || "").toLowerCase();
            const errorStack = (error?.stack || "").toLowerCase();
            const isChunkError =
                errorMsg.includes("chunk") ||
                errorMsg.includes("loading") ||
                errorMsg.includes("failed to fetch") ||
                errorMsg.includes("dynamically imported module") ||
                errorMsg.includes("server action") ||
                errorStack.includes("chunk") ||
                errorStack.includes("loading");

            if (isChunkError) {
                try {
                    const lastReload = sessionStorage.getItem("last-chunk-reload");
                    const now = Date.now();
                    // Reload at most once every 15 seconds to prevent loop
                    if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
                        sessionStorage.setItem("last-chunk-reload", now.toString());
                        console.warn("Stale client assets or server actions detected. Reloading page...");
                        window.location.reload();
                        return;
                    }
                } catch (e) {
                    console.error("Failed to execute chunk error auto-reload:", e);
                }
            }
        }

        fetch("/api/admin/report-error", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            keepalive: true,
            body: JSON.stringify({
                message: error?.message || "Global error boundary",
                code: "NEXT_GLOBAL_ERROR_BOUNDARY",
                stack: error?.stack || null,
                url: typeof window !== "undefined" ? window.location.href : null,
                timestamp: new Date().toISOString(),
                userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
                source: "app/error.tsx",
            }),
        }).catch(() => {
            // Best effort only.
        });
    }, [error]);

    return (
        <Error500Animated
            title="خطای داخلی سرور"
            message={error?.message || "در پردازش درخواست مشکلی رخ داد. لطفا دوباره تلاش کنید."}
            hintEn="Internal Server Error"
            onRetry={reset}
        />
    );
}

