import { getPresentations } from "@/actions/presentations";
import { getCategories, getPrograms } from "@/actions/church-programs";
import PresentationsClient from "./PresentationsClient";
import { BroadcastSession } from "@/types/broadcast";
import type { ChurchProgramCategory, ChurchProgram } from "@/types/church-programs";

export const dynamic = "force-dynamic";

type SerializedBroadcastSession = Omit<BroadcastSession, "date"> & {
    date: string;
};

export default async function PresentationsManagementPage() {
    const [presentations, categories, programs] = await Promise.all([
        getPresentations(),
        getCategories().catch(() => [] as ChurchProgramCategory[]),
        getPrograms().catch(() => [] as ChurchProgram[]),
    ]);

    const serializedPresentations: SerializedBroadcastSession[] = presentations.map((presentation) => ({
        ...presentation,
        date: presentation.date.toISOString(),
    }));

    return (
        <PresentationsClient
            initialPresentations={serializedPresentations}
            initialCategories={categories}
            initialPrograms={programs}
        />
    );
}
