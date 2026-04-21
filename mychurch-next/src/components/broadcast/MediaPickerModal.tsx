import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, Search, FileVideo, Image as ImageIcon, Music, Upload, CheckCircle2 } from "lucide-react";
import { listMediaFiles, MediaAsset } from "@/actions/media";

export interface MediaPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string, type: 'image' | 'video' | 'audio' | 'other') => void;
    title?: string;
    allowedTypes?: ('image' | 'video' | 'audio' | 'all')[];
    isRTL?: boolean;
}

export function MediaPickerModal({ isOpen, onClose, onSelect, title, allowedTypes = ['all'], isRTL = true }: MediaPickerModalProps) {
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | "image" | "video" | "audio">("all");
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "nameAsc" | "nameDesc" | "sizeDesc">("newest");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial restriction
    useEffect(() => {
        if (allowedTypes.length === 1 && allowedTypes[0] !== 'all') {
            setActiveTab(allowedTypes[0]);
        }
    }, [allowedTypes]);

    useEffect(() => {
        if (isOpen) {
            loadFiles();
        }
    }, [isOpen]);

    const loadFiles = async () => {
        setIsLoading(true);
        try {
            const files = await listMediaFiles();
            setAssets(files);
        } catch (error) {
            console.error("Failed to load media files", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const formData = new FormData();
                formData.append('file', files[i]);
                await fetch('/api/media/upload', {
                    method: 'POST',
                    body: formData,
                });
            }
            await loadFiles();
        } catch (error) {
            console.error("Upload failed", error);
            alert(isRTL ? "خطا در آپلود فایل" : "Upload failed");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const filteredAndSortedAssets = useMemo(() => {
        let result = assets;
        
        // Allowed Types Filter Header Constraint
        if (!allowedTypes.includes('all')) {
             result = result.filter(a => allowedTypes.includes(a.type as any));
        }

        // Search Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(a => a.name.toLowerCase().includes(query));
        }

        // Tab Filter
        if (activeTab !== "all") {
            result = result.filter(a => a.type === activeTab);
        }

        // Sort
        return result.sort((a, b) => {
            switch (sortBy) {
                case "newest": return b.createdAt - a.createdAt;
                case "oldest": return a.createdAt - b.createdAt;
                case "nameAsc": return a.name.localeCompare(b.name);
                case "nameDesc": return b.name.localeCompare(a.name);
                case "sizeDesc": return b.size - a.size;
                default: return 0;
            }
        });
    }, [assets, searchQuery, activeTab, sortBy, allowedTypes]);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
    };

    if (!isOpen) return null;

    const translate = {
        title: title || (isRTL ? 'گالری مدیا' : 'Media Gallery'),
        search: isRTL ? 'جستجوی فایل...' : 'Search files...',
        all: isRTL ? 'همه' : 'All',
        image: isRTL ? 'تصاویر' : 'Images',
        video: isRTL ? 'ویدیو' : 'Videos',
        audio: isRTL ? 'صدا' : 'Audio',
        upload: isRTL ? 'آپلود فایل جدید' : 'Upload File',
        uploading: isRTL ? 'در حال آپلود...' : 'Uploading...',
        empty: isRTL ? 'هیچ فایلی یافت نشد.' : 'No files found.',
        newest: isRTL ? 'جدیدترین' : 'Newest',
        oldest: isRTL ? 'قدیمی‌ترین' : 'Oldest',
        nameAsc: isRTL ? 'نام (الف-ی)' : 'Name (A-Z)',
        nameDesc: isRTL ? 'نام (ی-الف)' : 'Name (Z-A)',
        sizeDesc: isRTL ? 'بزرگترین حجم' : 'Largest Size'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5 bg-slate-900 z-10 shrink-0">
                    <h2 className={`text-xl font-bold text-white flex items-center gap-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                        <ImageIcon className="w-5 h-5 text-indigo-400" />
                        {translate.title}
                    </h2>
                    <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 flex flex-col md:flex-row gap-4 justify-between bg-slate-900/50 border-b border-white/5 shrink-0">
                    <div className="flex gap-2 p-1 bg-slate-950/50 rounded-lg border border-white/5">
                        {allowedTypes.includes('all') && (
                            <button
                                onClick={() => setActiveTab("all")}
                                className={`px-4 py-1.5 rounded-md text-sm transition-colors ${activeTab === "all" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                                {translate.all}
                            </button>
                        )}
                        {(allowedTypes.includes('all') || allowedTypes.includes('image')) && (
                            <button
                                onClick={() => setActiveTab("image")}
                                className={`px-4 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors ${activeTab === "image" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                                <ImageIcon className="w-4 h-4" /> {translate.image}
                            </button>
                        )}
                        {(allowedTypes.includes('all') || allowedTypes.includes('video')) && (
                            <button
                                onClick={() => setActiveTab("video")}
                                className={`px-4 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors ${activeTab === "video" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                                <FileVideo className="w-4 h-4" /> {translate.video}
                            </button>
                        )}
                        {(allowedTypes.includes('all') || allowedTypes.includes('audio')) && (
                            <button
                                onClick={() => setActiveTab("audio")}
                                className={`px-4 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-colors ${activeTab === "audio" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                                <Music className="w-4 h-4" /> {translate.audio}
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder={translate.search}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full md:w-48 bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-1.5 text-sm focus:border-indigo-500 transition-colors ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                                dir={isRTL ? "rtl" : "ltr"}
                            />
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className={`bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-indigo-500 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                        >
                            <option value="newest">{translate.newest}</option>
                            <option value="oldest">{translate.oldest}</option>
                            <option value="nameAsc">{translate.nameAsc}</option>
                            <option value="nameDesc">{translate.nameDesc}</option>
                            <option value="sizeDesc">{translate.sizeDesc}</option>
                        </select>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className={`flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 px-3 py-1.5 rounded-lg text-sm text-white transition-colors ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                        >
                            {uploading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                            <span className="hidden md:inline">{uploading ? translate.uploading : translate.upload}</span>
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleUpload}
                            className="hidden"
                            accept={allowedTypes.includes('all') ? "image/*,video/*,audio/*" : allowedTypes.join('/*,') + '/*'}
                            multiple
                        />
                    </div>
                </div>

                {/* Gallery Grid */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="w-8 h-8 flex items-center justify-center">
                                <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                            </div>
                        </div>
                    ) : filteredAndSortedAssets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <ImageIcon className="w-16 h-16 opacity-10 mb-4" />
                            <p className={isRTL ? 'font-[Vazirmatn]' : ''}>{translate.empty}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {filteredAndSortedAssets.map((asset) => (
                                <div
                                    key={asset.url}
                                    onClick={() => {
                                        onSelect(asset.url, asset.type);
                                        onClose();
                                    }}
                                    className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-all cursor-pointer aspect-square flex flex-col"
                                >
                                    <div className="flex-1 w-full bg-black flex items-center justify-center overflow-hidden relative">
                                        {/* Overlay Check on Hover */}
                                        <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center backdrop-blur-[1px]">
                                            <CheckCircle2 className="w-10 h-10 text-white shadow-sm" />
                                        </div>

                                        {asset.type === 'image' && (
                                            <img src={asset.url} alt={asset.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        )}
                                        {asset.type === 'video' && (
                                            <>
                                                <video src={asset.url} className="w-full h-full object-cover opacity-60" />
                                                <FileVideo className="absolute w-8 h-8 text-white/50 z-10" />
                                            </>
                                        )}
                                        {asset.type === 'audio' && (
                                            <Music className="w-12 h-12 text-purple-500/50" />
                                        )}
                                    </div>
                                    <div className="p-2.5 bg-slate-900 border-t border-slate-800 shrink-0">
                                        <p className="text-xs font-medium truncate w-full text-slate-200" title={asset.name} dir="ltr">{asset.name}</p>
                                        <div className="flex justify-between items-center mt-1.5 opacity-60">
                                            <span className="text-[10px] tabular-nums" dir="ltr">{formatBytes(asset.size)}</span>
                                            {asset.type === 'image' && <ImageIcon className={"w-3 h-3 text-emerald-400"} />}
                                            {asset.type === 'video' && <FileVideo className={"w-3 h-3 text-blue-400"} />}
                                            {asset.type === 'audio' && <Music className={"w-3 h-3 text-purple-400"} />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
