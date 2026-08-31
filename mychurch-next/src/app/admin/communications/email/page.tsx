import React from "react";
import { getEmailLogs } from "@/actions/communications";
import EmailClient from "./EmailClient";

export const dynamic = "force-dynamic";

export default async function EmailCommunicationsPage() {
    const emailLogs = await getEmailLogs();

    return (
        <EmailClient 
            initialEmailLogs={emailLogs} 
        />
    );
}
