import { useEffect, useRef, useState } from 'react';

interface UseCountdownOptions {
  /** Total duration in seconds */
  durationSec: number;
  /** Whether the countdown is currently running */
  active: boolean;
  /** Temporarily freezes countdown progress without resetting */
  paused?: boolean;
  /** UI refresh interval in milliseconds (default: 100ms) */
  tickMs?: number;
  /** Invoked once when the countdown reaches 0 */
  onComplete?: () => void;
}

/**
 * Timestamp-based countdown hook immune to floating-point drift and tab throttling.
 * Returns remaining and elapsed seconds along with a 0-100 remaining percentage.
 */
export function useCountdown({
  durationSec,
  active,
  paused = false,
  tickMs = 100,
  onComplete,
}: UseCountdownOptions): {
  remainingSec: number;
  elapsedSec: number;
  remainingPct: number;
} {
  const [remainingSec, setRemainingSec] = useState(durationSec);
  const remainingRef = useRef(durationSec);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!active) {
      remainingRef.current = durationSec;
      setRemainingSec(durationSec);
    }
  }, [active, durationSec]);

  useEffect(() => {
    if (!active || paused) {
      return;
    }

    const startMs = Math.max(0, remainingRef.current * 1000);
    const deadline = Date.now() + startMs;
    let completed = false;

    const intervalId = window.setInterval(() => {
      const leftMs = Math.max(0, deadline - Date.now());
      const leftSec = leftMs / 1000;
      remainingRef.current = leftSec;
      setRemainingSec(leftSec);

      if (leftMs <= 0 && !completed) {
        completed = true;
        window.clearInterval(intervalId);
        onCompleteRef.current?.();
      }
    }, tickMs);

    return () => window.clearInterval(intervalId);
  }, [active, paused, tickMs]);

  const elapsedSec = Math.max(0, durationSec - remainingSec);
  const remainingPct =
    durationSec > 0 ? Math.max(0, Math.min(100, (remainingSec / durationSec) * 100)) : 0;

  return { remainingSec, elapsedSec, remainingPct };
}
