import React from "react";
import { requireRole } from "@/utils/rbac";
import FileManagerClient from "./FileManagerClient";
import { FolderOpen } from "lucide-react";

export const metadata = {
    title: "Server File Explorer | Admin",
};

export default async function AdminFilesPage() {
    // Only Admin role can access file explorer
    await requireRole(["Admin"]);

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-neutral-900/40 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-400">
                        <FolderOpen className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                        <h1 className="text-2xl font-black text-white font-[Vazirmatn]">مدیریت فایل‌های سرور (Server File Explorer)</h1>
                        <p className="text-sm text-white/60">مشاهده، بررسی و حذف فایل‌های آپلود شده و فایل‌های سیستمی</p>
                    </div>
                </div>
            </div>

            <FileManagerClient />
        </div>
    );
}
