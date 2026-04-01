"use client";

import { useEffect } from "react";
import ErrorAnimatedPage from "@/components/ui/ErrorAnimatedPage";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Global Error Boundary Caught:", error);
    }, [error]);

    return (
        <ErrorAnimatedPage
            code={500}
            title="خطای داخلی سرور"
            message={error?.message || "در پردازش درخواست مشکلی رخ داد. لطفا دوباره تلاش کنید."}
            hintEn="Internal Server Error"
            showRetry
            onRetry={reset}
        />
    );
}
