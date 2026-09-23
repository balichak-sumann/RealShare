import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, PanResponder, PanResponderInstance } from 'react-native';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export function useInactivityTimer(
  isActive: boolean,
  onTimeout: () => void,
  timeoutMs: number = INACTIVITY_TIMEOUT
): PanResponderInstance | null {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundTimestampRef = useRef<number | null>(null);
  
  // Create PanResponder once
  const panResponderRef = useRef<PanResponderInstance | null>(null);

  if (!panResponderRef.current) {
    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        resetTimer();
        return false; // Don't block other touches
      },
      onMoveShouldSetPanResponderCapture: () => {
        resetTimer();
        return false;
      },
      onPanResponderTerminationRequest: () => true,
    });
  }

  const resetTimer = () => {
    if (!isActive) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, timeoutMs);
  };

  useEffect(() => {
    if (!isActive) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Initial set
    resetTimer();

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        backgroundTimestampRef.current = Date.now();
        // Clear timer so it doesn't wake the app up just to log out
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      } else if (nextAppState === 'active') {
        if (backgroundTimestampRef.current) {
          const timeInBackground = Date.now() - backgroundTimestampRef.current;
          if (timeInBackground >= timeoutMs) {
            onTimeout();
          } else {
            resetTimer(); // Resume timer
          }
        } else {
          resetTimer();
        }
      }
    });

    return () => {
      subscription.remove();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, onTimeout, timeoutMs]);

  return isActive ? panResponderRef.current : null;
}
