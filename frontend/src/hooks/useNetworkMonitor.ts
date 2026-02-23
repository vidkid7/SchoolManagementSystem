/**
 * Network Monitor Hook
 * 
 * Monitors network changes and updates Redux store
 */

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateNetworkInfo } from '../store/slices/liteModeSlice';
import { getNetworkInfo, addNetworkChangeListener } from '../utils/networkDetection';

/**
 * Hook to monitor network changes
 */
export function useNetworkMonitor() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Initial network info
    const info = getNetworkInfo();
    dispatch(
      updateNetworkInfo({
        isSlowConnection: info.isSlowConnection,
        effectiveConnectionType: info.effectiveType,
      })
    );

    // Listen for network changes
    const cleanup = addNetworkChangeListener(() => {
      const updatedInfo = getNetworkInfo();
      dispatch(
        updateNetworkInfo({
          isSlowConnection: updatedInfo.isSlowConnection,
          effectiveConnectionType: updatedInfo.effectiveType,
        })
      );
    });

    return cleanup;
  }, [dispatch]);
}
