/**
 * OfflineIndicator Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OfflineIndicator } from '../OfflineIndicator';
import * as usePWAHook from '@/hooks/usePWA';

// Mock the usePWA hook
jest.mock('@/hooks/usePWA');

describe('OfflineIndicator Component', () => {
  const mockTriggerManualSync = jest.fn();
  const mockRefreshSyncStatus = jest.fn();
  const mockRefreshCacheUsage = jest.fn();

  const defaultPWAState = {
    isOnline: true,
    isInstalled: false,
    syncStatus: {
      isSyncing: false,
      pendingCount: 0,
      lastSyncTime: null,
      errors: []
    },
    cacheUsage: {
      usage: 0,
      quota: 0,
      percentage: 0
    }
  };

  const defaultPWAActions = {
    triggerManualSync: mockTriggerManualSync,
    refreshSyncStatus: mockRefreshSyncStatus,
    refreshCacheUsage: mockRefreshCacheUsage
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePWAHook.usePWA as jest.Mock).mockReturnValue([
      defaultPWAState,
      defaultPWAActions
    ]);
  });

  it('should render without crashing', () => {
    render(<OfflineIndicator />);
  });

  it('should show offline chip when offline', () => {
    (usePWAHook.usePWA as jest.Mock).mockReturnValue([
      { ...defaultPWAState, isOnline: false },
      defaultPWAActions
    ]);

    render(<OfflineIndicator />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('should not show offline chip when online', () => {
    render(<OfflineIndicator />);
    expect(screen.queryByText('Offline')).not.toBeInTheDocument();
  });

  it('should show sync button when there are pending items', () => {
    (usePWAHook.usePWA as jest.Mock).mockReturnValue([
      {
        ...defaultPWAState,
        syncStatus: {
          ...defaultPWAState.syncStatus,
          pendingCount: 5
        }
      },
      defaultPWAActions
    ]);

    render(<OfflineIndicator />);
    const syncButton = screen.getByRole('button');
    expect(syncButton).toBeInTheDocument();
  });

  it('should trigger sync when sync button is clicked', async () => {
    const user = userEvent.setup();
    
    (usePWAHook.usePWA as jest.Mock).mockReturnValue([
      {
        ...defaultPWAState,
        syncStatus: {
          ...defaultPWAState.syncStatus,
          pendingCount: 3
        }
      },
      defaultPWAActions
    ]);

    render(<OfflineIndicator />);
    const syncButton = screen.getByRole('button');
    
    await user.click(syncButton);
    expect(mockTriggerManualSync).toHaveBeenCalled();
  });

  it('should disable sync button when syncing', () => {
    (usePWAHook.usePWA as jest.Mock).mockReturnValue([
      {
        ...defaultPWAState,
        syncStatus: {
          ...defaultPWAState.syncStatus,
          isSyncing: true,
          pendingCount: 3
        }
      },
      defaultPWAActions
    ]);

    render(<OfflineIndicator />);
    const syncButton = screen.getByRole('button');
    expect(syncButton).toBeDisabled();
  });

  it('should disable sync button when offline', () => {
    (usePWAHook.usePWA as jest.Mock).mockReturnValue([
      {
        ...defaultPWAState,
        isOnline: false,
        syncStatus: {
          ...defaultPWAState.syncStatus,
          pendingCount: 3
        }
      },
      defaultPWAActions
    ]);

    render(<OfflineIndicator />);
    const syncButton = screen.getByRole('button');
    expect(syncButton).toBeDisabled();
  });

  it('should show offline alert when going offline', async () => {
    const { rerender } = render(<OfflineIndicator />);

    // Simulate going offline
    (usePWAHook.usePWA as jest.Mock).mockReturnValue([
      { ...defaultPWAState, isOnline: false },
      defaultPWAActions
    ]);

    rerender(<OfflineIndicator />);

    await waitFor(() => {
      expect(screen.getByText(/You are offline/i)).toBeInTheDocument();
    });
  });

  it('should show online alert when coming back online', async () => {
    // Start offline
    (usePWAHook.usePWA as jest.Mock).mockReturnValue([
      { ...defaultPWAState, isOnline: false },
      defaultPWAActions
    ]);

    const { rerender } = render(<OfflineIndicator />);

    // Go online
    (usePWAHook.usePWA as jest.Mock).mockReturnValue([
      { ...defaultPWAState, isOnline: true },
      defaultPWAActions
    ]);

    rerender(<OfflineIndicator />);

    await waitFor(() => {
      expect(screen.getByText(/You are back online/i)).toBeInTheDocument();
    });
  });

  it('should show sync errors', () => {
    (usePWAHook.usePWA as jest.Mock).mockReturnValue([
      {
        ...defaultPWAState,
        syncStatus: {
          ...defaultPWAState.syncStatus,
          errors: ['Network error']
        }
      },
      defaultPWAActions
    ]);

    render(<OfflineIndicator />);
    expect(screen.getByText(/Sync failed/i)).toBeInTheDocument();
  });

  it('should show loading indicator when syncing', () => {
    (usePWAHook.usePWA as jest.Mock).mockReturnValue([
      {
        ...defaultPWAState,
        syncStatus: {
          ...defaultPWAState.syncStatus,
          isSyncing: true,
          pendingCount: 2
        }
      },
      defaultPWAActions
    ]);

    render(<OfflineIndicator />);
    const progressIndicator = screen.getByRole('progressbar');
    expect(progressIndicator).toBeInTheDocument();
  });
});
