/**
 * usePWA Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePWA } from '../usePWA';
import * as serviceWorkerUtils from '@utils/serviceWorker';

// Mock service worker utilities
jest.mock('@utils/serviceWorker', () => ({
  isOnline: jest.fn(() => true),
  getSyncStatus: jest.fn(() => Promise.resolve({
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    errors: []
  })),
  triggerSync: jest.fn(() => Promise.resolve(true)),
  setupNetworkListeners: jest.fn(() => jest.fn()),
  getCacheStorageUsage: jest.fn(() => Promise.resolve({
    usage: 1024000,
    quota: 10240000,
    percentage: 10
  }))
}));

describe('usePWA Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', async () => {
    const { result } = renderHook(() => usePWA());
    const [state] = result.current;

    expect(state.isOnline).toBe(true);
    expect(state.isInstalled).toBe(false);
    expect(state.syncStatus.isSyncing).toBe(false);
    expect(state.syncStatus.pendingCount).toBe(0);
  });

  it('should setup network listeners on mount', () => {
    renderHook(() => usePWA());
    expect(serviceWorkerUtils.setupNetworkListeners).toHaveBeenCalled();
  });

  it('should fetch sync status on mount', async () => {
    renderHook(() => usePWA());
    
    await waitFor(() => {
      expect(serviceWorkerUtils.getSyncStatus).toHaveBeenCalled();
    });
  });

  it('should fetch cache usage on mount', async () => {
    renderHook(() => usePWA());
    
    await waitFor(() => {
      expect(serviceWorkerUtils.getCacheStorageUsage).toHaveBeenCalled();
    });
  });

  it('should trigger manual sync', async () => {
    const { result } = renderHook(() => usePWA());
    const [, actions] = result.current;

    await act(async () => {
      const success = await actions.triggerManualSync();
      expect(success).toBe(true);
    });

    expect(serviceWorkerUtils.triggerSync).toHaveBeenCalled();
  });

  it('should refresh sync status', async () => {
    const mockSyncStatus = {
      isSyncing: true,
      pendingCount: 5,
      lastSyncTime: new Date(),
      errors: []
    };

    (serviceWorkerUtils.getSyncStatus as jest.Mock).mockResolvedValue(mockSyncStatus);

    const { result } = renderHook(() => usePWA());
    const [, actions] = result.current;

    await act(async () => {
      await actions.refreshSyncStatus();
    });

    await waitFor(() => {
      const [state] = result.current;
      expect(state.syncStatus.isSyncing).toBe(true);
      expect(state.syncStatus.pendingCount).toBe(5);
    });
  });

  it('should refresh cache usage', async () => {
    const mockCacheUsage = {
      usage: 2048000,
      quota: 10240000,
      percentage: 20
    };

    (serviceWorkerUtils.getCacheStorageUsage as jest.Mock).mockResolvedValue(mockCacheUsage);

    const { result } = renderHook(() => usePWA());
    const [, actions] = result.current;

    await act(async () => {
      await actions.refreshCacheUsage();
    });

    await waitFor(() => {
      const [state] = result.current;
      expect(state.cacheUsage.usage).toBe(2048000);
      expect(state.cacheUsage.percentage).toBe(20);
    });
  });

  it('should detect PWA installation on standalone mode', () => {
    // Mock matchMedia for standalone mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const { result } = renderHook(() => usePWA());
    const [state] = result.current;

    expect(state.isInstalled).toBe(true);
  });

  it('should handle offline state', () => {
    (serviceWorkerUtils.isOnline as jest.Mock).mockReturnValue(false);

    const { result } = renderHook(() => usePWA());
    const [state] = result.current;

    expect(state.isOnline).toBe(false);
  });

  it('should cleanup on unmount', () => {
    const cleanupMock = jest.fn();
    (serviceWorkerUtils.setupNetworkListeners as jest.Mock).mockReturnValue(cleanupMock);

    const { unmount } = renderHook(() => usePWA());
    unmount();

    expect(cleanupMock).toHaveBeenCalled();
  });
});
