import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Polyfill for structuredClone (required by fake-indexeddb)
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock import.meta.env for Jest
Object.defineProperty(global, 'importMeta', {
  value: {
    env: {
      VITE_API_URL: 'http://localhost:3000',
      VITE_API_BASE_URL: 'http://localhost:3000/api/v1',
      DEV: false,
      PROD: true,
    }
  },
  writable: true,
});

// Mock the config/api module before any imports
jest.mock('../config/api', () => ({
  API_URL: 'http://localhost:3000/api/v1',
  API_BASE_URL: 'http://localhost:3000/api/v1',
  default: {
    API_URL: 'http://localhost:3000/api/v1',
    API_BASE_URL: 'http://localhost:3000/api/v1',
  }
}));

// Mock i18n to avoid initialization issues
jest.mock('../i18n/config', () => ({
  default: {
    use: jest.fn(),
    init: jest.fn(),
    t: jest.fn((key: string) => key),
    changeLanguage: jest.fn(),
  },
  i18n: {
    use: jest.fn(),
    init: jest.fn(),
    t: jest.fn((key: string) => key),
    changeLanguage: jest.fn(),
  },
}));