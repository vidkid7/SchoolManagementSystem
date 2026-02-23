/**
 * Service Worker Utilities Tests
 */

import {
  isOnline,
  formatBytes,
  setupNetworkListeners
} from '../serviceWorker';

describe('Service Worker Utilities', () => {
  describe('isOnline', () => {
    it('should return navigator.onLine status', () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      expect(isOnline()).toBe(true);

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      expect(isOnline()).toBe(false);
    });
  });

  describe('formatBytes', () => {
    it('should format 0 bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('should format bytes correctly', () => {
      expect(formatBytes(500)).toBe('500 Bytes');
    });

    it('should format kilobytes correctly', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1572864)).toBe('1.5 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatBytes(1073741824)).toBe('1 GB');
      expect(formatBytes(1610612736)).toBe('1.5 GB');
    });

    it('should round to 2 decimal places', () => {
      expect(formatBytes(1234567)).toBe('1.18 MB');
    });
  });

  describe('setupNetworkListeners', () => {
    let onOnlineMock: jest.Mock;
    let onOfflineMock: jest.Mock;
    let cleanup: () => void;

    beforeEach(() => {
      onOnlineMock = jest.fn();
      onOfflineMock = jest.fn();
      cleanup = setupNetworkListeners(onOnlineMock, onOfflineMock);
    });

    afterEach(() => {
      cleanup();
    });

    it('should call onOnline callback when online event fires', () => {
      window.dispatchEvent(new Event('online'));
      expect(onOnlineMock).toHaveBeenCalledTimes(1);
      expect(onOfflineMock).not.toHaveBeenCalled();
    });

    it('should call onOffline callback when offline event fires', () => {
      window.dispatchEvent(new Event('offline'));
      expect(onOfflineMock).toHaveBeenCalledTimes(1);
      expect(onOnlineMock).not.toHaveBeenCalled();
    });

    it('should remove event listeners on cleanup', () => {
      cleanup();
      
      window.dispatchEvent(new Event('online'));
      window.dispatchEvent(new Event('offline'));
      
      expect(onOnlineMock).not.toHaveBeenCalled();
      expect(onOfflineMock).not.toHaveBeenCalled();
    });

    it('should work without callbacks', () => {
      const cleanupNoCallbacks = setupNetworkListeners();
      
      // Should not throw
      expect(() => {
        window.dispatchEvent(new Event('online'));
        window.dispatchEvent(new Event('offline'));
      }).not.toThrow();
      
      cleanupNoCallbacks();
    });
  });

  describe('Service Worker Registration', () => {
    it('should detect if service workers are supported', () => {
      const isSupported = 'serviceWorker' in navigator;
      expect(typeof isSupported).toBe('boolean');
    });
  });

  describe('Cache API', () => {
    it('should detect if Cache API is supported', () => {
      const isSupported = 'caches' in window;
      expect(typeof isSupported).toBe('boolean');
    });
  });

  describe('Storage API', () => {
    it('should detect if Storage API is supported', () => {
      const isSupported = 'storage' in navigator;
      expect(typeof isSupported).toBe('boolean');
    });
  });
});
