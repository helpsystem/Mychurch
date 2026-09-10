"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import { 
    ScanLine, Camera, UploadCloud, FileText, CheckCircle, AlertTriangle, 
    Search, RefreshCw, Shield, Lock, Eye, Download, Trash2, Copy, 
    Sparkles, RotateCw, ZoomIn, Sliders, Check, Clock, User, ArrowRight,
    HelpCircle, Tag, ExternalLink, HardDrive, Wifi, Play, Pause, ChevronDown
} from "lucide-react";
import { ScannedDocument, DocumentStats, saveScannedDocument, softDeleteScannedDocument } from "@/actions/scannedDocuments";

interface Props {
    initialDocuments: ScannedDocument[];
    initialStats: DocumentStats;
    userEmail: string;
    isAdmin: boolean;
}

export default function DocumentScannerClient({ initialDocuments, initialStats, userEmail, isAdmin }: Props) {
    const [activeTab, setActiveTab] = useState<'hardware' | 'camera' | 'upload'>('hardware');
    const [documents, setDocuments] = useState<ScannedDocument[]>(initialDocuments);
    const [stats, setStats] = useState<DocumentStats>(initialStats);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [securityFilter, setSecurityFilter] = useState("all");
    const [isPending, startTransition] = useTransition();

    // Alert toast
    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const showToast = (type: 'success' | 'error' | 'info', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    };

    // Scanned Image state
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [currentFileName, setCurrentFileName] = useState<string>("scanned_doc.jpg");
    const [currentMimeType, setCurrentMimeType] = useState<string>("image/jpeg");
    const [scannerSource, setScannerSource] = useState<'hardware_escl' | 'camera_scanner' | 'file_upload'>('hardware_escl');
    const [imageRotation, setImageRotation] = useState<number>(0);

    // Hardware Scanner State (eSCL)
    const [scannerHost, setScannerHost] = useState("192.168.1.50");
    const [scannerStatus, setScannerStatus] = useState<'idle' | 'testing' | 'online' | 'offline'>('idle');
    const [scannerMessage, setScannerMessage] = useState<string>("");
    const [scanResolution, setScanResolution] = useState<number>(300);
    const [scanColorMode, setScanColorMode] = useState<string>("RGB24");
    const [scanInputSource, setScanInputSource] = useState<string>("Platen");
    const [isHardwareScanning, setIsHardwareScanning] = useState(false);

    // Live Camera Scanner State
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraFilter, setCameraFilter] = useState<'none' | 'bw' | 'grayscale' | 'contrast'>('bw');
    const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string>("");
    const [streamInstance, setStreamInstance] = useState<MediaStream | null>(null);

    // OCR Execution State
    const [isOcrProcessing, setIsOcrProcessing] = useState(false);
    const [ocrProgressText, setOcrProgressText] = useState<string>("");
    const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);

    // Extracted Fields State (Editable before saving)
    const [extractedTitle, setExtractedTitle] = useState("");
    const [extractedCategory, setExtractedCategory] = useState("archive");
    const [extractedSecurity, setExtractedSecurity] = useState("confidential");
    const [extractedCertNumber, setExtractedCertNumber] = useState("");
    const [extractedDates, setExtractedDates] = useState<string[]>([]);
    const [extractedNames, setExtractedNames] = useState<string[]>([]);
    const [extractedTags, setExtractedTags] = useState<string[]>([]);
    const [extractedSummary, setExtractedSummary] = useState("");
    const [extractedText, setExtractedText] = useState("");

    // Modal view for viewing OCR text of existing document
    const [viewingDoc, setViewingDoc] = useState<ScannedDocument | null>(null);

    // ----------------------------------------------------
    // 1. Hardware Scanner Functions (eSCL)
    // ----------------------------------------------------
    const testScannerConnection = async () => {
        if (!scannerHost.trim()) {
            showToast('error', 'لطفا آدرس IP یا نام شبکه اسکنر را وارد کنید.');
            return;
        }

        setScannerStatus('testing');
        setScannerMessage('در حال ارسال درخواست به اسکنر...');

        try {
            const res = await fetch('/api/admin/documents/scanner-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'ping', scannerHost })
            });
            const data = await res.json();

            if (data.success && data.online) {
                setScannerStatus('online');
                setScannerMessage(data.message || 'اسکنر با موفقیت شناسایی شد و آماده است.');
                showToast('success', 'اتصال به اسکنر سخت‌افزاری با موفقیت برقرار شد.');
            } else {
                setScannerStatus('offline');
                setScannerMessage(data.error || 'پاسخی از اسکنر دریافت نشد.');
                showToast('info', 'اسکنر با این IP پاسخ نداد. می‌توانید از اسکنر دوربین یا آپلود فایل استفاده کنید.');
            }
        } catch (err: any) {
            setScannerStatus('offline');
            setScannerMessage(`خطای شبکه: ${err.message}`);
            showToast('error', 'خطا در ارتباط با سرور پروکسی اسکنر.');
        }
    };

    const triggerHardwareScan = async () => {
        if (!scannerHost.trim()) {
            showToast('error', 'لطفا آدرس IP اسکنر را مشخص فرمایید.');
            return;
        }

        setIsHardwareScanning(true);
        showToast('info', 'دستور اسکن به دستگاه ارسال شد. لطفا تا تکمیل اسکن منتظر بمانید...');

        try {
            const res = await fetch('/api/admin/documents/scanner-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'scan',
                    scannerHost,
                    resolution: scanResolution,
                    colorMode: scanColorMode,
                    inputSource: scanInputSource
                })
            });

            const data = await res.json();
            if (data.success && data.dataUrl) {
                setCurrentImage(data.dataUrl);
                setCurrentFileName(`scan_escl_${Date.now()}.jpg`);
                setCurrentMimeType(data.mimeType || 'image/jpeg');
                setScannerSource('hardware_escl');
                showToast('success', 'تصویر با موفقیت از اسکنر دریافت شد. در حال اجرای OCR...');
                // Automatically run OCR
                executeOCR(data.dataUrl);
            } else {
                showToast('error', data.error || 'خطا در دریافت سند از اسکنر.');
            }
        } catch (err: any) {
            showToast('error', `خطا در فرآیند اسکن سخت‌افزاری: ${err.message}`);
        } finally {
            setIsHardwareScanning(false);
        }
    };

    // ----------------------------------------------------
    // 2. Live Camera Scanner Functions
    // ----------------------------------------------------
    useEffect(() => {
        // Enumerate video devices
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices().then(devices => {
                const videoInputs = devices.filter(d => d.kind === 'videoinput');
                setAvailableCameras(videoInputs);
                if (videoInputs.length > 0 && !selectedCameraId) {
                    setSelectedCameraId(videoInputs[0].deviceId);
                }
            }).catch(console.warn);
        }

        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            stopCamera();
            const constraints: MediaStreamConstraints = {
                video: {
                    deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
                    width: { ideal: 3840, min: 1920 },
                    height: { ideal: 2160, min: 1080 },
                    facingMode: 'environment'
                },
                audio: false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setStreamInstance(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setIsCameraActive(true);
            showToast('success', 'دوربین فعال شد. سند را داخل کادر تنظیم نمایید.');
        } catch (err: any) {
            console.error('Camera access error:', err);
            showToast('error', 'امکان دسترسی به دوربین وجود ندارد. مجوز دسترسی مرورگر را بررسی فرمایید.');
        }
    };

    const stopCamera = () => {
        if (streamInstance) {
            streamInstance.getTracks().forEach(t => t.stop());
            setStreamInstance(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };

    const captureCameraSnapshot = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = video.videoWidth || 1920;
        canvas.height = video.videoHeight || 1080;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw raw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Apply Real-time Image Filter if selected
        if (cameraFilter !== 'none') {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const d = imgData.data;

            if (cameraFilter === 'bw') {
                // High contrast binarization (Otsu-like threshold for crisp document text)
                for (let i = 0; i < d.length; i += 4) {
                    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
                    const val = gray > 140 ? 255 : 0;
                    d[i] = val;
                    d[i + 1] = val;
                    d[i + 2] = val;
                }
            } else if (cameraFilter === 'grayscale') {
                for (let i = 0; i < d.length; i += 4) {
                    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
                    d[i] = gray;
                    d[i + 1] = gray;
                    d[i + 2] = gray;
                }
            } else if (cameraFilter === 'contrast') {
                // Auto contrast enhancement
                const factor = (259 * (128 + 50)) / (255 * (259 - 50));
                for (let i = 0; i < d.length; i += 4) {
                    d[i] = Math.min(255, Math.max(0, factor * (d[i] - 128) + 128));
                    d[i + 1] = Math.min(255, Math.max(0, factor * (d[i + 1] - 128) + 128));
                    d[i + 2] = Math.min(255, Math.max(0, factor * (d[i + 2] - 128) + 128));
                }
            }
            ctx.putImageData(imgData, 0, 0);
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setCurrentImage(dataUrl);
        setCurrentFileName(`camera_scan_${Date.now()}.jpg`);
        setCurrentMimeType('image/jpeg');
        setScannerSource('camera_scanner');
        stopCamera();
        showToast('success', 'تصویر سند ثبت شد. در حال بازشناسی متن (OCR)...');
        executeOCR(dataUrl);
    };

    // ----------------------------------------------------
    // 3. File Upload Mode
    // ----------------------------------------------------
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCurrentFileName(file.name);
        setCurrentMimeType(file.type || 'image/jpeg');
        setScannerSource('file_upload');

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setCurrentImage(dataUrl);
            showToast('info', 'سند با موفقیت بارگذاری شد. شروع پردازش OCR...');
            executeOCR(dataUrl);
        };
        reader.readAsDataURL(file);
    };

    // ----------------------------------------------------
    // 4. OCR Execution Function
    // ----------------------------------------------------
    const executeOCR = async (dataUrl: string) => {
        setIsOcrProcessing(true);
        setOcrProgressText('در حال آماده‌سازی و ارسال سند به موتور OCR...');
        setOcrConfidence(null);

        try {
            setOcrProgressText('در حال بازشناسی حروف دوزبانه فارسی و انگلیسی (Tesseract)...');

            const res = await fetch('/api/admin/documents/ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: dataUrl })
            });

            const data = await res.json();

            if (data.success) {
                setExtractedText(data.rawText || '');
                setOcrConfidence(data.confidence || 90);
                setExtractedTitle(data.suggestedTitle || 'سند جدید کلیسا');
                setExtractedCategory(data.suggestedCategory || 'archive');
                setExtractedSummary(data.summary || '');
                if (data.entities?.certificateNumber) {
                    setExtractedCertNumber(data.entities.certificateNumber);
                }
                if (Array.isArray(data.entities?.dates)) {
                    setExtractedDates(data.entities.dates);
                }
                if (Array.isArray(data.entities?.names)) {
                    setExtractedNames(data.entities.names);
                }
                if (Array.isArray(data.entities?.keywords)) {
                    setExtractedTags(data.entities.keywords);
                }

                showToast('success', `پردازش OCR با موفقیت انجام شد (دقت: ${data.confidence || 90}٪)`);
            } else {
                showToast('error', data.error || 'خطا در فرآیند استخراج متن');
            }
        } catch (err: any) {
            console.error('OCR failed:', err);
            showToast('error', `خطا در پردازش OCR: ${err.message}`);
        } finally {
            setIsOcrProcessing(false);
            setOcrProgressText('');
        }
    };

    // ----------------------------------------------------
    // 5. Save Document to Database & Storage
    // ----------------------------------------------------
    const handleSaveDocument = async () => {
        if (!currentImage) {
            showToast('error', 'لطفا ابتدا یک سند اسکن یا بارگذاری فرمایید.');
            return;
        }

        if (!extractedTitle.trim()) {
            showToast('error', 'لطفا برای سند یک عنوان وارد کنید.');
            return;
        }

        startTransition(async () => {
            const cleanBase64 = currentImage.replace(/^data:[^;]+;base64,/, '');
            const approximateSize = Math.round(cleanBase64.length * 0.75);

            const res = await saveScannedDocument({
                title: extractedTitle,
                category: extractedCategory,
                security_level: extractedSecurity,
                scanner_source: scannerSource,
                fileBase64: currentImage,
                fileName: currentFileName,
                fileSize: approximateSize,
                mimeType: currentMimeType,
                ocr_text: extractedText,
                ocr_summary: extractedSummary,
                ocr_metadata: {
                    confidence: ocrConfidence,
                    certificateNumber: extractedCertNumber,
                    dates: extractedDates,
                    names: extractedNames
                },
                tags: extractedTags
            });

            if (res.success && res.documentId) {
                showToast('success', 'سند با موفقیت در آرشیو امن کلیسا ذخیره شد و در لاگ سیستم ثبت گردید.');

                // Add to local documents list
                const newDoc: ScannedDocument = {
                    id: res.documentId,
                    title: extractedTitle,
                    category: extractedCategory,
                    security_level: extractedSecurity,
                    file_url: currentFileName,
                    file_name: currentFileName,
                    file_size: approximateSize,
                    mime_type: currentMimeType,
                    scanner_source: scannerSource,
                    ocr_text: extractedText,
                    ocr_summary: extractedSummary,
                    ocr_metadata: { certificateNumber: extractedCertNumber, dates: extractedDates },
                    ocr_status: 'completed',
                    tags: extractedTags,
                    uploaded_by: userEmail,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    is_deleted: false,
                    deleted_at: null,
                    deleted_by: null,
                    signed_download_url: currentImage
                };

                setDocuments(prev => [newDoc, ...prev]);
                setStats(prev => ({
                    ...prev,
                    totalDocuments: prev.totalDocuments + 1,
                    ocrProcessedCount: prev.ocrProcessedCount + 1,
                    confidentialCount: extractedSecurity === 'confidential' ? prev.confidentialCount + 1 : prev.confidentialCount,
                    topSecretCount: extractedSecurity === 'top_secret' ? prev.topSecretCount + 1 : prev.topSecretCount
                }));

                // Reset form
                setCurrentImage(null);
                setExtractedText("");
                setExtractedTitle("");
                setExtractedSummary("");
                setExtractedCertNumber("");
                setExtractedDates([]);
                setExtractedNames([]);
                setExtractedTags([]);
            } else {
                showToast('error', res.error || 'خطا در ذخیره سازی سند.');
            }
        });
    };

    // ----------------------------------------------------
    // 6. Delete Document (Soft Delete -> Trash)
    // ----------------------------------------------------
    const handleDeleteDocument = async (id: string, title: string) => {
        if (!confirm(`آیا از انتقال سند "${title}" به سطل بازیافت اطمینان دارید؟`)) return;

        startTransition(async () => {
            const res = await softDeleteScannedDocument(id);
            if (res.success) {
                setDocuments(prev => prev.filter(d => d.id !== id));
                showToast('success', `سند "${title}" به سطل بازیافت منتقل شد.`);
            } else {
                showToast('error', res.error || 'خطا در حذف سند');
            }
        });
    };

    // Filtered documents list
    const filteredDocuments = documents.filter(doc => {
        if (categoryFilter !== 'all' && doc.category !== categoryFilter) return false;
        if (securityFilter !== 'all' && doc.security_level !== securityFilter) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const inTitle = doc.title?.toLowerCase().includes(q);
            const inOcr = doc.ocr_text?.toLowerCase().includes(q);
            const inSummary = doc.ocr_summary?.toLowerCase().includes(q);
            const inTags = doc.tags?.some(t => t.toLowerCase().includes(q));
            if (!inTitle && !inOcr && !inSummary && !inTags) return false;
        }
        return true;
    });

    const getSecurityBadge = (level: string) => {
        switch (level) {
            case 'top_secret':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1"><Lock className="w-3 h-3" /> فوق‌محرمانه</span>;
            case 'confidential':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"><Shield className="w-3 h-3" /> محرمانه</span>;
            case 'restricted':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1"><Lock className="w-3 h-3" /> محدود</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">عمومی / عادی</span>;
        }
    };

    const getCategoryBadge = (cat: string) => {
        const map: Record<string, { label: string; color: string }> = {
            baptism: { label: 'تعمید', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
            marriage: { label: 'ازدواج', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
            letter: { label: 'نامه رسمی', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
            invoice: { label: 'مالی / فاکتور', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            identity: { label: 'مدارک شناسایی', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
            contract: { label: 'قرارداد', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
            archive: { label: 'بایگانی عمومی', color: 'text-neutral-400 bg-white/5 border-white/10' }
        };
        const item = map[cat] || { label: cat, color: 'text-neutral-400 bg-white/5 border-white/10' };
        return <span className={`px-2 py-0.5 rounded-lg text-xs border ${item.color}`}>{item.label}</span>;
    };

    return (
        <div className="space-y-8 font-[Vazirmatn]" dir="rtl">
            {/* Header Toast Notification */}
            {toast && (
                <div className={`fixed top-5 left-5 z-50 p-4 rounded-2xl flex items-center gap-3 border shadow-2xl backdrop-blur-2xl transition-all animate-bounce ${
                    toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200' :
                    toast.type === 'error' ? 'bg-rose-950/90 border-rose-500/40 text-rose-200' :
                    'bg-neutral-900/90 border-cyan-500/40 text-cyan-200'
                }`}>
                    {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
                    {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
                    {toast.type === 'info' && <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />}
                    <span className="text-sm font-medium">{toast.message}</span>
                </div>
            )}

            {/* Top Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-xl flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground">کل اسناد اسکن‌شده</span>
                    <div className="text-3xl font-extrabold text-white mt-2">
                        {stats.totalDocuments.toLocaleString('fa-IR')}
                    </div>
                    <span className="text-[11px] text-cyan-400 mt-1 flex items-center gap-1">
                        <HardDrive className="w-3 h-3" /> بایگانی امن کلیسا
                    </span>
                </div>

                <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-xl flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground">اسناد فوق‌محرمانه و محرمانه</span>
                    <div className="text-3xl font-extrabold text-amber-400 mt-2">
                        {(stats.confidentialCount + stats.topSecretCount).toLocaleString('fa-IR')}
                    </div>
                    <span className="text-[11px] text-amber-300 mt-1 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> دسترسی محدود و رمزنگاری‌شده
                    </span>
                </div>

                <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-xl flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground">اسناد با متن OCR شده</span>
                    <div className="text-3xl font-extrabold text-emerald-400 mt-2">
                        {stats.ocrProcessedCount.toLocaleString('fa-IR')}
                    </div>
                    <span className="text-[11px] text-emerald-300 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> قابل جستجوی متن کامل
                    </span>
                </div>

                <div className="p-5 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-xl flex flex-col justify-between">
                    <span className="text-xs text-muted-foreground">حجم کل بایگانی امن</span>
                    <div className="text-2xl font-bold text-indigo-300 mt-2">
                        {(stats.totalSizeBytes / (1024 * 1024)).toFixed(1)} مگابایت
                    </div>
                    <span className="text-[11px] text-indigo-300 mt-1 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> لینک‌های موقت اعتبارسنجی
                    </span>
                </div>
            </div>

            {/* Main Scanner Working Console */}
            <div className="p-6 rounded-3xl bg-neutral-900/70 border border-white/15 backdrop-blur-2xl shadow-2xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                            <ScanLine className="w-6 h-6 text-cyan-400" />
                            مرکز اسکن هوشمند و بازشناسی متن اسناد (OCR)
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1">
                            انتخاب روش اسکن: اتصال مستقیم به اسکنر سخت‌افزاری کامپیوتر، اسکنر زنده دوربین با فیلتر اسناد، یا آپلود فایل
                        </p>
                    </div>

                    {/* Mode Navigation Tabs */}
                    <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/40 border border-white/10">
                        <button
                            onClick={() => { setActiveTab('hardware'); stopCamera(); }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                activeTab === 'hardware' 
                                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' 
                                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Wifi className="w-4 h-4" />
                            اسکنر کامپیوتر (eSCL)
                        </button>

                        <button
                            onClick={() => { setActiveTab('camera'); startCamera(); }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                activeTab === 'camera' 
                                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' 
                                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Camera className="w-4 h-4" />
                            اسکنر زنده دوربین
                        </button>

                        <button
                            onClick={() => { setActiveTab('upload'); stopCamera(); }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                activeTab === 'upload' 
                                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' 
                                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <UploadCloud className="w-4 h-4" />
                            آپلود فایل / PDF
                        </button>
                    </div>
                </div>

                {/* TAB 1: Hardware Scanner (eSCL WebScan) */}
                {activeTab === 'hardware' && (
                    <div className="space-y-6">
                        <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="flex-1 min-w-[260px] space-y-2">
                                    <label className="text-xs font-medium text-neutral-300 flex items-center gap-2">
                                        <HardDrive className="w-4 h-4 text-cyan-400" />
                                        آدرس IP یا نام شبکه اسکنر سخت‌افزاری (LAN / USB Bridge):
                                    </label>
                                    <input
                                        type="text"
                                        value={scannerHost}
                                        onChange={(e) => setScannerHost(e.target.value)}
                                        placeholder="مانند 192.168.1.50 یا localhost:11195"
                                        className="w-full bg-neutral-900 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-cyan-500 font-mono text-left"
                                        dir="ltr"
                                    />
                                </div>

                                <button
                                    onClick={testScannerConnection}
                                    disabled={scannerStatus === 'testing'}
                                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {scannerStatus === 'testing' ? (
                                        <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                                    ) : (
                                        <Wifi className="w-4 h-4 text-cyan-400" />
                                    )}
                                    بررسی وضعیت اتصال
                                </button>
                            </div>

                            {/* Scanner Status Message */}
                            {scannerMessage && (
                                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                                    scannerStatus === 'online' 
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                                        : 'bg-neutral-800/80 border-white/10 text-neutral-300'
                                }`}>
                                    {scannerStatus === 'online' ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                                    <span>{scannerMessage}</span>
                                </div>
                            )}

                            {/* Scanner Hardware Settings */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/10">
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1.5">کیفیت و وضوح (Resolution):</label>
                                    <select
                                        value={scanResolution}
                                        onChange={(e) => setScanResolution(Number(e.target.value))}
                                        className="w-full bg-neutral-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value={150}>150 DPI (پیش‌نویس سریع)</option>
                                        <option value={300}>300 DPI (استاندارد اسناد رسمی)</option>
                                        <option value={600}>600 DPI (کیفیت بالا - اسناد قدیمی/تعمید)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1.5">حالت رنگی (Color Mode):</label>
                                    <select
                                        value={scanColorMode}
                                        onChange={(e) => setScanColorMode(e.target.value)}
                                        className="w-full bg-neutral-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="RGB24">تمام رنگی (Full Color RGB)</option>
                                        <option value="Grayscale8">مقیاس خاکستری (Grayscale)</option>
                                        <option value="BlackAndWhite1">سیاه و سفید تک‌رنگ (Lineart B&W)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1.5">ورودی سند (Input Source):</label>
                                    <select
                                        value={scanInputSource}
                                        onChange={(e) => setScanInputSource(e.target.value)}
                                        className="w-full bg-neutral-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="Platen">شیشه تخت اسکنر (Flatbed Platen)</option>
                                        <option value="ADF">تغذیه خودکار دسته‌ای (ADF)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Trigger Hardware Scan Button */}
                            <div className="pt-2 flex justify-end">
                                <button
                                    onClick={triggerHardwareScan}
                                    disabled={isHardwareScanning}
                                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm transition-all shadow-xl shadow-cyan-500/20 flex items-center gap-2.5 disabled:opacity-50"
                                >
                                    {isHardwareScanning ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            در حال اسکن و دریافت سند...
                                        </>
                                    ) : (
                                        <>
                                            <ScanLine className="w-5 h-5" />
                                            شروع اسکن از دستگاه
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: Live Camera / Document Scanner */}
                {activeTab === 'camera' && (
                    <div className="space-y-4">
                        <div className="relative rounded-2xl bg-black border border-white/15 overflow-hidden max-w-2xl mx-auto aspect-[4/3] flex items-center justify-center">
                            <video
                                ref={videoRef}
                                playsInline
                                muted
                                autoPlay
                                className={`w-full h-full object-cover ${
                                    cameraFilter === 'bw' ? 'filter contrast-200 grayscale brightness-95' :
                                    cameraFilter === 'grayscale' ? 'filter grayscale' :
                                    cameraFilter === 'contrast' ? 'filter contrast-150' : ''
                                }`}
                            />

                            {/* Document Alignment Guideline Overlay */}
                            <div className="absolute inset-8 border-2 border-cyan-400/70 border-dashed rounded-xl pointer-events-none flex items-center justify-center">
                                <span className="px-3 py-1 rounded-full bg-black/60 text-cyan-300 text-[11px] backdrop-blur-md">
                                    سند را داخل این کادر قرار دهید
                                </span>
                            </div>

                            {!isCameraActive && (
                                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center space-y-3">
                                    <Camera className="w-12 h-12 text-muted-foreground animate-pulse" />
                                    <p className="text-sm text-neutral-300">دوربین غیرفعال است. جهت شروع دکمه زیر را لمس نمایید.</p>
                                    <button
                                        onClick={startCamera}
                                        className="px-5 py-2.5 rounded-xl bg-cyan-500 text-black font-bold text-xs hover:bg-cyan-400"
                                    >
                                        فعال‌سازی دوربین اسناد
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Camera Controls & Enhancement Filters */}
                        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">فیلتر پردازش سند:</span>
                                <button
                                    onClick={() => setCameraFilter('bw')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        cameraFilter === 'bw' ? 'bg-cyan-500 text-black font-bold' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                                    }`}
                                >
                                    سند رسمی (سیاه و سفید تیز)
                                </button>
                                <button
                                    onClick={() => setCameraFilter('grayscale')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        cameraFilter === 'grayscale' ? 'bg-cyan-500 text-black font-bold' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                                    }`}
                                >
                                    خاکستری (Grayscale)
                                </button>
                                <button
                                    onClick={() => setCameraFilter('none')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        cameraFilter === 'none' ? 'bg-cyan-500 text-black font-bold' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                                    }`}
                                >
                                    رنگی طبیعی
                                </button>
                            </div>

                            <button
                                onClick={captureCameraSnapshot}
                                disabled={!isCameraActive}
                                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                            >
                                <Camera className="w-4 h-4" />
                                ثبت تصویر با کیفیت بالا و استخراج OCR
                            </button>
                        </div>
                    </div>
                )}

                {/* TAB 3: Secure Drag & Drop File Upload */}
                {activeTab === 'upload' && (
                    <div className="p-10 rounded-2xl border-2 border-dashed border-white/20 hover:border-cyan-500/60 transition-all text-center space-y-4 bg-black/30">
                        <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                            <UploadCloud className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">آپلود امن فایل‌های اسکن‌شده یا مدارک</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                فایل‌های تصویری (PNG, JPG, TIFF, WEBP) و PDF با بازشناسی خودکار حروف فارسی و انگلیسی
                            </p>
                        </div>
                        <div>
                            <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs cursor-pointer transition-all">
                                <FileText className="w-4 h-4 text-cyan-400" />
                                انتخاب فایل از کامپیوتر
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </label>
                        </div>
                    </div>
                )}

                {/* OCR Loading Indicator Banner */}
                {isOcrProcessing && (
                    <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs flex items-center gap-3 animate-pulse">
                        <RefreshCw className="w-5 h-5 animate-spin text-cyan-400 shrink-0" />
                        <div>
                            <strong className="font-bold block text-sm">موتور بازشناسی هوشمند OCR در حال اجراست...</strong>
                            <p className="text-[11px] text-cyan-300/80 mt-0.5">{ocrProgressText}</p>
                        </div>
                    </div>
                )}

                {/* Split Verification Panel: Scanned Image Preview vs Extracted OCR Fields */}
                {currentImage && (
                    <div className="p-6 rounded-2xl bg-black/60 border border-white/15 space-y-6">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                پیش‌نمایش سند اسکن‌شده و اطلاعات بازشناسی‌شده
                            </h3>
                            {ocrConfidence !== null && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    دقت OCR: {ocrConfidence}٪
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Left Side: Scanned Document Image Preview */}
                            <div className="lg:col-span-5 space-y-3">
                                <div className="rounded-xl border border-white/15 bg-neutral-950 p-2 overflow-hidden flex items-center justify-center max-h-[500px]">
                                    <img
                                        src={currentImage}
                                        alt="Scanned Document"
                                        style={{ transform: `rotate(${imageRotation}deg)` }}
                                        className="max-w-full max-h-[460px] object-contain rounded-lg transition-transform duration-300"
                                    />
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                                    <span>منبع: {scannerSource}</span>
                                    <button
                                        onClick={() => setImageRotation(prev => (prev + 90) % 360)}
                                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                                    >
                                        <RotateCw className="w-3.5 h-3.5" /> چرخش ۹۰ درجه
                                    </button>
                                </div>
                            </div>

                            {/* Right Side: Extracted Structured Fields & Text Editor */}
                            <div className="lg:col-span-7 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-neutral-300">عنوان سند:</label>
                                        <input
                                            type="text"
                                            value={extractedTitle}
                                            onChange={(e) => setExtractedTitle(e.target.value)}
                                            placeholder="عنوان سند رسمی کلیسا"
                                            className="w-full bg-neutral-900 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-[Vazirmatn]"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-neutral-300">دسته‌بندی آرشیو:</label>
                                        <select
                                            value={extractedCategory}
                                            onChange={(e) => setExtractedCategory(e.target.value)}
                                            className="w-full bg-neutral-900 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-[Vazirmatn]"
                                        >
                                            <option value="baptism">گواهی تعمید (Baptism)</option>
                                            <option value="marriage">سند عقد و ازدواج (Marriage)</option>
                                            <option value="letter">نامه اداری و رسمی (Letter)</option>
                                            <option value="invoice">سند مالی و هدایا (Financial)</option>
                                            <option value="identity">مدارک شناسایی و پاسپورت (ID)</option>
                                            <option value="contract">قرارداد رسمی (Contract)</option>
                                            <option value="archive">بایگانی عمومی (Archive)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-neutral-300">سطح امنیت و محرمانگی:</label>
                                        <select
                                            value={extractedSecurity}
                                            onChange={(e) => setExtractedSecurity(e.target.value)}
                                            className="w-full bg-neutral-900 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-[Vazirmatn]"
                                        >
                                            <option value="confidential">🟠 محرمانه (دسترسی رهبران و ادمین)</option>
                                            <option value="top_secret">🔴 فوق‌محرمانه (صرفاً ادمین ارشد)</option>
                                            <option value="restricted">🟡 دسترسی محدود (بر اساس مجوز)</option>
                                            <option value="normal">🟢 عادی (بایگانی عمومی کلیسا)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-neutral-300">شماره ثبت یا سریال سند:</label>
                                        <input
                                            type="text"
                                            value={extractedCertNumber}
                                            onChange={(e) => setExtractedCertNumber(e.target.value)}
                                            placeholder="مانند BAPT-2024-001"
                                            className="w-full bg-neutral-900 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono text-left"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                {/* Extracted Tags & Dates */}
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                    {extractedDates.map((d, i) => (
                                        <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1 font-mono">
                                            <Clock className="w-3 h-3" /> {d}
                                        </span>
                                    ))}
                                    {extractedNames.map((n, i) => (
                                        <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                                            <User className="w-3 h-3" /> {n}
                                        </span>
                                    ))}
                                </div>

                                {/* Full Extracted Textarea */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-neutral-300">متن استخراج‌شده OCR (فارسی / انگلیسی):</label>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(extractedText);
                                                showToast('info', 'متن در کلیپ‌بورد کپی شد.');
                                            }}
                                            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                                        >
                                            <Copy className="w-3 h-3" /> کپی متن
                                        </button>
                                    </div>
                                    <textarea
                                        rows={6}
                                        value={extractedText}
                                        onChange={(e) => setExtractedText(e.target.value)}
                                        placeholder="متن استخراج‌شده توسط OCR در اینجا قرار می‌گیرد..."
                                        className="w-full bg-neutral-900 border border-white/15 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500 leading-relaxed font-[Vazirmatn]"
                                    />
                                </div>

                                {/* Save Action Button */}
                                <div className="pt-2 flex justify-end gap-3">
                                    <button
                                        onClick={() => setCurrentImage(null)}
                                        className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium"
                                    >
                                        انصراف و پاکسازی
                                    </button>
                                    <button
                                        onClick={handleSaveDocument}
                                        disabled={isPending}
                                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                        ذخیره امن در بایگانی محرمانه کلیسا
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* SECTION 2: Searchable Secure Document Archive Registry */}
            <div className="p-6 rounded-3xl bg-neutral-900/70 border border-white/15 backdrop-blur-2xl shadow-2xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                            <Shield className="w-6 h-6 text-amber-400" />
                            دفتر ثبت و بایگانی اسناد فوق‌امن کلیسا
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1">
                            آرشیو دیجیتالی با قابلیت جستجوی متن داخل اسناد (Full-Text Search) و بازیابی از سطل زباله
                        </p>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative min-w-[220px]">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="جستجو در عنوان، متن OCR، شماره سند..."
                                className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2 pr-9 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-cyan-500"
                            />
                            <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-2.5 pointer-events-none" />
                        </div>

                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                            <option value="all">همه دسته‌ها</option>
                            <option value="baptism">گواهی تعمید</option>
                            <option value="marriage">سند ازدواج</option>
                            <option value="letter">نامه اداری</option>
                            <option value="invoice">مالی / فاکتور</option>
                            <option value="identity">شناسایی</option>
                            <option value="archive">بایگانی عمومی</option>
                        </select>

                        <select
                            value={securityFilter}
                            onChange={(e) => setSecurityFilter(e.target.value)}
                            className="bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                            <option value="all">همه سطوح محرمانگی</option>
                            <option value="top_secret">🔴 فوق‌محرمانه</option>
                            <option value="confidential">🟠 محرمانه</option>
                            <option value="restricted">🟡 محدود</option>
                            <option value="normal">🟢 عادی</option>
                        </select>
                    </div>
                </div>

                {/* Documents Table / Grid */}
                {filteredDocuments.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground space-y-3">
                        <FileText className="w-12 h-12 mx-auto text-neutral-600" />
                        <p className="text-sm">سندی با این مشخصات در بایگانی یافت نشد.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredDocuments.map(doc => (
                            <div
                                key={doc.id}
                                className="p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 group"
                            >
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between gap-2">
                                        {getSecurityBadge(doc.security_level)}
                                        {getCategoryBadge(doc.category)}
                                    </div>

                                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                                        {doc.title}
                                    </h3>

                                    {doc.ocr_summary && (
                                        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                                            {doc.ocr_summary}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(doc.created_at).toLocaleDateString('fa-IR')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <HardDrive className="w-3 h-3" />
                                            {(doc.file_size / 1024).toFixed(0)} کیلوبایت
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                                    <button
                                        onClick={() => setViewingDoc(doc)}
                                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                                    >
                                        <Eye className="w-3.5 h-3.5" /> مشاهده متن OCR
                                    </button>

                                    <div className="flex items-center gap-2">
                                        {doc.signed_download_url && (
                                            <a
                                                href={doc.signed_download_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white"
                                                title="دانلود امن با لینک موقت"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                        )}

                                        <button
                                            onClick={() => handleDeleteDocument(doc.id, doc.title)}
                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition-colors"
                                            title="انتقال به سطل زباله"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL: View OCR Text Details */}
            {viewingDoc && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-white/15 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-cyan-400" />
                                    {viewingDoc.title}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    ثبت شده در: {new Date(viewingDoc.created_at).toLocaleDateString('fa-IR')} • ثبت‌کننده: {viewingDoc.uploaded_by}
                                </p>
                            </div>
                            <button
                                onClick={() => setViewingDoc(null)}
                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        {viewingDoc.ocr_summary && (
                            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs text-neutral-300">
                                <strong className="text-cyan-400 block mb-1">خلاصه مشخصات استخراج‌شده:</strong>
                                {viewingDoc.ocr_summary}
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-neutral-300">متن کامل سند استخراج‌شده با OCR:</label>
                                <button
                                    onClick={() => {
                                        if (viewingDoc.ocr_text) {
                                            navigator.clipboard.writeText(viewingDoc.ocr_text);
                                            showToast('info', 'متن در کلیپ‌بورد کپی شد.');
                                        }
                                    }}
                                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                                >
                                    <Copy className="w-3.5 h-3.5" /> کپی متن کامل
                                </button>
                            </div>
                            <div className="bg-black/60 border border-white/10 rounded-xl p-4 max-h-[300px] overflow-y-auto text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap font-[Vazirmatn]">
                                {viewingDoc.ocr_text || 'متنی برای این سند ثبت نشده است.'}
                            </div>
                        </div>

                        <div className="pt-2 flex justify-between items-center border-t border-white/10">
                            <span className="text-xs text-muted-foreground">
                                سطح محرمانگی: {getSecurityBadge(viewingDoc.security_level)}
                            </span>
                            <button
                                onClick={() => setViewingDoc(null)}
                                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
                            >
                                بستن
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
