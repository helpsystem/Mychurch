"use client";

import React, { useState, useTransition, useCallback, useRef } from "react";
import { Upload, Trash2, FileVideo, Image as ImageIcon, Music, Search, X, File as FileIcon, ImagePlus, Globe, GlobeLock, Pencil, Link as LinkIcon, Lock, Users } from "lucide-react";
import { type MediaAsset, deleteMediaFile, listMediaFiles, renameMediaFile, toggleGalleryVisibility, updateMediaVisibility } from "@/actions/media";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

export default function MediaClient({ initialFiles }: { initialFiles: MediaAsset[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [files, setFiles] = useState<MediaAsset[]>(initialFiles);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | "image" | "video" | "audio">("all");

    // Upload state
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Preview state
    const [previewFile, setPreviewFile] = useState<MediaAsset | null>(null);

    const refreshFiles = async () => {
        const updated = await listMediaFiles();
        setFiles(updated);
        router.refresh(); // Refresh server state
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!acceptedFiles || acceptedFiles.length === 0) return;

        setUploading(true);
        setUploadProgress(0);

        try {
            for (let i = 0; i < acceptedFiles.length; i++) {
                const currentFile = acceptedFiles[i];
                const formData = new FormData();
                formData.append('file', currentFile);

                setUploadProgress(Math.round(((i) / acceptedFiles.length) * 100));

                const response = await fetch('/api/media/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || 'Upload failed');
                }
            }

            setUploadProgress(100);
            toast.success("آپلود با موفقیت انجام شد", {
                description: `${acceptedFiles.length} فایل جدید به کتابخانه اضافه شد.`
            });
            await refreshFiles();
        } catch (error) {
            console.error("Failed to upload:", error);
            toast.error("خطا در آپلود فایل", {
                description: "لطفاً دوباره تلاش کنید یا حجم فایل‌ها را بررسی نمایید."
            });
        } finally {
            setUploading(false);
            setTimeout(() => setUploadProgress(0), 1000);
        }
    }, [refreshFiles]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': [],
            'video/*': [],
            'audio/*': []
        }
    });

    const handleDelete = (filename: string) => {
        if (confirm(`آیا از حذف این فایل مطمئن هستید؟\nAre you sure you want to delete ${filename}?`)) {
            startTransition(async () => {
                const result = await deleteMediaFile(filename);
                if (result.success) {
                    await refreshFiles();
                    if (previewFile?.name === filename) setPreviewFile(null);
                } else {
                    alert("Delete failed: " + result.error);
                }
            });
        }
    };

    const handleToggleGallery = (asset: MediaAsset) => {
        startTransition(async () => {
            const result = await toggleGalleryVisibility(asset);
            if (result.success) {
                toast.success(asset.inGallery ? "از گالری حذف شد" : "به گالری پابلیک اضافه شد");
                await refreshFiles();
                // Update preview file state to reflect the change immediately
                setPreviewFile(prev => prev ? { ...prev, inGallery: !prev.inGallery } : null);
            } else {
                toast.error("خطا در همگام‌سازی با گالری: " + result.error);
            }
        });
    };

    const handleRename = (asset: MediaAsset) => {
        const extIndex = asset.name.lastIndexOf('.');
        const currentBase = extIndex > -1 ? asset.name.substring(0, extIndex) : asset.name;
        const nextName = prompt("نام جدید فایل را وارد کنید / Enter new file name", currentBase);
        if (!nextName || !nextName.trim()) return;

        startTransition(async () => {
            const result = await renameMediaFile(asset.name, nextName.trim());
            if (result.success) {
                toast.success("نام فایل با موفقیت تغییر کرد");
                await refreshFiles();
                if (previewFile?.name === asset.name) {
                    const updatedName = result.newName || asset.name;
                    const updatedExtIndex = updatedName.lastIndexOf('.');
                    setPreviewFile((prev) => prev ? {
                        ...prev,
                        name: updatedName,
                        url: `/api/serve/media/${encodeURIComponent(updatedName)}`,
                    } : null);
                }
            } else {
                toast.error("خطا در تغییر نام فایل", { description: result.error || "Rename failed" });
            }
        });
    };

    const handleCopyUrl = async (asset: MediaAsset) => {
        try {
            const absoluteUrl = `${window.location.origin}${asset.url}`;
            await navigator.clipboard.writeText(absoluteUrl);
            toast.success("لینک فایل کپی شد");
        } catch {
            toast.error("کپی لینک ناموفق بود");
        }
    };

    const handleChangeVisibility = (asset: MediaAsset, newVisibility: 'public' | 'admin' | 'user') => {
        startTransition(async () => {
            const result = await updateMediaVisibility(asset.url, newVisibility);
            if (result.success) {
                const visibilityNames = { public: 'عمومی', admin: 'تنها ادمین', user: 'کاربران ثبت‌نام‌شده' };
                toast.success(`دسترسی فایل تغییر کرد`, { description: `اکنون ${visibilityNames[newVisibility]}` });
                await refreshFiles();
                if (previewFile) {
                    setPreviewFile({ ...previewFile, visibility: newVisibility });
                }
            } else {
                toast.error("خطا در تغییر دسترسی", { description: result.error || "Change visibility failed" });
            }
        });
    };

    // Derived filtered lists
    const filteredFiles = files.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === "all" || f.type === activeTab;
        return matchesSearch && matchesTab;
    });

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const decimals = 1;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    };

    const getTypeIcon = (type: MediaAsset['type'], className = "w-4 h-4") => {
        switch (type) {
            case "image": return <ImageIcon className={`text-emerald-500 ${className}`} />;
            case "video": return <FileVideo className={`text-blue-500 ${className}`} />;
            case "audio": return <Music className={`text-purple-500 ${className}`} />;
            default: return <FileIcon className={`text-neutral-400 ${className}`} />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Upload Zone */}
            <div className="bg-neutral-900 border border-border/10 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold font-[Vazirmatn]">مدیریت فایل‌ها <span className="text-muted-foreground font-sans font-medium text-lg ml-2">/ Media Files</span></h2>
                    <p className="text-sm text-muted-foreground mt-1 font-[Vazirmatn]">
                        آپلود تصاویر، ویدیوهای پس زمینه، و فایل‌های صوتی پرستش
                        <br /><span className="font-sans text-xs">Upload images, background videos, and worship audio</span>
                    </p>
                </div>

                <div className="flex-1 w-full md:max-w-md">
                    <div
                        {...getRootProps()}
                        className={`w-full flex flex-col items-center justify-center gap-3 px-6 py-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer font-[Vazirmatn] overflow-hidden relative ${isDragActive
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 scale-[1.02]"
                            : uploading
                                ? "border-blue-500/50 bg-blue-500/5 text-blue-500"
                                : "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-500"
                            }`}
                    >
                        <input {...getInputProps()} disabled={uploading} />

                        {/* Progress Bar Background */}
                        {uploading && (
                            <div
                                className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        )}

                        {uploading ? (
                            <>
                                <Upload className="w-8 h-8 animate-bounce" />
                                <div className="text-center">
                                    <span className="font-bold flex items-center justify-center gap-2">
                                        <span className="animate-pulse">در حال آپلود...</span>
                                        <span className="font-mono">{uploadProgress}%</span>
                                    </span>
                                    <p className="text-xs opacity-70 mt-1 font-sans">Uploading files, please wait</p>
                                </div>
                            </>
                        ) : isDragActive ? (
                            <>
                                <ImagePlus className="w-8 h-8 animate-pulse text-emerald-500" />
                                <div className="text-center font-bold">
                                    فایل‌ها را اینجا رها کنید
                                    <p className="text-xs opacity-70 mt-1 font-sans">Drop files here</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <Upload className="w-8 h-8" />
                                <div className="text-center">
                                    <span className="font-bold block">انتخاب یا کشیدن فایل‌ها به اینجا</span>
                                    <p className="text-xs opacity-70 mt-1 font-sans">Click or drag images, videos, or audio</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex bg-neutral-900 p-1 rounded-lg border border-border/10">
                    {(["all", "image", "video", "audio"] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors font-[Vazirmatn] capitalize ${activeTab === tab
                                ? "bg-white/10 text-white shadow-sm"
                                : "text-muted-foreground hover:text-white hover:bg-white/5"
                                }`}
                        >
                            {tab === "all" ? "همه (All)" : tab === "image" ? "تصاویر (Images)" : tab === "video" ? "ویدیو (Video)" : "صدا (Audio)"}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-neutral-900 border border-border/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition"
                    />
                </div>
            </div>

            {/* Grid */}
            {filteredFiles.length === 0 ? (
                <div className="text-center py-20 bg-neutral-900/50 rounded-2xl border border-border/10 border-dashed">
                    <p className="text-muted-foreground font-[Vazirmatn]">هیچ فایلی یافت نشد. <span className="font-sans ml-1 text-sm opacity-70">No files found.</span></p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredFiles.map((f) => (
                        <div
                            key={f.name}
                            className="group relative bg-neutral-900 border border-border/10 rounded-xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer aspect-square flex flex-col justify-between"
                            onClick={() => setPreviewFile(f)}
                        >
                            {/* Visual Thumbnail */}
                            <div className="flex-1 w-full bg-neutral-950 flex items-center justify-center overflow-hidden">
                                {f.type === 'image' && (
                                    <img src={f.url} alt={f.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                )}
                                {f.type === 'video' && (
                                    <video src={f.url} className="w-full h-full object-cover opacity-50" />
                                )}
                                {f.type === 'audio' && (
                                    <Music className="w-12 h-12 text-purple-500/50" />
                                )}
                                {f.type === 'other' && (
                                    <FileIcon className="w-12 h-12 text-neutral-600" />
                                )}
                            </div>

                            {/* Label */}
                            <div className="p-3 bg-neutral-900 border-t border-border/10">
                                <p className="text-xs font-medium truncate w-full" title={f.name}>{f.name}</p>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-[10px] text-muted-foreground">{formatBytes(f.size)}</span>
                                    <div className="flex items-center gap-1.5">
                                        {f.inGallery && <Globe className="w-3 h-3 text-emerald-500" title="در گالری عمومی سایت قرار دارد" />}
                                        {getTypeIcon(f.type, "w-3 h-3")}
                                    </div>
                                </div>
                            </div>

                            {/* Hover Actions */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(f.name); }}
                                    className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md shadow-lg"
                                    title={"حذف: " + f.name}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewFile(null)}>
                    <div
                        className="bg-neutral-900 border border-border/10 rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-border/10">
                            <h3 className="font-bold flex items-center gap-2 truncate">
                                {getTypeIcon(previewFile.type)}
                                {previewFile.name}
                            </h3>
                            <button onClick={() => setPreviewFile(null)} className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground" title="بستن">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 flex-1 overflow-auto bg-black flex items-center justify-center min-h-[400px]">
                            {previewFile.type === 'image' && (
                                <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain" />
                            )}
                            {previewFile.type === 'video' && (
                                <video src={previewFile.url} controls autoPlay className="max-w-full max-h-[70vh] rounded-lg shadow-lg" />
                            )}
                            {previewFile.type === 'audio' && (
                                <div className="w-full max-w-md p-8 bg-neutral-900 rounded-2xl border border-border/10 text-center space-y-6">
                                    <Music className="w-24 h-24 text-purple-500 mx-auto animate-pulse" />
                                    <audio src={previewFile.url} controls autoPlay className="w-full" />
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-neutral-950 space-y-4">
                            {/* Visibility Controls */}
                            {previewFile.inGallery && (
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">دسترسی / Visibility</label>
                                    <div className="flex flex-wrap gap-2">
                                        {(['public', 'admin', 'user'] as const).map(level => {
                                            const labels = { public: 'عمومی / Public', admin: 'تنها ادمین / Admin Only', user: 'کاربران ثبت‌نام‌شده / Users' };
                                            const icons = { public: <Globe className="w-3.5 h-3.5" />, admin: <Lock className="w-3.5 h-3.5" />, user: <Users className="w-3.5 h-3.5" /> };
                                            return (
                                                <button
                                                    key={level}
                                                    onClick={() => handleChangeVisibility(previewFile, level)}
                                                    disabled={isPending}
                                                    className={`px-3 py-1.5 rounded-lg transition disabled:opacity-50 font-[Vazirmatn] flex items-center gap-2 text-xs font-bold ${
                                                        previewFile.visibility === level
                                                            ? 'bg-blue-500 text-white border border-blue-600'
                                                            : 'bg-neutral-800 text-muted-foreground hover:text-white border border-border/20'
                                                    }`}
                                                >
                                                    {icons[level]}
                                                    {labels[level]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-sm">
                                <div className="text-muted-foreground">
                                    سایز / Size: <span className="text-white font-mono">{formatBytes(previewFile.size)}</span>
                                </div>
                                <div className="space-x-2 flex items-center flex-wrap justify-end gap-2">
                                    <button
                                        onClick={() => handleCopyUrl(previewFile)}
                                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition font-[Vazirmatn] flex items-center gap-2 text-xs"
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                        کپی لینک
                                    </button>
                                    <button
                                        onClick={() => handleRename(previewFile)}
                                        disabled={isPending}
                                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition disabled:opacity-50 font-[Vazirmatn] flex items-center gap-2 text-xs"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        تغییر نام
                                    </button>
                                    {previewFile.type === 'image' && (
                                        <button
                                            onClick={() => handleToggleGallery(previewFile)}
                                            disabled={isPending}
                                            className={`px-4 py-2 rounded-lg transition disabled:opacity-50 font-[Vazirmatn] flex items-center gap-2 text-xs font-bold ${
                                                previewFile.inGallery 
                                                    ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20" 
                                                    : "bg-neutral-800 text-muted-foreground hover:bg-emerald-500 hover:text-white border border-border/10"
                                            }`}
                                        >
                                            {previewFile.inGallery ? (
                                                <>
                                                    <Globe className="w-4 h-4" /> 
                                                    حذف از گالری
                                                </>
                                            ) : (
                                                <>
                                                    <GlobeLock className="w-4 h-4" /> 
                                                    افزودن به گالری
                                                </>
                                            )}
                                        </button>
                                    )}
                                    <a
                                        href={previewFile.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition inline-block font-[Vazirmatn] text-xs"
                                    >
                                        لینک مستقیم
                                    </a>
                                    <button
                                        onClick={() => handleDelete(previewFile.name)}
                                        disabled={isPending}
                                        className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition disabled:opacity-50 font-[Vazirmatn] text-xs"
                                    >
                                        حذف
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
