import { getAnnouncements, getEmailLogs } from "@/actions/communications";
import CommunicationsClient from "./CommunicationsClient";

export default async function CommunicationsPage() {
    const announcements = await getAnnouncements();
    const emailLogs = await getEmailLogs();

    return (
        <CommunicationsClient initialAnnouncements={announcements} initialEmailLogs={emailLogs} />
    );
}
