"use client";

import * as React from "react";

/**
 * Extraído durante o Domain Validation Report de Clientes: o debounce de busca do
 * módulo (setTimeout, 250ms) duplicava exatamente a lógica que `Combobox.onSearch`
 * já tinha internamente. Duplicação real entre módulo e plataforma — não é só
 * duplicação dentro da plataforma, mas o princípio de extração é o mesmo.
 */
export function useDebouncedCallback<Args extends unknown[]>(callback: (...args: Args) => void, delayMs = 250) {
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  return React.useCallback(
    (...args: Args) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callbackRef.current(...args), delayMs);
    },
    [delayMs]
  );
}
