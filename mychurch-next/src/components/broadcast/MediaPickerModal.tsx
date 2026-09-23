import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, Search, FileVideo, Image as ImageIcon, Music, Upload, CheckCircle2, Link2, Eye, LayoutGrid, Film } from "lucide-react";
import { listMediaFiles, MediaAsset } from "@/actions/media";
import { AddMediaLinkModal } from "@/components/admin/media/AddMediaLinkModal";
import AccordionMediaPreview, { AccordionMediaItem } from "./AccordionMediaPreview";
import { useLanguage } from "@/providers/LanguageProvider";

const localDict = {
    en: {
        title: 'Media & Background Gallery',
        search: 'Search files or links...',
        all: 'All',
        image: 'Images',
        video: 'Videos',
        audio: 'Audio',
        links: 'Links',
        addLink: 'Add via Link',
        upload: 'Upload File',
        uploading: 'Uploading...',
        empty: 'No files found.',
        newest: 'Newest',
        oldest: 'Oldest',
        nameAsc: 'Name (A-Z)',
        nameDesc: 'Name (Z-A)',
        sizeDesc: 'Largest Size',
        gridView: 'Grid View',
        accordionView: 'Accordion Frames',
        hoverHint: 'Hover over any frame to inspect or click to select:',
        previewBeforeSelect: 'Preview before select',
        link: 'Link',
        audioFile: 'Audio File',
        clickToSelect: 'Click to select',
        uploadFailed: (msg: string) => `Upload failed: ${msg}`,
        externalLinkSize: 'Web link',
    },
    fa: {
        title: 'گالری مدیا و پس‌زمینه‌ها',
        search: 'جستجوی فایل یا لینک...',
        all: 'همه',
        image: 'تصاویر',
        video: 'ویدیوها',
        audio: 'صدا',
        links: 'لینک‌ها',
        addLink: 'افزودن با لینک',
        upload: 'آپلود فایل جدید',
        uploading: 'در حال آپلود...',
        empty: 'هیچ فایلی یافت نشد.',
        newest: 'جدیدترین',
        oldest: 'قدیمی‌ترین',
        nameAsc: 'نام (الف-ی)',
        nameDesc: 'نام (ی-الف)',
        sizeDesc: 'بزرگترین حجم',
        gridView: 'نمایش شبکه‌ای (Grid)',
        accordionView: 'نمایش فریم‌های آکاردئونی (Spotlight Accordion)',
        hoverHint: 'روی هر فریم بروید تا بزرگ‌نمایی و فوکوس روان را مشاهده کنید یا کلیک کنید تا انتخاب شود:',
        previewBeforeSelect: 'پیش‌نمایش قبل از انتخاب',
        link: 'لینک',
        audioFile: 'فایل صوتی',
        clickToSelect: 'کلیک کنید برای انتخاب',
        uploadFailed: (msg: string) => `خطا در آپلود فایل: ${msg}`,
        externalLinkSize: 'لینک اینترنتی',
    },
    es: {
        title: 'Galería de medios y fondos',
        search: 'Buscar archivos o enlaces...',
        all: 'Todos',
        image: 'Imágenes',
        video: 'Videos',
        audio: 'Audio',
        links: 'Enlaces',
        addLink: 'Añadir con enlace',
        upload: 'Subir archivo',
        uploading: 'Subiendo...',
        empty: 'No se encontraron archivos.',
        newest: 'Más reciente',
        oldest: 'Más antiguo',
        nameAsc: 'Nombre (A-Z)',
        nameDesc: 'Nombre (Z-A)',
        sizeDesc: 'Tamaño mayor',
        gridView: 'Vista de cuadrícula',
        accordionView: 'Marcos en acordeón',
        hoverHint: 'Pase el cursor sobre cualquier marco para inspeccionarlo o haga clic para seleccionarlo:',
        previewBeforeSelect: 'Vista previa antes de seleccionar',
        link: 'Enlace',
        audioFile: 'Archivo de audio',
        clickToSelect: 'Haga clic para seleccionar',
        uploadFailed: (msg: string) => `Error al subir: ${msg}`,
        externalLinkSize: 'Enlace web',
    },
};

export interface MediaPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string, type: 'image' | 'video' | 'audio' | 'other') => void;
    title?: string;
    allowedTypes?: ('image' | 'video' | 'audio' | 'all')[];
    isRTL?: boolean;
}

export function MediaPickerModal({ isOpen, onClose, onSelect, title, allowedTypes = ['all'], isRTL = true }: MediaPickerModalProps) {
    const { language } = useLanguage();
    const d = localDict[language] || localDict.fa;
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | "image" | "video" | "audio" | "links">("all");
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "nameAsc" | "nameDesc" | "sizeDesc">("newest");
    const [uploading, setUploading] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "accordion">("grid");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Hover preview state before selecting
    const [hoveredAsset, setHoveredAsset] = useState<MediaAsset | null>(null);
    const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleTileMouseEnter = (asset: MediaAsset, e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

        const cardWidth = 320;
        const cardHeight = 310;

        let x = rect.right + 12;
        if (x + cardWidth > window.innerWidth - 10) {
            x = rect.left - cardWidth - 12;
        }
        if (x < 10) {
            x = Math.max(10, (window.innerWidth - cardWidth) / 2);
        }

        let y = rect.top;
        if (y + cardHeight > window.innerHeight - 10) {
            y = Math.max(10, window.innerHeight - cardHeight - 10);
        }

        hoverTimeoutRef.current = setTimeout(() => {
            setHoverPosition({ x, y });
            setHoveredAsset(asset);
        }, 120);
    };

    const handleTileMouseLeave = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setHoveredAsset(null);
        setHoverPosition(null);
    };

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
                const response = await fetch('/api/media/upload', {
                    method: 'POST',
                    body: formData,
                });
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || 'Upload failed');
                }
            }
            await loadFiles();
        } catch (error: any) {
            console.error("Upload failed", error);
            alert(d.uploadFailed(error.message || ""));
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
            result = result.filter(a => [a.name, a.folder].filter(Boolean).join(' ').toLowerCase().includes(query));
        }

        // Tab Filter
        if (activeTab === "links") {
            result = result.filter(a => a.isExternalLink || a.folder === 'links');
        } else if (activeTab !== "all") {
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
        title: title || d.title,
        search: d.search,
        all: d.all,
        image: d.image,
        video: d.video,
        audio: d.audio,
        links: d.links,
        addLink: d.addLink,
        upload: d.upload,
        uploading: d.uploading,
        empty: d.empty,
        newest: d.newest,
        oldest: d.oldest,
        nameAsc: d.nameAsc,
        nameDesc: d.nameDesc,
        sizeDesc: d.sizeDesc,
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
                    <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950/50 rounded-lg border border-white/5">
                        {allowedTypes.includes('all') && (
                            <button
                                onClick={() => setActiveTab("all")}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${activeTab === "all" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                                {translate.all}
                            </button>
                        )}
                        {(allowedTypes.includes('all') || allowedTypes.includes('image')) && (
                            <button
                                onClick={() => setActiveTab("image")}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors ${activeTab === "image" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                                <ImageIcon className="w-3.5 h-3.5" /> {translate.image}
                            </button>
                        )}
                        {(allowedTypes.includes('all') || allowedTypes.includes('video')) && (
                            <button
                                onClick={() => setActiveTab("video")}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors ${activeTab === "video" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                                <FileVideo className="w-3.5 h-3.5" /> {translate.video}
                            </button>
                        )}
                        {(allowedTypes.includes('all') || allowedTypes.includes('audio')) && (
                            <button
                                onClick={() => setActiveTab("audio")}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors ${activeTab === "audio" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}
                            >
                                <Music className="w-3.5 h-3.5" /> {translate.audio}
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab("links")}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors ${activeTab === "links" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"}`}
                        >
                            <Link2 className="w-3.5 h-3.5" /> {translate.links}
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => document.getElementById("media-modal-search")?.focus()}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                title={translate.search}
                            >
                                <Search className="w-4 h-4" />
                            </button>
                            <input
                                id="media-modal-search"
                                type="text"
                                placeholder={translate.search}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full md:w-44 bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-1.5 text-xs focus:border-indigo-500 transition-colors ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                                dir={isRTL ? "rtl" : "ltr"}
                            />
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className={`bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-indigo-500 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                        >
                            <option value="newest">{translate.newest}</option>
                            <option value="oldest">{translate.oldest}</option>
                            <option value="nameAsc">{translate.nameAsc}</option>
                            <option value="nameDesc">{translate.nameDesc}</option>
                            <option value="sizeDesc">{translate.sizeDesc}</option>
                        </select>

                        {/* View Mode Toggle (Grid / Accordion Frames) */}
                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                            <button
                                type="button"
                                onClick={() => setViewMode("grid")}
                                title={d.gridView}
                                className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode("accordion")}
                                title={d.accordionView}
                                className={`p-1.5 rounded-md transition-colors ${viewMode === "accordion" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
                            >
                                <Film className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Add via Link Button */}
                        <button
                            type="button"
                            onClick={() => setIsLinkModalOpen(true)}
                            className={`flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-lg transition-colors font-[Vazirmatn]`}
                        >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>{translate.addLink}</span>
                        </button>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className={`flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors font-[Vazirmatn]`}
                        >
                            {uploading ? <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                            <span>{uploading ? translate.uploading : translate.upload}</span>
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

                {/* Gallery Content Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-950" onScroll={handleTileMouseLeave}>
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
                    ) : viewMode === "accordion" ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1 text-xs text-slate-400">
                                <span className={isRTL ? 'font-[Vazirmatn]' : ''}>
                                    {d.hoverHint}
                                </span>
                            </div>
                            <AccordionMediaPreview
                                items={filteredAndSortedAssets.map(a => ({
                                    url: a.url,
                                    name: a.name,
                                    type: a.type,
                                    size: a.size,
                                    isExternalLink: a.isExternalLink
                                }))}
                                onSelect={(item) => {
                                    onSelect(item.url, item.type as any);
                                    onClose();
                                }}
                                isRTL={isRTL}
                                height={380}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {filteredAndSortedAssets.map((asset) => (
                                <div
                                    key={asset.url}
                                    onClick={() => {
                                        handleTileMouseLeave();
                                        onSelect(asset.url, asset.type);
                                        onClose();
                                    }}
                                    onMouseEnter={(e) => handleTileMouseEnter(asset, e)}
                                    onMouseLeave={handleTileMouseLeave}
                                    className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 transition-all cursor-pointer aspect-square flex flex-col"
                                >
                                    <div className="flex-1 w-full bg-black flex items-center justify-center overflow-hidden relative">
                                        {/* Overlay Check on Hover */}
                                        <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center backdrop-blur-[1px]">
                                            <CheckCircle2 className="w-10 h-10 text-white shadow-sm" />
                                        </div>

                                        {/* External Link Badge */}
                                        {asset.isExternalLink && (
                                            <span className="absolute top-2 right-2 z-10 bg-amber-500/90 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow">
                                                <Link2 className="w-2.5 h-2.5" />
                                                {d.link}
                                            </span>
                                        )}

                                        {asset.type === 'image' && (
                                            <img src={asset.url} alt={asset.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        )}
                                        {asset.type === 'video' && (
                                            <>
                                                <video src={asset.url} className="w-full h-full object-cover opacity-60" />
                                                <FileVideo className="absolute w-8 h-8 text-white/70 z-10" />
                                            </>
                                        )}
                                        {asset.type === 'audio' && (
                                            <Music className="w-12 h-12 text-purple-500/50" />
                                        )}
                                    </div>
                                    <div className="p-2.5 bg-slate-900 border-t border-slate-800 shrink-0">
                                        <p className="text-xs font-medium truncate w-full text-slate-200" title={asset.name} dir="ltr">{asset.name}</p>
                                        <div className="flex justify-between items-center mt-1.5 opacity-60">
                                            <span className="text-[10px] tabular-nums" dir="ltr">
                                                {asset.isExternalLink ? d.externalLinkSize : formatBytes(asset.size)}
                                            </span>
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

                {/* Add Media Link Modal */}
                <AddMediaLinkModal
                    isOpen={isLinkModalOpen}
                    onClose={() => setIsLinkModalOpen(false)}
                    isRTL={isRTL}
                    onSuccess={() => {
                        loadFiles();
                    }}
                    onSelectAndApply={(newUrl, newType) => {
                        onSelect(newUrl, newType);
                        onClose();
                    }}
                />

                {/* Floating Live Hover Preview Card */}
                {hoveredAsset && hoverPosition && (
                    <div
                        style={{ top: hoverPosition.y, left: hoverPosition.x }}
                        className="fixed z-[130] pointer-events-none w-80 bg-slate-950/95 border border-indigo-500/60 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
                        dir={isRTL ? "rtl" : "ltr"}
                    >
                        {/* Preview Header */}
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <Eye className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span className="text-[11px] font-bold text-indigo-300">
                                    {d.previewBeforeSelect}
                                </span>
                            </div>
                            <span className="text-[10px] font-mono bg-white/10 text-slate-300 px-1.5 py-0.5 rounded">
                                {hoveredAsset.isExternalLink ? d.link : formatBytes(hoveredAsset.size)}
                            </span>
                        </div>

                        {/* Media Preview Box (Uncropped full aspect ratio) */}
                        <div className="w-full h-48 bg-black/90 rounded-xl overflow-hidden flex items-center justify-center border border-white/10 relative shadow-inner">
                            {hoveredAsset.type === 'image' && (
                                <img
                                    src={hoveredAsset.url}
                                    alt={hoveredAsset.name}
                                    className="w-full h-full object-contain"
                                />
                            )}
                            {hoveredAsset.type === 'video' && (
                                <video
                                    src={hoveredAsset.url}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-contain"
                                />
                            )}
                            {hoveredAsset.type === 'audio' && (
                                <div className="flex flex-col items-center gap-2 text-purple-400">
                                    <Music className="w-12 h-12 animate-pulse" />
                                    <span className="text-xs font-bold text-slate-300">{d.audioFile}</span>
                                </div>
                            )}
                        </div>

                        {/* Info & Action Hint */}
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-white truncate" dir="ltr">
                                {hoveredAsset.name}
                            </p>
                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {d.clickToSelect}
                                </span>
                                <span className="capitalize text-slate-500 font-mono text-[10px]">{hoveredAsset.type}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
