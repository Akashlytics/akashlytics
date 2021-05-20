import React, { createContext, useContext, useMemo } from "react";
import useMedia from "use-media";

export const MediaQueryContext = createContext(null);

const mediaQueries = {
  phone: "(max-width: 480px)",
  mobile: "(max-width: 767px)",
  small: "(max-width: 991px)",
  prefersReducedMotion: "(prefers-reduced-motion: reduce)",
};

export function MediaQueryProvider({ children }) {
  const phoneView = useMedia(mediaQueries.phone);
  const mobileView = useMedia(mediaQueries.mobile);
  const smallScreen = useMedia(mediaQueries.small);
  const prefersReducedMotion = useMedia(mediaQueries.prefersReducedMotion);
  const value = useMemo(() => ({ mobileView, prefersReducedMotion, smallScreen, phoneView }), [
    mobileView,
    prefersReducedMotion,
    smallScreen,
    phoneView,
  ]);

  return <MediaQueryContext.Provider value={value}>{children}</MediaQueryContext.Provider>;
}

export function useMediaQueryContext() {
  return useContext(MediaQueryContext);
}
