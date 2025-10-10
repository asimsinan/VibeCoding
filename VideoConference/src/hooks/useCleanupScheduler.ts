/**
 * Cleanup Scheduler Hook
 * Automatically calls the cleanup endpoint every 30 seconds to remove stale participants
 */

import { useEffect } from 'react';

export const useCleanupScheduler = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    // Initial cleanup
    const runCleanup = async () => {
      try {
        await fetch('/api/cleanup/participants', {
          method: 'POST',
        });
      } catch (error) {
        console.error('Cleanup failed:', error);
      }
    };

    // Run immediately
    runCleanup();

    // Run every 30 seconds
    const interval = setInterval(() => {
      runCleanup();
    }, 30000); // 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [enabled]);
};
