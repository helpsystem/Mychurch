import React from "react";
import LiveConsole from "@/components/broadcast/LiveConsole";
import { requireRole } from "@/utils/rbac";

export const metadata = {
    title: "Broadcast Console | MyChurch",
    description: "Live streaming and presentation control center.",
};

export default async function BroadcastPage() {
    await requireRole(["Admin", "Leader", "Operator"]);
    return <LiveConsole />;
}
