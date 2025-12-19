import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import VerseOfTheDayModal from './VerseOfTheDayModal';
import GlobalAudioPlayer from './GlobalAudioPlayer';

const Layout: React.FC = () => {
  const [showVerseModal, setShowVerseModal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Listen for manual verse modal open from homepage button
    const handleOpenVerseModal = () => {
      setShowVerseModal(true);
    };
    
    window.addEventListener('openVerseModal', handleOpenVerseModal);
    return () => {
      window.removeEventListener('openVerseModal', handleOpenVerseModal);
    };
  }, []);

  useEffect(() => {
    const revealElements = document.querySelectorAll('.reveal-on-scroll');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(el => observer.observe(el));

    return () => {
        revealElements.forEach(el => {
            try {
                observer.unobserve(el);
            } catch (error) {
                // Ignore errors if element is already gone
            }
        });
    };
  }, [location.pathname]); // Re-run on route change to catch new elements

  const handleCloseModal = () => {
    setShowVerseModal(false);
  };
  
  const handleOpenVerseModal = () => {
      setShowVerseModal(true);
  };

  return (
    <div className="bg-primary w-full overflow-hidden flex flex-col min-h-screen">
      <div className="sm:px-16 px-6 flex justify-center items-center">
        <div className="xl:max-w-[1280px] w-full">
          <Header onOpenVerseModal={handleOpenVerseModal} />
        </div>
      </div>

      <main className="flex-grow page-fade-in pb-24" key={location.pathname}>
        <div className="relative">
          <Outlet />
        </div>
      </main>

      <div className="waves-container">
          <svg className="waves" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
          <defs>
          <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
          </defs>
          <g className="parallax">
          <use xlinkHref="#gentle-wave" x="48" y="0" />
          <use xlinkHref="#gentle-wave" x="48" y="3" />
          <use xlinkHref="#gentle-wave" x="48" y="5" />
          <use xlinkHref="#gentle-wave" x="48" y="7" />
          </g>
          </svg>
      </div>

      <div className="sm:px-16 px-6 flex justify-center items-start">
        <div className="xl:max-w-[1280px] w-full">
          <Footer onOpenVerseModal={handleOpenVerseModal} />
        </div>
      </div>
      
      {showVerseModal && <VerseOfTheDayModal onClose={handleCloseModal} />}
      <GlobalAudioPlayer />
    </div>
  );
};

export default Layout;