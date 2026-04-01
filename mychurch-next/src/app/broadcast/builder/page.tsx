import React from "react";
import { getPresentationById } from "@/actions/presentations";
import BuilderClientWrapper from "./BuilderClientWrapper";
import { BroadcastSession } from "@/types/broadcast";

export const dynamic = "force-dynamic";

export default async function SlideBuilderPage({
    searchParams,
}: {
    searchParams: { id?: string | string[] } | Promise<{ id?: string | string[] }>;
}) {
    const resolvedParams = searchParams instanceof Promise ? await searchParams : searchParams;
    const rawId = resolvedParams?.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    let initialSession: BroadcastSession;

    if (id) {
        const fetchedSession = await getPresentationById(id);
        if (fetchedSession) {
            initialSession = fetchedSession;
        } else {
            // Fallback if ID is invalid
            initialSession = {
                id: crypto.randomUUID(),
                title: "مراسم جدید (New Session)",
                date: new Date(),
                slides: [],
                status: "draft"
            };
        }
    } else {
        initialSession = {
            id: crypto.randomUUID(),
            title: "مراسم جدید (New Session)",
            date: new Date(),
            slides: [],
            status: "draft"
        };
    }

    return <BuilderClientWrapper initialSession={initialSession} />;
}
