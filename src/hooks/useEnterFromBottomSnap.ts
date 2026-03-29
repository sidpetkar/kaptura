import { useState, useLayoutEffect, useRef } from 'react';

/**
 * When `cycleKey` changes (e.g. headline index), returns `true` for one frame pair so the
 * incoming slide can sit at translate-y-full with transition disabled, then `false` so it
 * animates up to translate-y-0. Avoids animating from -translate-y-full (exit position), which
 * looks like sliding down from the top.
 * Skips the first run so the initial slide appears without a bottom enter animation.
 */
export function useEnterFromBottomSnap(cycleKey: number): boolean {
  const [snap, setSnap] = useState(false);
  const first = useRef(true);
  const raf2Ref = useRef(0);

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    raf2Ref.current = 0;
    setSnap(true);
    const raf1 = requestAnimationFrame(() => {
      raf2Ref.current = requestAnimationFrame(() => {
        setSnap(false);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2Ref.current);
    };
  }, [cycleKey]);

  return snap;
}
