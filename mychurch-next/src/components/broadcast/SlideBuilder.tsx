"use client";

/**
 * 🎬 Broadcast Slide Builder
 * ساخت و مدیریت اسلایدهای پخش زنده
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Slide, SlideType, BroadcastSession,
  SlideContentScripture, SlideContentLyrics, SlideContentMedia, SlideContentAnnouncement, SlideContentGeneric, SlideContentLiveData, SlideContentMeeting, SlideContentPrayer, ChartDataPoint,
  ScripturePage, AppLanguage, MediaDisplayConfig, BroadcastOverlayConfig
} from '@/types/broadcast';
import { getPrayers, PrayerRequest } from '@/actions/prayers';
import {
  BROADCAST_TRANSLATIONS
} from './dataService';
import {
  BookOpen, Music, FileImage, Video, Plus, GripVertical, Upload,
  PieChart, BarChart, LineChart, Activity,
  Trash2, ChevronDown, ChevronUp, Search, Mic, Megaphone, Calendar, Edit3, PhoneCall, Eye, Heart, QrCode, Youtube
} from 'lucide-react';
import ScriptureSelector from './ScriptureSelector';
import WorshipSongSelector from './WorshipSongSelector';
import SlidePreviewModal from './SlidePreviewModal';
import { MediaPickerModal } from './MediaPickerModal';
import SlideFontControls from './SlideFontControls';
import InteractiveMediaFrame, { extractYoutubeId, isYoutubeUrl } from './InteractiveMediaFrame';
import { useLanguage } from '@/providers/LanguageProvider';

const localDict = {
    en: {
        getServiceNotesSongs: "Get Service Notes & Songs",
        scanTheQrCode: "Scan the QR code with your phone camera to get worship audio, lyrics, scripture verses, and sermon notes on Telegram or WhatsApp.",
        preview: "Preview",
        edit: "Edit",
        moveUp: "Move Up",
        moveSlideUp: "Move Slide Up",
        moveDown: "Move Down",
        moveSlideDown: "Move Slide Down",
        delete: "Delete",
        deleteSlide: "Delete Slide",
        topBottomTexts: "Top & Bottom Texts",
        clear: "Clear",
        topSlideTextHeader: "Top Slide Text (Header):",
        eGWelcomeOr: "e.g., Welcome or Special Announcement...",
        bottomSlideTextFooter: "Bottom Slide Text (Footer):",
        eGTranslationNotes: "e.g., Translation notes, reference...",
        templateName: "Template name...",
        saveSlideAsTemplate: "Save slide as template",
        saveAsTemplate: "Save as Template",
        savedTemplates: (n: number) => `Saved Templates (${n})`,
        addThisTemplate: "Add this template",
        deleteTemplate: "Delete template",
        prayerRequest: "Prayer Request",
        design: "Design",
        videoCall: "Video Call",
        liveChartsStats: "Live Charts / Stats",
        lordSPrayerLuxury: "Lord's Prayer (Luxury)",
        addQrServiceSlide: "Add QR Service Slide",
        addQrServiceSlide2: "Add QR Service Slide",
        uploadingFile: "Uploading file...",
        supportsYoutubeLinksDirect: "Supports YouTube links & direct media files",
        youtubeVideoDetected: "YouTube Video Detected",
        readyToStreamIn: "Ready to stream in console & projector.",
        alreadyHaveAFile: "Already have a file?",
        browseMediaGallery: "Browse Media Gallery",
        interactiveLivePreviewPan: "Interactive Live Preview (Pan, Zoom, Fit)",
        displayFramingSettings: "Display & Framing Settings",
        width: "Width:",
        width2: "Width",
        height: "Height:",
        height2: "Height",
        position: "Position:",
        position2: "Position",
        center: "Center",
        topLeft: "Top Left",
        topRight: "Top Right",
        bottomLeft: "Bottom Left",
        bottomRight: "Bottom Right",
        custom: "Custom",
        fitMode: "Fit Mode:",
        fitMode2: "Fit Mode",
        contain: "Contain",
        cover: "Cover",
        fill: "Fill",
        none: "None",
        borderRadius: "Border Radius:",
        borderRadius2: "Border Radius",
        opacity: "Opacity:",
        opacity2: "Opacity",
        transparentChurchLogoWatermark: "Transparent Church Logo Watermark",
        showLogo: "Show Logo",
        position3: "Position:",
        logoPosition: "Logo Position",
        topRight2: "Top Right",
        size: "Size:",
        small: "Small",
        medium: "Medium",
        large: "Large",
        opacity3: "Opacity:",
        logoOpacity: "Logo Opacity",
        title: "Title",
        announcementTitle: "Announcement title...",
        content: "Content",
        enterAnnouncementContent: "Enter announcement content...",
        imageOptional: "Image (optional)",
        eventDateOptional: "Event Date (optional)",
        linkOptional: "Link (optional)",
        preview2: "Preview:",
        noTitle: "No title",
        noContent: "No content",
        designSlide: "Design Slide",
        titleOptional: "Title (Optional)",
        slideTitle: "Slide title...",
        backgroundType: "Background Type",
        backgroundValue: "Background Value",
        chooseBackgroundFromGallery: "Choose background from gallery",
        slideFont: "Slide Font",
        htmlContent: "HTML Content",
        pEnterYourHtml: "<p>Enter your HTML content here...</p>",
        layout: "Layout",
        liveChart: "Live Chart",
        chartTitle: "Chart Title",
        title2: "Title...",
        chartType: "Chart Type",
        options: "Options",
        showLegend: "Show Legend",
        showValues: "Show Values",
        dataPoints: "Data Points",
        addDataPoint: "Add Data Point",
        liveVideoMeeting: "Live Video Meeting",
        roomId: "Room ID",
        alphanumericAndDashesOnly: "Alphanumeric and dashes only.",
        meetingSubject: "Meeting Subject",
        eGQA: "e.g. Q&A Session",
        thisSlideLaunchesA: "This slide launches a secure video meeting directly in the console.",
        addPrayerRequestSlide: "Add Prayer Request Slide",
        selectFromListOptional: "Select from list (Optional)",
        selectARequest: "Select a request...",
        titleSubject: "Title / Subject",
        content2: "Content",
        nameOptional: "Name (Optional)",
        answered: "Answered",
        update: "Update",
        youtubeFallback: "YouTube",
        loadingSession: "Loading session...",
        sampleNFallback: (n: number) => `Sample ${n}`,
        saveAction: "Save",
        cancelAction: "Cancel",
        youtubeUrlPlaceholder: "https://www.youtube.com/watch?v=... or direct link",
        wavyPaperPlaceholder: "Wavy paper text...",
        liveDataFallback: "Live Data",
        meetingFallback: "Meeting",
        lordsPrayerFallback: "Lord's Prayer",
    },
    fa: {
        getServiceNotesSongs: "دریافت فایل‌ها، سرودها و برنامه جلسه",
        scanTheQrCode: "برای دسترسی به متن و آکورد سرودها، صوت، آیات موعظه امروز و دریافت در تلگرام و واتساپ، دوربین گوشی خود را مقابل بارکد قرار دهید.",
        preview: "پیش‌نمایش",
        edit: "ویرایش",
        moveUp: "بالا",
        moveSlideUp: "انتقال به بالا",
        moveDown: "پایین",
        moveSlideDown: "انتقال به پایین",
        delete: "حذف",
        deleteSlide: "حذف اسلاید",
        topBottomTexts: "متن‌های بالا و پایین اسلاید",
        clear: "پاک کردن",
        topSlideTextHeader: "متن بالای اسلاید (تیتر/عنوان):",
        eGWelcomeOr: "مثال: جلسه دعای یکشنبه یا پیام شبان...",
        bottomSlideTextFooter: "متن پایین اسلاید (پانویس/توضیح):",
        eGTranslationNotes: "مثال: ترجمه تفسیری / آدرس وب‌سایت کلیسا...",
        templateName: "نام نمونه...",
        saveSlideAsTemplate: "ذخیره این اسلاید به عنوان نمونه",
        saveAsTemplate: "ذخیره به‌عنوان نمونه",
        savedTemplates: (n: number) => `نمونه‌های ذخیره‌شده (${n})`,
        addThisTemplate: "اضافه کردن این نمونه",
        deleteTemplate: "حذف نمونه",
        prayerRequest: "درخواست دعا",
        design: "اسلاید آزاد",
        videoCall: "ارتباط ویدیویی",
        liveChartsStats: "نمودار زنده / آمار",
        lordSPrayerLuxury: "افزودن دعای ربانی (لوکس)",
        addQrServiceSlide: "افزودن اسلاید بارکد QR دریافت فایل‌ها و برنامه جلسه",
        addQrServiceSlide2: "📲 اسلاید بارکد QR دریافت فایل‌ها و برنامه",
        uploadingFile: "در حال آپلود فایل...",
        supportsYoutubeLinksDirect: "پشتیبانی کامل از لینک‌های یوتیوب (YouTube) و فایل‌های مدیا",
        youtubeVideoDetected: "ویدیوی یوتیوب شناسایی شد",
        readyToStreamIn: "ویدیو آماده پخش در مانیتور کنسول و پروژکتور سالن است.",
        alreadyHaveAFile: "آیا فایلی قبلاً آپلود کرده‌اید؟",
        browseMediaGallery: "جستجو در گالری مدیا",
        interactiveLivePreviewPan: "پیش‌نمایش زنده تعاملی (درگ، زوم، فیت)",
        displayFramingSettings: "تنظیمات اندازه و کادر نمایش",
        width: "عرض کادر:",
        width2: "عرض",
        height: "ارتفاع کادر:",
        height2: "ارتفاع",
        position: "موقعیت در اسلاید:",
        position2: "موقعیت",
        center: "مرکز",
        topLeft: "بالا چپ",
        topRight: "بالا راست",
        bottomLeft: "پایین چپ",
        bottomRight: "پایین راست",
        custom: "سفارشی",
        fitMode: "حالت فیت (Fit):",
        fitMode2: "برش تصویر",
        contain: "کامل (Contain)",
        cover: "پر کردن (Cover)",
        fill: "کشیدن (Fill)",
        none: "بدون تغییر",
        borderRadius: "گوشه گرد:",
        borderRadius2: "گوشه گرد",
        opacity: "شفافیت:",
        opacity2: "شفافیت",
        transparentChurchLogoWatermark: "لوگوی ترنسپرنت کلیسا روی تصویر / مدیا",
        showLogo: "نمایش لوگو",
        position3: "موقعیت لوگو:",
        logoPosition: "موقعیت لوگو",
        topRight2: "بالا راست (پیش‌فرض)",
        size: "اندازه لوگو:",
        small: "کوچک",
        medium: "متوسط",
        large: "بزرگ",
        opacity3: "میزان شفافیت (Opacity):",
        logoOpacity: "شفافیت لوگو",
        title: "عنوان اعلان",
        announcementTitle: "عنوان اعلان...",
        content: "متن اعلان",
        enterAnnouncementContent: "متن اعلان را وارد کنید...",
        imageOptional: "تصویر (اختیاری)",
        eventDateOptional: "تاریخ رویداد (اختیاری)",
        linkOptional: "لینک (اختیاری)",
        preview2: "پیش‌نمایش:",
        noTitle: "بدون عنوان",
        noContent: "بدون محتوا",
        designSlide: "اسلاید آزاد",
        titleOptional: "عنوان (اختیاری)",
        slideTitle: "عنوان اسلاید...",
        backgroundType: "نوع پس‌زمینه",
        backgroundValue: "مقدار پس‌زمینه",
        chooseBackgroundFromGallery: "انتخاب پس‌زمینه از گالری",
        slideFont: "فونت اسلاید",
        htmlContent: "محتوای HTML",
        pEnterYourHtml: "<p>متن خود را اینجا بنویسید...</p>",
        layout: "چیدمان",
        liveChart: "نمودار زنده",
        chartTitle: "عنوان نمودار",
        title2: "عنوان...",
        chartType: "نوع نمودار",
        options: "تنظیمات",
        showLegend: "نمایش راهنما (Legend)",
        showValues: "نمایش مقادیر",
        dataPoints: "داده‌ها",
        addDataPoint: "افزودن داده جدید",
        liveVideoMeeting: "ارتباط ویدیویی زنده (یکپارچه)",
        roomId: "شناسه / نام اتاق جلسه",
        alphanumericAndDashesOnly: "فقط حروف انگلیسی، اعداد و خط تیره",
        meetingSubject: "موضوع / عنوان نمایش داده شده",
        eGQA: "مثال: پرسش و پاسخ",
        thisSlideLaunchesA: "این اسلاید پلتفرم تماس ویدیویی فوق امن (بر پایه ابری) را مستقیماً داخل کنسول باز می‌کند. مهمانان می‌توانند بدون نیاز به نصب هیچ برنامه‌ای با لینک مخصوص به استودیو متصل شوند و تصاویرشان در پخش زنده نمایش داده خواهد شد.",
        addPrayerRequestSlide: "افزودن اسلاید درخواست دعا",
        selectFromListOptional: "انتخاب از لیست (اختیاری)",
        selectARequest: "انتخاب درخواست...",
        titleSubject: "عنوان / موضوع",
        content2: "شرح درخواست",
        nameOptional: "نام شخص (اختیاری)",
        answered: "مستجاب شده",
        update: "به‌روزرسانی",
        youtubeFallback: "یوتیوب",
        loadingSession: "در حال بارگذاری جلسه...",
        sampleNFallback: (n: number) => `نمونه ${n}`,
        saveAction: "ذخیره",
        cancelAction: "لغو",
        youtubeUrlPlaceholder: "https://www.youtube.com/watch?v=... یا لینک مستقیم",
        wavyPaperPlaceholder: "متن الگوی کاغذی...",
        liveDataFallback: "داده زنده",
        meetingFallback: "جلسه",
        lordsPrayerFallback: "دعای ربانی",
    },
    es: {
        getServiceNotesSongs: "Obtener notas del servicio y canciones",
        scanTheQrCode: "Escanee el código QR con la cámara de su teléfono para obtener audio de alabanza, letras, versículos bíblicos y notas del sermón en Telegram o WhatsApp.",
        preview: "Vista previa",
        edit: "Editar",
        moveUp: "Subir",
        moveSlideUp: "Subir diapositiva",
        moveDown: "Bajar",
        moveSlideDown: "Bajar diapositiva",
        delete: "Eliminar",
        deleteSlide: "Eliminar diapositiva",
        topBottomTexts: "Textos superior e inferior",
        clear: "Borrar",
        topSlideTextHeader: "Texto superior de la diapositiva (encabezado):",
        eGWelcomeOr: "ej., Bienvenida o anuncio especial...",
        bottomSlideTextFooter: "Texto inferior de la diapositiva (pie):",
        eGTranslationNotes: "ej., notas de traducción, referencia...",
        templateName: "Nombre de la plantilla...",
        saveSlideAsTemplate: "Guardar diapositiva como plantilla",
        saveAsTemplate: "Guardar como plantilla",
        savedTemplates: (n: number) => `Plantillas guardadas (${n})`,
        addThisTemplate: "Añadir esta plantilla",
        deleteTemplate: "Eliminar plantilla",
        prayerRequest: "Petición de oración",
        design: "Diseño",
        videoCall: "Videollamada",
        liveChartsStats: "Gráficos / estadísticas en vivo",
        lordSPrayerLuxury: "El Padre Nuestro (Lujo)",
        addQrServiceSlide: "Añadir diapositiva QR de servicio",
        addQrServiceSlide2: "Añadir diapositiva QR de servicio",
        uploadingFile: "Subiendo archivo...",
        supportsYoutubeLinksDirect: "Admite enlaces de YouTube y archivos multimedia directos",
        youtubeVideoDetected: "Video de YouTube detectado",
        readyToStreamIn: "Listo para transmitir en la consola y el proyector.",
        alreadyHaveAFile: "¿Ya tiene un archivo?",
        browseMediaGallery: "Explorar galería de medios",
        interactiveLivePreviewPan: "Vista previa interactiva en vivo (Desplazar, Zoom, Ajustar)",
        displayFramingSettings: "Configuración de visualización y encuadre",
        width: "Ancho:",
        width2: "Ancho",
        height: "Alto:",
        height2: "Alto",
        position: "Posición:",
        position2: "Posición",
        center: "Centro",
        topLeft: "Arriba izquierda",
        topRight: "Arriba derecha",
        bottomLeft: "Abajo izquierda",
        bottomRight: "Abajo derecha",
        custom: "Personalizado",
        fitMode: "Modo de ajuste:",
        fitMode2: "Modo de ajuste",
        contain: "Contener",
        cover: "Cubrir",
        fill: "Rellenar",
        none: "Ninguno",
        borderRadius: "Radio del borde:",
        borderRadius2: "Radio del borde",
        opacity: "Opacidad:",
        opacity2: "Opacidad",
        transparentChurchLogoWatermark: "Marca de agua transparente del logo de la iglesia",
        showLogo: "Mostrar logo",
        position3: "Posición:",
        logoPosition: "Posición del logo",
        topRight2: "Arriba derecha",
        size: "Tamaño:",
        small: "Pequeño",
        medium: "Mediano",
        large: "Grande",
        opacity3: "Opacidad:",
        logoOpacity: "Opacidad del logo",
        title: "Título",
        announcementTitle: "Título del anuncio...",
        content: "Contenido",
        enterAnnouncementContent: "Ingrese el contenido del anuncio...",
        imageOptional: "Imagen (opcional)",
        eventDateOptional: "Fecha del evento (opcional)",
        linkOptional: "Enlace (opcional)",
        preview2: "Vista previa:",
        noTitle: "Sin título",
        noContent: "Sin contenido",
        designSlide: "Diapositiva de diseño",
        titleOptional: "Título (opcional)",
        slideTitle: "Título de la diapositiva...",
        backgroundType: "Tipo de fondo",
        backgroundValue: "Valor de fondo",
        chooseBackgroundFromGallery: "Elegir fondo de la galería",
        slideFont: "Fuente de la diapositiva",
        htmlContent: "Contenido HTML",
        pEnterYourHtml: "<p>Ingrese aquí su contenido HTML...</p>",
        layout: "Disposición",
        liveChart: "Gráfico en vivo",
        chartTitle: "Título del gráfico",
        title2: "Título...",
        chartType: "Tipo de gráfico",
        options: "Opciones",
        showLegend: "Mostrar leyenda",
        showValues: "Mostrar valores",
        dataPoints: "Puntos de datos",
        addDataPoint: "Añadir punto de datos",
        liveVideoMeeting: "Videollamada en vivo",
        roomId: "ID de la sala",
        alphanumericAndDashesOnly: "Solo caracteres alfanuméricos y guiones.",
        meetingSubject: "Asunto de la reunión",
        eGQA: "ej. Sesión de preguntas y respuestas",
        thisSlideLaunchesA: "Esta diapositiva abre una plataforma de videollamada ultra segura (basada en la nube) directamente dentro de la consola. Los invitados pueden conectarse al estudio con un enlace especial sin necesidad de instalar ninguna aplicación, y su imagen se mostrará en la transmisión en vivo.",
        addPrayerRequestSlide: "Añadir diapositiva de petición de oración",
        selectFromListOptional: "Seleccionar de la lista (opcional)",
        selectARequest: "Seleccionar una petición...",
        titleSubject: "Título / Asunto",
        content2: "Contenido",
        nameOptional: "Nombre (opcional)",
        answered: "Respondida",
        update: "Actualizar",
        youtubeFallback: "YouTube",
        loadingSession: "Cargando sesión...",
        sampleNFallback: (n: number) => `Muestra ${n}`,
        saveAction: "Guardar",
        cancelAction: "Cancelar",
        youtubeUrlPlaceholder: "https://www.youtube.com/watch?v=... o enlace directo",
        wavyPaperPlaceholder: "Texto de papel ondulado...",
        liveDataFallback: "Datos en vivo",
        meetingFallback: "Reunión",
        lordsPrayerFallback: "El Padre Nuestro",
    },
};

interface SlideBuilderProps {
  session: BroadcastSession;
  setSession: React.Dispatch<React.SetStateAction<BroadcastSession>>;
  lang: AppLanguage;
  activeSlideIndex: number;
  onSlideSelect: (index: number) => void;
}

type ModalType = 'NONE' | 'SCRIPTURE' | 'LYRICS' | 'MEDIA' | 'ANNOUNCEMENT' | 'GENERIC' | 'LIVEDATA' | 'MEETING' | 'PRAYER' | 'LORDS_PRAYER';

type LibraryAsset = {
  name: string;
  path: string;
  url: string;
  source: 'uploads' | 'media' | 'images';
  type: 'image' | 'video' | 'audio' | 'other';
  size: number;
  modifiedAt: number;
};

export const SlideBuilder: React.FC<SlideBuilderProps> = ({
  session,
  setSession,
  lang,
  activeSlideIndex,
  onSlideSelect
}) => {
  const t = BROADCAST_TRANSLATIONS[lang];
  const isRTL = lang === 'fa';
  const { language } = useLanguage();
  const d = localDict[language] || localDict.fa;

  const [activeModal, setActiveModal] = useState<ModalType>('NONE');
  
  // Asset Library State
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [libraryError, setLibraryError] = useState('');
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([]);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  
  // Preview Modal State
  const [previewSlideIndex, setPreviewSlideIndex] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Live Data State
  const [liveDataTitle, setLiveDataTitle] = useState('');
  const [liveDataChartType, setLiveDataChartType] = useState<'bar' | 'line' | 'pie' | 'doughnut'>('bar');
  const [liveDataPoints, setLiveDataPoints] = useState<ChartDataPoint[]>([{ label: 'Item 1', value: 10, color: '#3b82f6' }]);
  const [liveDataShowLegend, setLiveDataShowLegend] = useState(true);
  const [liveDataShowValues, setLiveDataShowValues] = useState(true);
  const [liveDataBackgroundType, setLiveDataBackgroundType] = useState<'color' | 'image' | 'video' | 'gradient' | 'wavyPaper'>('color');
  const [liveDataBackgroundValue, setLiveDataBackgroundValue] = useState('#000000');

  // Prayer Form State
  const [availablePrayers, setAvailablePrayers] = useState<PrayerRequest[]>([]);
  const [selectedPrayerId, setSelectedPrayerId] = useState('');
  const [prayerTitle, setPrayerTitle] = useState('');
  const [prayerContent, setPrayerContent] = useState('');
  const [prayerUserName, setPrayerUserName] = useState('');
  const [prayerIsAnswered, setPrayerIsAnswered] = useState(false);
  const [prayerAnswerText, setPrayerAnswerText] = useState('');


  // Media Form State
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio'>('image');
  const [mediaLoop, setMediaLoop] = useState(false);
  const [mediaAutoplay, setMediaAutoplay] = useState(true);
  const [mediaShowLogo, setMediaShowLogo] = useState(false);
  const [mediaLogoPosition, setMediaLogoPosition] = useState<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center'>('top-right');
  const [mediaLogoOpacity, setMediaLogoOpacity] = useState(90);
  const [mediaLogoSize, setMediaLogoSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [mediaDisplayConfig, setMediaDisplayConfig] = useState<MediaDisplayConfig>({
    width: 100,
    height: 100,
    position: 'center',
    customX: 50,
    customY: 50,
    objectFit: 'contain',
    borderRadius: 0,
    opacity: 100
  });

  // Announcement Form State
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementImageUrl, setAnnouncementImageUrl] = useState('');
  const [announcementLink, setAnnouncementLink] = useState('');
  const [announcementEventDate, setAnnouncementEventDate] = useState('');

  // Generic Slide State
  const [genericTitle, setGenericTitle] = useState('');
  const [genericHtmlContent, setGenericHtmlContent] = useState('');
  const [genericBackgroundType, setGenericBackgroundType] = useState<'color' | 'image' | 'video' | 'gradient' | 'wavyPaper'>('color');
  const [genericBackgroundValue, setGenericBackgroundValue] = useState('#000000');
  const [genericLayout, setGenericLayout] = useState<'title-only' | 'text-only' | 'split-left' | 'split-right' | 'centered'>('centered');
  const [genericFontFamily, setGenericFontFamily] = useState<string>('var(--font-vazirmatn)');

  // Meeting Form State
  const [meetingRoomName, setMeetingRoomName] = useState(`Mychurch-${Math.floor(Math.random() * 10000)}`);
  const [meetingSubject, setMeetingSubject] = useState('');

  // Drag State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Edit State
  const [editingSlideIndex, setEditingSlideIndex] = useState<number | null>(null);

  // Slide Templates (persisted to localStorage)
  type SlideTemplate = { id: string; name: string; slide: Slide };
  const [templates, setTemplates] = useState<SlideTemplate[]>(() => {
    try { return JSON.parse(localStorage.getItem('slideTemplates') || '[]'); } catch { return []; }
  });
  const [showTemplates, setShowTemplates] = useState(false);
  const [savingTemplateName, setSavingTemplateName] = useState('');
  const [showSaveTemplateInput, setShowSaveTemplateInput] = useState(false);

  // Media Picker Popup State
  const [mediaPickerContext, setMediaPickerContext] = useState<'MEDIA' | 'GENERIC' | 'LIVEDATA' | null>(null);
  const [mediaPickerAllowedTypes, setMediaPickerAllowedTypes] = useState<('image' | 'video' | 'audio' | 'all')[]>(['all']);

  const handleMediaSelected = (url: string, type: 'image' | 'video' | 'audio' | 'other') => {
    if (mediaPickerContext === 'MEDIA') {
        setMediaUrl(url);
        if (type === 'image' || type === 'video' || type === 'audio') setMediaType(type);
    } else if (mediaPickerContext === 'GENERIC') {
        setGenericBackgroundValue(url);
    } else if (mediaPickerContext === 'LIVEDATA') {
        setLiveDataBackgroundValue(url);
    }
  };

  const handleAddLordsPrayer = () => {
    const newSlide: Slide = {
      id: crypto.randomUUID(),
      type: SlideType.LORDS_PRAYER,
      order: session.slides.length,
      content: {
        backgroundType: 'particles'
      }
    };
    const newSlides = [...session.slides, newSlide];
    setSession({ ...session, slides: newSlides });
  };

  const loadLibraryAssets = useCallback(async (type: 'all' | 'image' | 'video' | 'audio' = 'all') => {
    try {
      setIsLoadingLibrary(true);
      setLibraryError('');
      const response = await fetch(`/api/broadcast/assets?type=${type}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to load assets');
      }
      setLibraryAssets(Array.isArray(data.assets) ? data.assets : []);
    } catch (error: any) {
      setLibraryError(error?.message || 'Failed to load assets');
      setLibraryAssets([]);
    } finally {
      setIsLoadingLibrary(false);
    }
  }, []);

  useEffect(() => {
    if (activeModal === 'MEDIA') {
      loadLibraryAssets(mediaType);
      return;
    }
    if (activeModal === 'GENERIC') {
      if (genericBackgroundType === 'image' || genericBackgroundType === 'video') {
        loadLibraryAssets(genericBackgroundType);
      }
      return;
    }
    if (activeModal === 'LIVEDATA') {
      if (liveDataBackgroundType === 'image' || liveDataBackgroundType === 'video') {
        loadLibraryAssets(liveDataBackgroundType);
      }
    }
    if (activeModal === 'PRAYER') {
      getPrayers('all').then(setAvailablePrayers);
    }
  }, [activeModal, mediaType, genericBackgroundType, liveDataBackgroundType, loadLibraryAssets]);

  // Reset forms
  const resetForms = () => {
    setMediaUrl('');
    setMediaType('image');
    setMediaLoop(false);
    setMediaAutoplay(true);
    setMediaShowLogo(false);
    setMediaLogoPosition('top-right');
    setMediaLogoOpacity(90);
    setMediaLogoSize('md');
    setAnnouncementTitle('');
    setAnnouncementContent('');
    setAnnouncementImageUrl('');
    setAnnouncementLink('');
    setAnnouncementEventDate('');
    setGenericTitle('');
    setGenericHtmlContent('');
    setGenericBackgroundType('color');
    setGenericBackgroundValue('#000000');
    setGenericLayout('centered');
    setGenericFontFamily('var(--font-vazirmatn)');
    setLiveDataTitle('');
    setLiveDataChartType('bar');
    setLiveDataPoints([{ label: 'Item 1', value: 10, color: '#3b82f6' }]);
    setLiveDataShowLegend(true);
    setLiveDataShowValues(true);
    setLiveDataBackgroundType('color');
    setLiveDataBackgroundValue('#000000');
    setMeetingRoomName(`Mychurch-${Math.floor(Math.random() * 10000)}`);
    setMeetingSubject('');
    setEditingSlideIndex(null);
    setLibraryError('');
    setAssetSearchQuery('');
    setSelectedPrayerId('');
    setPrayerTitle('');
    setPrayerContent('');
    setPrayerUserName('');
    setPrayerIsAnswered(false);
    setPrayerAnswerText('');
  };

  // Add slide to session
  const addSlide = useCallback((type: SlideType, content: any) => {
    const newSlide: Slide = {
      id: crypto.randomUUID(),
      order: session.slides.length,
      type,
      content,
      notes: '',
      zoom: type === SlideType.SCRIPTURE ? 1.15 : 1
    };
    setSession(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide]
    }));
    setActiveModal('NONE');
    resetForms();

    // Select the new slide
    onSlideSelect(session.slides.length);
  }, [session.slides.length, setSession, onSlideSelect]);

  // Add QR Share Slide for Congregation
  const handleAddQrShareSlide = useCallback(() => {
    const serviceUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/service/${session.id}?ref=qr`
      : `https://www.iranianchurchdc.com/service/${session.id}?ref=qr`;

    const content: SlideContentAnnouncement = {
      title: d.getServiceNotesSongs,
      content: d.scanTheQrCode,
      qrCodeUrl: serviceUrl,
      link: serviceUrl,
    };

    addSlide(SlideType.ANNOUNCEMENT, content);
  }, [addSlide, d, session.id]);

  // Delete slide
  const deleteSlide = useCallback((index: number) => {
    setSession(prev => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i }))
    }));
    if (activeSlideIndex >= index && activeSlideIndex > 0) {
      onSlideSelect(activeSlideIndex - 1);
    }
  }, [setSession, activeSlideIndex, onSlideSelect]);

  // Move slide
  const moveSlide = useCallback((index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === session.slides.length - 1)) return;

    const newSlides = [...session.slides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
    newSlides.forEach((s, i) => s.order = i);

    setSession(prev => ({ ...prev, slides: newSlides }));

    // Keep the active/live slide pointing at the same slide after the reorder —
    // only follow the swap if the active slide was one of the two that moved,
    // otherwise reordering unrelated slides would silently switch what's on-air.
    if (activeSlideIndex === index) {
      onSlideSelect(targetIndex);
    } else if (activeSlideIndex === targetIndex) {
      onSlideSelect(index);
    }
  }, [session.slides, setSession, onSlideSelect, activeSlideIndex]);

  // Edit slide - open modal with existing data
  const startEditSlide = useCallback((index: number) => {
    const slide = session.slides[index];
    setEditingSlideIndex(index);

    if (slide.type === SlideType.SCRIPTURE) {
      setActiveModal('SCRIPTURE');
    } else if (slide.type === SlideType.LYRICS) {
      setActiveModal('LYRICS');
    } else if (slide.type === SlideType.ANNOUNCEMENT) {
      const content = slide.content as SlideContentAnnouncement;
      setAnnouncementTitle(content.title);
      setAnnouncementContent(content.content || '');
      setAnnouncementImageUrl(content.imageUrl || '');
      setAnnouncementLink(content.link || '');
      setAnnouncementEventDate(content.eventDate || '');
      setActiveModal('ANNOUNCEMENT');
    } else if (slide.type === SlideType.MEDIA) {
      const content = slide.content as SlideContentMedia;
      setMediaUrl(content.url);
      setMediaType(content.mediaType);
      setMediaLoop(content.isLoop || false);
      setMediaAutoplay(content.isAutoPlay || false);
      setMediaShowLogo(content.showLogo ?? false);
      setMediaLogoPosition(content.logoPosition || 'top-right');
      setMediaLogoOpacity(content.logoOpacity ?? 90);
      setMediaLogoSize(content.logoSize || 'md');
      // Load display config if exists
      if (content.displayConfig) {
        setMediaDisplayConfig(content.displayConfig);
      } else {
        setMediaDisplayConfig({
          width: 100,
          height: 100,
          position: 'center',
          objectFit: 'contain',
          borderRadius: 0,
          opacity: 100
        });
      }
      setActiveModal('MEDIA');
    } else if (slide.type === SlideType.GENERIC) {
      const content = slide.content as SlideContentGeneric;
      setGenericTitle(content.title || '');
      setGenericHtmlContent(content.htmlContent);
      if (content.background) {
        setGenericBackgroundType(content.background.type);
        setGenericBackgroundValue(content.background.value);
      }
      setGenericLayout(content.layout || 'centered');
      setGenericFontFamily(content.fontFamily || 'var(--font-vazirmatn)');
      setActiveModal('GENERIC');
    } else if (slide.type === SlideType.LIVEDATA) {
      const content = slide.content as SlideContentLiveData;
      setLiveDataTitle(content.title || '');
      setLiveDataChartType(content.chartType);
      setLiveDataPoints(content.data);
      setLiveDataShowLegend(content.showLegend);
      setLiveDataShowValues(content.showValues);
      if (content.background) {
        setLiveDataBackgroundType(content.background.type);
        setLiveDataBackgroundValue(content.background.value);
      }
      setActiveModal('LIVEDATA');
    } else if (slide.type === SlideType.MEETING) {
      const content = slide.content as SlideContentMeeting;
      setMeetingRoomName(content.roomName || '');
      setMeetingSubject(content.subject || '');
      setActiveModal('MEETING');
    } else if (slide.type === SlideType.PRAYER) {
      const content = slide.content as SlideContentPrayer;
      setSelectedPrayerId(content.prayerId || '');
      setPrayerTitle(content.title || '');
      setPrayerContent(content.content || '');
      setPrayerUserName(content.userName || '');
      setPrayerIsAnswered(content.isAnswered || false);
      setPrayerAnswerText(content.answerText || '');
      setActiveModal('PRAYER');
    }
  }, [session.slides]);

  // Update existing slide
  const updateSlide = useCallback((index: number, newContent: any) => {
    setSession(prev => ({
      ...prev,
      slides: prev.slides.map((s, i) => i === index ? { ...s, content: newContent } : s)
    }));
    setEditingSlideIndex(null);
    setActiveModal('NONE');
    resetForms();
  }, [setSession]);

  const updateSlideZoom = useCallback((index: number, zoom: number) => {
    setSession(prev => ({
      ...prev,
      slides: prev.slides.map((slide, i) => (i === index ? { ...slide, zoom } : slide))
    }));
  }, [setSession]);

  const clampZoom = (value: number) => Math.min(2, Math.max(0.5, Number(value.toFixed(2))));

  // Save active slide as a template
  const saveTemplate = useCallback((name: string) => {
    const slide = session.slides[activeSlideIndex];
    if (!slide) return;
    const newTemplate: SlideTemplate = {
      id: crypto.randomUUID(),
      name: name.trim() || d.sampleNFallback(templates.length + 1),
      slide: { ...slide, id: crypto.randomUUID() }
    };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    localStorage.setItem('slideTemplates', JSON.stringify(updated));
    setShowSaveTemplateInput(false);
    setSavingTemplateName('');
  }, [session.slides, activeSlideIndex, templates, d]);

  // Load a template (adds a copy as a new slide)
  const loadTemplate = useCallback((template: SlideTemplate) => {
    const newSlide: Slide = { ...template.slide, id: crypto.randomUUID(), order: session.slides.length };
    setSession(prev => ({ ...prev, slides: [...prev.slides, newSlide] }));
    onSlideSelect(session.slides.length);
  }, [session.slides.length, setSession, onSlideSelect]);

  // Delete a template
  const deleteTemplate = useCallback((id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('slideTemplates', JSON.stringify(updated));
  }, [templates]);

  // Handle Media Submit
  const handleMediaSubmit = () => {
    if (!mediaUrl) return;

    const content: SlideContentMedia = {
      url: mediaUrl,
      mediaType,
      isLoop: mediaLoop,
      isAutoPlay: mediaAutoplay,
      displayConfig: mediaDisplayConfig,
      showLogo: mediaShowLogo,
      logoPosition: mediaLogoPosition,
      logoOpacity: mediaLogoOpacity,
      logoSize: mediaLogoSize
    };

    // If editing, update existing slide
    if (editingSlideIndex !== null) {
      updateSlide(editingSlideIndex, content);
    } else {
      addSlide(SlideType.MEDIA, content);
    }
  };

  // Handle Announcement Submit
  const handleAnnouncementSubmit = () => {
    if (!announcementTitle) return;

    const content: SlideContentAnnouncement = {
      title: announcementTitle,
      content: announcementContent,
      imageUrl: announcementImageUrl || undefined,
      link: announcementLink || undefined,
      eventDate: announcementEventDate || undefined
    };

    // If editing, update existing slide
    if (editingSlideIndex !== null) {
      updateSlide(editingSlideIndex, content);
    } else {
      addSlide(SlideType.ANNOUNCEMENT, content);
    }
  };

  // Handle Generic Submit
  const handleGenericSubmit = () => {
    // Retrieve content or default to title if empty
    let finalHtmlContent = genericHtmlContent;
    if (!finalHtmlContent && genericTitle) {
      finalHtmlContent = `<h1 class="text-6xl font-bold text-center">${genericTitle}</h1>`;
    }

    if (!finalHtmlContent) return;

    const content: SlideContentGeneric = {
      title: genericTitle || undefined,
      htmlContent: finalHtmlContent,
      fontFamily: genericFontFamily,
      background: {
        type: genericBackgroundType,
        value: genericBackgroundValue,
        opacity: 100
      },
      layout: genericLayout
    };

    if (editingSlideIndex !== null) {
      updateSlide(editingSlideIndex, content);
    } else {
      // Add slide logic
      const newSlide: Slide = {
        id: crypto.randomUUID(),
        type: SlideType.GENERIC,
        content: content,
        order: session.slides.length // Add order
      };

      setSession(prev => ({
        ...prev,
        slides: [...prev.slides, newSlide]
      }));
    }

    // Close and reset
    setActiveModal('NONE');
    resetForms();
  };

  // Handle Live Data Submit
  const handleLiveDataSubmit = () => {
    if (!liveDataTitle || liveDataPoints.length === 0) return;

    const content: SlideContentLiveData = {
      title: liveDataTitle,
      chartType: liveDataChartType,
      data: liveDataPoints,
      showLegend: liveDataShowLegend,
      showValues: liveDataShowValues,
      background: {
        type: liveDataBackgroundType,
        value: liveDataBackgroundValue,
        opacity: 100
      }
    };

    if (editingSlideIndex !== null) {
      updateSlide(editingSlideIndex, content);
    } else {
      addSlide(SlideType.LIVEDATA, content);
    }
  };

  // Handle Meeting Submit
  const handleMeetingSubmit = () => {
    if (!meetingRoomName) return;

    const content: SlideContentMeeting = {
      roomName: meetingRoomName,
      subject: meetingSubject
    };

    if (editingSlideIndex !== null) {
      updateSlide(editingSlideIndex, content);
    } else {
      addSlide(SlideType.MEETING, content);
    }
  };

  // Handle Prayer Submit
  const handlePrayerSubmit = () => {
    if (!prayerTitle || !prayerContent) return;

    const content: SlideContentPrayer = {
      prayerId: selectedPrayerId || undefined,
      title: prayerTitle,
      content: prayerContent,
      userName: prayerUserName || undefined,
      isAnswered: prayerIsAnswered,
      answerText: prayerAnswerText || undefined
    };

    if (editingSlideIndex !== null) {
      updateSlide(editingSlideIndex, content);
    } else {
      addSlide(SlideType.PRAYER, content);
    }
  };

  const uploadAssetFile = useCallback(async (
    file: File,
    options?: { target?: 'uploads' | 'media'; folder?: string }
  ): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target', options?.target || 'uploads');
    if (options?.folder) {
      formData.append('folder', options.folder);
    }

    setUploadingAsset(true);
    setLibraryError('');
    try {
      const response = await fetch('/api/broadcast/assets/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data?.success || !data?.url) {
        throw new Error(data?.error || 'Upload failed');
      }
      return data.url as string;
    } catch (error: any) {
      setLibraryError(error?.message || 'Upload failed');
      return null;
    } finally {
      setUploadingAsset(false);
    }
  }, []);

  // Handle Announcement Image Upload
  const handleAnnouncementImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadedUrl = await uploadAssetFile(file, { target: 'uploads', folder: 'broadcast/announcements' });
    if (uploadedUrl) {
      setAnnouncementImageUrl(uploadedUrl);
      loadLibraryAssets('image');
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadedUrl = await uploadAssetFile(file, {
      target: file.type.startsWith('audio/') ? 'media' : 'uploads',
      folder: file.type.startsWith('audio/') ? undefined : 'broadcast/slides',
    });

    if (uploadedUrl) {
      setMediaUrl(uploadedUrl);
    }

    // Auto-detect type
    if (file.type.startsWith('image/')) setMediaType('image');
    else if (file.type.startsWith('video/')) setMediaType('video');
    else if (file.type.startsWith('audio/')) setMediaType('audio');

    loadLibraryAssets(file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'audio');
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newSlides = [...session.slides];
    const [draggedItem] = newSlides.splice(draggedIndex, 1);
    newSlides.splice(dropIndex, 0, draggedItem);
    newSlides.forEach((s, i) => s.order = i);

    setSession(prev => ({ ...prev, slides: newSlides }));
    setDraggedIndex(null);
  };

  const applyScripturePages = useCallback((pages: ScripturePage[]) => {
    if (!pages.length) return;

    if (editingSlideIndex !== null) {
      setSession((prev) => {
        const updatedSlides = [...prev.slides];
        const currentSlide = updatedSlides[editingSlideIndex];
        const currentContent = (currentSlide?.content || {}) as SlideContentScripture;
        const currentPages = currentContent.pages || [];
        const currentPage = currentPages[0];

        // If the current slide is a reference list, merge new references into it
        if (currentPage?.displayMode === 'referenceList' && currentPage?.referenceItems) {
          const newRefItems = pages.flatMap((p) => p.referenceItems || []);
          const existingRefs = [...currentPage.referenceItems];
          for (const item of newRefItems) {
            if (!existingRefs.some((r) => r.book === item.book && r.chapter === item.chapter && r.verses === item.verses)) {
              existingRefs.push(item);
            }
          }
          const mergedPage: ScripturePage = {
            ...currentPage,
            referenceItems: existingRefs,
            popupLabelFa: `${existingRefs.length} آیه انتخابی`,
            popupLabelEn: `${existingRefs.length} Selected Verses`,
          };
          updatedSlides[editingSlideIndex] = {
            ...currentSlide,
            content: { pages: [mergedPage] },
          };
          return {
            ...prev,
            slides: updatedSlides,
          };
        }

        const replacement: Slide = {
          ...updatedSlides[editingSlideIndex],
          type: SlideType.SCRIPTURE,
          content: { pages: [pages[0]] }
        };

        const extraSlides: Slide[] = pages.slice(1).map((page, idx) => ({
          id: crypto.randomUUID(),
          order: editingSlideIndex + idx + 1,
          type: SlideType.SCRIPTURE,
          content: { pages: [page] },
          notes: '',
          zoom: 1.15,
        }));

        updatedSlides.splice(editingSlideIndex, 1, replacement, ...extraSlides);
        return {
          ...prev,
          slides: updatedSlides.map((slide, idx) => ({ ...slide, order: idx })),
        };
      });

      onSlideSelect(editingSlideIndex);
      setEditingSlideIndex(null);
      setActiveModal('NONE');
      resetForms();
      return;
    }

    setSession((prev) => {
      const baseOrder = prev.slides.length;
      const newSlides: Slide[] = pages.map((page, idx) => ({
        id: crypto.randomUUID(),
        order: baseOrder + idx,
        type: SlideType.SCRIPTURE,
        content: { pages: [page] },
        notes: '',
        zoom: 1.15,
      }));

      return {
        ...prev,
        slides: [...prev.slides, ...newSlides],
      };
    });

    onSlideSelect(session.slides.length);
    setActiveModal('NONE');
    resetForms();
  }, [editingSlideIndex, onSlideSelect, resetForms, session.slides.length, setSession]);

  // Render slide thumbnail
  const renderThumbnail = (slide: Slide, index: number) => {
    const isActive = index === activeSlideIndex;

    return (
      <div
        key={slide.id}
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, index)}
        onClick={() => onSlideSelect(index)}
        className={`
          relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200
          ${isActive
            ? 'border-teal-500 shadow-lg shadow-teal-500/20 scale-105'
            : 'border-slate-700 hover:border-slate-500'}
        `}
      >
        {/* Thumbnail Preview */}
        <div className="aspect-video bg-slate-800 p-2 flex items-center justify-center">
          {slide.type === SlideType.SCRIPTURE && (
            <div className="w-full text-center px-1">
              <BookOpen className="w-6 h-6 text-amber-400 mx-auto mb-1" />
              <p className="text-[10px] text-white truncate">
                {(slide.content as SlideContentScripture).pages[0]?.bookName[lang]}
              </p>
              <p className="text-[9px] text-slate-400 truncate" dir="ltr">
                {(slide.content as SlideContentScripture).pages[0]?.bookName.en} {(slide.content as SlideContentScripture).pages[0]?.chapter}:{(slide.content as SlideContentScripture).pages[0]?.verses}
              </p>
              {((slide.content as SlideContentScripture).pages[0]?.textPrimary?.length || 0) > 1 && (
                <div className="mt-1.5 space-y-0.5 text-left">
                  {(slide.content as SlideContentScripture).pages[0]?.textPrimary?.slice(0, 2).map((line, lineIdx) => (
                    <p key={lineIdx} className="text-[8px] text-slate-300/90 truncate">
                      {line}
                    </p>
                  ))}
                  {((slide.content as SlideContentScripture).pages[0]?.textPrimary?.length || 0) > 2 && (
                    <p className="text-[8px] text-amber-300/90">+{((slide.content as SlideContentScripture).pages[0]?.textPrimary?.length || 0) - 2} more</p>
                  )}
                </div>
              )}
            </div>
          )}
          {slide.type === SlideType.LYRICS && (
            <div className="text-center">
              <Music className="w-6 h-6 text-pink-400 mx-auto mb-1" />
              <p className="text-[10px] text-white truncate">
                {(slide.content as SlideContentLyrics).titleFa || (slide.content as SlideContentLyrics).title}
              </p>
              <p className="text-[9px] text-slate-400 truncate" dir="ltr">
                {(slide.content as SlideContentLyrics).titleEn || (slide.content as SlideContentLyrics).title}
              </p>
            </div>
          )}
          {slide.type === SlideType.MEDIA && (() => {
            const mediaContent = slide.content as SlideContentMedia;
            const ytId = extractYoutubeId(mediaContent?.url);
            if (ytId) {
              return (
                <div className="w-full h-full relative flex items-center justify-center">
                  <img
                    src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                    alt="YouTube"
                    className="w-full h-full object-cover rounded opacity-60 absolute inset-0"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded z-10 p-1">
                    <Youtube className="w-5 h-5 text-red-500 drop-shadow-md" />
                    <span className="text-[8px] text-white font-bold truncate max-w-full font-[Vazirmatn] mt-0.5">
                      {mediaContent.title || d.youtubeFallback}
                    </span>
                  </div>
                </div>
              );
            }
            return (
              <div className="text-center">
                {mediaContent.mediaType === 'image' && <FileImage className="w-6 h-6 text-blue-400 mx-auto" />}
                {mediaContent.mediaType === 'video' && <Video className="w-6 h-6 text-purple-400 mx-auto" />}
                {mediaContent.mediaType === 'audio' && <Mic className="w-6 h-6 text-green-400 mx-auto" />}
              </div>
            );
          })()}
          {slide.type === SlideType.ANNOUNCEMENT && (
            <div className="text-center">
              <Megaphone className="w-6 h-6 text-green-400 mx-auto mb-1" />
              <p className="text-[10px] text-white truncate">
                {(slide.content as SlideContentAnnouncement).title}
              </p>
            </div>
          )}
          {slide.type === SlideType.GENERIC && (
            <div className="text-center">
              <Edit3 className="w-6 h-6 text-purple-400 mx-auto mb-1" />
              <p className="text-[10px] text-white truncate">
                {(slide.content as SlideContentGeneric).title || d.design}
              </p>
            </div>
          )}
          {slide.type === SlideType.LIVEDATA && (
            <div className="text-center">
              <PieChart className="w-6 h-6 text-rose-400 mx-auto mb-1" />
              <p className="text-[10px] text-white truncate">
                {(slide.content as SlideContentLiveData).title || d.liveDataFallback}
              </p>
            </div>
          )}
          {slide.type === SlideType.MEETING && (
            <div className="text-center">
              <PhoneCall className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
              <p className="text-[10px] text-white truncate">
                {(slide.content as SlideContentMeeting).subject || d.meetingFallback}
              </p>
            </div>
          )}
          {slide.type === SlideType.LORDS_PRAYER && (
            <div className="text-center">
              <span className="text-2xl mb-1 block">✨</span>
              <p className="text-[10px] text-[var(--gold)] truncate font-bold">
                {d.lordsPrayerFallback}
              </p>
            </div>
          )}
          {slide.type === SlideType.MEDIA && (slide.content as SlideContentMedia).mediaType === 'image' && (
            <div className="text-center">
              <FileImage className="w-6 h-6 text-blue-400 mx-auto mb-1" />
              <p className="text-[10px] text-white truncate">Image</p>
            </div>
          )}
        </div>

        {/* Slide Number */}
        <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
          {index + 1}
        </div>

        {/* Drag Handle */}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-slate-400" />
        </div>

        {/* Actions */}
        <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setPreviewSlideIndex(index); setIsPreviewOpen(true); }}
            className="p-1 bg-purple-600/80 rounded hover:bg-purple-500"
            title={d.preview}
          >
            <Eye className="w-3 h-3 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); startEditSlide(index); }}
            className="p-1 bg-blue-600/80 rounded hover:bg-blue-500"
            title={d.edit}
          >
            <Edit3 className="w-3 h-3 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); moveSlide(index, 'up'); }}
            className="p-1 bg-slate-700 rounded hover:bg-slate-600"
            disabled={index === 0}
            title={d.moveUp}
            aria-label={d.moveSlideUp}
          >
            <ChevronUp className="w-3 h-3 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); moveSlide(index, 'down'); }}
            className="p-1 bg-slate-700 rounded hover:bg-slate-600"
            disabled={index === session.slides.length - 1}
            title={d.moveDown}
            aria-label={d.moveSlideDown}
          >
            <ChevronDown className="w-3 h-3 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); deleteSlide(index); }}
            className="p-1 bg-red-600/80 rounded hover:bg-red-500"
            title={d.delete}
            aria-label={d.deleteSlide}
          >
            <Trash2 className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>
    );
  };

  // Guard against a not-yet-loaded session. This must come after every Hook
  // call above (React requires Hooks to run unconditionally on every render);
  // an early return before them would call a different number of Hooks
  // depending on `session`, corrupting Hook state or crashing the builder.
  if (!session) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900 text-white p-8">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-xl font-bold font-[Vazirmatn]">{d.loadingSession}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full md:w-72 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col h-[40vh] md:h-full overflow-hidden select-none shrink-0"
      dir={isRTL ? 'rtl' : 'ltr'}
      onContextMenu={(e) => e.preventDefault()}
      style={{ WebkitUserSelect: "none", MozUserSelect: "none", msUserSelect: "none", userSelect: "none" }}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h2 className={`text-lg font-bold text-white mb-4 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
          {t.smartBuilder}
        </h2>

        {session.slides[activeSlideIndex] && (
          <div className="mb-4 space-y-2">
            <SlideFontControls
              currentZoom={session.slides[activeSlideIndex].zoom || 1.0}
              slide={session.slides[activeSlideIndex]}
              onChangeZoom={(newZoom) => updateSlideZoom(activeSlideIndex, clampZoom(newZoom))}
              compact={false}
            />

            {/* Custom Header & Footer Text Overlay Inputs */}
            <div className="mt-3 p-3 bg-slate-900/90 border border-slate-700/80 rounded-xl space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  <span>✍️</span>
                  <span>{d.topBottomTexts}</span>
                </span>
                {(session.slides[activeSlideIndex].headerText || session.slides[activeSlideIndex].footerText) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSession(prev => ({
                        ...prev,
                        slides: prev.slides.map((s, i) => i === activeSlideIndex ? { ...s, headerText: '', footerText: '' } : s)
                      }));
                    }}
                    className="text-[10px] text-zinc-400 hover:text-red-400 transition"
                  >
                    {d.clear}
                  </button>
                )}
              </div>

              {/* Top Text (Header) */}
              <div>
                <label className="block text-[11px] font-bold text-amber-200/90 mb-1">
                  {d.topSlideTextHeader}
                </label>
                <input
                  type="text"
                  value={session.slides[activeSlideIndex].headerText || ''}
                  onChange={(e) => {
                    const text = e.target.value;
                    setSession(prev => ({
                      ...prev,
                      slides: prev.slides.map((s, i) => i === activeSlideIndex ? { ...s, headerText: text } : s)
                    }));
                  }}
                  placeholder={d.eGWelcomeOr}
                  className="w-full bg-black/60 border border-amber-500/30 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-amber-100 outline-none transition placeholder-zinc-500"
                />
              </div>

              {/* Bottom Text (Footer) */}
              <div>
                <label className="block text-[11px] font-bold text-indigo-200/90 mb-1">
                  {d.bottomSlideTextFooter}
                </label>
                <input
                  type="text"
                  value={session.slides[activeSlideIndex].footerText || ''}
                  onChange={(e) => {
                    const text = e.target.value;
                    setSession(prev => ({
                      ...prev,
                      slides: prev.slides.map((s, i) => i === activeSlideIndex ? { ...s, footerText: text } : s)
                    }));
                  }}
                  placeholder={d.eGTranslationNotes}
                  className="w-full bg-black/60 border border-indigo-500/30 focus:border-indigo-400 rounded-lg px-2.5 py-1.5 text-xs text-indigo-100 outline-none transition placeholder-zinc-500"
                />
              </div>
            </div>

          {/* Save as Template */}
          {showSaveTemplateInput ? (
            <div className="flex gap-2 mt-2">
              <input
                autoFocus
                type="text"
                placeholder={d.templateName}
                value={savingTemplateName}
                onChange={e => setSavingTemplateName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveTemplate(savingTemplateName); if (e.key === 'Escape') setShowSaveTemplateInput(false); }}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
              />
              <button type="button" onClick={() => saveTemplate(savingTemplateName)} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-white text-xs font-bold" title={d.saveAction}>✓</button>
              <button type="button" onClick={() => setShowSaveTemplateInput(false)} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs" title={d.cancelAction}>✕</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSaveTemplateInput(true)}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/30 rounded-lg text-emerald-400 text-xs font-bold transition"
              title={d.saveSlideAsTemplate}
            >
              <span>💾</span>
              <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{d.saveAsTemplate}</span>
            </button>
          )}
        </div>
        )}

        {/* Saved Templates */}
        {templates.length > 0 && (
          <div className="mb-4 rounded-xl border border-slate-700 bg-slate-950/70 p-3">
            <button
              type="button"
              onClick={() => setShowTemplates(v => !v)}
              className="w-full flex items-center justify-between text-xs text-slate-300 font-bold"
            >
              <span className={isRTL ? 'font-[Vazirmatn]' : ''}>📁 {d.savedTemplates(templates.length)}</span>
              <span>{showTemplates ? '▲' : '▼'}</span>
            </button>
            {showTemplates && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {templates.map(t => (
                  <div key={t.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => loadTemplate(t)}
                      className="flex-1 text-left px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-700/30 hover:border-indigo-500/40 border border-transparent text-xs text-slate-200 transition truncate"
                      title={d.addThisTemplate}
                    >
                      {t.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTemplate(t.id)}
                      className="p-1 text-slate-600 hover:text-red-400 transition rounded"
                      title={d.deleteTemplate}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Add Buttons */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setActiveModal('SCRIPTURE')}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-amber-600/20 border border-amber-600/40 rounded-lg text-amber-400 hover:bg-amber-600/30 transition text-xs justify-center md:justify-start"
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span className={isRTL ? 'font-[Vazirmatn] truncate' : 'truncate'}>{t.addScripture}</span>
          </button>
          <button
            onClick={() => setActiveModal('LYRICS')}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-pink-600/20 border border-pink-600/40 rounded-lg text-pink-400 hover:bg-pink-600/30 transition text-xs justify-center md:justify-start"
          >
            <Music className="w-3.5 h-3.5 shrink-0" />
            <span className={isRTL ? 'font-[Vazirmatn] truncate' : 'truncate'}>{t.addLyrics}</span>
          </button>

          <button
            onClick={() => setActiveModal('MEDIA')}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-blue-600/20 border border-blue-600/40 rounded-lg text-blue-400 hover:bg-blue-600/30 transition text-xs justify-center md:justify-start"
          >
            <FileImage className="w-3.5 h-3.5 shrink-0" />
            <span className={isRTL ? 'font-[Vazirmatn] truncate' : 'truncate'}>{t.addMedia}</span>
          </button>
          <button
            onClick={() => setActiveModal('PRAYER')}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-rose-600/20 border border-rose-600/40 rounded-lg text-rose-400 hover:bg-rose-600/30 transition text-xs justify-center md:justify-start"
          >
            <Heart className="w-3.5 h-3.5 shrink-0" />
            <span className={isRTL ? 'font-[Vazirmatn] truncate' : 'truncate'}>{d.prayerRequest}</span>
          </button>
          <button
            onClick={() => setActiveModal('ANNOUNCEMENT')}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-green-600/20 border border-green-600/40 rounded-lg text-green-400 hover:bg-green-600/30 transition text-xs justify-center md:justify-start"
          >
            <Megaphone className="w-3.5 h-3.5 shrink-0" />
            <span className={isRTL ? 'font-[Vazirmatn] truncate' : 'truncate'}>{t.addAnnouncement}</span>
          </button>

          {/* Generic/Rich Text Slide Button */}
          <button
            onClick={() => setActiveModal('GENERIC')}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-purple-600/20 border border-purple-600/40 rounded-lg text-purple-400 hover:bg-purple-600/30 transition text-xs justify-center"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className={isRTL ? 'font-[Vazirmatn] truncate' : 'truncate'}>{d.design}</span>
          </button>

          {/* Meeting Slide Button */}
          <button
            onClick={() => setActiveModal('MEETING')}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-emerald-600/20 border border-emerald-600/40 rounded-lg text-emerald-400 hover:bg-emerald-600/30 transition text-xs justify-center"
          >
            <PhoneCall className="w-3.5 h-3.5 shrink-0" />
            <span className={isRTL ? 'font-[Vazirmatn] truncate' : 'truncate'}>{d.videoCall}</span>
          </button>

          {/* Live Data Slide Button */}
          <button
            onClick={() => setActiveModal('LIVEDATA')}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-rose-600/20 border border-rose-600/40 rounded-lg text-rose-400 hover:bg-rose-600/30 transition text-xs col-span-2 justify-center"
          >
            <PieChart className="w-3.5 h-3.5 shrink-0" />
            <span className={isRTL ? 'font-[Vazirmatn] truncate' : 'truncate'}>{d.liveChartsStats}</span>
          </button>

          {/* Luxury Lord's Prayer Button */}
          <button
            onClick={() => handleAddLordsPrayer()}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-[var(--gold)]/20 border border-[var(--gold)]/50 rounded-lg text-[var(--gold)] hover:bg-[var(--gold)]/30 transition text-xs col-span-2 justify-center shadow-[0_0_10px_rgba(214,178,94,0.3)]"
          >
            <span className="text-sm">✨</span>
            <span className={isRTL ? 'font-[Vazirmatn] truncate font-bold' : 'truncate font-bold'}>{d.lordSPrayerLuxury}</span>
          </button>

          {/* Smart QR Code Service Hub Slide Button */}
          <button
            onClick={() => handleAddQrShareSlide()}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-gradient-to-r from-blue-600/25 to-indigo-600/25 border border-blue-400/50 rounded-lg text-blue-300 hover:bg-blue-600/35 transition text-xs col-span-2 justify-center shadow-[0_0_12px_rgba(59,130,246,0.25)]"
            title={d.addQrServiceSlide}
          >
            <QrCode className="w-4 h-4 shrink-0 text-amber-400" />
            <span className={isRTL ? 'font-[Vazirmatn] truncate font-bold' : 'truncate font-bold'}>
              {d.addQrServiceSlide2}
            </span>
          </button>
        </div>
      </div>

      {/* Slides List */}
      <div className="flex-1 overflow-y-auto p-4">
        {session.slides.length === 0 ? (
          <div className={`text-center text-slate-500 text-sm py-8 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
            {t.noSlides}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {session.slides.map((slide, index) => renderThumbnail(slide, index))}
          </div>
        )}
      </div>

      {/* ============ MODALS ============ */}

      {/* Scripture Modal - Pro Version with full features */}
      {activeModal === 'SCRIPTURE' && (
        <ScriptureSelector
          lang={lang}
          onAddSlides={applyScripturePages}
          onClose={() => { setActiveModal('NONE'); resetForms(); }}
        />
      )}

      {/* Lyrics Modal - NEW Enhanced Worship Song Selector */}
      {activeModal === 'LYRICS' && (
        <WorshipSongSelector
          lang={lang}
          existingSlides={session.slides}
          onSelectSong={(content, options) => {
            const finalContent = {
              ...content,
              // Store display options in the content for later use
              displayOptions: options
            } as any;
            // If we opened this picker via "Edit" on an existing lyrics slide,
            // update that slide in place instead of appending a duplicate.
            if (editingSlideIndex !== null) {
              updateSlide(editingSlideIndex, finalContent);
            } else {
              addSlide(SlideType.LYRICS, finalContent);
            }
          }}
          onClose={() => { setActiveModal('NONE'); resetForms(); }}
        />
      )}

      {/* Media Modal */}
      {activeModal === 'MEDIA' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className={`text-xl font-bold text-white mb-4 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              🖼️ {t.addMedia}
            </h3>

            {/* Media Type */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {t.mediaType}
              </label>
              <div className="flex gap-2">
                {[
                  { type: 'image', icon: <FileImage className="w-4 h-4" />, label: t.image },
                  { type: 'video', icon: <Video className="w-4 h-4" />, label: t.video },
                  { type: 'audio', icon: <Mic className="w-4 h-4" />, label: t.audio }
                ].map(({ type, icon, label }) => (
                  <button
                    key={type}
                    onClick={() => setMediaType(type as any)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition ${mediaType === type
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                      }`}
                  >
                    {icon}
                    <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {t.uploadFile}
              </label>
              <input
                type="file"
                accept={mediaType === 'image' ? 'image/*' : mediaType === 'video' ? 'video/*' : 'audio/*'}
                onChange={handleFileUpload}
                className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                aria-label={t.uploadFile}
              />
              {uploadingAsset && (
                <p className={`mt-2 text-xs text-amber-300 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {d.uploadingFile}
                </p>
              )}
            </div>

            {/* Or URL */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className={`text-sm text-slate-400 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {t.fileUrl}
                </label>
                <span className="text-[11px] text-slate-400 font-[Vazirmatn]">
                  {d.supportsYoutubeLinksDirect}
                </span>
              </div>
              <input
                type="text"
                value={mediaUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  setMediaUrl(val);
                  if (extractYoutubeId(val)) {
                    setMediaType('video');
                  }
                }}
                placeholder={d.youtubeUrlPlaceholder}
                className="w-full bg-slate-700 border border-slate-600 focus:border-indigo-500 rounded-lg px-3 py-2 text-white outline-none"
                aria-label={t.fileUrl}
              />

              {/* YouTube Detection Banner */}
              {extractYoutubeId(mediaUrl) && (() => {
                const ytId = extractYoutubeId(mediaUrl);
                return (
                  <div className="mt-2.5 flex items-center justify-between p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 shadow-lg">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0 shadow-md">
                        <Youtube className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-[Vazirmatn]">
                            {d.youtubeVideoDetected}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-600/50 text-white">
                            {ytId}
                          </span>
                        </div>
                        <p className="text-[11px] text-red-300/90 font-[Vazirmatn] mt-0.5">
                          {d.readyToStreamIn}
                        </p>
                      </div>
                    </div>
                    {ytId && (
                      <img
                        src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                        alt="YouTube Poster"
                        className="w-16 h-10 object-cover rounded-lg border border-red-500/30 shadow shrink-0"
                      />
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Asset Library Trigger */}
            <div className="mb-4 bg-slate-900/70 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className={`text-sm font-bold text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {d.alreadyHaveAFile}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMediaPickerAllowedTypes(['image', 'video', 'audio']);
                  setMediaPickerContext('MEDIA');
                }}
                className={`w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition font-bold ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                <Search className="w-5 h-5" />
                {d.browseMediaGallery}
              </button>
            </div>

            {/* Interactive Preview & Positioning (Drag, Pan, Zoom, Fit) */}
            {mediaUrl && (
              <div className="mb-4 bg-slate-950/80 border border-indigo-500/30 rounded-xl p-3 shadow-xl">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className={`text-xs font-bold text-slate-200 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {d.interactiveLivePreviewPan}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {mediaType.toUpperCase()}
                  </span>
                </div>

                {/* Interactive Media Container */}
                {mediaType === 'audio' ? (
                  <div className="py-4">
                    <audio src={mediaUrl} className="w-full" controls />
                  </div>
                ) : (
                  <div className="w-full h-64 bg-black/90 rounded-lg overflow-hidden border border-white/5 relative">
                    <InteractiveMediaFrame
                      url={mediaUrl}
                      type={mediaType}
                      config={mediaDisplayConfig}
                      onChangeConfig={(newCfg) => setMediaDisplayConfig(newCfg)}
                      isEditable={true}
                      isRTL={isRTL}
                      showToolbarByDefault={true}
                      autoPlay={mediaAutoplay}
                      loop={mediaLoop}
                      showWatermarkLogo={mediaShowLogo}
                      watermarkPosition={mediaLogoPosition}
                      watermarkOpacity={mediaLogoOpacity}
                      watermarkSize={mediaLogoSize}
                      className="w-full h-full"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Options */}
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mediaLoop}
                  onChange={(e) => setMediaLoop(e.target.checked)}
                  className="accent-blue-500"
                />
                <span className={`text-sm text-slate-300 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{t.loop}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mediaAutoplay}
                  onChange={(e) => setMediaAutoplay(e.target.checked)}
                  className="accent-blue-500"
                />
                <span className={`text-sm text-slate-300 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{t.autoplay}</span>
              </label>
            </div>

            {/* === Display Settings (ابعاد، موقعیت و کادر تصویر/ویدیو) === */}
            {(mediaType === 'image' || mediaType === 'video') && (
              <div className="mb-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                <h4 className={`text-sm font-bold text-white mb-3 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  📐 {d.displayFramingSettings}
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Width */}
                  <div>
                    <label className={`block text-xs text-slate-400 mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {d.width} {mediaDisplayConfig.width}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={mediaDisplayConfig.width}
                      onChange={(e) => setMediaDisplayConfig(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                      className="w-full accent-blue-500"
                      aria-label={d.width2}
                    />
                  </div>

                  {/* Height */}
                  <div>
                    <label className={`block text-xs text-slate-400 mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {d.height} {mediaDisplayConfig.height}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={mediaDisplayConfig.height}
                      onChange={(e) => setMediaDisplayConfig(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                      className="w-full accent-blue-500"
                      aria-label={d.height2}
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label className={`block text-xs text-slate-400 mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {d.position}
                    </label>
                    <select
                      value={mediaDisplayConfig.position}
                      onChange={(e) => setMediaDisplayConfig(prev => ({ ...prev, position: e.target.value as any }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm"
                      aria-label={d.position2}
                    >
                      <option value="center">{d.center}</option>
                      <option value="top-left">{d.topLeft}</option>
                      <option value="top-right">{d.topRight}</option>
                      <option value="bottom-left">{d.bottomLeft}</option>
                      <option value="bottom-right">{d.bottomRight}</option>
                      <option value="custom">{d.custom}</option>
                    </select>
                  </div>

                  {/* Object Fit */}
                  <div>
                    <label className={`block text-xs text-slate-400 mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {d.fitMode}
                    </label>
                    <select
                      value={mediaDisplayConfig.objectFit}
                      onChange={(e) => setMediaDisplayConfig(prev => ({ ...prev, objectFit: e.target.value as any }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm"
                      aria-label={d.fitMode2}
                    >
                      <option value="contain">{d.contain}</option>
                      <option value="cover">{d.cover}</option>
                      <option value="fill">{d.fill}</option>
                      <option value="none">{d.none}</option>
                    </select>
                  </div>

                  {/* Border Radius */}
                  <div>
                    <label className={`block text-xs text-slate-400 mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {d.borderRadius} {mediaDisplayConfig.borderRadius}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={mediaDisplayConfig.borderRadius}
                      onChange={(e) => setMediaDisplayConfig(prev => ({ ...prev, borderRadius: parseInt(e.target.value) }))}
                      className="w-full accent-blue-500"
                      aria-label={d.borderRadius2}
                    />
                  </div>

                  {/* Opacity */}
                  <div>
                    <label className={`block text-xs text-slate-400 mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {d.opacity} {mediaDisplayConfig.opacity}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={mediaDisplayConfig.opacity}
                      onChange={(e) => setMediaDisplayConfig(prev => ({ ...prev, opacity: parseInt(e.target.value) }))}
                      className="w-full accent-blue-500"
                      aria-label={d.opacity2}
                    />
                  </div>
                </div>

                {/* Custom Position Controls */}
                {mediaDisplayConfig.position === 'custom' && (
                  <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-700">
                    <div>
                      <label className={`block text-xs text-slate-400 mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                        X: {mediaDisplayConfig.customX}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={mediaDisplayConfig.customX}
                        onChange={(e) => setMediaDisplayConfig(prev => ({ ...prev, customX: parseInt(e.target.value) }))}
                        className="w-full accent-purple-500"
                        aria-label="Custom X Position"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs text-slate-400 mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                        Y: {mediaDisplayConfig.customY}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={mediaDisplayConfig.customY}
                        onChange={(e) => setMediaDisplayConfig(prev => ({ ...prev, customY: parseInt(e.target.value) }))}
                        className="w-full accent-purple-500"
                        aria-label="Custom Y Position"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* === Church Watermark Logo on Media (لوگوی ترنسپرنت کلیسا روی تصویر) === */}
            {(mediaType === 'image' || mediaType === 'video') && (
              <div className="mb-4 p-4 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-purple-950/30 rounded-xl border border-indigo-500/20 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <img
                      src="/logo-transparent.png"
                      alt="Logo"
                      className="w-5 h-5 object-contain"
                    />
                    <span className={`text-sm font-bold text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {d.transparentChurchLogoWatermark}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={mediaShowLogo}
                      onChange={(e) => setMediaShowLogo(e.target.checked)}
                      title={d.showLogo}
                    />
                    <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {mediaShowLogo && (
                  <div className="space-y-3 pt-2 border-t border-indigo-500/20 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Logo Position */}
                      <div>
                        <label className={`block text-xs text-slate-400 mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                          {d.position3}
                        </label>
                        <select
                          value={mediaLogoPosition}
                          onChange={(e) => setMediaLogoPosition(e.target.value as any)}
                          className="w-full bg-slate-800 border border-indigo-500/30 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-400"
                          aria-label={d.logoPosition}
                        >
                          <option value="top-right">{d.topRight2}</option>
                          <option value="top-left">{d.topLeft}</option>
                          <option value="bottom-right">{d.bottomRight}</option>
                          <option value="bottom-left">{d.bottomLeft}</option>
                          <option value="center">{d.center}</option>
                        </select>
                      </div>

                      {/* Logo Size */}
                      <div>
                        <label className={`block text-xs text-slate-400 mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                          {d.size}
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {(['sm', 'md', 'lg'] as const).map((sz) => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setMediaLogoSize(sz)}
                              className={`py-1.5 rounded-lg text-xs font-bold transition border ${
                                mediaLogoSize === sz
                                  ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                                  : 'bg-slate-800 text-slate-300 border-white/5 hover:bg-slate-700'
                              }`}
                            >
                              {sz === 'sm' ? (d.small) : sz === 'md' ? (d.medium) : (d.large)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Logo Opacity Slider */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{d.opacity3}</span>
                        <span className="font-mono text-indigo-300">{mediaLogoOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        step="5"
                        value={mediaLogoOpacity}
                        onChange={(e) => setMediaLogoOpacity(parseInt(e.target.value))}
                        className="w-full accent-indigo-500"
                        aria-label={d.logoOpacity}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setActiveModal('NONE'); resetForms(); }}
                className={`px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.cancel}
              </button>
              <button
                onClick={handleMediaSubmit}
                disabled={!mediaUrl}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition disabled:opacity-50 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.add}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {activeModal === 'ANNOUNCEMENT' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className={`text-xl font-bold text-white mb-4 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              📢 {t.addAnnouncement}
            </h3>

            {/* Title */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {d.title}
              </label>
              <input
                type="text"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder={d.announcementTitle}
                className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              />
            </div>

            {/* Content */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {d.content}
              </label>
              <textarea
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                rows={4}
                placeholder={d.enterAnnouncementContent}
                className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 resize-none ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              />
            </div>

            {/* Image Upload */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {d.imageOptional}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAnnouncementImageUpload}
                className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-white hover:file:bg-slate-600"
              />
              {announcementImageUrl && (
                <div className="mt-2 relative">
                  <img src={announcementImageUrl} alt="Preview" className="max-h-32 rounded-lg" />
                  <button
                    onClick={() => setAnnouncementImageUrl('')}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-500"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Event Date */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                <Calendar className="w-4 h-4 inline mr-1" />
                {d.eventDateOptional}
              </label>
              <input
                type="datetime-local"
                value={announcementEventDate}
                onChange={(e) => setAnnouncementEventDate(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>

            {/* Link */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {d.linkOptional}
              </label>
              <input
                type="url"
                value={announcementLink}
                onChange={(e) => setAnnouncementLink(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400"
              />
            </div>

            {/* Preview */}
            {(announcementTitle || announcementContent) && (
              <div className="mb-4 bg-slate-900 rounded-lg p-4 border border-green-600/30">
                <p className={`text-sm text-green-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {d.preview2}
                </p>
                <h4 className={`text-white font-bold text-lg mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {announcementTitle || (d.noTitle)}
                </h4>
                <p className={`text-slate-300 text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {announcementContent || (d.noContent)}
                </p>
                {announcementEventDate && (
                  <p className="text-green-400 text-xs mt-2">
                    📅 {new Date(announcementEventDate).toLocaleString(isRTL ? 'fa-IR' : 'en-US')}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setActiveModal('NONE'); resetForms(); }}
                className={`px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.cancel}
              </button>
              <button
                onClick={handleAnnouncementSubmit}
                disabled={!announcementTitle}
                className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition disabled:opacity-50 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.add}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generic/Design Modal */}
      {activeModal === 'GENERIC' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className={`text-xl font-bold text-white mb-4 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              🎨 {d.designSlide}
            </h3>

            {/* Title */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {d.titleOptional}
              </label>
              <input
                type="text"
                value={genericTitle}
                onChange={(e) => setGenericTitle(e.target.value)}
                placeholder={d.slideTitle}
                className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              />
            </div>

            {/* Background Config */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {d.backgroundType}
                </label>
                <select
                  value={genericBackgroundType}
                  onChange={(e) => setGenericBackgroundType(e.target.value as any)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="color">Solid Color</option>
                  <option value="gradient">Gradient</option>
                  <option value="image">Image URL</option>
                  <option value="video">Video URL</option>
                  <option value="wavyPaper">Wavy Paper (blockquote)</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {d.backgroundValue}
                </label>
                <input
                  type="text"
                  value={genericBackgroundValue}
                  onChange={(e) => setGenericBackgroundValue(e.target.value)}
                  placeholder={genericBackgroundType === 'color' ? '#000000' : genericBackgroundType === 'wavyPaper' ? d.wavyPaperPlaceholder : 'URL or Gradient CSS'}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            {(genericBackgroundType === 'image' || genericBackgroundType === 'video') && (
              <div className="mb-4 bg-slate-900/70 border border-slate-700 rounded-lg p-4">
                <p className={`text-sm font-bold text-white mb-3 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {d.chooseBackgroundFromGallery}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMediaPickerAllowedTypes([genericBackgroundType]);
                    setMediaPickerContext('GENERIC');
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition font-bold ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                >
                  <Search className="w-5 h-5" />
                  {d.browseMediaGallery}
                </button>
              </div>
            )}

            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {d.slideFont}
              </label>
              <select
                value={genericFontFamily}
                onChange={(e) => setGenericFontFamily(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="var(--font-homa)">Homa</option>
                <option value="var(--font-roboto)">Roboto</option>
                <option value="var(--font-vazirmatn)">Vazirmatn</option>
                <option value="var(--font-nastaliq)">Nastaliq</option>
                <option value="var(--font-lalezar)">Lalezar</option>
                <option value="var(--font-playfair)">Playfair Display</option>
                <option value="var(--font-merriweather)">Merriweather</option>
              </select>
            </div>

            {/* HTML Content */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {d.htmlContent}
              </label>
              <textarea
                value={genericHtmlContent}
                onChange={(e) => setGenericHtmlContent(e.target.value)}
                rows={6}
                placeholder={d.pEnterYourHtml}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                Supports: &lt;h1&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;img&gt;, style="..."
              </p>
            </div>

            {/* Layout */}
            <div className="mb-6">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {d.layout}
              </label>
              <div className="flex gap-2">
                {['centered', 'title-only', 'text-only', 'split-left', 'split-right'].map(l => (
                  <button
                    key={l}
                    onClick={() => setGenericLayout(l as any)}
                    className={`px-3 py-1 rounded text-xs ${genericLayout === l ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setActiveModal('NONE'); resetForms(); }}
                className={`px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.cancel}
              </button>
              <button
                onClick={handleGenericSubmit}
                disabled={!genericHtmlContent && !genericTitle}
                className={`px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition disabled:opacity-50 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.add}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Data Modal */}
      {activeModal === 'LIVEDATA' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className={`text-xl font-bold text-white mb-4 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              📊 {d.liveChart}
            </h3>

            {/* Title */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {d.chartTitle}
              </label>
              <input
                type="text"
                value={liveDataTitle}
                onChange={(e) => setLiveDataTitle(e.target.value)}
                placeholder={d.title2}
                className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              />
            </div>

            {/* Chart Config */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {d.chartType}
                </label>
                <div className="flex gap-2 bg-slate-700 p-1 rounded-lg">
                  {[
                    { type: 'bar', icon: BarChart },
                    { type: 'line', icon: LineChart },
                    { type: 'pie', icon: PieChart },
                    { type: 'doughnut', icon: Activity }
                  ].map(item => (
                    <button
                      key={item.type}
                      onClick={() => setLiveDataChartType(item.type as any)}
                      className={`flex-1 p-2 rounded flex justify-center ${liveDataChartType === item.type ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                      title={item.type}
                      aria-label={`${item.type} chart`}
                    >
                      <item.icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {d.options}
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={liveDataShowLegend}
                      onChange={(e) => setLiveDataShowLegend(e.target.checked)}
                      className="rounded border-slate-600 bg-slate-700 text-rose-600"
                    />
                    <span className="text-sm text-slate-300">{d.showLegend}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={liveDataShowValues}
                      onChange={(e) => setLiveDataShowValues(e.target.checked)}
                      className="rounded border-slate-600 bg-slate-700 text-rose-600"
                    />
                    <span className="text-sm text-slate-300">{d.showValues}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Data Points */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {d.dataPoints}
              </label>
              <div className="space-y-2 mb-2">
                {liveDataPoints.map((point, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={point.color}
                      onChange={(e) => {
                        const newPoints = [...liveDataPoints];
                        newPoints[index].color = e.target.value;
                        setLiveDataPoints(newPoints);
                      }}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                      aria-label="Color"
                    />
                    <input
                      type="text"
                      value={point.label}
                      onChange={(e) => {
                        const newPoints = [...liveDataPoints];
                        newPoints[index].label = e.target.value;
                        setLiveDataPoints(newPoints);
                      }}
                      placeholder="Label"
                      className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                      aria-label="Data Label"
                    />
                    <input
                      type="number"
                      value={point.value}
                      onChange={(e) => {
                        const newPoints = [...liveDataPoints];
                        newPoints[index].value = Number(e.target.value);
                        setLiveDataPoints(newPoints);
                      }}
                      placeholder="Value"
                      className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                      aria-label="Data Value"
                    />
                    <button
                      onClick={() => {
                        const newPoints = [...liveDataPoints];
                        newPoints.splice(index, 1);
                        setLiveDataPoints(newPoints);
                      }}
                      className="p-1 text-slate-400 hover:text-red-400"
                      aria-label="Delete Data Point"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setLiveDataPoints([...liveDataPoints, { label: 'New Item', value: 0, color: '#10b981' }])}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                {d.addDataPoint}
              </button>
            </div>

            {/* Background Config */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {d.backgroundType}
                </label>
                <select
                  value={liveDataBackgroundType}
                  onChange={(e) => setLiveDataBackgroundType(e.target.value as any)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="color">Solid Color</option>
                  <option value="gradient">Gradient</option>
                  <option value="image">Image URL</option>
                  <option value="video">Video URL</option>
                  <option value="wavyPaper">Wavy Paper (blockquote)</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {d.backgroundValue}
                </label>
                <input
                  type="text"
                  value={liveDataBackgroundValue}
                  onChange={(e) => setLiveDataBackgroundValue(e.target.value)}
                  placeholder={liveDataBackgroundType === 'color' ? '#000000' : 'URL or Gradient CSS'}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            {(liveDataBackgroundType === 'image' || liveDataBackgroundType === 'video') && (
              <div className="mb-4 bg-slate-900/70 border border-slate-700 rounded-lg p-4">
                <p className={`text-sm font-bold text-white mb-3 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {d.chooseBackgroundFromGallery}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMediaPickerAllowedTypes([liveDataBackgroundType]);
                    setMediaPickerContext('LIVEDATA');
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition font-bold ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                >
                  <Search className="w-5 h-5" />
                  {d.browseMediaGallery}
                </button>
              </div>
            )}

            {libraryError && (
              <p className={`text-xs text-red-300 mb-3 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {libraryError}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setActiveModal('NONE'); resetForms(); }}
                className={`px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.cancel}
              </button>
              <button
                onClick={handleLiveDataSubmit}
                disabled={!liveDataTitle || liveDataPoints.length === 0}
                className={`px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-500 transition disabled:opacity-50 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.add}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Modal */}
      {activeModal === 'MEETING' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg p-6">
            <h3 className={`text-xl font-bold text-white mb-6 flex items-center gap-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              <PhoneCall className="w-6 h-6 text-emerald-400" />
              {d.liveVideoMeeting}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {d.roomId}
                </label>
                <input
                  type="text"
                  value={meetingRoomName}
                  onChange={(e) => setMeetingRoomName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                  placeholder="e.g. Mychurch-Sunday-Service"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono"
                />
                <p className={`text-xs text-slate-500 mt-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {d.alphanumericAndDashesOnly}
                </p>
              </div>

              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {d.meetingSubject}
                </label>
                <input
                  type="text"
                  value={meetingSubject}
                  onChange={(e) => setMeetingSubject(e.target.value)}
                  placeholder={d.eGQA}
                  className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                />
              </div>

              <div className="bg-emerald-900/20 border border-emerald-800/50 p-3 rounded-lg flex gap-3 mt-4">
                <Video className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className={`text-sm text-emerald-200/80 leading-relaxed ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {d.thisSlideLaunchesA}
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => { setActiveModal('NONE'); resetForms(); }}
                className={`px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.cancel}
              </button>
              <button
                onClick={handleMeetingSubmit}
                disabled={!meetingRoomName}
                className={`px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition disabled:opacity-50 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.add}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Prayer Modal */}
      {activeModal === 'PRAYER' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className={`text-xl font-bold text-white mb-6 flex items-center gap-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              <Heart className="w-6 h-6 text-rose-400" />
              {d.addPrayerRequestSlide}
            </h3>

            <div className="space-y-4 mb-6" dir={isRTL ? 'rtl' : 'ltr'}>
              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {d.selectFromListOptional}
                </label>
                <select
                  value={selectedPrayerId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedPrayerId(id);
                    const prayer = availablePrayers.find(p => p.id === id);
                    if (prayer) {
                      setPrayerTitle(prayer.title);
                      setPrayerContent(prayer.content);
                      setPrayerUserName(prayer.user_name);
                      setPrayerIsAnswered(prayer.status === 'answered');
                      setPrayerAnswerText(prayer.answer_text || '');
                    }
                  }}
                  className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                >
                  <option value="">{d.selectARequest}</option>
                  {availablePrayers.map(p => (
                    <option key={p.id} value={p.id}>{p.title} - {p.user_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {d.titleSubject}
                </label>
                <input
                  type="text"
                  value={prayerTitle}
                  onChange={(e) => setPrayerTitle(e.target.value)}
                  className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                />
              </div>

              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {d.content2}
                </label>
                <textarea
                  value={prayerContent}
                  onChange={(e) => setPrayerContent(e.target.value)}
                  rows={4}
                  className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white resize-none ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                    {d.nameOptional}
                  </label>
                  <input
                    type="text"
                    value={prayerUserName}
                    onChange={(e) => setPrayerUserName(e.target.value)}
                    className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={prayerIsAnswered}
                      onChange={(e) => setPrayerIsAnswered(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 text-rose-500 focus:ring-rose-500" 
                    />
                    <span className={`text-sm text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {d.answered}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => { setActiveModal('NONE'); resetForms(); }}
                className={`px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.cancel}
              </button>
              <button
                onClick={handlePrayerSubmit}
                disabled={!prayerTitle || !prayerContent}
                className={`px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-500 transition disabled:opacity-50 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {editingSlideIndex !== null ? (d.update) : t.add}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide Preview Modal */}
      {previewSlideIndex !== null && session.slides[previewSlideIndex] && (
        <SlidePreviewModal
          slide={session.slides[previewSlideIndex]}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewSlideIndex(null);
          }}
          lang={lang}
        />
      )}
    </div>
  );
};
export default SlideBuilder;
