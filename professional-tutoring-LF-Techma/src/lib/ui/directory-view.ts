"use client";

import { useEffect, useState } from "react";

export type DirectoryView = "table" | "cards";

export function useDirectoryView(storageKey: string, defaultView: DirectoryView = "table") {
  const [view, setViewState] = useState<DirectoryView>(defaultView);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === "table" || stored === "cards") {
        setViewState(stored);
      }
    } catch {
      // ignore storage failures
    }
  }, [storageKey]);

  function setView(next: DirectoryView) {
    setViewState(next);
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {
      // ignore storage failures
    }
  }

  return { view, setView };
}
