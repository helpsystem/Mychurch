import { getPresentations } from "@/actions/presentations";
import PresentationsClient from "./PresentationsClient";
import { BroadcastSession } from "@/types/broadcast";

export const dynamic = "force-dynamic";

type SerializedBroadcastSession = Omit<BroadcastSession, "date"> & {
    date: string;
};

export default async function PresentationsManagementPage() {
    const presentations = await getPresentations();
    const serializedPresentations: SerializedBroadcastSession[] = presentations.map((presentation) => ({
        ...presentation,
        date: presentation.date.toISOString(),
    }));

    return <PresentationsClient initialPresentations={serializedPresentations} />;
}
