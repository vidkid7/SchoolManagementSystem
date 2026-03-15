import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/accessibility.css';
import { registerServiceWorker } from './utils/serviceWorker';

// Suppress browser extension errors and aria-hidden warnings in development
if (import.meta.env.DEV) {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const errorMessage = args[0]?.toString() || '';
    // Suppress known extension errors that don't affect functionality
    if (
      errorMessage.includes('Could not establish connection') ||
      errorMessage.includes('Receiving end does not exist') ||
      errorMessage.includes('Extension context invalidated') ||
      errorMessage.includes('aria-hidden') ||
      errorMessage.includes('Blocked aria-hidden on an element')
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const warnMessage = args[0]?.toString() || '';
    // Suppress aria-hidden warnings
    if (
      warnMessage.includes('aria-hidden') ||
      warnMessage.includes('Blocked aria-hidden on an element')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Register service worker for PWA functionality
if (import.meta.env.PROD) {
  registerServiceWorker().then((registration) => {
    if (registration) {
      console.log('PWA is ready for offline use');
    }
  });
}
