"use client";

import ErrorAnimatedPage from "@/components/ui/ErrorAnimatedPage";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="fa">
            <body>
                <ErrorAnimatedPage
                    code={500}
                    title="خطای سراسری برنامه"
                    message={error?.message || "برنامه با خطای غیرمنتظره مواجه شد."}
                    hintEn="Unexpected Application Error"
                    showRetry
                    onRetry={reset}
                />
            </body>
        </html>
    );
}
