import React from "react";
import LiveConsole from "@/components/broadcast/LiveConsole";

export const metadata = {
    title: "Broadcast Console | MyChurch",
    description: "Live streaming and presentation control center.",
};

export default function BroadcastPage() {
    return <LiveConsole />;
}
