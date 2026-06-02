"use client";

import { useEffect } from "react";

/**
 * Re-run `callback` whenever the page is shown again — tab focus, bfcache
 * restore (back/forward), or visibility change. This keeps client-fetched data
 * (e.g. dashboard stats) fresh after the user creates/edits data on another
 * page and returns. Pass a stable callback (useCallback).
 */
export function useRevalidate(callback: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const cb = () => callback();
    const onVisible = () => {
      if (document.visibilityState === "visible") callback();
    };
    window.addEventListener("focus", cb);
    window.addEventListener("pageshow", cb);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", cb);
      window.removeEventListener("pageshow", cb);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [callback, enabled]);
}
