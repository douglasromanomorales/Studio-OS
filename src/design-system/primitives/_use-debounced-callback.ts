"use client";

import * as React from "react";

export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs = 250
) {
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;

  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  return React.useCallback(
    (...args: Args) => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delayMs);
    },
    [delayMs]
  );
}