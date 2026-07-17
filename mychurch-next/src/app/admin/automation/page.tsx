import React from "react";
import AutomationClient from "./AutomationClient";
import { getWorkflows, getExecutionLogs } from "@/actions/automation";

export const metadata = {
  title: "Automation Studio | Admin",
};

export default async function AutomationPage() {
  // Fetch initial data on the server
  // Note: user auth would typically be checked here via NextAuth
  const workflows = await getWorkflows("admin");
  const initialLogs = await getExecutionLogs();

  return (
    <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-[#0f1117]">
      <AutomationClient 
        initialWorkflows={workflows} 
        initialLogs={initialLogs} 
        userId="admin"
      />
    </div>
  );
}
