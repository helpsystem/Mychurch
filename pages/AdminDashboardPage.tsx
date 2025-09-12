





import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { LayoutDashboard, FileText, Settings, Users, Music, Calendar, MicVocal, SlidersHorizontal, LogOut, Eye, Link as LinkIcon, DatabaseZap, BookOpen, MessageCircle, Wand2, Send, Phone, User as UserIcon, Image as ImageIcon, ArrowLeft, Download, History, UserPlus, BarChart2, Globe, Upload, Download as DownloadIcon, Copy, Folder, ImageUp, Check, HelpCircle, HardDrive, Share2, ChevronDown, ChevronRight, MessageSquare, Mail } from 'lucide-react';
import { useContent } from '../hooks/useContent';
import DatabaseUpdateManager from '../components/DatabaseUpdateManager';
import { Link, useNavigate } from 'react-router-dom';
import ImageStudioPage from './ImageStudioPage';
import EnvironmentPage from './EnvironmentPage';
import BackupPage from './BackupPage';
import DashboardView from '../components/admin/DashboardView';
import { useTour } from '../hooks/useTour';
import { TourStep } from '../context/TourContext';
import TourPromptModal from '../components/TourPromptModal';
import StoragePage from './StoragePage';

import PermissionsManager from '../components/admin/PermissionsManager';
import ContentManager from '../components/admin/ContentManager';
import PagesView from '../components/admin/PagesView';
import SettingsView from '../components/admin/SettingsView';
import BibleManager from '../components/admin/BibleManager';
import PushNotificationsManager from '../components/admin/PushNotificationsManager';
import GalleryManager from '../components/admin/GalleryManager';
import FileManager from '../components/admin/FileManager';
import ImageManager from '../components/admin/ImageManager';
import CommunicationsManager from '../components/admin/CommunicationsManager';
import TestimonialsManager from '../components/admin/TestimonialsManager';
import LettersManager from '../components/admin/LettersManager';
import AnnouncementsManager from '../components/admin/AnnouncementsManager';
import { AnalyticsDashboard } from '../components/admin/AnalyticsDashboard';
import MessageHistory from '../components/admin/MessageHistory';


const AdminDashboardPage: React.FC = () => {
    const { user, logout } = useAuth();
    const { t, lang } = useLanguage();
    const { content } = useContent();
    const { startTour } = useTour();
    const [view, setView] = useState('dashboard');
    const [showTourPrompt, setShowTourPrompt] = useState(false);
    const [openMenu, setOpenMenu] = useState<string | null>('coreContent');
    const navigate = useNavigate();
    
    useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenAdminTour');
        if (!hasSeenTour) {
            setShowTourPrompt(true);
        }
    }, []);

    const handleStartTour = () => {
        const adminTourSteps: TourStep[] = [
            {
                title: t('tourAdminWelcomeTitle'),
                content: t('adminTourSidebarContent'),
                position: 'center'
            },
            {
                selector: '#admin-sidebar',
                title: t('adminTourSidebarTitle'),
                content: t('adminTourSidebarContent'),
                position: 'right'
            },
            {
                selector: '#view-content',
                title: t('adminTourContentTitle'),
                content: t('adminTourContentContent'),
                position: 'bottom',
                action: () => setView('content')
            },
            {
                selector: '#view-users',
                title: t('adminTourUsersTitle'),
                content: t('adminTourUsersContent'),
                position: 'bottom',
                action: () => setView('users')
            },
            {
                selector: '#view-settings',
                title: t('adminTourSettingsTitle'),
                content: t('adminTourSettingsContent'),
                position: 'top',
                action: () => setView('settings')
            }
        ];
        startTour(adminTourSteps);
        setShowTourPrompt(false);
        localStorage.setItem('hasSeenAdminTour', 'true');
    };

    const handleDeclineTour = () => {
        setShowTourPrompt(false);
        localStorage.setItem('hasSeenAdminTour', 'true');
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };
    
    const toggleMenu = (menuId: string) => {
        setOpenMenu(openMenu === menuId ? null : menuId);
    };

    const menuItems = {
        coreContent: [
            { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboard/>, roles: ['MANAGER', 'SUPER_ADMIN'] },
            { id: 'pages', label: t('pages'), icon: <FileText/>, roles: ['MANAGER', 'SUPER_ADMIN'] },
            { id: 'content', label: t('footerLinkContent'), icon: <Settings/>, roles: ['MANAGER', 'SUPER_ADMIN'] },
            { id: 'testimonials', label: t('navTestimonials'), icon: <MessageSquare/>, roles: ['MANAGER', 'SUPER_ADMIN'] },
            { id: 'letters', label: t('navLetters'), icon: <Mail/>, roles: ['SUPER_ADMIN'] },
            { id: 'announcements', label: 'اطلاعیه‌ها', icon: <MessageCircle/>, roles: ['SUPER_ADMIN', 'MANAGER'] },
            { id: 'analytics', label: 'آمار و گزارش‌گیری', icon: <BarChart2/>, roles: ['SUPER_ADMIN', 'MANAGER'] },
            { id: 'message-history', label: 'تاریخچه پیام‌ها', icon: <History/>, roles: ['SUPER_ADMIN', 'MANAGER'] },
            { id: 'bible', label: t('navBible'), icon: <BookOpen/>, roles: ['SUPER_ADMIN'] },
        ],
        fileManager: [
            { id: 'galleries', label: t('galleries'), icon: <ImageIcon/>, roles: ['MANAGER', 'SUPER_ADMIN'] },
            { id: 'image-manager', label: 'تصاویر سایت', icon: <Folder/>, roles: ['MANAGER', 'SUPER_ADMIN'] },
            { id: 'file-manager', label: t('adminMenuFileManager'), icon: <ImageUp/>, roles: ['MANAGER', 'SUPER_ADMIN'] },
            { id: 'image-studio', label: t('imageStudio'), icon: <Wand2/>, roles: ['MANAGER', 'SUPER_ADMIN'] },
        ],
        siteAdmin: [
            { id: 'users', label: t('user'), icon: <Users/>, roles: ['SUPER_ADMIN'] },
            { id: 'communications', label: t('communications'), icon: <Send/>, roles: ['SUPER_ADMIN', 'MANAGER'] },
            { id: 'notifications', label: t('pushNotifications'), icon: <MessageCircle/>, roles: ['SUPER_ADMIN'] },
            { id: 'settings', label: t('siteSettings'), icon: <SlidersHorizontal/>, roles: ['SUPER_ADMIN'] },
            { id: 'storage', label: t('storage'), icon: <HardDrive/>, roles: ['SUPER_ADMIN'] },
            { id: 'database', label: t('dbUpdatesTitle'), icon: <DatabaseZap/>, roles: ['SUPER_ADMIN'] },
            { id: 'api', label: t('apiConfiguration'), icon: <Globe/>, roles: ['SUPER_ADMIN'] },
            { id: 'backup', label: t('backupExport'), icon: <Download/>, roles: ['SUPER_ADMIN'] },
            { id: 'fileshare', label: t('navFileShare'), icon: <Share2 />, roles: ['MANAGER', 'SUPER_ADMIN'], externalLink: 'https://hidrive.ionos.com/upl/IzAt51PFG' }
        ]
    };

    const renderView = () => {
        switch(view) {
            case 'dashboard': return <DashboardView />;
            case 'pages': return <PagesView />;
            case 'content': return <ContentManager />;
            case 'testimonials': return <TestimonialsManager />;
            case 'letters': return <LettersManager />;
            case 'announcements': return <AnnouncementsManager />;
            case 'analytics': return <AnalyticsDashboard />;
            case 'message-history': return <MessageHistory />;
            case 'galleries': return <GalleryManager />;
            case 'image-manager': return <ImageManager images={[]} title="مدیریت تصاویر سایت" />;
            case 'file-manager': return <FileManager />;
            case 'bible': return <BibleManager />;
            case 'image-studio': return <ImageStudioPage />;
            case 'communications': return <CommunicationsManager />;
            case 'notifications': return <PushNotificationsManager />;
            case 'users': return <PermissionsManager />;
            case 'settings': return <SettingsView />;
            case 'storage': return <StoragePage />;
            case 'database': return <DatabaseUpdateManager />;
            case 'api': return <EnvironmentPage />;
            case 'backup': return <BackupPage />;
            default: return <DashboardView />;
        }
    };
    
    const renderMenuItem = (item: any) => {
         const commonClasses = `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-sm`;
         const activeClasses = 'bg-blue-gradient text-primary font-bold';
         const inactiveClasses = 'text-dimWhite hover:bg-gray-800 hover:text-white';
         
         if (item.externalLink) {
             return (
                 <li key={item.id}>
                    <a href={item.externalLink} target="_blank" rel="noopener noreferrer" className={`${commonClasses} ${inactiveClasses}`}>
                        {item.icon}
                        <span>{item.label}</span>
                    </a>
                </li>
             );
         }
         return (
             <li key={item.id}>
                 <button id={`view-${item.id}`} onClick={() => setView(item.id)} className={`${commonClasses} ${view === item.id ? activeClasses : inactiveClasses}`}>
                     {item.icon}
                     <span>{item.label}</span>
                 </button>
             </li>
         );
    };

    return (
        <div className={`flex h-screen bg-primary ${lang === 'fa' ? 'font-vazir' : 'font-poppins'}`}>
             {showTourPrompt && (
                <TourPromptModal
                    title={t('tourAdminWelcomeTitle')}
                    content={t('adminTourWelcomeContent')}
                    onConfirm={handleStartTour}
                    onDecline={handleDeclineTour}
                />
            )}
            <aside id="admin-sidebar" className="w-64 bg-black-gradient flex flex-col p-4 border-r border-gray-800">
                <div className="flex items-center gap-3 mb-8 px-2">
                    <img src={content.settings.logoUrl} alt="Logo" className="w-10 h-10"/>
                    <span className="text-white font-bold text-lg">{t('adminPanel')}</span>
                </div>
                <nav className="flex-grow overflow-y-auto pr-2">
                    <ul className="space-y-2">
                        <li>
                            <button onClick={() => toggleMenu('coreContent')} className="w-full flex justify-between items-center text-left text-sm font-semibold text-gray-400 uppercase tracking-wider p-2">
                                <span>{t('adminMenuCoreContent')}</span>
                                {openMenu === 'coreContent' ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                            </button>
                            {openMenu === 'coreContent' && <ul className="pl-2 mt-1 space-y-1">{menuItems.coreContent.filter(item => user && item.roles.includes(user.role)).map(renderMenuItem)}</ul>}
                        </li>
                        <li>
                            <button onClick={() => toggleMenu('fileManager')} className="w-full flex justify-between items-center text-left text-sm font-semibold text-gray-400 uppercase tracking-wider p-2">
                                <span>{t('adminMenuFileManager')}</span>
                                {openMenu === 'fileManager' ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                            </button>
                            {openMenu === 'fileManager' && <ul className="pl-2 mt-1 space-y-1">{menuItems.fileManager.filter(item => user && item.roles.includes(user.role)).map(renderMenuItem)}</ul>}
                        </li>
                         <li>
                            <button onClick={() => toggleMenu('siteAdmin')} className="w-full flex justify-between items-center text-left text-sm font-semibold text-gray-400 uppercase tracking-wider p-2">
                                <span>{t('adminMenuSiteAdmin')}</span>
                                {openMenu === 'siteAdmin' ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                            </button>
                            {openMenu === 'siteAdmin' && <ul className="pl-2 mt-1 space-y-1">{menuItems.siteAdmin.filter(item => user && item.roles.includes(user.role)).map(renderMenuItem)}</ul>}
                        </li>
                    </ul>
                </nav>
                 <div className="border-t border-gray-700 pt-4 mt-2">
                     <button onClick={handleStartTour} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-dimWhite hover:bg-gray-800 hover:text-white">
                        <HelpCircle />
                        <span>{t('tourHelp')}</span>
                    </button>
                    <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-dimWhite hover:bg-gray-800 hover:text-white">
                        <LinkIcon />
                        <span>{t('goHome')}</span>
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-dimWhite hover:bg-gray-800 hover:text-white">
                        <LogOut />
                        <span>{t('logout')}</span>
                    </button>
                </div>
            </aside>
            
            <main className="flex-1 overflow-y-auto p-8">
                {renderView()}
            </main>
        </div>
    );
};

export default AdminDashboardPage;
