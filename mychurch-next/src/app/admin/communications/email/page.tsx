import React from "react";
import { getAdminEmails } from "@/actions/admin-emails";
import EmailInboxClient from "./EmailInboxClient";

export const dynamic = "force-dynamic";

export default async function EmailCommunicationsPage() {
    const res = await getAdminEmails({ folder: "inbox" });

    return (
        <EmailInboxClient 
            initialEmails={res.emails || []}
            initialFolderCounts={res.folderCounts || { inbox: 0, inboxUnread: 0, sent: 0, spam: 0 }}
        />
    );
}
