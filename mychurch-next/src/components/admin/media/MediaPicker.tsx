"use client";

import React, { useState, useTransition, useCallback, useEffect } from "react";
import { Upload, Trash2, FileVideo, Image as ImageIcon, Music, Search, X, File as FileIcon, ImagePlus, Globe, GlobeLock, Pencil, Link as LinkIcon, Lock, Users, Folder, FolderPlus, ArrowRight, CornerLeftUp, Link2 } from "lucide-react";
import { type MediaAsset, deleteMediaFile, listMediaFiles, renameMediaFile, toggleGalleryVisibility, updateMediaVisibility, createMediaFolder, moveMediaFile } from "@/actions/media";
import { AddMediaLinkModal } from "./AddMediaLinkModal";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

export interface MediaPickerProps {
    mode?: "page" | "modal";
    onSelect?: (url: string) => void;
    onClose?: () => void;
    initialFiles?: MediaAsset[];
    allowedTypes?: ("image" | "video" | "audio" | "all")[];
}

export function MediaPicker({ mode = "page", onSelect, onClose, initialFiles, allowedTypes = ["all"] }: MediaPickerProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [files, setFiles] = useState<MediaAsset[]>(initialFiles || []);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | "image" | "video" | "audio" | "links">("all");
    const [currentFolder, setCurrentFolder] = useState<string>("");
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    // Upload state
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Preview state
    const [previewFile, setPreviewFile] = useState<MediaAsset | null>(null);

    useEffect(() => {
        if (!initialFiles) {
            refreshFiles();
        }
    }, []);

    const refreshFiles = async () => {
        const updated = await listMediaFiles();
        setFiles(updated);
        router.refresh();
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
                if (currentFolder) {
                    formData.append('folder', currentFolder);
                }

                setUploadProgress(Math.round(((i) / acceptedFiles.length) * 100));

                const response = await fetch('/api/upload', {
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
                description: `${acceptedFiles.length} فایل جدید به اضافه شد.`
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
    }, [currentFolder]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': [],
            'video/*': [],
            'audio/*': []
        }
    });

    const handleCreateFolder = () => {
        const folderName = prompt("نام پوشه جدید را وارد کنید (انگلیسی):");
        if (!folderName || !folderName.trim()) return;

        startTransition(async () => {
            const targetPath = currentFolder ? `${currentFolder}/${folderName.trim()}` : folderName.trim();
            const res = await createMediaFolder(targetPath);
            if (res.success) {
                toast.success("پوشه ایجاد شد");
                await refreshFiles();
            } else {
                toast.error("خطا در ایجاد پوشه", { description: res.error });
            }
        });
    };

    const handleDelete = (asset: MediaAsset) => {
        if (confirm(`آیا از حذف این فایل مطمئن هستید؟\nAre you sure you want to delete ${asset.name}?`)) {
            startTransition(async () => {
                const targetPath = asset.folder ? `${asset.folder}/${asset.name}` : asset.name;
                const result = await deleteMediaFile(targetPath);
                if (result.success) {
                    await refreshFiles();
                    if (previewFile?.name === asset.name) setPreviewFile(null);
                } else {
                    toast.error("Delete failed: " + result.error);
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
            const targetPath = asset.folder ? `${asset.folder}/${asset.name}` : asset.name;
            const result = await renameMediaFile(targetPath, nextName.trim());
            if (result.success) {
                toast.success("نام فایل با موفقیت تغییر کرد");
                await refreshFiles();
                if (previewFile?.name === asset.name) {
                    setPreviewFile(null); // Just close preview to avoid complex state merge
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
                toast.success(`دسترسی فایل تغییر کرد`);
                await refreshFiles();
                if (previewFile) {
                    setPreviewFile({ ...previewFile, visibility: newVisibility });
                }
            } else {
                toast.error("خطا در تغییر دسترسی", { description: result.error });
            }
        });
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + ['Bytes', 'KB', 'MB', 'GB'][i];
    };

    const getTypeIcon = (type: MediaAsset['type'], className = "w-4 h-4") => {
        switch (type) {
            case "image": return <ImageIcon className={`text-emerald-500 ${className}`} />;
            case "video": return <FileVideo className={`text-blue-500 ${className}`} />;
            case "audio": return <Music className={`text-purple-500 ${className}`} />;
            default: return <FileIcon className={`text-neutral-400 ${className}`} />;
        }
    };

    // Calculate Folders & Files
    // Filter by type if allowedTypes is specified and we are picking.
    const isModal = mode === "modal";
    const typeFiltered = files.filter(f => isModal ? (allowedTypes.includes("all") || (allowedTypes as any[]).includes(f.type)) : true);
    
    // Filter by Search (global)
    const searchFiltered = searchQuery 
        ? typeFiltered.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.folder?.toLowerCase().includes(searchQuery.toLowerCase()))
        : typeFiltered;

    // Filter by Tab (if not searching globally)
    const tabFiltered = searchQuery ? searchFiltered : searchFiltered.filter(f => {
        if (activeTab === "all") return true;
        if (activeTab === "links") return !!f.isExternalLink;
        return f.type === activeTab;
    });

    // Group into current folder
    let displayedFiles: MediaAsset[] = [];
    let displayedFolders = new Set<string>();

    if (searchQuery) {
        // Flat display on search
        displayedFiles = tabFiltered.filter(f => f.name !== '.keep');
    } else {
        // ALWAYS use the unfiltered `files` list to build the folder tree, so empty folders (.keep) are visible!
        files.forEach(f => {
            const fileFolder = f.folder || "";
            if (fileFolder.startsWith(currentFolder)) {
                // Determine next folder level
                const remaining = currentFolder ? fileFolder.substring(currentFolder.length + 1) : fileFolder;
                const nextSlash = remaining.indexOf('/');
                const nextLevel = nextSlash === -1 ? remaining : remaining.substring(0, nextSlash);
                if (nextLevel && nextLevel !== currentFolder) {
                    displayedFolders.add(nextLevel);
                }
            }
        });
        
        // Populate displayedFiles with the FILTERED files in the current folder, ignoring .keep
        tabFiltered.forEach(f => {
            const fileFolder = f.folder || "";
            if (fileFolder === currentFolder && f.name !== '.keep') {
                displayedFiles.push(f);
            }
        });
    }

    const content = (
        <div className="flex flex-col h-full bg-background/95 space-y-4">
            {/* Header */}
            {mode === "page" ? (
                <div className="bg-neutral-900 border border-border/10 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold font-[Vazirmatn]">مدیریت فایل‌ها <span className="text-muted-foreground font-sans font-medium text-lg ml-2">/ Media Files</span></h2>
                        <p className="text-sm text-muted-foreground mt-1 font-[Vazirmatn]">
                            آپلود تصاویر، ویدیوهای پس زمینه، و درج لینک‌های اینترنتی
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <button
                            type="button"
                            onClick={() => setIsLinkModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-indigo-600/20 font-[Vazirmatn]"
                        >
                            <Link2 className="w-4 h-4" />
                            <span>افزودن با لینک (عکس / ویدیو)</span>
                        </button>
                        {renderUploadZone(getRootProps, getInputProps, isDragActive, uploading, uploadProgress)}
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between pb-2 border-b border-border/10">
                    <h2 className="text-lg font-bold font-[Vazirmatn]">انتخاب مدیا</h2>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsLinkModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition shadow-sm font-[Vazirmatn]"
                        >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>افزودن با لینک</span>
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5"/></button>
                    </div>
                </div>
            )}

            {mode === "modal" && (
                <div className="w-full flex gap-3 items-center">
                    <div className="flex-1">
                        {renderUploadZone(getRootProps, getInputProps, isDragActive, uploading, uploadProgress, "h-20 py-2")}
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex bg-neutral-900 p-1 rounded-lg border border-border/10 overflow-x-auto max-w-full">
                    {(["all", "image", "video", "audio", "links"] as const).map(tab => {
                        if (isModal && !allowedTypes.includes("all") && !allowedTypes.includes(tab as any) && tab !== "all" && tab !== "links") return null;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors font-[Vazirmatn] capitalize whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                {tab === "links" && <Link2 className="w-3.5 h-3.5 text-indigo-400" />}
                                {tab === "all" ? "همه" : tab === "image" ? "تصاویر" : tab === "video" ? "ویدیو" : tab === "audio" ? "صدا" : "لینک‌ها"}
                            </button>
                        );
                    })}
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={handleCreateFolder} className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 border border-border/20 rounded-lg text-sm flex items-center gap-2">
                        <FolderPlus className="w-4 h-4"/> پوشه جدید
                    </button>
                    <div className="relative w-full sm:w-64">
                        <button
                            type="button"
                            onClick={() => document.getElementById("media-picker-search")?.focus()}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                            title="جستجو"
                        >
                            <Search className="w-4 h-4" />
                        </button>
                        <input
                            id="media-picker-search"
                            type="text"
                            placeholder="جستجوی فایل..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-900 border border-border/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition"
                        />
                    </div>
                </div>
            </div>

            {/* Folder Breadcrumb */}
            {!searchQuery && (
                <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground bg-neutral-900/50 p-2 rounded-lg border border-border/10 overflow-x-auto">
                    <button onClick={() => setCurrentFolder("")} className="hover:text-white transition">Root</button>
                    {currentFolder.split('/').filter(Boolean).map((part, index, arr) => {
                        const path = arr.slice(0, index + 1).join('/');
                        return (
                            <React.Fragment key={path}>
                                <span>/</span>
                                <button onClick={() => setCurrentFolder(path)} className="hover:text-white transition">{part}</button>
                            </React.Fragment>
                        );
                    })}
                </div>
            )}

            {/* Grid */}
            <div className="flex-1 overflow-auto bg-neutral-950/30 rounded-xl p-4 border border-border/5 min-h-[300px]">
                {displayedFiles.length === 0 && displayedFolders.size === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        هیچ فایلی یافت نشد.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        
                        {/* Parent Folder Button */}
                        {!searchQuery && currentFolder && (
                            <div 
                                onClick={() => {
                                    const parts = currentFolder.split('/');
                                    parts.pop();
                                    setCurrentFolder(parts.join('/'));
                                }}
                                className="group bg-neutral-900 border border-border/10 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-800 transition aspect-square"
                            >
                                <CornerLeftUp className="w-10 h-10 text-muted-foreground group-hover:text-white mb-2" />
                                <span className="text-xs">برگشت</span>
                            </div>
                        )}

                        {/* Folders */}
                        {!searchQuery && Array.from(displayedFolders).map(folderName => (
                            <div 
                                key={folderName} 
                                onClick={() => setCurrentFolder(currentFolder ? `${currentFolder}/${folderName}` : folderName)}
                                className="group bg-neutral-900 border border-border/10 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/50 transition aspect-square"
                            >
                                <Folder className="w-12 h-12 text-amber-500/70 group-hover:text-amber-500 mb-2" />
                                <span className="text-xs truncate w-full text-center" dir="ltr">{folderName}</span>
                            </div>
                        ))}

                        {/* Files */}
                        {displayedFiles.map(f => (
                            <div
                                key={f.url}
                                className="group relative bg-neutral-900 border border-border/10 rounded-xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg transition-all cursor-pointer aspect-square flex flex-col justify-between"
                                onClick={() => {
                                    if (isModal && onSelect) {
                                        onSelect(f.url);
                                    } else {
                                        setPreviewFile(f);
                                    }
                                }}
                            >
                                <div className="flex-1 w-full bg-neutral-950 flex items-center justify-center overflow-hidden relative">
                                    {f.type === 'image' && <img src={f.url} alt={f.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />}
                                    {f.type === 'video' && (
                                        <div className="w-full h-full relative flex items-center justify-center bg-black/40">
                                            <video src={f.url} className="w-full h-full object-cover opacity-50 pointer-events-none" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-9 h-9 rounded-full bg-blue-600/80 backdrop-blur-md flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                                    <FileVideo className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {f.type === 'audio' && <Music className="w-10 h-10 text-purple-500/50" />}
                                    {f.type === 'other' && <FileIcon className="w-10 h-10 text-neutral-600" />}

                                    {/* External Link Badge */}
                                    {f.isExternalLink && (
                                        <span className="absolute top-2 left-2 z-10 bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow font-[Vazirmatn]">
                                            <Link2 className="w-2.5 h-2.5" /> لینک
                                        </span>
                                    )}
                                </div>

                                <div className="p-2 bg-neutral-900 border-t border-border/10">
                                    <p className="text-[11px] font-medium truncate w-full" title={f.name}>{f.name}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-[10px] text-muted-foreground">{formatBytes(f.size)}</span>
                                        {getTypeIcon(f.type, "w-3 h-3")}
                                    </div>
                                </div>

                                {mode === "page" && (
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(f); }}
                                            className="p-1 bg-red-500 hover:bg-red-600 text-white rounded shadow"
                                            title="حذف"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Preview Modal for Page Mode */}
            {previewFile && mode === "page" && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewFile(null)}>
                    <div className="bg-neutral-900 border border-border/10 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-border/10">
                            <h3 className="font-bold flex items-center gap-2 truncate">
                                {getTypeIcon(previewFile.type)} {previewFile.name}
                            </h3>
                            <button onClick={() => setPreviewFile(null)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-4 flex-1 overflow-auto bg-black flex items-center justify-center min-h-[300px]">
                            {previewFile.type === 'image' && <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain" />}
                            {previewFile.type === 'video' && (
                                previewFile.url.includes('youtube.com') || previewFile.url.includes('youtu.be') ? (
                                    <iframe
                                        src={`https://www.youtube-nocookie.com/embed/${previewFile.url.match(/(?:youtu\.be\/|v=)([^&]+)/)?.[1] || ''}?autoplay=1`}
                                        title={previewFile.name}
                                        className="w-full max-w-3xl aspect-video rounded-xl border border-white/10"
                                        allowFullScreen
                                    />
                                ) : (
                                    <video src={previewFile.url} controls autoPlay className="max-w-full max-h-[60vh] rounded-xl" />
                                )
                            )}
                            {previewFile.type === 'audio' && <audio src={previewFile.url} controls autoPlay className="w-full max-w-md" />}
                        </div>
                        <div className="p-4 bg-neutral-950 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <div className="text-muted-foreground flex flex-col gap-1">
                                    <span>سایز: {formatBytes(previewFile.size)}</span>
                                    <span>مسیر: {previewFile.folder ? `/${previewFile.folder}` : '/'}</span>
                                </div>
                                <div className="flex gap-2 flex-wrap justify-end">
                                    <button onClick={() => handleCopyUrl(previewFile)} className="px-3 py-1.5 bg-neutral-800 rounded-lg text-xs">کپی لینک</button>
                                    <button onClick={() => handleRename(previewFile)} className="px-3 py-1.5 bg-neutral-800 rounded-lg text-xs">تغییر نام</button>
                                    <button onClick={() => {
                                        const newFolder = prompt("نام پوشه جدید را وارد کنید (خالی برای انتقال به روت):", previewFile.folder || "");
                                        if (newFolder !== null) {
                                            startTransition(async () => {
                                                const res = await moveMediaFile(previewFile.id, newFolder.trim());
                                                if (res.success) {
                                                    toast.success("فایل با موفقیت جابجا شد");
                                                    await refreshFiles();
                                                    setPreviewFile({ ...previewFile, folder: newFolder.trim() });
                                                } else {
                                                    toast.error("خطا در جابجایی", { description: res.error });
                                                }
                                            });
                                        }
                                    }} className="px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg text-xs border border-blue-500/20">
                                        انتقال
                                    </button>
                                    {previewFile.type === 'image' && (
                                        <button onClick={() => handleToggleGallery(previewFile)} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs border border-emerald-500/20">
                                            {previewFile.inGallery ? "حذف از گالری" : "افزودن به گالری"}
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(previewFile)} className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-xs">حذف</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Media via Link Modal */}
            <AddMediaLinkModal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                onSuccess={() => {
                    refreshFiles();
                }}
                onSelectAndApply={isModal && onSelect ? (url) => {
                    onSelect(url);
                    if (onClose) onClose();
                } : undefined}
            />
        </div>
    );

    return mode === "page" ? content : (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-neutral-900 border border-border/10 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {content}
            </div>
        </div>
    );
}

function renderUploadZone(getRootProps: any, getInputProps: any, isDragActive: boolean, uploading: boolean, uploadProgress: number, extraClasses = "") {
    return (
        <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-dashed transition-all cursor-pointer font-[Vazirmatn] relative overflow-hidden ${extraClasses} ${isDragActive
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 scale-[1.02]"
                : uploading
                    ? "border-blue-500/50 bg-blue-500/5 text-blue-500"
                    : "border-border/30 hover:border-blue-500/50 hover:bg-blue-500/5 text-muted-foreground hover:text-blue-500 w-full md:w-auto"
                }`}
        >
            <input {...getInputProps()} disabled={uploading} />
            {uploading && (
                <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            )}
            {uploading ? (
                <div className="text-center">
                    <span className="font-bold text-sm">در حال آپلود... {uploadProgress}%</span>
                </div>
            ) : isDragActive ? (
                <span className="font-bold text-sm">رها کنید...</span>
            ) : (
                <>
                    <Upload className="w-5 h-5" />
                    <span className="text-xs font-bold whitespace-nowrap">انتخاب یا کشیدن فایل</span>
                </>
            )}
        </div>
    );
}
