import dynamic from "next/dynamic";
import { requireRole } from "@/utils/rbac";
import BroadcastPageClient from "./BroadcastPageClient";

export const metadata = {
    title: "Broadcast Console | MyChurch",
    description: "Live streaming and presentation control center.",
};

export default async function BroadcastPage() {
    await requireRole(["Admin", "Leader", "Operator"]);
    return <BroadcastPageClient />;
}

