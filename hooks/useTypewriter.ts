import { useState, useRef, useCallback } from "react";

/**
 * Typewriter hook that meters out received text at a controlled rate,
 * producing a smooth word-by-word rendering effect for streamed content.
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
  const rafIdRef = useRef<number | null>(null);
  const onDoneRef = useRef<(() => void) | null>(null);
  const isFinishedRef = useRef(false);

  const tick = useCallback(() => {
    const target = targetTextRef.current;
    const currentIndex = displayIndexRef.current;

    if (currentIndex >= target.length) {
      rafIdRef.current = null;
      // Animation caught up to target — if stream is finished, fire callback
      if (isFinishedRef.current && onDoneRef.current) {
        const cb = onDoneRef.current;
        onDoneRef.current = null;
        cb();
      }
      return;
    }

    const remaining = target.length - currentIndex;

    // Adaptive speed: larger buffer → faster advancement
    // At 60fps, 12 chars/frame ≈ 720 chars/sec for large bursts
    const charsPerFrame =
      remaining > 500 ? 24 : remaining > 200 ? 12 : remaining > 50 ? 6 : 3;

    let nextIndex = Math.min(currentIndex + charsPerFrame, target.length);

    // Advance to next word boundary (space, newline) for smooth reading
    if (nextIndex < target.length) {
      const searchEnd = Math.min(nextIndex + 20, target.length);
      for (let i = nextIndex; i < searchEnd; i++) {
        const char = target[i];
        if (char === " " || char === "\n") {
          nextIndex = i + 1;
          break;
        }
      }
    }

    displayIndexRef.current = nextIndex;
    setDisplayedText(target.slice(0, nextIndex));

    if (nextIndex < target.length) {
      rafIdRef.current = requestAnimationFrame(tick);
    } else {
      rafIdRef.current = null;
      // Reached the end — if stream is finished, fire callback
      if (isFinishedRef.current && onDoneRef.current) {
        const cb = onDoneRef.current;
        onDoneRef.current = null;
        cb();
      }
    }
  }, []);

  const startAnimation = useCallback(() => {
    if (rafIdRef.current === null && !isFinishedRef.current) {
      rafIdRef.current = requestAnimationFrame(tick);
    }
    // If finished but animation stopped (e.g. target grew after finish),
    // restart to drain remaining text
    if (rafIdRef.current === null && isFinishedRef.current) {
      if (displayIndexRef.current < targetTextRef.current.length) {
        rafIdRef.current = requestAnimationFrame(tick);
      }
    }
  }, [tick]);

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
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    isFinishedRef.current = true;
    const finalText = targetTextRef.current;
    displayIndexRef.current = finalText.length;
    setDisplayedText(finalText);
    if (onDoneRef.current) {
      const cb = onDoneRef.current;
      onDoneRef.current = null;
      cb();
    }
  }, []);

  /** Reset all state for a new message */
  const reset = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    targetTextRef.current = "";
    displayIndexRef.current = 0;
    isFinishedRef.current = false;
    onDoneRef.current = null;
    setDisplayedText("");
  }, []);

  return { displayedText, append, finish, flush, reset };
}
