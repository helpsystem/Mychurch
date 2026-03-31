import React from "react";
import { getPresentationById } from "@/actions/presentations";
import BuilderClientWrapper from "./BuilderClientWrapper";
import { BroadcastSession } from "@/types/broadcast";

export const dynamic = "force-dynamic";

export default async function SlideBuilderPage({
    searchParams,
}: {
    searchParams: { id?: string } | Promise<{ id?: string }>;
}) {
    const resolvedParams = searchParams instanceof Promise ? await searchParams : searchParams;
    const id = resolvedParams?.id;

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
