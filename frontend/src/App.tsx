import React, { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useLanguage } from './hooks/useLanguage';

import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
// import LogoLoader from './components/LogoLoader';
import HomePage from './pages/HomePage';
import LoadingScreen from './components/LoadingScreen';
import VerseOfTheDayModal from './components/VerseOfTheDayModal';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import CriticalResourceLoader, { criticalResources } from './components/Performance/CriticalResourceLoader';
import FontOptimizer from './components/Performance/FontOptimizer';
import SecurityHeaders from './components/SEO/SecurityHeaders';
import AnalyticsSetup from './components/Analytics/AnalyticsSetup';
import { AudioPlayerProvider } from './contexts/AudioPlayerContext';
import FloatingMiniPlayer from './components/FloatingMiniPlayer';

// 🚀 Lazy Loading - صفحات کم‌استفاده فقط وقتی نیاز باشه لود میشن
// این باعث کاهش چشمگیر زمان بارگذاری اولیه میشه

// صفحات اصلی - بلافاصله لود میشن
import AboutPage from './pages/AboutPage';
import SermonsPage from './pages/SermonsPage';
import WorshipPage from './pages/WorshipPage';
import EventsPage from './pages/EventsPage';
import ContactPage from './pages/ContactPage';

// صفحات احراز هویت
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// 🔄 Lazy Loading برای صفحات سنگین
const LeadersPage = lazy(() => import('./pages/LeadersPage'));
const BiblePage = lazy(() => import('./pages/BiblePage'));
const GivingPage = lazy(() => import('./pages/GivingPage'));
const PrayerPage = lazy(() => import('./pages/PrayerPage'));
const AiHelperPage = lazy(() => import('./pages/AiHelperPage'));
const AlHayatGPTExamplesPage = lazy(() => import('./pages/AlHayatGPTExamplesPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const PresentationPage = lazy(() => import('./pages/PresentationPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminWorshipManagementPage = lazy(() => import('./pages/AdminWorshipManagementPage'));
const AdminSermonsPage = lazy(() => import('./pages/AdminSermonsPage'));
const WorshipSongsHealthDashboard = lazy(() => import('./pages/admin/WorshipSongsHealthDashboard'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ConfigureBackendPage = lazy(() => import('./pages/ConfigureBackendPage'));
const CustomPageRenderer = lazy(() => import('./pages/CustomPageRenderer'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const GuidedTour = lazy(() => import('./components/GuidedTour'));
const ConnectPage = lazy(() => import('./pages/ConnectPage'));
const HelpCenterPage = lazy(() => import('./pages/HelpCenterPage'));
const NewHerePage = lazy(() => import('./pages/NewHerePage'));
const TestimonialsPage = lazy(() => import('./pages/TestimonialsPage'));
const LivePage = lazy(() => import('./pages/LivePage'));
const LetterViewerPage = lazy(() => import('./pages/LetterViewerPage'));
const AudioBiblePage = lazy(() => import('./pages/AudioBiblePage'));
const BibleReaderPage = lazy(() => import('./pages/BibleReaderPage'));
const BibleUnifiedPage = lazy(() => import('./pages/BibleUnifiedPage'));
const UnifiedBibleReader = lazy(() => import('./components/UnifiedBibleReader'));
const BibleUnifiedPro = lazy(() => import('./pages/BibleUnifiedPro'));
const BibleUnifiedApp = lazy(() => import('./pages/BibleUnifiedApp'));
const TestComponent = lazy(() => import('./components/TestComponent'));
const MinimalBible = lazy(() => import('./components/MinimalBible'));
const SimpleBibleReader = lazy(() => import('./components/SimpleBibleReader'));
const WorshipSongsPage = lazy(() => import('./pages/WorshipSongsPage'));
const BilingualBibleReader = lazy(() => import('./pages/BilingualBibleReader'));
const BibleKaraokeReader = lazy(() => import('./pages/BibleKaraokeReader'));
const BibleKaraokeMode = lazy(() => import('./components/BibleKaraokeMode'));
const BibleStudyPage = lazy(() => import('./pages/BibleStudyPage'));
const BibleTTSPage = lazy(() => import('./pages/BibleTTSPage'));
const BibleWithTTS = lazy(() => import('./pages/BibleWithTTS'));
const BilingualPresentationDemo = lazy(() => import('./pages/BilingualPresentationDemo'));
const BilingualPresentationSample = lazy(() => import('./pages/BilingualPresentationSample'));
const BilingualPresentationDynamic = lazy(() => import('./pages/BilingualPresentationDynamic'));
const BibleAudioPlayer = lazy(() => import('./pages/BibleAudioPlayer'));
const TTSDemo = lazy(() => import('./pages/TTSDemo'));
const HuggingFaceTTSDemo = lazy(() => import('./pages/HuggingFaceTTSDemo'));
const WorshipSongViewerPage = lazy(() => import('./pages/WorshipSongViewerPage'));
const WorshipPresentationPage = lazy(() => import('./pages/WorshipPresentationPage'));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const PrayerRequestsPage = lazy(() => import('./pages/PrayerRequestsPage'));
const DailyDevotionalPage = lazy(() => import('./pages/DailyDevotionalPage'));
const WordprojectBibleReader = lazy(() => import('./components/WordprojectBibleReader'));
const NotificationCenterPage = lazy(() => import('./pages/NotificationCenterPage'));
const DailyMessagesPage = lazy(() => import('./pages/DailyMessagesPage'));
const TailwindDemoPage = lazy(() => import('./pages/TailwindDemoPage'));
const TTSUsageDashboard = lazy(() => import('./pages/TTSUsageDashboard'));
const BibleAIChatWidget = lazy(() => import('./components/BibleAIChatWidget'));
const BibleAdminUpload = lazy(() => import('./pages/BibleAdminUpload'));
const PersianBibleTTSPage = lazy(() => import('./pages/PersianBibleTTSPage'));
const BibleFlipbook3DPage = lazy(() => import('./pages/BibleFlipbook3DPage'));
const BibleViewer = lazy(() => import('./pages/BibleViewer'));
const BibleAudioSyncDemoPage = lazy(() => import('./pages/BibleAudioSyncDemoPage'));
const BibleAudioTestPage = lazy(() => import('./pages/BibleAudioTestPage'));
const BibleAudioYouVersionTestPage = lazy(() => import('./pages/BibleAudioYouVersionTestPage'));
const BibleAudioSyncPage = lazy(() => import('./pages/BibleAudioSyncPage'));
const BibleAudioSyncTestPage = lazy(() => import('./pages/BibleAudioSyncTestPage'));
const BibleVoiceChatPage = lazy(() => import('./pages/BibleVoiceChatPage'));
const BibleAIChatPage = lazy(() => import('./pages/BibleAIChatPage'));
const BiblePresentationCreatorPage = lazy(() => import('./pages/BiblePresentationCreatorPage'));
const ChurchEventRecorderPage = lazy(() => import('./pages/ChurchEventRecorderPage'));
const BibleTextOnlyPage = lazy(() => import('./pages/BibleTextOnlyPage'));
const BibleAudioSuitePage = lazy(() => import('./pages/BibleAudioSuitePage'));
const WorshipAudioSuitePage = lazy(() => import('./pages/WorshipAudioSuitePage'));
const AdminN8NAutomationPage = lazy(() => import('./pages/AdminN8NAutomationPage'));
const AdminAudioDashboardPage = lazy(() => import('./pages/AdminAudioDashboardPage'));
const PresentationCreatorPage = lazy(() => import('./pages/PresentationCreatorPage'));
const AdminSyncManagementPage = lazy(() => import('./pages/AdminSyncManagementPage'));
const PersianCalendarPage = lazy(() => import('./pages/PersianCalendarPage')); // Persian Smart Calendar
const AdminTimingPage = lazy(() => import('./pages/AdminTimingPage')); // Admin Timing Management
const AdvancedAudioSync = lazy(() => import('./components/AdvancedAudioSync')); // Advanced Audio Sync Tool
const AdminToolsPage = lazy(() => import('./pages/AdminToolsPage')); // Admin Tools Dashboard
const AITestPage = lazy(() => import('./pages/AITestPage')); // AI Test Page
const BackupPage = lazy(() => import('./pages/BackupPage')); // Backup Management
const BibleSyncTestPage = lazy(() => import('./pages/BibleSyncTestPage')); // Bible Sync Test
const BillingPage = lazy(() => import('./pages/BillingPage')); // Billing Page
const EnvironmentPage = lazy(() => import('./pages/EnvironmentPage')); // Environment Settings
const ImageStudioPage = lazy(() => import('./pages/ImageStudioPage')); // AI Image Studio
const ModernBibleTestPage = lazy(() => import('./pages/ModernBibleTestPage')); // Modern Bible Test
const SimpleWorshipPage = lazy(() => import('./pages/SimpleWorshipPage')); // Simple Worship
const StoragePage = lazy(() => import('./pages/StoragePage')); // Storage Management
const VirtualRealityPage = lazy(() => import('./pages/VirtualRealityPage')); // VR Experience
const WorshipSongsArchive = lazy(() => import('./pages/WorshipSongsArchive')); // Songs Archive
const WorshipSyncTestPage = lazy(() => import('./pages/WorshipSyncTestPage')); // Worship Sync Test
const AdminWorshipManager = lazy(() => import('./pages/admin/AdminWorshipManager')); // Admin Worship Manager
const KaraokeTestPage = lazy(() => import('./pages/KaraokeTestPage')); // Karaoke Worship Player Test
const SimpleKaraokeTest = lazy(() => import('./pages/SimpleKaraokeTest')); // Simple Karaoke Test
const AdminAudioProcessorPage = lazy(() => import('./pages/AdminAudioProcessorPage')); // AI Audio Processor with Gemini
const AdvancedWorshipDemoPage = lazy(() => import('./pages/AdvancedWorshipDemoPage'));
const AudioStudioPage = lazy(() => import('./pages/AudioStudioPage')); // AI Audio Studio V3
const VersionDemoPage = lazy(() => import('./pages/VersionDemoPage')); // Multi-Version Song Demo
const AdminVersionTrashPage = lazy(() => import('./pages/admin/AdminVersionTrashPage')); // Version Trash Management
const AdminBroadcastPage = lazy(() => import('./pages/AdminBroadcastPage')); // Broadcast Console Pro

// Wrapper to hide BibleAIChatWidget on AI Helper page
const BibleAIChatWidgetWrapper: React.FC = () => {
  // Check if we're on the AI helper page
  const isAiHelperPage = window.location.hash.includes('/ai-helper');

  if (isAiHelperPage) {
    return null; // Don't show the floating button on AI Helper page
  }

  return (
    <Suspense fallback={null}>
      <BibleAIChatWidget />
    </Suspense>
  );
};

function App() {
  const { lang } = useLanguage();
  const [showLoading, setShowLoading] = useState(() => {
    // Only show loader once per session
    if (typeof window !== 'undefined') {
      // 📱 Skip loader completely on mobile for faster experience
      const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const alreadyLoaded = sessionStorage.getItem('app_loaded');

      // On mobile: skip loader entirely OR if already loaded this session
      if (isMobile || alreadyLoaded) {
        sessionStorage.setItem('app_loaded', 'true');
        return false;
      }
      return true;
    }
    return true;
  });
  const [showVerseModal, setShowVerseModal] = useState(false);

  // Using HashRouter to support URLs like https://domain/#/route across all hosts

  useEffect(() => {
    const handleOpenVerseModal = () => setShowVerseModal(true);
    window.addEventListener('openVerseModal', handleOpenVerseModal);

    // 🚀 Show verse modal after a short delay (only if loading was skipped)
    if (!showLoading) {
      const verseTimer = setTimeout(() => {
        setShowVerseModal(true);
      }, 500);
      return () => {
        clearTimeout(verseTimer);
        window.removeEventListener('openVerseModal', handleOpenVerseModal);
      };
    }

    // 🚀 کاهش زمان بارگذاری از 1.5 به 1 ثانیه
    const timer = setTimeout(() => {
      setShowLoading(false);
      sessionStorage.setItem('app_loaded', 'true');
      // Show verse modal right after loading finishes
      const verseTimer = setTimeout(() => {
        setShowVerseModal(true);
      }, 500); // 🚀 تأخیر کمتر برای نمایش مودال

      return () => clearTimeout(verseTimer);
    }, 1000); // 🚀 زمان لودینگ کاهش یافت به 1 ثانیه

    return () => {
      clearTimeout(timer);
      window.removeEventListener('openVerseModal', handleOpenVerseModal);
    };
  }, [showLoading]);

  if (showLoading) {
    return <LoadingScreen onFinished={() => setShowLoading(false)} />;
  }

  return (
    <>
      <SecurityHeaders />
      <AnalyticsSetup enableGoogleAnalytics={false} /> {/* Enable for production */}
      <CriticalResourceLoader resources={criticalResources} />
      <FontOptimizer />
      <div dir={lang === 'fa' ? 'rtl' : 'ltr'} className={`bg-primary text-white w-full overflow-x-hidden min-h-screen ${lang === 'fa' ? 'font-vazir' : 'font-poppins'}`}>
        <AudioPlayerProvider>
          <HashRouter>
            <ErrorBoundary>
              <Toaster position="top-center" />
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#00040F]"><div className="w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div></div>}>
                <Routes>
                  {/* PUBLIC ROUTES */}
                  <Route path="/" element={<Layout><HomePage /></Layout>} />
                  <Route path="/about" element={<Layout><AboutPage /></Layout>} />
                  <Route path="/leaders" element={<Layout><LeadersPage /></Layout>} />
                  <Route path="/sermons" element={<Layout><SermonsPage /></Layout>} />
                  <Route path="/worship" element={<Layout><WorshipPage /></Layout>} />
                  <Route path="worship/:id" element={<Layout><WorshipSongViewerPage /></Layout>} />
                  <Route path="bible" element={<Layout><BibleUnifiedApp /></Layout>} />
                  <Route path="bible/audio" element={<Layout><AudioBiblePage /></Layout>} />
                  <Route path="bible/text-only" element={<Layout><BibleTextOnlyPage /></Layout>} />
                  <Route
                    path="bible/audio-suite"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER']}>
                        <Layout><BibleAudioSuitePage /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route path="bible/audio-sync-demo" element={<Layout><BibleAudioSyncDemoPage /></Layout>} />
                  <Route path="bible/audio-test" element={<Layout><BibleAudioTestPage /></Layout>} />
                  <Route path="bible/audio-youversion" element={<Layout><BibleAudioYouVersionTestPage /></Layout>} />
                  <Route path="bible/audio-sync" element={<Layout><BibleAudioSyncPage /></Layout>} />
                  <Route path="bible/audio-sync-test" element={<Layout><BibleAudioSyncTestPage /></Layout>} />
                  <Route path="bible/voice-chat" element={<Layout><BibleVoiceChatPage /></Layout>} />
                  <Route path="bible/ai-chat" element={<Layout><BibleAIChatPage /></Layout>} />
                  <Route path="bible/presentation-creator" element={<Layout><BiblePresentationCreatorPage /></Layout>} />
                  <Route path="bible/reader" element={<Layout><BilingualBibleReader /></Layout>} />
                  <Route path="bible/tts" element={<Layout><BibleTTSPage /></Layout>} />
                  <Route path="bible/persian-tts" element={<Layout><PersianBibleTTSPage /></Layout>} />
                  <Route path="bible/flipbook" element={<Layout><BibleFlipbook3DPage /></Layout>} />
                  <Route path="bible/karaoke" element={<Layout><BibleKaraokeReader /></Layout>} />
                  <Route path="bible-study" element={<Layout><BibleStudyPage /></Layout>} />
                  {/* Redirect old bible-karaoke path to /bible/karaoke */}
                  <Route path="bible-karaoke" element={<Navigate to="/bible/karaoke" replace />} />
                  <Route path="bible-reader" element={<Navigate to="/bible" replace />} />
                  <Route path="bible-presentation-sample" element={<Layout><BilingualPresentationSample /></Layout>} />
                  <Route path="bible-presentation" element={<Layout><BilingualPresentationDynamic /></Layout>} />
                  <Route path="bible-audio-tts" element={<Layout><BibleWithTTS /></Layout>} />
                  <Route
                    path="worship/audio-suite"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER']}>
                        <Layout><WorshipAudioSuitePage /></Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route path="worship-songs" element={<Layout><WorshipSongsPage /></Layout>} />
                  <Route path="worship-presentation" element={<Layout><WorshipPresentationPage /></Layout>} />
                  <Route path="worship/audio-studio" element={<Layout><AudioStudioPage /></Layout>} />

                  <Route path="presentation-creator" element={<Layout><PresentationCreatorPage /></Layout>} />
                  <Route path="admin/sync-management" element={
                    <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER']}>
                      <Layout><AdminSyncManagementPage /></Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="daily-devotional" element={<Layout><DailyDevotionalPage /></Layout>} />
                  <Route path="daily-messages" element={<ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER']}><Layout><DailyMessagesPage /></Layout></ProtectedRoute>} />
                  <Route path="notification-center" element={<Layout><NotificationCenterPage /></Layout>} />
                  <Route path="giving" element={<Layout><GivingPage /></Layout>} />
                  <Route path="prayer" element={<Layout><PrayerPage /></Layout>} />
                  <Route path="prayer-requests" element={<Layout><PrayerRequestsPage /></Layout>} />
                  <Route path="events" element={<Layout><EventsPage /></Layout>} />
                  <Route path="contact" element={<Layout><ContactPage /></Layout>} />
                  <Route path="connect" element={<Layout><ConnectPage /></Layout>} />
                  <Route path="ai-helper" element={<Layout><AiHelperPage /></Layout>} />
                  <Route path="alhayat-gpt-examples" element={<Layout><AlHayatGPTExamplesPage /></Layout>} />
                  <Route path="gallery" element={<Layout><GalleryPage /></Layout>} />
                  <Route path="gallery/:id" element={<Layout><GalleryPage /></Layout>} />
                  <Route path="help-center" element={<Layout><HelpCenterPage /></Layout>} />
                  <Route path="new-here" element={<Layout><NewHerePage /></Layout>} />
                  <Route path="testimonials" element={<Layout><TestimonialsPage /></Layout>} />
                  <Route path="live" element={<Layout><LivePage /></Layout>} />
                  <Route path="letters/:id" element={<Layout><LetterViewerPage /></Layout>} />
                  <Route path="announcements" element={<Layout><AnnouncementsPage /></Layout>} />
                  <Route path="calendar" element={<Layout><CalendarPage /></Layout>} />
                  <Route path="persian-calendar" element={<Layout><PersianCalendarPage /></Layout>} />
                  <Route path="tts-demo" element={<Layout><TTSDemo /></Layout>} />
                  <Route path="huggingface-tts" element={<Layout><HuggingFaceTTSDemo /></Layout>} />
                  <Route path="admin/tts-usage" element={<Layout><TTSUsageDashboard /></Layout>} />
                  <Route path="tailwind-demo" element={<Layout><TailwindDemoPage /></Layout>} />
                  <Route path="page/:slug" element={<Layout><CustomPageRenderer /></Layout>} />
                  <Route path="admin/worship-health" element={
                    <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER']}>
                      <Layout><WorshipSongsHealthDashboard /></Layout>
                    </ProtectedRoute>
                  } />
                  
                  {/* 🎬 Broadcast Console Pro - Full Screen */}
                  <Route path="admin/broadcast" element={
                    <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER']}>
                      <AdminBroadcastPage />
                    </ProtectedRoute>
                  } />

                  {/* Auth Routes */}
                  <Route path="login" element={<LoginPage />} />
                  <Route path="signup" element={<SignupPage />} />
                  <Route path="verify-email" element={<VerifyEmailPage />} />
                  <Route path="admin/login" element={<AdminLoginPage />} />

                  {/* Profile - Protected */}
                  <Route path="profile" element={
                    <ProtectedRoute>
                      <Layout><ProfilePage /></Layout>
                    </ProtectedRoute>
                  } />

                  <Route
                    path="events/recorder"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER', 'LEADER']}>
                        <Layout><ChurchEventRecorderPage /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/worship-management"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER']}>
                        <AdminWorshipManagementPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/configure-backend"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN']}>
                        <ConfigureBackendPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/automations"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN']}>
                        <AdminN8NAutomationPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/sermons"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER', 'LEADER']}>
                        <AdminSermonsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/timing"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER']}>
                        <Layout><AdminTimingPage /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/sync-management"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER']}>
                        <Layout><AdminSyncManagementPage /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/audio-sync"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER']}>
                        <Layout><AdvancedAudioSync /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/presentation-creator"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER']}>
                        <Layout><PresentationCreatorPage /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/bible-presentation"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER']}>
                        <Layout><BiblePresentationCreatorPage /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/audio-processor"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER']}>
                        <Layout><AdminAudioProcessorPage /></Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Test route outside Layout */}

                  <Route path="presentation" element={<PresentationPage />} />
                  <Route
                    path="/admin/tools"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER', 'LEADER']}>
                        <AdminToolsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER']}>
                        <AdminDashboardPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Bible Additional Routes */}
                  <Route path="bible/unified" element={<Layout><BibleUnifiedPage /></Layout>} />
                  <Route path="bible/unified-pro" element={<Layout><BibleUnifiedPro /></Layout>} />
                  <Route path="bible/viewer" element={<Layout><BibleViewer /></Layout>} />
                  <Route path="bible/sync-test" element={<Layout><BibleSyncTestPage /></Layout>} />
                  <Route path="bible/modern-test" element={<Layout><ModernBibleTestPage /></Layout>} />
                  <Route path="bible/audio-player" element={<Layout><BibleAudioPlayer /></Layout>} />
                  <Route
                    path="bible/admin-upload"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER']}>
                        <Layout><BibleAdminUpload /></Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Worship Additional Routes */}
                  <Route path="worship/simple" element={<Layout><SimpleWorshipPage /></Layout>} />
                  <Route path="worship/archive" element={<Layout><WorshipSongsArchive /></Layout>} />
                  <Route path="worship/sync-test" element={<Layout><WorshipSyncTestPage /></Layout>} />
                  <Route path="worship/advanced-demo" element={<Layout><AdvancedWorshipDemoPage /></Layout>} />
                  <Route path="worship/version-demo" element={<Layout><VersionDemoPage /></Layout>} />

                  {/* Admin Additional Routes */}
                  <Route
                    path="/admin/backup"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN']}>
                        <Layout><BackupPage /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/storage"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER']}>
                        <Layout><StoragePage /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/environment"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN']}>
                        <Layout><EnvironmentPage /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/billing"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN']}>
                        <Layout><BillingPage /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/worship-manager"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER']}>
                        <Layout><AdminWorshipManager /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/version-trash"
                    element={
                      <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER']}>
                        <Layout><AdminVersionTrashPage /></Layout>
                      </ProtectedRoute>
                    }
                  />

                  {/* AI & Tools Routes */}
                  <Route path="ai-test" element={<Layout><AITestPage /></Layout>} />
                  <Route path="image-studio" element={<Layout><ImageStudioPage /></Layout>} />
                  <Route path="vr" element={<Layout><VirtualRealityPage /></Layout>} />

                  {/* Karaoke Worship Player Test Page */}
                  <Route path="karaoke-test" element={<KaraokeTestPage />} />
                  <Route path="karaoke-simple" element={<SimpleKaraokeTest />} />

                  {/* 404 Not Found - Must be last */}
                  <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
                </Routes>
              </Suspense>

              {/* Bible AI Chat Widget - Lazy loaded - Hidden on AI Helper page */}
              <BibleAIChatWidgetWrapper />

              {/* Verse Modal - Show after loading - Inside Router context */}
              {showVerseModal && <VerseOfTheDayModal onClose={() => setShowVerseModal(false)} />}
            </ErrorBoundary>
          </HashRouter>
          {/* Floating Audio Player - Shows when audio is playing */}
          <FloatingMiniPlayer />
        </AudioPlayerProvider>
      </div>
    </>
  );
}

export default App;
