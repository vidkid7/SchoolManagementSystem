/**
 * Network Detection Tests
 * 
 * Tests for network detection utility
 */

import {
  getConnection,
  isSlowConnection,
  isDataSaverEnabled,
  getEffectiveConnectionType,
  getNetworkInfo,
} from '../networkDetection';

describe('networkDetection', () => {
  describe('getConnection', () => {
    it('should return undefined when Network Information API is not available', () => {
      const connection = getConnection();
      expect(connection).toBeUndefined();
    });
  });

  describe('isSlowConnection', () => {
    it('should return false when Network Information API is not available', () => {
      expect(isSlowConnection()).toBe(false);
    });

    it('should detect slow connection based on effectiveType', () => {
      // Mock navigator.connection
      const mockConnection = {
        effectiveType: '2g' as const,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };

      Object.defineProperty(navigator, 'connection', {
        value: mockConnection,
        configurable: true,
      });

      expect(isSlowConnection()).toBe(true);

      // Cleanup
      delete (navigator as any).connection;
    });

    it('should detect slow connection based on downlink', () => {
      const mockConnection = {
        downlink: 0.3, // Less than 0.5 Mbps
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };

      Object.defineProperty(navigator, 'connection', {
        value: mockConnection,
        configurable: true,
      });

      expect(isSlowConnection()).toBe(true);

      delete (navigator as any).connection;
    });

    it('should detect slow connection based on RTT', () => {
      const mockConnection = {
        rtt: 1500, // More than 1000ms
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };

      Object.defineProperty(navigator, 'connection', {
        value: mockConnection,
        configurable: true,
      });

      expect(isSlowConnection()).toBe(true);

      delete (navigator as any).connection;
    });
  });

  describe('isDataSaverEnabled', () => {
    it('should return false when Network Information API is not available', () => {
      expect(isDataSaverEnabled()).toBe(false);
    });

    it('should detect data saver mode', () => {
      const mockConnection = {
        saveData: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };

      Object.defineProperty(navigator, 'connection', {
        value: mockConnection,
        configurable: true,
      });

      expect(isDataSaverEnabled()).toBe(true);

      delete (navigator as any).connection;
    });
  });

  describe('getEffectiveConnectionType', () => {
    it('should return "unknown" when Network Information API is not available', () => {
      expect(getEffectiveConnectionType()).toBe('unknown');
    });

    it('should return effective connection type', () => {
      const mockConnection = {
        effectiveType: '4g' as const,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };

      Object.defineProperty(navigator, 'connection', {
        value: mockConnection,
        configurable: true,
      });

      expect(getEffectiveConnectionType()).toBe('4g');

      delete (navigator as any).connection;
    });
  });

  describe('getNetworkInfo', () => {
    it('should return default values when Network Information API is not available', () => {
      const info = getNetworkInfo();
      
      expect(info).toEqual({
        effectiveType: 'unknown',
        downlink: undefined,
        rtt: undefined,
        saveData: false,
        isSlowConnection: false,
      });
    });

    it('should return network information', () => {
      const mockConnection = {
        effectiveType: '3g' as const,
        downlink: 2.5,
        rtt: 300,
        saveData: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };

      Object.defineProperty(navigator, 'connection', {
        value: mockConnection,
        configurable: true,
      });

      const info = getNetworkInfo();
      
      expect(info.effectiveType).toBe('3g');
      expect(info.downlink).toBe(2.5);
      expect(info.rtt).toBe(300);
      expect(info.saveData).toBe(false);
      expect(info.isSlowConnection).toBe(false);

      delete (navigator as any).connection;
    });
  });
});
