import React from "react";
import { getAnnouncements } from "@/actions/communications";
import CommunicationsHubClient from "./CommunicationsHubClient";

export const dynamic = "force-dynamic";

export default async function CommunicationsPage() {
    // Only fetch announcements for the Hub
    const announcements = await getAnnouncements();

    return (
        <CommunicationsHubClient 
            initialAnnouncements={announcements} 
        />
    );
}
