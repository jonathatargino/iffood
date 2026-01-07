import { useMemo, useSyncExternalStore } from "react";

type MaybeMatchMedia = ((query: string) => MediaQueryList) | null;

/**
 * Checks if the media query matches the current window size. Updates when the window size changes.
 * Example: useMediaQuery("(max-width: 768px)") or useMediaQuery("(min-width: 768px)")
 * @param query - The media query to check
 * @returns True if the media query matches the current window size, false otherwise
 */
export function useMediaQuery(query: string) {
  const matchMedia: MaybeMatchMedia = window ? window.matchMedia : null;

  const [subscribe, getSnapshot] = useMemo(() => {
    if (!matchMedia) {
      return [() => () => {}, () => false];
    }

    const mediaQueryList = matchMedia(query);

    return [
      (onStoreChange: () => void) => {
        mediaQueryList.addEventListener("change", onStoreChange);
        return () => {
          mediaQueryList.removeEventListener("change", onStoreChange);
        };
      },
      () => mediaQueryList.matches,
    ];
  }, [query, matchMedia]);

  const matches = useSyncExternalStore(subscribe, getSnapshot);
  return matches;
}
