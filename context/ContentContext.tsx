
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { ContentContextType, ContentData, ContentType, SiteSettings, Language, BibleImportData, BibleBook, ManagedFile, StorageSettings, PrayerRequest, Testimonial } from '../types';
import { api } from '../lib/api';
import { leadersData, sermonsData, eventsData, worshipSongsData, scheduleData, galleriesData, prayerRequestsData, testimonialsData, churchLettersData } from '../lib/mockData';
import { INITIAL_BIBLE_BOOKS, INITIAL_BIBLE_CONTENT } from '../lib/bibleData';
import { 
    CHURCH_ADDRESS, CHURCH_PHONE, MEETING_TIME_EN, MEETING_TIME_FA, 
    FACEBOOK_URL, YOUTUBE_URL, INSTAGRAM_URL
} from '../lib/constants';

export const ContentContext = createContext<ContentContextType | undefined>(undefined);

const initialSettings: SiteSettings = {
    churchName: { en: 'Iranian Christian Church of D.C.', fa: 'کلیسای مسیحی ایرانی واشنگتن دی‌سی' },
    footerDescription: { en: 'A new way to find faith and community. Reliable, and welcoming.', fa: 'راهی جدید برای یافتن ایمان و اجتماع. قابل اعتماد و پذیرا.' },
    address: CHURCH_ADDRESS,
    phone: CHURCH_PHONE,
    whatsappNumber: CHURCH_PHONE,
    meetingTime: { en: MEETING_TIME_EN, fa: MEETING_TIME_FA },
    facebookUrl: FACEBOOK_URL,
    youtubeUrl: YOUTUBE_URL,
    instagramUrl: INSTAGRAM_URL,
    logoUrl: '/images/church-logo-ultra-hd.png',
    verseOfTheDayAttribution: { en: 'In His Service,\nRev. Javad Pishghadamian\nSenior Pastor', fa: 'در خدمت او،\nکشیش جواد پیشقدمیان\nکشیش ارشد' },
    newsletterUrl: '#',
    telegramUrl: '#',
    whatsappGroupUrl: '#',
};

const initialStorageSettings: StorageSettings = {
    defaultImageStorage: 'local',
    ftp: {
        host: '',
        port: 21,
        user: '',
        pass: '',
        path: '/public_html/images'
    }
};

const initialContent: ContentData = {
    leaders: leadersData,
    sermons: sermonsData,
    events: eventsData,
    worshipSongs: worshipSongsData,
    scheduleEvents: scheduleData,
    galleries: galleriesData,
    prayerRequests: prayerRequestsData,
    testimonials: testimonialsData,
    churchLetters: churchLettersData,
    pages: [
        { 
            id: 1, 
            slug: 'welcome-to-our-church', 
            title: { en: 'Welcome!', fa: 'خوش آمدید!' },
            content: { en: 'This is a sample page created from the admin dashboard.', fa: 'این یک صفحه نمونه است که از داشبورد ادمین ایجاد شده است.'},
            status: 'published'
        }
    ],
    settings: initialSettings,
    storage: initialStorageSettings,
    bibleBooks: INITIAL_BIBLE_BOOKS,
    bibleContent: INITIAL_BIBLE_CONTENT,
    files: [
        { id: '1', name: 'church-building.jpg', path: 'general/church-building.jpg', url: 'https://images.unsplash.com/photo-1537526949396-93c4a433f380?q=80&w=2070&auto=format&fit=crop', size: 1200000, type: 'image/jpeg' },
        { id: '2', name: 'prayer-hands.jpg', path: 'general/prayer-hands.jpg', url: 'https://images.unsplash.com/photo-1600033190885-b1a9c1c79a5e?q=80&w=1964&auto=format&fit=crop', size: 850000, type: 'image/jpeg' },
        { id: '3', name: 'pastor-javad.png', path: 'leaders/pastor-javad.png', url: 'https://i.imgur.com/gA0939q.png', size: 500000, type: 'image/png' },
        { id: '4', name: 'sermon-background.jpg', path: 'sermons/backgrounds/sermon-background.jpg', url: 'https://images.unsplash.com/photo-1508361001413-7a9dca2c302d?q=80&w=2070&auto=format&fit=crop', size: 1500000, type: 'image/jpeg' },
    ],
};

export const ContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [content, setContent] = useState<ContentData>(initialContent);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllContent = async () => {
            setLoading(true);
            let apiWarningLogged = false;
            
            const contentEndpoints: { key: keyof Omit<ContentData, 'bibleBooks' | 'bibleContent'>, path: string, mockData: any }[] = [
                { key: 'leaders', path: '/api/leaders', mockData: leadersData },
                { key: 'sermons', path: '/api/sermons', mockData: sermonsData },
                { key: 'events', path: '/api/events', mockData: eventsData },
                { key: 'worshipSongs', path: '/api/worship-songs', mockData: worshipSongsData },
                { key: 'scheduleEvents', path: '/api/schedule-events', mockData: scheduleData },
                { key: 'galleries', path: '/api/galleries', mockData: galleriesData },
                { key: 'prayerRequests', path: '/api/prayer-requests', mockData: prayerRequestsData },
                { key: 'testimonials', path: '/api/testimonials', mockData: testimonialsData },
                { key: 'churchLetters', path: '/api/letters', mockData: churchLettersData },
                { key: 'pages', path: '/api/pages', mockData: initialContent.pages },
                { key: 'settings', path: '/api/settings', mockData: initialSettings },
                { key: 'storage', path: '/api/settings/storage', mockData: initialStorageSettings },
                { key: 'files', path: '/api/files', mockData: initialContent.files },
            ];

            const promises = contentEndpoints.map(endpoint => 
                api.get(endpoint.path)
                    .then(data => ({ key: endpoint.key, data, success: true }))
                    .catch(error => {
                        if (error.name === 'ApiNotConfiguredError' && !apiWarningLogged) {
                            console.warn("API base URL is not configured. The application is running on mock data. Please configure it in the admin panel under 'API Configuration'.");
                            apiWarningLogged = true;
                        } else if (error.name !== 'ApiNotConfiguredError') {
                            console.error(`API Fetch Error: Could not fetch ${endpoint.key} from ${endpoint.path}. Using mock data.`, error.message);
                        }
                        return { key: endpoint.key, data: endpoint.mockData, success: false };
                    })
            );
            
            // Separately fetch Bible data
            const biblePromise = api.get<{ books: BibleBook[], content: ContentData['bibleContent'] }>('/api/bible/all')
                 .then(data => ({ success: true, ...data }))
                 .catch(error => {
                        if (error.name === 'ApiNotConfiguredError' && !apiWarningLogged) {
                            console.warn("API base URL is not configured. The application is running on mock data. Please configure it in the admin panel under 'API Configuration'.");
                            apiWarningLogged = true;
                        } else if (error.name !== 'ApiNotConfiguredError') {
                            console.error(`API Fetch Error: Could not fetch bible from /api/bible/all. Using mock data.`, error.message);
                        }
                        return { success: false, books: INITIAL_BIBLE_BOOKS, content: INITIAL_BIBLE_CONTENT };
                 });

            const results = await Promise.all([...promises, biblePromise]);
            
            const newContent = results.slice(0, -1).reduce((acc, result: any) => {
                acc[result.key] = result.data;
                return acc;
            }, {} as Partial<ContentData>);
            
            const bibleResult = results[results.length - 1] as { success: boolean, books: BibleBook[], content: ContentData['bibleContent'] };

            const atLeastOneApiSuccess = results.some(r => r.success);
            if (!atLeastOneApiSuccess && !apiWarningLogged) {
                 console.error("Failed to fetch any content from API, using fallback mock data for everything.");
            }

            setContent({
                ...initialContent,
                ...(newContent as Omit<ContentData, 'bibleBooks' | 'bibleContent'>),
                bibleBooks: bibleResult.books,
                bibleContent: bibleResult.content,
            });

            setLoading(false);
        };

        fetchAllContent();
    }, []);

    const toKebabCase = (str: string) => str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

    const addItem = async (contentType: ContentType, item: any) => {
        const endpoint = toKebabCase(contentType);
        const newItem = await api.post<any>(`/api/${endpoint}`, item);
        setContent(prevContent => ({
            ...prevContent,
            [contentType]: [...(prevContent[contentType] as any[]), newItem],
        }));
        return newItem;
    };

    const updateItem = async (contentType: ContentType, itemId: number | string, updatedItem: any) => {
        const endpoint = toKebabCase(contentType);
        const returnedItem = await api.put<any>(`/api/${endpoint}/${itemId}`, updatedItem);
        setContent(prevContent => ({
            ...prevContent,
            [contentType]: (prevContent[contentType] as any[]).map(item =>
                item.id === itemId ? returnedItem : item
            ),
        }));
        return returnedItem;
    };

    const deleteItem = async (contentType: ContentType, itemId: number | string) => {
        const endpoint = toKebabCase(contentType);
        await api.delete(`/api/${endpoint}/${itemId}`);
        setContent(prevContent => ({
            ...prevContent,
            [contentType]: (prevContent[contentType] as any[]).filter(item => item.id !== itemId),
        }));
    };
    
    const updateSettings = async (settings: SiteSettings) => {
        const updatedSettings = await api.put<SiteSettings>('/api/settings', settings);
        setContent(prevContent => ({
            ...prevContent,
            settings: updatedSettings
        }));
    };

    const updateStorageSettings = async (settings: StorageSettings) => {
        const updatedSettings = await api.put<StorageSettings>('/api/settings/storage', settings);
        setContent(prevContent => ({
            ...prevContent,
            storage: updatedSettings
        }));
    };
    
    const updateBibleVerse = async (book: string, chapter: string, verseIndex: number, lang: Language, text: string) => {
        const response = await api.put<{ bibleContent: ContentData['bibleContent'] }>('/api/bible', { book, chapter, verseIndex, lang, text });
        setContent(prevContent => ({
            ...prevContent,
            bibleContent: response.bibleContent,
        }));
    };
    
    const importBibleChapter = async (data: BibleImportData) => {
        const response = await api.importBibleChapter(data);
        setContent(prev => ({
            ...prev,
            bibleBooks: response.books,
            bibleContent: response.content
        }));
    };

    const uploadFile = async (file: File, folder?: string): Promise<ManagedFile | null> => {
        const formData = new FormData();
        formData.append('file', file);
        if (folder) {
            formData.append('folder', folder);
        }
        try {
            const newFile = await api.upload<ManagedFile>('/api/files/upload', formData);
            if (newFile) {
                setContent(prevContent => ({
                    ...prevContent,
                    files: [...prevContent.files, newFile],
                }));
                return newFile;
            }
            return null;
        } catch (error) {
            console.error("File upload failed in context", error);
            throw error;
        }
    };
    
    const replaceFile = async (fileId: string, file: File): Promise<ManagedFile | null> => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const fileToReplace = content.files.find(f => f.id === fileId);
            if (!fileToReplace) throw new Error("File not found");

            const path = fileToReplace.path || `uploads/${fileToReplace.name}`;
            const folder = path.substring(0, path.lastIndexOf('/'));
            if (folder) {
                formData.append('folder', folder);
            }

            const updatedFile = await api.replace<ManagedFile>(`/api/files/replace/${fileToReplace.name}`, formData);
             if (updatedFile) {
                setContent(prevContent => ({
                    ...prevContent,
                    files: prevContent.files.map(f => f.id === fileId ? { ...updatedFile, id: fileId } : f),
                }));
                return { ...updatedFile, id: fileId };
            }
            return null;
        } catch (error) {
            console.error("File replace failed in context", error);
            throw error;
        }
    };
    
    const updateFile = async (fileId: string, data: Partial<ManagedFile>): Promise<ManagedFile | null> => {
        try {
            // This endpoint should only handle metadata (e.g., name), not file content.
            const updatedFile = await api.put<ManagedFile>(`/api/files/metadata/${fileId}`, data);
             if (updatedFile) {
                setContent(prevContent => ({
                    ...prevContent,
                    files: prevContent.files.map(f => f.id === fileId ? updatedFile : f),
                }));
                return updatedFile;
            }
            return null;
        } catch (error) {
            console.error("File metadata update failed in context", error);
            throw error;
        }
    };

    const deleteFile = async (file: ManagedFile): Promise<void> => {
        try {
            const path = file.path || `uploads/${file.name}`; // Fallback
            const folder = path.substring(0, path.lastIndexOf('/'));
            await api.delete(`/api/files/${file.name}`, { folder });
            setContent(prevContent => ({
                ...prevContent,
                files: prevContent.files.filter(f => f.id !== file.id),
            }));
        } catch (error) {
            console.error("File deletion failed in context", error);
            throw error;
        }
    };

    const value: ContentContextType = {
        content,
        loading,
        addItem,
        updateItem,
        deleteItem,
        updateSettings,
        updateStorageSettings,
        updateBibleVerse,
        importBibleChapter,
        uploadFile,
        updateFile,
        deleteFile,
        replaceFile,
    };

    return (
        <ContentContext.Provider value={value}>
            {children}
        </ContentContext.Provider>
    );
};
