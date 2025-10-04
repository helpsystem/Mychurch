
import React from 'react';

export type Language = 'en' | 'fa';

export interface AdminMessage {
  id: string;
  subject: Record<Language, string>;
  body: Record<Language, string>;
  sentAt: string;
  isRead: boolean;
}

export interface Email {
  id: string;
  from: { name: string; email: string };
  to: string; 
  subject: string;
  body: string; 
  date: string; 
  isRead: boolean;
}

export interface CreditCard {
  brand: string;
  number: string;
  holder: string;
  expires: string;
  isPrimary?: boolean;
}

export interface BillingInfo {
  name: string;
  company: string;
  email: string;
  vat: string;
}

export interface ProfileData {
  name: string;
  billingInfo: BillingInfo;
  creditCards: CreditCard[];
  imageUrl?: string;
  phone?: string;
  whatsappNumber?: string;
  gender?: 'male' | 'female' | 'neutral';
  signature?: { en: string; fa: string; };
}

export interface Invitation {
  fromEmail: string;
  fromName: string;
  status: 'pending' | 'accepted';
}

export interface ActivityLog {
    date: string;
    action: string;
    details: string;
}

export interface User {
  email: string;
  role: 'USER' | 'MANAGER' | 'SUPER_ADMIN';
  permissions: string[];
  profileData: ProfileData;
  invitations: Invitation[];
  activityLog: ActivityLog[];
  messages: AdminMessage[];
  pushSubscription?: PushSubscriptionJSON | null;
  accessibleInboxes?: string[];
}

export interface NotificationStat {
  id: number;
  title: string;
  date: string;
  recipients: number;
  delivered: number;
  clicked: number;
}


export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  canEdit: (section: string) => boolean;
  login: (email: string, password: string) => Promise<User | null>;
  adminLogin: (email: string, password: string) => Promise<User | null>;
  signup: (name: string, email: string, password: string, captchaToken?: string, website?: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<User | null>;
  logout: () => void;
  loading: boolean;
  getUsers: () => Promise<User[]>;
  updateUserPermissions: (email: string, permissions: string[]) => Promise<boolean>;
  updateUserRole: (email: string, role: 'USER' | 'MANAGER' | 'SUPER_ADMIN') => Promise<boolean>;
  createUser: (userData: any) => Promise<User | null>;
  updateUser: (email: string, userData: Partial<User>) => Promise<User | null>;
  updateBillingInfoItem: (field: keyof BillingInfo, value: string) => Promise<User | null>;
  deleteBillingInfoItem: (field: keyof BillingInfo) => Promise<User | null>;
  addCard: (card: Omit<CreditCard, 'isPrimary'>) => Promise<User | null>;
  deleteCard: (cardNumber: string) => Promise<User | null>;
  sendInvitation: (toEmail: string) => Promise<boolean>;
  acceptInvitation: (fromEmail: string) => Promise<User | null>;
  updateProfileData: (data: Partial<ProfileData>) => Promise<User | null>;
  uploadProfilePicture: (file: File) => Promise<{ imageUrl: string }>;
  getUserActivity: (email: string) => Promise<ActivityLog[]>;
  getSiteActivity: () => Promise<ActivityLog[]>;
  updateUserPushSubscription: (subscription: PushSubscriptionJSON | null) => Promise<User | null>;
  sendMessage: (toEmail: string, subject: Record<Language, string>, body: Record<Language, string>, methods: ('inbox' | 'email')[]) => Promise<boolean>;
}

export interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  isConnectingToWhatsapp?: boolean;
}

export interface Sermon {
  id: number;
  title: Record<Language, string>;
  speaker: string;
  date: string; // YYYY-MM-DD
  audioUrl: string;
  series?: { en: string; fa: string; };
  notesUrl?: string;
  bibleReference?: string;
  bibleBook?: string;
  bibleChapter?: string;
  bibleVerses?: string;
  closingBlessing?: Record<Language, string>;
}

export interface WorshipSong {
  id: number;
  title: Record<Language, string>;
  artist: string;
  youtubeId: string;
  lyrics?: Record<Language, string>;
  audioUrl?: string;
  videoUrl?: string;
}

export interface Leader {
  id: number;
  name: Record<Language, string>;
  title: Record<Language, string>;
  imageUrl: string;
  bio: Record<Language, string>;
  whatsappNumber?: string;
}

export interface Event {
  id: number;
  title: Record<Language, string>;
  date: string; // YYYY-MM-DD
  description: Record<Language, string>;
  imageUrl: string;
}

export interface PrayerRequest {
    id: number;
    text: string;
    category: 'thanksgiving' | 'healing' | 'guidance' | 'family' | 'other';
    isAnonymous: boolean;
    authorName?: string;
    prayerCount: number;
    createdAt: string; // ISO Date String
}

export interface Testimonial {
    id: number;
    authorName: string;
    text: Record<Language, string>;
    isAnonymous: boolean;
    status: 'pending' | 'approved';
    createdAt: string; // ISO Date String
}

export interface ScheduleEvent {
  id: number;
  title: Record<Language, string>;
  description: Record<Language, string>;
  leader: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM (24h)
  endTime: string; // HH:MM (24h)
  type: 'in-person' | 'online' | 'hybrid';
  location: string; // Address or URL
}

export interface BibleBook {
  key: string;
  name: Record<Language, string>;
  chapters: number;
}

export interface TimedWord {
  word: string;
  startTime: number;
  endTime: number;
}

export interface TTSResponse {
  audioB64: string;
  timedWords: TimedWord[];
}

export interface FtpSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
  path: string;
}

export interface StorageSettings {
  defaultImageStorage: 'local' | 'ftp';
  ftp: FtpSettings;
}

export interface SiteSettings {
  churchName: Record<Language, string>;
  footerDescription: Record<Language, string>;
  address: string;
  phone: string;
  whatsappNumber?: string;
  meetingTime: Record<Language, string>;
  facebookUrl: string;
  youtubeUrl: string;
  instagramUrl: string;
  logoUrl: string;
  verseOfTheDayAttribution?: { en: string; fa: string; };
  newsletterUrl?: string;
  telegramUrl?: string;
  whatsappGroupUrl?: string;
}

export interface CustomPage {
  id: number;
  slug: string;
  title: Record<Language, string>;
  content: Record<Language, string>;
  status: 'published' | 'draft';
}

export interface ImageItem {
  id: number;
  url: string;
  caption: Record<Language, string>;
}

export interface Gallery {
  id: number;
  title: Record<Language, string>;
  description: Record<Language, string>;
  images: ImageItem[];
}

export interface BibleImportData {
  bookKey: string;
  bookName: { en: string; fa: string };
  chapter: string;
  verses: {
    en: string[];
    fa: string[];
  };
}

export interface ManagedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  path?: string;
}

export interface FieldConfig {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'select' | 'user-select';
    lang?: 'en' | 'fa'; // For bilingual fields
    options?: { value: string; label: string }[];
}

export interface ZendeskArticle {
  id: number;
  title: string;
  html_url: string;
  snippet: string;
}

export interface ChurchLetter {
  id: number;
  from: Record<Language, string>;
  to: Record<Language, string>;
  requestedBy: Record<Language, string>;
  body: Record<Language, string>;
  authorEmail: string; 
  createdAt: string; // ISO Date String
  authorizedUsers: string[]; // Array of user emails
}

export interface ContentData {
  leaders: Leader[];
  sermons: Sermon[];
  events: Event[];
  worshipSongs: WorshipSong[];
  scheduleEvents: ScheduleEvent[];
  pages: CustomPage[];
  settings: SiteSettings;
  bibleBooks: BibleBook[];
  bibleContent: Record<string, Record<string, Record<Language, string[]>>>;
  galleries: Gallery[];
  files: ManagedFile[];
  storage: StorageSettings;
  prayerRequests: PrayerRequest[];
  testimonials: Testimonial[];
  churchLetters: ChurchLetter[];
}

export type ContentType = 'leaders' | 'sermons' | 'events' | 'worshipSongs' | 'scheduleEvents' | 'pages' | 'galleries' | 'files' | 'prayerRequests' | 'testimonials' | 'churchLetters';

export interface ContentContextType {
  content: ContentData;
  loading: boolean;
  addItem: (contentType: ContentType, item: any) => Promise<any>;
  updateItem: (contentType: ContentType, itemId: number | string, item: any) => Promise<any>;
  deleteItem: (contentType: ContentType, itemId: number | string) => Promise<void>;
  updateSettings: (settings: SiteSettings) => Promise<void>;
  updateStorageSettings: (settings: StorageSettings) => Promise<void>;
  updateBibleVerse: (book: string, chapter: string, verseIndex: number, lang: Language, text: string) => Promise<void>;
  importBibleChapter: (data: BibleImportData) => Promise<void>;
  uploadFile: (file: File, folder?: string) => Promise<ManagedFile | null>;
  updateFile: (fileId: string, data: Partial<ManagedFile>) => Promise<ManagedFile | null>;
  deleteFile: (file: ManagedFile) => Promise<void>;
  replaceFile: (fileId: string, file: File) => Promise<ManagedFile | null>;
}

export interface AudioPlayerContextType {
  currentTrack: Sermon | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  playTrack: (track: Sermon) => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  closePlayer: () => void;
}

export interface ChurchAnnouncement {
  id: number;
  title: Record<Language, string>;
  content: Record<Language, string>;
  type: 'general' | 'urgent' | 'event' | 'announcement';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetAudience: string[];
  channels: ('website' | 'email' | 'sms' | 'whatsapp' | 'notification')[];
  autoTranslate: boolean;
  sourceLanguage: 'en' | 'fa';
  authorEmail: string;
  status: 'draft' | 'published' | 'archived';
  publishDate?: string;
  expiryDate?: string;
  referenceNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageLog {
  id: number;
  referenceId: number;
  referenceType: string;
  channel: 'website' | 'email' | 'sms' | 'whatsapp' | 'notification';
  recipientType: string;
  recipientAddress: string;
  language: 'en' | 'fa';
  subject: Record<Language, string>;
  content: Record<Language, string>;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: string;
  deliveryStatus?: string;
  errorMessage?: string;
  metadata: Record<string, any>;
  createdAt: string;
}
