import { getAnnouncements, getEmailLogs, getWhatsAppLogs } from "@/actions/communications";
import CommunicationsClient from "./CommunicationsClient";

export default async function CommunicationsPage() {
    const announcements = await getAnnouncements();
    const emailLogs = await getEmailLogs();
    const whatsappLogs = await getWhatsAppLogs();

    return (
        <CommunicationsClient 
            initialAnnouncements={announcements} 
            initialEmailLogs={emailLogs} 
            initialWhatsAppLogs={whatsappLogs} 
        />
    );
}
