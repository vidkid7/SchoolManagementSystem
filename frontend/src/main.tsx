import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/accessibility.css';
import { registerServiceWorker } from './utils/serviceWorker';

// Suppress browser extension errors in development
if (import.meta.env.DEV) {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const errorMessage = args[0]?.toString() || '';
    // Suppress known extension errors that don't affect functionality
    if (
      errorMessage.includes('Could not establish connection') ||
      errorMessage.includes('Receiving end does not exist') ||
      errorMessage.includes('Extension context invalidated')
    ) {
      return;
    }
    originalError.apply(console, args);
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
