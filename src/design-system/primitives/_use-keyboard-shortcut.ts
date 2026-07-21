"use client";

import * as React from "react";

/**
 * `CommandPalette` (Onda 4) já tinha um listener de teclado inline para ⌘K. O
 * Workspace precisa de um segundo (⌘B para colapsar a Sidebar, como VS Code/Linear)
 * — duplicação real, não hipotética, a partir do segundo consumidor. Extraído aqui.
 */
export function useKeyboardShortcut(key: string, callback: () => void, options?: { modifier?: "meta" | "ctrl" }) {
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const modifierPressed = options?.modifier === "ctrl" ? e.ctrlKey : e.metaKey || e.ctrlKey;
      if (e.key.toLowerCase() === key.toLowerCase() && modifierPressed) {
        e.preventDefault();
        callbackRef.current();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [key, options?.modifier]);
}
