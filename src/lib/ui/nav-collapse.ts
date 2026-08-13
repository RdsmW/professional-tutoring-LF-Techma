"use client";

import { useEffect, useState } from "react";

export function useNavCollapsed(storageKey: string) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(storageKey) === "1");
    } catch {
      // ignore storage failures
    }
  }, [storageKey]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(storageKey, next ? "1" : "0");
      } catch {
        // ignore storage failures
      }
      return next;
    });
  }

  return { collapsed, toggleCollapsed };
}

const PLACEHOLDER_DISPLAY_NAMES = new Set([
  "staff",
  "staff member",
  "family",
  "parent",
  "guardian",
  "parent guardian",
]);

export function isPlaceholderDisplayName(name: string | null | undefined) {
  if (!name) return true;
  const trimmed = name.trim();
  if (!trimmed) return true;
  return PLACEHOLDER_DISPLAY_NAMES.has(trimmed.toLowerCase());
}
