// mychurch-next/src/types/broadcast.ts

export type AppLanguage = 'fa' | 'en';

export interface BibleBook {
    key: string;
    name: { fa: string; en: string; };
    chapters: number;
    testament: 'OT' | 'NT';
}

export interface WorshipSong {
    id: number | string;
    title: { fa: string; en: string; [key: string]: string };
    artist?: { fa: string; en: string; [key: string]: string };
    lyrics?: { fa?: string; en?: string; };
    chord?: string;
    youtubeId?: string;
    audioUrl?: string;
    hasTiming?: boolean;
    mode?: string;
    timing_data?: import('./worship-sync').SystemTimingV2 | null;
}

export enum SlideType {
    SCRIPTURE = 'SCRIPTURE',
    LYRICS = 'LYRICS',
    MEDIA = 'MEDIA',
    ANNOUNCEMENT = 'ANNOUNCEMENT',
    GENERIC = 'GENERIC',
    LIVEDATA = 'LIVEDATA',
    MEETING = 'MEETING'
}

export interface ScripturePage {
    id: string;
    book: string;
    bookName: { fa: string; en: string; };
    chapter: number;
    verses: string;
    verseNumbers: number[];
    textPrimary: string[];
    textSecondary: string[];
    translation?: string;
    enTranslation?: string;
    displayMode?: 'list' | 'bubble' | 'referenceList';
    fontFa?: string;
    fontEn?: string;
    referenceItems?: ScriptureReferenceItem[];
    glassPopupEnabled?: boolean;
    popupLabelFa?: string;
    popupLabelEn?: string;
}

export interface ScriptureReferenceItem {
    id: string;
    book: string;
    bookName: { fa: string; en: string; };
    chapter: number;
    verses: string;
    verseNumbers: number[];
    textFa: string[];
    textEn: string[];
    fontFa?: string;
    fontEn?: string;
    translation?: string;
    enTranslation?: string;
}

export interface SlideContentScripture {
    pages: ScripturePage[];
}

export interface LyricsLine {
    text: string;
    chords?: string;
    isChorus?: boolean;
    isVerse?: boolean;
}

export interface LyricsDisplayOptions {
    showFarsiLyrics: boolean;
    showFinglish: boolean;
    showEnglishLyrics: boolean;
    showChords: boolean;
    showTitle: boolean;
    showArtist: boolean;
    showBackground: boolean;
    backgroundType: 'gradient' | 'image' | 'video';
    backgroundUrl?: string;
    backgroundOpacity?: number;
    backgroundBlur?: number;
    textShadow?: boolean;
    objectFit?: 'cover' | 'contain' | 'fill';
}

export interface SlideContentLyrics {
    songId?: number | string;
    title: string;
    titleFa?: string;
    titleEn?: string;
    lines: LyricsLine[];
    lyricsEnLines?: string[];
    chords?: string;
    audioUrl?: string;
    youtubeId?: string;
    timingData?: any;
    finglishLines?: string[];
    hasTiming?: boolean;
    glassPopupEnabled?: boolean;
    displayOptions?: LyricsDisplayOptions;
}

export interface MediaDisplayConfig {
    width: number;
    height: number;
    position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom';
    customX?: number;
    customY?: number;
    objectFit: 'cover' | 'contain' | 'fill' | 'none';
    borderRadius?: number;
    opacity?: number;
}

export interface SlideContentMedia {
    url: string;
    mediaType: 'image' | 'video' | 'audio';
    title?: string;
    isLoop?: boolean;
    isAutoPlay?: boolean;
    displayConfig?: MediaDisplayConfig;
}

export interface SlideContentAnnouncement {
    title: string;
    content: string;
    imageUrl?: string;
    link?: string;
    eventDate?: string;
}

export interface SlideContentGeneric {
    title?: string;
    htmlContent: string;
    fontFamily?: string;
    background?: {
        type: 'color' | 'image' | 'video' | 'gradient' | 'wavyPaper';
        value: string;
        opacity?: number;
    };
    layout?: 'title-only' | 'text-only' | 'split-left' | 'split-right' | 'centered';
}

export interface ChartDataPoint {
    label: string;
    value: number;
    color: string;
}

export interface SlideContentLiveData {
    title: string;
    chartType: 'bar' | 'line' | 'pie' | 'doughnut';
    data: ChartDataPoint[];
    showLegend: boolean;
    showValues: boolean;
    background?: { type: 'color' | 'image' | 'video' | 'gradient' | 'wavyPaper'; value: string; opacity?: number; };
}

export interface SlideContentMeeting {
    roomName: string;
    subject?: string;
}

export type SlideContent =
    | SlideContentScripture
    | SlideContentLyrics
    | SlideContentMedia
    | SlideContentAnnouncement
    | SlideContentGeneric
    | SlideContentLiveData
    | SlideContentMeeting;

export interface Slide {
    id: string;
    order: number;
    type: SlideType;
    content: SlideContent;
    notes?: string;
    duration?: number;
}

export interface BroadcastSession {
    id: string;
    title: string;
    date: Date;
    hostName?: string;
    slides: Slide[];
    status: 'draft' | 'ready' | 'live' | 'ended';
}

export type BroadcastLayout = 'FULL_CAM' | 'PIP' | 'SPLIT' | 'SLIDES_ONLY';
export type LowerThirdSize = 'small' | 'standard' | 'large' | 'xl';

export interface ImagePosition {
    x: number;
    y: number;
    scale: number;
}

export interface LowerThirdItem {
    id: string;
    title: string;
    subtitle: string;
    imageUrl?: string;
    imagePosition?: ImagePosition;
}

export interface PrayerRequest {
    id: string;
    name: string;
    content: string;
    timestamp?: Date;
    category?: string;
    priority?: number;
}

export interface DonationItem {
    id: string;
    title: string;
    description: string;
    url: string;
    qrCodeUrl?: string;
    duration: number;
}

export interface AmenBadgeConfig {
    show: boolean;
    position: { x: number; y: number; };
    style: 'amen-only' | 'amen-cross' | 'cross-only';
    size: 'small' | 'medium' | 'large';
    animationSpeed: 'slow' | 'normal' | 'fast';
}

export interface PrayerCreditsConfig {
    enabled: boolean;
    speed: number;
    showCategory: boolean;
    sortBy: 'priority' | 'time' | 'name';
}

export interface BroadcastOverlayConfig {
    layout: BroadcastLayout;
    pipScale: number;
    pipCustomX?: number;
    pipCustomY?: number;
    pipPosition?: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    leaderVideoShape: 'rectangle' | 'circle' | 'square';
    youtubeStreamKey?: string;
    isStreaming?: boolean;
    streamUrl?: string;
    logoUrl: string | null;
    showLogo: boolean;
    churchName?: string;
    lowerThirds: LowerThirdItem[];
    activeLowerThirdIndex: number;
    showLowerThird: boolean;
    lowerThirdSize: LowerThirdSize;
    isRotating: boolean;
    rotationInterval: number;
    prayerRequests: PrayerRequest[];
    showPrayerTicker: boolean;
    prayerCreditsConfig?: PrayerCreditsConfig;
    donations: DonationItem[];
    activeDonationId: string | null;
    donationDisplayMode: 'OVERLAY' | 'FULLSCREEN';
    amenBadge?: AmenBadgeConfig;
    isDrawingMode?: boolean;
    drawingColor?: string;
    drawingBrushSize?: number;
}

// ─── Preset System ───────────────────────────────────────────────────────
export type ScripturePreset = {
    id: string;
    name: { fa: string; en: string; };
    displayMode: 'list' | 'bubble' | 'referenceList';
    fontFa: string;
    fontEn: string;
    background: { type: 'color' | 'gradient' | 'image' | 'video' | 'wavyPaper'; value?: string; opacity?: number };
};

export const SCRIPTURE_PRESETS: ScripturePreset[] = [
    {
        id: 'nastaliq-wavy',
        name: { fa: 'نستعلیق + کاغذ موجی', en: 'Nastaliq + Wavy Paper' },
        displayMode: 'referenceList',
        fontFa: 'Noto Nastaliq Urdu',
        fontEn: 'Inter',
        background: { type: 'wavyPaper', value: 'متن آیات...', opacity: 100 },
    },
    {
        id: 'professional-dark',
        name: { fa: 'حرفه‌ای تیره', en: 'Professional Dark' },
        displayMode: 'referenceList',
        fontFa: 'Vazirmatn',
        fontEn: 'Playfair Display',
        background: { type: 'gradient', opacity: 100 },
    },
    {
        id: 'elegant-serif',
        name: { fa: 'الگان سریف', en: 'Elegant Serif' },
        displayMode: 'list',
        fontFa: 'Lalezar',
        fontEn: 'Merriweather',
        background: { type: 'color', value: '#1a1a2e', opacity: 100 },
    },
];

