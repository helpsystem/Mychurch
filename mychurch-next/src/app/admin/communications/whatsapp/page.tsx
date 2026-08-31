import React from "react";
import { getWhatsAppLogs } from "@/actions/communications";
import WhatsAppClient from "./WhatsAppClient";

export const dynamic = "force-dynamic";

export default async function WhatsAppCommunicationsPage() {
    const whatsappLogs = await getWhatsAppLogs();

    return (
        <WhatsAppClient 
            initialWhatsAppLogs={whatsappLogs} 
        />
    );
}
