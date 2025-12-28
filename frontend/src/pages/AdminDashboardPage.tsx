import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { LayoutDashboard, FileText, Settings, Users, Music, Calendar, MicVocal, SlidersHorizontal, LogOut, Eye, Link as LinkIcon, DatabaseZap, BookOpen, MessageCircle, Wand2, Send, Phone, User as UserIcon, Image as ImageIcon, ArrowLeft, Download, History, UserPlus, BarChart2, Globe, Upload, Download as DownloadIcon, Copy, Folder, ImageUp, Check, HelpCircle, HardDrive, Share2, ChevronDown, ChevronRight, MessageSquare, Mail, Zap, Video, RefreshCw } from 'lucide-react';
import { useContent } from '../hooks/useContent';
import { Link, useNavigate } from 'react-router-dom';
import { useTour } from '../hooks/useTour';
import { TourStep } from '../context/TourContext';
import TourPromptModal from '../components/TourPromptModal';

// 🚀 Lazy Loading - کامپوننت‌های ادمین فقط وقتی نیاز باشه لود میشن
// این باعث کاهش 300KB+ در لود اولیه صفحه ادمین میشه
const DashboardView = lazy(() => import('../components/admin/DashboardView'));
const PagesView = lazy(() => import('../components/admin/PagesView'));
const ContentManager = lazy(() => import('../components/admin/ContentManager'));
const SongsManager = lazy(() => import('../components/admin/SongsManager'));
const TestimonialsManager = lazy(() => import('../components/admin/TestimonialsManager'));
const LettersManager = lazy(() => import('../components/admin/LettersManager'));
const AnnouncementsManager = lazy(() => import('../components/admin/AnnouncementsManager'));
const AnalyticsDashboard = lazy(() => import('../components/admin/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const MessageHistory = lazy(() => import('../components/admin/MessageHistory'));
const GalleryManager = lazy(() => import('../components/admin/GalleryManager'));
const ImageManager = lazy(() => import('../components/admin/ImageManager'));
const FileManager = lazy(() => import('../components/admin/FileManager'));
const BibleManager = lazy(() => import('../components/admin/BibleManager'));
const ImageStudioPage = lazy(() => import('./ImageStudioPage'));
const CommunicationsManager = lazy(() => import('../components/admin/CommunicationsManager'));
const PushNotificationsManager = lazy(() => import('../components/admin/PushNotificationsManager'));
const PermissionsManager = lazy(() => import('../components/admin/PermissionsManager'));
const SettingsView = lazy(() => import('../components/admin/SettingsView'));
const StoragePage = lazy(() => import('./StoragePage'));
const DatabaseUpdateManager = lazy(() => import('../components/DatabaseUpdateManager'));
const EnvironmentPage = lazy(() => import('./EnvironmentPage'));
const BackupPage = lazy(() => import('./BackupPage'));
const AdminSermonsPage = lazy(() => import('./AdminSermonsPage'));

// Loading spinner برای lazy components
const AdminLoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
    </div>
);


const AdminDashboardPage: React.FC = () => {
    const { user, logout } = useAuth();
    const { t, lang } = useLanguage();
    const { content } = useContent();
    const { startTour } = useTour();
    const [view, setView] = useState('dashboard');
    const [showTourPrompt, setShowTourPrompt] = useState(false);
    const [openMenu, setOpenMenu] = useState<string | null>('coreContent');
    const [simulatedRole, setSimulatedRole] = useState<string | null>(null);
    const navigate = useNavigate();

    // Role options for SUPER_ADMIN to simulate
    const roleOptions = [
        { value: 'USER', label: lang === 'fa' ? '👤 کاربر عادی' : '👤 Regular User', labelShort: lang === 'fa' ? 'کاربر' : 'User' },
        { value: 'LEADER', label: lang === 'fa' ? '📢 رهبر' : '📢 Leader', labelShort: lang === 'fa' ? 'رهبر' : 'Leader' },
        { value: 'WORSHIP_LEADER', label: lang === 'fa' ? '🎵 رهبر پرستش' : '🎵 Worship Leader', labelShort: lang === 'fa' ? 'رهبر پرستش' : 'Worship Leader' },
        { value: 'MANAGER', label: lang === 'fa' ? '⚙️ مدیر سایت' : '⚙️ Site Manager', labelShort: lang === 'fa' ? 'مدیر' : 'Manager' },
    ];

    // Effective role: simulated role (for SUPER_ADMIN testing) or actual user role
    const effectiveRole = simulatedRole || user?.role || '';

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
            { id: 'dashboard', label: t('dashboard'), icon: <LayoutDashboard />, roles: ['MANAGER', 'SUPER_ADMIN', 'LEADER', 'WORSHIP_LEADER'] },
            { id: 'pages', label: t('pages'), icon: <FileText />, roles: ['MANAGER', 'SUPER_ADMIN', 'LEADER'] },
            { id: 'content', label: t('footerLinkContent'), icon: <Settings />, roles: ['MANAGER', 'SUPER_ADMIN', 'LEADER'] },
            { id: 'songs', label: lang === 'fa' ? 'مدیریت سرودها' : 'Songs Management', icon: <Music />, roles: ['MANAGER', 'SUPER_ADMIN', 'WORSHIP_LEADER'] },
            { id: 'sermons', label: lang === 'fa' ? 'مدیریت جلسات آنلاین' : 'Online Services', icon: <Video />, roles: ['MANAGER', 'SUPER_ADMIN', 'LEADER'] },
            { id: 'worship-health', label: lang === 'fa' ? '📊 وضعیت سرودها' : '📊 Songs Health', icon: <BarChart2 />, roles: ['MANAGER', 'SUPER_ADMIN', 'WORSHIP_LEADER'], externalLink: '/#/admin/worship-health' },
            { id: 'testimonials', label: t('navTestimonials'), icon: <MessageSquare />, roles: ['MANAGER', 'SUPER_ADMIN', 'LEADER'] },
            { id: 'letters', label: t('navLetters'), icon: <Mail />, roles: ['SUPER_ADMIN'] },
            { id: 'announcements', label: 'اطلاعیه‌ها', icon: <MessageCircle />, roles: ['SUPER_ADMIN', 'MANAGER', 'LEADER'] },
            { id: 'daily-messages', label: lang === 'fa' ? 'پیام‌های روزانه' : 'Daily Messages', icon: <Send />, roles: ['SUPER_ADMIN', 'MANAGER', 'LEADER'], externalLink: '/daily-messages' },
            { id: 'analytics', label: 'آمار و گزارش‌گیری', icon: <BarChart2 />, roles: ['SUPER_ADMIN', 'MANAGER', 'LEADER', 'WORSHIP_LEADER'] },
            { id: 'message-history', label: 'تاریخچه پیام‌ها', icon: <History />, roles: ['SUPER_ADMIN', 'MANAGER', 'LEADER'] },
            { id: 'bible', label: t('navBible'), icon: <BookOpen />, roles: ['SUPER_ADMIN', 'LEADER'] },
        ],
        fileManager: [
            { id: 'galleries', label: t('galleries'), icon: <ImageIcon />, roles: ['MANAGER', 'SUPER_ADMIN', 'LEADER', 'WORSHIP_LEADER'] },
            { id: 'image-manager', label: 'تصاویر سایت', icon: <Folder />, roles: ['MANAGER', 'SUPER_ADMIN', 'LEADER'] },
            { id: 'file-manager', label: t('adminMenuFileManager'), icon: <ImageUp />, roles: ['MANAGER', 'SUPER_ADMIN', 'LEADER'] },
            { id: 'image-studio', label: t('imageStudio'), icon: <Wand2 />, roles: ['MANAGER', 'SUPER_ADMIN', 'LEADER'] },
        ],
        siteAdmin: [
            { id: 'users', label: t('user'), icon: <Users />, roles: ['SUPER_ADMIN'] },
            { id: 'communications', label: t('communications'), icon: <Send />, roles: ['SUPER_ADMIN', 'MANAGER', 'LEADER'] },
            { id: 'notifications', label: t('pushNotifications'), icon: <MessageCircle />, roles: ['SUPER_ADMIN', 'MANAGER'] },
            { id: 'automations', label: lang === 'fa' ? 'اتوماسیون n8n' : 'n8n Automations', icon: <Zap />, roles: ['SUPER_ADMIN'], externalLink: '/admin/automations' },
            { id: 'settings', label: t('siteSettings'), icon: <SlidersHorizontal />, roles: ['SUPER_ADMIN'] },
            { id: 'storage', label: t('storage'), icon: <HardDrive />, roles: ['SUPER_ADMIN'] },
            { id: 'database', label: t('dbUpdatesTitle'), icon: <DatabaseZap />, roles: ['SUPER_ADMIN'] },
            { id: 'api', label: t('apiConfiguration'), icon: <Globe />, roles: ['SUPER_ADMIN'] },
            { id: 'backup', label: t('backupExport'), icon: <Download />, roles: ['SUPER_ADMIN'] },
            { id: 'fileshare', label: t('navFileShare'), icon: <Share2 />, roles: ['MANAGER', 'SUPER_ADMIN', 'LEADER'], externalLink: 'https://hidrive.ionos.com/upl/IzAt51PFG' }
        ]
    };

    const renderView = () => {
        const viewComponent = (() => {
            switch (view) {
                case 'dashboard': return <DashboardView />;
                case 'pages': return <PagesView />;
                case 'content': return <ContentManager />;
                case 'songs': return <SongsManager />;
                case 'sermons': return <AdminSermonsPage />;
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
        })();

        return (
            <Suspense fallback={<AdminLoadingSpinner />}>
                {viewComponent}
            </Suspense>
        );
    };

    const renderMenuItem = (item: any) => {
        const commonClasses = `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-sm`;
        const activeClasses = 'bg-blue-gradient text-primary font-bold';
        const inactiveClasses = 'text-dimWhite hover:bg-gray-800 hover:text-white';

        if (item.externalLink) {
            // Check if it's an internal route (starts with /)
            if (item.externalLink.startsWith('/admin/')) {
                return (
                    <li key={item.id}>
                        <Link to={item.externalLink} className={`${commonClasses} ${inactiveClasses}`}>
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    </li>
                );
            }
            // External link
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
                <div className="flex items-center px-4 py-3 border-b border-gray-700 mb-8">
                    <div className="w-10 h-10 rounded-full overflow-hidden relative mr-3">
                        <img src={content.settings.logoUrl} alt="" className="absolute inset-0 w-full h-full object-contain blur-sm opacity-50" aria-hidden="true" />
                        <img src={content.settings.logoUrl} alt="Logo" className="relative w-full h-full object-contain" />
                    </div>
                    <span className="text-white font-bold text-lg">{t('adminPanel')}</span>
                </div>
                <nav className="flex-grow overflow-y-auto pr-2">
                    <ul className="space-y-2">
                        <li>
                            <button onClick={() => toggleMenu('coreContent')} className="w-full flex justify-between items-center text-left text-sm font-semibold text-gray-400 uppercase tracking-wider p-2">
                                <span>{t('adminMenuCoreContent')}</span>
                                {openMenu === 'coreContent' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                            {openMenu === 'coreContent' && <ul className="pl-2 mt-1 space-y-1">{menuItems.coreContent.filter(item => effectiveRole && item.roles.includes(effectiveRole)).map(renderMenuItem)}</ul>}
                        </li>
                        <li>
                            <button onClick={() => toggleMenu('fileManager')} className="w-full flex justify-between items-center text-left text-sm font-semibold text-gray-400 uppercase tracking-wider p-2">
                                <span>{t('adminMenuFileManager')}</span>
                                {openMenu === 'fileManager' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                            {openMenu === 'fileManager' && <ul className="pl-2 mt-1 space-y-1">{menuItems.fileManager.filter(item => effectiveRole && item.roles.includes(effectiveRole)).map(renderMenuItem)}</ul>}
                        </li>
                        <li>
                            <button onClick={() => toggleMenu('siteAdmin')} className="w-full flex justify-between items-center text-left text-sm font-semibold text-gray-400 uppercase tracking-wider p-2">
                                <span>{t('adminMenuSiteAdmin')}</span>
                                {openMenu === 'siteAdmin' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                            {openMenu === 'siteAdmin' && <ul className="pl-2 mt-1 space-y-1">{menuItems.siteAdmin.filter(item => effectiveRole && item.roles.includes(effectiveRole)).map(renderMenuItem)}</ul>}
                        </li>
                    </ul>
                </nav>

                {/* Role Switcher - Only for SUPER_ADMIN */}
                {user?.role === 'SUPER_ADMIN' && (
                    <div className="border-t border-gray-700 pt-4 mt-2">
                        <div className="px-2 mb-2">
                            <label className="text-xs text-gray-400 block mb-1">
                                {lang === 'fa' ? '🔄 مشاهده به عنوان:' : '🔄 View as:'}
                            </label>
                            <select
                                value={simulatedRole || ''}
                                onChange={(e) => setSimulatedRole(e.target.value || null)}
                                className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
                            >
                                <option value="">
                                    {lang === 'fa' ? '👑 مدیر ارشد (نقش واقعی)' : '👑 Super Admin (Real Role)'}
                                </option>
                                {roleOptions.map(role => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {simulatedRole && (
                            <button
                                onClick={() => setSimulatedRole(null)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-yellow-600/20 text-yellow-400 rounded-lg hover:bg-yellow-600/30 transition"
                            >
                                <RefreshCw size={14} />
                                {lang === 'fa' ? 'بازگشت به نقش واقعی' : 'Return to Real Role'}
                            </button>
                        )}
                    </div>
                )}
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
                {/* Simulated Role Warning Banner */}
                {simulatedRole && user?.role === 'SUPER_ADMIN' && (
                    <div className="mb-4 p-3 bg-yellow-600/20 border border-yellow-500/30 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2 text-yellow-400">
                            <Eye size={18} />
                            <span>
                                {lang === 'fa'
                                    ? `در حال مشاهده به عنوان: ${roleOptions.find(r => r.value === simulatedRole)?.labelShort || simulatedRole}`
                                    : `Viewing as: ${roleOptions.find(r => r.value === simulatedRole)?.labelShort || simulatedRole}`
                                }
                            </span>
                        </div>
                        <button
                            onClick={() => setSimulatedRole(null)}
                            className="text-sm text-yellow-400 hover:text-yellow-300 underline"
                        >
                            {lang === 'fa' ? 'بازگشت' : 'Exit'}
                        </button>
                    </div>
                )}
                {renderView()}
            </main>
        </div>
    );
};

export default AdminDashboardPage;
