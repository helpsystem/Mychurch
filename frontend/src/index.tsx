
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ContentProvider } from './context/ContentContext';
import { TourProvider } from './context/TourContext';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import ErrorBoundary from './components/ErrorBoundary';

// Service Worker disabled during development to prevent caching issues
// Unregister any existing service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('ServiceWorker unregistered');
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Remove initial loader and show root
const loader = document.getElementById('initial-loader');
if (loader) loader.remove();
rootElement.style.display = 'block';

root.render(
  <React.StrictMode>
    <LanguageProvider>
      <ContentProvider>
        <AuthProvider>
          <TourProvider>
            <AudioPlayerProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </AudioPlayerProvider>
          </TourProvider>
        </AuthProvider>
      </ContentProvider>
    </LanguageProvider>
  </React.StrictMode>
);