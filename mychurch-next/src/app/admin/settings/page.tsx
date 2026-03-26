import React from "react";
import { getAIConfig } from "@/actions/ai-config";
import SettingsClient from "./SettingsClient";

export default async function AdminSettingsPage() {
    const config = await getAIConfig();

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-white">System Settings</h1>
                <p className="text-muted-foreground">Manage AI providers, API keys, and global application configurations.</p>
            </div>

            <SettingsClient initialConfig={config} />
        </div>
    );
}
