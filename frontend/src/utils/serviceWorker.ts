/**
 * Service Worker Utilities
 * Handles PWA registration, offline queue, and sync status
 */

export interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  errors: string[];
}

export interface OfflineQueueItem {
  id: string;
  url: string;
  method: string;
  body: any;
  headers: Record<string, string>;
  timestamp: Date;
  retryCount: number;
}

/**
 * Register service worker and handle updates
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('New service worker available. Refresh to update.');
              
              // Notify user about update
              if (window.confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  console.warn('Service Workers are not supported in this browser');
  return null;
}

/**
 * Unregister service worker (for development/testing)
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      return await registration.unregister();
    }
  }
  return false;
}

/**
 * Check if the app is currently online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Get sync status from service worker
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  const defaultStatus: SyncStatus = {
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    errors: []
  };

  if (!('serviceWorker' in navigator)) {
    return defaultStatus;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration || !registration.active) {
      return defaultStatus;
    }

    // Request sync status from service worker
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'SYNC_STATUS') {
          resolve(event.data.status);
        } else {
          resolve(defaultStatus);
        }
      };

if (registration.active) {
        registration.active.postMessage(
          { type: 'GET_SYNC_STATUS' },
          [messageChannel.port2]
        );
      } else {
        resolve(defaultStatus);
      }

      // Timeout after 2 seconds
      setTimeout(() => resolve(defaultStatus), 2000);
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    return defaultStatus;
  }
}

/**
 * Trigger manual sync
 */
export async function triggerSync(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration || !registration.active) {
      return false;
    }

    registration.active.postMessage({ type: 'TRIGGER_SYNC' });
    return true;
  } catch (error) {
    console.error('Error triggering sync:', error);
    return false;
  }
}

/**
 * Clear all caches (for development/testing)
 */
export async function clearAllCaches(): Promise<void> {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('All caches cleared');
  }
}

/**
 * Get cache storage usage
 */
export async function getCacheStorageUsage(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;

    return {
      usage,
      quota,
      percentage
    };
  }

  return {
    usage: 0,
    quota: 0,
    percentage: 0
  };
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Setup online/offline event listeners
 */
export function setupNetworkListeners(
  onOnline?: () => void,
  onOffline?: () => void
): () => void {
  const handleOnline = () => {
    console.log('Network: Online');
    if (onOnline) onOnline();
  };

  const handleOffline = () => {
    console.log('Network: Offline');
    if (onOffline) onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Check if a specific cache exists
 */
export async function cacheExists(cacheName: string): Promise<boolean> {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    return cacheNames.includes(cacheName);
  }
  return false;
}

/**
 * Get all cached URLs from a specific cache
 */
export async function getCachedUrls(cacheName: string): Promise<string[]> {
  if ('caches' in window) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    return requests.map(request => request.url);
  }
  return [];
}
