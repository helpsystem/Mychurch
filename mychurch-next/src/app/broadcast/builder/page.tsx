import React from "react";
import { getPresentationById } from "@/actions/presentations";
import BuilderClientWrapper from "./BuilderClientWrapper";
import { BroadcastSession } from "@/types/broadcast";
import { requireRole } from "@/utils/rbac";

export const dynamic = "force-dynamic";

type SerializedBroadcastSession = Omit<BroadcastSession, "date"> & {
    date: string;
};

export default async function SlideBuilderPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    await requireRole(["Admin", "Leader", "Operator"]);

    const resolvedParams = await searchParams;
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

    const serializedSession: SerializedBroadcastSession = {
        ...initialSession,
        date: initialSession.date.toISOString(),
    };

    return <BuilderClientWrapper initialSession={serializedSession} />;
}
