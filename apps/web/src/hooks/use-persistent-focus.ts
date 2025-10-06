import { useEffect } from "react";

/**
 * Persistently focuses a ref'd element after mount or state changes that may steal focus
 * (e.g. closing dropdowns, opening collapsibles, animations).
 *
 * Strategy:
 * 1. Queue several requestAnimationFrame passes.
 * 2. Queue a few timed retries (covers late focus restoration).
 *
 * Options let you tune attempts & timeouts. Safe to call often; it auto‑cleans.
 */
export interface PersistentFocusOptions {
  enabled?: boolean; // Whether focusing should run (dependency you control)
  select?: boolean; // Select text content after focus
  attempts?: number; // Number of RAF passes (default 2)
  timeouts?: number[]; // Millisecond delays for retry (default [30, 90, 160])
  onFocused?: () => void; // Callback after first successful focus
}

export function usePersistentFocus<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  {
    enabled = true,
    select = true,
    attempts = 2,
    timeouts = [30, 90, 160],
    onFocused,
  }: PersistentFocusOptions = {},
) {
  useEffect(() => {
    if (!enabled) return;

    let focusedOnce = false;
    const cleanup: Array<() => void> = [];

    const attempt = () => {
      const el = ref.current;
      if (!el) return;
      if (document.activeElement !== el) {
        el.focus();
        if (select && "select" in el) {
          try {
            // @ts-expect-error - not all elements implement select()
            el.select?.();
          } catch {
            /* ignore */
          }
        }
        if (!focusedOnce) {
          focusedOnce = true;
          onFocused?.();
        }
      }
    };

    // rAF passes
    let lastRaf: number | null = null;
    for (let i = 0; i < attempts; i++) {
      lastRaf = requestAnimationFrame(() => attempt());
      cleanup.push(() => {
        if (lastRaf) cancelAnimationFrame(lastRaf);
      });
    }

    // timed retries
    timeouts.forEach((ms) => {
      const t = setTimeout(attempt, ms);
      cleanup.push(() => clearTimeout(t));
    });

    return () => {
      cleanup.forEach((fn) => {
        fn();
      });
    };
  }, [enabled, attempts, timeouts, select, onFocused, ref]);
}
