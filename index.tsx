
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ContentProvider } from './context/ContentContext';
import { TourProvider } from './context/TourContext';
import { AudioPlayerProvider } from './context/AudioPlayerContext';

// Service Worker disabled during development to prevent caching issues
// Aggressively unregister and remove any existing service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('ServiceWorker unregistered:', registration.scope);
    });
  });
  
  // Also try to unregister from the controller
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
  
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
        console.log('Cache deleted:', cacheName);
      });
    });
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <ContentProvider>
        <AuthProvider>
          <TourProvider>
            <AudioPlayerProvider>
              <App />
            </AudioPlayerProvider>
          </TourProvider>
        </AuthProvider>
      </ContentProvider>
    </LanguageProvider>
  </React.StrictMode>
);