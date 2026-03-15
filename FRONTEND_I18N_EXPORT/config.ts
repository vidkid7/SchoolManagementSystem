import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en/translation.json';
import neTranslations from './locales/ne/translation.json';

// Configure i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      ne: {
        translation: neTranslations,
      },
    },
    fallbackLng: 'ne',
    debug: false,
    saveMissing: false,
    missingKeyHandler: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language',
    },
    react: {
      useSuspense: false,
    },
  });

// Suppress i18next promotional console messages and WebSocket warnings
if (typeof window !== 'undefined') {
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  console.log = (...args: any[]) => {
    const message = args[0];
    if (typeof message === 'string' && (
      message.includes('i18next') || 
      message.includes('locize')
    )) {
      return;
    }
    originalConsoleLog.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const message = args[0];
    if (typeof message === 'string' && (
      message.includes('WebSocket') ||
      message.includes('socket.io')
    )) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };

  console.error = (...args: any[]) => {
    const message = args[0];
    if (typeof message === 'string' && (
      message.includes('WebSocket is closed') ||
      message.includes('socket.io')
    )) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

export default i18n;
