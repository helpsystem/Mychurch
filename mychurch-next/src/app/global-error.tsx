"use client";

import Error500Animated from "@/components/ui/Error500Animated";

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
                <Error500Animated
                    title="خطای سراسری برنامه"
                    message={error?.message || "برنامه با خطای غیرمنتظره مواجه شد."}
                    hintEn="Unexpected Application Error"
                    onRetry={reset}
                />
            </body>
        </html>
    );
}
