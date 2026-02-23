/**
 * Network Detection Utility
 * 
 * Detects network connection speed and quality
 * Supports Network Information API with fallback
 */

export type ConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
export type EffectiveConnectionType = 'slow-2g' | '2g' | '3g' | '4g';

interface NetworkInformation extends EventTarget {
  effectiveType?: EffectiveConnectionType;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

/**
 * Get the network connection object
 */
export function getConnection(): NetworkInformation | undefined {
  const nav = navigator as NavigatorWithConnection;
  return nav.connection || nav.mozConnection || nav.webkitConnection;
}

/**
 * Check if the connection is slow (2G or slower)
 */
export function isSlowConnection(): boolean {
  const connection = getConnection();
  
  if (!connection) {
    // Fallback: check if user has enabled data saver
    return false;
  }

  // Check effective connection type
  if (connection.effectiveType) {
    return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
  }

  // Check downlink speed (Mbps)
  if (connection.downlink !== undefined) {
    return connection.downlink < 0.5; // Less than 500 Kbps
  }

  // Check RTT (Round Trip Time in ms)
  if (connection.rtt !== undefined) {
    return connection.rtt > 1000; // More than 1 second
  }

  return false;
}

/**
 * Check if user has enabled data saver mode
 */
export function isDataSaverEnabled(): boolean {
  const connection = getConnection();
  return connection?.saveData === true;
}

/**
 * Get the effective connection type
 */
export function getEffectiveConnectionType(): ConnectionType {
  const connection = getConnection();
  
  if (!connection || !connection.effectiveType) {
    return 'unknown';
  }

  return connection.effectiveType;
}

/**
 * Get network information
 */
export function getNetworkInfo() {
  const connection = getConnection();
  
  if (!connection) {
    return {
      effectiveType: 'unknown' as ConnectionType,
      downlink: undefined,
      rtt: undefined,
      saveData: false,
      isSlowConnection: false,
    };
  }

  return {
    effectiveType: (connection.effectiveType || 'unknown') as ConnectionType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData || false,
    isSlowConnection: isSlowConnection(),
  };
}

/**
 * Add listener for network changes
 */
export function addNetworkChangeListener(callback: () => void): () => void {
  const connection = getConnection();
  
  if (!connection) {
    return () => {}; // No-op cleanup
  }

  connection.addEventListener('change', callback);
  
  // Return cleanup function
  return () => {
    connection.removeEventListener('change', callback);
  };
}
