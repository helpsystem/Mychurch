"use client";

import React, { useEffect, useState } from "react";
import { 
    Folder, File, Image as ImageIcon, Music, Film, FileText, 
    Trash2, ChevronLeft, ChevronRight, Search, Loader2, 
    CornerRightUp, AlertCircle, FileCode, Play, Eye, X, CloudUpload 
} from "lucide-react";
import { toast } from "sonner";

interface FileEntry {
    name: string;
    isDirectory: boolean;
    size: number;
    modifiedAt: number;
    relativePath: string;
}

const QUICK_SHORTCUTS = [
    { label: "پوشه آپلودها (Uploads)", path: "public/uploads" },
    { label: "فایل‌های صوتی سرودها", path: "public/worship/audio" },
    { label: "گالری تصاویر", path: "public/gallery" },
    { label: "ریشه پروژه (Root)", path: "" }
];

export default function FileManagerClient() {
    const [currentPath, setCurrentPath] = useState("public");
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<FileEntry | null>(null);
    const [syncingFiles, setSyncingFiles] = useState<Set<string>>(new Set());

    const loadDirectory = async (path: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/files?path=${encodeURIComponent(path)}`);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to load directory");
            }
            setFiles(data.files || []);
            setCurrentPath(data.currentPath);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "خطا در برقراری ارتباط با دیتابیس یا سرور");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadDirectory(currentPath);
    }, []);

    const handleNavigate = (path: string) => {
        setSearchQuery("");
        void loadDirectory(path);
    };

    const handleGoUp = () => {
        const parts = currentPath.split("/");
        if (parts.length > 0) {
            parts.pop();
            const parent = parts.join("/");
            handleNavigate(parent);
        }
    };

    const handleDelete = async (file: FileEntry) => {
        const ok = confirm(`آیا از حذف ${file.isDirectory ? "پوشه" : "فایل"} "${file.name}" اطمینان کامل دارید؟\nاین عملیات غیر قابل بازگشت است.`);
        if (!ok) return;

        try {
            const res = await fetch("/api/admin/files", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: file.relativePath })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to delete");
            }
            toast.success(`${file.isDirectory ? "پوشه" : "فایل"} با موفقیت حذف شد`);
            void loadDirectory(currentPath);
        } catch (err: any) {
            toast.error(err.message || "خطا در حذف فایل");
        }
    };

    const handleTelegramSync = async (file: FileEntry) => {
        if (syncingFiles.has(file.relativePath)) return;
        
        setSyncingFiles(prev => new Set(prev).add(file.relativePath));
        toast.loading(`در حال انتقال ${file.name} به تلگرام...`, { id: file.relativePath });

        try {
            const res = await fetch("/api/admin/files/telegram-sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filePath: file.relativePath })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "خطا در آپلود تلگرام");
            }
            toast.success(`انتقال موفق! شناسه فایل: ${data.telegramFile.fileId}`, { id: file.relativePath, duration: 8000 });
        } catch (err: any) {
            toast.error(err.message || "انتقال ناموفق بود", { id: file.relativePath });
        } finally {
            setSyncingFiles(prev => {
                const newSet = new Set(prev);
                newSet.delete(file.relativePath);
                return newSet;
            });
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const getFileIcon = (file: FileEntry) => {
        if (file.isDirectory) return <Folder className="w-5 h-5 text-amber-400 fill-amber-400/20" />;

        const ext = file.name.split(".").pop()?.toLowerCase();
        switch (ext) {
            case "jpg":
            case "jpeg":
            case "png":
            case "gif":
            case "webp":
            case "svg":
                return <ImageIcon className="w-5 h-5 text-emerald-400" />;
            case "mp3":
            case "wav":
            case "ogg":
            case "m4a":
                return <Music className="w-5 h-5 text-cyan-400" />;
            case "mp4":
            case "mov":
            case "webm":
                return <Film className="w-5 h-5 text-rose-400" />;
            case "txt":
            case "md":
            case "srt":
                return <FileText className="w-5 h-5 text-zinc-300" />;
            case "js":
            case "ts":
            case "tsx":
            case "json":
            case "sql":
                return <FileCode className="w-5 h-5 text-yellow-400" />;
            default:
                return <File className="w-5 h-5 text-neutral-400" />;
        }
    };

    const isPreviewable = (file: FileEntry) => {
        const ext = file.name.split(".").pop()?.toLowerCase();
        return ["jpg", "jpeg", "png", "gif", "webp", "svg", "mp3", "wav", "m4a", "mp4", "txt", "json", "md", "srt"].includes(ext || "");
    };

    const renderFilePreview = () => {
        if (!previewFile) return null;

        const ext = previewFile.name.split(".").pop()?.toLowerCase();

        // Resolve URL. Next.js doesn't serve files added to `public` at runtime.
        // We route them through our secure `/api/serve/` endpoint.
        let fileUrl = `/${previewFile.relativePath}`;
        if (fileUrl.startsWith('/public/uploads/')) {
            fileUrl = `/api/serve/${previewFile.relativePath.replace('public/uploads/', '')}`;
        } else if (fileUrl.startsWith('/public/media/')) {
            fileUrl = `/api/serve/media/${previewFile.relativePath.replace('public/media/', '')}`;
        } else if (fileUrl.startsWith('/public/')) {
            fileUrl = fileUrl.replace('/public/', '/');
        }

        return (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                <div className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
                    <div className="flex items-center justify-between p-6 border-b border-white/5 bg-neutral-950" dir="rtl">
                        <div className="text-right">
                            <h3 className="font-bold text-lg text-white font-[Vazirmatn]">پیش‌نمایش: {previewFile.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1 font-mono">{previewFile.relativePath}</p>
                        </div>
                        <button onClick={() => setPreviewFile(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center bg-black/40 min-h-[300px]">
                        {["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={fileUrl} alt={previewFile.name} className="max-w-full max-h-[50vh] object-contain rounded-xl shadow-lg border border-white/5" />
                        ) : ["mp3", "wav", "m4a"].includes(ext || "") ? (
                            <div className="w-full max-w-md bg-neutral-950 p-6 rounded-2xl border border-white/5 flex flex-col gap-4 text-center">
                                <Music className="w-12 h-12 text-cyan-400 mx-auto animate-pulse" />
                                <span className="text-sm font-semibold">{previewFile.name}</span>
                                <audio src={fileUrl} controls className="w-full mt-2" autoPlay />
                            </div>
                        ) : ["mp4"].includes(ext || "") ? (
                            <video src={fileUrl} controls className="max-w-full max-h-[50vh] rounded-xl border border-white/5" autoPlay />
                        ) : (
                            <div className="w-full bg-neutral-950 p-6 rounded-2xl border border-white/5 font-mono text-xs text-left text-neutral-300 overflow-x-auto max-h-[50vh] whitespace-pre-wrap">
                                <span className="text-muted-foreground block border-b border-white/5 pb-2 mb-2">نوع فرمت متنی شناسایی شد:</span>
                                {`امکان نمایش آنلاین این فرمت خام وجود دارد. آدرس دسترسی مستقیم:\n${fileUrl}`}
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 bg-neutral-950 border-t border-white/5 flex justify-end gap-3" dir="rtl">
                        <button onClick={() => setPreviewFile(null)} className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all">بستن</button>
                        <a href={fileUrl} download className="px-5 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm font-bold transition-all">دانلود فایل 💾</a>
                    </div>
                </div>
            </div>
        );
    };

    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Split breadcrumbs
    const pathParts = currentPath.split("/").filter(Boolean);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-vazirmatn" dir="rtl">
            {/* Quick Shortcuts Panel */}
            <div className="lg:col-span-1 bg-neutral-900 border border-white/10 rounded-3xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mr-1">دسترسی سریع</h3>
                <div className="flex flex-col gap-2">
                    {QUICK_SHORTCUTS.map((shortcut, i) => (
                        <button
                            key={i}
                            onClick={() => handleNavigate(shortcut.path)}
                            className={`w-full text-right p-3 rounded-xl border transition-all text-sm font-bold flex items-center gap-2.5 ${
                                currentPath === shortcut.path
                                    ? "bg-primary/10 border-primary/30 text-primary"
                                    : "bg-background hover:bg-white/5 border-white/5 text-foreground/80 hover:text-white"
                            }`}
                        >
                            <Folder className="w-4 h-4 shrink-0" />
                            <span className="truncate">{shortcut.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main File Browser Grid */}
            <div className="lg:col-span-3 bg-neutral-900 border border-white/10 rounded-3xl p-6 flex flex-col min-h-[500px]">
                {/* Search & Breadcrumb Bar */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center border-b border-white/5 pb-4 mb-4">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-1.5 flex-wrap text-sm font-bold text-white/70">
                        <button onClick={() => handleNavigate("")} className="hover:text-primary transition-colors">Root</button>
                        {pathParts.map((part, idx) => {
                            const rebuildPath = pathParts.slice(0, idx + 1).join("/");
                            return (
                                <React.Fragment key={idx}>
                                    <ChevronLeft className="w-4 h-4 text-white/30 shrink-0" />
                                    <button 
                                        onClick={() => handleNavigate(rebuildPath)}
                                        className={`hover:text-primary transition-colors truncate max-w-[120px] ${idx === pathParts.length - 1 ? "text-primary font-black" : ""}`}
                                    >
                                        {part}
                                    </button>
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* Search */}
                    <div className="relative max-w-xs w-full">
                        <Search className="absolute right-3.5 top-3 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="جستجو در این پوشه..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-background border border-white/10 rounded-xl py-2.5 pr-10 pl-4 outline-none focus:border-primary text-sm transition-all"
                        />
                    </div>
                </div>

                {/* Directory Controls */}
                <div className="flex items-center gap-2 mb-4">
                    {currentPath && (
                        <button
                            onClick={handleGoUp}
                            className="flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
                        >
                            <CornerRightUp className="w-3.5 h-3.5" />
                            پوشه قبلی (Up)
                        </button>
                    )}
                    <span className="text-xs text-muted-foreground font-mono">
                        {filteredFiles.length} مورد یافت شد
                    </span>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 text-red-400 mb-4 animate-fade-in-up">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-sm">خطا در بارگذاری اطلاعات</p>
                            <p className="text-xs opacity-90 mt-1 leading-relaxed">{error}</p>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-sm font-medium">در حال خواندن پوشه‌های سرور...</span>
                    </div>
                ) : (
                    /* Directory Entries Table */
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead>
                                <tr className="text-xs font-bold text-white/50 border-b border-white/5">
                                    <th className="pb-3 pr-2">نام فایل / پوشه</th>
                                    <th className="pb-3 px-4">نوع</th>
                                    <th className="pb-3 px-4">حجم فایل</th>
                                    <th className="pb-3 px-4">تاریخ آخرین تغییر</th>
                                    <th className="pb-3 pl-2 text-left">عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFiles.map((file, idx) => (
                                    <tr 
                                        key={idx} 
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                                        onClick={() => file.isDirectory && handleNavigate(file.relativePath)}
                                    >
                                        {/* Name & Icon */}
                                        <td className="py-3.5 pr-2 font-medium text-white flex items-center gap-3">
                                            <div className="p-2 bg-background border border-white/5 rounded-xl group-hover:scale-105 transition-transform">
                                                {getFileIcon(file)}
                                            </div>
                                            <span className="truncate max-w-[250px]" title={file.name}>
                                                {file.name}
                                            </span>
                                        </td>

                                        {/* File Type */}
                                        <td className="py-3.5 px-4 text-xs font-bold text-white/60">
                                            {file.isDirectory ? "پوشه (Directory)" : "فایل (File)"}
                                        </td>

                                        {/* Size */}
                                        <td className="py-3.5 px-4 font-mono text-xs text-white/70">
                                            {file.isDirectory ? "-" : formatBytes(file.size)}
                                        </td>

                                        {/* Date */}
                                        <td className="py-3.5 px-4 text-xs text-white/60">
                                            {new Date(file.modifiedAt).toLocaleDateString("fa-IR")} - {new Date(file.modifiedAt).toLocaleTimeString("fa-IR", {hour: '2-digit', minute:'2-digit'})}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3.5 pl-2 text-left" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                {!file.isDirectory && (
                                                    <button
                                                        onClick={() => handleTelegramSync(file)}
                                                        disabled={syncingFiles.has(file.relativePath)}
                                                        title="ارسال و همگام‌سازی با استوریج تلگرام"
                                                        className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {syncingFiles.has(file.relativePath) ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <CloudUpload className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                )}
                                                {!file.isDirectory && isPreviewable(file) && (
                                                    <button
                                                        onClick={() => setPreviewFile(file)}
                                                        title="پیش‌نمایش فایل"
                                                        className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(file)}
                                                    title="حذف"
                                                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {filteredFiles.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-muted-foreground bg-secondary/10 rounded-2xl border border-white/5 border-dashed">
                                            هیچ پوشه یا فایلی در این شاخه یافت نشد.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Previews Modal Portal */}
            {previewFile && renderFilePreview()}
        </div>
    );
}
