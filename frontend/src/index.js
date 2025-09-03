import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import swManager from './utils/serviceWorkerManager';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker and listen for updates
(async function registerSW() {
  try {
    await swManager.register();
    swManager.addCallback(({ type }) => {
      if (type === 'SW_UPDATED' || type === 'UPDATE_AVAILABLE') {
        console.log('New app version detected, forcing update...');
        // Force update and clear all caches
        swManager.forceUpdate();
      }
    });
  } catch (err) {
    console.warn('Service worker not registered or manager failed:', err);
  }
})();

// Development helper: Clear caches with Ctrl+Shift+C
if (process.env.NODE_ENV === 'development') {
  document.addEventListener('keydown', async (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'C') {
      event.preventDefault();
      console.log('Manual cache and service worker clear triggered');

      // Unregister all service workers
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('Unregistered service worker:', registration.scope);
        }
      }

      // Clear all caches
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
        console.log('Cleared all caches');
      }

      // Clear localStorage (optional - be careful with this)
      // localStorage.clear();

      // Reload the page
      window.location.reload(true);
    }
  });
  console.log('Development mode: Press Ctrl+Shift+C to clear caches and service workers manually');
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
