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
