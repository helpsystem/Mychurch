import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useLanguage } from './hooks/useLanguage';

import Layout from './components/Layout';
import LogoLoader from './components/LogoLoader';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import LeadersPage from './pages/LeadersPage';
import SermonsPage from './pages/SermonsPage';
import WorshipPage from './pages/WorshipPage';
import BiblePage from './pages/BiblePage';
import GivingPage from './pages/GivingPage';
import PrayerPage from './pages/PrayerPage';
import EventsPage from './pages/EventsPage';
import ContactPage from './pages/ContactPage';
import AiHelperPage from './pages/AiHelperPage';
import AlHayatGPTExamplesPage from './pages/AlHayatGPTExamplesPage';
import NotFoundPage from './pages/NotFoundPage';
import PresentationPage from './pages/PresentationPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminWorshipManagementPage from './pages/AdminWorshipManagementPage';
import AdminSermonsPage from './pages/AdminSermonsPage';
import WorshipSongsHealthDashboard from './pages/admin/WorshipSongsHealthDashboard';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import ConfigureBackendPage from './pages/ConfigureBackendPage';
import CustomPageRenderer from './pages/CustomPageRenderer';
import GalleryPage from './pages/GalleryPage';
import GuidedTour from './components/GuidedTour';
import ConnectPage from './pages/ConnectPage';
import ScrollToTop from './components/ScrollToTop';
import LoadingScreen from './components/LoadingScreen';
import VerseOfTheDayModal from './components/VerseOfTheDayModal';
import HelpCenterPage from './pages/HelpCenterPage';
import NewHerePage from './pages/NewHerePage';
import TestimonialsPage from './pages/TestimonialsPage';
import LivePage from './pages/LivePage';
import LetterViewerPage from './pages/LetterViewerPage';
import AudioBiblePage from './pages/AudioBiblePage';
import BibleReaderPage from './pages/BibleReaderPage';
import BibleUnifiedPage from './pages/BibleUnifiedPage';
import UnifiedBibleReader from './components/UnifiedBibleReader';
import BibleUnifiedPro from './pages/BibleUnifiedPro';
import BibleUnifiedApp from './pages/BibleUnifiedApp';
import TestComponent from './components/TestComponent';
import MinimalBible from './components/MinimalBible';
import SimpleBibleReader from './components/SimpleBibleReader';
import WorshipSongsPage from './pages/WorshipSongsPage';
import BilingualBibleReader from './pages/BilingualBibleReader';
import BibleKaraokeReader from './pages/BibleKaraokeReader';
import BibleKaraokeMode from './components/BibleKaraokeMode';
import BibleStudyPage from './pages/BibleStudyPage';
import BibleTTSPage from './pages/BibleTTSPage';
import BibleWithTTS from './pages/BibleWithTTS';
import BilingualPresentationDemo from './pages/BilingualPresentationDemo';
import BilingualPresentationSample from './pages/BilingualPresentationSample';
import BilingualPresentationDynamic from './pages/BilingualPresentationDynamic';
import BibleAudioPlayer from './pages/BibleAudioPlayer';
import TTSDemo from './pages/TTSDemo';
import HuggingFaceTTSDemo from './pages/HuggingFaceTTSDemo';
import WorshipSongViewerPage from './pages/WorshipSongViewerPage';
import WorshipPresentationPage from './pages/WorshipPresentationPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import CalendarPage from './pages/CalendarPage';
import PrayerRequestsPage from './pages/PrayerRequestsPage';
import DailyDevotionalPage from './pages/DailyDevotionalPage';
import WordprojectBibleReader from './components/WordprojectBibleReader';
import NotificationCenterPage from './pages/NotificationCenterPage';
import DailyMessagesPage from './pages/DailyMessagesPage';
import TailwindDemoPage from './pages/TailwindDemoPage';
import TTSUsageDashboard from './pages/TTSUsageDashboard';
import CriticalResourceLoader, { criticalResources } from './components/Performance/CriticalResourceLoader';
import FontOptimizer from './components/Performance/FontOptimizer';
import SecurityHeaders from './components/SEO/SecurityHeaders';
import AnalyticsSetup from './components/Analytics/AnalyticsSetup';
import BibleAIChatWidget from './components/BibleAIChatWidget';
import BibleAdminUpload from './pages/BibleAdminUpload';
import PersianBibleTTSPage from './pages/PersianBibleTTSPage';
import BibleFlipbook3DPage from './pages/BibleFlipbook3DPage';
import BibleViewer from './pages/BibleViewer';
import BibleAudioSyncDemoPage from './pages/BibleAudioSyncDemoPage';
import BibleAudioTestPage from './pages/BibleAudioTestPage';
import BibleAudioYouVersionTestPage from './pages/BibleAudioYouVersionTestPage';
import BibleAudioSyncPage from './pages/BibleAudioSyncPage';
import BibleAudioSyncTestPage from './pages/BibleAudioSyncTestPage';
import BibleVoiceChatPage from './pages/BibleVoiceChatPage';
import BiblePresentationCreatorPage from './pages/BiblePresentationCreatorPage';
import ChurchEventRecorderPage from './pages/ChurchEventRecorderPage';
import BibleTextOnlyPage from './pages/BibleTextOnlyPage';
import BibleAudioSuitePage from './pages/BibleAudioSuitePage';
import WorshipAudioSuitePage from './pages/WorshipAudioSuitePage';
import AdminN8NAutomationPage from './pages/AdminN8NAutomationPage';
import AdminAudioDashboardPage from './pages/AdminAudioDashboardPage';
import PresentationCreatorPage from './pages/PresentationCreatorPage';
import AdminSyncManagementPage from './pages/AdminSyncManagementPage';

function App() {
  const { lang } = useLanguage();
  const [showLoading, setShowLoading] = useState(true);
  const [showVerseModal, setShowVerseModal] = useState(false);

  // Using HashRouter to support URLs like https://domain/#/route across all hosts

  useEffect(() => {
    const handleOpenVerseModal = () => setShowVerseModal(true);
    window.addEventListener('openVerseModal', handleOpenVerseModal);

    // Simulate content loading and reduce to 2.5 seconds
    const timer = setTimeout(() => {
      setShowLoading(false);
      // Show verse modal right after loading finishes
      const verseTimer = setTimeout(() => {
        setShowVerseModal(true);
      }, 500); // Small delay to let the main content render first

      return () => clearTimeout(verseTimer);
    }, 2500); // Optimized loading time

    return () => {
      clearTimeout(timer);
      window.removeEventListener('openVerseModal', handleOpenVerseModal);
    };
  }, []);

  if (showLoading) {
    return <LoadingScreen onFinished={() => setShowLoading(false)} />;
  }

  return (
    <>
      <SecurityHeaders />
      <AnalyticsSetup enableGoogleAnalytics={false} /> {/* Enable for production */}
      <CriticalResourceLoader resources={criticalResources} />
      <FontOptimizer />
      <div dir={lang === 'fa' ? 'rtl' : 'ltr'} className={`bg-primary text-white w-full overflow-hidden min-h-screen ${lang === 'fa' ? 'font-vazir' : 'font-poppins'}`}>
        <HashRouter>
          <Toaster position="top-center" />
          <Suspense fallback={<LogoLoader />}>
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
              <Route path="bible/presentation-creator" element={<Layout><BiblePresentationCreatorPage /></Layout>} />
              <Route path="bible/reader" element={<Layout><BilingualBibleReader /></Layout>} />
              <Route path="bible-study" element={<Layout><BibleStudyPage /></Layout>} />
              {/* Redirect old bible-karaoke path to /bible */}
              <Route path="bible-karaoke" element={<Navigate to="/bible" replace />} />
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

              {/* Test route outside Layout */}

              <Route path="presentation" element={<PresentationPage />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>

          {/* Bible AI Chat Widget - Always visible */}
          <BibleAIChatWidget />

          {/* Verse Modal - Show after loading - Inside Router context */}
          {showVerseModal && <VerseOfTheDayModal onClose={() => setShowVerseModal(false)} />}
        </HashRouter>
      </div>
    </>
  );
}

export default App;
