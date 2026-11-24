import { useEffect, useRef } from 'react';

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

/**
 * Calls `onIdle` once after `idleMs` with no user input while `enabled`.
 * Intended for shared waiting-room tablets: hands the next patient a fresh
 * title screen instead of the previous player's game.
 */
export function useIdleReturn(enabled: boolean, idleMs: number, onIdle: () => void): void {
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    if (!enabled) return;

    let timeoutId = window.setTimeout(() => onIdleRef.current(), idleMs);
    const reset = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => onIdleRef.current(), idleMs);
    };

    ACTIVITY_EVENTS.forEach((type) => window.addEventListener(type, reset, { passive: true }));
    return () => {
      window.clearTimeout(timeoutId);
      ACTIVITY_EVENTS.forEach((type) => window.removeEventListener(type, reset));
    };
  }, [enabled, idleMs]);
}
