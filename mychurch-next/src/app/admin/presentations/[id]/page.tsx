import { getPresentationById } from "@/actions/presentations";
import { notFound } from "next/navigation";
import MeetingAssetsClient from "./MeetingAssetsClient";
import { BroadcastSession } from "@/types/broadcast";

export const dynamic = "force-dynamic";

type SerializedBroadcastSession = Omit<BroadcastSession, "date"> & {
    date: string;
};

export default async function PresentationDetailsPage({ params }: { params: { id: string } }) {
    const presentation = await getPresentationById(params.id);

    if (!presentation) {
        notFound();
    }

    const serializedPresentation: SerializedBroadcastSession = {
        ...presentation,
        date: presentation.date.toISOString(),
    };

    return <MeetingAssetsClient presentation={serializedPresentation} />;
}
