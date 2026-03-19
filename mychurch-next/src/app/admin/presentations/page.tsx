import { getPresentations } from "@/actions/presentations";
import PresentationsClient from "./PresentationsClient";

export const dynamic = "force-dynamic";

export default async function PresentationsManagementPage() {
    const presentations = await getPresentations();

    return <PresentationsClient initialPresentations={presentations} />;
}
