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
        // Log the error to an error reporting service
        console.error("Global Error Boundary Caught:", error);
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
