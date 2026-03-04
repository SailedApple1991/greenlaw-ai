import { useState, useRef, useCallback } from "react";

const TICK_INTERVAL_MS = 70; // ~14fps, slow natural typing pace

/**
 * Typewriter hook that meters out received text character-by-character,
 * producing a smooth typing effect for streamed content.
 *
 * Key design: `finish()` does NOT instantly flush text. It marks the stream
 * as done and lets the animation run to completion, then calls `onDone`.
 * This prevents the streaming bubble from being replaced before users
 * can see the typewriter effect.
 */
export function useTypewriter() {
  const [displayedText, setDisplayedText] = useState("");
  const targetTextRef = useRef("");
  const displayIndexRef = useRef(0);
  const timerIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onDoneRef = useRef<(() => void) | null>(null);
  const isFinishedRef = useRef(false);

  const fireDoneCallback = useCallback(() => {
    if (isFinishedRef.current && onDoneRef.current) {
      const cb = onDoneRef.current;
      onDoneRef.current = null;
      cb();
    }
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIdRef.current !== null) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const target = targetTextRef.current;
    const currentIndex = displayIndexRef.current;

    if (currentIndex >= target.length) {
      stopTimer();
      fireDoneCallback();
      return;
    }

    const remaining = target.length - currentIndex;

    // Adaptive speed: character-by-character with catch-up for large buffers
    // At 50ms interval: 1 char = 20 chars/sec ≈ comfortable reading pace
    const charsPerTick =
      remaining > 2000 ? 6 : remaining > 800 ? 3 : remaining > 200 ? 2 : 1;

    const nextIndex = Math.min(currentIndex + charsPerTick, target.length);

    // No word/line boundary snapping — true character-by-character output

    displayIndexRef.current = nextIndex;
    setDisplayedText(target.slice(0, nextIndex));

    if (nextIndex >= target.length) {
      stopTimer();
      fireDoneCallback();
    }
  }, [stopTimer, fireDoneCallback]);

  const startAnimation = useCallback(() => {
    if (timerIdRef.current !== null) return; // already running
    if (displayIndexRef.current >= targetTextRef.current.length) {
      fireDoneCallback();
      return;
    }
    timerIdRef.current = setInterval(tick, TICK_INTERVAL_MS);
  }, [tick, fireDoneCallback]);

  /** Append a chunk of text to the typewriter queue */
  const append = useCallback(
    (chunk: string) => {
      targetTextRef.current += chunk;
      startAnimation();
    },
    [startAnimation],
  );

  /**
   * Signal that no more chunks will arrive. The animation continues
   * until all text is displayed, then `onDone` is called.
   */
  const finish = useCallback(
    (onDone: () => void) => {
      isFinishedRef.current = true;
      onDoneRef.current = onDone;

      // If animation already caught up, fire immediately
      if (displayIndexRef.current >= targetTextRef.current.length) {
        onDoneRef.current = null;
        onDone();
      } else {
        // Ensure animation is running to drain remaining text
        startAnimation();
      }
    },
    [startAnimation],
  );

  /** Force-flush all text instantly (used for errors / unmount) */
  const flush = useCallback(() => {
    stopTimer();
    isFinishedRef.current = true;
    const finalText = targetTextRef.current;
    displayIndexRef.current = finalText.length;
    setDisplayedText(finalText);
    if (onDoneRef.current) {
      const cb = onDoneRef.current;
      onDoneRef.current = null;
      cb();
    }
  }, [stopTimer]);

  /** Reset all state for a new message */
  const reset = useCallback(() => {
    stopTimer();
    targetTextRef.current = "";
    displayIndexRef.current = 0;
    isFinishedRef.current = false;
    onDoneRef.current = null;
    setDisplayedText("");
  }, [stopTimer]);

  return { displayedText, append, finish, flush, reset };
}
