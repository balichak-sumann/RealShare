import { useEffect, useRef } from 'react';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export function useInactivityTimer(
  isActive: boolean,
  onTimeout: () => void,
  timeoutMs: number = INACTIVITY_TIMEOUT
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const resetTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onTimeout();
      }, timeoutMs);
    };

    // Initial set
    resetTimer();

    const events = ['mousemove', 'keydown', 'wheel', 'DOMMouseScroll', 'mouseWheel', 'mousedown', 'touchstart', 'touchmove', 'MSPointerDown', 'MSPointerMove'];

    // Throttle the event listener so we don't clear/set timeouts thousands of times per second
    let lastExecution = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      // Only reset the timer at most once every 1 second
      if (now - lastExecution > 1000) {
        lastExecution = now;
        resetTimer();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [isActive, onTimeout, timeoutMs]);
}
