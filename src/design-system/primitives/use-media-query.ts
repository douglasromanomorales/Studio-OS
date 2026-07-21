"use client";

import * as React from "react";

/**
 * Utilitário genérico — não pertence só ao Shell. Nasce público porque, no momento
 * em que a Agenda precisou detectar viewport mobile, ficou claro que alcançar
 * `_shell-context` (interno) para isso seria errado — a necessidade é
 * transversal, não específica de layout. `ShellProvider` também passa a consumir
 * este hook, em vez de duplicar a própria lógica de `matchMedia`.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}
