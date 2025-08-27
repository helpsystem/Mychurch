
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ContentProvider } from './context/ContentContext';
import { TourProvider } from './context/TourContext';
import { AudioPlayerProvider } from './context/AudioPlayerContext';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
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