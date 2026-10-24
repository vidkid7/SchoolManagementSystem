import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en/translation.json';
import neTranslations from './locales/ne/translation.json';

const syncDocumentLanguage = (language?: string): void => {
  if (typeof document === 'undefined' || !language) return;
  document.documentElement.lang = language;
};

// Configure i18next
i18n.on('languageChanged', syncDocumentLanguage);

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

syncDocumentLanguage(i18n.resolvedLanguage || i18n.language);

// Suppress i18next promotional console messages and WebSocket warnings
if (typeof window !== 'undefined') {
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  console.log = (...args: Parameters<typeof originalConsoleLog>) => {
    const message = args[0];
    if (typeof message === 'string' && (
      message.includes('i18next') || 
      message.includes('locize')
    )) {
      return;
    }
    originalConsoleLog.apply(console, args);
  };

  console.warn = (...args: Parameters<typeof originalConsoleWarn>) => {
    const message = args[0];
    if (typeof message === 'string' && (
      message.includes('WebSocket') ||
      message.includes('socket.io')
    )) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };

  console.error = (...args: Parameters<typeof originalConsoleError>) => {
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
