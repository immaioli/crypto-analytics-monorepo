'use client';

import { useEffect, useState } from 'react';

/**
 * Observes a CSS media query and re-renders when its match state changes.
 *
 * SSR-safe: returns `false` on the server and the first client render,
 * then synchronizes with the real match state in an effect (avoids
 * hydration mismatches).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQueryList.addEventListener('change', handleChange);
    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}
