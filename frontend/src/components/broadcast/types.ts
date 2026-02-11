/**
 * 🎬 Broadcast Console Pro - Types
 * سیستم مدیریت پخش زنده کلیسا
 * 
 * هماهنگ با داده‌های سایت:
 * - worship_songs.json برای سرودها
 * - bibleData.ts برای آیات کتاب مقدس
 */

// =============== SLIDE TYPES ===============

export enum SlideType {
  SCRIPTURE = 'SCRIPTURE',
  LYRICS = 'LYRICS',
  MEDIA = 'MEDIA',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  GENERIC = 'GENERIC',
  LIVEDATA = 'LIVEDATA'
}

// =============== SCRIPTURE (آیات کتاب مقدس) ===============

export interface ScripturePage {
  id: string;
  book: string;           // کلید کتاب مثل "John" یا "Matthew"
  bookName: {
    fa: string;
    en: string;
  };
  chapter: number;
  verses: string;         // مثل "1-3" یا "16"
  verseNumbers: number[]; // آرایه شماره آیات: [1, 2, 3]
  textPrimary: string[];  // آرایه آیات فارسی
  textSecondary: string[]; // آرایه آیات انگلیسی
  translation?: string;   // ترجمه فارسی: mojdeh, qadim, etc.
  enTranslation?: string; // ترجمه انگلیسی: asv, net, kjv
  displayMode?: 'list' | 'bubble'; // حالت نمایش: لیستی یا حبابی
}

export interface SlideContentScripture {
  pages: ScripturePage[];
}

// =============== LYRICS (متن سرود) ===============

export interface SongReference {
  id: number;
  title: {
    fa: string;
    en: string;
  };
  artist: string;
  audioUrl?: string;
  youtubeId?: string;
  hasTiming?: boolean;
}

export interface LyricsLine {
  text: string;
  chords?: string;        // آکورد این خط (برای رهبران)
  isChorus?: boolean;     // آیا کروس/ریفرین است
  isVerse?: boolean;      // آیا بند است
}

// Display options for worship songs
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
  // New Background Options
  backgroundOpacity?: number; // 0-100
  backgroundBlur?: number;    // px
  textShadow?: boolean;       // Strong text shadow
  objectFit?: 'cover' | 'contain' | 'fill';
}

export interface SlideContentLyrics {
  songId?: number;        // ارجاع به آهنگ در دیتابیس
  title: string;
  lines: LyricsLine[];
  chords?: string;        // آکورد کلی آهنگ
  audioUrl?: string;      // فایل صوتی
  youtubeId?: string;     // لینک یوتوب
  // Karaoke/Sync support
  timingData?: any;       // SystemTimingV2 data for karaoke
  finglishLines?: string[]; // Finglish translations
  hasTiming?: boolean;    // آیا timing کاراکه دارد
  // Display options
  displayOptions?: LyricsDisplayOptions;
}

// =============== MEDIA (رسانه) ===============

export interface MediaDisplayConfig {
  width: number;        // درصد عرض (10-100)
  height: number;       // درصد ارتفاع (10-100)
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom';
  customX?: number;     // موقعیت X سفارشی (0-100)
  customY?: number;     // موقعیت Y سفارشی (0-100)
  objectFit: 'cover' | 'contain' | 'fill' | 'none';
  borderRadius?: number; // گوشه گرد (0-50)
  opacity?: number;     // شفافیت (0-100)
}

export interface SlideContentMedia {
  url: string;
  mediaType: 'image' | 'video' | 'audio';
  title?: string;
  isLoop?: boolean;
  isAutoPlay?: boolean;
  displayConfig?: MediaDisplayConfig;
}

// =============== ANNOUNCEMENT (اعلانات) ===============

export interface SlideContentAnnouncement {
  title: string;
  content: string;
  imageUrl?: string;
  link?: string;
  eventDate?: string;
}

// =============== GENERIC (متن و طراحی آزاد) ===============

export interface SlideContentGeneric {
  title?: string;
  htmlContent: string;    // محتوای Rich Text
  background?: {
    type: 'color' | 'image' | 'video' | 'gradient';
    value: string;
    opacity?: number;
  };
  layout?: 'title-only' | 'text-only' | 'split-left' | 'split-right' | 'centered';
}

// =============== LIVE DATA / CHARTS (نمودار زنده) ===============

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
  background?: {
    type: 'color' | 'image' | 'video' | 'gradient';
    value: string;
    opacity?: number;
  };
}

// =============== UNIFIED SLIDE ===============

export type SlideContent =
  | SlideContentScripture
  | SlideContentLyrics
  | SlideContentMedia
  | SlideContentAnnouncement
  | SlideContentGeneric
  | SlideContentLiveData;

export interface Slide {
  id: string;
  order: number;
  type: SlideType;
  content: SlideContent;
  notes?: string;         // یادداشت‌های خصوصی برای رهبران
  duration?: number;      // مدت زمان نمایش (ثانیه)
}

// =============== SESSION (جلسه) ===============

export interface BroadcastSession {
  id: string;
  title: string;
  date: Date;
  hostName?: string;
  slides: Slide[];
  status: 'draft' | 'ready' | 'live' | 'ended';
}

// =============== BROADCAST OVERLAY CONFIG ===============

export type BroadcastLayout = 'FULL_CAM' | 'PIP' | 'SPLIT' | 'SLIDES_ONLY';
export type LowerThirdSize = 'small' | 'standard' | 'large' | 'xl';
export type PipPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface ImagePosition {
  x: number;              // درصد جابجایی افقی (0-100)
  y: number;              // درصد جابجایی عمودی (0-100)
  scale: number;          // مقیاس (0.5 تا 2)
}

export interface LowerThirdItem {
  id: string;
  title: string;          // نام یا عنوان
  subtitle: string;       // زیرعنوان (مثلا نقش)
  imageUrl?: string;      // عکس پروفایل
  imagePosition?: ImagePosition; // تنظیمات موقعیت و زوم تصویر
}

export interface PrayerRequest {
  id: string;
  name: string;
  content: string;
  timestamp?: Date;
  category?: string;  // دسته‌بندی: healing, family, work, etc.
  priority?: number;  // 1-5 (1=highest)
}

export interface DonationItem {
  id: string;
  title: string;
  description: string;
  url: string;            // لینک پرداخت یا QR
  qrCodeUrl?: string;     // تصویر QR Code
  duration: number;       // مدت نمایش (ثانیه)
}

// =============== AMEN BADGE OVERLAY ===============

export interface AmenBadgeConfig {
  show: boolean;
  position: {
    x: number;  // درصد از چپ (0-100)
    y: number;  // درصد از بالا (0-100)
  };
  style: 'amen-only' | 'amen-cross' | 'cross-only';
  size: 'small' | 'medium' | 'large';
  animationSpeed: 'slow' | 'normal' | 'fast';
}

// =============== PRAYER CREDITS ROLL CONFIG ===============

export interface PrayerCreditsConfig {
  enabled: boolean;
  speed: number;  // 1-10 (1=slowest, 10=fastest)
  showCategory: boolean;
  sortBy: 'priority' | 'time' | 'name';
}

export interface PrayerRequest {
  id: string;
  name: string;
  content: string;
  timestamp?: Date;
  category?: string;  // دسته‌بندی: healing, family, work, etc.
  priority?: number;  // 1-5 (1=highest)
}

export interface BroadcastOverlayConfig {
  // Layout & Camera
  layout: BroadcastLayout;
  pipScale: number; // 0.1 to 1.0
  pipCustomX?: number; // % from left
  pipCustomY?: number; // % from top
  pipPosition?: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  leaderVideoShape: 'rectangle' | 'circle' | 'square';

  // Streaming
  youtubeStreamKey?: string;
  isStreaming?: boolean;
  streamUrl?: string;

  // Branding
  logoUrl: string | null;
  showLogo: boolean;
  churchName?: string;

  // Lower Thirds (زیرنویس اطلاعات)
  lowerThirds: LowerThirdItem[];
  activeLowerThirdIndex: number;
  showLowerThird: boolean;
  lowerThirdSize: LowerThirdSize;

  // Rotation
  isRotating: boolean;
  rotationInterval: number;

  // Prayer Wall
  prayerRequests: PrayerRequest[];
  showPrayerTicker: boolean;
  prayerCreditsConfig?: PrayerCreditsConfig;

  // Donations
  donations: DonationItem[];
  activeDonationId: string | null;
  donationDisplayMode: 'OVERLAY' | 'FULLSCREEN';

  // Amen Badge Overlay
  amenBadge?: AmenBadgeConfig;

  // Drawing / Annotation
  isDrawingMode?: boolean;
  drawingColor?: string;
  drawingBrushSize?: number;
}

// =============== DEVICE STATUS ===============

export interface DeviceStatus {
  audio: boolean;
  video: boolean;
  screen: boolean;
  network: 'excellent' | 'good' | 'poor' | 'offline';
  latencyMs: number;
}

// =============== TRANSLATIONS ===============

export type AppLanguage = 'en' | 'fa';

export interface TranslationDict {
  // General
  live: string;
  synced: string;
  startRec: string;
  stopRec: string;
  settings: string;
  cancel: string;
  add: string;
  remove: string;
  save: string;
  preview: string;
  close: string;

  // Builder
  smartBuilder: string;
  aiAssistant: string;
  aiPlaceholder: string;
  generate: string;
  thinking: string;
  addScripture: string;
  addLyrics: string;
  addMedia: string;
  addAnnouncement: string;
  noSlides: string;

  // Scripture
  book: string;
  chapter: string;
  verse: string;
  translation: string;
  searchScripture: string;
  fetch: string;
  fetching: string;

  // Lyrics
  songTitle: string;
  selectSong: string;
  searchSongs: string;
  lyricsLabel: string;
  chordsLabel: string;
  audioLabel: string;

  // Media
  mediaType: string;
  image: string;
  video: string;
  audio: string;
  uploadFile: string;
  fileUrl: string;
  loop: string;
  autoplay: string;

  // Console
  presenterNotes: string;
  noNotes: string;
  prev: string;
  next: string;

  // Broadcast Settings
  layout: string;
  fullCam: string;
  pip: string;
  split: string;
  slidesOnly: string;
  uploadLogo: string;
  showLogo: string;

  // Lower Thirds
  infoOverlay: string;
  addItem: string;
  title: string;
  subtitle: string;
  autoTranslate: string;
  rotation: string;
  interval: string;
  size: string;

  // Prayer Wall
  prayerWall: string;
  showPrayerWall: string;
  addRequest: string;
  requestNamePlaceholder: string;
  requestContentPlaceholder: string;

  // Donations
  donations: string;
  donationTitle: string;
  donationDesc: string;
  donationUrl: string;
  donationDuration: string;
  addDonation: string;
  show: string;
  showing: string;
}

// =============== SITE DATA INTERFACES ===============

/**
 * فرمت سرود از worship_songs.json
 */
export interface WorshipSong {
  id: number;
  title: {
    fa: string;
    en: string;
  };
  artist: string;
  composer?: string;
  youtubeId?: string;
  audioUrl?: string;
  videoUrl?: string;
  lyrics?: {
    fa: string;
    en?: string;
  };
  chord?: string;
  mode?: string;
  tags?: string[];
  hasTiming?: boolean;
}

/**
 * فرمت کتاب کتاب مقدس از bibleData.ts
 */
export interface BibleBook {
  key: string;
  name: {
    en: string;
    fa: string;
  };
  chapters: number;
}
