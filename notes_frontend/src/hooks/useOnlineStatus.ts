'use client';

/**
 * useOnlineStatus - Custom hook for detecting online/offline network status.
 * Returns current connectivity state for the offline mode indicator.
 */

import { useState, useEffect } from 'react';

// PUBLIC_INTERFACE
/**
 * Hook that tracks the browser's online/offline status.
 * @returns boolean indicating if the browser is currently online
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
