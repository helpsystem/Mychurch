



import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { useLanguage } from './hooks/useLanguage';

import Layout from './components/Layout';
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
import UnifiedBibleReader from './components/UnifiedBibleReader';
import TestComponent from './components/TestComponent';
import MinimalBible from './components/MinimalBible';
import SimpleBibleReader from './components/SimpleBibleReader';
import WorshipSongsPage from './pages/WorshipSongsPage';
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
import BibleTTSPage from './pages/BibleTTSPage';
import BibleAdminUpload from './pages/BibleAdminUpload';
import PersianBibleTTSPage from './pages/PersianBibleTTSPage';
import BibleFlipbook3DPage from './pages/BibleFlipbook3DPage';
import BibleViewer from './pages/BibleViewer';

function App() {
  const { lang } = useLanguage();
  const [showLoading, setShowLoading] = useState(true);
  const [showVerseModal, setShowVerseModal] = useState(false);
  
  // Using HashRouter to support URLs like https://domain/#/route across all hosts

  useEffect(() => {
    // Simulate content loading and reduce to 2.5 seconds
    const timer = setTimeout(() => {
      setShowLoading(false);
      // Show verse modal right after loading finishes
      const verseTimer = setTimeout(() => {
        setShowVerseModal(true);
      }, 500); // Small delay to let the main content render first
      
      return () => clearTimeout(verseTimer);
    }, 2500); // Optimized loading time

    return () => clearTimeout(timer);
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
          <ScrollToTop />
          <GuidedTour />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="leaders" element={<LeadersPage />} />
              <Route path="sermons" element={<SermonsPage />} />
              <Route path="worship" element={<WorshipPage />} />
              <Route path="worship/:id" element={<WorshipSongViewerPage />} />
              <Route path="bible" element={<UnifiedBibleReader />} />
              <Route path="bible-simple" element={<SimpleBibleReader />} />
              <Route path="bible-minimal" element={<MinimalBible />} />
              <Route path="bible-test" element={<TestComponent />} />
              <Route path="bible-old" element={<BibleReaderPage />} />
              <Route path="audio-bible" element={<AudioBiblePage />} />
              <Route path="bible/tts/:bookCode/:chapter" element={<BibleTTSPage />} />
              <Route path="bible-fa/tts/:bookCode/:chapter" element={<PersianBibleTTSPage />} />
              <Route path="bible/admin/upload" element={<ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER']}><BibleAdminUpload /></ProtectedRoute>} />
              <Route path="bible-reader" element={<BibleReaderPage />} />
              <Route path="bible-flipbook/:bookCode/:chapter" element={<BibleFlipbook3DPage />} />
              <Route path="bible-viewer" element={<BibleViewer />} />
              <Route path="worship-songs" element={<WorshipSongsPage />} />
              <Route path="worship-presentation" element={<WorshipPresentationPage />} />
              <Route path="daily-devotional" element={<DailyDevotionalPage />} />
              <Route path="daily-messages" element={<ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER']}><DailyMessagesPage /></ProtectedRoute>} />
              <Route path="notification-center" element={<NotificationCenterPage />} />
              <Route path="giving" element={<GivingPage />} />
              <Route path="prayer" element={<PrayerPage />} />
              <Route path="prayer-requests" element={<PrayerRequestsPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="ai-helper" element={<AiHelperPage />} />
              <Route path="ai-examples" element={<AlHayatGPTExamplesPage />} />
              <Route path="gallery" element={<GalleryPage />} />
              <Route path="help-center" element={<HelpCenterPage />} />
              <Route path="new-here" element={<NewHerePage />} />
              <Route path="connect" element={<ConnectPage />} />
              <Route path="testimonials" element={<TestimonialsPage />} />
              <Route path="live" element={<LivePage />} />
              <Route path="tailwind-demo" element={<TailwindDemoPage />} />
              <Route path="admin/tts-usage" element={<TTSUsageDashboard />} />
              <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="letters/:id" element={<ProtectedRoute><LetterViewerPage /></ProtectedRoute>} />
              <Route path="p/:slug" element={<CustomPageRenderer />} />
              <Route path="wordproject-bible" element={<WordprojectBibleReader />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="verify-email" element={<VerifyEmailPage />} />
            <Route path="admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER']}>
                  <AdminDashboardPage />
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

            <Route path="presentation" element={<PresentationPage />} />
          </Routes>

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
