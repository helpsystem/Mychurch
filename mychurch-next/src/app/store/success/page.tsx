import React, { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <SuccessClient />
        </Suspense>
    );
}
